import { HAND_CLASSES, comboCount, gridPosition, handClassAt, type HandClass } from '@holdem-lab/engine';
import { expandNotation } from './notation';

export const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type Position = (typeof POSITIONS)[number];
export type Spot = Record<HandClass, { raise: number }>;
export type RangeSet = {
  id: string;
  name: string;
  format: string;
  stackBb: number;
  spots: Record<Position, Spot>;
};

export class RangeValidationError extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function loadRangeSet(json: unknown): RangeSet {
  const fail = (msg: string): never => {
    throw new RangeValidationError(msg);
  };
  if (!isObject(json)) return fail('range set must be an object');
  const { id, name, format, stackBb, spots } = json;
  if (typeof id !== 'string') fail('id must be a string');
  if (typeof name !== 'string') fail('name must be a string');
  if (typeof format !== 'string') fail('format must be a string');
  if (typeof stackBb !== 'number' || stackBb <= 0) fail('stackBb must be a positive number');
  if (!isObject(spots)) return fail('spots must be an object');
  for (const key of Object.keys(spots)) {
    if (!(POSITIONS as readonly string[]).includes(key)) fail(`unknown position: ${key}`);
  }

  const result = {} as Record<Position, Spot>;
  for (const pos of POSITIONS) {
    const rawSpot = spots[pos];
    if (!isObject(rawSpot) || !isObject(rawSpot.raise)) return fail(`${pos}.raise must be an object`);
    const spot: Spot = Object.fromEntries(HAND_CLASSES.map((hc) => [hc, { raise: 0 }]));
    for (const [token, value] of Object.entries(rawSpot.raise)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) fail(`${pos}.${token} must be between 0 and 1`);
      let hands: HandClass[] = [];
      try {
        hands = expandNotation(token);
      } catch (e) {
        fail(`${pos}: ${(e as Error).message}`);
      }
      for (const hc of hands) spot[hc] = { raise: value as number };
    }
    result[pos] = spot;
  }
  return { id: id as string, name: name as string, format: format as string, stackBb: stackBb as number, spots: result };
}

export function actionOf(spot: Spot, hc: HandClass): 'raise' | 'fold' {
  return spot[hc].raise >= 0.5 ? 'raise' : 'fold';
}

export function rfiPercent(spot: Spot): number {
  const combos = HAND_CLASSES.reduce((n, hc) => n + spot[hc].raise * comboCount(hc), 0);
  return (combos / 1326) * 100;
}

export function isBoundary(spot: Spot, hc: HandClass): boolean {
  const r = spot[hc].raise;
  if (r > 0 && r < 1) return true;
  const [row, col] = gridPosition(hc);
  const neighbors = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ].filter(([r2, c2]) => r2 >= 0 && r2 < 13 && c2 >= 0 && c2 < 13);
  return neighbors.some(([r2, c2]) => actionOf(spot, handClassAt(r2, c2)) !== actionOf(spot, hc));
}
