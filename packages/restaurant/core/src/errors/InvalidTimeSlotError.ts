import { DomainError } from 'ddd';

export class InvalidTimeSlotError extends DomainError {
  constructor(startTime: Date, endTime: Date) {
    super(`Le créneau est invalide : la fin (${endTime.toISOString()}) doit être après le début (${startTime.toISOString()})`);
  }
}
