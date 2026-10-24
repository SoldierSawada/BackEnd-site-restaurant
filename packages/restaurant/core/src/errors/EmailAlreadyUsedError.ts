import { DomainError } from 'ddd';

export class EmailAlreadyUsedError extends DomainError {
  constructor(email: string) {
    super(`L'adresse email ${email} est déjà utilisée par un autre membre`);
  }
}
