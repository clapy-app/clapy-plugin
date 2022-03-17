import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

const logger = new Logger('AllExceptionsFilter');

export function cleanErrorMessage(error: any, response: any = null, exception: any = null) {
  let errorMessage = error?.message || response?.message || exception?.message;
  if (error?.key === 'ELEMENT_NOT_FOUND') {
    errorMessage = `${error.message}: ${error.title}`;
  }

  return errorMessage;
}

export function handleException(exception: any, response: any = null): any {
  const resp = exception?.response || exception;
  const error = resp?.data || resp?.error || exception?.message || exception;
  // if (error?.error) {
  //   error = error.error;
  // }
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : resp?.status ||
        exception?.code ||
        exception?.statusCode ||
        error.statusCode ||
        HttpStatus.INTERNAL_SERVER_ERROR;

  let errorMessage = cleanErrorMessage(error, response, exception);
  if (error?.key === 'ELEMENT_NOT_FOUND') {
    errorMessage = `${error.message}: ${error.title}`;
  }

  const parentStack = error?.parentStack || response?.parentStack || exception?.parentStack;

  const errors = resp?.errors;
  if (status !== 404 && status !== 401 && (status !== 400 || !Array.isArray(errors))) {
    logger.error('Global filter error:');
    if (exception.isAirtable) {
      logger.error('Airtable error');
    }

    if (parentStack) {
      // tslint:disable-next-line:no-console
      console.error(parentStack);
    }

    // Error objects are not well logged by logger.error, so we prefer console.error here.
    // tslint:disable-next-line:no-console
    console.error((typeof error === 'string' && exception?.stack) || error);

    if (errorMessage) {
      logger.error(errorMessage);
    }
  }

  return { error, errors, status };
}

@Catch()
export class UnknownExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const { error, errors, status } = handleException(exception, response);

    response.status(status).json({
      statusCode: status,
      path: request.url,
      error: error?.message || error,
      errors,
    });
  }
}
