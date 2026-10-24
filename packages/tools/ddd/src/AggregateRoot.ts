import { DomainEvent } from './DomainEvent';

// Racine d'agrégat : point d'entrée unique de l'agrégat.
// Elle enregistre les événements produits par ses actions ; l'EventDispatcher
// les récupère avec pullEvents() puis les publie dans la queue de messages.
export abstract class AggregateRoot {
  private events: DomainEvent[] = [];

  protected recordEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this.events];
    this.events = [];
    return events;
  }
}

