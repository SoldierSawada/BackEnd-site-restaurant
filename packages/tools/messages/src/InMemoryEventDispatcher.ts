import { AggregateRoot, DomainEvent, EventDispatcher } from 'ddd';
import { InMemoryMessageQueue } from './InMemoryMessageQueue';

// Publie les événements dans la queue — PAS directement aux handlers.
// (Bootcode : PostgresEventRepository fait un INSERT INTO message_queue.)
// Le MessageModule les récupérera par polling pour les router.
export class InMemoryEventDispatcher extends EventDispatcher {
  constructor(private readonly queue: InMemoryMessageQueue) {
    super();
  }

  async dispatch(aggregate: AggregateRoot): Promise<void> {
    for (const event of aggregate.pullEvents()) {
      await this.dispatchEvent(event);
    }
  }

  async dispatchEvent(event: DomainEvent): Promise<void> {
    this.queue.insert(event);
  }
}
