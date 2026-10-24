import { injectable } from 'inversify';
import { BlogArticle, BlogArticleRepository } from 'restaurant-core';

@injectable()
export class InMemoryBlogArticleRepository implements BlogArticleRepository {
  private readonly items = new Map<string, BlogArticle>();

  async save(article: BlogArticle): Promise<void> {
    this.items.set(article.id, article);
  }

  async findAll(): Promise<BlogArticle[]> {
    return [...this.items.values()].sort((a, b) => b.props.publishedAt.getTime() - a.props.publishedAt.getTime());
  }

  async findById(id: string): Promise<BlogArticle | null> {
    return this.items.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
