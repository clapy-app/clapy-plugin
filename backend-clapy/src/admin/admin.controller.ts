import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import type { FigmaConfigGenPayload } from '../features/sb-serialize-preview/sb-serialize.model.js';
import { hasRoleDevTools } from '../features/user/user.utils.js';
import type { RequestPrivate } from '../typings/express-jwt.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(@Inject(AdminService) private adminService: AdminService) {}

  @Post('get-config')
  async getFigmaConfig(@Req() req: RequestPrivate, @Body() figmaConfigGenPayload: FigmaConfigGenPayload) {
    if (!hasRoleDevTools(req.auth)) {
      throw new Error('you do not have permission for this action.');
    }
    return await this.adminService.getFigmaConfig(figmaConfigGenPayload);
  }
}
