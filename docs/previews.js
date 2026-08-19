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
// Camera moves are the exception: no file could hold one. Those chips get a
// small scene drawn here node by node and animated by docs/motion-previews.css,
// so they cost nothing to fetch and cannot arrive broken.
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
 * Controls no picture file belongs to. A sound bed has nothing to look at and a
 * camera move is motion, not a frame, so neither one waits on a fired file.
 * Sound stops there and renders bare. Camera moves carry on below, into a
 * drawing that moves.
 */
export const NO_PREVIEW_CONTROLS = new Set(['sound', 'camera', 'energy']);

/** The two control ids that name a camera move, one per video mode family. */
export const MOTION_CONTROLS = new Set(['camera', 'energy']);

/**
 * Which of the three scenes a mode's moves are drawn on. Same armature every
 * time — ground receding to a horizon, backdrop shapes, something at centre —
 * the middle of the frame is all that changes.
 */
export const MOTION_SCENES = {
  'video-narrative': 'person',
  'video-product-ad': 'product',
  'video-atmospheric': 'environment',
};

/**
 * Every animation the scene knows how to run, and the mark each one falls back
 * to where motion is turned off. One table, so a move that nobody drew a mark
 * for cannot quietly ship pointing the wrong way.
 */
export const MOTION_MOVES = {
  handheld: 'wave',
  follow: 'in',
  reverse: 'out',
  side: 'left',
  dollyin: 'in',
  arc: 'round',
  tripod: 'in',
  orbit: 'round',
  lockoff: 'held',
  pedestal: 'up',
  push: 'in',
  drift: 'left',
  crane: 'up',
  pullback: 'out',
};

/** Marks, each drawn in a 24 x 24 box. */
export const ARROW_PATHS = {
  in: 'M3 3 9 9M9 4.5 9 9 4.5 9M21 3 15 9M15 4.5 15 9 19.5 9M3 21 9 15M4.5 15 9 15 9 19.5M21 21 15 15M19.5 15 15 15 15 19.5',
  out: 'M9 9 3 3M3 7.5 3 3 7.5 3M15 9 21 3M16.5 3 21 3 21 7.5M9 15 3 21M3 16.5 3 21 7.5 21M15 15 21 21M21 16.5 21 21 16.5 21',
  left: 'M21 12 4 12M9.5 6.5 4 12 9.5 17.5',
  up: 'M12 21 12 4M6.5 9.5 12 4 17.5 9.5',
  round: 'M3 15A8 8 0 0 1 17 15M17 15 20.2 12.6M17 15 16.9 11.1',
  wave: 'M2.5 12q3-5 6 0t6 0t6 0',
  held: 'M4 8V4H8M16 4H20V8M20 16V20H16M8 20H4V16',
};

/**
 * Option key -> animation. Two options name the same animation where the move
 * really is the same one on a different scene: a locked-off product frame and a
 * locked-off location are one move, drawn on two subjects.
 */
export const MOTION_PREVIEWS = {
  'video-narrative--camera--handheld': 'handheld',
  'video-narrative--camera--follow': 'follow',
  'video-narrative--camera--reverse': 'reverse',
  'video-narrative--camera--side': 'side',
  'video-narrative--camera--dollyin': 'dollyin',
  'video-narrative--camera--arc': 'arc',
  'video-product-ad--camera--tripod': 'tripod',
  'video-product-ad--camera--orbit': 'orbit',
  'video-product-ad--camera--static': 'lockoff',
  'video-product-ad--camera--pedestal': 'pedestal',
  'video-atmospheric--energy--static': 'lockoff',
  'video-atmospheric--energy--push': 'push',
  'video-atmospheric--energy--drift': 'drift',
  'video-atmospheric--energy--crane': 'crane',
  'video-atmospheric--energy--pullback': 'pullback',
};

/**
 * The three steps a travelling move runs on. Each one lands a layer exactly
 * where its neighbour was, which is the only reason a move can run one
 * direction forever without a jump. The stylesheet animates by these same
 * numbers and cannot read them from here, so test/previews.test.mjs holds the
 * two files to each other: a mismatch is one visible stutter per cycle and no
 * other symptom at all.
 */
export const MOTION_STEPS = { lineRatio: 1.45, rayDegrees: 15, barRepeat: 132 };

/** The move a camera chip draws, and the scene it draws it on. */
export function optionMotion(modeId, controlId, optionId) {
  if (!MOTION_CONTROLS.has(controlId)) return null;
  const move = MOTION_PREVIEWS[optionKey(modeId, controlId, optionId)];
  const scene = MOTION_SCENES[modeId];
  if (!move || !scene) return null;
  return { move, scene };
}

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
let cardScene = null;
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

