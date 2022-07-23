import { Controller, Get } from '@nestjs/common';

import { wait } from '../common/general-utils.js';
import { env } from '../env-and-config/env.js';

@Controller()
export class LoginPrivateController {
  @Get('check-session')
  async checkSession() {
    // Simulates a potential cold start on Google Cloud Run.
    // This API is one of the first calls.
    if (env.isDev) {
      await wait(3000);
    }
    return { ok: true };
  }
}
