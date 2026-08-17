#!/usr/bin/env node
// grammar/presets.json is the single machine source. The web app ships its own copy
// under docs/ because GitHub Pages only serves the docs/ folder.
//
//   node scripts/sync-presets.mjs          copy grammar/presets.json -> docs/presets.json
//   node scripts/sync-presets.mjs --check   diff only, exit 1 when the copies differ

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE = join(ROOT, 'grammar', 'presets.json');
export const TARGET = join(ROOT, 'docs', 'presets.json');

export function checkSync() {
  const source = readFileSync(SOURCE);
  if (!existsSync(TARGET)) {
    return { inSync: false, reason: 'docs/presets.json is missing' };
  }
  const target = readFileSync(TARGET);
  if (source.equals(target)) return { inSync: true, bytes: source.length };
  return {
    inSync: false,
    reason: `docs/presets.json differs from grammar/presets.json (${source.length} vs ${target.length} bytes)`,
  };
}

export function syncPresets() {
  const source = readFileSync(SOURCE);
  writeFileSync(TARGET, source);
  return { bytes: source.length };
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  if (process.argv.includes('--check')) {
    const result = checkSync();
    if (!result.inSync) {
      console.error(`presets out of sync: ${result.reason}`);
      console.error('run: node scripts/sync-presets.mjs');
      process.exit(1);
    }
    console.log(`presets in sync (${result.bytes} bytes)`);
  } else {
    const { bytes } = syncPresets();
    console.log(`copied grammar/presets.json -> docs/presets.json (${bytes} bytes)`);
  }
}
