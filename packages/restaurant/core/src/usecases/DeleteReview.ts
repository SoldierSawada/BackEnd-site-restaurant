import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { ReviewNotFoundError } from '../errors/ReviewNotFoundError';

export interface DeleteReviewRequest {
  reviewId: string;
}

@injectable()
export class DeleteReview implements Usecase<DeleteReviewRequest, void> {
  constructor(
    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(request: DeleteReviewRequest): Promise<void> {
    const review = await this.reviewRepository.findById(request.reviewId);

    if (!review) {
      throw new ReviewNotFoundError(request.reviewId);
    }

    await this.reviewRepository.delete(request.reviewId);
  }
}
