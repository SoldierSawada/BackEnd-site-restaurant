import 'reflect-metadata';

import { afterEach, assert, beforeEach, expect, test } from 'vitest';
import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';

import {
  BookingIdentifiers,
  CancelReservation,
  CreateReservation,
  Email,
  GetMemberReservations,
  Member,
  MemberRepository,
  RegisterMember,
  Reservation,
  Review,
  ReviewRepository,
  ReservationRepository,
  SessionRepository,
  Table,
  TableRepository,
} from 'restaurant-core';
import {
  Build,
  POSTGRES_ENTITIES,
  PostgresMemberRepository,
  PostgresReservationRepository,
  PostgresTableRepository,
} from 'restaurant-adapters';

// PostgreSQL émulé en mémoire (pg-mem) : on teste les vrais repositories TypeORM
// sans serveur PostgreSQL.
async function createDataSource(): Promise<DataSource> {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'restaurant_test',
  });
  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16 (pg-mem)',
  });

  const dataSource: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: POSTGRES_ENTITIES,
    synchronize: true,
  });
  await dataSource.initialize();
  return dataSource;
}

function futureDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

let dataSource: DataSource;
let container: Container;

beforeEach(async () => {
  dataSource = await createDataSource();
  container = new Container();
  Build.load(container, { dataSource });
});

afterEach(async () => {
  await dataSource.destroy();
});

test('Build - lie les repositories PostgreSQL quand une DataSource est fournie', () => {
  assert.instanceOf(container.get(BookingIdentifiers.memberRepository), PostgresMemberRepository);
  assert.instanceOf(
    container.get(BookingIdentifiers.reservationRepository),
    PostgresReservationRepository,
  );
  assert.instanceOf(container.get(BookingIdentifiers.tableRepository), PostgresTableRepository);
});

test('PostgresReviewRepository - pagination, statistiques, réponse et suppression', async () => {
  const reviews = container.get<ReviewRepository>(BookingIdentifiers.reviewRepository);
  const first = Review.create('pg-m1', 5, 'Top', new Date('2026-10-01T10:00:00.000Z'));
  const second = Review.create('pg-m2', 4, '', new Date('2026-10-02T10:00:00.000Z'));
  const third = Review.create('pg-m3', 4, 'Bien', new Date('2026-10-03T10:00:00.000Z'));
  await reviews.save(first);
  await reviews.save(second);
  await reviews.save(third);

  const page = await reviews.findPage(0, 2);
  assert.equal(page.total, 3);
  assert.equal(page.items.length, 2);
  assert.equal(page.items[0].id, third.id);

  const stats = await reviews.getStats();
  assert.equal(stats.count, 3);
  assert.deepEqual(stats.ratingCounts, [0, 0, 0, 2, 1]);

  const byMember = await reviews.findByMemberId('pg-m2');
  assert.ok(byMember);
  assert.equal(byMember.id, second.id);

  const replied = await reviews.findById(first.id);
  assert.ok(replied);
  replied.reply('Merci !');
  await reviews.save(replied);
  assert.equal((await reviews.findById(first.id))?.currentReply?.text, 'Merci !');

  await reviews.delete(second.id);
  assert.isNull(await reviews.findById(second.id));
  assert.equal((await reviews.getStats()).count, 2);
});

test('PostgresSessionRepository - save / findByToken / deleteByToken', async () => {
  const sessionRepository = container.get<SessionRepository>(BookingIdentifiers.sessionRepository);
  const createdAt = new Date('2026-10-20T10:00:00.000Z');

  await sessionRepository.save({ token: 'jeton-test', memberId: 'member-test', createdAt });

  const found = await sessionRepository.findByToken('jeton-test');
  assert.ok(found);
  assert.equal(found.memberId, 'member-test');
  assert.equal(found.createdAt.toISOString(), createdAt.toISOString());

  await sessionRepository.deleteByToken('jeton-test');
  assert.isNull(await sessionRepository.findByToken('jeton-test'));
});

test('PostgresMemberRepository - le mot de passe haché est persisté', async () => {
  const memberRepository = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  await memberRepository.save(Member.register('m-hash', 'Alice', Email.create('hash@b.fr'), 'hachage-persiste'));

  const found = await memberRepository.findById('m-hash');
  assert.ok(found);
  assert.equal(found.getPasswordHash(), 'hachage-persiste');
});

test('PostgresMemberRepository - save / findById / findByEmail', async () => {
  const repository = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  const member = Member.register('m-1', 'Alice', Email.create('alice@restaurant.fr'), 'hash-de-test');
  member.deactivate();

  await repository.save(member);

  const byId = await repository.findById('m-1');
  assert.ok(byId);
  assert.equal(byId.getName(), 'Alice');
  assert.equal(byId.email.value, 'alice@restaurant.fr');
  assert.equal(byId.getStatus(), 'DEACTIVATED');
  assert.equal(byId.pullEvents().length, 0);

  const byEmail = await repository.findByEmail(Email.create('ALICE@restaurant.fr'));
  assert.equal(byEmail?.id, 'm-1');

  assert.isNull(await repository.findById('inconnu'));
  assert.isNull(await repository.findByEmail(Email.create('x@y.fr')));
});

