import { inject, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { Review, ReviewPageResult, ReviewRepository, ReviewStats } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { ReviewEntity } from './entities/ReviewEntity';
import { ReviewMapper } from './mappers/ReviewMapper';

@injectable()
export class PostgresReviewRepository implements ReviewRepository {
  private readonly repository: Repository<ReviewEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(ReviewEntity);
  }

  async save(review: Review): Promise<void> {
    await this.repository.save(ReviewMapper.toEntity(review));
  }

  async findById(id: string): Promise<Review | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? ReviewMapper.toDomain(entity) : null;
  }

  async findByMemberId(memberId: string): Promise<Review | null> {
    const entity = await this.repository.findOneBy({ memberId });
    return entity ? ReviewMapper.toDomain(entity) : null;
  }

  async findPage(offset: number, limit: number): Promise<ReviewPageResult> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: offset,
      take: limit,
    });
    return { items: entities.map((entity) => ReviewMapper.toDomain(entity)), total };
  }

  async getStats(): Promise<ReviewStats> {
    const rows = await this.repository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'total')
      .groupBy('review.rating')
      .getRawMany<{ rating: number; total: string }>();

    const ratingCounts = [0, 0, 0, 0, 0];
    let count = 0;
    for (const row of rows) {
      const total = Number(row.total);
      ratingCounts[Number(row.rating) - 1] = total;
      count += total;
    }
    return { count, ratingCounts };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
