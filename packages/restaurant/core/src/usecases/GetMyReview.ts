import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Review } from '../aggregates/Review';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface GetMyReviewRequest {
  memberId: string;
}

@injectable()
export class GetMyReview implements Usecase<GetMyReviewRequest, Review | null> {
  constructor(
    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(request: GetMyReviewRequest): Promise<Review | null> {
    return this.reviewRepository.findByMemberId(request.memberId);
  }
}
