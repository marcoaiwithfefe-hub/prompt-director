// Every control on the page must be able to name its picture, and no two
// different controls may quietly claim the same file. The pictures themselves
// are dropped in later, so this suite guards the contract the filenames carry:
// modes are {modeId}.webp, options are {modeId}--{controlId}--{optionId}.webp,
// and each mode's default option borrows the mode's own picture.
//
// Camera moves carry a second contract. They have no file at all: every one of
// them names an animation, every animation is drawn by the stylesheet and has a
// mark for a visitor who turned motion off, and the stylesheet is actually
// linked. Each of those can fail without a broken image to show for it, so each
// one is asserted here.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ARROW_PATHS,
  MOTION_CONTROLS,
  MOTION_MOVES,
  MOTION_PREVIEWS,
  MOTION_SCENES,
  MOTION_STEPS,
  NON_VISUAL_CONTROLS,
  NO_PREVIEW_CONTROLS,
  PREVIEW_ALIASES,
  PREVIEW_DIR,
  modePreviewFile,
  optionKey,
  optionMotion,
  optionPreviewFile,
  previewUrl,
} from '../docs/previews.js';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const FILENAME = /^[A-Za-z0-9-]+\.webp$/;
const CJK = /[㐀-鿿，。]/;

const EXPECTED_ALIAS_KEYS = [
  'char-sheet--headlessVariant--ghost',
  'detail--backdrop--gray',
  'detail--framing--chest-up',
  'face-lock--baselineWardrobe--camisole',
  'outfit-styling--framing--full-body',
  'poster--lighting--side',
  'product-shot--surface--seamless',
  'scene--framing--medium',
  'scene--lighting--daylight',
  'video-atmospheric--atmosphere--light',
  'video-atmospheric--lens--84',
  'video-atmospheric--runtime--8s',
  'video-atmospheric--timeofday--golden',
  'video-narrative--atmosphere--light',
  'video-narrative--lens--47',
  'video-narrative--runtime--8s',
  'video-product-ad--atmosphere--light',
  'video-product-ad--lens--47',
  'video-product-ad--runtime--8s',
  'video-product-ad--surface--seamless',
  'video-ugc--framing--selfie',
  'video-ugc--lens--63',
  'video-ugc--runtime--8s',
];

function combos() {
  const all = [];
  for (const mode of presets.modes) {
    for (const [controlId, group] of Object.entries(mode.controls || {})) {
      for (const option of group.options) {
        all.push({ modeId: mode.id, controlId, optionId: option.id, isDefault: group.default === option.id });
      }
    }
  }
  return all;
}

