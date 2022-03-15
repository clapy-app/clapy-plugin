import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { env } from '../environment/env';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly reflector: Reflector = new Reflector();

  canActivate(context: ExecutionContext): boolean {
    const isBrowserGet: boolean =
      // To read @PublicRoute() on the method
      this.reflector.get('isBrowserGet', context.getHandler())
      // To read @PublicRoute() on the controller class
      || this.reflector.get('isBrowserGet', context.getClass());
    // If one of them is true, the call is considered to be possible from the browser, so the custom header check should be skipped.

    if (isBrowserGet) {
      return true;
    }
    // If I need GraphQL/HTTP context
    // https://stackoverflow.com/questions/58497740/nestjs-context-swithtohttp-getrequest-returns-undefined
    // const gqlContext = GqlExecutionContext.create(context);
    const req = context.switchToHttp().getRequest<Request>();
    if (!req) {
      // Disable CORS check for websocket requests since they don't contain HTTP headers. For CSRF,
      // we rely on authentication and origin check (CORS)
      return true;
    }
    const { headers } = req;
    return headers['x-requested-by'] === env.securityRequestedByHeader;
  }
}
