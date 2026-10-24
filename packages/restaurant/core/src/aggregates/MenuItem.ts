import { randomUUID } from 'node:crypto';
import { InvalidMenuItemError } from '../errors/InvalidMenuItemError';

export const menuCategorySlugs = ['boissons', 'vins', 'entrees', 'plats', 'desserts'];

export interface MenuItemInput {
  title: string;
  category: string;
  price: number;
  description: string;
}

export interface MenuItemProps {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
}

function requireText(value: string, label: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new InvalidMenuItemError(`${label} est obligatoire`);
  }

  if (trimmed.length > maxLength) {
    throw new InvalidMenuItemError(`${label} ne doit pas dépasser ${maxLength} caractères`);
  }

  return trimmed;
}

function validatePrice(price: number): number {
  const isNumber = Number.isFinite(price);
  const isPositive = isNumber && price > 0 && price <= 999;
  const hasTwoDecimalsAtMost = isNumber && Math.abs(Math.round(price * 100) - price * 100) < 1e-6;

  if (!isPositive || !hasTwoDecimalsAtMost) {
    throw new InvalidMenuItemError('Le prix doit être compris entre 0,01 et 999 euros, avec au plus deux décimales');
  }

  return price;
}

export class MenuItem {
  private constructor(readonly props: MenuItemProps) {}

  static create(input: MenuItemInput): MenuItem {
    if (!menuCategorySlugs.includes(input.category)) {
      throw new InvalidMenuItemError('La catégorie de ce produit n\'existe pas');
    }

    return new MenuItem({
      id: randomUUID(),
      title: requireText(input.title, 'Le nom du produit', 120),
      category: input.category,
      price: validatePrice(input.price),
      description: requireText(input.description, 'La description', 2000),
    });
  }

  static reconstitute(props: MenuItemProps): MenuItem {
    return new MenuItem(props);
  }

  get id(): string {
    return this.props.id;
  }
}
