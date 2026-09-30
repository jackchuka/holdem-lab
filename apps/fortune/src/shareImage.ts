import { RANKS, rankOf, suitOf, type Card } from '@holdem-lab/engine';
import type { Fortune } from './fortune';

export type ImageLabels = {
  tier: string;
  hand: string;
  date: string;
  comment: string;
  handPower: string;
  lucky: [string, string, string];
};
export type CanvasLike = {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D | null;
  toBlob(cb: (b: Blob | null) => void, type: string): void;
};

const W = 1200;
const H = 630;
const FONT = "-apple-system, system-ui, 'Hiragino Sans', sans-serif";
const FELT_IN = '#1f6b45';
const FELT_OUT = '#0d3b26';
const CREAM = '#f3ecd8';
const CARD_BG = '#fbf7ec';
const GOLD = '#d8b45a';
const RED = '#c62828';
const RED_ON_FELT = '#ff7a7a';
const BLACK = '#1a1a1a';
const GLYPHS = ['♠', '♥', '♦', '♣'];

function drawCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number) {
  const h = w * 1.4;
  ctx.fillStyle = CARD_BG;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w * 0.12);
  ctx.fill();
  const suit = suitOf(card);
  ctx.fillStyle = suit === 1 || suit === 2 ? RED : BLACK;
  ctx.textAlign = 'center';
  const rank = RANKS[rankOf(card)];
  ctx.font = `700 ${Math.round(w * 0.5)}px ${FONT}`;
  ctx.fillText(rank === 'T' ? '10' : rank, x + w / 2, y + h * 0.48);
  ctx.font = `${Math.round(w * 0.46)}px ${FONT}`;
  ctx.fillText(GLYPHS[suit], x + w / 2, y + h * 0.86);
}

export async function renderShareImage(
  f: Fortune,
  labels: ImageLabels,
  canvas: CanvasLike = document.createElement('canvas'),
): Promise<Blob | null> {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  try {
    draw(ctx, f, labels);
  } catch {
    return null;
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

function fitFont(ctx: CanvasRenderingContext2D, weight: number, px: number, text: string, maxW: number) {
  do ctx.font = `${weight} ${px}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && --px > 12);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const tokens = text.includes(' ') ? text.split(/(?<= )/) : Array.from(new Intl.Segmenter().segment(text), (s) => s.segment);
  const lines: string[] = [];
  let line = '';
  for (const tok of tokens) {
    if (line && ctx.measureText(line + tok).width > maxW) {
      lines.push(line.trimEnd());
      line = tok.trimStart();
    } else line += tok;
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}

function draw(ctx: CanvasRenderingContext2D, f: Fortune, labels: ImageLabels) {
  const bg = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.75);
  bg.addColorStop(0, FELT_IN);
  bg.addColorStop(1, FELT_OUT);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(`holdem-lab Fortune · ${labels.date}`, 64, 84);
  ctx.globalAlpha = 1;

  const handW = 140;
  f.hand.forEach((c, i) => drawCard(ctx, c, 64 + i * (handW + 16), 124, handW));
  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.7;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(labels.handPower, 384, 200);
  ctx.globalAlpha = 1;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(f.handClass, 384, 256);
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(`${Math.round(f.preflopEquity * 100)}%`, 384, 304);

  const boardW = 88;
  f.board.forEach((c, i) => {
    ctx.globalAlpha = f.bestFive.includes(c) ? 1 : 0.35;
    drawCard(ctx, c, 64 + i * (boardW + 12), 370, boardW);
  });
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText('holdem-lab.com/fortune', 64, 588);
  ctx.globalAlpha = 1;

  const colX = 616;
  const colW = W - 64 - colX;
  const mid = colX + colW / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  fitFont(ctx, 800, 128, labels.tier, colW);
  ctx.fillText(labels.tier, mid, 200);
  ctx.fillStyle = CREAM;
  ctx.font = `600 42px ${FONT}`;
  ctx.fillText(labels.hand, mid, 264);

  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(mid - 120, 296, 240, 2);
  ctx.globalAlpha = 1;

  ctx.fillStyle = CREAM;
  ctx.font = `500 28px ${FONT}`;
  wrap(ctx, labels.comment, colW)
    .slice(0, 2)
    .forEach((line, i) => ctx.fillText(line, mid, 350 + i * 40));

  const gap = 14;
  const boxW = (colW - gap * 2) / 3;
  const values = [f.luckyPosition, GLYPHS[f.luckySuit], `${f.luckySize}%`];
  labels.lucky.forEach((label, i) => {
    const x = colX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.roundRect(x, 440, boxW, 110, 16);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = CREAM;
    ctx.globalAlpha = 0.7;
    fitFont(ctx, 500, 20, label, boxW - 20);
    ctx.fillText(label, x + boxW / 2, 476);
    ctx.globalAlpha = 1;
    ctx.fillStyle = i === 1 && (f.luckySuit === 1 || f.luckySuit === 2) ? RED_ON_FELT : CREAM;
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(values[i], x + boxW / 2, 528);
  });
}
