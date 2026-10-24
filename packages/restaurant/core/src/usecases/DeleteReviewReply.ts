import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { ReviewNotFoundError } from '../errors/ReviewNotFoundError';

export interface DeleteReviewReplyRequest {
  reviewId: string;
}

@injectable()
export class DeleteReviewReply implements Usecase<DeleteReviewReplyRequest, void> {
  constructor(
    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(request: DeleteReviewReplyRequest): Promise<void> {
    const review = await this.reviewRepository.findById(request.reviewId);

    if (!review) {
      throw new ReviewNotFoundError(request.reviewId);
    }

    review.removeReply();
    await this.reviewRepository.save(review);
  }
}
