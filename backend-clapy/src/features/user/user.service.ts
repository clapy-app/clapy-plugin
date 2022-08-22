import type { StreamableFile } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource, Not } from 'typeorm';

import { appConfig } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { GenerationHistoryEntity } from '../export-code/generation-history.entity.js';
import type { CSBResponse, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { StripeService } from '../stripe/stripe.service.js';
import type { AccessTokenDecoded } from './user.utils.js';
import { hasRoleIncreasedQuota, hasRoleNoCodeSandbox } from './user.utils.js';

@Injectable()
export class UserService {
  constructor(
    @Inject(StripeService) private stripeService: StripeService,
    @Inject(DataSource) private dataSource: DataSource,
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
  ) {}

  async checkIfCsbUploadIsDisabledWhenRoleNoCodesanboxIsAttributed(
    figmaNode: ExportCodePayload,
    user: AccessTokenDecoded,
  ) {
    const isNoCodesandboxUser = hasRoleNoCodeSandbox(user);
    if (isNoCodesandboxUser && (figmaNode.extraConfig.output === 'csb' || !figmaNode.extraConfig.zip)) {
      throw new Error("You don't have the permission to upload the generated code to CodeSandbox.");
    }
  }

  async getUserSubscriptionData(user: AccessTokenDecoded) {
    const userId = user.sub;
    const isUserQualified = hasRoleIncreasedQuota(user);
    const quotas = await this.getQuotaCount(userId);
    const quotasMax = isUserQualified ? appConfig.codeGenQualifiedQuota : appConfig.codeGenFreeQuota;
    const isLicenseExpired = this.stripeService.isLicenceInactive(user);
    return { quotas: quotas, quotasMax: quotasMax, isLicenseExpired };
  }

  async getQuotaCount(userId: string) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, nextMonth + 1, 1);

    const csbSubQuery = this.generationHistoryRepository
      .createQueryBuilder('generationHistory')
      .select('generated_link')
      .distinctOn(['generationHistory.generated_link'])
      .where({ auth0id: userId, generatedLink: Not('_zip') })
      .andWhere('generationHistory.created_at > :startDate', { startDate: new Date(currentYear, currentMonth, 1) })
      .andWhere('generationHistory.created_at < :endDate', { endDate: new Date(currentYear, nextMonth + 1, 1) });

    const zipSubQuery = this.generationHistoryRepository
      .createQueryBuilder('generationHistory')
      .select('generated_link')
      .where({ auth0id: userId, generatedLink: '_zip' })
      .andWhere('generationHistory.created_at > :startDate', { startDate: new Date(currentYear, currentMonth, 1) })
      .andWhere('generationHistory.created_at < :endDate', { endDate: new Date(currentYear, nextMonth + 1, 1) });
    const genCountQuery = `select count(*) as count from (${csbSubQuery.getSql()} union all ${zipSubQuery.getSql()}) tmp`;
    const [{ count }] = await this.dataSource.query(genCountQuery, [userId, '_zip', startDate, endDate]);

    return +count;
  }

  async getFigmaConfig() {
    const data = await this.generationHistoryRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 2,
    });
    return data;
  }

  async checkUserOrThrow(user: AccessTokenDecoded) {
    const userId = user.sub;

    const isLicenceInactive = this.stripeService.isLicenceInactive(user);
    const isUserQualified = hasRoleIncreasedQuota(user);
    const userQuotaCount = await this.getQuotaCount(userId);
    const checkUserQuota = isUserQualified
      ? userQuotaCount >= appConfig.codeGenQualifiedQuota
      : userQuotaCount >= appConfig.codeGenFreeQuota;
    if (!env.isDev && checkUserQuota && isLicenceInactive) {
      throw new Error(
        'Your free code generation quota is used. Please contact us for an increased quota or to upgrade.',
      );
    }
  }

  async saveInHistoryUserCodeGeneration(figmaNode: ExportCodePayload, user: AccessTokenDecoded) {
    const generationHistory = new GenerationHistoryEntity();
    const userId = user.sub;
    generationHistory.auth0id = userId;
    generationHistory.isFreeUser = this.stripeService.isLicenceInactive(user);
    generationHistory.figmaConfig = figmaNode;
    const generationHistoryRow = await this.generationHistoryRepository.save(generationHistory);
    return generationHistoryRow.id;
  }

  async updateUserCodeGeneration(
    res: StreamableFile | CSBResponse | undefined,
    user: AccessTokenDecoded,
    genType: 'csb' | 'zip' | undefined,
    generationHistoryId: string | undefined,
  ) {
    if (!res) {
      return res;
    }
    const generationHistory = new GenerationHistoryEntity();
    generationHistory.id = generationHistoryId;
    if (genType === 'csb') {
      res = res as CSBResponse;
      generationHistory.generatedLink = res.sandbox_id;
      await this.generationHistoryRepository.save(generationHistory);
      res = Object.assign(res, this.getUserSubscriptionData(user));
      // TODO: si une erreur survient, ne pas bloquer l'exécution du code et envoyer la réponse à l'utilisateur dans ce cas.
    } else if (genType === 'zip') {
      generationHistory.generatedLink = '_zip';
      await this.generationHistoryRepository.save(generationHistory);
    } else {
      throw new Error('Unsupported output format');
    }
  }
}
