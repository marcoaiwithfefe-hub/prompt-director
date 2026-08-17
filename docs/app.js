// Prompt Director web app.
//
// Everything the visitor types is written into the page with textContent and
// created nodes only. There is no HTML interpolation anywhere in this file, and
// test/subjects.test.mjs fails the build if that ever changes.

import { assemble, defaultSelections, getMode, toParagraphs } from './assemble.js';
import { ENHANCE_MODEL, requestEnhance } from './enhance.js';
import {
  applyStatic,
  controlLabel,
  detectLang,
  lockedNote,
  makeT,
  modeHint,
  optionLabel,
  storeLang,
} from './i18n.js';
import {
  appendThumb,
  initPreviews,
  inlinePreviews,
  modePreviewFile,
  optionPreviewFile,
  tagPreview,
} from './previews.js';

// OpenRouter answers browser preflight with access-control-allow-origin: *,
// so the browser-direct enhance path is live. Flip to false to hide it.
const ENHANCE_ENABLED = true;
const STORAGE_KEY = 'promptDirector.openrouterKey';

const el = {
  subject: document.getElementById('subject'),
  modeList: document.getElementById('modeList'),
  controlGroups: document.getElementById('controlGroups'),
  ratioChip: document.getElementById('ratioChip'),
  promptOut: document.getElementById('promptOut'),
  charCount: document.getElementById('charCount'),
  copyState: document.getElementById('copyState'),
  copyBtn: document.getElementById('copyBtn'),
  enhanceBox: document.getElementById('enhanceBox'),
  apiKey: document.getElementById('apiKey'),
  rememberKey: document.getElementById('rememberKey'),
  enhanceBtn: document.getElementById('enhanceBtn'),
  cancelEnhanceBtn: document.getElementById('cancelEnhanceBtn'),
  clearKeyBtn: document.getElementById('clearKeyBtn'),
  enhanceState: document.getElementById('enhanceState'),
  enhanceError: document.getElementById('enhanceError'),
  enhancedPanel: document.getElementById('enhancedPanel'),
  enhancedOut: document.getElementById('enhancedOut'),
  enhancedCount: document.getElementById('enhancedCount'),
  enhancedCopyState: document.getElementById('enhancedCopyState'),
  copyEnhancedBtn: document.getElementById('copyEnhancedBtn'),
  langBtn: document.getElementById('langBtn'),
};

const state = {
  presets: null,
  modeId: null,
  selectionsByMode: {},
  prompt: null,
  enhanced: null,
  sessionKey: '',
  controller: null,
  lang: 'en',
};

let t = makeT('en');

/* ---------- small DOM helpers ---------- */

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function currentMode() {
  return getMode(state.presets, state.modeId);
}

function currentSelections() {
  return state.selectionsByMode[state.modeId];
}

/* ---------- rendering ---------- */

function renderModes() {
  clear(el.modeList);
  for (const mode of state.presets.modes) {
    const button = make('button', 'mode');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(mode.id === state.modeId));
    button.dataset.mode = mode.id;
    button.appendChild(make('span', 'name', mode.label));
    button.appendChild(make('span', 'hint', modeHint(state.lang, mode)));
    tagPreview(button, modePreviewFile(mode.id), mode.label);
    button.addEventListener('click', () => selectMode(mode.id));
    el.modeList.appendChild(button);
  }
}

