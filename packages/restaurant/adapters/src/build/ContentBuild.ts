import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { BookingIdentifiers } from 'restaurant-core';

import { InMemoryBlogArticleRepository } from '../repositories/repositories/InMemoryBlogArticleRepository';
import { InMemoryReviewRepository } from '../repositories/repositories/InMemoryReviewRepository';
import { InMemoryMenuItemRepository } from '../repositories/repositories/InMemoryMenuItemRepository';
import { PostgresMenuItemRepository } from '../repositories/postgres/PostgresMenuItemRepository';
import { PostgresBlogArticleRepository } from '../repositories/postgres/PostgresBlogArticleRepository';
import { PostgresReviewRepository } from '../repositories/postgres/PostgresReviewRepository';

export class ContentBuild {
  static register(container: Container, dataSource?: DataSource): void {
    container
      .bind(BookingIdentifiers.reviewRepository)
      .to(dataSource ? PostgresReviewRepository : InMemoryReviewRepository)
      .inSingletonScope();

    container
      .bind(BookingIdentifiers.blogArticleRepository)
      .to(dataSource ? PostgresBlogArticleRepository : InMemoryBlogArticleRepository)
      .inSingletonScope();

    container
      .bind(BookingIdentifiers.menuItemRepository)
      .to(dataSource ? PostgresMenuItemRepository : InMemoryMenuItemRepository)
      .inSingletonScope();
  }
}
