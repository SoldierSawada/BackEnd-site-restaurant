import { AggregateRoot } from 'ddd';
import { TableReleased, TableReserved } from 'restaurant-messages';

import { InvalidGuestCountError } from '../errors/InvalidGuestCountError';
import { InsufficientTableCapacityError } from '../errors/InsufficientTableCapacityError';
import { TableUnavailableError } from '../errors/TableUnavailableError';

export interface TableReservationProps {
  reservationId: string;
  startTime: Date;
  endTime: Date;
}

export interface TableProps {
  id: string;
  number: number;
  capacity: number;
  location: string;
  active: boolean;
  reservations: TableReservationProps[];
}

export class Table extends AggregateRoot {
  id: string;
  number: number;
  capacity: number;
  location: string;
  reservations: TableReservationProps[];
  isActive: boolean;

  private constructor(props: TableProps) {
    super();
    this.id = props.id;
    this.number = props.number;
    this.capacity = props.capacity;
    this.location = props.location;
    this.isActive = props.active;
    this.reservations = props.reservations;
  }

  static init(
    id: string,
    number: number,
    capacity: number,
    location: string,
  ): Table {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new InsufficientTableCapacityError(capacity, 0);
    }

    return new Table({
      id,
      number,
      capacity,
      location,
      active: true,
      reservations: [],
    });
  }

  static reconstitute(props: TableProps): Table {
    return new Table(props);
  }

  reserve(
    reservationId: string,
    startTime: Date,
    endTime: Date,
    guestCount: number,
    reservationDate: Date = startTime,
  ): void {
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      throw new InvalidGuestCountError(guestCount);
    }

    if (guestCount > this.capacity) {
      throw new InsufficientTableCapacityError(
        this.capacity,
        guestCount,
      );
    }

    if (!this.isActive) {
      throw new TableUnavailableError(this.id);
    }

    if (startTime >= endTime) {
      throw new TableUnavailableError(this.id);
    }

    if (this.hasConflict(startTime, endTime)) {
      throw new TableUnavailableError(this.id);
    }

    this.reservations.push({
      reservationId,
      startTime,
      endTime,
    });

    this.recordEvent(
      new TableReserved(this.id, reservationId, reservationDate, startTime, endTime),
    );
  }

  release(reservationId: string): void {
    const index = this.reservations.findIndex(
      (reservation: TableReservationProps) =>
        reservation.reservationId === reservationId,
    );

    if (index >= 0) {
      this.reservations.splice(index, 1);
      this.recordEvent(new TableReleased(this.id, reservationId));
    }
  }

  canAccommodate(guestCount: number): boolean {
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      return false;
    }

    return this.isActive && guestCount <= this.capacity;
  }

  private hasConflict(startTime: Date, endTime: Date): boolean {
    return this.reservations.some(
      (reservation: TableReservationProps) =>
        startTime < reservation.endTime &&
        endTime > reservation.startTime,
    );
  }

  isAvailable(startTime: Date, endTime: Date): boolean {
    if (!this.isActive || startTime >= endTime) {
      return false;
    }

    return !this.hasConflict(startTime, endTime);
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}