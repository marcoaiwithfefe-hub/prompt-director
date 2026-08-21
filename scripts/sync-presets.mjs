#!/usr/bin/env node
// grammar/presets.json is the single machine source. Two things derive from it
// and are generated, never hand-edited:
//
//   docs/presets.json                 the web app's copy, byte-identical
//                                     (GitHub Pages only serves docs/)
//   the shared-grammar section of     the two LLM doors, PROMPT.md and
//   PROMPT.md and SKILL.md            skill/prompt-director/SKILL.md
//
// The door section is the manifest, not a sample: every mode's templates, chip
// clauses, register templates, reference segments, default action and shared
// blocks come out in emission order. A one-way "does the file contain this
// string" search would pass with a clause in the wrong mode, a duplicate, or a
// register mixed up. Byte-comparing a freshly generated section cannot.
//
//   node scripts/sync-presets.mjs           write both derived artefacts
//   node scripts/sync-presets.mjs --check   verify only, exit 1 on any drift

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE = join(ROOT, 'grammar', 'presets.json');
export const TARGET = join(ROOT, 'docs', 'presets.json');
export const DOORS = [join(ROOT, 'PROMPT.md'), join(ROOT, 'skill', 'prompt-director', 'SKILL.md')];

export const BEGIN = '<!-- BEGIN GENERATED shared-grammar -->';
export const END = '<!-- END GENERATED shared-grammar -->';

/** Values are quoted so a trailing space cannot be lost to an editor or a linter. */
function quote(value) {
  if (/[«»]/.test(value)) throw new Error(`Grammar value carries a guillemet: ${value.slice(0, 40)}`);
  return `«${value}»`;
}

function renderTemplate(lines, template, indent = '  ') {
  for (const part of template) {
    switch (part.type) {
      case 'text':
        lines.push(`${indent}- text ${quote(part.value)}`);
        break;
      case 'subject':
        lines.push(`${indent}- subject`);
        break;
      case 'action':
        lines.push(`${indent}- action`);
        break;
      case 'control':
        lines.push(`${indent}- control ${part.control}${part.field ? ` field ${part.field}` : ''}`);
        break;
      case 'block':
        lines.push(`${indent}- block ${part.block}`);
        break;
      case 'break':
        lines.push(`${indent}- paragraph break`);
        break;
      default:
        throw new Error(`Unknown template part type: ${part.type}`);
    }
  }
}

function renderChips(lines, mode) {
  const controls = Object.entries(mode.controls || {});
  if (!controls.length) return;
  lines.push('');
  lines.push('#### chips');
  for (const [controlId, group] of controls) {
    lines.push(
      `- ${controlId} ${quote(group.label)} default ${group.default}${group.locked ? ' LOCKED' : ''}`
    );
    if (group.why) lines.push(`  - why ${quote(group.why)}`);
    for (const option of group.options) {
      lines.push(`  - ${option.id} ${quote(option.label)} emits ${quote(option.clause)}`);
      if (option.movement) lines.push(`    - movement ${quote(option.movement)}`);
    }
  }
}

function renderRefs(lines, mode) {
  if (!mode.refs || !mode.refs.length) return;
  lines.push('');
  lines.push('#### references');
  for (const ref of mode.refs) {
    lines.push(`- ${ref.id} tag ${ref.tag} file ${ref.filename} ${quote(ref.label)}`);
    for (const piece of ref.segments) {
      lines.push(`  - at end of ${piece.block ?? 'prompt'} ${quote(piece.text)}`);
    }
  }
}

