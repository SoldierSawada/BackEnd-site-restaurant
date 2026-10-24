import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { Review } from '../aggregates/Review';
import { MemberRepository } from '../repositories/MemberRepository';
import { ReviewRepository, ReviewStats } from '../repositories/ReviewRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { computeAverageRating } from './ReviewStatistics';

export interface ListReviewsRequest {
  page: number;
  pageSize: number;
}

export interface ReviewListItem {
  review: Review;
  authorName: string;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  ratingCounts: number[];
}

export interface ReviewListPage {
  items: ReviewListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ReviewSummary;
}

@injectable()
export class ListReviews implements Usecase<ListReviewsRequest, ReviewListPage> {
  constructor(
    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,

    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(request: ListReviewsRequest): Promise<ReviewListPage> {
    const offset = (request.page - 1) * request.pageSize;
    const page = await this.reviewRepository.findPage(offset, request.pageSize);
    const stats: ReviewStats = await this.reviewRepository.getStats();

    const items: ReviewListItem[] = [];
    for (const review of page.items) {
      const author = await this.memberRepository.findById(review.memberId);
      items.push({ review, authorName: author ? author.getName() : 'Membre' });
    }

    return {
      items,
      total: page.total,
      page: request.page,
      pageSize: request.pageSize,
      totalPages: Math.max(1, Math.ceil(page.total / request.pageSize)),
      summary: {
        average: computeAverageRating(stats),
        count: stats.count,
        ratingCounts: stats.ratingCounts,
      },
    };
  }
}
