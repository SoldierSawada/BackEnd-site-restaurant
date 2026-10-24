import { DomainEvent } from 'ddd';

export class ReservationCancelled implements DomainEvent {
  readonly occurredOn = new Date();

  constructor(
    readonly reservationId: string,
    readonly memberId: string | null,
    readonly tableId: string,
    readonly guestCount: number,
  ) {}
}
