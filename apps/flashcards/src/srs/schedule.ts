import type { Category, Rating } from '@holdem-lab/quiz';
import { Rating as FsrsRating, createEmptyCard, fsrs, type Grade } from 'ts-fsrs';
import type { ReviewRecord } from '../types';

const scheduler = fsrs();

const GRADES: Record<Rating, Grade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};

export function applyReview(
  prev: ReviewRecord | undefined,
  itemKey: string,
  category: Category,
  rating: Rating,
  now: Date,
): ReviewRecord {
  const card = scheduler.next(prev?.card ?? createEmptyCard(now), now, GRADES[rating]).card;
  return { itemKey, category, due: card.due.getTime(), card };
}
