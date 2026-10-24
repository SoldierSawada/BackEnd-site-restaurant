import { DomainError } from 'ddd';

export class InvalidReviewReplyError extends DomainError {
  constructor(maxLength: number) {
    super(`La réponse doit contenir entre 1 et ${maxLength} caractères.`);
  }
}
