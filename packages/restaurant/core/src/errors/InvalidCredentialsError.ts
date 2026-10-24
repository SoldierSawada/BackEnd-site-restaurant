import { DomainError } from 'ddd';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Email ou mot de passe incorrect.');
  }
}
