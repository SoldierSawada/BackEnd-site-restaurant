import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { SessionRepository } from '../repositories/SessionRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface LogoutMemberRequest {
  token: string;
}

@injectable()
export class LogoutMember implements Usecase<LogoutMemberRequest, void> {
  constructor(
    @inject(BookingIdentifiers.sessionRepository)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(request: LogoutMemberRequest): Promise<void> {
    await this.sessionRepository.deleteByToken(request.token);
  }
}
