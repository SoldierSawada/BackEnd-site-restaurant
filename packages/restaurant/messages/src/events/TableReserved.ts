import { DomainEvent } from 'ddd';

export class TableReserved implements DomainEvent {
  readonly occurredOn = new Date();

  constructor(
    readonly tableId: string,
    readonly reservationId: string,
    readonly reservationDate: Date,
    readonly startTime: Date,
    readonly endTime: Date,
  ) {}
}
