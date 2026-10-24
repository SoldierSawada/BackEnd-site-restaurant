import { ActivityLog } from '../aggregates/ActivityLog';

export interface ActivityLogPageResult {
  items: ActivityLog[];
  total: number;
}

export interface ActivityLogRepository {
  save(log: ActivityLog): Promise<void>;
  findAll(): Promise<ActivityLog[]>;
  findPage(offset: number, limit: number): Promise<ActivityLogPageResult>;
}
