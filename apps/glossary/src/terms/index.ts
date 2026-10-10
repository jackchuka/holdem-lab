import { ACTION } from './action';
import { HAND_BOARD } from './hand-board';
import { MATH } from './math';
import { POSITION } from './position';
import { SLANG } from './slang';
import { CATEGORIES, type Category, type Entry, type Term } from './types';

export * from './types';

const BY_CATEGORY: Record<Category, Term[]> = {
  position: POSITION,
  action: ACTION,
  'hand-board': HAND_BOARD,
  math: MATH,
  slang: SLANG,
};

export const ENTRIES: Entry[] = CATEGORIES.flatMap((category) => BY_CATEGORY[category].map((term) => ({ term, category })));
