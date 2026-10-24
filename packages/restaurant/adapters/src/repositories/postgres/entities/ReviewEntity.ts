import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  memberId!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'varchar', length: 500 })
  comment!: string;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  replyText!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  replyAt!: Date | null;
}
