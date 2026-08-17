// Every control on the page must be able to name its picture, and no two
// different controls may quietly claim the same file. The pictures themselves
// are dropped in later, so this suite guards the contract the filenames carry:
// modes are {modeId}.webp, options are {modeId}--{controlId}--{optionId}.webp,
// and each mode's default option borrows the mode's own picture.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PREVIEW_ALIASES,
  PREVIEW_DIR,
  modePreviewFile,
  optionKey,
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
  'scene--framing--medium',
  'scene--lighting--daylight',
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
    suite.check(`${tag} resolves to one filename`, typeof file === 'string' && FILENAME.test(file), file);
    suite.equal(`${tag} resolution is stable`, optionPreviewFile(modeId, controlId, optionId), file);

    if (isDefault) {
      suite.equal(`${tag} is the default, so it borrows the mode picture`, file, modePreviewFile(modeId));
    } else {
      suite.equal(`${tag} gets its own picture`, file, `${optionKey(modeId, controlId, optionId)}.webp`);
      suite.check(`${tag} never borrows a mode picture`, !modeFiles.has(file), file);
    }

    const owner = owners.get(file);
    // two options may share a file only by both being the same mode's default
    suite.check(
      `${tag} does not collide with ${owner || 'anything'}`,
      !owner || (isDefault && owner.startsWith(`${modeId}/`)),
      file
    );
    if (!owner) owners.set(file, tag);
  }

  const uniqueFiles = new Set([...modeFiles, ...owners.keys()]);
  suite.equal(
    'one file per mode plus one per non-default option',
    uniqueFiles.size,
    modeIds.length + all.filter((combo) => !combo.isDefault).length
  );

  // the alias table itself
  const aliasKeys = Object.keys(PREVIEW_ALIASES).sort();
  suite.equal('alias table holds exactly the seven defaults', aliasKeys.join(','), EXPECTED_ALIAS_KEYS.join(','));

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
  suite.equal('every default option is aliased', aliasKeys.length, defaultCombos.size);

  // url shape: relative, so a project page under a subpath still finds the files
  suite.equal('pictures live under docs/previews/', PREVIEW_DIR, './previews/');
  suite.equal('urls join without a double slash', previewUrl('scene.webp'), './previews/scene.webp');

  // the module is UI plumbing, not a translation layer
  const source = readFileSync(join(paths.docs, 'previews.js'), 'utf8');
  suite.check('previews.js carries no CJK', !CJK.test(source));
  suite.check('previews.js sets no style attribute', !source.includes("setAttribute('style'"), 'CSP blocks it');

  return suite.finish();
}

await runAsMain(import.meta.url, run);
