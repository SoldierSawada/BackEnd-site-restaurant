import { InvalidEmailError } from '../errors/InvalidEmailError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Value Object : une adresse email valide, normalisée et immuable.
export class Email {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Email {
    if (typeof raw !== 'string') {
      throw new InvalidEmailError(String(raw));
    }

    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0 || !EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError(raw);
    }

    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
