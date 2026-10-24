import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { BookingIdentifiers } from 'restaurant-core';

import { InMemoryActivityLogRepository } from '../repositories/repositories/InMemoryActivityLogRepository';
import { PostgresActivityLogRepository } from '../repositories/postgres/PostgresActivityLogRepository';

export class JournalBuild {
  static register(container: Container, dataSource?: DataSource): void {
    container
      .bind(BookingIdentifiers.activityLogRepository)
      .to(dataSource ? PostgresActivityLogRepository : InMemoryActivityLogRepository)
      .inSingletonScope();
  }
}
