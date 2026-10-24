import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('menu_items')
export class MenuItemEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  category!: string;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  price!: number;

  @Column({ type: 'text' })
  description!: string;
}
