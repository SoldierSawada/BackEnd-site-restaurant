import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ type: 'varchar', length: 64 })
  memberId!: string;

  @Column({ type: 'timestamp' })
  createdAt!: Date;
}
