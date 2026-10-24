import { inject, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { MenuItem, MenuItemRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { MenuItemEntity } from './entities/MenuItemEntity';
import { MenuItemMapper } from './mappers/MenuItemMapper';

@injectable()
export class PostgresMenuItemRepository implements MenuItemRepository {
  private readonly repository: Repository<MenuItemEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(MenuItemEntity);
  }

  async save(item: MenuItem): Promise<void> {
    await this.repository.save(MenuItemMapper.toEntity(item));
  }

  async findAll(): Promise<MenuItem[]> {
    const entities = await this.repository.find({ order: { title: 'ASC' } });
    return entities.map((entity) => MenuItemMapper.toDomain(entity));
  }

  async findById(id: string): Promise<MenuItem | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? MenuItemMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
