import { DomainError } from 'ddd';

export class CancellationTooLateError extends DomainError {
  constructor(id: string) {
    super(`La réservation ${id} ne peut plus être annulée car son créneau a commencé`);
  }
}
