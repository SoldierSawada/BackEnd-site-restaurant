import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Reservation } from '../aggregates/Reservation';
import { MemberRepository } from '../repositories/MemberRepository';
import { ReservationRepository } from '../repositories/ReservationRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { MemberNotFoundError } from '../errors/MemberNotFoundError';

export interface GetMemberReservationsRequest {
  memberId: string;
}

@injectable()
export class GetMemberReservations
  implements Usecase<GetMemberReservationsRequest, Reservation[]>
{
  constructor(
    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.reservationRepository)
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute(request: GetMemberReservationsRequest): Promise<Reservation[]> {
    const member = await this.memberRepository.findById(request.memberId);
    if (!member) {
      throw new MemberNotFoundError(request.memberId);
    }

    return this.reservationRepository.findByMemberId(member.id);
  }
}
