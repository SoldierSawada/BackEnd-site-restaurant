import { DomainError } from 'ddd';

export class BlogArticleNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Aucun article ne correspond à l'identifiant ${id}`);
  }
}
