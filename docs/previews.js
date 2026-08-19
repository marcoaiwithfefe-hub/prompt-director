// Preview pictures for every mode and every option.
//
// A hover-capable pointer gets a tooltip-style card above the control it is
// pointing at. A coarse pointer has no hover, so each control group renders the
// picture of the option that is currently selected, inline under the chip row.
// The mode list stays picture-free there: it is a list, not a chip row.
//
// Pictures are optional. Every filename is probed once with an off-document
// Image and remembered; a file that does not answer means the control renders
// exactly the way it did before this file existed. No broken icons, no empty
// cards, no console-visible difference to the visitor.
//
// Nothing here writes markup. Positions are set through the CSSOM, which the
// page's Content-Security-Policy allows; a style attribute would be blocked.

/** Where the pictures live, relative to index.html. */
export const PREVIEW_DIR = './previews/';

/**
 * Each mode's default option shows the mode's own picture instead of a picture
 * of its own, because the mode picture was shot on that default.
 */
export const PREVIEW_ALIASES = {
  'face-lock--baselineWardrobe--camisole': 'face-lock.webp',
  'outfit-styling--framing--full-body': 'outfit-styling.webp',
  'char-sheet--headlessVariant--ghost': 'char-sheet.webp',
  'scene--lighting--daylight': 'scene.webp',
  'scene--framing--medium': 'scene.webp',
  'detail--backdrop--gray': 'detail.webp',
  'detail--framing--chest-up': 'detail.webp',
  'product-shot--surface--seamless': 'product-shot.webp',
  'poster--lighting--side': 'poster.webp',
  'video-product-ad--runtime--8s': 'video-product-ad.webp',
  'video-product-ad--lens--47': 'video-product-ad.webp',
  'video-product-ad--surface--seamless': 'video-product-ad.webp',
  'video-product-ad--atmosphere--light': 'video-product-ad.webp',
  'video-ugc--runtime--8s': 'video-ugc.webp',
  'video-ugc--framing--selfie': 'video-ugc.webp',
  'video-ugc--lens--63': 'video-ugc.webp',
  'video-narrative--runtime--8s': 'video-narrative.webp',
  'video-narrative--lens--47': 'video-narrative.webp',
  'video-narrative--atmosphere--light': 'video-narrative.webp',
  'video-atmospheric--runtime--8s': 'video-atmospheric.webp',
  'video-atmospheric--lens--84': 'video-atmospheric.webp',
  'video-atmospheric--timeofday--golden': 'video-atmospheric.webp',
  'video-atmospheric--atmosphere--light': 'video-atmospheric.webp',
};

/**
 * Controls whose options a still picture cannot tell apart — clip length.
 * Every option in these groups shows the mode's own picture, so none of them
 * ever waits on a fired file of its own.
 */
export const NON_VISUAL_CONTROLS = new Set(['runtime']);

/**
 * Controls that show no picture at all. A sound bed has nothing to look at and
 * a camera move is motion, not a frame — borrowing the mode picture for either
 * taught nothing, so these render bare: no hover card, no inline thumb.
 */
export const NO_PREVIEW_CONTROLS = new Set(['sound', 'camera', 'energy']);

export function optionKey(modeId, controlId, optionId) {
  return `${modeId}--${controlId}--${optionId}`;
}

export function modePreviewFile(modeId) {
  return `${modeId}.webp`;
}

export function optionPreviewFile(modeId, controlId, optionId) {
  if (NO_PREVIEW_CONTROLS.has(controlId)) return null;
  if (NON_VISUAL_CONTROLS.has(controlId)) return modePreviewFile(modeId);
  const key = optionKey(modeId, controlId, optionId);
  return PREVIEW_ALIASES[key] || `${key}.webp`;
}

export function previewUrl(file) {
  return PREVIEW_DIR + file;
}

/* ---------- everything below this line touches the DOM ---------- */

const PICTURE_WIDTH = 220;
const GAP = 10;
const EDGE = 8;
const ARROW_INSET = 14;

/** filename -> Promise<{ok, width, height}>, one network try per file per visit. */
const probes = new Map();

let card = null;
let cardPicture = null;
let wired = false;
let openFor = null;

function media(query) {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

function hoverCapable() {
  return media('(hover: hover)');
}

/** True where there is no hover to trigger a card, so pictures go inline. */
export function inlinePreviews() {
  return media('(pointer: coarse)');
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(value, high));
}

