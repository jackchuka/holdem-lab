#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { APPS, HOME_DEV_PORT, appLinks } from '../src/apps.ts';
import { CF_BEACON_SRC } from '../src/cloudflare-analytics.ts';
import { renderSiteIndex } from '../src/site-index.ts';

const template = new URL('../../../site-root/index.html', import.meta.url);
const logo = new URL('../brand/holdem-lab.svg', import.meta.url);
const links = appLinks('development');

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (path === '/holdem-lab.svg') {
    res.writeHead(200, { 'content-type': 'image/svg+xml' }).end(readFileSync(logo));
  } else if (path === '/' || path === '/index.html') {
    const html = renderSiteIndex(readFileSync(template, 'utf8'), APPS, { beaconSrc: CF_BEACON_SRC, appUrl: (id) => links[id] });
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
  } else {
    res.writeHead(404).end();
  }
}).listen(HOME_DEV_PORT, () => console.log(`holdem-lab home: http://localhost:${HOME_DEV_PORT}/`));
