import { DomainEvent } from './DomainEvent';


export interface DomainEventHandler<T extends DomainEvent> {
  handle(domainEvent: T): Promise<void>;
}
