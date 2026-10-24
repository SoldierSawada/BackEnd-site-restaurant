import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { BlogArticle } from '../aggregates/BlogArticle';
import { BlogArticleRepository } from '../repositories/BlogArticleRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

@injectable()
export class ListBlogArticles implements Usecase<void, BlogArticle[]> {
  constructor(
    @inject(BookingIdentifiers.blogArticleRepository)
    private readonly blogArticleRepository: BlogArticleRepository,
  ) {}

  async execute(): Promise<BlogArticle[]> {
    return this.blogArticleRepository.findAll();
  }
}
