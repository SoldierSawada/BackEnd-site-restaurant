import 'reflect-metadata';

import { assert, expect, test } from 'vitest';

import { CreateTable, SetTableActive, Table, TableNumberAlreadyUsedError, TableNotFoundError } from 'restaurant-core';
import { InMemoryTableRepository } from 'restaurant-adapters';

test('CreateTable - crée une table active et renvoie son identifiant', async () => {
  const repository = new InMemoryTableRepository();
  const createTable = new CreateTable(repository);

  const id = await createTable.execute({ number: 7, capacity: 4, location: 'Terrasse' });

  const saved = await repository.findById(id);
  assert.ok(saved);
  assert.equal(saved.number, 7);
  assert.equal(saved.capacity, 4);
  assert.equal(saved.location, 'Terrasse');
  assert.ok(saved.getIsActive());
});

test('CreateTable - refuse un numéro de table déjà utilisé', async () => {
  const repository = new InMemoryTableRepository();
  await repository.save(Table.init('t-1', 1, 2, 'Salle'));
  const createTable = new CreateTable(repository);

  await expect(createTable.execute({ number: 1, capacity: 2, location: 'Terrasse' })).rejects.toThrowError(
    TableNumberAlreadyUsedError,
  );
});

test('SetTableActive - désactive puis réactive une table', async () => {
  const repository = new InMemoryTableRepository();
  await repository.save(Table.init('t-1', 1, 2, 'Salle'));
  const setTableActive = new SetTableActive(repository);

  await setTableActive.execute({ tableId: 't-1', active: false });
  assert.notOk((await repository.findById('t-1'))?.getIsActive());

  await setTableActive.execute({ tableId: 't-1', active: true });
  assert.ok((await repository.findById('t-1'))?.getIsActive());
});

test('SetTableActive - table inconnue : TableNotFoundError', async () => {
  const setTableActive = new SetTableActive(new InMemoryTableRepository());

  await expect(setTableActive.execute({ tableId: 'absente', active: false })).rejects.toThrowError(
    TableNotFoundError,
  );
});
