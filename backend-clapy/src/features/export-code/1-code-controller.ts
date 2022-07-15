import { Body, Controller, Post, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';

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
    const res = await exportCode(figmaNode, uploadToCsb);
    const userId = (request as any).user.sub;
    if (res === undefined) return res;
    const generationHistory = new GenerationHistoryEntity();
    generationHistory.auth0id = userId;
    if (figmaNode.extraConfig.output === 'csb') {
      generationHistory.generatedLink = (res as CSBResponse).sandbox_id;
    } else if (figmaNode.extraConfig.output === 'zip') {
      generationHistory.generatedLink = '_zip';
    } else {
      throw new Error('Unsupported output format');
    }

    await this.generationHistoryRepository.save(generationHistory);
    // TODO; si une erreur surviens, ne pas bloquer l'execution de code et envoyé la reponse a l'utilisateur dans ce cas.
    // faire un push slack pour avoir le corps de l'erreur
    return res;
  }
}
