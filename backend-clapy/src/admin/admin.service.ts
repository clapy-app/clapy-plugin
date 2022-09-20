import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { GenerationHistoryEntity } from '../features/export-code/generation-history.entity.js';
import type { FigmaConfigGenPayload, GenerationHistory } from '../features/sb-serialize-preview/sb-serialize.model.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistory>,
  ) {}
  async getFigmaConfig(figmaConfigGenPayload: FigmaConfigGenPayload) {
    const data = await this.generationHistoryRepository.find({
      where: {
        auth0id: figmaConfigGenPayload.auth0id,
      },
      order: {
        createdAt: 'DESC',
      },
      take: figmaConfigGenPayload.numberOfGeneratedConfigs,
    });
    return data;
  }
}
