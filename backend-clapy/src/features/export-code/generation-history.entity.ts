import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
