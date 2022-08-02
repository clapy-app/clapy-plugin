import { Controller, Get, Inject, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { wait } from '../common/general-utils.js';
import { appConfig, flags } from '../env-and-config/app-config.js';
import { env } from '../env-and-config/env.js';
import { GenerationHistoryEntity } from '../features/export-code/generation-history.entity.js';
import { StripeService } from '../features/stripe/stripe.service.js';
import { UserService } from '../features/user/user.service.js';
import type { AccessTokenDecoded } from '../features/user/user.utils.js';
import { hasRoleIncreasedQuota } from '../features/user/user.utils.js';

@Controller()
export class LoginPrivateController {
  constructor(
    @Inject(UserService) private userService: UserService,
    @Inject(StripeService) private stripeService: StripeService,
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
  ) {}
  @Get('check-session')
  async checkSession(@Req() request: Request) {
    const userId = (request as any).user.sub;

    const user = (request as any).user as AccessTokenDecoded;
    const isLicenceExpired = this.stripeService.isLicenceInactive(user);
    const isUserQualified = hasRoleIncreasedQuota(user);
    if (env.isDev && flags.simulateColdStart) {
      await wait(3000);
    }

    const quotas = await this.userService.getQuotaCount(userId);
    const quotasMax = isUserQualified ? appConfig.codeGenQualifiedQuota : appConfig.codeGenFreeQuota;

    return { ok: true, quotas: quotas, quotasMax: quotasMax, isLicenceExpired: isLicenceExpired };
  }
}
