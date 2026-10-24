import { Container } from 'inversify';
import { ReviewController } from './ReviewController';

export class ReviewModule {
  configure(container: Container): void {
    container.bind(ReviewController).toSelf();
  }
}
