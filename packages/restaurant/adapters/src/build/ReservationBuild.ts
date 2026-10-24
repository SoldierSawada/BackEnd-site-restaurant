import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { BookingIdentifiers } from 'restaurant-core';

import { InMemoryReservationRepository } from '../repositories/repositories/InMemoryReservationRepository';
import { PostgresReservationRepository } from '../repositories/postgres/PostgresReservationRepository';

export class ReservationBuild {
  static register(container: Container, dataSource?: DataSource): void {
    container
      .bind(BookingIdentifiers.reservationRepository)
      .to(dataSource ? PostgresReservationRepository : InMemoryReservationRepository)
      .inSingletonScope();
  }
}
