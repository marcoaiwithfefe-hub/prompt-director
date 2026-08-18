// The page's state, with no DOM in it, so node can drive every round-trip the
// UI can put a visitor through.
//
// Two kinds of state, and the difference is the whole contract:
//
//   GLOBAL   the subject and the action textareas. One value each for the whole
//            session. Switching mode or media never clears them; the action box
//            simply hides itself in an image mode and keeps its value.
//   PER MODE chips, reference checkboxes and the phone-shot register. Each mode
//            remembers its own, for this visit only, nothing persisted.
//
// The prompt is never stored here. It is recomputed from this state after every
// change, including a media switch: "restoring" a mode means its controls come
// back, never that an older output string is shown again.

import { defaultRegister, defaultSelections, getMode } from './assemble.js';

export const MEDIA = ['image', 'video'];

export function modesForMedia(presets, media) {
  return presets.modes.filter((mode) => mode.mediaType === media);
}

/** Each media's opening mode: the first one the registry lists for it. */
export function firstModeForMedia(presets, media) {
  const modes = modesForMedia(presets, media);
  if (!modes.length) throw new Error(`No modes for media: ${media}`);
  return modes[0].id;
}

export function createState(presets, media = 'image') {
  const state = {
    presets,
    media,
    modeId: null,
    subject: '',
    action: '',
    lastModeByMedia: {},
    byMode: {},
  };
  selectMode(state, firstModeForMedia(presets, media));
  return state;
}

/** Controls for one mode, created at their defaults the first time it is opened. */
export function modeState(state, modeId) {
  let held = state.byMode[modeId];
  if (!held) {
    const mode = getMode(state.presets, modeId);
    held = {
      selections: defaultSelections(mode),
      refs: [],
      register: defaultRegister(mode),
    };
    state.byMode[modeId] = held;
  }
  return held;
}

export function selectMode(state, modeId) {
  const mode = getMode(state.presets, modeId);
  state.modeId = modeId;
  state.media = mode.mediaType;
  state.lastModeByMedia[mode.mediaType] = modeId;
  modeState(state, modeId);
  return state;
}

/** Switching media re-opens that media's last mode, or its first one on the first visit. */
export function selectMedia(state, media) {
  if (!MEDIA.includes(media)) throw new Error(`Unknown media: ${media}`);
  const next = state.lastModeByMedia[media] || firstModeForMedia(state.presets, media);
  return selectMode(state, next);
}

export function setSelection(state, controlId, optionId) {
  modeState(state, state.modeId).selections[controlId] = optionId;
  return state;
}

export function toggleRef(state, refId, on) {
  const held = modeState(state, state.modeId);
  const without = held.refs.filter((id) => id !== refId);
  held.refs = on ? [...without, refId] : without;
  return state;
}

export function setRegister(state, register) {
  modeState(state, state.modeId).register = register;
  return state;
}

export function currentMode(state) {
  return getMode(state.presets, state.modeId);
}

/** Exactly what assembleParts needs, and nothing the assembler should not see. */
export function promptState(state) {
  const held = modeState(state, state.modeId);
  return {
    selections: held.selections,
    refs: held.refs,
    register: held.register,
    subject: state.subject,
    action: state.action,
  };
}

/**
 * One string standing for every input that can change the prompt. Enhance
 * stamps its request with this; a reply carrying a different one belongs to a
 * question nobody is asking any more, so it is dropped without a word.
 */
export function generationId(state) {
  const held = modeState(state, state.modeId);
  const mode = currentMode(state);
  const selections = Object.keys(held.selections)
    .sort()
    .map((controlId) => `${controlId}=${held.selections[controlId]}`);
  return JSON.stringify({
    media: state.media,
    mode: state.modeId,
    subject: state.subject,
    action: mode.mediaType === 'video' ? state.action : '',
    selections,
    refs: [...held.refs].sort(),
    register: held.register,
  });
}
