import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import type { GetVerificationKey } from 'jwks-rsa';
import jwks from 'jwks-rsa';

import { env } from '../env-and-config/env.js';

const jwtMiddleware = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${env.auth0Domain}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  audience: env.auth0Audience,
  issuer: `https://${env.auth0Domain}/`,
  algorithms: ['RS256'],
});

async function hasValidationError(req: Request, res: Response) {
  return new Promise<any>((resolve /* , reject */) => {
    jwtMiddleware(req, res, (error: any) => {
      if (error) resolve(error);
      else resolve(undefined);
    });
  });
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req: Request = http.getRequest();
    const res: Response = http.getResponse();
    const allowUnauthorizedRequest: boolean =
      // To read @PublicRoute() on the method
      this.reflector.get('allowUnauthorizedRequest', context.getHandler()) ||
      // To read @PublicRoute() on the controller class
      this.reflector.get('allowUnauthorizedRequest', context.getClass());
    // If one of them is true, the call is considered public.

    if (allowUnauthorizedRequest) return true;

    // If not public, the user must be authorized. Let's validate the request using express-jwt:
    const validationError = await hasValidationError(req, res);

    if (validationError?.status === 401) {
      throw new UnauthorizedException();
    }

    // For other unexpected errors, let's log for now. Once identified, we should handle those errors as we do above for 401.
    // https://docs.nestjs.com/guards#putting-it-all-together
    if (validationError) {
      console.error('Validation error:', validationError);
    }

    return !validationError;
  }
}
