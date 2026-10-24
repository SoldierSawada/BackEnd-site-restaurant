import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { MenuItem, MenuItemInput } from '../aggregates/MenuItem';
import { MenuItemRepository } from '../repositories/MenuItemRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

@injectable()
export class CreateMenuItem implements Usecase<MenuItemInput, MenuItem> {
  constructor(
    @inject(BookingIdentifiers.menuItemRepository)
    private readonly menuItemRepository: MenuItemRepository,
  ) {}

  async execute(request: MenuItemInput): Promise<MenuItem> {
    const item = MenuItem.create(request);
    await this.menuItemRepository.save(item);
    return item;
  }
}
