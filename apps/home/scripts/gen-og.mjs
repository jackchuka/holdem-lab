import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { APPS } from '../../../packages/assets/src/apps.ts';

const svgAt = (url, x, y, size) => readFileSync(url, 'utf8').replace(/<\?xml[^>]*>/, '').replace('<svg ', `<svg x="${x}" y="${y}" width="${size}" height="${size}" `);

const logo = svgAt(new URL('../public/icon.svg', import.meta.url), 100, 110, 240);
const size = 96;
const gap = 32;
const left = (1200 - (APPS.length * size + (APPS.length - 1) * gap)) / 2;
const icons = APPS.map((a, i) => svgAt(new URL(`../../${a.id}/public/icon.svg`, import.meta.url), left + i * (size + gap), 440, size)).join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#1f6b45"/><stop offset="1" stop-color="#0d3b26"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${logo}
  <text x="400" y="220" fill="#f3ecd8" font-family="Hiragino Sans, sans-serif" font-weight="800" font-size="84">holdem-lab</text>
  <text x="400" y="300" fill="#d8b45a" font-family="Hiragino Sans, sans-serif" font-weight="700" font-size="40">ホールデムを、覚えて・計算して・遊ぶ</text>
  ${icons}
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('wrote public/og.png');
