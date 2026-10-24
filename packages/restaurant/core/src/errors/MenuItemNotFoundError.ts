import { DomainError } from 'ddd';

export class MenuItemNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Aucun produit de la carte ne correspond à l'identifiant ${id}`);
  }
}
