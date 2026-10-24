import { DomainEvent } from 'ddd';

export class MemberRegistered implements DomainEvent {
  readonly occurredOn = new Date();

  constructor(
    readonly memberId: string,
    readonly name: string,
    readonly email: string,
  ) {}
}
