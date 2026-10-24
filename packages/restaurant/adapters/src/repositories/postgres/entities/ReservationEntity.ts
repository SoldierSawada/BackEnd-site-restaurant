import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('reservations')
export class ReservationEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  memberId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  tableId!: string;

  @Column({ type: 'timestamptz' })
  reservationDate!: Date;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({ type: 'int' })
  guestCount!: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  specialRequest!: string | null;

  @Column({ type: 'varchar', length: 16 })
  status!: 'CONFIRMED' | 'CANCELLED';

  @Column({ type: 'varchar', length: 100, nullable: true })
  guestName!: string | null;

  @Column({ type: 'varchar', length: 254, nullable: true })
  guestEmail!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guestPhone!: string | null;
}
