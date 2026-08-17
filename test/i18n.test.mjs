// The Cantonese UI layer must cover everything the grammar can render: every
// mode hint, every locked note, every control group and option. English is the
// fallback, so a hole here silently ships mixed-language UI — this suite makes
// holes loud. The prompt itself must stay English: no CJK may leak into the
// grammar or the assembled output.

import { readFileSync } from 'node:fs';
import { assemble, defaultSelections } from '../docs/assemble.js';
import {
  CONTROLS_YUE,
  LOCKED_NOTES_YUE,
  MODE_HINTS_YUE,
  STRINGS,
} from '../docs/i18n.js';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const CJK = /[㐀-鿿，。]/;

export async function run() {
  const suite = createSuite('i18n (Cantonese UI coverage)');

  const enKeys = Object.keys(STRINGS.en).sort();
  const yueKeys = Object.keys(STRINGS.yue).sort();
  suite.equal('en and yue string tables carry the same keys', enKeys.join(','), yueKeys.join(','));

  for (const mode of presets.modes) {
    suite.check(`${mode.id} has a Cantonese hint`, Boolean(MODE_HINTS_YUE[mode.id]));
    if (mode.lockedNote) {
      suite.check(`${mode.id} has a Cantonese locked note`, Boolean(LOCKED_NOTES_YUE[mode.id]));
    }
    for (const [controlId, group] of Object.entries(mode.controls || {})) {
      const table = CONTROLS_YUE[controlId];
      suite.check(`${mode.id}/${controlId} has a Cantonese group label`, Boolean(table?.label));
      for (const option of group.options) {
        suite.check(
          `${mode.id}/${controlId}/${option.id} has a Cantonese option label`,
          Boolean(table?.options[option.id])
        );
      }
    }
  }

  // language layer never leaks into the prompt: grammar stays English, and a
  // full assembly from every mode's defaults carries no CJK of its own
  suite.check('grammar presets carry no CJK', !CJK.test(readFileSync(paths.grammarPresets, 'utf8')));
  for (const mode of presets.modes) {
    const prompt = assemble(presets, mode.id, defaultSelections(mode), 'a woman in a red dress');
    suite.check(`${mode.id} assembled prompt stays English`, !CJK.test(prompt));
  }

  return suite.finish();
}

await runAsMain(import.meta.url, run);
