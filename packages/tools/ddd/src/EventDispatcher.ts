import { injectable } from 'inversify';
import { AggregateRoot } from './AggregateRoot';
import { DomainEvent } from './DomainEvent';


@injectable()
export abstract class EventDispatcher {
  abstract dispatch(aggregate: AggregateRoot): Promise<void>;
  abstract dispatchEvent(event: DomainEvent): Promise<void>;
}
