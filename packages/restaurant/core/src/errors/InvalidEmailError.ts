import { DomainError } from 'ddd';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`L'adresse email est invalide : "${email}"`);
  }
}
