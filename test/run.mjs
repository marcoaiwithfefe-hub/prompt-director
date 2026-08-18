// node test/run.mjs   runs every suite, exits nonzero if anything failed.
//
// The list below is the contract. A green run that quietly skipped a suite is
// worse than a red one, so the run ends by comparing the suites that actually
// reported against EXPECTED_SUITES and fails if any of them did not.

import { createSuite, printResult } from './harness.mjs';
import { run as assembleSuite } from './assemble.test.mjs';
import { run as subjectsSuite } from './subjects.test.mjs';
import { run as videoSuite } from './video.test.mjs';
import { run as registersSuite } from './registers.test.mjs';
import { run as fixturesSuite } from './fixtures.test.mjs';
import { run as frozenSuite } from './frozen.test.mjs';
import { run as stateSuite } from './state.test.mjs';
import { run as paritySuite } from './parity.test.mjs';
import { run as enhanceSuite } from './enhance.test.mjs';
import { run as enhanceVideoSuite } from './enhance-video.test.mjs';
import { run as i18nSuite } from './i18n.test.mjs';
import { run as previewsSuite } from './previews.test.mjs';

const suites = [
  assembleSuite,
  subjectsSuite,
  videoSuite,
  registersSuite,
  fixturesSuite,
  frozenSuite,
  stateSuite,
  paritySuite,
  enhanceSuite,
  enhanceVideoSuite,
  i18nSuite,
  previewsSuite,
];

const EXPECTED_SUITES = [
  'assemble (full image preset matrix)',
  'subjects (hostile and awkward input)',
  'video (block assembly, porting fidelity, references)',
  'registers (phone-shot toggle on the ad modes)',
  'fixtures (committed full outputs)',
  'frozen (v1 grammar cannot move)',
  'state (media switch, per-mode memory, generation id)',
  'parity (grammar, both doors, docs copy)',
  'enhance (mocked OpenRouter)',
  'enhance video (JSON contract and client rebuild)',
  'i18n (manifest, source scan, English-only prompt)',
  'previews (picture filename contract)',
];

let failed = 0;
let checks = 0;
const ran = [];
for (const suite of suites) {
  const result = await suite();
  printResult(result);
  ran.push(result.name);
  failed += result.failures.length;
  checks += result.checks;
}

const registration = createSuite('suite registration');
registration.equal('every expected suite ran', ran.join(' | '), EXPECTED_SUITES.join(' | '));
const registrationResult = registration.finish();
printResult(registrationResult);
failed += registrationResult.failures.length;
checks += registrationResult.checks;

console.log(`\n${checks} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
