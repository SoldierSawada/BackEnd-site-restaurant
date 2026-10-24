import { MenuItem } from 'restaurant-core';
import { MenuItemEntity } from '../entities/MenuItemEntity';

export class MenuItemMapper {
  static toEntity(domain: MenuItem): MenuItemEntity {
    const entity = new MenuItemEntity();
    entity.id = domain.props.id;
    entity.category = domain.props.category;
    entity.title = domain.props.title;
    entity.price = domain.props.price;
    entity.description = domain.props.description;
    return entity;
  }

  static toDomain(entity: MenuItemEntity): MenuItem {
    return MenuItem.reconstitute({
      id: entity.id,
      category: entity.category,
      title: entity.title,
      price: Number(entity.price),
      description: entity.description,
    });
  }
}
