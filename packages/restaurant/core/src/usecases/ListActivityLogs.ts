import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { ActivityLog } from '../aggregates/ActivityLog';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface ListActivityLogsRequest {
  page: number;
  pageSize: number;
}

export interface ActivityLogPage {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@injectable()
export class ListActivityLogs implements Usecase<ListActivityLogsRequest, ActivityLogPage> {
  constructor(
    @inject(BookingIdentifiers.activityLogRepository)
    private readonly activityLogRepository: ActivityLogRepository,
  ) {}

  async execute(request: ListActivityLogsRequest): Promise<ActivityLogPage> {
    const offset = (request.page - 1) * request.pageSize;
    const { items, total } = await this.activityLogRepository.findPage(offset, request.pageSize);

    return {
      items,
      total,
      page: request.page,
      pageSize: request.pageSize,
      totalPages: Math.max(1, Math.ceil(total / request.pageSize)),
    };
  }
}
