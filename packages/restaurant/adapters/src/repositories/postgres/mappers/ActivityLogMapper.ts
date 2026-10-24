import { ActivityLog } from 'restaurant-core';
import { ActivityLogEntity } from '../entities/ActivityLogEntity';

export class ActivityLogMapper {
  static toEntity(domain: ActivityLog): ActivityLogEntity {
    const entity = new ActivityLogEntity();
    entity.id = domain.props.id;
    entity.memberId = domain.props.memberId;
    entity.action = domain.props.action;
    entity.details = domain.props.details;
    entity.createdAt = domain.props.createdAt;
    return entity;
  }

  static toDomain(entity: ActivityLogEntity): ActivityLog {
    return ActivityLog.reconstitute({
      id: entity.id,
      memberId: entity.memberId,
      action: entity.action,
      details: entity.details,
      createdAt: new Date(entity.createdAt),
    });
  }
}
