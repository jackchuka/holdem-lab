import { describe, expect, it } from 'vitest';
import { ShareUrlError, decodeShare, isValidDate, shareUrl } from './url';

const TODAY = '2026-09-30';

describe('shareUrl / decodeShare', () => {
  it('round-trips device and name keys', () => {
    const base = 'https://holdem-lab.com/fortune/';
    const device = shareUrl(base, { kind: 'device', id: '0123456789abcdef' }, TODAY);
    expect(device).toBe('https://holdem-lab.com/fortune/?k=u0123456789abcdef&d=2026-09-30');
    expect(decodeShare(new URL(device).search, TODAY)).toEqual({ key: { kind: 'device', id: '0123456789abcdef' }, date: TODAY });

    for (const name of ['たろう', 'a&b?c=d', 'ｔａｒｏ 🂡', '100%']) {
      const url = shareUrl(base, { kind: 'name', name }, '2026-09-01');
      expect(decodeShare(new URL(url).search, TODAY)).toEqual({ key: { kind: 'name', name: name.trim().normalize('NFKC').toLowerCase() }, date: '2026-09-01' });
    }
  });

  it('returns null without share parameters', () => {
    expect(decodeShare('', TODAY)).toBeNull();
    expect(decodeShare('?utm_source=x', TODAY)).toBeNull();
  });

  it.each([
    '?k=u0123&d=2026-09-30',
    '?k=uABCDEFGHIJKLMNOP&d=2026-09-30',
    '?k=n&d=2026-09-30',
    `?k=n${'a'.repeat(21)}&d=2026-09-30`,
    '?k=x123&d=2026-09-30',
    '?k=u0123456789abcdef',
    '?d=2026-09-30',
    '?k=u0123456789abcdef&d=2026-02-30',
    '?k=u0123456789abcdef&d=2026-9-30',
    '?k=u0123456789abcdef&d=2026-10-02',
  ])('rejects %s', (search) => {
    expect(() => decodeShare(search, TODAY)).toThrow(ShareUrlError);
  });
});

describe('timezones', () => {
  it('accepts a link dated one day ahead, shared from an earlier timezone', () => {
    expect(decodeShare('?k=u0123456789abcdef&d=2026-10-01', TODAY)?.date).toBe('2026-10-01');
    expect(() => decodeShare('?k=u0123456789abcdef&d=2026-10-02', TODAY)).toThrow(ShareUrlError);
  });
});

describe('isValidDate', () => {
  it('checks the calendar', () => {
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
  });
});
