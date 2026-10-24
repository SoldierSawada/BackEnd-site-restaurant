import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Member } from '../aggregates/Member';
import { MemberRepository } from '../repositories/MemberRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { MemberNotFoundError } from '../errors/MemberNotFoundError';

export interface GetMemberRequest {
  memberId: string;
}

@injectable()
export class GetMember implements Usecase<GetMemberRequest, Member> {
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(request: GetMemberRequest): Promise<Member> {
    const member = await this.memberRepository.findById(request.memberId);

    if (!member) {
      throw new MemberNotFoundError(request.memberId);
    }

    return member;
  }
}
