import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { ActivityLog } from '../aggregates/ActivityLog';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface RecordActivityRequest {
  action: string;
  memberId: string;
  details: string;
}

@injectable()
export class RecordActivity implements Usecase<RecordActivityRequest, void> {
  constructor(
    @inject(BookingIdentifiers.activityLogRepository)
    private readonly activityLogRepository: ActivityLogRepository,
  ) {}

  async execute(request: RecordActivityRequest): Promise<void> {
    const log = ActivityLog.create(request.action, request.memberId, request.details);
    await this.activityLogRepository.save(log);
  }
}
