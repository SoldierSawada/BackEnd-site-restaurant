import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { BlogArticleRepository } from '../repositories/BlogArticleRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { BlogArticleNotFoundError } from '../errors/BlogArticleNotFoundError';

export interface DeleteBlogArticleRequest {
  articleId: string;
}

@injectable()
export class DeleteBlogArticle implements Usecase<DeleteBlogArticleRequest, void> {
  constructor(
    @inject(BookingIdentifiers.blogArticleRepository)
    private readonly blogArticleRepository: BlogArticleRepository,
  ) {}

  async execute(request: DeleteBlogArticleRequest): Promise<void> {
    const article = await this.blogArticleRepository.findById(request.articleId);

    if (!article) {
      throw new BlogArticleNotFoundError(request.articleId);
    }

    await this.blogArticleRepository.delete(request.articleId);
  }
}
