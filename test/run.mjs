// node test/run.mjs   runs every suite, exits nonzero if anything failed.

import { printResult } from './harness.mjs';
import { run as assembleSuite } from './assemble.test.mjs';
import { run as subjectsSuite } from './subjects.test.mjs';
import { run as paritySuite } from './parity.test.mjs';
import { run as enhanceSuite } from './enhance.test.mjs';

const suites = [assembleSuite, subjectsSuite, paritySuite, enhanceSuite];

let failed = 0;
let checks = 0;
for (const suite of suites) {
  const result = await suite();
  printResult(result);
  failed += result.failures.length;
  checks += result.checks;
}

console.log(`\n${checks} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
