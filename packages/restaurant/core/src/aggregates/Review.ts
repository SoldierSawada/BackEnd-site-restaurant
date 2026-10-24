import { randomUUID } from 'node:crypto';
import { InvalidRatingError } from '../errors/InvalidRatingError';
import { InvalidReviewCommentError } from '../errors/InvalidReviewCommentError';
import { InvalidReviewReplyError } from '../errors/InvalidReviewReplyError';

export const maxReviewTextLength = 500;

export interface ReviewReply {
  text: string;
  repliedAt: Date;
}

export interface ReviewProps {
  id: string;
  memberId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  reply: ReviewReply | null;
}

function validateRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new InvalidRatingError(rating);
  }
}

function normalizeComment(comment: string): string {
  const trimmed = comment.trim();
  if (trimmed.length > maxReviewTextLength) {
    throw new InvalidReviewCommentError(maxReviewTextLength);
  }
  return trimmed;
}

function normalizeReplyText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > maxReviewTextLength) {
    throw new InvalidReviewReplyError(maxReviewTextLength);
  }
  return trimmed;
}

export class Review {
  private props: ReviewProps;

  private constructor(props: ReviewProps) {
    this.props = props;
  }

  static create(memberId: string, rating: number, comment: string, now: Date = new Date()): Review {
    validateRating(rating);

    return new Review({
      id: randomUUID(),
      memberId,
      rating,
      comment: normalizeComment(comment),
      createdAt: now,
      updatedAt: now,
      reply: null,
    });
  }

  static reconstitute(props: ReviewProps): Review {
    return new Review({ ...props });
  }

  update(rating: number, comment: string, now: Date = new Date()): void {
    validateRating(rating);
    this.props.rating = rating;
    this.props.comment = normalizeComment(comment);
    this.props.updatedAt = now;
  }

  reply(text: string, now: Date = new Date()): void {
    this.props.reply = { text: normalizeReplyText(text), repliedAt: now };
  }

  removeReply(): void {
    this.props.reply = null;
  }

  toProps(): ReviewProps {
    return { ...this.props, reply: this.props.reply ? { ...this.props.reply } : null };
  }

  get id(): string {
    return this.props.id;
  }

  get memberId(): string {
    return this.props.memberId;
  }

  get rating(): number {
    return this.props.rating;
  }

  get comment(): string {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get currentReply(): ReviewReply | null {
    return this.props.reply;
  }
}
