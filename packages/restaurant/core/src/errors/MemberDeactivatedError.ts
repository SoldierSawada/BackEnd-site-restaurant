import { DomainError } from 'ddd';

export class MemberDeactivatedError extends DomainError {
  constructor(id: string) {
    super(`Le membre ${id} est désactivé et ne peut plus effectuer de réservation`);
  }
}
