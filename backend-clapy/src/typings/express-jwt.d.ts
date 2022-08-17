declare namespace Express {
  import type { AccessTokenDecoded } from '../features/user/user.utils.js';

  export interface Request {
    auth: AccessTokenDecoded;
  }
}
