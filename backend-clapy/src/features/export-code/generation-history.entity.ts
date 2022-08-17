import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import type { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';

@Entity({ name: 'generation_history', schema: 'clapy' })
export class GenerationHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ name: 'auth0id' })
  auth0id?: string;

  @Column({ name: 'created_at' })
  createdAt?: Date;

  @Column({ name: 'generated_link' })
  generatedLink?: string;

  @Column({ name: 'is_free_user' })
  isFreeUser?: boolean;

  @Column('jsonb', { name: 'figma_config', nullable: true })
  figmaConfig?: ExportCodePayload;
}
