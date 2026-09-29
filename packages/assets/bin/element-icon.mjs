#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { elementIcon } from '../src/element-icon.mjs';

const [number, symbol, out] = process.argv.slice(2);
if (!number || !symbol || !out) {
  console.error('usage: element-icon <number> <Symbol> <out.svg>');
  process.exit(2);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, elementIcon({ number: Number(number), symbol }));
console.log(`wrote ${out}`);
