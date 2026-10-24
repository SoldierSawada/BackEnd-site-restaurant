import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { BlogArticle } from '../aggregates/BlogArticle';
import { BlogArticleRepository } from '../repositories/BlogArticleRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { BlogArticleNotFoundError } from '../errors/BlogArticleNotFoundError';

export interface GetBlogArticleRequest {
  articleId: string;
}

@injectable()
export class GetBlogArticle implements Usecase<GetBlogArticleRequest, BlogArticle> {
  constructor(
    @inject(BookingIdentifiers.blogArticleRepository)
    private readonly blogArticleRepository: BlogArticleRepository,
  ) {}

  async execute(request: GetBlogArticleRequest): Promise<BlogArticle> {
    const article = await this.blogArticleRepository.findById(request.articleId);

    if (!article) {
      throw new BlogArticleNotFoundError(request.articleId);
    }

    article.recordView();
    await this.blogArticleRepository.save(article);

    return article;
  }
}
