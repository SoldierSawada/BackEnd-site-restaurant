import { AggregateRoot } from 'ddd';
import { MemberRegistered } from 'restaurant-messages';

import { Email } from '../ValueObject/Email';
import { InvalidMemberNameError } from '../errors/InvalidMemberNameError';

export type MemberStatus = 'ACTIVE' | 'DEACTIVATED';

// MEMBER : client du restaurant. ADMIN : responsable d'établissement.
export type MemberRole = 'MEMBER' | 'ADMIN';

export interface MemberProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  status: MemberStatus;
  role: MemberRole;
}

export class Member extends AggregateRoot {
  readonly id: string;
  readonly email: Email;
  private passwordHash: string;
  private name: string;
  private status: MemberStatus;
  private role: MemberRole;

  private constructor(props: MemberProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.status = props.status;
    this.role = props.role;
  }

  // Inscription d'un nouveau membre : statut ACTIVE, rôle MEMBER, produit MemberRegistered.
  static register(id: string, name: string, email: Email, passwordHash: string): Member {
    const member = new Member({
      id,
      name: Member.validateName(name),
      email,
      passwordHash,
      status: 'ACTIVE',
      role: 'MEMBER',
    });

    member.recordEvent(new MemberRegistered(member.id, member.name, member.email.value));

    return member;
  }

  // Reconstruction depuis la persistance : aucun événement produit.
  static reconstitute(props: MemberProps): Member {
    return new Member(props);
  }

  rename(newName: string): void {
    this.name = Member.validateName(newName);
  }

  // Idempotent : désactiver un membre déjà désactivé ne change rien.
  deactivate(): void {
    this.status = 'DEACTIVATED';
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  getName(): string {
    return this.name;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getEmail(): string {
    return this.email.value;
  }

  changePasswordHash(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
  }

  getStatus(): MemberStatus {
    return this.status;
  }

  getRole(): MemberRole {
    return this.role;
  }

  private static validateName(name: string): string {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (trimmed.length === 0) {
      throw new InvalidMemberNameError();
    }
    return trimmed;
  }
}
