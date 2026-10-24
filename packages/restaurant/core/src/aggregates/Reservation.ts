import { AggregateRoot } from 'ddd';
import { ReservationCancelled, ReservationConfirmed } from 'restaurant-messages';

import { ReservationAlreadyCancelledError } from '../errors/ReservationAlreadyCancelledError';
import { CancellationTooLateError } from '../errors/CancellationTooLateError';
import { InvalidGuestCountError } from '../errors/InvalidGuestCountError';
import { InvalidGuestContactError } from '../errors/InvalidGuestContactError';
import { InvalidTimeSlotError } from '../errors/InvalidTimeSlotError';
import { Email } from '../ValueObject/Email';

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

// memberId est vide pour une réservation faite sans compte : les coordonnées du visiteur sont alors obligatoires.
export interface ReservationProps {
  id: string;
  memberId: string | null;
  tableId: string;
  reservationDate: Date;
  startTime: Date;
  endTime: Date;
  guestCount: number;
  specialRequest?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

const phonePattern = /^\+?[0-9 .-]{6,20}$/;

export class Reservation extends AggregateRoot {
  id: string;
  private status: ReservationStatus;
  props!: ReservationProps;

  private constructor(props: ReservationProps, status: ReservationStatus) {
    super();

    this.id = props.id;
    this.props = props;
    this.status = status;
  }

  // Création : la réservation est confirmée immédiatement et produit ReservationConfirmed.
  static init({
    id,
    memberId,
    tableId,
    reservationDate,
    startTime,
    endTime,
    guestCount,
    specialRequest,
    guestName,
    guestEmail,
    guestPhone,
  }: ReservationProps): Reservation {
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      throw new InvalidGuestCountError(guestCount);
    }

    if (endTime <= startTime) {
      throw new InvalidTimeSlotError(startTime, endTime);
    }

    let contact: { guestName?: string; guestEmail?: string; guestPhone?: string } = {};

    if (memberId === null) {
      const trimmedName = (guestName ?? '').trim();
      const trimmedPhone = (guestPhone ?? '').trim();

      if (trimmedName.length === 0 || !phonePattern.test(trimmedPhone)) {
        throw new InvalidGuestContactError();
      }

      const email = Email.create(guestEmail ?? '');
      contact = { guestName: trimmedName, guestEmail: email.value, guestPhone: trimmedPhone };
    }

    const reservation = new Reservation(
      {
        id,
        memberId,
        tableId,
        reservationDate,
        startTime,
        endTime,
        guestCount,
        specialRequest,
        ...contact,
      },
      'CONFIRMED',
    );

    reservation.recordEvent(
      new ReservationConfirmed(
        id,
        memberId,
        tableId,
        reservationDate,
        startTime,
        endTime,
        guestCount,
      ),
    );

    return reservation;
  }

  // Reconstruction depuis la persistance : aucun événement, aucune revalidation.
  static reconstitute(
    props: ReservationProps & { status: ReservationStatus },
  ): Reservation {
    const { status, ...rest } = props;
    return new Reservation(rest, status);
  }

  cancel(now: Date = new Date()): void {
    if (this.status === 'CANCELLED') {
      throw new ReservationAlreadyCancelledError(this.id);
    }

    if (now >= this.props.startTime) {
      throw new CancellationTooLateError(this.id);
    }

    this.status = 'CANCELLED';

    this.recordEvent(
      new ReservationCancelled(
        this.id,
        this.props.memberId,
        this.props.tableId,
        this.props.guestCount,
      ),
    );
  }

  isActive(): boolean {
    return this.status === 'CONFIRMED';
  }

  getStatus(): ReservationStatus {
    return this.status;
  }
}
