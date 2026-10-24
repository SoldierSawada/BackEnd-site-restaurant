import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Table } from '../aggregates/Table';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { TableNotFoundError } from '../errors/TableNotFoundError';

export interface SetTableActiveRequest {
  tableId: string;
  active: boolean;
}

@injectable()
export class SetTableActive implements Usecase<SetTableActiveRequest, Table> {
  constructor(
    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,
  ) {}

  async execute(request: SetTableActiveRequest): Promise<Table> {
    const table = await this.tableRepository.findById(request.tableId);

    if (!table) {
      throw new TableNotFoundError(request.tableId);
    }

    if (request.active) {
      table.activate();
    } else {
      table.deactivate();
    }

    await this.tableRepository.save(table);

    return table;
  }
}
