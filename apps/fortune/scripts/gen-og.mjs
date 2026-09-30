import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const icon = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8').replace('<svg ', '<svg x="80" y="155" width="320" height="320" ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#1f6b45"/><stop offset="1" stop-color="#0d3b26"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${icon.replace(/<\?xml[^>]*>/, '')}
  <text x="450" y="290" fill="#d8b45a" font-family="Hiragino Sans, sans-serif" font-weight="800" font-size="72">今日のポーカー運勢</text>
  <text x="450" y="370" fill="#f3ecd8" font-family="Hiragino Sans, sans-serif" font-size="40">配られた7枚で、今日を占う。</text>
  <text x="450" y="450" fill="#f3ecd8" fill-opacity="0.7" font-family="Hiragino Sans, sans-serif" font-size="32">holdem-lab.com/fortune</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('wrote public/og.png');
