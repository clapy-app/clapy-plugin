import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { GenerationHistoryEntity } from '../features/export-code/generation-history.entity.js';
import type { GenerationHistory } from '../features/sb-serialize-preview/sb-serialize.model.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistory>,
  ) {}
  async getFigmaConfig() {
    const data = await this.generationHistoryRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 2,
    });
    return data;
  }
}
