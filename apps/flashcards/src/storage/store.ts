import { CATEGORIES, categoryOfKey } from '@holdem-lab/quiz';
import { ITEM_KINDS, defaultSettings, sanitizeSettings, type HistoryEntry, type ReviewRecord, type Settings } from '../types';

export type ExportData = { version: 1; reviews: ReviewRecord[]; history: HistoryEntry[]; settings: Settings };

export interface Store {
  readonly persistent: boolean;
  getReviews(): Promise<ReviewRecord[]>;
  putReview(r: ReviewRecord): Promise<void>;
  addHistory(h: HistoryEntry): Promise<void>;
  getHistory(sinceMs: number): Promise<HistoryEntry[]>;
  getEquity(key: string): Promise<number | undefined>;
  putEquity(key: string, value: number): Promise<void>;
  getSettings(): Promise<Settings>;
  putSettings(s: Settings): Promise<void>;
  exportAll(): Promise<ExportData>;
  importAll(data: ExportData): Promise<void>;
  clearHistory(): Promise<void>;
  clearProgress(): Promise<void>;
}

export function parseExport(raw: unknown): ExportData {
  if (typeof raw !== 'object' || raw === null) throw new Error('export must be an object');
  const d = raw as Record<string, unknown>;
  if (d.version !== 1) throw new Error(`unsupported version: ${String(d.version)}`);
  if (!Array.isArray(d.reviews) || !Array.isArray(d.history) || typeof d.settings !== 'object' || d.settings === null) {
    throw new Error('reviews, history or settings are malformed');
  }
  const reviews = d.reviews.map((r, i) => parseReview(r, i));
  d.history.forEach((h, i) => checkHistory(h, i));
  return {
    version: 1,
    reviews,
    history: d.history as HistoryEntry[],
    settings: sanitizeSettings(d.settings),
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isFinite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function keyIsValid(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  try {
    categoryOfKey(key);
    return true;
  } catch {
    return false;
  }
}

function parseReview(r: unknown, i: number): ReviewRecord {
  const bad = (why: string): never => {
    throw new Error(`reviews[${i}] is invalid: ${why}`);
  };
  if (!isRecord(r)) return bad('not an object');
  if (!keyIsValid(r.itemKey)) bad('itemKey');
  if (!CATEGORIES.includes(r.category as never)) bad('category');
  if (!isFinite(r.due)) bad('due');
  if (!isRecord(r.card)) return bad('card');
  const due = new Date(r.card.due as string);
  if (Number.isNaN(due.getTime())) bad('card.due');
  const last = r.card.last_review ? new Date(r.card.last_review as string) : undefined;
  return { ...r, card: { ...r.card, due, last_review: last } } as unknown as ReviewRecord;
}

function checkHistory(h: unknown, i: number): void {
  const ok =
    isRecord(h) &&
    keyIsValid(h.itemKey) &&
    CATEGORIES.includes(h.category as never) &&
    ITEM_KINDS.includes(h.kind as never) &&
    typeof h.correct === 'boolean' &&
    isFinite(h.elapsedMs) &&
    isFinite(h.at) &&
    (h.error === undefined || isFinite(h.error));
  if (!ok) throw new Error(`history[${i}] is invalid`);
}

export function createMemoryStore(): Store {
  let reviews = new Map<string, ReviewRecord>();
  let history: HistoryEntry[] = [];
  const equity = new Map<string, number>();
  let settings: Settings | null = null;
  return {
    persistent: false,
    getReviews: async () => [...reviews.values()],
    putReview: async (r) => void reviews.set(r.itemKey, r),
    addHistory: async (h) => void history.push(h),
    getHistory: async (since) => history.filter((h) => h.at >= since),
    getEquity: async (k) => equity.get(k),
    putEquity: async (k, v) => void equity.set(k, v),
    getSettings: async () => sanitizeSettings(settings),
    putSettings: async (s) => {
      settings = { ...s };
    },
    exportAll: async () => ({
      version: 1,
      reviews: [...reviews.values()],
      history: [...history],
      settings: sanitizeSettings(settings),
    }),
    importAll: async (data) => {
      reviews = new Map(data.reviews.map((r) => [r.itemKey, r]));
      history = [...data.history];
      settings = { ...data.settings };
    },
    clearHistory: async () => {
      history = [];
    },
    clearProgress: async () => {
      history = [];
      reviews = new Map();
    },
  };
}
