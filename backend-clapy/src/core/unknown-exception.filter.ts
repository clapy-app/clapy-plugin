import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { AxiosError } from 'axios';
import type { Request } from 'express';
import type { MyGithubError } from '../features/github/octokit.js';

import type { AccessTokenDecoded } from '../features/user/user.utils.js';

const logger = new Logger('AllExceptionsFilter');

export function cleanErrorMessage(error: any, response: any = null, exception: any = null) {
  let errorMessage = error?.message || response?.message || exception?.message;
  if (error?.key === 'ELEMENT_NOT_FOUND') {
    errorMessage = `${error.message}: ${error.title}`;
  }

  return errorMessage;
}

function isGithubError(error: any) {
  return !!(error as MyGithubError).isGithub;
}

export function handleException(exception: any, response: any, user: AccessTokenDecoded | undefined): any {
  if (isGithubError(exception)) {
    return {
      error: exception,
      errors: undefined,
      status: 400,
      message: exception.message,
      githubStatus: exception.status || 500,
    };
  }

  const resp = exception?.response || exception;
  const error = resp?.data || resp?.error || exception?.message || exception;
  const userId = user?.sub;
  // if (error?.error) {
  //   error = error.error;
  // }
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : toNum(resp?.status) ||
        toNum(exception?.code) ||
        toNum(exception?.statusCode) ||
        toNum(error.statusCode) ||
        toNum(HttpStatus.INTERNAL_SERVER_ERROR) ||
        500;

  let errorMessage = cleanErrorMessage(error, response, exception);
  if (error?.key === 'ELEMENT_NOT_FOUND') {
    errorMessage = `${error.message}: ${error.title}`;
  }

  const parentStack = error?.parentStack || response?.parentStack || exception?.parentStack;

  const errors = resp?.errors;
  if (
    status !== 404 &&
    status !== 401 &&
    error?.error !== 'invalid_grant' /* status !== 403 */ &&
    (status !== 400 || !Array.isArray(errors))
  ) {
    logger.error('Global filter error:');

    if (parentStack) {
      // tslint:disable-next-line:no-console
      console.error(formatError(parentStack));
    }

    // Error objects are not well logged by logger.error, so we prefer console.error here.
    // Google Cloud also better recognizes standard error objects in stderr.
    const errToLog = (typeof error === 'string' && exception) /* ?.stack */ || error;
    if (userId) {
      if (errToLog?.message) {
        errToLog.message = `[userID: ${userId}] ${errToLog.message}`;
      } else {
        console.error(`[userID: ${userId}]`);
      }
    }
    console.error(formatError(errToLog));

    if (errorMessage) {
      logger.error(errorMessage);
    }
  }

  return { error, errors, status, message: errorMessage, githubStatus: undefined };
}

function formatError(error: any) {
  return isAxiosResponse(error)
    ? error.response?.data || error
    : isAxiosRequestTimeout(error)
    ? `${error.message} - ${error.config.method} ${error.config.url}${
        error.config.data && typeof error.config.data === 'object'
          ? ` - data keys: ${Object.keys(error.config.data)}`
          : ''
      }`
    : isAxiosErrWithRequest(error)
    ? `${error.message} - ${error.config.method} ${error.config.url}`
    : error;
}

function isAxiosResponse(error: any): error is AxiosError {
  return !!(error as AxiosError)?.response?.data;
}

function isAxiosErrWithRequest(error: any): error is AxiosError {
  return !!(error as AxiosError)?.request;
}

function isAxiosRequestTimeout(error: any): error is AxiosError {
  return (error as AxiosError)?.code === 'ETIMEDOUT';
}

@Catch()
export class UnknownExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    try {
      const req = ctx.getRequest<Request>();
      const user: AccessTokenDecoded | undefined = req.auth;

      const { error, errors, status, message, githubStatus } = handleException(exception, response, user);

      response.status(status).json({
        statusCode: status,
        path: req.url,
        error: error?.message || error,
        errors,
        message,
        githubStatus,
      });
    } catch (error) {
      console.error('Error while trying to send an error response. There is something wrong out there.');
      console.error(error);
      response.status(500).json({
        success: false,
      });
    }
  }
}

function toNum(value: any) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return undefined;
}
