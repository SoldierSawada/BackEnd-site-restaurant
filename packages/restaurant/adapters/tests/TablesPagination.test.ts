import 'reflect-metadata';

import { beforeEach, describe, expect, test } from 'vitest';
import { Container } from 'inversify';

import { CreateTable, ListTablesPage } from 'restaurant-core';
import { Build } from 'restaurant-adapters';

describe('Pagination des tables (admin)', () => {
  let container: Container;

  beforeEach(async () => {
    container = new Container();
    Build.load(container);
    const create = container.get(CreateTable);
    for (let number = 1; number <= 5; number++) {
      await create.execute({ number, capacity: 2, location: 'Salle' });
    }
  });

  test('chaque page contient pageSize tables, triées par numéro', async () => {
    const list = container.get(ListTablesPage);
    const first = await list.execute({ page: 1, pageSize: 2 });
    const last = await list.execute({ page: 3, pageSize: 2 });

    expect(first.items.map((table) => table.number)).toEqual([1, 2]);
    expect(last.items.map((table) => table.number)).toEqual([5]);
    expect(first.total).toBe(5);
    expect(first.totalPages).toBe(3);
  });

  test('une page au-delà de la fin est vide', async () => {
    const result = await container.get(ListTablesPage).execute({ page: 9, pageSize: 2 });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(5);
  });
});
