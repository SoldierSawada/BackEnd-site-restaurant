import { DomainEvent } from 'ddd';

export class TableReleased implements DomainEvent {
  readonly occurredOn = new Date();

  constructor(
    readonly tableId: string,
    readonly reservationId: string,
  ) {}
}
