import type { StreamableFile } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource, Not } from 'typeorm';

import { appConfig } from '../../env-and-config/app-config.js';
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

  checkIfCsbUploadIsDisabledWhenRoleNoCodesanboxIsAttributed = async (
    figmaNode: ExportCodePayload,
    user: AccessTokenDecoded,
  ) => {
    const isNoCodesandboxUser = hasRoleNoCodeSandbox(user);
    if (isNoCodesandboxUser && (figmaNode.extraConfig.output === 'csb' || !figmaNode.extraConfig.zip)) {
      throw new Error("You don't have the permission to upload the generated code to CodeSandbox.");
    }
  };
  async getUserSubscriptionData(user: AccessTokenDecoded) {
    const userId = user.sub;
    const isUserQualified = hasRoleIncreasedQuota(user);
    const quotas = await this.getQuotaCount(userId);
    const quotasMax = isUserQualified ? appConfig.codeGenQualifiedQuota : appConfig.codeGenFreeQuota;
    const isLicenceExpired = this.stripeService.isLicenceInactive(user);
    return { quotas: quotas, quotasMax: quotasMax, isLicenceExpired: isLicenceExpired };
  }
  async getQuotaCount(userId: string) {
    const csbSubQuery = this.generationHistoryRepository
      .createQueryBuilder('generationHistory')
      .select('generated_link')
      .distinctOn(['generationHistory.generated_link'])
      .where({ auth0id: userId, generatedLink: Not('_zip') });

    const zipSubQuery = this.generationHistoryRepository
      .createQueryBuilder('generationHistory')
      .select('generated_link')
      .where({ auth0id: userId, generatedLink: '_zip' });

    const genCountQuery = `select count(*) as count from (${csbSubQuery.getSql()} union all ${zipSubQuery.getSql()}) tmp`;
    const [{ count }] = await this.dataSource.query(genCountQuery, [userId, '_zip']);

    return +count;
  }

  checkUserOrThrow = async (user: AccessTokenDecoded) => {
    const userId = user.sub;

    const isLicenceInactive = this.stripeService.isLicenceInactive(user);
    const isUserQualified = hasRoleIncreasedQuota(user);
    const userQuotaCount = await this.getQuotaCount(userId);
    const checkUserQuota = isUserQualified
      ? userQuotaCount >= appConfig.codeGenQualifiedQuota
      : userQuotaCount >= appConfig.codeGenFreeQuota;
    if (checkUserQuota && isLicenceInactive) {
      throw new Error('Free code generations used up, you can get more by having a call with us or pay a licence');
    }
  };

  saveInHistoryUserCodeGeneration = async (
    genType: 'csb' | 'zip' | undefined,
    res: StreamableFile | CSBResponse | undefined,
    user: AccessTokenDecoded,
  ) => {
    if (res === undefined) return res;
    const generationHistory = new GenerationHistoryEntity();
    const userId = user.sub;
    const isUserQualified = hasRoleIncreasedQuota(user);

    generationHistory.auth0id = userId;
    generationHistory.isFreeUser = this.stripeService.isLicenceInactive(user);

    if (genType === 'csb') {
      res = res as CSBResponse;
      generationHistory.generatedLink = res.sandbox_id;
      await this.generationHistoryRepository.save(generationHistory);
      res.quotas = await this.getQuotaCount(userId);
      res.quotasMax = isUserQualified ? appConfig.codeGenQualifiedQuota : appConfig.codeGenFreeQuota;
      res.isLicenceExpired = this.stripeService.isLicenceInactive(user);
      // TODO: si une erreur survient, ne pas bloquer l'exécution du code et envoyer la réponse à l'utilisateur dans ce cas.
    } else if (genType === 'zip') {
      generationHistory.generatedLink = '_zip';
      await this.generationHistoryRepository.save(generationHistory);
    } else {
      throw new Error('Unsupported output format');
    }
  };
}
