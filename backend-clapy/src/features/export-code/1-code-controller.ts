import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { env } from '../../env-and-config/env.js';
import type { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { UserService } from '../user/user.service.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { isStripeEnabled } from '../user/user.utils.js';
import { exportCode } from './2-create-ts-compiler.js';

@Controller('code')
export class CodeController {
  constructor(@Inject(UserService) private userService: UserService) {}
  @Post('export')
  async exportCode(@Body() figmaNode: ExportCodePayload, uploadToCsb = true, @Req() request: Request) {
    const user: AccessTokenDecoded = (request as any).user;
    await this.userService.checkIfCsbUploadIsDisabledWhenRoleNoCodesanboxIsAttributed(figmaNode, user);

    const isStripeDevTeam = isStripeEnabled(user);
    if (env.isDev || isStripeDevTeam) {
      await this.userService.checkUserOrThrow(user);
    }
    const res = await exportCode(figmaNode, uploadToCsb, user);
    await this.userService.saveInHistoryUserCodeGeneration(figmaNode.extraConfig.output, res, user);
    return res;
  }
}
