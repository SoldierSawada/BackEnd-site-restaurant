import { DomainError } from 'ddd';

export class ReservationNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Réservation introuvable : ${id}`);
  }
}
