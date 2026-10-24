import { DomainEvent } from 'ddd';

export class ReservationConfirmed implements DomainEvent {
  readonly occurredOn = new Date();

  constructor(
    readonly reservationId: string,
    readonly memberId: string | null,
    readonly tableId: string,
    readonly reservationDate: Date,
    readonly startTime: Date,
    readonly endTime: Date,
    readonly guestCount: number,
  ) {}
}
