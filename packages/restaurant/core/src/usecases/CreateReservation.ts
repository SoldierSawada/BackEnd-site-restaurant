import { randomUUID } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { EventDispatcher, Usecase } from 'ddd';

import { Reservation } from '../aggregates/Reservation';
import { ReservationRepository } from '../repositories/ReservationRepository';
import { TableRepository } from '../repositories/TableRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

import { TableUnavailableError } from '../errors/TableUnavailableError';
import { InvalidTimeSlotError } from '../errors/InvalidTimeSlotError';
import { InvalidGuestCountError } from '../errors/InvalidGuestCountError';
import { MemberNotFoundError } from '../errors/MemberNotFoundError';
import { MemberDeactivatedError } from '../errors/MemberDeactivatedError';

export interface CreateReservationRequest {
  // null pour un visiteur sans compte : ses coordonnées sont alors obligatoires.
  memberId: string | null;
  reservationDate: Date;
  startTime: Date;
  endTime: Date;
  guestCount: number;
  specialRequest?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

@injectable()
export class CreateReservation
  implements Usecase<CreateReservationRequest, string>
{
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,

    @inject(BookingIdentifiers.reservationRepository)
    private readonly reservationRepository: ReservationRepository,

    @inject(EventDispatcher)
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute(request: CreateReservationRequest): Promise<string> {
    if (request.memberId !== null) {
      const member = await this.memberRepository.findById(request.memberId);

      if (!member) {
        throw new MemberNotFoundError(request.memberId);
      }

      if (!member.isActive()) {
        throw new MemberDeactivatedError(member.id);
      }
    }

    if (
      request.guestCount <= 0 ||
      !Number.isInteger(request.guestCount)
    ) {
      throw new InvalidGuestCountError(request.guestCount);
    }

  
    if (request.endTime <= request.startTime) {
      throw new InvalidTimeSlotError(
        request.startTime,
        request.endTime,
      );
    }

  
    const tables = await this.tableRepository.findAvailable(
      request.startTime,
      request.endTime,
      request.guestCount,
    );

    const table = tables[0];

    if (!table) {
      throw new TableUnavailableError('aucune table adaptée');
    }

   
    const reservationId = randomUUID();

    const reservation = Reservation.init({
      id: reservationId,
      memberId: request.memberId,
      tableId: table.id,
      reservationDate: request.reservationDate,
      startTime: request.startTime,
      endTime: request.endTime,
      guestCount: request.guestCount,
      specialRequest: request.specialRequest,
      guestName: request.guestName,
      guestEmail: request.guestEmail,
      guestPhone: request.guestPhone,
    });

    table.reserve(
      reservationId,
      request.startTime,
      request.endTime,
      request.guestCount,
      request.reservationDate,
    );

    await this.tableRepository.save(table);
    await this.reservationRepository.save(reservation);


    await this.eventDispatcher.dispatch(table);
    await this.eventDispatcher.dispatch(reservation);

    return reservation.id;
  }
}