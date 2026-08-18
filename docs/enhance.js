// Optional "AI enhance" pass through OpenRouter, using the visitor's own key.
//
// Kept out of app.js on purpose: no DOM in here, so test/enhance.test.mjs and
// test/enhance-video.test.mjs can drive the whole request and failure matrix in
// node with a mocked fetch.
//
// Three hard rules this file exists to hold:
//   1. the key travels in the Authorization header and nowhere else, never a URL
//   2. a failure never touches the deterministic prompt, it only returns a code
//   3. on the video path the model is handed four block bodies and answers with
//      four JSON strings. It never sees a locked block, a reference sentence or
//      a scaffold line, so it cannot lose one: the client rebuilds all eight
//      blocks around its answer.

import { MUTABLE_BLOCKS, mutableBodies, rebuildBlocks, renderRebuilt } from './assemble.js';

export const ENHANCE_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const ENHANCE_MODEL = 'google/gemini-2.5-flash';
export const ENHANCE_TIMEOUT_MS = 30000;

/** The only keys a video reply may carry, in the order the blocks come. */
export const VIDEO_RESPONSE_KEYS = Object.values(MUTABLE_BLOCKS);

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
  'bad-json': 'The model did not answer in the JSON shape this page asked for. Your prompt is untouched.',
  'bad-keys': 'The model answered with the wrong set of blocks. Your prompt is untouched.',
  'empty-value': 'The model left one of the four blocks empty. Your prompt is untouched.',
  'off-contract': 'The model wrote something this grammar does not allow. Your prompt is untouched.',
  stale: 'Your settings changed while that ran, so the reply was dropped.',
};

export function describeError(code, status) {
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.http;
  if (code === 'http' && status) return `${message} (HTTP ${status})`;
  return message;
}

function fail(code, status, detail) {
  return { ok: false, code, status, detail, message: describeError(code, status) };
}

/** Chip clauses currently selected, as `Group: clause` lines. */
function selectedClauses(mode, selections) {
  const clauses = [];
  for (const controlId of Object.keys(mode.controls || {})) {
    const group = mode.controls[controlId];
    const wanted = (selections && selections[controlId]) || group.default;
    const option = group.options.find((candidate) => candidate.id === wanted) || group.options[0];
    clauses.push(`${group.label}: ${option.clause}`);
  }
  return clauses;
}

/**
 * System message for one image mode: the job, the ten universal rules in short
 * form, and the exact grammar this mode is allowed to speak, lifted from
 * presets.json so the enhance pass cannot drift from the deterministic path.
 */
