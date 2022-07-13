import { Body, Controller, Post, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
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
    const generationHistory = new GenerationHistoryEntity();
    generationHistory.auth0id = userId;
    generationHistory.generated_link = (res as any).sandbox_id;
    this.generationHistoryRepository.save(generationHistory);
    return res;
  }
}
