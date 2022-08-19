import type { AccessTokenDecoded } from '../features/user/user.utils.js';
import type { Request } from 'express';

// declare global is required when we import an interface above, because this file becomes a module instead of a script.
// https://stackoverflow.com/a/63948053/4053349 section "Modules vs. Scripts"
declare global {
  declare namespace Express {
    export interface Request {
      // Always defined in private routes, undefined in public routes.
      auth: AccessTokenDecoded | undefined;
    }
  }
}

// Helper to mark `req.auth` as defined. Use this interface in private routes in place of express `Request`.
declare type RequestPrivate = Request & {
  auth: AccessTokenDecoded;
};
