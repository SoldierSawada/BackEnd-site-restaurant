import { Table, TableReservationProps } from 'restaurant-core';
import { TableEntity } from '../entities/TableEntity';

export class TableMapper {
  static toEntity(domain: Table): TableEntity {
    const entity = new TableEntity();
    entity.id = domain.id;
    entity.number = domain.number;
    entity.capacity = domain.capacity;
    entity.location = domain.location;
    entity.active = domain.getIsActive();
    entity.reservations = domain.reservations.map((reservation) => ({
      reservationId: reservation.reservationId,
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
    }));
    return entity;
  }

  static toDomain(entity: TableEntity): Table {
    const reservations: TableReservationProps[] = (entity.reservations ?? []).map(
      (reservation) => ({
        reservationId: reservation.reservationId,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime),
      }),
    );

    return Table.reconstitute({
      id: entity.id,
      number: entity.number,
      capacity: entity.capacity,
      location: entity.location,
      active: entity.active,
      reservations,
    });
  }
}
