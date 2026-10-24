import { DomainError } from 'ddd';

export class InvalidGuestContactError extends DomainError {
  constructor() {
    super('Le nom et le téléphone du visiteur sont obligatoires, et le téléphone doit être valide.');
  }
}
