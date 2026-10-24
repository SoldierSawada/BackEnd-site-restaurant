import { Container } from 'inversify';
import { BlogController } from './BlogController';

export class BlogModule {
  configure(container: Container): void {
    container.bind(BlogController).toSelf();
  }
}
