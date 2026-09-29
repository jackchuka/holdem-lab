import { execFileSync } from 'node:child_process';

const allowed = new Set(['MIT', 'Apache-2.0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Zlib', '0BSD']);
const byLicense = JSON.parse(execFileSync('pnpm', ['licenses', 'list', '--prod', '--json'], { encoding: 'utf8' }));
const disallowed = Object.entries(byLicense).filter(([license]) => !allowed.has(license));

if (disallowed.length) {
  for (const [license, pkgs] of disallowed) console.error(`${license}: ${pkgs.map((p) => p.name).join(', ')}`);
  process.exit(1);
}
console.log(`runtime dependency licenses OK: ${Object.keys(byLicense).join(', ')}`);
