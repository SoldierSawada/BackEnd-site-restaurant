import { randomUUID } from 'node:crypto';

export interface ActivityLogProps {
  id: string;
  action: string;
  memberId: string;
  details: string;
  createdAt: Date;
}

export class ActivityLog {
  private constructor(readonly props: ActivityLogProps) {}

  static create(action: string, memberId: string, details: string, now: Date = new Date()): ActivityLog {
    return new ActivityLog({ id: randomUUID(), action, memberId, details, createdAt: now });
  }

  static reconstitute(props: ActivityLogProps): ActivityLog {
    return new ActivityLog(props);
  }

  get id(): string {
    return this.props.id;
  }
}
