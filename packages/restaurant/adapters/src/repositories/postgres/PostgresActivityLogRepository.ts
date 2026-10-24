import { inject, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { ActivityLog, ActivityLogPageResult, ActivityLogRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { ActivityLogEntity } from './entities/ActivityLogEntity';
import { ActivityLogMapper } from './mappers/ActivityLogMapper';

@injectable()
export class PostgresActivityLogRepository implements ActivityLogRepository {
  private readonly repository: Repository<ActivityLogEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(ActivityLogEntity);
  }

  async save(log: ActivityLog): Promise<void> {
    await this.repository.save(ActivityLogMapper.toEntity(log));
  }

  async findAll(): Promise<ActivityLog[]> {
    const entities = await this.repository.find({ order: { createdAt: 'DESC', id: 'DESC' } });
    return entities.map((entity) => ActivityLogMapper.toDomain(entity));
  }

  async findPage(offset: number, limit: number): Promise<ActivityLogPageResult> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: offset,
      take: limit,
    });
    return { items: entities.map((entity) => ActivityLogMapper.toDomain(entity)), total };
  }
}
