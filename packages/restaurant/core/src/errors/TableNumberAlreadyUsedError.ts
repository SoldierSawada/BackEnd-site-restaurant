import { DomainError } from 'ddd';

export class TableNumberAlreadyUsedError extends DomainError {
  constructor(number: number) {
    super(`Le numéro de table ${number} est déjà utilisé`);
  }
}
