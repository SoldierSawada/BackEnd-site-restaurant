import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('activity_logs')
export class ActivityLogEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  memberId!: string;

  @Column({ type: 'varchar', length: 64 })
  action!: string;

  @Column({ type: 'varchar', length: 1000 })
  details!: string;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
