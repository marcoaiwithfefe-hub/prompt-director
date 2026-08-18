// Prompt Director web app.
//
// Everything the visitor types is written into the page with textContent and
// created nodes only. There is no HTML interpolation anywhere in this file, and
// test/subjects.test.mjs fails the build if that ever changes.
//
// The page holds no prompt string of its own. Every change recomputes the
// output from docs/state.js, so switching mode or media can never redisplay a
// stale prompt: the controls come back, the text is rebuilt.

import { assembleParts, refFilenames, renderParts, toParagraphs } from './assemble.js';
import { ENHANCE_MODEL, enhanceVideo, requestEnhance } from './enhance.js';
import {
  applyStatic,
  controlLabel,
  detectLang,
  lockedNote,
  lockedWhy,
  makeT,
  modeHint,
  optionLabel,
  refLabel,
  registerToggleLabel,
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
import {
  MEDIA,
  createState,
  currentMode,
  generationId,
  modeState,
  modesForMedia,
  promptState,
  selectMedia,
  selectMode,
  setRegister,
  setSelection,
  toggleRef,
} from './state.js';

// OpenRouter answers browser preflight with access-control-allow-origin: *,
// so the browser-direct enhance path is live. Flip to false to hide it.
const ENHANCE_ENABLED = true;
const STORAGE_KEY = 'promptDirector.openrouterKey';

/** Video contract failures get their own translated line; transport errors keep v1's. */
const ENHANCE_ERROR_KEYS = {
  'bad-json': 'enhance.err.badJson',
  'bad-keys': 'enhance.err.badKeys',
  'empty-value': 'enhance.err.emptyValue',
  'off-contract': 'enhance.err.offContract',
};

const el = {
  mediaToggle: document.getElementById('mediaToggle'),
  subject: document.getElementById('subject'),
  actionField: document.getElementById('actionField'),
  action: document.getElementById('action'),
  modeList: document.getElementById('modeList'),
  registerGroup: document.getElementById('registerGroup'),
  controlGroups: document.getElementById('controlGroups'),
  refGroup: document.getElementById('refGroup'),
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
  copyEnhancedBtn: document.getElementById('copyEnhancedBtn'),
  enhancedCopyState: document.getElementById('enhancedCopyState'),
  langBtn: document.getElementById('langBtn'),
};

const page = {
  state: null,
  parts: null,
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

function mode() {
  return currentMode(page.state);
}

function held() {
  return modeState(page.state, page.state.modeId);
}

/* ---------- rendering ---------- */

function renderMedia() {
  clear(el.mediaToggle);
  for (const media of MEDIA) {
    const button = make('button', 'segment', t(`media.${media}`));
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(media === page.state.media));
    button.dataset.media = media;
    button.addEventListener('click', () => {
      if (media === page.state.media) return;
      selectMedia(page.state, media);
      renderAll();
    });
    el.mediaToggle.appendChild(button);
  }
}

function renderModes() {
  clear(el.modeList);
  for (const entry of modesForMedia(page.state.presets, page.state.media)) {
    const button = make('button', 'mode');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(entry.id === page.state.modeId));
    button.dataset.mode = entry.id;

    const head = make('span', 'modehead');
    head.appendChild(make('span', 'name', entry.label));
    if (entry.mediaType === 'video') {
      head.appendChild(make('span', 'badge', t('media.seedanceBadge')));
    }
    button.appendChild(head);
    button.appendChild(make('span', 'hint', modeHint(page.lang, entry)));
    tagPreview(button, modePreviewFile(entry.id), entry.label);
    button.addEventListener('click', () => {
      selectMode(page.state, entry.id);
      renderAll();
    });
    el.modeList.appendChild(button);
  }
}

function renderActionField() {
  const video = mode().mediaType === 'video';
  el.actionField.hidden = !video;
}

function renderRegister() {
  clear(el.registerGroup);
  const registers = mode().registers;
  if (!registers) return;

  const field = make('div', 'field');
  field.appendChild(make('span', 'microlabel', t('register.label')));
  const row = make('label', 'checkrow');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'registerToggle';
  box.checked = held().register !== registers.default;
  box.addEventListener('change', () => {
    const other = Object.keys(registers.templates).find((name) => name !== registers.default);
    setRegister(page.state, box.checked ? other : registers.default);
    renderPrompt();
  });
  row.appendChild(box);
  row.appendChild(make('span', null, registerToggleLabel(page.lang, mode())));
  field.appendChild(row);
  el.registerGroup.appendChild(field);
}

