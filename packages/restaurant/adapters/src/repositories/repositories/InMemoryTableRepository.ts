import { injectable } from 'inversify';
import { Table, TablePageResult, TableRepository } from 'restaurant-core';

@injectable()
export class InMemoryTableRepository implements TableRepository {
  private readonly items = new Map<string, Table>();

  async save(table: Table): Promise<void> {
    this.items.set(table.id, table);
  }

  async findById(id: string): Promise<Table | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<Table[]> {
    return [...this.items.values()].sort((a, b) => a.number - b.number);
  }

  async findPage(offset: number, limit: number): Promise<TablePageResult> {
    const sorted = await this.findAll();
    return { items: sorted.slice(offset, offset + limit), total: sorted.length };
  }

  async findAvailable(
    startTime: Date,
    endTime: Date,
    guestCount: number,
  ): Promise<Table[]> {
    return [...this.items.values()].filter(
      table => table.canAccommodate(guestCount) && table.isAvailable(startTime, endTime),
    );
  }
}
