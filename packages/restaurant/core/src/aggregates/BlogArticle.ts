import { randomUUID } from 'node:crypto';
import { InvalidArticleError } from '../errors/InvalidArticleError';

export interface BlogArticleInput {
  title: string;
  category: string;
  excerpt: string;
  author: string;
  content: string;
}

export interface BlogArticleProps {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  content: string;
  publishedAt: Date;
  views: number;
}

function requireText(value: string, label: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new InvalidArticleError(`${label} est obligatoire`);
  }

  if (trimmed.length > maxLength) {
    throw new InvalidArticleError(`${label} ne doit pas dépasser ${maxLength} caractères`);
  }

  return trimmed;
}

export class BlogArticle {
  private constructor(readonly props: BlogArticleProps) {}

  static create(input: BlogArticleInput, now: Date = new Date()): BlogArticle {
    return new BlogArticle({
      id: randomUUID(),
      title: requireText(input.title, 'Le titre', 120),
      category: requireText(input.category, 'La catégorie', 40),
      excerpt: requireText(input.excerpt, 'Le résumé', 300),
      author: requireText(input.author, "L'auteur", 80),
      content: requireText(input.content, 'Le contenu', 20000),
      publishedAt: now,
      views: 0,
    });
  }

  static reconstitute(props: BlogArticleProps): BlogArticle {
    return new BlogArticle(props);
  }

  get id(): string {
    return this.props.id;
  }

  recordView(): void {
    this.props.views += 1;
  }
}
