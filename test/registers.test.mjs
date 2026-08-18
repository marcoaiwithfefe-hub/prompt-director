// The phone-shot toggle on the two ad-image modes.
//
// The registry carries a `registers.markers` field. It is DOCUMENTATION. This
// suite never reads it: the marker sets below are written by hand, here, so a
// register mix-up in the registry cannot mark its own homework. They are
// deliberately longer and more specific than the registry's one-liners.

import { readFileSync } from 'node:fs';
import { assemble, assembleParts, defaultRegister, toolText } from '../docs/assemble.js';
import { createSuite, paths, runAsMain, seamFailures } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const SUBJECT = 'a frosted glass serum bottle with a brushed aluminium cap';

/** Hand-written, test-local, never derived from presets.json. */
const MARKERS = {
  'product-shot': {
    cinema: {
      required: [
        'A premium product photograph captured on a real cinema camera',
        'One large soft key shapes the form',
        'a single clean specular line runs each reflective surface',
        'Materials render true',
      ],
      forbidden: [
        'A casual real-customer photo',
        'Shot in the smartphone main-lens register',
        'the slightly imperfect framing of a real customer photo',
        'soft handheld sharpness',
      ],
    },
    phone: {
      required: [
        'A casual real-customer photo of',
        'Shot in the smartphone main-lens register',
        'found window or room light',
        'the slightly imperfect framing of a real customer photo',
      ],
      forbidden: [
        'captured on a real cinema camera',
        'One large soft key shapes the form',
        'Materials render true',
        'real contact shadow grounding it on the surface',
      ],
    },
  },
  'ad-916': {
    cinema: {
      required: [
        'A vertical ad photograph captured on a real cinema camera',
        'editorial polish, one soft directional key with controlled falloff',
        'Fine natural film grain, photographed not generated',
      ],
      forbidden: [
        'A vertical phone-shot ad photo',
        'Shot in the smartphone main-lens register',
        'mild digital compression',
      ],
    },
    phone: {
      required: [
        'A vertical phone-shot ad photo',
        'Shot in the smartphone main-lens register',
        'mild digital compression, natural saturation',
      ],
      forbidden: [
        'captured on a real cinema camera',
        'editorial polish, one soft directional key with controlled falloff',
        'Fine natural film grain, photographed not generated',
      ],
    },
  },
};

// Both registers of both modes still owe the reader a clean headline area or a
// clean product, and neither may ever render type.
const NO_TEXT = ['No rendered text', 'no rendered text'];

function combinations(mode) {
  let rows = [{}];
  for (const [controlId, group] of Object.entries(mode.controls || {})) {
    const next = [];
    for (const row of rows) {
      for (const option of group.options) next.push({ ...row, [controlId]: option.id });
    }
    rows = next;
  }
  return rows;
}

export async function run() {
  const suite = createSuite('registers (phone-shot toggle on the ad modes)');
  const registerModes = presets.modes.filter((mode) => mode.registers);

  suite.equal(
    'exactly the two ad modes carry a register axis',
    registerModes.map((mode) => mode.id).join(','),
    'product-shot,ad-916'
  );

  for (const mode of registerModes) {
    const sets = MARKERS[mode.id];
    suite.check(`${mode.id} has hand-written marker sets`, Boolean(sets));
    suite.equal(`${mode.id} defaults to the cinema register`, defaultRegister(mode), 'cinema');
    suite.equal(
      `${mode.id} ships exactly two registers`,
      Object.keys(mode.registers.templates).sort().join(','),
      'cinema,phone'
    );
    suite.check(`${mode.id} names its toggle`, Boolean(mode.registers.toggleLabel));

    // the registry's own markers stay documentation: ours are stricter, so a
    // silent edit there cannot quietly weaken this gate
    for (const register of ['cinema', 'phone']) {
      suite.check(
        `${mode.id}/${register} test markers are not the registry's`,
        sets[register].required.length > mode.registers.markers[register].required.length
      );
    }

    // register exclusivity across the mode's full chip matrix
    for (const selections of combinations(mode)) {
      for (const register of ['cinema', 'phone']) {
        const tag = `${mode.id}/${register} [${JSON.stringify(selections)}]`;
        const parts = assembleParts(presets, mode.id, { selections, subject: SUBJECT, register });
        const prompt = assemble(presets, mode.id, selections, SUBJECT, { register });
        const tool = toolText(parts);

        for (const marker of sets[register].required) {
          suite.check(`${tag} carries ${JSON.stringify(marker.slice(0, 32))}`, prompt.includes(marker));
        }
        for (const marker of sets[register].forbidden) {
          suite.check(`${tag} never says ${JSON.stringify(marker.slice(0, 32))}`, !prompt.includes(marker));
        }
        suite.check(`${tag} renders no text`, NO_TEXT.some((line) => prompt.includes(line)));
        suite.check(`${tag} leaves no unresolved token`, !/[{}]/.test(tool));
        suite.check(`${tag} carries no aspect ratio`, !/\b\d+:\d+\b/.test(tool));
        suite.check(`${tag} has clean seams`, seamFailures(prompt).length === 0, seamFailures(prompt).join(', '));
        suite.check(`${tag} carries the subject`, prompt.includes(SUBJECT));
      }

      // assembly is a pure function of state, so flipping the switch twice is a
      // no-op down to the byte
      const first = assemble(presets, mode.id, selections, SUBJECT, { register: 'cinema' });
      assemble(presets, mode.id, selections, SUBJECT, { register: 'phone' });
      const back = assemble(presets, mode.id, selections, SUBJECT, { register: 'cinema' });
      suite.equal(`${mode.id} round-trips to the same bytes`, back, first);
    }

    // an unknown register is a hard error, never a silent fallback
    let threw = false;
    try {
      assemble(presets, mode.id, null, SUBJECT, { register: 'polaroid' });
    } catch {
      threw = true;
    }
    suite.check(`${mode.id} refuses an unknown register`, threw);
  }

  // a mode with no register axis ignores the option entirely
  const poster = assemble(presets, 'poster', null, SUBJECT);
  suite.equal(
    'a mode without registers is unaffected by the toggle',
    assemble(presets, 'poster', null, SUBJECT, { register: 'phone' }),
    poster
  );

  return suite.finish();
}

await runAsMain(import.meta.url, run);
