import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'generation_history', schema: 'clapy' })
export class GenerationHistoryEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id?: number;

  @Column({ name: 'auth0id' })
  auth0id?: string;

  @Column({ name: 'created_at' })
  created_at?: Date;

  @Column({ name: 'generated_link' })
  generated_link?: string;
}
