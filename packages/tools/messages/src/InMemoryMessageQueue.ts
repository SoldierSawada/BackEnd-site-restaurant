import { DomainEvent } from 'ddd';

export type MessageStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface QueueMessage {
  id: number;
  type: string; // nom de la classe d'événement (ex: "MemberRegistered")
  event: DomainEvent;
  status: MessageStatus;
  createdAt: Date;
}

// La queue de messages. Dans le vrai monorepo Bootcode, c'est une table
// PostgreSQL (message_queue) : les événements survivent à un redémarrage du
// serveur. Ici, un simple tableau en mémoire — le mécanisme est identique.
export class InMemoryMessageQueue {
  private readonly messages: QueueMessage[] = [];
  private nextId = 1;

  insert(event: DomainEvent): void {
    this.messages.push({
      id: this.nextId++,
      type: event.constructor.name,
      event,
      status: 'PENDING',
      createdAt: new Date(),
    });
  }

  pending(): QueueMessage[] {
    return this.messages.filter((message) => message.status === 'PENDING');
  }

  markProcessed(id: number): void {
    this.setStatus(id, 'PROCESSED');
  }

  markFailed(id: number): void {
    this.setStatus(id, 'FAILED');
  }

  all(): QueueMessage[] {
    return [...this.messages];
  }

  private setStatus(id: number, status: MessageStatus): void {
    const message = this.messages.find((m) => m.id === id);
    if (message) {
      message.status = status;
    }
  }
}
