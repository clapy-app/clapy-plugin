import { Body, Controller, Inject, Post, Req } from '@nestjs/common';

import type { RequestPrivate } from '../../typings/express-jwt.js';
import type { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { UserService } from '../user/user.service.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { exportCode } from './2-create-ts-compiler.js';

@Controller('code')
export class CodeController {
  constructor(@Inject(UserService) private userService: UserService) {}

  @Post('export')
  async exportCode(@Body() figmaNode: ExportCodePayload, uploadToCsb = true, @Req() req: RequestPrivate) {
    const user: AccessTokenDecoded = req.auth;

    await this.userService.checkIfCsbUploadIsDisabledWhenRoleNoCodesanboxIsAttributed(figmaNode, user);

    const isStripeOn = isStripeEnabled(user);
    if (env.isDev || isStripeOn) {
      await this.userService.checkUserOrThrow(user);
    }

    const generationHistoryId = await this.userService.saveInHistoryUserCodeGeneration(figmaNode, user);
    const res = await exportCode(figmaNode, uploadToCsb, user);
    const res2 = await this.userService.updateUserCodeGeneration(
      res,
      user,
      figmaNode.extraConfig.target,
      generationHistoryId,
    );
    return res2;
  }
}
