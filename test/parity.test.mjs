// Three doors, one grammar. This suite is what stops them drifting apart:
// PROMPT.md must carry every shared block verbatim, and the web copy of the
// preset registry must be byte-identical to the source in grammar/.

import { readFileSync } from 'node:fs';
import { checkSync } from '../scripts/sync-presets.mjs';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));

export async function run() {
  const suite = createSuite('parity (grammar, PROMPT.md, docs copy)');
  const promptMd = readFileSync(paths.promptMd, 'utf8');

  for (const [name, block] of Object.entries(presets.sharedBlocks)) {
    suite.check(
      `PROMPT.md carries ${name} verbatim`,
      promptMd.includes(block),
      `${block.length} characters missing or altered`
    );
  }

  for (const mode of presets.modes) {
    suite.check(`PROMPT.md names the ${mode.id} mode`, promptMd.includes(mode.label));
  }

  const sync = checkSync();
  suite.check('docs/presets.json matches grammar/presets.json', sync.inSync, sync.reason);

  return suite.finish();
}

await runAsMain(import.meta.url, run);
