import 'reflect-metadata';

import { assert, expect, test } from 'vitest';
import { Container } from 'inversify';

import {
  BookingIdentifiers,
  CancelReservation,
  CreateReservation,
  Email,
  InvalidEmailError,
  InvalidGuestContactError,
  Member,
  MemberRepository,
  ReservationNotFoundError,
  ReservationRepository,
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

function slot(): { reservationDate: Date; startTime: Date; endTime: Date } {
  const startTime = new Date(Date.now() + 3 * dayMs);
  startTime.setUTCHours(19, 0, 0, 0);
  const reservationDate = new Date(startTime);
  reservationDate.setUTCHours(0, 0, 0, 0);
  return { reservationDate, startTime, endTime: new Date(startTime.getTime() + 2 * hourMs) };
}

function guestRequest(overrides: Partial<{ guestName: string; guestEmail: string; guestPhone: string }> = {}) {
  return {
    memberId: null,
    ...slot(),
    guestCount: 2,
    guestName: 'Jean Visiteur',
    guestEmail: 'jean@example.fr',
    guestPhone: '06 12 34 56 78',
    ...overrides,
  };
}

async function setupTable(container: Container): Promise<void> {
  const tables = container.get<TableRepository>(BookingIdentifiers.tableRepository);
  await tables.save(Table.init('t-1', 1, 4, 'Salle'));
}

test('Réservation visiteur - créée sans compte avec ses coordonnées', async () => {
  const container = createTestContainer();
  await setupTable(container);
  const reservations = container.get<ReservationRepository>(BookingIdentifiers.reservationRepository);

  const id = await container.get(CreateReservation).execute(
    guestRequest({ guestEmail: '  Jean@Example.FR ' }),
  );
  const reservation = await reservations.findById(id);

  assert.isNotNull(reservation);
  assert.isNull(reservation?.props.memberId);
  assert.equal(reservation?.props.guestName, 'Jean Visiteur');
  assert.equal(reservation?.props.guestEmail, 'jean@example.fr');
  assert.equal(reservation?.props.guestPhone, '06 12 34 56 78');
  assert.equal(reservation?.getStatus(), 'CONFIRMED');
});

test('Réservation visiteur - refuse un nom vide ou un téléphone invalide', async () => {
  const container = createTestContainer();
  await setupTable(container);

  await expect(
    container.get(CreateReservation).execute(guestRequest({ guestName: '   ' })),
  ).rejects.toThrow(InvalidGuestContactError);
  await expect(
    container.get(CreateReservation).execute(guestRequest({ guestPhone: 'abc' })),
  ).rejects.toThrow(InvalidGuestContactError);
});

test('Réservation visiteur - refuse un email invalide', async () => {
  const container = createTestContainer();
  await setupTable(container);

  await expect(
    container.get(CreateReservation).execute(guestRequest({ guestEmail: 'pas-un-email' })),
  ).rejects.toThrow(InvalidEmailError);
});

test('Annulation - le membre propriétaire annule sa réservation', async () => {
  const container = createTestContainer();
  await setupTable(container);
  const members = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  const reservations = container.get<ReservationRepository>(BookingIdentifiers.reservationRepository);
  await members.save(Member.register('m-owner', 'Ana', Email.create('ana@b.fr'), 'hash'));

  const id = await container.get(CreateReservation).execute({
    memberId: 'm-owner',
    ...slot(),
    guestCount: 2,
  });
  await container.get(CancelReservation).execute({ reservationId: id, memberId: 'm-owner' });

  assert.equal((await reservations.findById(id))?.getStatus(), 'CANCELLED');
});

test('Annulation - un autre membre ne peut pas annuler la réservation', async () => {
  const container = createTestContainer();
  await setupTable(container);
  const members = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  const reservations = container.get<ReservationRepository>(BookingIdentifiers.reservationRepository);
  await members.save(Member.register('m-owner', 'Ana', Email.create('ana@b.fr'), 'hash'));
  await members.save(Member.register('m-other', 'Bob', Email.create('bob@b.fr'), 'hash'));

  const id = await container.get(CreateReservation).execute({
    memberId: 'm-owner',
    ...slot(),
    guestCount: 2,
  });

  await expect(
    container.get(CancelReservation).execute({ reservationId: id, memberId: 'm-other' }),
  ).rejects.toThrow(ReservationNotFoundError);
  assert.equal((await reservations.findById(id))?.getStatus(), 'CONFIRMED');
});

test('Annulation - une réservation visiteur ne peut pas être annulée par un membre', async () => {
  const container = createTestContainer();
  await setupTable(container);
  const members = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  await members.save(Member.register('m-any', 'Ana', Email.create('ana@b.fr'), 'hash'));

  const id = await container.get(CreateReservation).execute(guestRequest());

  await expect(
    container.get(CancelReservation).execute({ reservationId: id, memberId: 'm-any' }),
  ).rejects.toThrow(ReservationNotFoundError);
});
