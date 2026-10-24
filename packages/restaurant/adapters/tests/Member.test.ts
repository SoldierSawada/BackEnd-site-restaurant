import 'reflect-metadata';

import { assert, expect, test } from 'vitest';
import { Container } from 'inversify';

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
  Table,
  TableRepository,
} from 'restaurant-core';
import {
  MemberRegistered,
  ReservationCancelled,
  ReservationConfirmed,
  TableReleased,
  TableReserved,
} from 'restaurant-messages';
import { InMemoryMessageQueue } from 'messages-core';
import { Build } from 'restaurant-adapters';

function createTestContainer(): Container {
  const container = new Container();
  Build.load(container);
  return container;
}

function futureDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function seedTable(container: Container): Promise<Table> {
  const table = Table.init('table-test', 1, 4, 'Test');
  await container.get<TableRepository>(BookingIdentifiers.tableRepository).save(table);
  return table;
}

// ─── Value Object Email ────────────────────────────────────────────────

test('Email - normalise la valeur (espaces, majuscules)', () => {
  const email = Email.create('  Client@Restaurant.FR ');
  assert.equal(email.value, 'client@restaurant.fr');
});

test('Email - deux emails de même valeur sont égaux', () => {
  assert.ok(Email.create('a@b.fr').equals(Email.create('A@B.FR')));
  assert.notOk(Email.create('a@b.fr').equals(Email.create('c@b.fr')));
});

test('Email - immuable', () => {
  const email = Email.create('a@b.fr');
  assert.ok(Object.isFrozen(email));
});

test.each(['', '   ', 'sans-arobase', 'a@b', '@b.fr', 'a b@c.fr'])(
  'Email - erreur si la valeur est invalide (%j)',
  (value) => {
    expect(() => Email.create(value)).toThrowError(
      expect.objectContaining({ name: 'InvalidEmailError' }),
    );
  },
);

// ─── Agrégat Member ────────────────────────────────────────────────────

test('Member - register crée un membre actif et produit MemberRegistered', () => {
  const member = Member.register('m-1', '  Alice  ', Email.create('alice@restaurant.fr'), 'hash-de-test');

  assert.equal(member.getName(), 'Alice');
  assert.equal(member.getStatus(), 'ACTIVE');
  assert.ok(member.isActive());

  const events = member.pullEvents();
  assert.equal(events.length, 1);
  assert.instanceOf(events[0], MemberRegistered);
  assert.equal((events[0] as MemberRegistered).email, 'alice@restaurant.fr');
});

test('Member - erreur si le nom est vide', () => {
  expect(() => Member.register('m-1', '  ', Email.create('a@b.fr'), 'hash-de-test')).toThrowError(
    expect.objectContaining({ name: 'InvalidMemberNameError' }),
  );
});

test('Member - rename et deactivate', () => {
  const member = Member.register('m-1', 'Alice', Email.create('a@b.fr'), 'hash-de-test');

  member.rename('Alice Martin');
  assert.equal(member.getName(), 'Alice Martin');
  expect(() => member.rename('')).toThrowError(
    expect.objectContaining({ name: 'InvalidMemberNameError' }),
  );

  member.deactivate();
  member.deactivate();
  assert.equal(member.getStatus(), 'DEACTIVATED');
  assert.notOk(member.isActive());
});

test('Member - reconstitute ne produit aucun événement', () => {
  const member = Member.reconstitute({
    id: 'm-1',
    name: 'Alice',
    email: Email.create('a@b.fr'),
    passwordHash: 'hash-de-test',
    status: 'DEACTIVATED',
    role: 'MEMBER',
  });
  assert.equal(member.pullEvents().length, 0);
  assert.notOk(member.isActive());
});

test('Member - register crée un MEMBER, reconstitute ADMIN est un responsable', () => {
  const alice = Member.register('m-2', 'Alice', Email.create('alice@b.fr'), 'hash-de-test');
  assert.equal(alice.getRole(), 'MEMBER');
  assert.notOk(alice.isAdmin());

  const boss = Member.reconstitute({
    id: 'm-3',
    name: 'Responsable',
    email: Email.create('resp@b.fr'),
    passwordHash: 'hash-de-test',
    status: 'ACTIVE',
    role: 'ADMIN',
  });
  assert.ok(boss.isAdmin());
});

// ─── Use Case RegisterMember ───────────────────────────────────────────

test('RegisterMember - cas nominal : sauvegarde et publie MemberRegistered', async () => {
  const container = createTestContainer();
  const usecase = container.get(RegisterMember);

  const id = await usecase.execute({ name: 'Alice', email: 'Alice@Restaurant.fr', password: 'motdepasse1' });

  const member = await container
    .get<MemberRepository>(BookingIdentifiers.memberRepository)
    .findById(id);
  assert.ok(member);
  assert.equal(member.email.value, 'alice@restaurant.fr');

  const queue = container.get(InMemoryMessageQueue);
  assert.deepEqual(queue.pending().map((message) => message.type), ['MemberRegistered']);
});

