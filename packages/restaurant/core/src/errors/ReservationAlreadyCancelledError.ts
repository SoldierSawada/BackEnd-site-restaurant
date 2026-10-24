import { DomainError } from 'ddd';

export class ReservationAlreadyCancelledError extends DomainError {
  constructor(id: string) {
    super(`La réservation ${id} est déjà annulée`);
  }
}
