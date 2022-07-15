import { Body, Controller, Post, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';

import { appConfig } from '../../env-and-config/app-config.js';
import type { CSBResponse, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { exportCode } from './2-create-ts-compiler.js';
import { GenerationHistoryEntity } from './generation-history.entity.js';

@Controller('code')
export class CodeController {
  constructor(
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
  ) {}
  @Post('export')
  async exportCode(@Body() figmaNode: ExportCodePayload, uploadToCsb = true, @Req() request: Request) {
    const generationHistory = new GenerationHistoryEntity();

    const userId = (request as any).user.sub;

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
    if ((await getQuotaCount()) >= appConfig.maxQuotas) {
      // we need to return to the user that he used up all his tries and now he has to either qualify for call to get more code generation
      // or pay for unlimited access
      throw new Error('Free code generations used up, you can get more by having a call with us or pay a licencee');
    }
    const res = await exportCode(figmaNode, uploadToCsb);
    if (res === undefined) return res;
    generationHistory.auth0id = userId;
    if (figmaNode.extraConfig.output === 'csb') {
      generationHistory.generatedLink = (res as CSBResponse).sandbox_id;
      (res as CSBResponse).quotas = await getQuotaCount();
      await this.generationHistoryRepository.save(generationHistory);
      // TODO; si une erreur surviens, ne pas bloquer l'execution de code et envoyé la reponse a l'utilisateur dans ce cas.
      // faire un push slack pour avoir le corps de l'erreur
    } else if (figmaNode.extraConfig.output === 'zip') {
      generationHistory.generatedLink = '_zip';
      await this.generationHistoryRepository.save(generationHistory);
    } else {
      throw new Error('Unsupported output format');
    }

    // since we cant track the different _zip with our current technology we will just have add the number of time the user generated zips to the distinct
    // value of times user generated codesandbox_ids
    /**
     * if file is csb add propriety generationCount to object res
     * if file is zip hit an endpoint that gets back the count of number of generation.
     */
    console.log(res);
    return res;
  }
}
