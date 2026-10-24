import { Get, JsonController } from 'routing-controllers';
import { inject, injectable } from 'inversify';
import { ListMenuItems, MenuItem } from 'restaurant-core';

export function toMenuItemResponse(item: MenuItem) {
  return {
    id: item.props.id,
    title: item.props.title,
    category: item.props.category,
    price: item.props.price,
    description: item.props.description,
  };
}

@injectable()
@JsonController('/menu')
export class MenuController {
  constructor(
    @inject(ListMenuItems)
    private readonly listMenuItems: ListMenuItems,
  ) {}

  @Get('/items')
  async list() {
    const items = await this.listMenuItems.execute();
    return items.map(toMenuItemResponse);
  }
}
