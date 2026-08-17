// Four-line test harness. No framework, no dependencies: a suite collects
// failures, run.mjs adds them up and sets the exit code.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const paths = {
  grammarPresets: join(ROOT, 'grammar', 'presets.json'),
  docsPresets: join(ROOT, 'docs', 'presets.json'),
  docs: join(ROOT, 'docs'),
  promptMd: join(ROOT, 'PROMPT.md'),
  assemble: join(ROOT, 'docs', 'assemble.js'),
  enhance: join(ROOT, 'docs', 'enhance.js'),
};

export function createSuite(name) {
  const failures = [];
  let checks = 0;
  return {
    name,
    check(label, ok, detail) {
      checks += 1;
      if (!ok) failures.push(detail ? `${label} :: ${detail}` : label);
    },
    equal(label, actual, expected) {
      this.check(
        label,
        actual === expected,
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    },
    finish() {
      return { name, checks, failures };
    },
  };
}

export function printResult(result) {
  const status = result.failures.length ? 'FAIL' : 'PASS';
  console.log(`${status}  ${result.name}  (${result.checks} checks)`);
  for (const failure of result.failures) console.log(`      ${failure}`);
}

export function isMain(url) {
  return process.argv[1] && fileURLToPath(url) === process.argv[1];
}

export async function runAsMain(url, run) {
  if (!isMain(url)) return;
  const result = await run();
  printResult(result);
  process.exit(result.failures.length ? 1 : 0);
}

/** Template seams that mean two grammar parts were joined wrong. */
export const SEAM_PATTERNS = [
  ['double space', '  '],
  ['space before a full stop', ' .'],
  ['doubled comma', ',,'],
  ['comma then full stop', ', .'],
];

export function seamFailures(text) {
  return SEAM_PATTERNS.filter(([, pattern]) => text.includes(pattern)).map(([label]) => label);
}
