import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { GenerationHistoryEntity } from '../features/export-code/generation-history.entity.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(GenerationHistoryEntity) private generationHistoryRepository: Repository<GenerationHistoryEntity>,
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
