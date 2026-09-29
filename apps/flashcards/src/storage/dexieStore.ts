import Dexie, { type Table } from 'dexie';
import { sanitizeSettings, type HistoryEntry, type ReviewRecord, type Settings } from '../types';
import type { Store } from './store';

type HistoryRow = HistoryEntry & { id?: number };

class FlashcardsDb extends Dexie {
  declare reviews: Table<ReviewRecord, string>;
  declare history: Table<HistoryRow, number>;
  declare equityCache: Table<{ key: string; value: number }, string>;
  declare settings: Table<{ key: string; value: Settings }, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      reviews: '&itemKey, due, category',
      history: '++id, at, itemKey',
      equityCache: '&key',
      settings: '&key',
    });
  }
}

const strip = ({ id: _id, ...h }: HistoryRow): HistoryEntry => h;

export async function createDexieStore(name = 'holdem-lab-flashcards'): Promise<Store> {
  const db = new FlashcardsDb(name);
  await db.open();
  const getSettings = async () => sanitizeSettings((await db.settings.get('settings'))?.value);
  return {
    persistent: true,
    getReviews: () => db.reviews.toArray(),
    putReview: async (r) => void (await db.reviews.put(r)),
    addHistory: async (h) => void (await db.history.add({ ...h })),
    getHistory: async (since) => (await db.history.where('at').aboveOrEqual(since).toArray()).map(strip),
    getEquity: async (k) => (await db.equityCache.get(k))?.value,
    putEquity: async (k, v) => void (await db.equityCache.put({ key: k, value: v })),
    getSettings,
    putSettings: async (s) => void (await db.settings.put({ key: 'settings', value: s })),
    exportAll: async () => ({
      version: 1,
      reviews: await db.reviews.toArray(),
      history: (await db.history.toArray()).map(strip),
      settings: await getSettings(),
    }),
    importAll: async (data) => {
      await db.transaction('rw', [db.reviews, db.history, db.settings], async () => {
        await db.reviews.clear();
        await db.history.clear();
        await db.reviews.bulkPut(data.reviews);
        await db.history.bulkAdd(data.history.map((h) => ({ ...h })));
        await db.settings.put({ key: 'settings', value: data.settings });
      });
    },
    clearHistory: () => db.history.clear(),
    clearProgress: () =>
      db.transaction('rw', [db.reviews, db.history], async () => {
        await db.reviews.clear();
        await db.history.clear();
      }),
  };
}
