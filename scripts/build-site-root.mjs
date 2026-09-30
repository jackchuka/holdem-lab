import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { APPS } from '../packages/assets/src/apps.ts';
import { CF_BEACON_SRC } from '../packages/assets/src/cloudflare-analytics.ts';
import { renderSiteIndex } from '../packages/assets/src/site-index.ts';

const out = process.argv[2] ?? 'site';
const root = new URL('..', import.meta.url).pathname;
const template = readFileSync(join(root, 'site-root/index.html'), 'utf8');
const html = renderSiteIndex(template, APPS, { beaconSrc: CF_BEACON_SRC, beaconToken: process.env.CF_BEACON_TOKEN || undefined });

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
copyFileSync(join(root, 'packages/assets/brand/holdem-lab.svg'), join(out, 'holdem-lab.svg'));
console.log(`wrote ${join(out, 'index.html')} (${APPS.length} apps)`);
