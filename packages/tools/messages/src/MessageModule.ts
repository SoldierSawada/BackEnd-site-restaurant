import { Container } from 'inversify';
import { EventManager } from './EventManager';
import { InMemoryMessageQueue } from './InMemoryMessageQueue';

// Poll la queue toutes les 3 secondes et route chaque message vers ses
// handlers via l'EventManager. Même mécanique que le vrai monorepo Bootcode,
// où la queue est une table PostgreSQL.
export class MessageModule {
  private readonly eventManager = new EventManager();
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly container: Container,
    private readonly queue: InMemoryMessageQueue,
  ) {}

  // Chaque Module de l'application enregistre ici ses handlers :
  //   messageModule.register((em) => NotificationModule.configureHandler(em))
  async register(cb: (em: EventManager) => void): Promise<void> {
    cb(this.eventManager);
  }

  start(pollIntervalMs = 3000): void {
    this.timer = setInterval(() => void this.poll(), pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async poll(): Promise<void> {
    for (const message of this.queue.pending()) {
      try {
        for (const handlerClass of this.eventManager.handlersFor(message.event)) {
          // Le handler est créé par le container : il reçoit ses dépendances.
          await this.container.get(handlerClass).handle(message.event);
        }
        this.queue.markProcessed(message.id);
      } catch (error) {
        console.error(`[events] échec du traitement de ${message.type}`, error);
        this.queue.markFailed(message.id);
      }
    }
  }
}
