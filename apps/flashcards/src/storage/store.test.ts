import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { applyReview } from '../srs/schedule';
import { defaultSettings, sanitizeSettings, type HistoryEntry } from '../types';
import { createDexieStore } from './dexieStore';
import { createMemoryStore, parseExport, type Store } from './store';

const now = new Date('2026-10-01T09:00:00Z');
const entry = (at: number): HistoryEntry => ({
  itemKey: 'po:bet-50',
  category: 'potodds',
  kind: 'new',
  correct: true,
  elapsedMs: 1200,
  at,
});

let dbCount = 0;
const factories: [string, () => Promise<Store>][] = [
  ['memory', async () => createMemoryStore()],
  ['dexie', () => createDexieStore(`test-${dbCount++}`)],
];

describe.each(factories)('%s store', (_name, make) => {
  it('stores reviews, history, equity and settings', async () => {
    const store = await make();
    const r = applyReview(undefined, 'po:bet-50', 'potodds', 'good', now);
    await store.putReview(r);
    await store.putReview({ ...r, due: r.due + 1 });
    expect(await store.getReviews()).toHaveLength(1);

    await store.addHistory(entry(100));
    await store.addHistory(entry(200));
    expect((await store.getHistory(150)).map((h) => h.at)).toEqual([200]);

    expect(await store.getEquity('k')).toBeUndefined();
    await store.putEquity('k', 0.42);
    expect(await store.getEquity('k')).toBe(0.42);

    expect(await store.getSettings()).toEqual(defaultSettings());
    await store.putSettings({ ...defaultSettings(), theme: 'dark', locale: 'ja' });
    expect(await store.getSettings()).toMatchObject({ theme: 'dark', locale: 'ja' });
  });

  it('round-trips an export through JSON', async () => {
    const store = await make();
    await store.putReview(applyReview(undefined, 'outs:oesd', 'outs', 'good', now));
    await store.addHistory(entry(100));
    const json = JSON.parse(JSON.stringify(await store.exportAll()));

    const other = await make();
    await other.importAll(parseExport(json));
    const [review] = await other.getReviews();
    expect(review.card.due).toBeInstanceOf(Date);
    expect(review.itemKey).toBe('outs:oesd');
    expect(await other.getHistory(0)).toHaveLength(1);
  });

  it('importAll replaces existing data', async () => {
    const store = await make();
    await store.putReview(applyReview(undefined, 'outs:oesd', 'outs', 'good', now));
    await store.addHistory(entry(100));
    const incoming = await make();
    await incoming.putReview(applyReview(undefined, 'po:bet-50', 'potodds', 'good', now));
    await incoming.addHistory(entry(200));
    await store.importAll(parseExport(JSON.parse(JSON.stringify(await incoming.exportAll()))));
    expect((await store.getReviews()).map((r) => r.itemKey)).toEqual(['po:bet-50']);
    expect((await store.getHistory(0)).map((h) => h.at)).toEqual([200]);
  });

  it('leaves existing data intact when the import is rejected', async () => {
    const store = await make();
    await store.putReview(applyReview(undefined, 'outs:oesd', 'outs', 'good', now));
    await store.addHistory(entry(100));
    const json = JSON.parse(JSON.stringify(await store.exportAll()));
    json.reviews.push({ ...json.reviews[0], card: undefined });
    expect(() => parseExport(json)).toThrow();
    expect(await store.getReviews()).toHaveLength(1);
    expect(await store.getHistory(0)).toHaveLength(1);
  });
});

describe('parseExport', () => {
  it('rejects bad input', () => {
    expect(() => parseExport(null)).toThrow();
    expect(() => parseExport({ version: 2, reviews: [], history: [], settings: {} })).toThrow('version');
    expect(() => parseExport({ version: 1, reviews: {}, history: [], settings: {} })).toThrow();
  });

  const review = () => JSON.parse(JSON.stringify(applyReview(undefined, 'outs:oesd', 'outs', 'good', now)));
  const parseWith = (patch: { reviews?: unknown[]; history?: unknown[]; settings?: unknown }) =>
    parseExport({ version: 1, reviews: [], history: [], settings: {}, ...patch });

  it.each([
    ['non-object review', null],
    ['non-string itemKey', { ...review(), itemKey: 5 }],
    ['unknown key prefix', { ...review(), itemKey: 'zzz:1' }],
    ['unknown category', { ...review(), category: 'bogus' }],
    ['non-finite due', { ...review(), due: 'soon' }],
    ['missing card', { ...review(), card: undefined }],
    ['card without due', { ...review(), card: { ...review().card, due: undefined } }],
    ['invalid card due', { ...review(), card: { ...review().card, due: 'nope' } }],
  ])('rejects a review with %s, naming the index', (_n, bad) => {
    expect(() => parseWith({ reviews: [review(), bad] })).toThrow('reviews[1]');
  });

  it.each([
    ['non-string itemKey', { itemKey: 1 }],
    ['unknown category', { category: 'x' }],
    ['unknown kind', { kind: 'other' }],
    ['non-boolean correct', { correct: 'yes' }],
    ['non-finite elapsedMs', { elapsedMs: NaN }],
    ['non-numeric at', { at: '1' }],
    ['non-finite error', { error: 'x' }],
  ])('rejects a history entry with %s, naming the index', (_n, patch) => {
    expect(() => parseWith({ history: [entry(1), { ...entry(2), ...patch }] })).toThrow('history[1]');
  });

  it('accepts history entries with an error value', () => {
    expect(parseWith({ history: [{ ...entry(1), error: 2.5 }] }).history).toHaveLength(1);
  });

  it('sanitizes imported settings', () => {
    const d = parseWith({ settings: { locale: 'fr', categories: 'x', theme: 'dark' } });
    expect(d.settings).toEqual({ ...defaultSettings(), theme: 'dark' });
  });

  it('fills missing settings with defaults', () => {
    const d = parseExport({ version: 1, reviews: [], history: [], settings: { theme: 'light' } });
    expect(d.settings).toEqual({ ...defaultSettings(), theme: 'light' });
  });
});

describe('sanitizeSettings', () => {
  it('falls back per field', () => {
    const d = defaultSettings();
    expect(sanitizeSettings(null)).toEqual(d);
    const s = sanitizeSettings({
      locale: 'fr',
      theme: 'dark',
      fourColor: 'yes',
      newPerDay: -1,
      tolerance: 3,
      sessionSize: NaN,
      rangeSetId: 7,
      categories: 'x',
    });
    expect(s).toEqual({ ...d, theme: 'dark', tolerance: 3 });
  });

  it('keeps valid values and filters categories', () => {
    const s = sanitizeSettings({ locale: 'en', fourColor: true, newPerDay: 5, sessionSize: 10, rangeSetId: 'a', categories: ['outs', 'nope'] });
    expect(s).toMatchObject({ locale: 'en', fourColor: true, newPerDay: 5, sessionSize: 10, rangeSetId: 'a', categories: ['outs'] });
  });

  it('is applied when reading stored settings', async () => {
    const store = createMemoryStore();
    await store.putSettings({ ...defaultSettings(), locale: 'fr' as never });
    expect((await store.getSettings()).locale).toBe(defaultSettings().locale);
  });
});
