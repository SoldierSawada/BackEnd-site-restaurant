import { Table } from '../aggregates/Table';

export interface TablePageResult {
  items: Table[];
  total: number;
}

export interface TableRepository {
  save(table: Table): Promise<void>;
  findById(id: string): Promise<Table | null>;
  findAll(): Promise<Table[]>;
  findPage(offset: number, limit: number): Promise<TablePageResult>;
  findAvailable(
    startTime: Date,
    endTime: Date,
    guestCount: number,
  ): Promise<Table[]>;
}
