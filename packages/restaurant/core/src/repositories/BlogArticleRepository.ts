import { BlogArticle } from '../aggregates/BlogArticle';

export interface BlogArticleRepository {
  save(article: BlogArticle): Promise<void>;
  findAll(): Promise<BlogArticle[]>;
  findById(id: string): Promise<BlogArticle | null>;
  delete(id: string): Promise<void>;
}
