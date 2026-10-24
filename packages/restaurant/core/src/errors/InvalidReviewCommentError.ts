import { DomainError } from 'ddd';

export class InvalidReviewCommentError extends DomainError {
  constructor(maxLength: number) {
    super(`Le commentaire ne peut pas dépasser ${maxLength} caractères.`);
  }
}
