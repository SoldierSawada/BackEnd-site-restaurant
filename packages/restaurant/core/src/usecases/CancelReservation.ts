import { inject, injectable } from 'inversify';
import { EventDispatcher, Usecase } from 'ddd';

import { ReservationRepository } from '../repositories/ReservationRepository';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

import { ReservationNotFoundError } from '../errors/ReservationNotFoundError';
import { TableNotFoundError } from '../errors/TableNotFoundError';

export interface CancelReservationRequest {
  reservationId: string;
  // Si fourni, la réservation doit appartenir à ce membre (sinon elle est traitée comme introuvable).
  memberId?: string;
}

@injectable()
export class CancelReservation
  implements Usecase<CancelReservationRequest, string | null>
{
  constructor(
    @inject(BookingIdentifiers.reservationRepository)
    private readonly reservationRepository: ReservationRepository,

    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,

    @inject(EventDispatcher)
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute(request: CancelReservationRequest): Promise<string | null> {
    const reservation = await this.reservationRepository.findById(
      request.reservationId,
    );

    if (!reservation) {
      throw new ReservationNotFoundError(request.reservationId);
    }

    if (request.memberId !== undefined && reservation.props.memberId !== request.memberId) {
      throw new ReservationNotFoundError(request.reservationId);
    }

    const table = await this.tableRepository.findById(
      reservation.props.tableId,
    );

    if (!table) {
      throw new TableNotFoundError(reservation.props.tableId);
    }

    reservation.cancel();

    table.release(reservation.id);

    await this.reservationRepository.save(reservation);
    await this.tableRepository.save(table);

    await this.eventDispatcher.dispatch(reservation);
    await this.eventDispatcher.dispatch(table);

    return reservation.props.memberId;
  }
}
