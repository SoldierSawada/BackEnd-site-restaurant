import { DomainError } from 'ddd';

export class CurrentPasswordIncorrectError extends DomainError {
  constructor() {
    super('Le mot de passe actuel est incorrect.');
  }
}
