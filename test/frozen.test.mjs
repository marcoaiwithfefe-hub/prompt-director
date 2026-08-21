// v1's grammar, frozen.
//
// test/fixtures/presets-v1.json is an exact copy of grammar/presets.json as it
// stood at commit 8f8cc8d, the last build before the video axis landed. v2 was
// allowed to add two fields to those five modes and nothing else: every clause,
// every template part and every shared block a live prompt already depends on
// has to come out the same.
//
// The fixture is pinned to history rather than to whatever v2 happened to
// leave behind, so this suite cannot be satisfied by regenerating it.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const frozen = JSON.parse(readFileSync(join(paths.fixtures, 'presets-v1.json'), 'utf8'));

/** The only fields later versions were allowed to add to a v1 mode: the v2
 * media axis, then the reference checkboxes (default-off, so a live prompt
 * without refs still assembles byte-identically). */
const NEW_AXIS_FIELDS = ['mediaType', 'targetModel', 'refs'];

function withoutNewFields(mode) {
  const copy = { ...mode };
  for (const field of NEW_AXIS_FIELDS) delete copy[field];
  return copy;
}

export async function run() {
  const suite = createSuite('frozen (v1 grammar cannot move)');

  suite.equal('the fixture is the v1 registry', frozen.schemaVersion, 1);
  suite.equal('the live registry is v2', presets.schemaVersion, 2);

  for (const before of frozen.modes) {
    const after = presets.modes.find((mode) => mode.id === before.id);
    suite.check(`${before.id} still exists`, Boolean(after));
    if (!after) continue;

    for (const field of ['mediaType', 'targetModel']) {
      suite.check(`${before.id} gained ${field}`, after[field] !== undefined);
    }
    suite.equal(
      `${before.id} is otherwise byte-identical`,
      JSON.stringify(withoutNewFields(after)),
      JSON.stringify(before)
    );
    const gained = Object.keys(after).filter((field) => !Object.keys(before).includes(field));
    suite.check(
      `${before.id} gained nothing outside the allowed axis fields`,
      gained.every((field) => NEW_AXIS_FIELDS.includes(field))
    );
  }

  for (const [name, text] of Object.entries(frozen.sharedBlocks)) {
    suite.equal(`${name} is unchanged`, presets.sharedBlocks[name], text);
  }

  suite.equal(
    'the v1 modes still lead the registry, in order',
    presets.modes.slice(0, frozen.modes.length).map((mode) => mode.id).join(','),
    frozen.modes.map((mode) => mode.id).join(',')
  );
  // v1 parked three future axes. v2 shipped two of them, so exactly those two
  // leave the reserved list and nothing new joins it.
  suite.equal(
    'the reserved axes lost exactly the two that shipped',
    JSON.stringify(presets._reservedFutureAxes),
    JSON.stringify(frozen._reservedFutureAxes.filter((axis) => !NEW_AXIS_FIELDS.includes(axis)))
  );

  return suite.finish();
}

await runAsMain(import.meta.url, run);
