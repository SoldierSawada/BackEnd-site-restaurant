import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { BlogArticle, BlogArticleInput } from '../aggregates/BlogArticle';
import { BlogArticleRepository } from '../repositories/BlogArticleRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

@injectable()
export class CreateBlogArticle implements Usecase<BlogArticleInput, BlogArticle> {
  constructor(
    @inject(BookingIdentifiers.blogArticleRepository)
    private readonly blogArticleRepository: BlogArticleRepository,
  ) {}

  async execute(request: BlogArticleInput): Promise<BlogArticle> {
    const article = BlogArticle.create(request);
    await this.blogArticleRepository.save(article);
    return article;
  }
}
