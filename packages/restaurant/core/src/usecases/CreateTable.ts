import { randomUUID } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Table } from '../aggregates/Table';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { TableNumberAlreadyUsedError } from '../errors/TableNumberAlreadyUsedError';

export interface CreateTableRequest {
  number: number;
  capacity: number;
  location: string;
}

@injectable()
export class CreateTable implements Usecase<CreateTableRequest, string> {
  constructor(
    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,
  ) {}

  async execute(request: CreateTableRequest): Promise<string> {
    const tables = await this.tableRepository.findAll();

    if (tables.some((table) => table.number === request.number)) {
      throw new TableNumberAlreadyUsedError(request.number);
    }

    const table = Table.init(randomUUID(), request.number, request.capacity, request.location);

    await this.tableRepository.save(table);

    return table.id;
  }
}
