import { DomainError } from 'ddd';

export class WeakPasswordError extends DomainError {
  constructor(minLength: number) {
    super(`Le mot de passe doit contenir au moins ${minLength} caractères.`);
  }
}
