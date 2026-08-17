// Full valid matrix: every mode crossed with every combination of its own
// controls. This is the guard on the two things that fail silently, block
// exclusivity and template seams, so it runs the whole matrix, never a sample.

import { readFileSync } from 'node:fs';
import { assemble, capitalizeFirst, normalizeSubject, startsSentence } from '../docs/assemble.js';
import { createSuite, paths, runAsMain, seamFailures } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));

const CHARACTER_MODES = ['face-lock', 'outfit-styling', 'char-sheet'];
const SUBJECTS = [
  'a woman with jet black hair in a cropped white ribbed tank',
  '亞洲男人，深藍色西裝，工作室頭像',
];

// Literals the grammar is allowed to carry that look like a ratio.
const ALLOWED_RATIO_LITERALS = [
  '3:4 headshot',
  '18%',
  '35mm',
  '50mm',
  '55mm-equivalent',
  '2x anamorphic',
];

function combinations(mode) {
  const controlIds = Object.keys(mode.controls || {});
  let rows = [{}];
  for (const controlId of controlIds) {
    const next = [];
    for (const row of rows) {
      for (const option of mode.controls[controlId].options) {
        next.push({ ...row, [controlId]: option.id });
      }
    }
    rows = next;
  }
  return rows;
}

/** The strings this combination must contain, in the order the template lists them. */
function landmarks(mode, selections, subject) {
  const out = [];
  let emitted = '';
  for (const part of mode.template) {
    let piece = '';
    if (part.type === 'text') piece = part.value;
    if (part.type === 'break') piece = '\n\n';
    if (part.type === 'subject') {
      const clean = normalizeSubject(subject);
      piece = startsSentence(emitted) ? capitalizeFirst(clean) : clean;
    }
    if (part.type === 'control') {
      const group = mode.controls[part.control];
      piece = group.options.find((candidate) => candidate.id === selections[part.control]).clause;
    }
    if (part.type === 'block') piece = presets.sharedBlocks[part.block];
    emitted += piece;

    if (part.type === 'break') continue;
    if (part.type === 'text' && part.value.trim().length <= 3) continue;
    out.push(part.type === 'text' ? part.value.trim() : piece);
  }
  return out;
}

export async function run() {
  const suite = createSuite('assemble (full preset matrix)');
  const { FLAT_GRADE, CINEMA_STACK, CINEMA_PROSE_CLOSE, DETAIL_FIDELITY } = presets.sharedBlocks;
  let combos = 0;

  for (const mode of presets.modes) {
    for (const selections of combinations(mode)) {
      for (const subject of SUBJECTS) {
        combos += 1;
        const tag = `${mode.id} [${JSON.stringify(selections)}]`;
        const prompt = assemble(presets, mode.id, selections, subject);
        suite.check(`${tag} assembles`, typeof prompt === 'string' && prompt.length > 0);
        if (!prompt) continue;

        // clause presence and template order
        let cursor = 0;
        for (const landmark of landmarks(mode, selections, subject)) {
          const at = prompt.indexOf(landmark, cursor);
          suite.check(
            `${tag} keeps template order`,
            at >= 0,
            `missing or out of order: ${JSON.stringify(landmark.slice(0, 60))}`
          );
          if (at >= 0) cursor = at + landmark.length;
        }

        // block exclusivity: mixing these is the silent failure that teaches bad prompting
        if (CHARACTER_MODES.includes(mode.id)) {
          suite.check(`${tag} closes on the flat grade`, prompt.includes(FLAT_GRADE));
          suite.check(`${tag} has no cinema stack`, !prompt.includes(CINEMA_STACK));
          suite.check(`${tag} has no cinema prose close`, !prompt.includes(CINEMA_PROSE_CLOSE));
        }
        if (mode.id === 'scene') {
          suite.check(`${tag} closes on the cinema prose`, prompt.includes(CINEMA_PROSE_CLOSE));
          suite.check(`${tag} has no flat grade`, !prompt.includes(FLAT_GRADE));
        }
        if (mode.id === 'detail') {
          suite.check(`${tag} carries the cinema stack`, prompt.includes(CINEMA_STACK));
          suite.check(`${tag} carries the detail fidelity block`, prompt.includes(DETAIL_FIDELITY));
        }

        // seams
        const seams = seamFailures(prompt);
        suite.check(`${tag} has clean seams`, seams.length === 0, seams.join(', '));

        // ratio language never reaches the prompt body
        let stripped = prompt;
        for (const literal of ALLOWED_RATIO_LITERALS) stripped = stripped.split(literal).join(' ');
        const ratioHit = stripped.match(/\b\d+:\d+\b/);
        suite.check(`${tag} carries no aspect ratio`, !ratioHit, ratioHit ? ratioHit[0] : '');
      }
    }
  }

  const expected =
    presets.modes.reduce((total, mode) => total + combinations(mode).length, 0) * SUBJECTS.length;
  suite.check('matrix ran every combination', combos === expected, `${combos} of ${expected}`);

  // sentence case: the subject is capitalized where it opens a sentence and left
  // alone where the template drops it mid-sentence
  const lower = 'a woman in a long wool coat';
  for (const modeId of ['face-lock', 'outfit-styling', 'char-sheet', 'detail']) {
    const prompt = assemble(presets, modeId, null, lower);
    suite.check(`${modeId} capitalizes a sentence-opening subject`, prompt.includes('A woman in a long wool coat'));
  }
  const scene = assemble(presets, 'scene', null, lower);
  suite.check('scene keeps a mid-sentence subject lowercase', scene.includes('of a woman in a long wool coat'));
  suite.check('scene does not capitalize mid-sentence', !scene.includes('of A woman'));
  return suite.finish();
}

await runAsMain(import.meta.url, run);
