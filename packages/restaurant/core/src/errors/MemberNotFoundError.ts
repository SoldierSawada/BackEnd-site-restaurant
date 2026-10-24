import { DomainError } from 'ddd';

export class MemberNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Membre introuvable : ${id}`);
  }
}