export function renderSharedGrammar(presets) {
  const lines = [];
  lines.push('');
  lines.push('<!-- Generated from grammar/presets.json by scripts/sync-presets.mjs. Do not edit by hand. -->');
  lines.push('');
  lines.push(`Registry schema version ${presets.schemaVersion}. Every mode below, in emission order.`);

  for (const mode of presets.modes) {
    lines.push('');
    lines.push(`### ${mode.label}`);
    lines.push('');
    lines.push(`- id ${mode.id}`);
    lines.push(`- media ${mode.mediaType}`);
    lines.push(`- target ${mode.targetModel}`);
    lines.push(`- ratio ${quote(mode.recommendedRatio)}`);
    lines.push(`- hint ${quote(mode.hint)}`);
    if (mode.lockedNote) lines.push(`- locked note ${quote(mode.lockedNote)}`);
    if (mode.defaultAction) lines.push(`- default action ${quote(mode.defaultAction)}`);

    renderChips(lines, mode);

    if (mode.registers) {
      lines.push('');
      lines.push(`#### registers (default ${mode.registers.default}, toggle ${quote(mode.registers.toggleLabel)})`);
      for (const [name, template] of Object.entries(mode.registers.templates)) {
        lines.push('');
        lines.push(`##### register ${name}`);
        renderTemplate(lines, template);
      }
    } else if (mode.template) {
      lines.push('');
      lines.push('#### template');
      renderTemplate(lines, mode.template);
    }

    if (mode.blocks) {
      lines.push('');
      lines.push('#### blocks');
      for (const block of mode.blocks) {
        lines.push('');
        lines.push(`##### ${block.id} ${quote(block.label)}`);
        renderTemplate(lines, block.template);
      }
    }

    renderRefs(lines, mode);
  }

  lines.push('');
  lines.push('### Shared blocks');
  lines.push('');
  lines.push('Reproduce these word for word. Paraphrasing them is how prompts quietly get worse.');
  for (const [name, text] of Object.entries(presets.sharedBlocks)) {
    lines.push('');
    lines.push(`#### ${name}`);
    lines.push('');
    lines.push('```');
    lines.push(text);
    lines.push('```');
  }
  lines.push('');
  return lines.join('\n');
}

export function sectionOf(markdown, file) {
  const start = markdown.indexOf(BEGIN);
  const end = markdown.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${file} is missing the generated-section markers`);
  }
  return { start, end, body: markdown.slice(start + BEGIN.length, end) };
}

export function checkSync() {
  const source = readFileSync(SOURCE);
  if (!existsSync(TARGET)) return { inSync: false, reason: 'docs/presets.json is missing' };
  const target = readFileSync(TARGET);
  if (source.equals(target)) return { inSync: true, bytes: source.length };
  return {
    inSync: false,
    reason: `docs/presets.json differs from grammar/presets.json (${source.length} vs ${target.length} bytes)`,
  };
}

/** Every door's generated section, compared byte for byte with a fresh generation. */
export function checkDoors() {
  const presets = JSON.parse(readFileSync(SOURCE, 'utf8'));
  const expected = renderSharedGrammar(presets);
  const problems = [];
  for (const file of DOORS) {
    if (!existsSync(file)) {
      problems.push(`${file} is missing`);
      continue;
    }
    try {
      const { body } = sectionOf(readFileSync(file, 'utf8'), file);
      if (body !== expected) {
        problems.push(`${file} generated section is out of date (${body.length} vs ${expected.length} bytes)`);
      }
    } catch (error) {
      problems.push(error.message);
    }
  }
  return { inSync: problems.length === 0, reason: problems.join('; ') };
}

export function syncPresets() {
  const source = readFileSync(SOURCE);
  writeFileSync(TARGET, source);
  return { bytes: source.length };
}

export function syncDoors() {
  const presets = JSON.parse(readFileSync(SOURCE, 'utf8'));
  const expected = renderSharedGrammar(presets);
  const written = [];
  for (const file of DOORS) {
    const markdown = readFileSync(file, 'utf8');
    const { start, end } = sectionOf(markdown, file);
    const next = markdown.slice(0, start + BEGIN.length) + expected + markdown.slice(end);
    if (next !== markdown) writeFileSync(file, next);
    written.push(file);
  }
  return { written, bytes: expected.length };
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  if (process.argv.includes('--check')) {
    const presetsResult = checkSync();
    const doorResult = checkDoors();
    if (!presetsResult.inSync || !doorResult.inSync) {
      if (!presetsResult.inSync) console.error(`presets out of sync: ${presetsResult.reason}`);
      if (!doorResult.inSync) console.error(`doors out of sync: ${doorResult.reason}`);
      console.error('run: node scripts/sync-presets.mjs');
      process.exit(1);
    }
    console.log(`presets in sync (${presetsResult.bytes} bytes), doors in sync`);
  } else {
    const { bytes } = syncPresets();
    const doors = syncDoors();
    console.log(`copied grammar/presets.json -> docs/presets.json (${bytes} bytes)`);
    console.log(`wrote the shared-grammar section (${doors.bytes} bytes) into:`);
    for (const file of doors.written) console.log(`  ${file}`);
  }
}
