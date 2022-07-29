import type { StreamableFile } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { appConfig } from '../../env-and-config/app-config.js';
import { GenerationHistoryEntity } from '../export-code/generation-history.entity.js';
import type { CSBResponse, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { StripeService } from '../stripe/stripe.service.js';
import type { AccessTokenDecoded } from './user.utils.js';

@Injectable()
export class UserService {
  constructor(
    @Inject(StripeService) private stripeService: StripeService,

    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
  ) {}

  checkIfCsbUploadIsDisabledWhenRoleNoCodesanboxIsAttributed = async (
    figmaNode: ExportCodePayload,
    user: AccessTokenDecoded,
  ) => {
    const isNoCodesandboxUser = user?.['https://clapy.co/roles']?.includes('noCodesandbox');
    if (isNoCodesandboxUser && (figmaNode.extraConfig.output === 'csb' || !figmaNode.extraConfig.zip)) {
      throw new Error("You don't have the permission to upload the generated code to CodeSandbox.");
    }
  };
  getQuotaCount = async (userId: string) => {
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
    // console.log(zipNumber);

    result = csbNumber.length + zipNumber.length;
    if (zipNumber.length >= 1) {
      result--;
    }
    return result;
  };

  checkUserOrThrow = async (user: AccessTokenDecoded) => {
    const userId = user.sub;
    const isLicenceExpired = this.stripeService.isLicenceExpired(user['https://clapy.co/licence-expiration-date']);
    if ((await this.getQuotaCount(userId)) >= appConfig.codeGenFreeQuota && isLicenceExpired) {
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

    generationHistory.auth0id = userId;
    if (genType === 'csb') {
      generationHistory.generatedLink = (res as CSBResponse).sandbox_id;
      await this.generationHistoryRepository.save(generationHistory);
      (res as CSBResponse).quotas = await this.getQuotaCount(userId);
      (res as CSBResponse).isLicenceExpired = this.stripeService.isLicenceExpired(
        user['https://clapy.co/licence-expiration-date'],
      );
      // TODO: si une erreur survient, ne pas bloquer l'exécution du code et envoyer la réponse à l'utilisateur dans ce cas.
    } else if (genType === 'zip') {
      generationHistory.generatedLink = '_zip';
      await this.generationHistoryRepository.save(generationHistory);
    } else {
      throw new Error('Unsupported output format');
    }
  };
}
