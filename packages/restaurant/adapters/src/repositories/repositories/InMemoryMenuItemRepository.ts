import { injectable } from 'inversify';
import { MenuItem, MenuItemRepository } from 'restaurant-core';

@injectable()
export class InMemoryMenuItemRepository implements MenuItemRepository {
  private readonly items = new Map<string, MenuItem>();

  async save(item: MenuItem): Promise<void> {
    this.items.set(item.id, item);
  }

  async findAll(): Promise<MenuItem[]> {
    return [...this.items.values()];
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.items.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
