import { injectable } from 'inversify';
import { Email, Member, MemberRepository } from 'restaurant-core';

@injectable()
export class InMemoryMemberRepository implements MemberRepository {
  private readonly items = new Map<string, Member>();

  async save(member: Member): Promise<void> {
    this.items.set(member.id, member);
  }

  async findById(id: string): Promise<Member | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<Member[]> {
    return [...this.items.values()];
  }

  async findByEmail(email: Email): Promise<Member | null> {
    return [...this.items.values()].find((member) => member.email.equals(email)) ?? null;
  }
}
