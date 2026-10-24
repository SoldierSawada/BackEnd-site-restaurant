import 'reflect-metadata';

import { assert, test } from 'vitest';
import { Container } from 'inversify';

import {
  BookingIdentifiers,
  Email,
  GetAdminDashboard,
  Member,
  MemberRepository,
  Reservation,
  ReservationRepository,
  Review,
  ReviewRepository,
  Table,
  TableRepository,
} from 'restaurant-core';
import { Build } from 'restaurant-adapters';

const dayMs = 24 * 60 * 60 * 1000;
const hourMs = 60 * 60 * 1000;

function createTestContainer(): Container {
  const container = new Container();
  Build.load(container);
  return container;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * dayMs);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * dayMs);
}

function reservationAt(id: string, memberId: string, startTime: Date): Reservation {
  return Reservation.init({
    id,
    memberId,
    tableId: 't-1',
    reservationDate: startTime,
    startTime,
    endTime: new Date(startTime.getTime() + 2 * hourMs),
    guestCount: 2,
  });
}

function registerMember(id: string, name: string, email: string): Member {
  return Member.register(id, name, Email.create(email), 'hash');
}

test('AdminDashboard - base vide : tous les indicateurs à zéro et moyenne nulle', async () => {
  const container = createTestContainer();

  const dashboard = await container.get(GetAdminDashboard).execute();

  assert.equal(dashboard.todayReservations, 0);
  assert.equal(dashboard.upcomingReservations, 0);
  assert.equal(dashboard.memberCount, 0);
  assert.equal(dashboard.openTables, 0);
  assert.equal(dashboard.totalTables, 0);
  assert.isNull(dashboard.review.average);
  assert.equal(dashboard.review.count, 0);
});

test('AdminDashboard - compte seulement les membres actifs (hors responsable et comptes désactivés)', async () => {
  const container = createTestContainer();
  const members = container.get<MemberRepository>(BookingIdentifiers.memberRepository);

  await members.save(registerMember('m-1', 'Client 1', 'c1@b.fr'));
  await members.save(registerMember('m-2', 'Client 2', 'c2@b.fr'));
  const deactivated = registerMember('m-off', 'Désactivé', 'off@b.fr');
  deactivated.deactivate();
  await members.save(deactivated);
  await members.save(
    Member.reconstitute({
      id: 'admin-1',
      name: 'Responsable',
      email: Email.create('admin@b.fr'),
      passwordHash: 'hash',
      status: 'ACTIVE',
      role: 'ADMIN',
    }),
  );

  const dashboard = await container.get(GetAdminDashboard).execute();

  assert.equal(dashboard.memberCount, 2);
});

test('AdminDashboard - compte les réservations confirmées du jour', async () => {
  const container = createTestContainer();
  const reservations = container.get<ReservationRepository>(BookingIdentifiers.reservationRepository);
  const todayNoon = new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`);

  await reservations.save(reservationAt('r-today', 'm-x', todayNoon));
  await reservations.save(reservationAt('r-other', 'm-x', daysAgo(3)));

  const dashboard = await container.get(GetAdminDashboard).execute();

  assert.equal(dashboard.todayReservations, 1);
});

test('AdminDashboard - compte les réservations à venir', async () => {
  const container = createTestContainer();
  const reservations = container.get<ReservationRepository>(BookingIdentifiers.reservationRepository);

  await reservations.save(reservationAt('r-future', 'm-x', daysFromNow(3)));
  await reservations.save(reservationAt('r-past', 'm-x', daysAgo(3)));

  const dashboard = await container.get(GetAdminDashboard).execute();

  assert.equal(dashboard.upcomingReservations, 1);
  assert.equal(dashboard.todayReservations, 0);
});

test('AdminDashboard - compte les tables ouvertes et le total', async () => {
  const container = createTestContainer();
  const tables = container.get<TableRepository>(BookingIdentifiers.tableRepository);

  await tables.save(Table.init('t-1', 1, 2, 'Salle'));
  const closed = Table.init('t-2', 2, 4, 'Terrasse');
  closed.deactivate();
  await tables.save(closed);
  await tables.save(Table.init('t-3', 3, 6, 'Salle'));

  const dashboard = await container.get(GetAdminDashboard).execute();

  assert.equal(dashboard.openTables, 2);
  assert.equal(dashboard.totalTables, 3);
});

test('AdminDashboard - calcule la moyenne et le nombre des avis', async () => {
  const container = createTestContainer();
  const reviews = container.get<ReviewRepository>(BookingIdentifiers.reviewRepository);

  await reviews.save(Review.create('m-r1', 5, ''));
  await reviews.save(Review.create('m-r2', 4, ''));

  const dashboard = await container.get(GetAdminDashboard).execute();

  assert.equal(dashboard.review.count, 2);
  assert.equal(dashboard.review.average, 4.5);
});
