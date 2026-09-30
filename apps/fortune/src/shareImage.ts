import { RANKS, rankOf, suitOf, type Card } from '@holdem-lab/engine';
import type { Fortune } from './fortune';

export type ImageLabels = { tier: string; hand: string; date: string };
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

function draw(ctx: CanvasRenderingContext2D, f: Fortune, labels: ImageLabels) {

  const bg = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.75);
  bg.addColorStop(0, FELT_IN);
  bg.addColorStop(1, FELT_OUT);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(`holdem-lab Fortune · ${labels.date}`, 64, 96);
  ctx.globalAlpha = 1;

  const handW = 130;
  f.hand.forEach((c, i) => drawCard(ctx, c, 64 + i * (handW + 16), 150, handW));
  const boardCards = f.board.filter((c) => f.bestFive.includes(c));
  const boardW = 84;
  boardCards.forEach((c, i) => drawCard(ctx, c, 64 + i * (boardW + 12), 380, boardW));

  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText('holdem-lab.com/fortune', 64, 580);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = `800 150px ${FONT}`;
  ctx.fillText(labels.tier, 900, 330);
  ctx.fillStyle = CREAM;
  ctx.font = `600 48px ${FONT}`;
  ctx.fillText(labels.hand, 900, 420);
}
