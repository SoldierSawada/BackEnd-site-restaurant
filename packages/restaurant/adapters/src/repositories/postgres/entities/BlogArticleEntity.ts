import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('blog_articles')
export class BlogArticleEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'varchar', length: 40, default: '' })
  category!: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  excerpt!: string;

  @Column({ type: 'varchar', length: 80, default: '' })
  author!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'timestamptz' })
  publishedAt!: Date;

  @Column({ type: 'integer', default: 0 })
  views!: number;
}
