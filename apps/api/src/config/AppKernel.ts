import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { EventDispatcher } from 'ddd';
import { Build, createPostgresDataSource } from 'restaurant-adapters';
import {
  BookingIdentifiers,
  Table,
  TableRepository,
} from 'restaurant-core';

import { persistenceModeFromEnv, postgresConfigFromEnv } from './Database';

const INITIAL_TABLES: Array<[id: string, number: number, capacity: number, location: string]> = [
  ['table-1', 1, 4, 'Salle principale'],
  ['table-2', 2, 6, 'Salle principale'],
  ['table-3', 3, 2, 'Terrasse'],
];

export class AppKernel {
  private readonly container = new Container();
  private dataSource?: DataSource;

  async setup(): Promise<Container> {
    if (persistenceModeFromEnv() === 'postgres') {
      this.dataSource = createPostgresDataSource(postgresConfigFromEnv());
      await this.dataSource.initialize();
    }

    Build.load(this.container, { dataSource: this.dataSource });

    const tableRepository = this.container.get<TableRepository>(
      BookingIdentifiers.tableRepository,
    );

    // Tables initiales : créées seulement si elles n'existent pas encore
    // (sinon un redémarrage avec PostgreSQL effacerait leurs créneaux occupés).
    for (const [id, number, capacity, location] of INITIAL_TABLES) {
      if (!(await tableRepository.findById(id))) {
        await tableRepository.save(Table.init(id, number, capacity, location));
      }
    }

    this.container.get(EventDispatcher);

    return this.container;
  }

  async shutdown(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