function renderControls() {
  const current = mode();
  const selections = held().selections;
  clear(el.controlGroups);

  for (const [controlId, group] of Object.entries(current.controls || {})) {
    const groupLabel = controlLabel(page.lang, current.id, controlId, group);
    const field = make('div', 'field');
    field.appendChild(make('span', 'microlabel', groupLabel));

    const row = make('div', 'presetrow');
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', groupLabel);
    let selectedLabel = '';
    for (const option of group.options) {
      const label = optionLabel(page.lang, current.id, controlId, option);
      const button = make('button', 'preset', label);
      button.type = 'button';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(selections[controlId] === option.id));
      tagPreview(button, optionPreviewFile(current.id, controlId, option.id), label);
      if (selections[controlId] === option.id) selectedLabel = label;
      if (group.locked) {
        button.disabled = true;
        button.classList.add('is-locked');
      } else {
        button.addEventListener('click', () => {
          setSelection(page.state, controlId, option.id);
          renderControls();
          renderPrompt();
        });
      }
      row.appendChild(button);
    }
    field.appendChild(row);
    if (group.locked && group.why) {
      field.appendChild(make('p', 'whynote', lockedWhy(page.lang, current.id, controlId, group)));
    }
    // no hover on a touch screen, so the selected option shows its picture here
    if (inlinePreviews()) {
      appendThumb(field, optionPreviewFile(current.id, controlId, selections[controlId]), selectedLabel);
    }
    el.controlGroups.appendChild(field);
  }

  if (current.lockedNote) {
    const lock = make('div', 'field');
    const box = make('div', 'lockrow');
    box.appendChild(make('span', 'microlabel', t('locked.label')));
    box.appendChild(make('p', 'lockednote', lockedNote(page.lang, current)));
    lock.appendChild(box);
    el.controlGroups.appendChild(lock);
  }
}

function renderRefs() {
  clear(el.refGroup);
  const current = mode();
  if (!current.refs || !current.refs.length) return;

  const chosen = held().refs;
  const field = make('div', 'field');
  field.appendChild(make('span', 'microlabel', t('refs.label')));

  for (const ref of current.refs) {
    const row = make('label', 'checkrow');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.dataset.ref = ref.id;
    box.checked = chosen.includes(ref.id);
    box.addEventListener('change', () => {
      toggleRef(page.state, ref.id, box.checked);
      renderRefs();
      renderPrompt();
    });
    row.appendChild(box);
    row.appendChild(make('span', null, refLabel(page.lang, current.id, ref)));
    field.appendChild(row);
  }

  const files = refFilenames(current, chosen);
  if (files.length) {
    field.appendChild(make('p', 'note', t('refs.instruction', { files: files.join(', ') })));
  }
  el.refGroup.appendChild(field);
}

function renderRatioChip() {
  clear(el.ratioChip);
  el.ratioChip.appendChild(make('span', null, t('ratio.hint', { ratio: mode().recommendedRatio })));
}

function renderPrompt() {
  page.state.subject = el.subject.value;
  page.state.action = el.action.value;
  page.parts = assembleParts(page.state.presets, page.state.modeId, promptState(page.state));
  page.prompt = renderParts(page.parts);
  invalidateEnhanced();

  clear(el.promptOut);
  if (!page.prompt) {
    el.promptOut.appendChild(make('p', 'placeholder', t('prompt.empty')));
    el.charCount.textContent = '';
    el.copyBtn.disabled = true;
    setCopyState(t('hint.emptySubject'), true);
    return;
  }

  for (const paragraph of toParagraphs(page.prompt)) {
    el.promptOut.appendChild(make('p', null, paragraph));
  }
  el.charCount.textContent = t('prompt.chars', { n: page.prompt.length.toLocaleString('en-US') });
  el.copyBtn.disabled = false;
  setCopyState('');
}

