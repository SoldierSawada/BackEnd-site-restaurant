import { Container } from 'inversify';
import { MemberController } from './MemberController';

export class MemberModule {
  configure(container: Container): void {
    container.bind(MemberController).toSelf();
  }
}
