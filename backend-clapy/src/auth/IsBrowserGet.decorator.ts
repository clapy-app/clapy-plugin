import { SetMetadata } from '@nestjs/common';

/**
 * Routes to call from the browser should be annotated with it to instruct the
 * CSRF guard not to expect a custom HTTP header (CSRF protection for other routes).
 */
export const IsBrowserGet = () => SetMetadata('isBrowserGet', true);
