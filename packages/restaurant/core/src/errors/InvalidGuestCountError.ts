import { DomainError } from 'ddd';

export class InvalidGuestCountError extends DomainError {
  constructor(count: number) {
    super(`Le nombre de personnes doit être un entier positif (reçu : ${count})`);
  }
}
