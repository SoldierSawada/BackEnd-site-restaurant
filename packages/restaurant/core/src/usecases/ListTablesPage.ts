import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Table } from '../aggregates/Table';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface ListTablesPageRequest {
  page: number;
  pageSize: number;
}

export interface TablePage {
  items: Table[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@injectable()
export class ListTablesPage implements Usecase<ListTablesPageRequest, TablePage> {
  constructor(
    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,
  ) {}

  async execute(request: ListTablesPageRequest): Promise<TablePage> {
    const offset = (request.page - 1) * request.pageSize;
    const { items, total } = await this.tableRepository.findPage(offset, request.pageSize);

    return {
      items,
      total,
      page: request.page,
      pageSize: request.pageSize,
      totalPages: Math.max(1, Math.ceil(total / request.pageSize)),
    };
  }
}
