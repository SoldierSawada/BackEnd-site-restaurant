import 'reflect-metadata';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';

import {
  BlogArticle,
  BlogArticleRepository,
  BookingIdentifiers,
  InvalidArticleError,
  InvalidRatingError,
  ListActivityLogs,
  RecordActivity,
  Review,
  ReviewRepository,
} from 'restaurant-core';
import { Build, POSTGRES_ENTITIES } from 'restaurant-adapters';

function articleInput(title: string, content = 'Texte') {
  return { title, category: 'Recettes', excerpt: 'Résumé', author: 'Léa', content };
}

async function createDataSource(): Promise<DataSource> {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'restaurant_test',
  });
  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16 (pg-mem)',
  });

  const dataSource: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: POSTGRES_ENTITIES,
    synchronize: true,
  });
  await dataSource.initialize();
  return dataSource;
}

describe('Journal d activité (mémoire)', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    Build.load(container);
  });

  test('RecordActivity enregistre une action et ListActivityLogs la restitue', async () => {
    await container.get(RecordActivity).execute({
      action: 'RESERVATION_CREATED',
      memberId: 'member-1',
      details: 'reservation-1',
    });

    const logs = await container.get(ListActivityLogs).execute({ page: 1, pageSize: 50 });

    expect(logs.items).toHaveLength(1);
    expect(logs.items[0].props.action).toBe('RESERVATION_CREATED');
    expect(logs.items[0].props.memberId).toBe('member-1');
    expect(logs.items[0].props.details).toBe('reservation-1');
  });

  test('ListActivityLogs trie du plus récent au plus ancien', async () => {
    const record = container.get(RecordActivity);
    await record.execute({ action: 'MEMBER_REGISTERED', memberId: 'm1', details: 'a' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await record.execute({ action: 'TABLE_CREATED', memberId: 'm2', details: 'b' });

    const logs = await container.get(ListActivityLogs).execute({ page: 1, pageSize: 50 });

    expect(logs.items.map((log) => log.props.action)).toEqual(['TABLE_CREATED', 'MEMBER_REGISTERED']);
  });
});

describe('Journal d activité (PostgreSQL pg-mem)', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createDataSource();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  test('les logs sont persistés puis relus depuis PostgreSQL', async () => {
    const container = new Container();
    Build.load(container, { dataSource });

    await container.get(RecordActivity).execute({
      action: 'TABLE_DEACTIVATED',
      memberId: 'admin-1',
      details: 'Table 4',
    });

    const fresh = new Container();
    Build.load(fresh, { dataSource });
    const logs = await fresh.get(ListActivityLogs).execute({ page: 1, pageSize: 50 });

    expect(logs.items).toHaveLength(1);
    expect(logs.items[0].props.action).toBe('TABLE_DEACTIVATED');
    expect(logs.items[0].props.createdAt).toBeInstanceOf(Date);
  });
});

describe('Avis et articles de blog', () => {
  test('un avis accepte une note entière entre 1 et 5 et nettoie le commentaire', () => {
    const review = Review.create('member-1', 5, '  Très bon accueil  ');

    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Très bon accueil');
  });

  test.each([0, 6, 2.5, Number.NaN])('un avis refuse la note %s', (rating) => {
    expect(() => Review.create('member-1', rating, 'x')).toThrow(InvalidRatingError);
  });

  test('un article refuse un titre vide', () => {
    expect(() => BlogArticle.create(articleInput('   ', 'Contenu'))).toThrow(InvalidArticleError);
  });

  test('un article est créé avec un titre et un contenu nettoyés', () => {
    const article = BlogArticle.create(articleInput(' Nouvelle carte ', '  Découvrez nos plats  '));

    expect(article.props.title).toBe('Nouvelle carte');
    expect(article.props.content).toBe('Découvrez nos plats');
    expect(article.props.views).toBe(0);
    expect(article.props.publishedAt).toBeInstanceOf(Date);
  });

  test('les avis et articles sont sauvegardés et relus en mémoire', async () => {
    const container = new Container();
    Build.load(container);

    const reviews = container.get<ReviewRepository>(BookingIdentifiers.reviewRepository);
    const articles = container.get<BlogArticleRepository>(BookingIdentifiers.blogArticleRepository);

    await reviews.save(Review.create('member-1', 4, 'Bien'));
    await articles.save(BlogArticle.create(articleInput('Titre')));

    expect((await reviews.findPage(0, 10)).items).toHaveLength(1);
    expect(await articles.findAll()).toHaveLength(1);
  });

  test('les avis et articles sont sauvegardés et relus depuis PostgreSQL', async () => {
    const dataSource = await createDataSource();
    const container = new Container();
    Build.load(container, { dataSource });

    const reviews = container.get<ReviewRepository>(BookingIdentifiers.reviewRepository);
    const articles = container.get<BlogArticleRepository>(BookingIdentifiers.blogArticleRepository);

    const review = Review.create('member-2', 3, 'Correct');
    await reviews.save(review);
    await articles.save(BlogArticle.create(articleInput('Blog', 'Contenu long')));

    const storedReviews = (await reviews.findPage(0, 10)).items;
    const storedArticles = await articles.findAll();

    expect(storedReviews).toHaveLength(1);
    expect(storedReviews[0].rating).toBe(3);
    expect(storedReviews[0].comment).toBe('Correct');
    expect(storedArticles).toHaveLength(1);
    expect(storedArticles[0].props.title).toBe('Blog');

    await dataSource.destroy();
  });
});
