import { Controller, Get, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { wait } from '../common/general-utils.js';
import { flags } from '../env-and-config/app-config.js';
import { env } from '../env-and-config/env.js';
import { GenerationHistoryEntity } from '../features/export-code/generation-history.entity.js';

@Controller()
export class LoginPrivateController {
  constructor(
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
  ) {}
  @Get('check-session')
  async checkSession(@Req() request: Request) {
    const userId = (request as any).user.sub;
    if (env.isDev && flags.simulateColdStart) {
      await wait(3000);
    }
    const getQuotaCount = async () => {
      let result = 0;
      const csbNumber = await this.generationHistoryRepository
        .createQueryBuilder('generationHistory')
        .select('generationHistory.generated_link')
        .distinctOn(['generationHistory.generated_link'])
        .where({ auth0id: userId })
        .execute();

      const zipNumber = await this.generationHistoryRepository
        .createQueryBuilder('generationHistory')
        .where({ auth0id: userId, generatedLink: '_zip' })
        .execute();

      result = csbNumber.length + zipNumber.length;
      if (zipNumber.length >= 1) {
        result--;
      }
      return result;
    };
    const result = await getQuotaCount();
    return { ok: true, quotas: result };
  }
}
