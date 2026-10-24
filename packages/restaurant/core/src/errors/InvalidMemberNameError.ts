import { DomainError } from 'ddd';

export class InvalidMemberNameError extends DomainError {
  constructor() {
    super(`Le nom du membre ne doit pas être vide`);
  }
}
