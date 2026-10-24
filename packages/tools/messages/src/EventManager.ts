import { DomainEvent, DomainEventHandler } from 'ddd';

type EventCtor<T extends DomainEvent> = new (...args: any[]) => T;
export type HandlerCtor<T extends DomainEvent> = new (...args: any[]) => DomainEventHandler<T>;

// L'annuaire des handlers : "quand cet événement arrive, exécute ces handlers".
// Un événement peut avoir PLUSIEURS handlers.
export class EventManager {
  private readonly registry = new Map<Function, HandlerCtor<any>[]>();

  register<T extends DomainEvent>(event: EventCtor<T>, handler: HandlerCtor<T>): this {
    const existing = this.registry.get(event) ?? [];
    this.registry.set(event, [...existing, handler]);
    return this;
  }

  handlersFor(event: DomainEvent): HandlerCtor<any>[] {
    return this.registry.get(event.constructor) ?? [];
  }
}
