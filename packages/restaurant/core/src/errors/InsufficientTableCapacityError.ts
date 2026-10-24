import { DomainError } from 'ddd';

export class InsufficientTableCapacityError extends DomainError {
  constructor(capacity: number, guestCount: number) {
    super(`La table ne peut pas accueillir ${guestCount} personne(s) avec une capacité de ${capacity}`);
  }
}