function renderAll() {
  renderMedia();
  renderModes();
  renderActionField();
  renderRegister();
  renderControls();
  renderRefs();
  renderRatioChip();
  renderPrompt();
}

function setCopyState(message, isHint) {
  el.copyState.textContent = message;
  el.copyState.classList.toggle('hint', Boolean(isHint));
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

/** Any change to the inputs makes an enhanced panel a lie, so it goes away. */
function invalidateEnhanced() {
  page.enhanced = null;
  clear(el.enhancedOut);
  el.enhancedCount.textContent = '';
  el.enhancedPanel.hidden = true;
}

function setEnhanceBusy(busy) {
  el.enhanceBtn.disabled = busy;
  el.cancelEnhanceBtn.hidden = !busy;
  el.enhanceState.textContent = busy ? t('enhance.asking', { model: ENHANCE_MODEL }) : '';
}

function enhanceMessage(result) {
  const named = ENHANCE_ERROR_KEYS[result.code];
  return named ? t(named) : result.message;
}

async function runEnhance() {
  showEnhanceError('');
  if (!page.prompt) {
    showEnhanceError(t('enhance.needSubject'));
    return;
  }
  const apiKey = el.apiKey.value.trim() || page.sessionKey;
  if (!apiKey) {
    showEnhanceError(t('enhance.needKey'));
    return;
  }

  page.sessionKey = apiKey;
  if (el.rememberKey.checked) writeStoredKey(apiKey);

  const controller = new AbortController();
  page.controller = controller;
  setEnhanceBusy(true);

  const current = mode();
  const generation = generationId(page.state);
  const args = {
    presets: page.state.presets,
    mode: current,
    selections: held().selections,
    parts: page.parts,
    prompt: page.prompt,
    subject: el.subject.value.trim(),
    action: el.action.value.trim() || current.defaultAction || '',
    apiKey,
    generation,
  };

  const result =
    current.mediaType === 'video'
      ? await enhanceVideo(args, { controller })
      : await requestEnhance(args, { controller });

  page.controller = null;
  setEnhanceBusy(false);

  // the visitor moved on while that was in flight: the answer is about a
  // question nobody is asking any more
  if (generation !== generationId(page.state)) return;

  if (!result.ok) {
    if (result.code !== 'cancelled') showEnhanceError(enhanceMessage(result));
    else el.enhanceState.textContent = t('enhance.cancelled');
    return;
  }

  page.enhanced = result.text;
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
    page.sessionKey = stored;
  }

  el.enhanceBtn.addEventListener('click', runEnhance);
  el.cancelEnhanceBtn.addEventListener('click', () => {
    if (page.controller) page.controller.abort();
  });
  el.rememberKey.addEventListener('change', () => {
    const value = el.apiKey.value.trim();
    if (el.rememberKey.checked && value) writeStoredKey(value);
    if (!el.rememberKey.checked) writeStoredKey('');
  });
  el.clearKeyBtn.addEventListener('click', () => {
    el.apiKey.value = '';
    el.rememberKey.checked = false;
    page.sessionKey = '';
    writeStoredKey('');
    showEnhanceError('');
    el.enhanceState.textContent = t('enhance.keyCleared');
  });
  el.copyEnhancedBtn.addEventListener('click', () => {
    if (page.enhanced) copyText(page.enhanced, el.enhancedCopyState);
  });
}

/* ---------- language ---------- */

function setLanguage(lang) {
  page.lang = lang;
  t = makeT(lang);
  applyStatic(lang);
  // the button shows the language you would switch TO
  el.langBtn.textContent = lang === 'yue' ? 'EN' : '粵';
  renderAll();
}

/* ---------- boot ---------- */

async function init() {
  const response = await fetch('./presets.json');
  if (!response.ok) throw new Error(`presets.json failed to load (HTTP ${response.status})`);
  const presets = await response.json();
  page.state = createState(presets);

  el.subject.addEventListener('input', renderPrompt);
  el.action.addEventListener('input', renderPrompt);
  el.copyBtn.addEventListener('click', () => {
    if (page.prompt) copyText(page.prompt, el.copyState);
  });
  el.langBtn.addEventListener('click', () => {
    const next = page.lang === 'yue' ? 'en' : 'yue';
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
