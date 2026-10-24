import { MenuItem } from '../aggregates/MenuItem';

export interface MenuItemRepository {
  save(item: MenuItem): Promise<void>;
  findAll(): Promise<MenuItem[]>;
  findById(id: string): Promise<MenuItem | null>;
  delete(id: string): Promise<void>;
}
