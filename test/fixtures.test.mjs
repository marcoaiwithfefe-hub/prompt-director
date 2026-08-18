// Committed full outputs, byte for byte.
//
// The matrix suites check that the right pieces are present in the right
// blocks. They cannot catch a joining bug that is consistent with itself: a
// missing space, a label rendered `Label:content`, blocks separated by one
// newline instead of two. These fixtures were composed independently of
// docs/assemble.js and hand-checked against grammar/video-blocks.md,
// grammar/video-modes.md and grammar/modes.md, so the resolver is compared
// with something it did not write.
//
// A fixture that fails is a question, not a chore: either the resolver drifted,
// or the grammar changed on purpose and the fixture is re-derived and re-read
// by a human before it is committed again.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assemble } from '../docs/assemble.js';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const DIR = join(paths.fixtures, 'expected');
const rows = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'));

export async function run() {
  const suite = createSuite('fixtures (committed full outputs)');

  for (const row of rows) {
    const expected = readFileSync(join(DIR, row.file), 'utf8');
    const actual = assemble(presets, row.mode, null, row.subject, {
      action: row.action,
      register: row.register || undefined,
    });
    suite.equal(`${row.file} matches byte for byte`, actual, expected);
  }

  // the fixture set covers what it claims to cover
  const covered = new Set(rows.map((row) => row.mode));
  for (const mode of presets.modes) {
    if (mode.mediaType === 'video' || ['product-shot', 'ad-916', 'poster'].includes(mode.id)) {
      suite.check(`${mode.id} has a committed fixture`, covered.has(mode.id));
    }
  }
  for (const mode of presets.modes.filter((candidate) => candidate.registers)) {
    for (const register of Object.keys(mode.registers.templates)) {
      suite.check(
        `${mode.id}/${register} has a committed fixture`,
        rows.some((row) => row.mode === mode.id && row.register === register)
      );
    }
  }
  for (const mode of presets.modes.filter((candidate) => candidate.mediaType === 'video')) {
    suite.check(
      `${mode.id} covers the empty-action branch`,
      rows.some((row) => row.mode === mode.id && !row.action)
    );
    suite.check(
      `${mode.id} covers the typed-action branch`,
      rows.some((row) => row.mode === mode.id && row.action)
    );
  }

  // no orphan files sitting in the directory pretending to be checked
  const onDisk = readdirSync(DIR).filter((file) => file.endsWith('.txt')).sort();
  suite.equal(
    'every committed fixture file is in the index',
    onDisk.join(','),
    rows.map((row) => row.file).sort().join(',')
  );

  return suite.finish();
}

await runAsMain(import.meta.url, run);
