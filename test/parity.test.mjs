// Three doors, one grammar. This suite is what stops them drifting apart.
//
// The web copy of the registry must be byte-identical to the source in
// grammar/. The two LLM doors, PROMPT.md and SKILL.md, must each carry a
// generated shared-grammar section that regenerates byte for byte from the
// registry.
//
// The section IS the manifest, which is the point: a one-way "does the file
// contain this string" search passes with a clause filed under the wrong mode,
// a duplicated register, or a reference sentence attached to the wrong block.
// Regenerating and byte-comparing cannot. The ordered walk below then reads the
// section back the other way round, so a mode's own wording is proven to sit
// inside that mode's own chunk.

import { readFileSync } from 'node:fs';
import { BEGIN, DOORS, END, checkDoors, checkSync, renderSharedGrammar } from '../scripts/sync-presets.mjs';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));

/** Every clause in the registry, with the modes that emit it. */
function clauseOwners() {
  const owners = new Map();
  for (const mode of presets.modes) {
    for (const group of Object.values(mode.controls || {})) {
      for (const option of group.options) {
        if (!owners.has(option.clause)) owners.set(option.clause, new Set());
        owners.get(option.clause).add(mode.id);
      }
    }
  }
  return owners;
}

/** The generated section of one door, split into one chunk per mode. */
function modeChunks(markdown) {
  const section = markdown.slice(markdown.indexOf(BEGIN) + BEGIN.length, markdown.indexOf(END));
  const chunks = new Map();
  const headings = [...section.matchAll(/^### (.+)$/gm)];
  for (const [index, heading] of headings.entries()) {
    const start = heading.index + heading[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : section.length;
    chunks.set(heading[1], section.slice(start, end));
  }
  return chunks;
}

export async function run() {
  const suite = createSuite('parity (grammar, both doors, docs copy)');
  const owners = clauseOwners();
  const expected = renderSharedGrammar(presets);

  for (const file of DOORS) {
    const markdown = readFileSync(file, 'utf8');
    const name = file.split('/').slice(-1)[0];

    suite.check(`${name} carries the generated markers`, markdown.includes(BEGIN) && markdown.includes(END));

    // every shared block, verbatim
    for (const [blockName, text] of Object.entries(presets.sharedBlocks)) {
      suite.check(
        `${name} carries ${blockName} verbatim`,
        markdown.includes(text),
        `${text.length} characters missing or altered`
      );
    }

    // one chunk per mode, in registry order
    const chunks = modeChunks(markdown);
    suite.equal(
      `${name} lists every mode in registry order`,
      [...chunks.keys()].join(','),
      [...presets.modes.map((mode) => mode.label), 'Shared blocks'].join(',')
    );

    for (const mode of presets.modes) {
      const chunk = chunks.get(mode.label);
      suite.check(`${name} has a chunk for ${mode.id}`, Boolean(chunk));
      if (!chunk) continue;

      suite.check(`${name}/${mode.id} names its id`, chunk.includes(`- id ${mode.id}`));
      suite.check(`${name}/${mode.id} names its media`, chunk.includes(`- media ${mode.mediaType}`));
      suite.check(`${name}/${mode.id} names its target`, chunk.includes(`- target ${mode.targetModel}`));
      if (mode.defaultAction) {
        suite.check(`${name}/${mode.id} carries its default action`, chunk.includes(mode.defaultAction));
      }

      // clauses land in their own mode's chunk, and a clause unique to this
      // mode appears in no other chunk
      for (const group of Object.values(mode.controls || {})) {
        for (const option of group.options) {
          suite.check(
            `${name}/${mode.id} carries the ${option.id} clause`,
            chunk.includes(option.clause),
            option.clause.slice(0, 40)
          );
          // shared wording, and wording another mode's clause contains (the
          // video surface clause is the image one minus its opening verb),
          // cannot prove placement either way
          if (owners.get(option.clause).size !== 1) continue;
          const swallowed = [...owners.entries()].some(
            ([other, modes]) => other !== option.clause && !modes.has(mode.id) && other.includes(option.clause)
          );
          if (swallowed) continue;
          for (const [label, other] of chunks) {
            if (label === mode.label || label === 'Shared blocks') continue;
            suite.check(
              `${name}/${mode.id} keeps the ${option.id} clause out of ${label}`,
              !other.includes(option.clause)
            );
          }
        }
      }

      // reference sentences, at the block they attach to (image modes have no
      // blocks, so their sentences file at the prompt's end)
      for (const ref of mode.refs || []) {
        suite.check(`${name}/${mode.id} names ${ref.id}`, chunk.includes(`- ${ref.id} tag ${ref.tag}`));
        for (const piece of ref.segments) {
          const anchor = piece.block ?? 'prompt';
          suite.check(
            `${name}/${mode.id} files ${ref.id} at ${anchor}`,
            chunk.includes(`- at end of ${anchor} «${piece.text}»`)
          );
        }
      }

      // both register templates, each under its own label
      if (mode.registers) {
        for (const register of Object.keys(mode.registers.templates)) {
          suite.check(
            `${name}/${mode.id} labels the ${register} register`,
            chunk.includes(`##### register ${register}`)
          );
        }
      }

      // every block of a video mode, in emission order
      if (mode.blocks) {
        let cursor = 0;
        for (const block of mode.blocks) {
          const at = chunk.indexOf(`##### ${block.id} «${block.label}»`, cursor);
          suite.check(`${name}/${mode.id} lists ${block.id} in order`, at >= 0);
          if (at >= 0) cursor = at;
        }
      }
    }
  }

  const doors = checkDoors();
  suite.check('both doors regenerate byte for byte', doors.inSync, doors.reason);
  suite.check('the generated section is not empty', expected.length > 1000, String(expected.length));

  const sync = checkSync();
  suite.check('docs/presets.json matches grammar/presets.json', sync.inSync, sync.reason);

  return suite.finish();
}

await runAsMain(import.meta.url, run);