export function buildSystemMessage(presets, mode, selections) {
  const clauses = selectedClauses(mode, selections);
  const template = mode.registers ? mode.registers.templates[mode.registers.default] : mode.template;
  const blocks = (template || [])
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

/**
 * System message for one video mode. The job here is choreography, not grammar:
 * translate the plain description into what a camera can see, inside four
 * bodies, returned as JSON so a body containing the word "Movement:" can never
 * be mistaken for a block label.
 */
export function buildVideoSystemMessage(presets, mode, selections) {
  const clauses = selectedClauses(mode, selections);

  return [
    'You are Prompt Director. You rewrite four blocks of a Seedance video prompt so a video model can render them.',
    `Mode: ${mode.label} (${mode.hint}).`,
    '',
    'Write the visible. A video model renders what it can see and count, so translate every abstraction into physical action, a measured value, or a specific object: emotion as muscle movement (jaw sets, breath quickens), speed in km/h, atmosphere in % density and metres of visibility, scale by stacking human heights, direction from the camera point of view.',
    '',
    'State what happens, never what should not happen. One dominant action, one camera strategy, one lighting motivation. No platform names, no character names, no meta-commentary, no aspect ratios.',
    '',
    'This is one uninterrupted shot. Never write cuts, jump cuts, cross-fades, montages, numbered shots or timed beats. Sound is diegetic only: never name music, a score, a soundtrack, a song or lyrics.',
    '',
    clauses.length ? `Locked clauses for this mode, already decided by the visitor:\n${clauses.join('\n')}` : '',
    '',
    `Answer with a single JSON object and nothing else: no preamble, no code fences, no commentary. It has exactly these four keys, each a non-empty string: ${VIDEO_RESPONSE_KEYS.join(', ')}. Each value is the body of that block only. Do not write the block label into the value. Do not use { or } inside a value.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildVideoUserMessage({ subject, action, bodies }) {
  return [
    `Raw subject from the user:\n${subject}`,
    `What happens across the runtime:\n${action}`,
    '',
    'The four block bodies to rewrite:',
    JSON.stringify(bodies, null, 2),
  ].join('\n');
}

function post(apiKey, messages) {
  return {
    url: ENHANCE_ENDPOINT,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Prompt Director',
      },
      body: JSON.stringify({ model: ENHANCE_MODEL, messages }),
    },
  };
}

export function buildRequest({ presets, mode, selections, prompt, subject, apiKey, parts, action }) {
  if (mode.mediaType === 'video') {
    const bodies = mutableBodies(parts);
    return post(apiKey, [
      { role: 'system', content: buildVideoSystemMessage(presets, mode, selections) },
      { role: 'user', content: buildVideoUserMessage({ subject, action, bodies }) },
    ]);
  }

  return post(apiKey, [
    { role: 'system', content: buildSystemMessage(presets, mode, selections) },
    {
      role: 'user',
      content: `Raw subject from the user:\n${subject}\n\nDeterministic prompt to improve:\n${prompt}`,
    },
  ]);
}

/* ---------- the video reply contract ---------- */

const FENCE = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/;

/** Everything the four bodies are not allowed to say, and the word for why. */
const OFF_CONTRACT = [
  ['cut', /\b(?:cuts?\s+to|hard\s+cuts?|jump\s+cuts?|smash\s+cuts?|match\s+cuts?|cross[\s-]?fades?|montages?|multishot|shot\s+\d|beat\s+\d)\b/i],
  ['music', /\b(?:music|musical|score|scored|soundtrack|song|songs|lyric|lyrics|melody|orchestral|theme\s+tune)\b/i],
  ['brace', /[{}]/],
];

const LABEL_PREFIX = /^[ \t]*(?:Scene\s*&\s*Mood|Subject\s+Lock|Movement|Last\s+Frame|World\s+Plate|Sound\s+Bed|Capture\s+Realism|Camera\s+Capture)[ \t]*:/im;

/**
 * Parse one reply into the four bodies, or a code saying which way it broke.
 * A fenced block is unwrapped first: models do that even when told not to, and
 * it is not the visitor's problem.
 */
export function parseVideoPayload(text) {
  const fenced = FENCE.exec(String(text || ''));
  const raw = fenced ? fenced[1] : String(text || '');

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, code: 'bad-json' };
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, code: 'bad-json' };
  }

  const keys = Object.keys(payload);
  const wanted = [...VIDEO_RESPONSE_KEYS].sort().join(',');
  if (keys.length !== VIDEO_RESPONSE_KEYS.length || [...keys].sort().join(',') !== wanted) {
    return { ok: false, code: 'bad-keys' };
  }

  // JSON.parse quietly keeps the last of two identical keys, so a reply that
  // answered twice would look clean here. Count them in the raw text instead.
  for (const name of VIDEO_RESPONSE_KEYS) {
    const occurrences = raw.match(new RegExp(`[{,]\\s*"${name}"\\s*:`, 'g')) || [];
    if (occurrences.length !== 1) return { ok: false, code: 'bad-keys' };
  }

  const bodies = {};
  for (const key of VIDEO_RESPONSE_KEYS) {
    const value = payload[key];
    if (typeof value !== 'string' || !value.trim()) return { ok: false, code: 'empty-value' };
    bodies[key] = value.trim();
  }
  return { ok: true, bodies };
}

/** Returns the reason a body is off-contract, or null when all four are clean. */
export function scanOffContract(bodies) {
  for (const key of VIDEO_RESPONSE_KEYS) {
    const value = bodies[key];
    for (const [reason, pattern] of OFF_CONTRACT) {
      if (pattern.test(value)) return { key, reason };
    }
    if (LABEL_PREFIX.test(value)) return { key, reason: 'label' };
  }
  return null;
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

/**
 * The video path end to end: ask, parse, refuse anything off-contract, then
 * rebuild the eight blocks around the four bodies that came back.
 * `args.generation` is carried through untouched so the caller can drop a reply
 * that belongs to settings the visitor has already moved on from.
 */
export async function enhanceVideo(args, options = {}) {
  const answer = await requestEnhance(args, options);
  if (!answer.ok) return { ...answer, generation: args.generation };

  const parsed = parseVideoPayload(answer.text);
  if (!parsed.ok) return { ...fail(parsed.code), generation: args.generation };

  const offContract = scanOffContract(parsed.bodies);
  if (offContract) {
    return { ...fail('off-contract', undefined, offContract), generation: args.generation };
  }

  const blocks = rebuildBlocks(args.parts, parsed.bodies);
  return {
    ok: true,
    text: renderRebuilt(blocks),
    bodies: parsed.bodies,
    blocks,
    generation: args.generation,
  };
}