function probe(file) {
  let pending = probes.get(file);
  if (pending) return pending;
  pending = new Promise((resolve) => {
    const picture = new Image();
    picture.onload = () => resolve({ ok: true, width: picture.naturalWidth, height: picture.naturalHeight });
    picture.onerror = () => resolve({ ok: false, width: 0, height: 0 });
    picture.src = previewUrl(file);
  });
  probes.set(file, pending);
  return pending;
}

/** 320 wide, height carried over from the file so the card never reflows. */
function sizePicture(node, size) {
  node.width = PICTURE_WIDTH;
  node.height = size.width ? Math.round((PICTURE_WIDTH * size.height) / size.width) : PICTURE_WIDTH;
}

/** One card for the whole page, built the first time something needs it. */
function ensureCard() {
  if (card) return card;
  card = document.createElement('div');
  card.className = 'previewpop';
  cardPicture = document.createElement('img');
  cardPicture.decoding = 'async';
  card.appendChild(cardPicture);
  document.body.appendChild(card);
  return card;
}

/** The card may cover the page, never the nav: that is where it flips. */
function topLimit() {
  const nav = document.querySelector('.topnav');
  const bottom = nav ? nav.getBoundingClientRect().bottom : 0;
  return Math.max(EDGE, bottom + EDGE);
}

function showCard(element, file, label, size) {
  const node = ensureCard();
  cardPicture.src = previewUrl(file);
  cardPicture.alt = label;
  sizePicture(cardPicture, size);
  node.classList.add('is-open');

  const anchor = element.getBoundingClientRect();
  const box = node.getBoundingClientRect();
  const limit = topLimit();

  const left = clamp(
    anchor.left + anchor.width / 2 - box.width / 2,
    EDGE,
    Math.max(EDGE, window.innerWidth - box.width - EDGE)
  );

  const above = anchor.top - GAP - box.height;
  let top = above;
  const flipped = above < limit;
  if (flipped) {
    top = anchor.bottom + GAP;
    const lowest = window.innerHeight - box.height - EDGE;
    if (top > lowest) top = Math.max(limit, lowest);
  }

  node.classList.toggle('is-below', flipped);
  node.classList.toggle('is-above', !flipped);
  node.style.left = `${Math.round(left)}px`;
  node.style.top = `${Math.round(top)}px`;
  node.style.setProperty(
    '--arrow-x',
    `${Math.round(clamp(anchor.left + anchor.width / 2 - left, ARROW_INSET, box.width - ARROW_INSET))}px`
  );
}

function hideCard() {
  if (card) card.classList.remove('is-open');
}

function tagged(event) {
  const node = event.target;
  return node && typeof node.closest === 'function' ? node.closest('[data-preview]') : null;
}

function onPointerOver(event) {
  if (!hoverCapable()) return;
  const target = tagged(event);
  if (!target) {
    openFor = null;
    hideCard();
    return;
  }
  if (target === openFor) return;
  openFor = target;
  const file = target.dataset.preview;
  probe(file).then((result) => {
    // the pointer moved on, or a re-render replaced the control, while we waited
    if (openFor !== target || !target.isConnected) return;
    if (!result.ok) {
      hideCard();
      return;
    }
    showCard(target, file, target.dataset.previewLabel || '', result);
  });
}

function onPointerOut(event) {
  const target = tagged(event);
  if (!target) return;
  if (event.relatedTarget && target.contains(event.relatedTarget)) return;
  if (openFor === target) openFor = null;
  hideCard();
}

/**
 * One set of delegated listeners for the life of the page. Controls are rebuilt
 * on every render and on every language switch, so nothing is ever bound to a
 * control itself: no duplicate cards, nothing left behind.
 */
export function initPreviews() {
  if (wired) return;
  wired = true;
  document.addEventListener('pointerover', onPointerOver);
  document.addEventListener('pointerout', onPointerOut);
  document.addEventListener('pointerdown', hideCard);
  // capture: the left panel is its own scroll container
  window.addEventListener('scroll', hideCard, true);
  window.addEventListener('resize', hideCard);
}

/** Name the picture and the alt text a control should show. */
export function tagPreview(element, file, label) {
  if (!file) return;
  element.dataset.preview = file;
  element.dataset.previewLabel = label;
}

/** Inline picture of the selected option, appended once the file answers. */
export function appendThumb(parent, file, label) {
  if (!file) return;
  probe(file).then((result) => {
    if (!result.ok || !parent.isConnected) return;
    const picture = document.createElement('img');
    picture.className = 'previewthumb';
    picture.src = previewUrl(file);
    picture.alt = label;
    picture.decoding = 'async';
    sizePicture(picture, result);
    parent.appendChild(picture);
  });
}
