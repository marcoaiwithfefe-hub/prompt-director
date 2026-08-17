// What happens when a real person types into the subject box: nothing, spaces,
// two lines, Chinese, quotes, a script tag, a wall of text. Plus the source scan
// that keeps hostile input away from HTML parsing in the first place.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assemble, capitalizeFirst, normalizeSubject } from '../docs/assemble.js';
import { createSuite, paths, runAsMain, seamFailures } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));

const EMPTY_CASES = [
  ['empty', ''],
  ['spaces', '     '],
  ['whitespace mix', '  \n\t  \n '],
  ['punctuation only', '...'],
];

const CONTENT_CASES = [
  ['multiline', 'a woman in a long wool coat\nstanding on wet asphalt'],
  ['CJK', '亞洲男人，深藍色西裝'],
  ['CJK with full stop', '亞洲男人，深藍色西裝。'],
  ['quotes', 'a man in a jacket with "PRESS" stitched across the back'],
  ['script tag', '<script>alert(1)</script>'],
  ['trailing full stop', 'a woman in a red silk dress.'],
  ['long', `a woman in a coat ${'very '.repeat(1000)}long description`],
];

export async function run() {
  const suite = createSuite('subjects (hostile and awkward input)');

  for (const mode of presets.modes) {
    for (const [label, subject] of EMPTY_CASES) {
      suite.equal(`${mode.id} returns null for ${label}`, assemble(presets, mode.id, null, subject), null);
    }

    for (const [label, subject] of CONTENT_CASES) {
      const prompt = assemble(presets, mode.id, null, subject);
      const tag = `${mode.id} / ${label}`;
      suite.check(`${tag} assembles`, typeof prompt === 'string' && prompt.length > 0);
      if (!prompt) continue;
      const inserted = normalizeSubject(subject);
      suite.check(
        `${tag} contains the normalized subject`,
        prompt.includes(inserted) || prompt.includes(capitalizeFirst(inserted))
      );
      const seams = seamFailures(prompt);
      suite.check(`${tag} has clean seams`, seams.length === 0, seams.join(', '));
    }
  }

  // trailing punctuation must not double up against the template's own stop
  suite.check(
    'trailing full stop is absorbed',
    !assemble(presets, 'face-lock', null, 'a woman in a red silk dress.').includes('dress..')
  );
  suite.check(
    'trailing CJK full stop is absorbed',
    !assemble(presets, 'face-lock', null, '亞洲男人。').includes('。.')
  );
  suite.check('5000 character subject survives', normalizeSubject('a'.repeat(5000)).length === 5000);
  suite.check(
    'long subject assembles',
    assemble(presets, 'scene', null, 'a'.repeat(5000)).includes('a'.repeat(5000))
  );

  // user input reaches the page as text nodes only
  const jsFiles = readdirSync(paths.docs).filter((file) => file.endsWith('.js'));
  suite.check('docs ships js files', jsFiles.length >= 3, jsFiles.join(', '));
  for (const file of jsFiles) {
    const source = readFileSync(join(paths.docs, file), 'utf8');
    suite.check(`${file} never touches .innerHTML`, !source.includes('.innerHTML'));
  }

  return suite.finish();
}

await runAsMain(import.meta.url, run);