test('PostgresMemberRepository - la contrainte UNIQUE sur l’email lève EmailAlreadyUsedError', async () => {
  const repository = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  await repository.save(Member.register('m-1', 'Alice', Email.create('a@b.fr'), 'hash-de-test'));

  await expect(
    repository.save(Member.register('m-2', 'Bob', Email.create('a@b.fr'), 'hash-de-test')),
  ).rejects.toMatchObject({ name: 'EmailAlreadyUsedError' });
});

test('PostgresReservationRepository - aller-retour complet, statut et findByMemberId', async () => {
  const repository = container.get<ReservationRepository>(BookingIdentifiers.reservationRepository);
  const startTime = futureDate(2);
  const endTime = futureDate(4);

  const reservation = Reservation.init({
    id: 'r-1',
    memberId: 'm-1',
    tableId: 't-1',
    reservationDate: startTime,
    startTime,
    endTime,
    guestCount: 3,
    specialRequest: 'Anniversaire',
  });
  await repository.save(reservation);
  await repository.save(
    Reservation.init({
      id: 'r-2',
      memberId: 'm-2',
      tableId: 't-1',
      reservationDate: futureDate(6),
      startTime: futureDate(6),
      endTime: futureDate(7),
      guestCount: 2,
    }),
  );

  const loaded = await repository.findById('r-1');
  assert.ok(loaded);
  assert.equal(loaded.props.memberId, 'm-1');
  assert.equal(loaded.props.guestCount, 3);
  assert.equal(loaded.props.specialRequest, 'Anniversaire');
  assert.equal(loaded.props.startTime.getTime(), startTime.getTime());
  assert.equal(loaded.getStatus(), 'CONFIRMED');

  loaded.cancel();
  await repository.save(loaded);
  assert.equal((await repository.findById('r-1'))?.getStatus(), 'CANCELLED');

  const forMember = await repository.findByMemberId('m-1');
  assert.deepEqual(forMember.map((r) => r.id), ['r-1']);

  const withoutRequest = await repository.findById('r-2');
  assert.isUndefined(withoutRequest?.props.specialRequest);
});

test('PostgresTableRepository - créneaux occupés persistés et findAvailable', async () => {
  const repository = container.get<TableRepository>(BookingIdentifiers.tableRepository);
  const small = Table.init('t-small', 1, 2, 'Terrasse');
  const big = Table.init('t-big', 2, 6, 'Salle');
  const inactive = Table.init('t-off', 3, 8, 'Salle');
  inactive.deactivate();

  const startTime = futureDate(2);
  const endTime = futureDate(4);
  big.reserve('r-1', startTime, endTime, 4);

  await repository.save(small);
  await repository.save(big);
  await repository.save(inactive);

  const loadedBig = await repository.findById('t-big');
  assert.ok(loadedBig);
  assert.equal(loadedBig.reservations.length, 1);
  assert.instanceOf(loadedBig.reservations[0].startTime, Date);
  assert.equal(loadedBig.reservations[0].startTime.getTime(), startTime.getTime());

  // Même créneau, 2 personnes → seule la petite table est libre.
  const sameSlot = await repository.findAvailable(startTime, endTime, 2);
  assert.deepEqual(sameSlot.map((t) => t.id), ['t-small']);

  // Créneau adjacent, 4 personnes → la grande table redevient disponible.
  const adjacent = await repository.findAvailable(endTime, futureDate(6), 4);
  assert.deepEqual(adjacent.map((t) => t.id), ['t-big']);
});

test('Use Cases de bout en bout avec PostgreSQL', async () => {
  await container
    .get<TableRepository>(BookingIdentifiers.tableRepository)
    .save(Table.init('t-1', 1, 4, 'Salle'));

  const memberId = await container
    .get(RegisterMember)
    .execute({ name: 'Alice', email: 'alice@restaurant.fr', password: 'motdepasse1' });

  const startTime = futureDate(2);
  const reservationId = await container.get(CreateReservation).execute({
    memberId,
    reservationDate: startTime,
    startTime,
    endTime: futureDate(4),
    guestCount: 2,
  });

  const table = await container
    .get<TableRepository>(BookingIdentifiers.tableRepository)
    .findById('t-1');
  assert.equal(table?.reservations.length, 1);

  await container.get(CancelReservation).execute({ reservationId });

  const reservations = await container.get(GetMemberReservations).execute({ memberId });
  assert.equal(reservations.length, 1);
  assert.equal(reservations[0].getStatus(), 'CANCELLED');

  const released = await container
    .get<TableRepository>(BookingIdentifiers.tableRepository)
    .findById('t-1');
  assert.equal(released?.reservations.length, 0);
});
