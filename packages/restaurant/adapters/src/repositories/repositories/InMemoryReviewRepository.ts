import { injectable } from 'inversify';
import { Review, ReviewPageResult, ReviewRepository, ReviewStats } from 'restaurant-core';

@injectable()
export class InMemoryReviewRepository implements ReviewRepository {
  private readonly items = new Map<string, Review>();

  async save(review: Review): Promise<void> {
    this.items.set(review.id, review);
  }

  async findById(id: string): Promise<Review | null> {
    return this.items.get(id) ?? null;
  }

  async findByMemberId(memberId: string): Promise<Review | null> {
    return [...this.items.values()].find((review) => review.memberId === memberId) ?? null;
  }

  async findPage(offset: number, limit: number): Promise<ReviewPageResult> {
    const sorted = [...this.items.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: sorted.slice(offset, offset + limit), total: sorted.length };
  }

  async getStats(): Promise<ReviewStats> {
    const ratingCounts = [0, 0, 0, 0, 0];
    for (const review of this.items.values()) {
      ratingCounts[review.rating - 1] += 1;
    }
    return { count: this.items.size, ratingCounts };
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
