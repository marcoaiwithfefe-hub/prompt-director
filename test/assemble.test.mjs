// Full valid matrix for the image side: every image mode crossed with every
// combination of its own controls, and for a register mode, once per register.
// This is the guard on the two things that fail silently, block exclusivity and
// template seams, so it runs the whole matrix, never a sample.
//
// The video side has its own shape and its own suite: test/video.test.mjs.

import { readFileSync } from 'node:fs';
import {
  assemble,
  capitalizeFirst,
  imageTemplate,
  normalizeSubject,
  startsSentence,
} from '../docs/assemble.js';
import { createSuite, paths, runAsMain, seamFailures } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const IMAGE_MODES = presets.modes.filter((mode) => mode.mediaType === 'image');

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

function registersOf(mode) {
  return mode.registers ? Object.keys(mode.registers.templates) : [null];
}

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

/** Everything a mode emits before its subject slot, at default selections. */
function prefixBeforeSubject(mode, register) {
  let emitted = '';
  for (const part of imageTemplate(mode, register)) {
    if (part.type === 'subject') return emitted;
    if (part.type === 'text') emitted += part.value;
    if (part.type === 'break') emitted += '\n\n';
    if (part.type === 'block') emitted += presets.sharedBlocks[part.block];
    if (part.type === 'control') {
      const group = mode.controls[part.control];
      emitted += group.options.find((candidate) => candidate.id === group.default).clause;
    }
  }
  return emitted;
}

/** The strings this combination must contain, in the order the template lists them. */
function landmarks(mode, selections, subject, register) {
  const out = [];
  let emitted = '';
  for (const part of imageTemplate(mode, register)) {
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
  const suite = createSuite('assemble (full image preset matrix)');
  const { FLAT_GRADE, CINEMA_STACK, CINEMA_PROSE_CLOSE, DETAIL_FIDELITY } = presets.sharedBlocks;
  let combos = 0;

  for (const mode of IMAGE_MODES) {
    for (const register of registersOf(mode)) {
      for (const selections of combinations(mode)) {
        for (const subject of SUBJECTS) {
          combos += 1;
          const tag = `${mode.id}${register ? `/${register}` : ''} [${JSON.stringify(selections)}]`;
          const prompt = assemble(presets, mode.id, selections, subject, { register });
          suite.check(`${tag} assembles`, typeof prompt === 'string' && prompt.length > 0);
          if (!prompt) continue;

          // clause presence and template order
          let cursor = 0;
          for (const landmark of landmarks(mode, selections, subject, register)) {
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
          // ad modes are finished frames: never a reference-plate grade
          if (['product-shot', 'ad-916', 'poster'].includes(mode.id)) {
            suite.check(`${tag} has no flat grade`, !prompt.includes(FLAT_GRADE));
            suite.check(`${tag} renders no text`, prompt.includes('No rendered text') || prompt.includes('no rendered text'));
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
  }

  const expected =
    IMAGE_MODES.reduce(
      (total, mode) => total + combinations(mode).length * registersOf(mode).length,
      0
    ) * SUBJECTS.length;
  suite.check('matrix ran every combination', combos === expected, `${combos} of ${expected}`);

  // Reference checkboxes on the image side: off leaves the prompt clean, on
  // appends the ref sentence at the prompt's end, per register.
  const REF_SUBJECT = SUBJECTS[0];
  for (const mode of IMAGE_MODES) {
    for (const register of registersOf(mode)) {
      const tag = register ? `${mode.id}/${register}` : mode.id;
      const off = assemble(presets, mode.id, null, REF_SUBJECT, { register });
      suite.check(`${tag} carries no ref tag when off`, !off.includes('_ref'));
      for (const ref of mode.refs || []) {
        const on = assemble(presets, mode.id, null, REF_SUBJECT, { register, refs: [ref.id] });
        for (const piece of ref.segments) {
          suite.check(`${tag} ends on ${ref.id} sentence`, on.endsWith(piece.text));
        }
        suite.check(`${tag} ${ref.id} only appends`, on.startsWith(off));
        const seams = seamFailures(on);
        suite.check(`${tag} ${ref.id} has clean seams`, seams.length === 0, seams.join(', '));
      }
    }
  }
  suite.check(
    'ref-capable image modes exist',
    IMAGE_MODES.filter((mode) => (mode.refs || []).length).length === 7
  );
  suite.check(
    'face-lock builds the reference, takes none',
    !IMAGE_MODES.find((mode) => mode.id === 'face-lock').refs
  );

  // Sentence case, derived from each mode's own template rather than a hardcoded
  // list: a mode that opens on the subject capitalizes it, a mode that drops it
  // mid-sentence leaves it alone. Rewriting a template moves this test with it.
  const lower = 'a woman in a long wool coat';
  let opening = 0;
  let midSentence = 0;
  for (const mode of IMAGE_MODES) {
    for (const register of registersOf(mode)) {
      const tag = `${mode.id}${register ? `/${register}` : ''}`;
      const opensSentence = startsSentence(prefixBeforeSubject(mode, register));
      const expectedText = opensSentence ? capitalizeFirst(lower) : lower;
      const prompt = assemble(presets, mode.id, null, lower, { register });
      suite.check(
        `${tag} cases the subject the way its template implies`,
        prompt.includes(expectedText),
        `expected ${JSON.stringify(expectedText.slice(0, 24))}`
      );
      if (opensSentence) {
        opening += 1;
        suite.check(`${tag} leaves no lowercase sentence start`, !prompt.includes(`. ${lower}`));
      } else {
        midSentence += 1;
        suite.check(
          `${tag} does not capitalize mid-sentence`,
          !prompt.includes(capitalizeFirst(lower))
        );
      }
    }
  }
  suite.check(
    'both casing branches exercised',
    opening > 0 && midSentence > 0,
    `${opening} sentence-opening, ${midSentence} mid-sentence`
  );
  return suite.finish();
}

await runAsMain(import.meta.url, run);
