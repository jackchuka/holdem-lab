import type { Rng } from '@holdem-lab/engine';
import { equityGenerator } from './generators/equity';
import { nutsGenerator } from './generators/nuts';
import { outsGenerator } from './generators/outs';
import { potOddsGenerator } from './generators/potodds';
import { rangeGenerator } from './generators/range';
import type { Category, Generator, GeneratorDeps, Question } from './types';

export const GENERATORS: Record<Category, Generator> = {
  equity: equityGenerator,
  outs: outsGenerator,
  range: rangeGenerator,
  potodds: potOddsGenerator,
  nuts: nutsGenerator,
};

export function categoryOfKey(itemKey: string): Category {
  switch (itemKey.slice(0, itemKey.indexOf(':'))) {
    case 'eq':
      return 'equity';
    case 'outs':
    case 'odds':
      return 'outs';
    case 'rfi':
      return 'range';
    case 'po':
    case 'mdf':
      return 'potodds';
    case 'nuts':
    case 'nuts2':
    case 'nutsnext':
      return 'nuts';
    default:
      throw new Error(`unknown item key: ${itemKey}`);
  }
}

export function generateQuestion(itemKey: string, rng: Rng, deps: GeneratorDeps): Promise<Question> {
  return GENERATORS[categoryOfKey(itemKey)].generate(itemKey, rng, deps);
}
