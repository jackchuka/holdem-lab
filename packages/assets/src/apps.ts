// Listed in the order they appear on the top page. Adding an app means adding one row here.
export const APPS = [
  { id: 'fortune', title: 'Fortune', ja: '配られた7枚で占う今日のポーカー運勢', en: 'Daily poker fortune', devPort: 5175 },
  { id: 'flashcards', title: 'Flashcards', ja: '勝率・アウツ・レンジ・ポットオッズの暗記カード', en: "Hold'em flashcards", devPort: 5173 },
  { id: 'equity', title: 'Equity', ja: 'ハンドとレンジの勝率計算機', en: 'Hand and range equity calculator', devPort: 5174 },
] as const;

export type AppName = (typeof APPS)[number]['id'];

export const DEV_PORTS = Object.fromEntries(APPS.map((a) => [a.id, a.devPort])) as Record<AppName, number>;

// Built apps sit side by side under one origin; in `pnpm dev` each app is its own server on a fixed port.
export function appLinks(mode: string): Record<AppName, string> {
  return Object.fromEntries(
    APPS.map((a) => [a.id, mode === 'development' ? `http://localhost:${a.devPort}/` : `../${a.id}/`]),
  ) as Record<AppName, string>;
}
