import { DomainError } from 'ddd';

export class InvalidArticleError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
