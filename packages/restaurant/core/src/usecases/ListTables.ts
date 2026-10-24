import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Table } from '../aggregates/Table';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

@injectable()
export class ListTables implements Usecase<void, Table[]> {
  constructor(
    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,
  ) {}

  async execute(): Promise<Table[]> {
    return this.tableRepository.findAll();
  }
}
