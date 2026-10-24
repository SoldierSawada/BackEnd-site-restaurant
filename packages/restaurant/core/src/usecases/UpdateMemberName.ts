import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { MemberRepository } from '../repositories/MemberRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { MemberNotFoundError } from '../errors/MemberNotFoundError';

export interface UpdateMemberNameRequest {
  memberId: string;
  name: string;
}

export interface UpdateMemberNameResult {
  id: string;
  name: string;
}

@injectable()
export class UpdateMemberName implements Usecase<UpdateMemberNameRequest, UpdateMemberNameResult> {
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(request: UpdateMemberNameRequest): Promise<UpdateMemberNameResult> {
    const member = await this.memberRepository.findById(request.memberId);

    if (!member) {
      throw new MemberNotFoundError(request.memberId);
    }

    member.rename(request.name);
    await this.memberRepository.save(member);

    return { id: member.id, name: member.getName() };
  }
}
