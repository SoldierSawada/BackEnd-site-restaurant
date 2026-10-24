import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tables')
export class TableEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'int' })
  number!: number;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'boolean' })
  active!: boolean;

  // Créneaux occupés de la table (dates sérialisées en ISO 8601).
  @Column({ type: 'simple-json' })
  reservations!: Array<{
    reservationId: string;
    startTime: string | Date;
    endTime: string | Date;
  }>;
}
