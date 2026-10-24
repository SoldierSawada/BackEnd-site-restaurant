import { Review } from '../aggregates/Review';

export interface ReviewStats {
  count: number;
  ratingCounts: number[];
}

export interface ReviewPageResult {
  items: Review[];
  total: number;
}

export interface ReviewRepository {
  save(review: Review): Promise<void>;
  findById(id: string): Promise<Review | null>;
  findByMemberId(memberId: string): Promise<Review | null>;
  findPage(offset: number, limit: number): Promise<ReviewPageResult>;
  getStats(): Promise<ReviewStats>;
  delete(id: string): Promise<void>;
}
