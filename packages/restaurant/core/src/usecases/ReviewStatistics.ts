import { ReviewStats } from '../repositories/ReviewRepository';

export function computeAverageRating(stats: ReviewStats): number | null {
  if (stats.count === 0) {
    return null;
  }

  const total = stats.ratingCounts.reduce((sum, count, index) => sum + count * (index + 1), 0);
  return Math.round((total / stats.count) * 10) / 10;
}
