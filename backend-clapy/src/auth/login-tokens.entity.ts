import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'login_tokens', schema: 'clapy' })
export class LoginTokensEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id?: number;

  @Column({ name: 'read_token', unique: true })
  readToken?: string;

  @Column({ name: 'write_token', unique: true })
  writeToken?: string;

  @Column({ name: 'code' })
  code?: string;
}
