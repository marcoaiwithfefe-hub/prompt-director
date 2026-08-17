// Optional "AI enhance" pass through OpenRouter, using the visitor's own key.
//
// Kept out of app.js on purpose: no DOM in here, so test/enhance.test.mjs can
// drive the whole request and failure matrix in node with a mocked fetch.
//
// Two hard rules this file exists to hold:
//   1. the key travels in the Authorization header and nowhere else, never a URL
//   2. a failure never touches the deterministic prompt, it only returns a code

export const ENHANCE_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const ENHANCE_MODEL = 'google/gemini-2.5-flash';
export const ENHANCE_TIMEOUT_MS = 30000;

export const ERROR_MESSAGES = {
  'missing-key': 'Paste your OpenRouter key first.',
  unauthorized: 'OpenRouter rejected that key. Check it at openrouter.ai/keys.',
  'rate-limited': 'OpenRouter is rate-limiting this key. Wait a moment, then try again.',
  server: 'OpenRouter had a server error. Your prompt below is untouched.',
  http: 'OpenRouter returned an unexpected response.',
  offline: 'Could not reach OpenRouter. Check your connection.',
  timeout: 'Enhance timed out after 30 seconds. Your prompt below is untouched.',
  malformed: 'OpenRouter replied in a shape this page could not read.',
  cancelled: 'Enhance cancelled.',
};

export function describeError(code, status) {
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.http;
  if (code === 'http' && status) return `${message} (HTTP ${status})`;
  return message;
}

function fail(code, status) {
  return { ok: false, code, status, message: describeError(code, status) };
}

/**
 * System message for one mode: the job, the ten universal rules in short form,
 * and the exact grammar this mode is allowed to speak, lifted from presets.json
 * so the enhance pass cannot drift from the deterministic path.
 */
export function buildSystemMessage(presets, mode, selections) {
  const clauses = [];
  for (const controlId of Object.keys(mode.controls || {})) {
    const group = mode.controls[controlId];
    const wanted = (selections && selections[controlId]) || group.default;
    const option = group.options.find((candidate) => candidate.id === wanted) || group.options[0];
    clauses.push(`${group.label}: ${option.clause}`);
  }

  const blocks = mode.template
    .filter((part) => part.type === 'block')
    .map((part) => `${part.block}:\n${presets.sharedBlocks[part.block]}`);

  return [
    'You are Prompt Director. You rewrite a plain subject into a director-grade image prompt.',
    `Mode: ${mode.label} (${mode.hint}).`,
    '',
    'Expand ONLY the subject description: heritage and build, skin tone and finish, hair colour and length and texture, eye shape and colour, wardrobe top to bottom, identity markers, pose and expression. Everything else in the prompt is locked grammar and must survive word for word.',
    '',
    'Rules: no character names, no brand names, no age words, no aspect ratios anywhere in the prompt, no negative-prompt blocks outside the locked closing block, no meta-commentary, no teeth-showing smiles unless the subject asks for one, invent nothing the subject did not imply, photoreal by default.',
    '',
    clauses.length ? `Locked clauses for this mode:\n${clauses.join('\n')}` : '',
    blocks.length ? `Locked closing blocks for this mode, reproduce verbatim:\n\n${blocks.join('\n\n')}` : '',
    '',
    'Return the finished prompt as plain text and nothing else. No preamble, no headings, no code fences, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildRequest({ presets, mode, selections, prompt, subject, apiKey }) {
  return {
    url: ENHANCE_ENDPOINT,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Prompt Director',
      },
      body: JSON.stringify({
        model: ENHANCE_MODEL,
        messages: [
          { role: 'system', content: buildSystemMessage(presets, mode, selections) },
          {
            role: 'user',
            content: `Raw subject from the user:\n${subject}\n\nDeterministic prompt to improve:\n${prompt}`,
          },
        ],
      }),
    },
  };
}

/**
 * One call, no retry. Returns { ok: true, text } or { ok: false, code, message }.
 * Pass options.controller to keep a handle for the cancel button.
 */
export async function requestEnhance(args, options = {}) {
  const fetchImpl = options.fetch || globalThis.fetch;
  const timeoutMs = options.timeoutMs === undefined ? ENHANCE_TIMEOUT_MS : options.timeoutMs;
  const startTimer = options.setTimeout || globalThis.setTimeout;
  const stopTimer = options.clearTimeout || globalThis.clearTimeout;

  if (!args.apiKey || !String(args.apiKey).trim()) return fail('missing-key');

  const controller = options.controller || new AbortController();
  let timedOut = false;
  const timer = startTimer(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response;
  try {
    const { url, init } = buildRequest(args);
    response = await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    stopTimer(timer);
    if (timedOut) return fail('timeout');
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) return fail('cancelled');
    return fail('offline');
  }
  stopTimer(timer);

  if (!response.ok) {
    const status = response.status;
    if (status === 401 || status === 403) return fail('unauthorized');
    if (status === 429) return fail('rate-limited');
    if (status >= 500) return fail('server');
    return fail('http', status);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return fail('malformed');
  }

  const choice = payload && payload.choices && payload.choices[0];
  const text = choice && choice.message && choice.message.content;
  if (typeof text !== 'string' || !text.trim()) return fail('malformed');
  return { ok: true, text: text.trim() };
}
