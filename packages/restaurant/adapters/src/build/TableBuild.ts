import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { BookingIdentifiers } from 'restaurant-core';

import { InMemoryTableRepository } from '../repositories/repositories/InMemoryTableRepository';
import { PostgresTableRepository } from '../repositories/postgres/PostgresTableRepository';

export class TableBuild {
  static register(container: Container, dataSource?: DataSource): void {
    container
      .bind(BookingIdentifiers.tableRepository)
      .to(dataSource ? PostgresTableRepository : InMemoryTableRepository)
      .inSingletonScope();
  }
}
