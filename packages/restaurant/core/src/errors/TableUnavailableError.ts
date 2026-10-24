import { DomainError } from 'ddd';

export class TableUnavailableError extends DomainError {
  constructor(id: string) {
    super(`La table ${id} est indisponible sur le créneau demandé`);
  }
}
