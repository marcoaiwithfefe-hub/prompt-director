// The Cantonese UI layer, checked against a closed list.
//
// `test/i18n-required-keys.json` is that list: every string a visitor can read
// has a key on it, and the suite runs three ways round the same manifest.
//
//   RESOLUTION  every key resolves in English and in Cantonese, through the
//               same helpers the page uses, so the test and the UI cannot
//               disagree about what a key means.
//   COVERAGE    every key the grammar implies is on the manifest, so a new mode
//               or a new chip cannot ship untranslated by being forgotten.
//   SOURCE      every data-i18n attribute, every t(...) call and every visible
//               literal in index.html traces back to the manifest, so a raw
//               string typed straight into the page fails the build.
//
// And the invariant the whole language layer exists to protect: the prompt
// stays English. The assertion is made against tool segments, so a visitor
// typing Cantonese into the subject box can neither break it nor satisfy it.

import { readFileSync } from 'node:fs';
import { assembleParts, defaultSelections, toolText } from '../docs/assemble.js';
import { STRINGS, key, resolveKey } from '../docs/i18n.js';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const manifest = JSON.parse(readFileSync(paths.i18nManifest, 'utf8'));
const required = new Set(manifest.requiredKeys);
const html = readFileSync(paths.indexHtml, 'utf8');
const appSource = readFileSync(`${paths.docs}/app.js`, 'utf8');

const CJK = /[㐀-鿿，。]/;
const LANGS = ['en', 'yue'];

// Brand and format strings that stay as typed in both languages. Everything
// else visible in the page body must carry a key.
const UNTRANSLATED = new Set([
  'Prompt',
  '·',
  'Director',
  'GitHub',
  '粵',
  'sk-or-v1-...',
  '@marcoaiwithfefe',
  '@marcorefusestocode',
  'IG',
  'YT',
  '.',
]);

/** Every key the grammar implies, built with the same helpers the page uses. */
function grammarKeys() {
  const keys = new Set();
  for (const mode of presets.modes) {
    keys.add(key.modeLabel(mode.id));
    keys.add(key.modeHint(mode.id));
    if (mode.lockedNote) keys.add(key.modeLocked(mode.id));
    for (const [controlId, group] of Object.entries(mode.controls || {})) {
      keys.add(key.controlLabel(mode.id, controlId));
      if (group.locked && group.why) keys.add(key.controlWhy(mode.id, controlId));
      for (const option of group.options) keys.add(key.controlOption(mode.id, controlId, option.id));
    }
    for (const ref of mode.refs || []) keys.add(key.refLabel(mode.id, ref.id));
    if (mode.registers) keys.add(key.registerToggle(mode.id));
  }
  return keys;
}

/** Text nodes and placeholders inside <body>, with the tag that owns each one. */
function visibleLiterals() {
  const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'));
  const out = [];
  const pattern = /<([a-z0-9-]+)([^>]*)>([^<]*)/gi;
  let hit = pattern.exec(body);
  while (hit) {
    const [, , attributes, text] = hit;
    const trimmed = text.trim();
    if (trimmed) out.push({ kind: 'text', attributes, value: trimmed });
    const placeholder = /placeholder="([^"]*)"/.exec(attributes);
    if (placeholder) out.push({ kind: 'placeholder', attributes, value: placeholder[1] });
    hit = pattern.exec(body);
  }
  return out;
}

export async function run() {
  const suite = createSuite('i18n (manifest, source scan, English-only prompt)');

  // ---- the two string tables agree with each other ----
  suite.equal(
    'en and yue string tables carry the same keys',
    Object.keys(STRINGS.en).sort().join(','),
    Object.keys(STRINGS.yue).sort().join(',')
  );

  // ---- every manifest key resolves, in both languages ----
  for (const name of manifest.requiredKeys) {
    for (const lang of LANGS) {
      const value = resolveKey(lang, name, presets);
      suite.check(
        `${name} resolves in ${lang}`,
        typeof value === 'string' && value.trim().length > 0,
        String(value)
      );
    }
  }

  // ---- and the Cantonese is actually Cantonese where it should be ----
  // Mode names are terms of art and stay English in both locales; everything
  // else the visitor reads must differ from the English or be a proper noun.
  let translated = 0;
  for (const name of manifest.requiredKeys) {
    if (name.endsWith('.label') && name.startsWith('mode.') && name.split('.').length === 3) {
      const [en, yue] = LANGS.map((lang) => resolveKey(lang, name, presets));
      suite.equal(`${name} keeps the English term of art`, yue, en);
      continue;
    }
    const [en, yue] = LANGS.map((lang) => resolveKey(lang, name, presets));
    if (yue !== en) translated += 1;
  }
  suite.check('most of the inventory really is translated', translated > 120, String(translated));

  // ---- coverage: nothing the grammar implies is missing from the manifest ----
  for (const name of grammarKeys()) {
    suite.check(`${name} is on the manifest`, required.has(name), 'add it to test/i18n-required-keys.json');
  }
  for (const name of Object.keys(STRINGS.en)) {
    suite.check(`static ${name} is on the manifest`, required.has(name));
  }
  // and nothing on the manifest is unreachable
  const reachable = new Set([...grammarKeys(), ...Object.keys(STRINGS.en)]);
  for (const name of manifest.requiredKeys) {
    suite.check(`${name} is reachable from the UI`, reachable.has(name), 'stale manifest entry');
  }

  // ---- source scan: no raw visible literals, no unmanifested key ----
  for (const hit of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) {
    suite.check(`index.html key ${hit[1]} is on the manifest`, required.has(hit[1]));
  }
  for (const hit of appSource.matchAll(/\bt\(\s*'([^']+)'/g)) {
    const name = hit[1];
    const templated = name.replace(/\$\{.*\}/, '');
    suite.check(
      `app.js key ${name} is on the manifest`,
      required.has(name) || [...required].some((candidate) => candidate.startsWith(templated)),
      'add it to test/i18n-required-keys.json'
    );
  }
  for (const literal of visibleLiterals()) {
    const keyed =
      literal.kind === 'text'
        ? /data-i18n="/.test(literal.attributes)
        : /data-i18n-placeholder="/.test(literal.attributes);
    suite.check(
      `index.html ${literal.kind} ${JSON.stringify(literal.value.slice(0, 40))} is translated or allowed`,
      keyed || UNTRANSLATED.has(literal.value),
      'give it a data-i18n key or add it to UNTRANSLATED'
    );
  }

  // ---- the prompt stays English ----
  suite.check('grammar presets carry no CJK', !CJK.test(readFileSync(paths.grammarPresets, 'utf8')));
  const yueValues = [
    ...Object.values(STRINGS.yue),
    ...manifest.requiredKeys.map((name) => resolveKey('yue', name, presets)),
  ].filter((value) => typeof value === 'string' && CJK.test(value));
  suite.check('there is Cantonese to leak in the first place', yueValues.length > 50, String(yueValues.length));

  for (const mode of presets.modes) {
    const state = {
      selections: defaultSelections(mode),
      subject: 'a woman in a red dress',
      action: 'she turns toward the window',
      refs: (mode.refs || []).map((ref) => ref.id),
      register: mode.registers ? 'phone' : undefined,
    };
    const tool = toolText(assembleParts(presets, mode.id, state));
    suite.check(`${mode.id} tool segments stay English`, !CJK.test(tool));
    const leaked = yueValues.find((value) => tool.includes(value));
    suite.check(`${mode.id} leaks no Cantonese UI string`, !leaked, leaked || '');
  }

  return suite.finish();
}

await runAsMain(import.meta.url, run);
