import { inject, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { Session, SessionRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { SessionEntity } from './entities/SessionEntity';

@injectable()
export class PostgresSessionRepository implements SessionRepository {
  private readonly repository: Repository<SessionEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(SessionEntity);
  }

  async save(session: Session): Promise<void> {
    await this.repository.save({
      token: session.token,
      memberId: session.memberId,
      createdAt: session.createdAt,
    });
  }

  async findByToken(token: string): Promise<Session | null> {
    const entity = await this.repository.findOneBy({ token });

    if (!entity) {
      return null;
    }

    return { token: entity.token, memberId: entity.memberId, createdAt: entity.createdAt };
  }

  async deleteByToken(token: string): Promise<void> {
    await this.repository.delete({ token });
  }
}
