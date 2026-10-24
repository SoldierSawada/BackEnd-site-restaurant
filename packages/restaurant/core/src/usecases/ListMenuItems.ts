import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { MenuItem } from '../aggregates/MenuItem';
import { MenuItemRepository } from '../repositories/MenuItemRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

@injectable()
export class ListMenuItems implements Usecase<void, MenuItem[]> {
  constructor(
    @inject(BookingIdentifiers.menuItemRepository)
    private readonly menuItemRepository: MenuItemRepository,
  ) {}

  async execute(): Promise<MenuItem[]> {
    return this.menuItemRepository.findAll();
  }
}
