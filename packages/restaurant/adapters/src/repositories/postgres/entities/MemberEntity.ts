import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('members')
export class MemberEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // L'unicité de l'email est aussi garantie par la base (contrainte UNIQUE).
  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 16 })
  status!: 'ACTIVE' | 'DEACTIVATED';

  // MEMBER (client) ou ADMIN (responsable d'établissement).
  @Column({ type: 'varchar', length: 16, default: 'MEMBER' })
  role!: 'MEMBER' | 'ADMIN';
}
