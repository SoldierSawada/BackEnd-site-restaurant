import { DomainError } from 'ddd';

export class InvalidMenuItemError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
