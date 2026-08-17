// The optional OpenRouter path, driven with a mocked fetch. Two invariants
// matter more than the rest: the key never leaves the Authorization header, and
// no failure mode is allowed to touch the deterministic prompt.

import { readFileSync } from 'node:fs';
import { assemble } from '../docs/assemble.js';
import { ENHANCE_ENDPOINT, ENHANCE_MODEL, buildRequest, requestEnhance } from '../docs/enhance.js';
import { createSuite, paths, runAsMain } from './harness.mjs';

const presets = JSON.parse(readFileSync(paths.grammarPresets, 'utf8'));
const MODE = presets.modes.find((mode) => mode.id === 'detail');
const KEY = 'sk-or-v1-test-key-do-not-use';
const SUBJECT = 'a woman with jet black hair in a cropped white ribbed tank';

function baseArgs(prompt) {
  return { presets, mode: MODE, selections: null, prompt, subject: SUBJECT, apiKey: KEY };
}

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function brokenJsonResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  };
}

export async function run() {
  const suite = createSuite('enhance (mocked OpenRouter)');
  const prompt = assemble(presets, MODE.id, null, SUBJECT);

  // ---- request shape ----
  const { url, init } = buildRequest(baseArgs(prompt));
  suite.equal('posts to the pinned endpoint', url, ENHANCE_ENDPOINT);
  suite.equal('method is POST', init.method, 'POST');
  const body = JSON.parse(init.body);
  suite.equal('model is pinned', body.model, ENHANCE_MODEL);
  suite.equal('system message first', body.messages[0].role, 'system');
  suite.check('system message names the mode', body.messages[0].content.includes(MODE.label));
  suite.check(
    'system message embeds the mode blocks',
    body.messages[0].content.includes(presets.sharedBlocks.DETAIL_FIDELITY)
  );
  suite.check(
    'system message embeds the selected clauses',
    body.messages[0].content.includes(MODE.controls.framing.options[0].clause)
  );
  suite.check('user message carries the deterministic prompt', body.messages[1].content.includes(prompt));
  suite.check('user message carries the raw subject', body.messages[1].content.includes(SUBJECT));

  // ---- key containment ----
  suite.equal('key is in the Authorization header', init.headers.Authorization, `Bearer ${KEY}`);
  suite.check('key is not in the URL', !url.includes(KEY));
  suite.check('key is not in the body', !init.body.includes(KEY));
  for (const [header, value] of Object.entries(init.headers)) {
    if (header === 'Authorization') continue;
    suite.check(`key is not in the ${header} header`, !String(value).includes(KEY));
  }

  // the same containment through the real call path
  let seen = null;
  await requestEnhance(baseArgs(prompt), {
    fetch: async (calledUrl, calledInit) => {
      seen = { calledUrl, calledInit };
      return jsonResponse(200, { choices: [{ message: { content: 'enhanced text' } }] });
    },
  });
  suite.check('request URL never carries the key', !String(seen.calledUrl).includes(KEY));
  suite.equal('signal is attached', typeof seen.calledInit.signal, 'object');

  // ---- success ----
  const okResult = await requestEnhance(baseArgs(prompt), {
    fetch: async () => jsonResponse(200, { choices: [{ message: { content: '  enhanced text  ' } }] }),
  });
  suite.check('success returns ok', okResult.ok === true);
  suite.equal('success returns trimmed text', okResult.text, 'enhanced text');

  // ---- failure matrix ----
  const failures = [
    ['401 invalid key', async () => jsonResponse(401, { error: 'no' }), 'unauthorized'],
    ['403 forbidden', async () => jsonResponse(403, { error: 'no' }), 'unauthorized'],
    ['429 rate limited', async () => jsonResponse(429, { error: 'slow down' }), 'rate-limited'],
    ['500 server error', async () => jsonResponse(500, { error: 'boom' }), 'server'],
    ['502 server error', async () => jsonResponse(502, { error: 'boom' }), 'server'],
    ['400 other http', async () => jsonResponse(400, { error: 'bad' }), 'http'],
    ['malformed json', async () => brokenJsonResponse(), 'malformed'],
    ['empty choices', async () => jsonResponse(200, { choices: [] }), 'malformed'],
    ['no content', async () => jsonResponse(200, { choices: [{ message: {} }] }), 'malformed'],
    [
      'offline',
      async () => {
        throw new TypeError('Failed to fetch');
      },
      'offline',
    ],
  ];

  for (const [label, fetchImpl, expectedCode] of failures) {
    const before = prompt;
    const result = await requestEnhance(baseArgs(prompt), { fetch: fetchImpl });
    suite.equal(`${label} sets an error code`, result.code, expectedCode);
    suite.check(`${label} is not ok`, result.ok === false);
    suite.check(`${label} carries a readable message`, Boolean(result.message && result.message.length > 8));
    suite.equal(`${label} leaves the deterministic prompt untouched`, prompt, before);
  }

  // ---- timeout and cancel ----
  const hangingFetch = (calledUrl, calledInit) =>
    new Promise((resolve, reject) => {
      calledInit.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });

  const timedOut = await requestEnhance(baseArgs(prompt), { fetch: hangingFetch, timeoutMs: 10 });
  suite.equal('timeout sets the timeout code', timedOut.code, 'timeout');

  const controller = new AbortController();
  const cancelPromise = requestEnhance(baseArgs(prompt), {
    fetch: hangingFetch,
    controller,
    timeoutMs: 5000,
  });
  controller.abort();
  const cancelled = await cancelPromise;
  suite.equal('cancel sets the cancelled code', cancelled.code, 'cancelled');

  // ---- no key ----
  let called = false;
  const noKey = await requestEnhance(
    { ...baseArgs(prompt), apiKey: '   ' },
    {
      fetch: async () => {
        called = true;
        return jsonResponse(200, {});
      },
    }
  );
  suite.equal('blank key is refused locally', noKey.code, 'missing-key');
  suite.check('blank key never reaches the network', called === false);

  // ---- single call, no retry ----
  let calls = 0;
  await requestEnhance(baseArgs(prompt), {
    fetch: async () => {
      calls += 1;
      return jsonResponse(500, { error: 'boom' });
    },
  });
  suite.equal('a 500 is not retried', calls, 1);

  return suite.finish();
}

await runAsMain(import.meta.url, run);