/**
 * One card for the whole page, built the first time something needs it. It
 * holds both slots: a picture for the chips that have one, a drawn scene for
 * the camera moves. Exactly one of them is ever showing.
 */
function ensureCard() {
  if (card) return card;
  card = document.createElement('div');
  card.className = 'previewpop';
  cardPicture = document.createElement('img');
  cardPicture.decoding = 'async';
  card.appendChild(cardPicture);
  cardScene = document.createElement('div');
  cardScene.className = 'previewscene';
  cardScene.hidden = true;
  card.appendChild(cardScene);
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
  cardPicture.hidden = false;
  cardScene.hidden = true;
  openCard(node, element);
}

/** A camera move needs no file, so its card opens in the same frame as the hover. */
function showMotionCard(element, motion, label) {
  const node = ensureCard();
  while (cardScene.firstChild) cardScene.removeChild(cardScene.firstChild);
  cardScene.appendChild(motionScene(motion, label, PICTURE_WIDTH));
  cardScene.hidden = false;
  cardPicture.hidden = true;
  openCard(node, element);
}

/** Above the control if it fits, below it if it does not, never off an edge. */
function openCard(node, element) {
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
  return node && typeof node.closest === 'function'
    ? node.closest('[data-preview],[data-motion]')
    : null;
}

/** The move a tagged control carries, if it carries one instead of a file. */
function taggedMotion(node) {
  const move = node.dataset.motion;
  return move ? { move, scene: node.dataset.motionScene } : null;
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
  const motion = taggedMotion(target);
  if (motion) {
    showMotionCard(target, motion, target.dataset.previewLabel || '');
    return;
  }
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

/** Name the move a control should draw, the same way tagPreview names a file. */
export function tagMotion(element, motion, label) {
  if (!motion) return;
  element.dataset.motion = motion.move;
  element.dataset.motionScene = motion.scene;
  element.dataset.previewLabel = label;
}

/** Inline drawing of the selected move. Nothing to fetch, so nothing to wait for. */
export function appendMotionThumb(parent, motion, label) {
  if (!motion) return;
  const scene = motionScene(motion, label, THUMB_WIDTH);
  scene.classList.add('motionthumb');
  parent.appendChild(scene);
}

/* ---------- the drawn scene ---------- */

// One armature carries all fifteen moves. The frame is 220 x 124 with the
// horizon and the vanishing point dead centre, so every layer scales and turns
// about that one point and the perspective stays honest.
//
// Two of the layers are built to loop without a seam. The ground lines step
// away from the horizon by a fixed ratio, so scaling the set by that ratio
// lands every line exactly where its neighbour was. The rays are spaced by a
// fixed angle, so turning the set by that angle does the same. That is what
// lets travelling moves run one direction forever instead of rocking back.

const SVG_NS = 'http://www.w3.org/2000/svg';
const FRAME = { width: 220, height: 124, x: 110, y: 62 };
const THUMB_WIDTH = 120;
/** Three heights repeating, so one repeat of the backdrop is three bars wide. */
const BAR_HEIGHTS = [26, 16, 32];
const BAR_SPACING = MOTION_STEPS.barRepeat / BAR_HEIGHTS.length;

function round(value) {
  return Math.round(value * 100) / 100;
}

function svgNode(tag, attributes) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const name of Object.keys(attributes)) node.setAttribute(name, String(attributes[name]));
  return node;
}

/** Ground lines, stepping away from the horizon by a fixed ratio. */
function groundLines() {
  const group = svgNode('g', { class: 'mp-lines' });
  for (let step = -8; step <= 10; step += 1) {
    const y = round(FRAME.y + 3 * MOTION_STEPS.lineRatio ** step);
    group.appendChild(svgNode('line', { x1: -160, y1: y, x2: 380, y2: y }));
  }
  return group;
}

/** Ground rays, spaced by a fixed angle out of the vanishing point. */
function groundRays() {
  const group = svgNode('g', { class: 'mp-rays' });
  for (let step = -6; step <= 6; step += 1) {
    const angle = (step * MOTION_STEPS.rayDegrees * Math.PI) / 180;
    group.appendChild(
      svgNode('line', {
        x1: FRAME.x,
        y1: FRAME.y,
        x2: round(FRAME.x + 150 * Math.sin(angle)),
        y2: round(FRAME.y + 150 * Math.cos(angle)),
      })
    );
  }
  return group;
}

