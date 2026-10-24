import { inject, injectable } from 'inversify';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { Table, TablePageResult, TableRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { TableEntity } from './entities/TableEntity';
import { TableMapper } from './mappers/TableMapper';

@injectable()
export class PostgresTableRepository implements TableRepository {
  private readonly repository: Repository<TableEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(TableEntity);
  }

  async save(table: Table): Promise<void> {
    await this.repository.save(TableMapper.toEntity(table));
  }

  async findById(id: string): Promise<Table | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? TableMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Table[]> {
    const entities = await this.repository.find({ order: { number: 'ASC' } });
    return entities.map((entity) => TableMapper.toDomain(entity));
  }

  async findPage(offset: number, limit: number): Promise<TablePageResult> {
    const [entities, total] = await this.repository.findAndCount({
      order: { number: 'ASC' },
      skip: offset,
      take: limit,
    });
    return { items: entities.map((entity) => TableMapper.toDomain(entity)), total };
  }

  async findAvailable(
    startTime: Date,
    endTime: Date,
    guestCount: number,
  ): Promise<Table[]> {
    // Pré-filtre en base (active + capacité), puis l'agrégat tranche sur les conflits de créneaux.
    const entities = await this.repository.find({
      where: { active: true, capacity: MoreThanOrEqual(guestCount) },
      order: { number: 'ASC' },
    });

    return entities
      .map((entity) => TableMapper.toDomain(entity))
      .filter(
        (table) => table.canAccommodate(guestCount) && table.isAvailable(startTime, endTime),
      );
  }
}
