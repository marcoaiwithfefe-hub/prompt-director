// What the page remembers, and what it deliberately does not.
//
// GLOBAL: the subject and the action survive every switch, in both directions.
// PER MODE: chips, reference boxes and the register come back when you come
// back, for this visit only.
// NEVER STORED: the prompt. Every assertion below re-derives it, because that
// is exactly what the page does: a restored mode recomputes, it does not
// redisplay.

import { readFileSync } from 'node:fs';
import { assemble, defaultSelections, getMode } from '../docs/assemble.js';
import {
  createState,
  firstModeForMedia,
  generationId,
  modeState,
  modesForMedia,
  promptState,
  selectMedia,
  selectMode,
  setRegister,
  setSelection,
  toggleRef,
} from '../docs/state.js';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));

const SUBJECT = 'a frosted glass serum bottle with a brushed aluminium cap';
const ACTION = 'the bottle turns a slow quarter rotation';

function render(state) {
  const held = promptState(state);
  return assemble(presets, state.modeId, held.selections, held.subject, {
    action: held.action,
    register: held.register,
    refs: held.refs,
  });
}

/** Anything a visitor can touch that changes the prompt, as one-shot mutations. */
function mutations(state) {
  const mode = getMode(presets, state.modeId);
  const rows = [];
  rows.push(['subject', () => { state.subject = `${state.subject} on marble`; }]);
  if (mode.mediaType === 'video') {
    rows.push(['action', () => { state.action = `${state.action} and settles`; }]);
  }
  for (const [controlId, group] of Object.entries(mode.controls || {})) {
    const other = group.options.find((option) => option.id !== group.default);
    if (other) rows.push([`chip ${controlId}`, () => setSelection(state, controlId, other.id)]);
  }
  for (const ref of mode.refs || []) {
    rows.push([`ref ${ref.id}`, () => toggleRef(state, ref.id, true)]);
  }
  if (mode.registers) {
    const other = Object.keys(mode.registers.templates).find((name) => name !== mode.registers.default);
    rows.push(['register', () => setRegister(state, other)]);
  }
  return rows;
}

export async function run() {
  const suite = createSuite('state (media switch, per-mode memory, generation id)');

  // ---- session defaults ----
  suite.equal('image opens on Face Lock', firstModeForMedia(presets, 'image'), 'face-lock');
  suite.equal('video opens on Product Ad', firstModeForMedia(presets, 'video'), 'video-product-ad');
  suite.equal('image lists eight modes', modesForMedia(presets, 'image').length, 8);
  suite.equal('video lists four modes', modesForMedia(presets, 'video').length, 4);

  const fresh = createState(presets);
  suite.equal('a new session starts on Face Lock', fresh.modeId, 'face-lock');
  suite.equal('a new session starts on image', fresh.media, 'image');

  // ---- global text survives every switch, per-mode controls come back ----
  for (const start of presets.modes) {
    for (const target of presets.modes) {
      if (start.id === target.id) continue;
      const state = createState(presets);
      selectMode(state, start.id);
      state.subject = SUBJECT;
      state.action = ACTION;

      // move every control on the starting mode off its default
      for (const [label, apply] of mutations(state)) {
        if (label === 'subject' || label === 'action') continue;
        apply();
      }
      const before = render(state);
      const heldBefore = JSON.parse(JSON.stringify(modeState(state, start.id)));

      selectMode(state, target.id);
      const tag = `${start.id} -> ${target.id}`;
      suite.equal(`${tag} keeps the subject`, state.subject, SUBJECT);
      suite.equal(`${tag} keeps the action`, state.action, ACTION);
      suite.equal(`${tag} follows the mode's media`, state.media, target.mediaType);
      suite.check(`${tag} opens the target at its defaults`, JSON.stringify(modeState(state, target.id).selections) === JSON.stringify(defaultSelections(target)));

      selectMode(state, start.id);
      suite.equal(
        `${tag} and back restores the controls`,
        JSON.stringify(modeState(state, start.id)),
        JSON.stringify(heldBefore)
      );
      suite.equal(`${tag} and back recomputes the same prompt`, render(state), before);
    }
  }

  // ---- a media switch re-opens that media's last mode ----
  const state = createState(presets);
  state.subject = SUBJECT;
  selectMode(state, 'detail');
  selectMedia(state, 'video');
  suite.equal('video opens at its default the first time', state.modeId, 'video-product-ad');
  selectMode(state, 'video-narrative');
  selectMedia(state, 'image');
  suite.equal('image comes back to the mode you left it on', state.modeId, 'detail');
  selectMedia(state, 'video');
  suite.equal('video comes back to the mode you left it on', state.modeId, 'video-narrative');
  suite.equal('the subject never moved', state.subject, SUBJECT);

  // an image mode hides the action box, and keeps its value
  selectMedia(state, 'video');
  state.action = ACTION;
  selectMedia(state, 'image');
  suite.equal('the action survives an image mode', state.action, ACTION);
  selectMedia(state, 'video');
  suite.equal('and is still there on the way back', state.action, ACTION);

  // ---- every prompt-affecting control moves the generation id ----
  for (const mode of presets.modes) {
    const local = createState(presets);
    selectMode(local, mode.id);
    local.subject = SUBJECT;
    local.action = ACTION;

    const base = generationId(local);
    suite.equal(`${mode.id} generation id is stable when nothing changes`, generationId(local), base);

    for (const [label, apply] of mutations(local)) {
      const before = generationId(local);
      const prompt = render(local);
      apply();
      suite.check(`${mode.id} ${label} moves the generation id`, generationId(local) !== before);
      suite.check(`${mode.id} ${label} moves the prompt`, render(local) !== prompt, label);
    }
  }

  // a mode switch and a media switch both move it
  const drift = createState(presets);
  drift.subject = SUBJECT;
  const atFaceLock = generationId(drift);
  selectMode(drift, 'scene');
  suite.check('a mode switch moves the generation id', generationId(drift) !== atFaceLock);
  const atScene = generationId(drift);
  selectMedia(drift, 'video');
  suite.check('a media switch moves the generation id', generationId(drift) !== atScene);

  // ---- an unknown media is a hard error ----
  let threw = false;
  try {
    selectMedia(createState(presets), 'audio');
  } catch {
    threw = true;
  }
  suite.check('an unknown media is refused', threw);

  return suite.finish();
}

await runAsMain(import.meta.url, run);
