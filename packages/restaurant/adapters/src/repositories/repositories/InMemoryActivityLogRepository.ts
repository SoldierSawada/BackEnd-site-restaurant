import { injectable } from 'inversify';
import { ActivityLog, ActivityLogPageResult, ActivityLogRepository } from 'restaurant-core';

@injectable()
export class InMemoryActivityLogRepository implements ActivityLogRepository {
  private readonly items = new Map<string, ActivityLog>();

  async save(log: ActivityLog): Promise<void> {
    this.items.set(log.id, log);
  }

  async findAll(): Promise<ActivityLog[]> {
    return this.sortedNewestFirst();
  }

  async findPage(offset: number, limit: number): Promise<ActivityLogPageResult> {
    const sorted = this.sortedNewestFirst();
    return { items: sorted.slice(offset, offset + limit), total: sorted.length };
  }

  private sortedNewestFirst(): ActivityLog[] {
    return [...this.items.values()].sort(
      (a, b) =>
        b.props.createdAt.getTime() - a.props.createdAt.getTime() ||
        (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
    );
  }
}
