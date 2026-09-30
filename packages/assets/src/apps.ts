// Listed in the order they appear on the top page. Adding an app means adding one row here.
export const APPS = [
  {
    id: 'fortune', title: 'Fortune', ja: '配られた7枚で占う今日のポーカー運勢', en: 'Daily poker fortune', devPort: 5175, shot: 'fortune-reveal.png',
    lead: {
      ja: '手札2枚とボード5枚でできた役で、今日の吉凶を決めるポーカーのおみくじ。友達の名前でも占えて、結果は画像つきでシェアできる。',
      en: 'A poker omikuji: the hand made by your two hole cards and a five-card board decides today’s luck. Read a friend’s fortune by name and share the result as an image.',
    },
  },
  {
    id: 'flashcards', title: 'Flashcards', ja: '勝率・アウツ・レンジ・ポットオッズの暗記カード', en: "Hold'em flashcards", devPort: 5173, shot: 'flashcards-question.png',
    lead: {
      ja: '勝率・アウツ・プリフロップレンジ・ポットオッズを、毎回生成される問題と間隔反復で身につける。解説つきで、よくある計算ミスも指摘する。',
      en: 'Learn equity, outs, preflop ranges and pot odds with freshly generated questions and spaced repetition. Every answer comes with an explanation.',
    },
  },
  {
    id: 'equity', title: 'Equity', ja: 'ハンドとレンジの勝率計算機', en: 'Hand and range equity calculator', devPort: 5174, shot: 'equity-main.png',
    lead: {
      ja: '2〜9人のハンドとレンジから勝率をその場で計算する。次のカードごとの勝率の増減や、レンジ内のハンドごとの勝率も見られる。',
      en: 'Equity for two to nine players, by hand or by range, computed on the spot. See how each next card shifts the odds and how every hand in a range fares.',
    },
  },
  {
    id: 'chips', title: 'Chips', ja: 'ポーカーチップの手遊びを 3D で分解して練習', en: 'Poker chip tricks, step by step in 3D', devPort: 5176, shot: 'chips-riffle.png',
    lead: {
      ja: 'リフルやサムフリップなど4つのチップトリックを、指の力点が見える 3D アニメーションでコマ送り。スロー再生と5つの視点で練習できる。',
      en: 'Four chip tricks, from the riffle to the thumb flip, broken down in 3D with every fingertip’s pressure shown. Slow it down and watch from five angles.',
    },
  },
] as const;

export const HOME_DEV_PORT = 5170;

export type AppName = (typeof APPS)[number]['id'];

export const DEV_PORTS = Object.fromEntries(APPS.map((a) => [a.id, a.devPort])) as Record<AppName, number>;

// Built apps sit side by side under one origin; in `pnpm dev` each app is its own server on a fixed port.
export function appLinks(mode: string): Record<AppName, string> {
  return Object.fromEntries(
    APPS.map((a) => [a.id, mode === 'development' ? `http://localhost:${a.devPort}/` : `../${a.id}/`]),
  ) as Record<AppName, string>;
}

export function homeLink(mode: string): string {
  return mode === 'development' ? `http://localhost:${HOME_DEV_PORT}/` : '../';
}
