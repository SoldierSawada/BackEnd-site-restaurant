import { Get, JsonController, Param } from 'routing-controllers';
import { inject, injectable } from 'inversify';
import { BlogArticle, GetBlogArticle, ListBlogArticles } from 'restaurant-core';

export function toBlogArticleResponse(article: BlogArticle) {
  return {
    id: article.props.id,
    title: article.props.title,
    category: article.props.category,
    excerpt: article.props.excerpt,
    author: article.props.author,
    content: article.props.content,
    publishedAt: article.props.publishedAt.toISOString(),
    views: article.props.views,
  };
}

@injectable()
@JsonController('/blog')
export class BlogController {
  constructor(
    @inject(ListBlogArticles)
    private readonly listBlogArticles: ListBlogArticles,

    @inject(GetBlogArticle)
    private readonly getBlogArticle: GetBlogArticle,
  ) {}

  @Get('/articles')
  async list() {
    const articles = await this.listBlogArticles.execute();
    return articles.map(toBlogArticleResponse);
  }

  @Get('/articles/:id')
  async get(@Param('id') articleId: string) {
    const article = await this.getBlogArticle.execute({ articleId });
    return toBlogArticleResponse(article);
  }
}
