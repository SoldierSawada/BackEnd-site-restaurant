import 'reflect-metadata';

import { assert, expect, test } from 'vitest';
import { Container } from 'inversify';

import {
  BookingIdentifiers,
  DeleteReview,
  DeleteReviewReply,
  Email,
  InvalidRatingError,
  InvalidReviewCommentError,
  InvalidReviewReplyError,
  ListReviews,
  Member,
  MemberRepository,
  Review,
  ReviewNotFoundError,
  ReviewRepository,
  ReplyToReview,
  SubmitReview,
} from 'restaurant-core';
import { Build } from 'restaurant-adapters';

function createTestContainer(): Container {
  const container = new Container();
  Build.load(container);
  return container;
}

test('Review - accepte une note entière de 1 à 5 et nettoie le commentaire', () => {
  const review = Review.create('m-1', 4, '  Bien  ');

  assert.equal(review.rating, 4);
  assert.equal(review.comment, 'Bien');
  assert.isNull(review.currentReply);
});

test('Review - refuse une note hors de 1 à 5 ou non entière', () => {
  for (const rating of [0, 6, 2.5, Number.NaN]) {
    expect(() => Review.create('m-1', rating, 'x')).toThrow(InvalidRatingError);
  }
});

test('Review - accepte un commentaire vide mais refuse plus de 500 caractères', () => {
  assert.equal(Review.create('m-1', 3, '').comment, '');
  expect(() => Review.create('m-1', 3, 'a'.repeat(501))).toThrow(InvalidReviewCommentError);
});

test('Review - update change la note, le commentaire et la date de modification', () => {
  const created = new Date('2026-10-01T10:00:00.000Z');
  const modified = new Date('2026-10-02T10:00:00.000Z');
  const review = Review.create('m-1', 2, 'Moyen', created);

  review.update(5, 'Excellent', modified);

  assert.equal(review.rating, 5);
  assert.equal(review.comment, 'Excellent');
  assert.equal(review.createdAt.toISOString(), created.toISOString());
  assert.equal(review.updatedAt.toISOString(), modified.toISOString());
});

test('Review - réponse du responsable : ajout, refus si vide, suppression', () => {
  const review = Review.create('m-1', 5, 'Parfait');

  review.reply('  Merci pour votre visite  ');
  assert.equal(review.currentReply?.text, 'Merci pour votre visite');

  expect(() => review.reply('   ')).toThrow(InvalidReviewReplyError);
  expect(() => review.reply('a'.repeat(501))).toThrow(InvalidReviewReplyError);

  review.removeReply();
  assert.isNull(review.currentReply);
});

test('SubmitReview - un membre n’a qu’un avis : le second envoi le modifie', async () => {
  const container = createTestContainer();
  const submit = container.get(SubmitReview);

  const first = await submit.execute({ memberId: 'm-1', rating: 3, comment: 'Correct' });
  const second = await submit.execute({ memberId: 'm-1', rating: 5, comment: 'Finalement très bien' });

  assert.isTrue(first.created);
  assert.isFalse(second.created);
  assert.equal(second.id, first.id);

  const page = await container.get(ListReviews).execute({ page: 1, pageSize: 10 });
  assert.equal(page.total, 1);
  assert.equal(page.items[0].review.rating, 5);
});

test('ListReviews - pagination, moyenne sur 5 et répartition par étoile', async () => {
  const container = createTestContainer();
  const members = container.get<MemberRepository>(BookingIdentifiers.memberRepository);
  const submit = container.get(SubmitReview);
  const list = container.get(ListReviews);

  await members.save(Member.register('m-a', 'Alice', Email.create('a@b.fr'), 'hash'));
  await members.save(Member.register('m-b', 'Bob', Email.create('b@b.fr'), 'hash'));
  await members.save(Member.register('m-c', 'Chloé', Email.create('c@b.fr'), 'hash'));

  await submit.execute({ memberId: 'm-a', rating: 5, comment: '' });
  await submit.execute({ memberId: 'm-b', rating: 4, comment: 'Bien' });
  await submit.execute({ memberId: 'm-c', rating: 4, comment: '' });

  const firstPage = await list.execute({ page: 1, pageSize: 2 });
  assert.equal(firstPage.total, 3);
  assert.equal(firstPage.totalPages, 2);
  assert.equal(firstPage.items.length, 2);
  assert.isString(firstPage.items[0].authorName);

  const secondPage = await list.execute({ page: 2, pageSize: 2 });
  assert.equal(secondPage.items.length, 1);

  assert.equal(firstPage.summary.count, 3);
  assert.equal(firstPage.summary.average, 4.3);
  assert.deepEqual(firstPage.summary.ratingCounts, [0, 0, 0, 2, 1]);
});

test('ListReviews - sans avis : moyenne nulle et une seule page vide', async () => {
  const page = await createTestContainer().get(ListReviews).execute({ page: 1, pageSize: 10 });

  assert.equal(page.total, 0);
  assert.equal(page.totalPages, 1);
  assert.isNull(page.summary.average);
  assert.equal(page.summary.count, 0);
});

test('Réponse admin : ajoutée puis supprimée', async () => {
  const container = createTestContainer();
  const submit = container.get(SubmitReview);
  const reviews = container.get<ReviewRepository>(BookingIdentifiers.reviewRepository);
  const { id } = await submit.execute({ memberId: 'm-1', rating: 2, comment: 'Trop froid' });

  await container.get(ReplyToReview).execute({ reviewId: id, text: 'Nous sommes désolés' });
  assert.equal((await reviews.findById(id))?.currentReply?.text, 'Nous sommes désolés');

  await container.get(DeleteReviewReply).execute({ reviewId: id });
  assert.isNull((await reviews.findById(id))?.currentReply ?? null);
});

test('DeleteReview - supprime un avis existant, erreur si inconnu', async () => {
  const container = createTestContainer();
  const { id } = await container.get(SubmitReview).execute({ memberId: 'm-1', rating: 1, comment: 'Spam' });

  await container.get(DeleteReview).execute({ reviewId: id });
  assert.isNull(await container.get<ReviewRepository>(BookingIdentifiers.reviewRepository).findById(id));

  await expect(container.get(DeleteReview).execute({ reviewId: id })).rejects.toThrowError(ReviewNotFoundError);
});

test('ReplyToReview - erreur si l’avis n’existe pas', async () => {
  await expect(
    createTestContainer().get(ReplyToReview).execute({ reviewId: 'absent', text: 'Merci' }),
  ).rejects.toThrowError(ReviewNotFoundError);
});
