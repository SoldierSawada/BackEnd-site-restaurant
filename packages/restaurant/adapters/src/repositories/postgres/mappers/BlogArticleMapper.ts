import { BlogArticle } from 'restaurant-core';
import { BlogArticleEntity } from '../entities/BlogArticleEntity';

export class BlogArticleMapper {
  static toEntity(domain: BlogArticle): BlogArticleEntity {
    const entity = new BlogArticleEntity();
    entity.id = domain.props.id;
    entity.title = domain.props.title;
    entity.category = domain.props.category;
    entity.excerpt = domain.props.excerpt;
    entity.author = domain.props.author;
    entity.content = domain.props.content;
    entity.publishedAt = domain.props.publishedAt;
    entity.views = domain.props.views;
    return entity;
  }

  static toDomain(entity: BlogArticleEntity): BlogArticle {
    return BlogArticle.reconstitute({
      id: entity.id,
      title: entity.title,
      category: entity.category,
      excerpt: entity.excerpt,
      author: entity.author,
      content: entity.content,
      publishedAt: new Date(entity.publishedAt),
      views: entity.views,
    });
  }
}
