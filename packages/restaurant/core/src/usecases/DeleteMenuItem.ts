import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { MenuItemRepository } from '../repositories/MenuItemRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { MenuItemNotFoundError } from '../errors/MenuItemNotFoundError';

export interface DeleteMenuItemRequest {
  itemId: string;
}

@injectable()
export class DeleteMenuItem implements Usecase<DeleteMenuItemRequest, void> {
  constructor(
    @inject(BookingIdentifiers.menuItemRepository)
    private readonly menuItemRepository: MenuItemRepository,
  ) {}

  async execute(request: DeleteMenuItemRequest): Promise<void> {
    const item = await this.menuItemRepository.findById(request.itemId);

    if (!item) {
      throw new MenuItemNotFoundError(request.itemId);
    }

    await this.menuItemRepository.delete(request.itemId);
  }
}
