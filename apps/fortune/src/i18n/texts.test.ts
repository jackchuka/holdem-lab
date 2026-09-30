import { describe, expect, it } from 'vitest';
import { TIERS } from '../fortune';
import { COMMENTS, TIPS } from './texts';

describe('texts', () => {
  it('has three comments per tier in both languages', () => {
    for (const tier of TIERS) {
      expect(COMMENTS.ja[tier]).toHaveLength(3);
      expect(COMMENTS.en[tier]).toHaveLength(3);
    }
  });

  it('has twenty tips in both languages', () => {
    expect(TIPS.ja).toHaveLength(20);
    expect(TIPS.en).toHaveLength(20);
  });
});
