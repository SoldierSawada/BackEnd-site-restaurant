import { DomainError } from 'ddd';

export class ReviewNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Aucun avis ne correspond à l'identifiant ${id}`);
  }
}