test('RegisterMember - erreur si l’email est déjà utilisé (insensible à la casse)', async () => {
  const container = createTestContainer();
  const usecase = container.get(RegisterMember);

  await usecase.execute({ name: 'Alice', email: 'alice@restaurant.fr', password: 'motdepasse1' });

  await expect(
    usecase.execute({ name: 'Autre', email: 'ALICE@restaurant.fr', password: 'motdepasse1' }),
  ).rejects.toMatchObject({ name: 'EmailAlreadyUsedError' });
});

test('RegisterMember - erreur si l’email est invalide', async () => {
  const container = createTestContainer();

  await expect(
    container.get(RegisterMember).execute({ name: 'Alice', email: 'invalide', password: 'motdepasse1' }),
  ).rejects.toMatchObject({ name: 'InvalidEmailError' });
});

// ─── CreateReservation / CancelReservation avec Member ─────────────────

test('CreateReservation - erreur si le membre est inconnu', async () => {
  const container = createTestContainer();
  await seedTable(container);

  await expect(
    container.get(CreateReservation).execute({
      memberId: 'inconnu',
      reservationDate: futureDate(2),
      startTime: futureDate(2),
      endTime: futureDate(4),
      guestCount: 2,
    }),
  ).rejects.toMatchObject({ name: 'MemberNotFoundError' });
});

test('CreateReservation - erreur si le membre est désactivé', async () => {
  const container = createTestContainer();
  await seedTable(container);

  const memberRepository = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  const member = Member.register('m-1', 'Alice', Email.create('a@b.fr'), 'hash-de-test');
  member.deactivate();
  await memberRepository.save(member);

  await expect(
    container.get(CreateReservation).execute({
      memberId: member.id,
      reservationDate: futureDate(2),
      startTime: futureDate(2),
      endTime: futureDate(4),
      guestCount: 2,
    }),
  ).rejects.toMatchObject({ name: 'MemberDeactivatedError' });
});

test('CreateReservation puis CancelReservation - publient les 4 événements', async () => {
  const container = createTestContainer();
  await seedTable(container);
  const memberId = await container
    .get(RegisterMember)
    .execute({ name: 'Alice', email: 'alice@restaurant.fr', password: 'motdepasse1' });

  const queue = container.get(InMemoryMessageQueue);
  const startTime = futureDate(2);

  const reservationId = await container.get(CreateReservation).execute({
    memberId,
    reservationDate: startTime,
    startTime,
    endTime: futureDate(4),
    guestCount: 2,
  });
  await container.get(CancelReservation).execute({ reservationId });

  const events = queue.all().map((message) => message.event);
  assert.instanceOf(events[0], MemberRegistered);
  assert.instanceOf(events[1], TableReserved);
  assert.instanceOf(events[2], ReservationConfirmed);
  assert.instanceOf(events[3], ReservationCancelled);
  assert.instanceOf(events[4], TableReleased);
  assert.equal((events[2] as ReservationConfirmed).memberId, memberId);
  assert.equal((events[3] as ReservationCancelled).memberId, memberId);
});

// ─── Use Case GetMemberReservations ────────────────────────────────────

test('GetMemberReservations - retourne uniquement les réservations du membre', async () => {
  const container = createTestContainer();
  await seedTable(container);
  const register = container.get(RegisterMember);
  const alice = await register.execute({ name: 'Alice', email: 'alice@restaurant.fr', password: 'motdepasse1' });
  const bob = await register.execute({ name: 'Bob', email: 'bob@restaurant.fr', password: 'motdepasse1' });

  const create = container.get(CreateReservation);
  await create.execute({
    memberId: alice,
    reservationDate: futureDate(5),
    startTime: futureDate(5),
    endTime: futureDate(6),
    guestCount: 2,
  });
  await create.execute({
    memberId: alice,
    reservationDate: futureDate(2),
    startTime: futureDate(2),
    endTime: futureDate(3),
    guestCount: 2,
  });
  await create.execute({
    memberId: bob,
    reservationDate: futureDate(8),
    startTime: futureDate(8),
    endTime: futureDate(9),
    guestCount: 2,
  });

  const reservations: Reservation[] = await container
    .get(GetMemberReservations)
    .execute({ memberId: alice });

  assert.equal(reservations.length, 2);
  assert.ok(reservations.every((reservation) => reservation.props.memberId === alice));
  // Triées par heure de début.
  assert.ok(reservations[0].props.startTime < reservations[1].props.startTime);
});

test('GetMemberReservations - erreur si le membre est inconnu', async () => {
  const container = createTestContainer();

  await expect(
    container.get(GetMemberReservations).execute({ memberId: 'inconnu' }),
  ).rejects.toMatchObject({ name: 'MemberNotFoundError' });
});
