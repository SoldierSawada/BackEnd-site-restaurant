import { inject, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { BlogArticle, BlogArticleRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { BlogArticleEntity } from './entities/BlogArticleEntity';
import { BlogArticleMapper } from './mappers/BlogArticleMapper';

@injectable()
export class PostgresBlogArticleRepository implements BlogArticleRepository {
  private readonly repository: Repository<BlogArticleEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(BlogArticleEntity);
  }

  async save(article: BlogArticle): Promise<void> {
    await this.repository.save(BlogArticleMapper.toEntity(article));
  }

  async findAll(): Promise<BlogArticle[]> {
    const entities = await this.repository.find({ order: { publishedAt: 'DESC' } });
    return entities.map((entity) => BlogArticleMapper.toDomain(entity));
  }

  async findById(id: string): Promise<BlogArticle | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? BlogArticleMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
