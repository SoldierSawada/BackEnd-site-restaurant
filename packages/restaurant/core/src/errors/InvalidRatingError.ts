import { DomainError } from 'ddd';

export class InvalidRatingError extends DomainError {
  constructor(rating: number) {
    super(`La note doit être un entier entre 1 et 5 (reçu : ${rating})`);
  }
}
