import { injectable } from 'inversify';
import { Session, SessionRepository } from 'restaurant-core';

@injectable()
export class InMemorySessionRepository implements SessionRepository {
  private readonly items = new Map<string, Session>();

  async save(session: Session): Promise<void> {
    this.items.set(session.token, session);
  }

  async findByToken(token: string): Promise<Session | null> {
    return this.items.get(token) ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    this.items.delete(token);
  }
}
