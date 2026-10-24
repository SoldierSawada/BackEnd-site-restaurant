import { Email, Member } from 'restaurant-core';
import { MemberEntity } from '../entities/MemberEntity';

export class MemberMapper {
  static toEntity(domain: Member): MemberEntity {
    const entity = new MemberEntity();
    entity.id = domain.id;
    entity.name = domain.getName();
    entity.email = domain.email.value;
    entity.passwordHash = domain.getPasswordHash();
    entity.status = domain.getStatus();
    entity.role = domain.getRole();
    return entity;
  }

  static toDomain(entity: MemberEntity): Member {
    return Member.reconstitute({
      id: entity.id,
      name: entity.name,
      email: Email.create(entity.email),
      passwordHash: entity.passwordHash,
      status: entity.status,
      role: entity.role,
    });
  }
}
