import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { ReviewNotFoundError } from '../errors/ReviewNotFoundError';

export interface ReplyToReviewRequest {
  reviewId: string;
  text: string;
}

@injectable()
export class ReplyToReview implements Usecase<ReplyToReviewRequest, void> {
  constructor(
    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(request: ReplyToReviewRequest): Promise<void> {
    const review = await this.reviewRepository.findById(request.reviewId);

    if (!review) {
      throw new ReviewNotFoundError(request.reviewId);
    }

    review.reply(request.text);
    await this.reviewRepository.save(review);
  }
}
