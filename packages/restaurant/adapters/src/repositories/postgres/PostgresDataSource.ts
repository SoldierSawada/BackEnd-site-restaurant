import { DataSource, DataSourceOptions } from 'typeorm';

import { ActivityLogEntity } from './entities/ActivityLogEntity';
import { BlogArticleEntity } from './entities/BlogArticleEntity';
import { MemberEntity } from './entities/MemberEntity';
import { MenuItemEntity } from './entities/MenuItemEntity';
import { ReservationEntity } from './entities/ReservationEntity';
import { ReviewEntity } from './entities/ReviewEntity';
import { SessionEntity } from './entities/SessionEntity';
import { TableEntity } from './entities/TableEntity';

export const POSTGRES_ENTITIES = [
  MemberEntity,
  ReservationEntity,
  TableEntity,
  ActivityLogEntity,
  ReviewEntity,
  BlogArticleEntity,
  MenuItemEntity,
  SessionEntity,
];

export interface PostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  // Crée / met à jour le schéma automatiquement (pratique en développement).
  synchronize: boolean;
  logging?: boolean;
}

export function createPostgresDataSource(config: PostgresConfig): DataSource {
  const options: DataSourceOptions = {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    synchronize: config.synchronize,
    logging: config.logging ?? false,
    entities: POSTGRES_ENTITIES,
  };

  return new DataSource(options);
}
