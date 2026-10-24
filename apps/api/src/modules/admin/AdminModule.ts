import { Container } from 'inversify';
import { AdminController } from './AdminController';

export class AdminModule {
  configure(container: Container): void {
    container.bind(AdminController).toSelf();
  }
}
