import { randomUUID } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { EventDispatcher, Usecase } from 'ddd';

import { Member } from '../aggregates/Member';
import { Email } from '../ValueObject/Email';
import { MemberRepository } from '../repositories/MemberRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { EmailAlreadyUsedError } from '../errors/EmailAlreadyUsedError';
import { WeakPasswordError } from '../errors/WeakPasswordError';
import { PasswordHasher } from '../services/PasswordHasher';

export const minPasswordLength = 8;

export interface RegisterMemberRequest {
  name: string;
  email: string;
  password: string;
}

@injectable()
export class RegisterMember implements Usecase<RegisterMemberRequest, string> {
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.passwordHasher)
    private readonly passwordHasher: PasswordHasher,

    @inject(EventDispatcher)
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute(request: RegisterMemberRequest): Promise<string> {
    const email = Email.create(request.email);

    if (request.password.length < minPasswordLength) {
      throw new WeakPasswordError(minPasswordLength);
    }

    const existing = await this.memberRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyUsedError(email.value);
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const member = Member.register(randomUUID(), request.name, email, passwordHash);

    await this.memberRepository.save(member);
    await this.eventDispatcher.dispatch(member);

    return member.id;
  }
}
