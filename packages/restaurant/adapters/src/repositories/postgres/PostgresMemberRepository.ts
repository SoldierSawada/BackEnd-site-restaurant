import { inject, injectable } from 'inversify';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Email, EmailAlreadyUsedError, Member, MemberRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { MemberEntity } from './entities/MemberEntity';
import { MemberMapper } from './mappers/MemberMapper';

const UNIQUE_VIOLATION = '23505';

@injectable()
export class PostgresMemberRepository implements MemberRepository {
  private readonly repository: Repository<MemberEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(MemberEntity);
  }

  async save(member: Member): Promise<void> {
    try {
      await this.repository.save(MemberMapper.toEntity(member));
    } catch (error) {
      // Deux inscriptions simultanées avec le même email : la contrainte UNIQUE tranche.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === UNIQUE_VIOLATION
      ) {
        throw new EmailAlreadyUsedError(member.email.value);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Member | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Member[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => MemberMapper.toDomain(entity));
  }

  async findByEmail(email: Email): Promise<Member | null> {
    const entity = await this.repository.findOneBy({ email: email.value });
    return entity ? MemberMapper.toDomain(entity) : null;
  }
}
