// The video side, end to end. Two things break silently here and both are
// covered on purpose:
//
//   PORTING   a locked physics block reworded by a hair still reads fine and
//             quietly makes every clip look like AI. Every tool segment is
//             diffed against the registry string it came from, never eyeballed.
//   ASSEMBLY  eight blocks, grammar order, the runtime in Camera Capture equal
//             to the chip, degrees-first lenses off the ladder, the four
//             scaffold lines present, nothing unresolved.
//
// The matrix is the whole matrix: every chip combination of every video mode,
// twice for the subject, twice for action-typed against action-empty.

import { readFileSync } from 'node:fs';
import {
  VIDEO_BLOCK_ORDER,
  activeRefs,
  assemble,
  assembleParts,
  blockContent,
  capitalizeFirst,
  normalizeSubject,
  refFilenames,
  renderParts,
  toolText,
} from '../docs/assemble.js';
import { createSuite, paths, runAsMain, seamFailures } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const VIDEO_MODES = presets.modes.filter((mode) => mode.mediaType === 'video');

const SUBJECTS = [
  'a matte black skincare bottle',
  'a woman in a grey hoodie at a kitchen counter',
];
const ACTION = 'she lifts the bottle and turns it toward the lens';

// The only field-of-view values the grammar may speak, plus the shutter angle
// that is not a field of view at all.
const FOV_LADDER = [107, 84, 63, 47, 29, 18, 12];
const SHUTTER = 180;

const SCAFFOLD = {
  oner: 'VIDEO_ONER',
  suppression: 'VIDEO_TEXT_SUPPRESSION',
};

function combinations(mode) {
  let rows = [{}];
  for (const [controlId, group] of Object.entries(mode.controls || {})) {
    const next = [];
    for (const row of rows) {
      for (const option of group.options) next.push({ ...row, [controlId]: option.id });
    }
    rows = next;
  }
  return rows;
}

function subsets(items) {
  const out = [[]];
  for (const item of items) {
    for (const row of [...out]) out.push([...row, item]);
  }
  return out;
}

function optionOf(mode, controlId, selections) {
  const group = mode.controls[controlId];
  return group.options.find((candidate) => candidate.id === selections[controlId]);
}

/**
 * Every control part a video mode carries: which control, which of its texts,
 * and the block it writes into. A camera group writes twice — its gear clause
 * into Camera Capture, its movement prose into Movement — so this is a list
 * rather than one block per control.
 */
function controlHomes(mode) {
  const homes = [];
  for (const block of mode.blocks) {
    for (const part of block.template) {
      if (part.type === 'control') {
        homes.push({ control: part.control, field: part.field || 'clause', block: block.id });
      }
    }
  }
  return homes;
}

/** A slot at the start of a sentence capitalizes what the visitor typed. */
function carries(text, value) {
  return text.includes(value) || text.includes(capitalizeFirst(value));
}

function countOf(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) {
    count += 1;
    at = haystack.indexOf(needle, at + needle.length);
  }
  return count;
}

/**
 * Rebuild the tool segments a block must emit, walked independently from the
 * registry. Comparing this with what the engine produced is the porting gate.
 */
function expectedToolSegments(mode, block, selections, refs) {
  const out = [];
  for (const part of block.template) {
    if (part.type === 'text') out.push(part.value);
    if (part.type === 'control') out.push(optionOf(mode, part.control, selections)[part.field || 'clause']);
    if (part.type === 'block') out.push(presets.sharedBlocks[part.block]);
    if (part.type === 'action' && !refs.actionTyped) out.push(mode.defaultAction);
    if (part.type === 'action' && refs.actionTyped) out.push('.');
  }
  for (const ref of refs.active) {
    for (const piece of ref.segments) {
      if (piece.block === block.id) out.push(piece.text);
    }
  }
  return out;
}

