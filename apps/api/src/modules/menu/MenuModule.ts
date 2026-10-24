import { Container } from 'inversify';
import { MenuController } from './MenuController';

export class MenuModule {
  configure(container: Container): void {
    container.bind(MenuController).toSelf();
  }
}
