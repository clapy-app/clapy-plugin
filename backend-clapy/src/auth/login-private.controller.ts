import { Controller, Get } from '@nestjs/common';

@Controller()
export class LoginPrivateController {

  @Get('sample/works')
  // @PublicRoute()
  sample() {
    return { works: true };
  }

}