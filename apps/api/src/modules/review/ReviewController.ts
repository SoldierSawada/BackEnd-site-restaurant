import { Body, Get, JsonController, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { inject, injectable } from 'inversify';
import {
  GetMyReview,
  RecordActivity,
  Review,
  ListReviews,
  ReviewListItem,
  SubmitReview,
} from 'restaurant-core';

import { ReviewPageQuery, SubmitReviewCommand } from './command/ReviewCommand';
import { AuthenticationMiddleware } from '../../middlewares/AuthenticationMiddleware';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';

function toReviewResponse(review: Review) {
  const reply = review.currentReply;

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    reply: reply ? { text: reply.text, repliedAt: reply.repliedAt.toISOString() } : null,
  };
}

function toListItemResponse(item: ReviewListItem) {
  return { ...toReviewResponse(item.review), authorName: item.authorName };
}

@injectable()
@JsonController()
export class ReviewController {
  constructor(
    @inject(ListReviews)
    private readonly listReviews: ListReviews,

    @inject(GetMyReview)
    private readonly getMyReview: GetMyReview,

    @inject(SubmitReview)
    private readonly submitReview: SubmitReview,

    @inject(RecordActivity)
    private readonly recordActivity: RecordActivity,
  ) {}

  @Get('/reviews')
  async list(@QueryParams() query: ReviewPageQuery) {
    const result = await this.listReviews.execute({ page: query.page, pageSize: query.pageSize });

    return {
      items: result.items.map(toListItemResponse),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      summary: result.summary,
    };
  }

  @Get('/reviews/mine')
  @UseBefore(AuthenticationMiddleware)
  async mine(@Req() request: AuthenticatedRequest) {
    const review = await this.getMyReview.execute({ memberId: request.identity.memberId });

    return review ? toReviewResponse(review) : null;
  }

  @Post('/reviews')
  @UseBefore(AuthenticationMiddleware)
  async submit(@Body() command: SubmitReviewCommand, @Req() request: AuthenticatedRequest) {
    const result = await this.submitReview.execute({
      memberId: request.identity.memberId,
      rating: command.rating,
      comment: command.comment ?? '',
    });

    await this.recordActivity.execute({
      action: result.created ? 'REVIEW_CREATED' : 'REVIEW_UPDATED',
      memberId: request.identity.memberId,
      details: result.id,
    });

    return { id: result.id, created: result.created };
  }
}
