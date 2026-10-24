import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { MemberRepository } from '../repositories/MemberRepository';
import { PasswordHasher } from '../services/PasswordHasher';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { MemberNotFoundError } from '../errors/MemberNotFoundError';
import { CurrentPasswordIncorrectError } from '../errors/CurrentPasswordIncorrectError';
import { WeakPasswordError } from '../errors/WeakPasswordError';
import { minPasswordLength } from './RegisterMember';

export interface ChangeMemberPasswordRequest {
  memberId: string;
  currentPassword: string;
  newPassword: string;
}

@injectable()
export class ChangeMemberPassword implements Usecase<ChangeMemberPasswordRequest, void> {
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.passwordHasher)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(request: ChangeMemberPasswordRequest): Promise<void> {
    const member = await this.memberRepository.findById(request.memberId);

    if (!member) {
      throw new MemberNotFoundError(request.memberId);
    }

    const isCurrentValid = await this.passwordHasher.verify(
      request.currentPassword,
      member.getPasswordHash(),
    );

    if (!isCurrentValid) {
      throw new CurrentPasswordIncorrectError();
    }

    if (request.newPassword.length < minPasswordLength) {
      throw new WeakPasswordError(minPasswordLength);
    }

    member.changePasswordHash(await this.passwordHasher.hash(request.newPassword));
    await this.memberRepository.save(member);
  }
}
