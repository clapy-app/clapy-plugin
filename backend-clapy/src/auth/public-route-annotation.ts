import { SetMetadata } from '@nestjs/common';

/**
 * Disable the authorization check on the tagged controller or method.
 *
 * @example Usage on a class
 * ```ts
 * @Controller()
 * @PublicRoute()
 * export class AppController {
 *
 *   @Get()
 *   root() {
 *     return { message: 'Hello world!' };
 *   }
 *
 * }
 * ```
 *
 * @example Usage on a method
 * ```ts
 * @Controller()
 * export class AppController {
 *
 *   @Get()
 *   @PublicRoute()
 *   root() {
 *     return { message: 'Hello world!' };
 *   }
 *
 * }
 * ```
 */
export function PublicRoute() {
  return SetMetadata('allowUnauthorizedRequest', true);
}
