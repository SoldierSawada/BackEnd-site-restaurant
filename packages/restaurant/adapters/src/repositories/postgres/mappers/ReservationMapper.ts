import { Reservation } from 'restaurant-core';
import { ReservationEntity } from '../entities/ReservationEntity';

export class ReservationMapper {
  static toEntity(domain: Reservation): ReservationEntity {
    const entity = new ReservationEntity();
    entity.id = domain.id;
    entity.memberId = domain.props.memberId;
    entity.tableId = domain.props.tableId;
    entity.reservationDate = domain.props.reservationDate;
    entity.startTime = domain.props.startTime;
    entity.endTime = domain.props.endTime;
    entity.guestCount = domain.props.guestCount;
    entity.specialRequest = domain.props.specialRequest ?? null;
    entity.status = domain.getStatus();
    entity.guestName = domain.props.guestName ?? null;
    entity.guestEmail = domain.props.guestEmail ?? null;
    entity.guestPhone = domain.props.guestPhone ?? null;
    return entity;
  }

  static toDomain(entity: ReservationEntity): Reservation {
    return Reservation.reconstitute({
      id: entity.id,
      memberId: entity.memberId,
      tableId: entity.tableId,
      reservationDate: new Date(entity.reservationDate),
      startTime: new Date(entity.startTime),
      endTime: new Date(entity.endTime),
      guestCount: entity.guestCount,
      specialRequest: entity.specialRequest ?? undefined,
      status: entity.status,
      guestName: entity.guestName ?? undefined,
      guestEmail: entity.guestEmail ?? undefined,
      guestPhone: entity.guestPhone ?? undefined,
    });
  }
}
