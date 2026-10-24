import 'reflect-metadata';

import { assert, expect, test } from 'vitest';
import { Container } from 'inversify';

import {
  BookingIdentifiers,
  CancelReservation,
  CreateReservation,
  Email,
  ListAvailableTables,
  Member,
  MemberRepository,
  Reservation,
  ReservationRepository,
  Table,
  TableRepository
} from 'restaurant-core';
import { InMemoryTableRepository } from '../src/repositories/repositories/InMemoryTableRepository';
import { InMemoryReservationRepository } from '../src/repositories/repositories/InMemoryReservationRepository';
import { InMemoryMemberRepository } from '../src/repositories/repositories/InMemoryMemberRepository';
import { InMemoryMessageQueue } from 'messages-core';
import { InMemoryEventDispatcher } from 'messages-core';
import { EventDispatcher } from 'ddd';

function createTestContainer(): Container {
  const container = new Container();

  const tableRepository = new InMemoryTableRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const memberRepository = new InMemoryMemberRepository();
  const queue = new InMemoryMessageQueue();

  container
    .bind(BookingIdentifiers.tableRepository)
    .toConstantValue(tableRepository);
  container
    .bind(BookingIdentifiers.reservationRepository)
    .toConstantValue(reservationRepository);
  container
    .bind(BookingIdentifiers.memberRepository)
    .toConstantValue(memberRepository);
  container
    .bind(InMemoryMessageQueue)
    .toConstantValue(queue);
  container
    .bind(EventDispatcher)
    .toConstantValue(new InMemoryEventDispatcher(queue));

  container.bind(CreateReservation).toSelf();
  container.bind(CancelReservation).toSelf();
  container.bind(ListAvailableTables).toSelf();

  return container;
}

function futureDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function seedTable(container: Container, capacity = 4): Promise<Table> {
  const repository = container.get<TableRepository>(
    BookingIdentifiers.tableRepository,
  );
  const table = Table.init('table-test', 1, capacity, 'Test');
  await repository.save(table);
  return table;
}

async function seedMember(container: Container): Promise<Member> {
  const repository = container.get<MemberRepository>(
    BookingIdentifiers.memberRepository,
  );
  const member = Member.register('member-test', 'Alice', Email.create('alice@restaurant.fr'), 'hash-de-test');
  await repository.save(member);
  return member;
}

test('CreateReservation - cas nominal', async () => {
  const container = createTestContainer();
  await seedTable(container);
  const member = await seedMember(container);

  const usecase = container.get<CreateReservation>(CreateReservation);
  const startTime = futureDate(2);
  const endTime = futureDate(4);

  const id = await usecase.execute({
    memberId: member.id,
    reservationDate: startTime,
    startTime,
    endTime,
    guestCount: 2,
  });

  const reservationRepository = container.get<ReservationRepository>(
    BookingIdentifiers.reservationRepository,
  );
  const reservation = await reservationRepository.findById(id);

  assert.ok(reservation);
  assert.equal(reservation.props.guestCount, 2);
  assert.equal(reservation.props.memberId, member.id);
  assert.equal(reservation.getStatus(), 'CONFIRMED');
});

test('CreateReservation - erreur si le nombre de convives est invalide', async () => {
  const container = createTestContainer();
  await seedTable(container);
  const member = await seedMember(container);

  const usecase = container.get<CreateReservation>(CreateReservation);
  const startTime = futureDate(2);
  const endTime = futureDate(4);

  await expect(
    () =>
      usecase.execute({
        memberId: member.id,
        reservationDate: startTime,
        startTime,
        endTime,
        guestCount: 0,
      }),
  ).rejects.toMatchObject({ name: 'InvalidGuestCountError' });
});

test('ListAvailableTables - cas nominal', async () => {
  const container = createTestContainer();
  await seedTable(container, 6);

  const usecase = container.get<ListAvailableTables>(ListAvailableTables);
  const startTime = futureDate(2);
  const endTime = futureDate(4);

  const tables = await usecase.execute({
    reservationDate: startTime,
    startTime,
    endTime,
    guestCount: 4,
  });

  assert.equal(tables.length, 1);
  assert.equal(tables[0].capacity, 6);
});

test('ListAvailableTables - erreur si le créneau est invalide', async () => {
  const container = createTestContainer();

  const usecase = container.get<ListAvailableTables>(ListAvailableTables);
  const startTime = futureDate(4);
  const endTime = futureDate(2);

  await expect(
    () =>
      usecase.execute({
        reservationDate: startTime,
        startTime,
        endTime,
        guestCount: 2,
      }),
  ).rejects.toMatchObject({ name: 'InvalidTimeSlotError' });
});

test('CancelReservation - cas nominal', async () => {
  const container = createTestContainer();
  const table = await seedTable(container);

  const reservationRepository = container.get<ReservationRepository>(
    BookingIdentifiers.reservationRepository,
  );
  const startTime = futureDate(2);
  const endTime = futureDate(4);
  const reservation = Reservation.init({
    id: 'reservation-test',
    memberId: 'member-test',
    tableId: table.id,
    reservationDate: startTime,
    startTime,
    endTime,
    guestCount: 2,
  });

  table.reserve(reservation.id, startTime, endTime, 2);
  await reservationRepository.save(reservation);

  const usecase = container.get<CancelReservation>(CancelReservation);
  await usecase.execute({ reservationId: reservation.id });

  assert.equal(reservation.getStatus(), 'CANCELLED');
  assert.equal(table.reservations.length, 0);
});

test('CancelReservation - erreur si la réservation est inconnue', async () => {
  const container = createTestContainer();

  const usecase = container.get<CancelReservation>(CancelReservation);

  await expect(
    () => usecase.execute({ reservationId: 'unknown-reservation' }),
  ).rejects.toMatchObject({ name: 'ReservationNotFoundError' });
});
