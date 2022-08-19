import { Controller, Get, Inject, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { wait } from '../common/general-utils.js';
import { flags } from '../env-and-config/app-config.js';
import { env } from '../env-and-config/env.js';
import { GenerationHistoryEntity } from '../features/export-code/generation-history.entity.js';
import { StripeService } from '../features/stripe/stripe.service.js';
import { UserService } from '../features/user/user.service.js';
import type { RequestPrivate } from '../typings/express-jwt.js';

@Controller()
export class LoginPrivateController {
  constructor(
    @Inject(UserService) private userService: UserService,
    @Inject(StripeService) private stripeService: StripeService,
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
  ) {}
  @Get('check-session')
  async checkSession(@Req() req: RequestPrivate) {
    const user = req.auth;

    if (env.isDev && flags.simulateColdStart) {
      await wait(3000);
    }

    const subscriptionData = await this.userService.getUserSubscriptionData(user);

    return { ok: true, ...subscriptionData };
  }
}
