import 'reflect-metadata';

import { describe, expect, test } from 'vitest';
import { Container } from 'inversify';
import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';

import {
  BlogArticle,
  BlogArticleNotFoundError,
  BookingIdentifiers,
  BlogArticleRepository,
  CreateBlogArticle,
  CreateMenuItem,
  DeleteBlogArticle,
  DeleteMenuItem,
  GetBlogArticle,
  InvalidArticleError,
  InvalidMenuItemError,
  ListBlogArticles,
  ListMenuItems,
  MenuItem,
  MenuItemNotFoundError,
  MenuItemRepository,
} from 'restaurant-core';
import { Build, POSTGRES_ENTITIES } from 'restaurant-adapters';

const validArticle = {
  title: 'Choucroute garnie',
  category: 'Recettes',
  excerpt: 'Le plat emblématique de la maison.',
  author: 'Léa Martin',
  content: 'Premier paragraphe.\n\nSecond paragraphe.',
};

const validMenuItem = {
  title: 'Riesling d\'Alsace',
  category: 'vins',
  price: 6.5,
  description: 'Vin blanc sec et vif.',
};

describe('Articles de blog', () => {
  test('un article refuse un champ obligatoire vide', () => {
    expect(() => createArticle({ title: '  ' })).toThrow(InvalidArticleError);
    expect(() => createArticle({ category: '' })).toThrow(InvalidArticleError);
  });

  test('un article refuse un titre trop long', () => {
    expect(() => createArticle({ title: 'x'.repeat(121) })).toThrow(InvalidArticleError);
  });

  test('un article démarre avec zéro vue', async () => {
    const container = new Container();
    Build.load(container);
    const create = container.get(CreateBlogArticle);

    const article = await create.execute(validArticle);

    expect(article.props.views).toBe(0);
    expect(article.props.title).toBe('Choucroute garnie');
  });

  test('lire un article compte une vue et le renvoie', async () => {
    const container = new Container();
    Build.load(container);
    const article = await container.get(CreateBlogArticle).execute(validArticle);
    const get = container.get(GetBlogArticle);

    await get.execute({ articleId: article.id });
    const read = await get.execute({ articleId: article.id });

    expect(read.props.views).toBe(2);
  });

  test('lire un article inconnu renvoie une erreur', async () => {
    const container = new Container();
    Build.load(container);

    await expect(container.get(GetBlogArticle).execute({ articleId: 'inconnu' })).rejects.toThrow(
      BlogArticleNotFoundError,
    );
  });

  test('supprimer un article le retire de la liste', async () => {
    const container = new Container();
    Build.load(container);
    const article = await container.get(CreateBlogArticle).execute(validArticle);

    await container.get(DeleteBlogArticle).execute({ articleId: article.id });

    expect(await container.get(ListBlogArticles).execute()).toHaveLength(0);
  });

  test('supprimer un article inconnu renvoie une erreur', async () => {
    const container = new Container();
    Build.load(container);

    await expect(container.get(DeleteBlogArticle).execute({ articleId: 'inconnu' })).rejects.toThrow(
      BlogArticleNotFoundError,
    );
  });

  test('les articles sont relus du plus récent au plus ancien', async () => {
    const container = new Container();
    Build.load(container);
    const articles = container.get<BlogArticleRepository>(BookingIdentifiers.blogArticleRepository);

    await articles.save(BlogArticle.create(validArticle, new Date('2026-01-01T12:00:00Z')));
    await articles.save(BlogArticle.create({ ...validArticle, title: 'Plus récent' }, new Date('2026-06-01T12:00:00Z')));

    const listed = await container.get(ListBlogArticles).execute();

    expect(listed[0].props.title).toBe('Plus récent');
  });
});

describe('Produits de la carte', () => {
  test('un produit refuse une catégorie inconnue', () => {
    expect(() => MenuItem.create({ ...validMenuItem, category: 'desserts-glacés' })).toThrow(InvalidMenuItemError);
  });

  test.each([0, -1, 1000, 6.456])('un produit refuse le prix %s', (price) => {
    expect(() => MenuItem.create({ ...validMenuItem, price })).toThrow(InvalidMenuItemError);
  });

  test('un produit accepte un prix à deux décimales', () => {
    expect(MenuItem.create({ ...validMenuItem, price: 6.99 }).props.price).toBe(6.99);
  });

  test('créer puis lister un produit de la carte', async () => {
    const container = new Container();
    Build.load(container);

    await container.get(CreateMenuItem).execute(validMenuItem);

    const items = await container.get(ListMenuItems).execute();
    expect(items).toHaveLength(1);
    expect(items[0].props.title).toBe("Riesling d'Alsace");
  });

  test('supprimer un produit le retire de la carte', async () => {
    const container = new Container();
    Build.load(container);
    const item = await container.get(CreateMenuItem).execute(validMenuItem);

    await container.get(DeleteMenuItem).execute({ itemId: item.id });

    expect(await container.get(ListMenuItems).execute()).toHaveLength(0);
  });

  test('supprimer un produit inconnu renvoie une erreur', async () => {
    const container = new Container();
    Build.load(container);

    await expect(container.get(DeleteMenuItem).execute({ itemId: 'inconnu' })).rejects.toThrow(MenuItemNotFoundError);
  });

  test('un produit est sauvegardé et relu depuis le dépôt', async () => {
    const container = new Container();
    Build.load(container);
    const items = container.get<MenuItemRepository>(BookingIdentifiers.menuItemRepository);

    await items.save(MenuItem.create(validMenuItem));

    expect(await items.findAll()).toHaveLength(1);
  });
});

function createArticle(overrides: Partial<typeof validArticle>) {
  return BlogArticle.create({ ...validArticle, ...overrides });
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
  });
  await dataSource.initialize();
  await dataSource.synchronize();
  return dataSource;
}

describe('Contenu en PostgreSQL', () => {
  test('articles et produits de la carte sont sauvegardés et relus depuis PostgreSQL', async () => {
    const dataSource = await createDataSource();
    const container = new Container();
    Build.load(container, { dataSource });

    const created = await container.get(CreateBlogArticle).execute(validArticle);
    await container.get(GetBlogArticle).execute({ articleId: created.id });
    await container.get(CreateMenuItem).execute(validMenuItem);

    const articles = await container.get(ListBlogArticles).execute();
    const items = await container.get(ListMenuItems).execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].props.views).toBe(1);
    expect(articles[0].props.category).toBe('Recettes');
    expect(items).toHaveLength(1);
    expect(items[0].props.price).toBe(6.5);

    await dataSource.destroy();
  });
});
