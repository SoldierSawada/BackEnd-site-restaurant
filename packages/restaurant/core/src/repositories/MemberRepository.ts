import { Member } from '../aggregates/Member';
import { Email } from '../ValueObject/Email';

export interface MemberRepository {
  save(member: Member): Promise<void>;
  findById(id: string): Promise<Member | null>;
  findByEmail(email: Email): Promise<Member | null>;
  findAll(): Promise<Member[]>;
}
