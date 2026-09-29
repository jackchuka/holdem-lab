const CREAM = '#fbf7ec';
const GOLD = '#d8b45a';
const STROKE = 34;
const GAP = 26;
// F is open below its middle bar, so a following lowercase letter can tuck in closer.
const KERNING = { Fc: -20 };

// Stroke outlines drawn on a baseline at y=0 with a 190-unit cap height.
// Lowercase ascenders rise above the cap height and "l" carries a tail so it never reads as "I".
const GLYPHS = {
  H: { width: 150, d: 'M17 -190V0M133 -190V0M17 -96H133' },
  F: { width: 108, d: 'M17 0V-190M0 -173H108M17 -98H94' },
  l: { width: 62, d: 'M17 -222V-44A44 44 0 0 0 61 0' },
  c: { width: 122, d: 'M100.1 -105.9A51 51 0 1 0 100.1 -30.1' },
  0: { width: 120, d: 'M60 -173A43 78 0 0 1 60 -17A43 78 0 0 1 60 -173Z' },
  1: { width: 90, d: 'M8 -150L56 -190V0M8 0H104' },
};

const SPADE =
  'M256 170c-40 52-92 82-92 128 0 30 24 50 52 50 16 0 30-7 38-18-2 26-10 44-26 58h56c-16-14-24-32-26-58 8 11 22 18 38 18 28 0 52-20 52-50 0-46-52-76-92-128z';

function glyphRun(text) {
  let x = 0;
  const parts = [];
  const chars = [...text];
  chars.forEach((ch, i) => {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`no glyph for "${ch}"; add its outline to GLYPHS in element-icon.mjs`);
    parts.push(`<path d="${glyph.d}" transform="translate(${x} 0)"/>`);
    x += glyph.width + GAP + (KERNING[ch + (chars[i + 1] ?? '')] ?? 0);
  });
  return { body: parts.join(''), width: x - GAP };
}

export function elementIcon({ number, symbol }) {
  if (!/^[A-Z][a-z]?$/.test(symbol)) throw new Error(`symbol must look like an element symbol (e.g. "Fc"), got "${symbol}"`);
  const sym = glyphRun(symbol);
  const num = glyphRun(String(number));
  const strokeAttrs = `fill="none" stroke-width="${STROKE}" stroke-linecap="butt" stroke-linejoin="miter"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="felt" cx="50%" cy="35%" r="75%">
      <stop offset="0" stop-color="#1f6b45"/>
      <stop offset="1" stop-color="#0d3b26"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#felt)"/>
  <rect x="44" y="44" width="424" height="424" rx="76" fill="none" stroke="${GOLD}" stroke-width="12"/>
  <g ${strokeAttrs} stroke="${GOLD}" transform="translate(86 140) scale(0.3)">${num.body}</g>
  <path d="${SPADE}" fill="${GOLD}" transform="translate(412 110) scale(0.34) translate(-256 -288)"/>
  <g ${strokeAttrs} stroke="${CREAM}" transform="translate(${(256 - sym.width / 2).toFixed(1)} 352)">${sym.body}</g>
</svg>
`;
}
