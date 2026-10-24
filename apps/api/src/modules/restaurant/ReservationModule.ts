import { Container } from 'inversify';
import { ReservationController } from './ReservationController';

export class ReservationModule {
  configure(container: Container): void {
    container.bind(ReservationController).toSelf();
  }
}