export async function run() {
  const suite = createSuite('previews (picture filename contract)');

  const modeIds = presets.modes.map((mode) => mode.id);
  const modeFiles = new Set();

  for (const modeId of modeIds) {
    const file = modePreviewFile(modeId);
    suite.check(`${modeId} resolves to one filename`, typeof file === 'string' && FILENAME.test(file), file);
    suite.equal(`${modeId} resolution is stable`, modePreviewFile(modeId), file);
    suite.check(`${modeId} filename is not already taken`, !modeFiles.has(file), file);
    modeFiles.add(file);
  }
  suite.equal('every mode has a picture filename', modeFiles.size, modeIds.length);

  // every option on every mode names exactly one file
  const owners = new Map();
  const all = combos();
  for (const { modeId, controlId, optionId, isDefault } of all) {
    const tag = `${modeId}/${controlId}/${optionId}`;
    const file = optionPreviewFile(modeId, controlId, optionId);
    if (NO_PREVIEW_CONTROLS.has(controlId)) {
      suite.equal(`${tag} shows no picture at all`, file, null);
      suite.equal(`${tag} resolution is stable`, optionPreviewFile(modeId, controlId, optionId), null);
      continue;
    }
    suite.check(`${tag} resolves to one filename`, typeof file === 'string' && FILENAME.test(file), file);
    suite.equal(`${tag} resolution is stable`, optionPreviewFile(modeId, controlId, optionId), file);

    const nonVisual = NON_VISUAL_CONTROLS.has(controlId);
    if (isDefault || nonVisual) {
      suite.equal(
        `${tag} ${nonVisual ? 'is non-visual' : 'is the default'}, so it borrows the mode picture`,
        file,
        modePreviewFile(modeId)
      );
    } else {
      suite.equal(`${tag} gets its own picture`, file, `${optionKey(modeId, controlId, optionId)}.webp`);
      suite.check(`${tag} never borrows a mode picture`, !modeFiles.has(file), file);
    }

    const owner = owners.get(file);
    // two options may share a file only within one mode, and only as its
    // default or as members of a non-visual group
    suite.check(
      `${tag} does not collide with ${owner || 'anything'}`,
      !owner || ((isDefault || nonVisual) && owner.startsWith(`${modeId}/`)),
      file
    );
    if (!owner) owners.set(file, tag);
  }

  const uniqueFiles = new Set([...modeFiles, ...owners.keys()]);
  suite.equal(
    'one file per mode plus one per non-default visual option',
    uniqueFiles.size,
    modeIds.length +
      all.filter(
        (combo) =>
          !combo.isDefault &&
          !NON_VISUAL_CONTROLS.has(combo.controlId) &&
          !NO_PREVIEW_CONTROLS.has(combo.controlId)
      ).length
  );

  // the alias table itself
  const aliasKeys = Object.keys(PREVIEW_ALIASES).sort();
  suite.equal(
    'alias table holds exactly one entry per default option',
    aliasKeys.join(','),
    EXPECTED_ALIAS_KEYS.join(',')
  );

  const realCombos = new Set(all.map((combo) => optionKey(combo.modeId, combo.controlId, combo.optionId)));
  const defaultCombos = new Set(
    all.filter((combo) => combo.isDefault).map((combo) => optionKey(combo.modeId, combo.controlId, combo.optionId))
  );
  for (const key of aliasKeys) {
    suite.check(`alias ${key} points at a real option`, realCombos.has(key), 'no such option in the grammar');
    suite.check(`alias ${key} points at a default option`, defaultCombos.has(key));
    const value = PREVIEW_ALIASES[key];
    suite.check(`alias ${key} resolves to a real mode picture`, modeFiles.has(value), value);
    suite.equal(`alias ${key} belongs to its own mode`, value, `${key.split('--')[0]}.webp`);
  }
  suite.equal(
    'every default option with a picture is aliased',
    aliasKeys.length,
    all.filter((combo) => combo.isDefault && !NO_PREVIEW_CONTROLS.has(combo.controlId)).length
  );

  // url shape: relative, so a project page under a subpath still finds the files
  suite.equal('pictures live under docs/previews/', PREVIEW_DIR, './previews/');
  suite.equal('urls join without a double slash', previewUrl('scene.webp'), './previews/scene.webp');

  // ---- the camera moves ----

  const motionCombos = all.filter((combo) => MOTION_CONTROLS.has(combo.controlId));
  const bareCombos = all.filter(
    (combo) => NO_PREVIEW_CONTROLS.has(combo.controlId) && !MOTION_CONTROLS.has(combo.controlId)
  );
  suite.equal('the grammar carries fifteen camera moves', motionCombos.length, 15);
  suite.check('sound is the only control left rendering bare', bareCombos.length > 0, 'nothing bare');
  for (const controlId of MOTION_CONTROLS) {
    suite.check(`${controlId} still names no picture file`, NO_PREVIEW_CONTROLS.has(controlId));
  }

  const scenes = new Set(Object.values(MOTION_SCENES));
  for (const { modeId, controlId, optionId } of motionCombos) {
    const tag = `${modeId}/${controlId}/${optionId}`;
    const motion = optionMotion(modeId, controlId, optionId);
    suite.check(`${tag} draws a move`, Boolean(motion), 'no motion preview for this chip');
    if (!motion) continue;
    suite.check(`${tag} names an animation that exists`, motion.move in MOTION_MOVES, motion.move);
    suite.check(`${tag} names a scene`, scenes.has(motion.scene), motion.scene);
    suite.equal(`${tag} still shows no picture`, optionPreviewFile(modeId, controlId, optionId), null);
    const again = optionMotion(modeId, controlId, optionId);
    suite.equal(`${tag} resolution is stable`, `${again.move}/${again.scene}`, `${motion.move}/${motion.scene}`);
  }

  for (const { modeId, controlId, optionId } of bareCombos) {
    const tag = `${modeId}/${controlId}/${optionId}`;
    suite.equal(`${tag} draws no move either`, optionMotion(modeId, controlId, optionId), null);
  }

  suite.equal('one motion entry per camera move, no more', Object.keys(MOTION_PREVIEWS).length, motionCombos.length);
  for (const key of Object.keys(MOTION_PREVIEWS)) {
    suite.check(`motion key ${key} points at a real option`, realCombos.has(key), 'no such option in the grammar');
    suite.check(`motion key ${key} sits on a camera control`, MOTION_CONTROLS.has(key.split('--')[1]), key);
  }

  // an animation nobody uses is dead weight; a move nobody drew is a blank card
  const usedMoves = new Set(Object.values(MOTION_PREVIEWS));
  for (const move of Object.keys(MOTION_MOVES)) {
    suite.check(`animation ${move} is reachable from a chip`, usedMoves.has(move), 'defined but unused');
    suite.check(`animation ${move} has a mark for motion-off`, Boolean(ARROW_PATHS[MOTION_MOVES[move]]), MOTION_MOVES[move]);
  }

  // every mode with camera chips names the scene they are drawn on, and no other
  const motionModes = new Set(motionCombos.map((combo) => combo.modeId));
  for (const modeId of motionModes) {
    suite.check(`${modeId} names the scene its moves are drawn on`, Boolean(MOTION_SCENES[modeId]), 'no scene');
  }
  for (const modeId of Object.keys(MOTION_SCENES)) {
    suite.check(`scene entry ${modeId} belongs to a mode with camera chips`, motionModes.has(modeId), 'stale entry');
  }

  // the drawing is nothing without the stylesheet, and the stylesheet is
  // nothing unless the page loads it
  const motionCss = readFileSync(join(paths.docs, 'motion-previews.css'), 'utf8');
  for (const move of Object.keys(MOTION_MOVES)) {
    suite.check(`.mp-${move} is animated in motion-previews.css`, motionCss.includes(`.mp-${move} `), 'no rule');
  }
  suite.check(
    'motion-previews.css is linked from index.html',
    readFileSync(paths.indexHtml, 'utf8').includes('href="./motion-previews.css"'),
    'the scenes would render still'
  );
  // the stylesheet steps by the same geometry previews.js draws, or a
  // travelling move stutters once a cycle and nothing else goes wrong
  const seamless = {
    q: [MOTION_STEPS.lineRatio, Number((1 / MOTION_STEPS.lineRatio).toFixed(4))],
    r: [MOTION_STEPS.rayDegrees, -MOTION_STEPS.rayDegrees],
    tx: [MOTION_STEPS.barRepeat, -MOTION_STEPS.barRepeat],
  };
  for (const [name, allowed] of Object.entries(seamless)) {
    const used = [...motionCss.matchAll(new RegExp(`--mp-${name}:(-?[0-9.]+)`, 'g'))].map((hit) =>
      Number(hit[1])
    );
    suite.check(`some move travels on --mp-${name}`, used.length > 0, 'nothing uses it');
    for (const value of used) {
      suite.check(
        `--mp-${name}:${value} is one seamless step`,
        allowed.includes(value),
        `expected ${allowed.join(' or ')}`
      );
    }
  }

  suite.check(
    'the scenes stay off the network',
    !motionCss.includes('url(') && !motionCss.includes('@import'),
    'a preview that fetches something can arrive broken'
  );

  // the module is UI plumbing, not a translation layer
  const source = readFileSync(join(paths.docs, 'previews.js'), 'utf8');
  suite.check('previews.js carries no CJK', !CJK.test(source));
  suite.check('previews.js sets no style attribute', !source.includes("setAttribute('style'"), 'CSP blocks it');
  suite.check('motion-previews.css carries no CJK', !CJK.test(motionCss));

  return suite.finish();
}

await runAsMain(import.meta.url, run);