function renderControls() {
  const mode = currentMode();
  const selections = currentSelections();
  clear(el.controlGroups);

  for (const [controlId, group] of Object.entries(mode.controls || {})) {
    const groupLabel = controlLabel(state.lang, controlId, group);
    const field = make('div', 'field');
    field.appendChild(make('span', 'microlabel', groupLabel));

    const row = make('div', 'presetrow');
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', groupLabel);
    let selectedLabel = '';
    for (const option of group.options) {
      const label = optionLabel(state.lang, controlId, option);
      const button = make('button', 'preset', label);
      button.type = 'button';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(selections[controlId] === option.id));
      tagPreview(button, optionPreviewFile(mode.id, controlId, option.id), label);
      if (selections[controlId] === option.id) selectedLabel = label;
      button.addEventListener('click', () => {
        selections[controlId] = option.id;
        renderControls();
        renderPrompt();
      });
      row.appendChild(button);
    }
    field.appendChild(row);
    // no hover on a touch screen, so the selected option shows its picture here
    if (inlinePreviews()) {
      appendThumb(field, optionPreviewFile(mode.id, controlId, selections[controlId]), selectedLabel);
    }
    el.controlGroups.appendChild(field);
  }

  if (mode.lockedNote) {
    const lock = make('div', 'field');
    const box = make('div', 'lockrow');
    box.appendChild(make('span', 'microlabel', t('locked.label')));
    box.appendChild(make('p', 'lockednote', lockedNote(state.lang, mode)));
    lock.appendChild(box);
    el.controlGroups.appendChild(lock);
  }
}

function renderRatioChip() {
  const mode = currentMode();
  clear(el.ratioChip);
  el.ratioChip.appendChild(make('span', null, t('ratio.chip', { ratio: mode.recommendedRatio })));
}

function renderPrompt() {
  const mode = currentMode();
  state.prompt = assemble(state.presets, mode.id, currentSelections(), el.subject.value);

  clear(el.promptOut);
  if (!state.prompt) {
    el.promptOut.appendChild(make('p', 'placeholder', t('prompt.empty')));
    el.charCount.textContent = '';
    el.copyBtn.disabled = true;
    setCopyState(t('prompt.hint'), true);
    return;
  }

  for (const paragraph of toParagraphs(state.prompt)) {
    el.promptOut.appendChild(make('p', null, paragraph));
  }
  el.charCount.textContent = t('prompt.chars', { n: state.prompt.length.toLocaleString('en-US') });
  el.copyBtn.disabled = false;
  setCopyState('');
}

function setCopyState(message, isHint) {
  el.copyState.textContent = message;
  el.copyState.classList.toggle('hint', Boolean(isHint));
}

function selectMode(modeId) {
  state.modeId = modeId;
  if (!state.selectionsByMode[modeId]) {
    state.selectionsByMode[modeId] = defaultSelections(getMode(state.presets, modeId));
  }
  renderModes();
  renderControls();
  renderRatioChip();
  renderPrompt();
}

/* ---------- copy chain ---------- */

async function copyText(text, stateNode) {
  const report = (message) => {
    stateNode.textContent = message;
    stateNode.classList.remove('hint');
    window.setTimeout(() => {
      if (stateNode.textContent === message) stateNode.textContent = '';
    }, 4000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      report(t('copy.done'));
      return 'clipboard';
    } catch {
      // fall through to the older path
    }
  }

  const scratch = document.createElement('textarea');
  scratch.value = text;
  scratch.setAttribute('readonly', 'readonly');
  scratch.className = 'offscreen';
  document.body.appendChild(scratch);
  scratch.select();
  scratch.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(scratch);
  if (copied) {
    report(t('copy.done'));
    return 'exec';
  }

  selectNodeText(el.promptOut);
  report(t('copy.manual'));
  return 'manual';
}

function selectNodeText(node) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

/* ---------- enhance ---------- */

function readStoredKey() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function writeStoredKey(value) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // private mode or storage disabled: the key just stays in memory
  }
}

function showEnhanceError(message) {
  el.enhanceError.textContent = message;
  el.enhanceError.hidden = !message;
}

function setEnhanceBusy(busy) {
  el.enhanceBtn.disabled = busy;
  el.cancelEnhanceBtn.hidden = !busy;
  el.enhanceState.textContent = busy ? t('enhance.asking', { model: ENHANCE_MODEL }) : '';
}

