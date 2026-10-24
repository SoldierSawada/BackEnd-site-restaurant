import 'reflect-metadata';

import { beforeEach, describe, expect, test } from 'vitest';
import { Container } from 'inversify';

import { ListActivityLogs, RecordActivity } from 'restaurant-core';
import { Build } from 'restaurant-adapters';

describe('Pagination du journal', () => {
  let container: Container;

  beforeEach(async () => {
    container = new Container();
    Build.load(container);
    const record = container.get(RecordActivity);
    for (let index = 1; index <= 5; index++) {
      await record.execute({ action: 'TABLE_CREATED', memberId: 'admin', details: `Table ${index}` });
    }
  });

  test('la première page contient pageSize entrées et le total global', async () => {
    const result = await container.get(ListActivityLogs).execute({ page: 1, pageSize: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  test('la dernière page contient le reste, sans doublon avec la précédente', async () => {
    const list = container.get(ListActivityLogs);
    const first = await list.execute({ page: 1, pageSize: 2 });
    const second = await list.execute({ page: 2, pageSize: 2 });
    const last = await list.execute({ page: 3, pageSize: 2 });

    expect(last.items).toHaveLength(1);
    const ids = [...first.items, ...second.items, ...last.items].map((log) => log.id);
    expect(new Set(ids).size).toBe(5);
  });

  test('une page au-delà de la fin renvoie une liste vide', async () => {
    const result = await container.get(ListActivityLogs).execute({ page: 9, pageSize: 2 });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(5);
  });

  test('un journal vide a au moins une page', async () => {
    const empty = new Container();
    Build.load(empty);
    const result = await empty.get(ListActivityLogs).execute({ page: 1, pageSize: 10 });

    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });
});
