import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';
import { Table } from '../aggregates/Table';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { InvalidGuestCountError } from '../errors/InvalidGuestCountError';
import { InvalidTimeSlotError } from '../errors/InvalidTimeSlotError';

export interface ListAvailableTablesRequest {
  reservationDate: Date;
  startTime: Date;
  endTime: Date;
  guestCount: number;
}

@injectable()
export class ListAvailableTables implements Usecase<ListAvailableTablesRequest, Table[]> {
  constructor(
    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,
  ) {}

  async execute(request: ListAvailableTablesRequest): Promise<Table[]> {
    if (!Number.isInteger(request.guestCount) || request.guestCount <= 0) {
      throw new InvalidGuestCountError(request.guestCount);
    }

    if (request.endTime <= request.startTime) {
      throw new InvalidTimeSlotError(request.startTime, request.endTime);
    }

    return this.tableRepository.findAvailable(
      request.startTime,
      request.endTime,
      request.guestCount,
    );
  }
}
