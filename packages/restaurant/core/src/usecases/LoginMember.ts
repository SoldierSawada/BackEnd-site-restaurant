import { randomBytes } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Email } from '../ValueObject/Email';
import { MemberRepository } from '../repositories/MemberRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { PasswordHasher } from '../services/PasswordHasher';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { InvalidCredentialsError } from '../errors/InvalidCredentialsError';

export interface LoginMemberRequest {
  email: string;
  password: string;
}

export interface LoginMemberResult {
  token: string;
  memberId: string;
}

@injectable()
export class LoginMember implements Usecase<LoginMemberRequest, LoginMemberResult> {
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.sessionRepository)
    private readonly sessionRepository: SessionRepository,

    @inject(BookingIdentifiers.passwordHasher)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(request: LoginMemberRequest): Promise<LoginMemberResult> {
    const email = Email.create(request.email);
    const member = await this.memberRepository.findByEmail(email);

    if (!member) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.verify(request.password, member.getPasswordHash());

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = randomBytes(32).toString('hex');

    await this.sessionRepository.save({ token, memberId: member.id, createdAt: new Date() });

    return { token, memberId: member.id };
  }
}
