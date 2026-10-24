import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { BookingIdentifiers } from 'restaurant-core';

import { InMemoryMemberRepository } from '../repositories/repositories/InMemoryMemberRepository';
import { PostgresMemberRepository } from '../repositories/postgres/PostgresMemberRepository';
import { InMemorySessionRepository } from '../repositories/repositories/InMemorySessionRepository';
import { PostgresSessionRepository } from '../repositories/postgres/PostgresSessionRepository';
import { ScryptPasswordHasher } from '../security/ScryptPasswordHasher';

export class MemberBuild {
  static register(container: Container, dataSource?: DataSource): void {
    container
      .bind(BookingIdentifiers.memberRepository)
      .to(dataSource ? PostgresMemberRepository : InMemoryMemberRepository)
      .inSingletonScope();

    container
      .bind(BookingIdentifiers.sessionRepository)
      .to(dataSource ? PostgresSessionRepository : InMemorySessionRepository)
      .inSingletonScope();

    container.bind(BookingIdentifiers.passwordHasher).to(ScryptPasswordHasher).inSingletonScope();
  }
}