async function runEnhance() {
  showEnhanceError('');
  if (!state.prompt) {
    showEnhanceError(t('enhance.needSubject'));
    return;
  }
  const apiKey = el.apiKey.value.trim() || state.sessionKey;
  if (!apiKey) {
    showEnhanceError(t('enhance.needKey'));
    return;
  }

  state.sessionKey = apiKey;
  if (el.rememberKey.checked) writeStoredKey(apiKey);

  const controller = new AbortController();
  state.controller = controller;
  setEnhanceBusy(true);

  const result = await requestEnhance(
    {
      presets: state.presets,
      mode: currentMode(),
      selections: currentSelections(),
      prompt: state.prompt,
      subject: el.subject.value.trim(),
      apiKey,
    },
    { controller }
  );

  state.controller = null;
  setEnhanceBusy(false);

  if (!result.ok) {
    if (result.code !== 'cancelled') showEnhanceError(result.message);
    else el.enhanceState.textContent = t('enhance.cancelled');
    return;
  }

  state.enhanced = result.text;
  clear(el.enhancedOut);
  for (const paragraph of toParagraphs(result.text)) {
    el.enhancedOut.appendChild(make('p', null, paragraph));
  }
  el.enhancedCount.textContent = t('prompt.chars', { n: result.text.length.toLocaleString('en-US') });
  el.enhancedPanel.hidden = false;
}

function wireEnhance() {
  if (!ENHANCE_ENABLED) {
    el.enhanceBox.hidden = true;
    return;
  }

  const stored = readStoredKey();
  if (stored) {
    el.apiKey.value = stored;
    el.rememberKey.checked = true;
    state.sessionKey = stored;
  }

  el.enhanceBtn.addEventListener('click', runEnhance);
  el.cancelEnhanceBtn.addEventListener('click', () => {
    if (state.controller) state.controller.abort();
  });
  el.rememberKey.addEventListener('change', () => {
    const value = el.apiKey.value.trim();
    if (el.rememberKey.checked && value) writeStoredKey(value);
    if (!el.rememberKey.checked) writeStoredKey('');
  });
  el.clearKeyBtn.addEventListener('click', () => {
    el.apiKey.value = '';
    el.rememberKey.checked = false;
    state.sessionKey = '';
    writeStoredKey('');
    showEnhanceError('');
    el.enhanceState.textContent = t('enhance.keyCleared');
  });
  el.copyEnhancedBtn.addEventListener('click', () => {
    if (state.enhanced) copyText(state.enhanced, el.enhancedCopyState);
  });
}

/* ---------- language ---------- */

function setLanguage(lang) {
  state.lang = lang;
  t = makeT(lang);
  applyStatic(lang);
  // the button shows the language you would switch TO
  el.langBtn.textContent = lang === 'yue' ? 'EN' : '粵';
  renderModes();
  renderControls();
  renderRatioChip();
  renderPrompt();
}

/* ---------- boot ---------- */

async function init() {
  const response = await fetch('./presets.json');
  if (!response.ok) throw new Error(`presets.json failed to load (HTTP ${response.status})`);
  state.presets = await response.json();

  const first = state.presets.modes[0];
  state.modeId = first.id;
  state.selectionsByMode[first.id] = defaultSelections(first);

  el.subject.addEventListener('input', renderPrompt);
  el.copyBtn.addEventListener('click', () => {
    if (state.prompt) copyText(state.prompt, el.copyState);
  });
  el.langBtn.addEventListener('click', () => {
    const next = state.lang === 'yue' ? 'en' : 'yue';
    storeLang(next);
    setLanguage(next);
  });
  wireEnhance();
  initPreviews();

  setLanguage(detectLang());
  document.body.dataset.ready = 'true';
}

init().catch((error) => {
  clear(el.promptOut);
  el.promptOut.appendChild(make('p', 'placeholder', `Could not start: ${error.message}`));
});