/** Backdrop standing on the horizon, repeating so one repeat of it can slide. */
function backdrop() {
  const group = svgNode('g', { class: 'mp-far' });
  for (let step = -4; step <= 4; step += 1) {
    const height = BAR_HEIGHTS[(step + 6) % 3];
    group.appendChild(
      svgNode('rect', {
        x: FRAME.x + step * BAR_SPACING - 7,
        y: FRAME.y - height,
        width: 14,
        height,
      })
    );
  }
  return group;
}

function subjectPerson() {
  const group = svgNode('g', { class: 'mp-subject' });
  group.appendChild(svgNode('circle', { cx: 110, cy: 74.5, r: 4.8 }));
  group.appendChild(svgNode('polygon', { points: '104.6,81 115.4,81 114.2,93.5 105.8,93.5' }));
  group.appendChild(svgNode('rect', { x: 106.2, y: 93.5, width: 3, height: 10.5 }));
  group.appendChild(svgNode('rect', { x: 110.8, y: 93.5, width: 3, height: 10.5 }));
  return group;
}

function subjectProduct() {
  const group = svgNode('g', { class: 'mp-subject' });
  group.appendChild(svgNode('rect', { x: 102, y: 80, width: 16, height: 24, rx: 2.5 }));
  group.appendChild(svgNode('rect', { x: 107.5, y: 73, width: 5, height: 8 }));
  group.appendChild(svgNode('rect', { x: 106.4, y: 69.5, width: 7.2, height: 4, rx: 1 }));
  return group;
}

/** No figure out here: the location is the subject, so it stands on the horizon. */
function subjectSkyline() {
  const group = svgNode('g', { class: 'mp-subject' });
  for (const [x, top, width] of [[96, 44, 12], [108, 34, 14], [122, 50, 10]]) {
    group.appendChild(svgNode('rect', { x, y: top, width, height: FRAME.y - top }));
  }
  return group;
}

const SUBJECTS = { person: subjectPerson, product: subjectProduct, environment: subjectSkyline };

/** The one thing that moves while the frame holds: light on a product, air outside. */
function lifeSpot(scene) {
  const group = svgNode('g', { class: 'mp-life' });
  const spot =
    scene === 'environment'
      ? { cx: 84, cy: 52, rx: 9, ry: 2.6 }
      : { cx: 96, cy: 86, rx: 7, ry: 2.2 };
  group.appendChild(svgNode('ellipse', spot));
  return group;
}

function directionArrow(move) {
  const group = svgNode('g', { class: 'mp-arrow', transform: 'translate(186 90) scale(.85)' });
  group.appendChild(svgNode('path', { d: ARROW_PATHS[MOTION_MOVES[move]] || ARROW_PATHS.held }));
  return group;
}

/** One scene, sized to the slot it is going into. The move is a class name. */
export function motionScene(motion, label, width) {
  const height = Math.round((width * FRAME.height) / FRAME.width);
  const root = svgNode('svg', {
    class: `mp mp-${motion.move} mp-scene-${motion.scene}`,
    viewBox: `0 0 ${FRAME.width} ${FRAME.height}`,
    width,
    height,
    role: 'img',
    'aria-label': label,
  });

  const title = svgNode('title', {});
  title.textContent = label;
  root.appendChild(title);
  root.appendChild(
    svgNode('rect', { class: 'mp-frame', x: 0, y: 0, width: FRAME.width, height: FRAME.height, rx: 6 })
  );

  const world = svgNode('g', { class: 'mp-shake' });
  world.appendChild(svgNode('rect', { class: 'mp-fill', x: -160, y: FRAME.y, width: 540, height: 260 }));
  world.appendChild(groundRays());
  world.appendChild(groundLines());
  // the line set packs up against the horizon, where distance would haze it out
  world.appendChild(svgNode('rect', { class: 'mp-haze', x: -160, y: FRAME.y, width: 540, height: 3.2 }));
  world.appendChild(
    svgNode('rect', { class: 'mp-haze is-soft', x: -160, y: FRAME.y + 3.2, width: 540, height: 3.4 })
  );
  // the outermost rays lie along the horizon, so a turn swings them up over it:
  // the sky is painted last of the flat layers and takes them back
  world.appendChild(svgNode('rect', { class: 'mp-sky', x: -160, y: -160, width: 540, height: 222 }));
  world.appendChild(backdrop());
  world.appendChild(
    svgNode('line', { class: 'mp-horizon', x1: -160, y1: FRAME.y, x2: 380, y2: FRAME.y })
  );
  world.appendChild((SUBJECTS[motion.scene] || subjectPerson)());
  if (motion.move === 'lockoff') world.appendChild(lifeSpot(motion.scene));

  root.appendChild(world);
  root.appendChild(directionArrow(motion.move));
  return root;
}
