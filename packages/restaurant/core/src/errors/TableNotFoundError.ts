import { DomainError } from 'ddd';

export class TableNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Table introuvable : ${id}`);
  }
}
