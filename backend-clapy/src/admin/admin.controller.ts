import { Controller, Get, Inject, Req } from '@nestjs/common';
import { hasRoleDevTools } from '../features/user/user.utils.js';
import type { RequestPrivate } from '../typings/express-jwt.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(@Inject(AdminService) private adminService: AdminService) {}

  @Get('get-config')
  async getFigmaConfig(@Req() req: RequestPrivate) {
    if (!hasRoleDevTools(req.auth)) {
      throw new Error('you do not have permission for this action.');
    }
    return await this.adminService.getFigmaConfig();
  }
}
