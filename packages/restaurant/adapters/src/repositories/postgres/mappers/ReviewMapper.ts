import { Review } from 'restaurant-core';
import { ReviewEntity } from '../entities/ReviewEntity';

export class ReviewMapper {
  static toEntity(domain: Review): ReviewEntity {
    const props = domain.toProps();
    const entity = new ReviewEntity();
    entity.id = props.id;
    entity.memberId = props.memberId;
    entity.rating = props.rating;
    entity.comment = props.comment;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;
    entity.replyText = props.reply ? props.reply.text : null;
    entity.replyAt = props.reply ? props.reply.repliedAt : null;
    return entity;
  }

  static toDomain(entity: ReviewEntity): Review {
    return Review.reconstitute({
      id: entity.id,
      memberId: entity.memberId,
      rating: entity.rating,
      comment: entity.comment,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      reply:
        entity.replyText !== null && entity.replyAt !== null
          ? { text: entity.replyText, repliedAt: new Date(entity.replyAt) }
          : null,
    });
  }
}