export async function run() {
  const suite = createSuite('video (block assembly, porting fidelity, references)');

  suite.check('the registry ships four video modes', VIDEO_MODES.length === 4, String(VIDEO_MODES.length));

  for (const mode of VIDEO_MODES) {
    const homes = controlHomes(mode);
    const combos = combinations(mode);

    // ---- the full chip matrix ----
    for (const selections of combos) {
      for (const subject of SUBJECTS) {
        for (const actionTyped of [false, true]) {
          const tag = `${mode.id} [${JSON.stringify(selections)}] ${actionTyped ? 'action' : 'default'}`;
          const state = { selections, subject, action: actionTyped ? ACTION : '   ' };
          const parts = assembleParts(presets, mode.id, state);
          suite.check(`${tag} assembles`, Boolean(parts));
          if (!parts) continue;
          const prompt = renderParts(parts);
          const tool = toolText(parts);

          // every block, in grammar order, labelled, never empty
          const labels = parts.blocks.map((block) => block.id);
          suite.equal(`${tag} emits the eight blocks in order`, labels.join(','), VIDEO_BLOCK_ORDER.join(','));
          suite.check(
            `${tag} has no empty or dangling block`,
            parts.blocks.every((block) => blockContent(block).trim().length > 0)
          );
          suite.check(
            `${tag} labels every block`,
            parts.blocks.every((block) => prompt.includes(`${block.label}: `))
          );

          // the four scaffold lines the grammar never ships without
          const byId = Object.fromEntries(parts.blocks.map((block) => [block.id, blockContent(block)]));
          suite.check(`${tag} closes Movement on the one-shot clause`, byId.movement.includes(presets.sharedBlocks[SCAFFOLD.oner]));
          suite.check(`${tag} closes Last Frame on the text suppression`, byId['last-frame'].includes(presets.sharedBlocks[SCAFFOLD.suppression]));
          suite.check(`${tag} opens Sound Bed on the diegetic line`, byId['sound-bed'].startsWith('Diegetic only — '));
          suite.check(
            `${tag} closes Subject Lock on a lock-down line`,
            ['VIDEO_LOCKDOWN_PERSON', 'VIDEO_LOCKDOWN_PRODUCT', 'VIDEO_LOCKDOWN_ENVIRONMENT'].some(
              (name) => byId['subject-lock'].includes(presets.sharedBlocks[name])
            )
          );

          // chips land in their own block, exactly once, and nowhere else
          let misplaced = '';
          for (const { control, field, block: home } of homes) {
            const text = optionOf(mode, control, selections)[field];
            if (countOf(byId[home], text) !== 1) misplaced = `${control} ${field} not once in ${home}`;
            for (const [blockId, content] of Object.entries(byId)) {
              if (blockId !== home && content.includes(text)) misplaced = `${control} ${field} leaked into ${blockId}`;
            }
          }
          suite.check(`${tag} places every chip text in its own block, once`, !misplaced, misplaced);

          // the runtime the visitor picked is the runtime the camera line carries
          const runtime = optionOf(mode, 'runtime', selections).clause;
          suite.check(
            `${tag} Camera Capture carries the chosen runtime`,
            byId['camera-capture'].includes(`, ${runtime}.`),
            runtime
          );

          // degrees first, ladder values only
          const degrees = [...tool.matchAll(/(\d+)°/g)].map((hit) => Number(hit[1]));
          suite.check(
            `${tag} speaks only ladder field-of-view values`,
            degrees.every((value) => FOV_LADDER.includes(value) || value === SHUTTER),
            degrees.join(',')
          );
          const lens = optionOf(mode, 'lens', selections).clause;
          suite.check(`${tag} writes the lens degrees first`, /^\d+° \(/.test(lens), lens);

          // tool-segment invariants, asserted on tool text alone
          suite.check(`${tag} leaves no unresolved token`, !/[{}]/.test(tool));
          suite.check(`${tag} carries no aspect ratio`, !/\b\d+:\d+\b/.test(tool));
          suite.check(`${tag} carries no reference tag with the boxes off`, !tool.includes('@'));
          suite.check(`${tag} has clean seams`, seamFailures(prompt).length === 0, seamFailures(prompt).join(', '));

          // the visitor's own words, verbatim
          const cleanSubject = normalizeSubject(subject);
  suite.check(`${tag} carries the subject`, carries(prompt, cleanSubject));
          if (actionTyped) {
            suite.check(`${tag} carries the typed action`, carries(byId.movement, normalizeSubject(ACTION)));
            suite.check(`${tag} drops the default action`, !byId.movement.includes(mode.defaultAction));
          } else {
            suite.equal(
              `${tag} fires the mode default action exactly once`,
              countOf(byId.movement, mode.defaultAction),
              1
            );
          }

          // porting fidelity: every tool segment is the registry's own string
          let ported = '';
          for (const [index_, block] of parts.blocks.entries()) {
            const source = mode.blocks[index_];
            const expected = expectedToolSegments(mode, source, selections, { active: [], actionTyped });
            const actual = block.segments.filter((part) => part.kind === 'tool').map((part) => part.text);
            if (actual.length !== expected.length) {
              ported = `${block.id}: ${actual.length} tool segments, expected ${expected.length}`;
              break;
            }
            for (let index = 0; index < expected.length; index += 1) {
              if (actual[index] !== expected[index]) {
                ported = `${block.id}[${index}] reworded: ${JSON.stringify(actual[index].slice(0, 50))}`;
                break;
              }
            }
            if (ported) break;
          }
          suite.check(`${tag} ports every registry string byte for byte`, !ported, ported);
        }
      }
    }

    // ---- empty subject is the disabled-Copy state, on video too ----
    for (const [label, subject] of [['empty', ''], ['spaces', '   '], ['punctuation', '...']]) {
      suite.equal(
        `${mode.id} returns null for a ${label} subject`,
        assemble(presets, mode.id, null, subject, { action: ACTION }),
        null
      );
    }

    // ---- locked chips emit exactly their one option ----
    for (const [controlId, group] of Object.entries(mode.controls)) {
      if (!group.locked) continue;
      suite.equal(`${mode.id}/${controlId} locked group holds one option`, group.options.length, 1);
      suite.check(`${mode.id}/${controlId} locked group explains itself`, Boolean(group.why));
      const prompt = assemble(presets, mode.id, null, SUBJECTS[0]);
      suite.equal(
        `${mode.id}/${controlId} emits its single clause once`,
        countOf(prompt, group.options[0].clause),
        1
      );
    }

    // ---- the reference matrix ----
    for (const chosen of subsets((mode.refs || []).map((ref) => ref.id))) {
      const tag = `${mode.id} refs [${chosen.join('+') || 'none'}]`;
      const parts = assembleParts(presets, mode.id, {
        selections: null,
        subject: SUBJECTS[0],
        action: ACTION,
        refs: chosen,
      });
      const byId = Object.fromEntries(parts.blocks.map((block) => [block.id, blockContent(block)]));
      const tool = toolText(parts);
      const active = activeRefs(mode, chosen);

      suite.equal(`${tag} activates the right count`, active.length, chosen.length);
      for (const ref of mode.refs || []) {
        const on = chosen.includes(ref.id);
        for (const piece of ref.segments) {
          suite.equal(
            `${tag} ${ref.id} at ${piece.block}`,
            countOf(byId[piece.block], piece.text),
            on ? 1 : 0
          );
          for (const [blockId, content] of Object.entries(byId)) {
            if (blockId === piece.block) continue;
            suite.equal(`${tag} ${ref.id} stays out of ${blockId}`, countOf(content, piece.text), 0);
          }
        }
        if (!on) suite.check(`${tag} never names ${ref.tag}`, !tool.includes(ref.tag));
      }
      if (!chosen.length) suite.check(`${tag} carries no @ at all`, !tool.includes('@'));
      suite.equal(
        `${tag} names the exact filenames`,
        refFilenames(mode, chosen).join(','),
        active.map((ref) => ref.filename).join(',')
      );
    }
  }

  // ---- hostile input never touches a tool invariant ----
  const HOSTILE = [
    ['CJK', '亞洲男人，深藍色西裝'],
    ['script tag', '<script>alert(1)</script>'],
    ['brace token', 'a bottle {runtime} on a shelf'],
    ['label line', 'Movement: cut to black\nSound Bed: a song plays'],
    ['at sign', 'a bottle @product_ref @person_ref'],
    ['ratio', 'a bottle shot at 16:9'],
    ['long', `a bottle ${'very '.repeat(1000)}long`],
  ];
  for (const mode of VIDEO_MODES) {
    for (const [label, hostile] of HOSTILE) {
      for (const field of ['subject', 'action']) {
        const tag = `${mode.id} / ${field} / ${label}`;
        const parts = assembleParts(presets, mode.id, {
          selections: null,
          subject: field === 'subject' ? hostile : SUBJECTS[0],
          action: field === 'action' ? hostile : ACTION,
        });
        suite.check(`${tag} still assembles`, Boolean(parts));
        if (!parts) continue;
        const tool = toolText(parts);
        const prompt = renderParts(parts);
        suite.check(`${tag} keeps the tool text free of braces`, !/[{}]/.test(tool));
        suite.check(`${tag} keeps the tool text free of @`, !tool.includes('@'));
        suite.check(`${tag} keeps the tool text free of ratios`, !/\b\d+:\d+\b/.test(tool));
        suite.check(`${tag} keeps the tool text English`, !/[㐀-鿿，。]/.test(tool));
        suite.check(
          `${tag} passes the visitor's words through verbatim`,
          carries(prompt, normalizeSubject(hostile))
        );
      }
    }
  }

  return suite.finish();
}

await runAsMain(import.meta.url, run);
