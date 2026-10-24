import { PostgresConfig } from 'restaurant-adapters';

export type PersistenceMode = 'memory' | 'postgres';

// DB_TYPE=postgres → PostgreSQL via TypeORM ; sinon (par défaut) → stockage en mémoire.
export function persistenceModeFromEnv(env: NodeJS.ProcessEnv = process.env): PersistenceMode {
  return env.DB_TYPE === 'postgres' ? 'postgres' : 'memory';
}

export function postgresConfigFromEnv(env: NodeJS.ProcessEnv = process.env): PostgresConfig {
  return {
    host: env.DB_HOST ?? 'localhost',
    port: env.DB_PORT ? Number(env.DB_PORT) : 5432,
    username: env.DB_USERNAME ?? 'restaurant',
    password: env.DB_PASSWORD ?? 'restaurant',
    database: env.DB_NAME ?? 'restaurant',
    synchronize: env.DB_SYNCHRONIZE !== 'false',
    logging: env.DB_LOGGING === 'true',
  };
}
