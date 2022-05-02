import { Controller, Get } from '@nestjs/common';

@Controller()
export class LoginPrivateController {
  @Get('check-session')
  checkSession() {
    return { ok: true };
  }
}
