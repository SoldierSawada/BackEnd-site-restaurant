import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Review } from '../aggregates/Review';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface SubmitReviewRequest {
  memberId: string;
  rating: number;
  comment: string;
}

export interface SubmitReviewResult {
  id: string;
  created: boolean;
}

@injectable()
export class SubmitReview implements Usecase<SubmitReviewRequest, SubmitReviewResult> {
  constructor(
    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(request: SubmitReviewRequest): Promise<SubmitReviewResult> {
    const existing = await this.reviewRepository.findByMemberId(request.memberId);

    if (existing) {
      existing.update(request.rating, request.comment);
      await this.reviewRepository.save(existing);
      return { id: existing.id, created: false };
    }

    const review = Review.create(request.memberId, request.rating, request.comment);
    await this.reviewRepository.save(review);
    return { id: review.id, created: true };
  }
}
