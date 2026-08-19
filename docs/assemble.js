// Deterministic prompt assembly.
//
// Plain ESM, no DOM, no dependencies: the web app and the node tests import the
// same module, so what the tests prove is what the page ships.
//
// grammar/presets.json is the single source of truth. This file only walks the
// template it finds there. Grammar changes belong in that file, never here.
//
// Two shapes come out of the same walk:
//   image modes  one flowing paragraph set, v1's model, unchanged
//   video modes  eight labelled blocks in grammar order, Seedance's shape
//
// Every piece of a prompt is a SEGMENT carrying who wrote it: `tool` for
// template text, chip clauses, scaffold lines and reference sentences, `user`
// for the subject and the action the visitor typed. Tests assert the tool
// invariants (no unresolved tokens, no ratio language, no @ with references
// off, English only) against tool segments alone, so a visitor who types a
// brace, a CJK sentence, an @ or a line that looks like a block label can
// neither break an invariant nor satisfy one.

const SUBJECT_TRAILING_PUNCTUATION = /[.,;:!?。，、；：！？]+$/;

/** Shared blocks the client owns end to end: never sent to a model, always re-appended by us. */
export const SCAFFOLD_BLOCKS = new Set([
  'VIDEO_ONER',
  'VIDEO_TEXT_SUPPRESSION',
  'VIDEO_LOCKDOWN_PERSON',
  'VIDEO_LOCKDOWN_PRODUCT',
  'VIDEO_LOCKDOWN_ENVIRONMENT',
]);

/** The four block bodies enhance is allowed to rewrite, and their JSON keys. */
export const MUTABLE_BLOCKS = {
  scene: 'scene',
  'subject-lock': 'subjectLock',
  movement: 'movement',
  'world-plate': 'worldPlate',
};

/** Emission order every video mode follows. */
export const VIDEO_BLOCK_ORDER = [
  'scene',
  'subject-lock',
  'movement',
  'last-frame',
  'world-plate',
  'sound-bed',
  'capture-realism',
  'camera-capture',
];

/**
 * Clean up raw textarea input before it enters a template slot.
 * Every mode follows the subject with its own punctuation, so a trailing stop
 * from the user would double up.
 */
export function normalizeSubject(raw) {
  if (typeof raw !== 'string') return '';
  const singleSpaced = raw.replace(/[^\S\n]+/g, ' ');
  const singleBreaks = singleSpaced.replace(/\n+/g, '\n');
  const lineTrimmed = singleBreaks
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
  return lineTrimmed.replace(SUBJECT_TRAILING_PUNCTUATION, '').trim();
}

/**
 * The action field lands mid-block with more sentences behind it, so the tool
 * owns the full stop that closes it. Same normalisation as the subject: the
 * words are the visitor's, the terminal punctuation is ours.
 */
export function normalizeAction(raw) {
  return normalizeSubject(raw);
}

/** Upper-cases the first character. A no-op on CJK, digits, and punctuation. */
export function capitalizeFirst(text) {
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

/**
 * True when the text emitted so far leaves the subject standing at the start of
 * a sentence. Scene mode drops the subject mid-sentence ("... of a woman in a
 * coat"), so this cannot just capitalize every time.
 */
export function startsSentence(precedingText) {
  if (!precedingText) return true;
  return /(?:[.!?]["')\]]?\s+|\n\s*)$/.test(precedingText);
}

export function getMode(presets, modeId) {
  const mode = presets.modes.find((candidate) => candidate.id === modeId);
  if (!mode) throw new Error(`Unknown mode: ${modeId}`);
  return mode;
}

export function isVideoMode(mode) {
  return mode.mediaType === 'video';
}

/** Every control group at its declared default. */
export function defaultSelections(mode) {
  const selections = {};
  for (const [controlId, group] of Object.entries(mode.controls || {})) {
    selections[controlId] = group.default;
  }
  return selections;
}

/** The register a mode starts on, or null for a mode with no register axis. */
export function defaultRegister(mode) {
  return mode.registers ? mode.registers.default : null;
}

function resolveOption(mode, controlId, selections) {
  const group = (mode.controls || {})[controlId];
  if (!group) throw new Error(`Mode ${mode.id} has no control: ${controlId}`);
  const wanted = selections && selections[controlId] ? selections[controlId] : group.default;
  const option = group.options.find((candidate) => candidate.id === wanted);
  if (!option) throw new Error(`Mode ${mode.id} control ${controlId} has no option: ${wanted}`);
  return option;
}

/** The template an image mode walks, honouring the register toggle when it has one. */
export function imageTemplate(mode, register) {
  if (!mode.registers) return mode.template;
  const wanted = register || mode.registers.default;
  const template = mode.registers.templates[wanted];
  if (!template) throw new Error(`Mode ${mode.id} has no register: ${wanted}`);
  return template;
}

/** The reference definitions currently switched on, in the registry's own order. */
export function activeRefs(mode, refs) {
  const wanted = new Set(refs || []);
  return (mode.refs || []).filter((ref) => wanted.has(ref.id));
}

/** Exact filenames the visitor has to attach, or an empty array when nothing is on. */
export function refFilenames(mode, refs) {
  return activeRefs(mode, refs).map((ref) => ref.filename);
}

function segment(kind, role, text) {
  return { kind, role, text };
}

/**
 * Walk one template array into segments.
 * `context` carries the subject and action already normalized, so the same walk
 * serves image modes (one list) and video blocks (one list per block).
 */
function walkTemplate(presets, mode, template, selections, context) {
  const segments = [];
  const emitted = () => segments.map((part) => part.text).join('');

  for (const part of template) {
    switch (part.type) {
      case 'text':
        segments.push(segment('tool', 'text', part.value));
        break;
      case 'subject': {
        const text = startsSentence(emitted())
          ? capitalizeFirst(context.subject)
          : context.subject;
        segments.push(segment('user', 'subject', text));
        break;
      }
      case 'action': {
        if (!context.action) {
          if (!mode.defaultAction) throw new Error(`Mode ${mode.id} has no defaultAction`);
          segments.push(segment('tool', 'action-default', mode.defaultAction));
          break;
        }
        const text = startsSentence(emitted()) ? capitalizeFirst(context.action) : context.action;
        segments.push(segment('user', 'action', text));
        segments.push(segment('tool', 'action-stop', '.'));
        break;
      }
      case 'control':
        // a control part may name which of its option's texts it wants; the
        // camera groups carry a `movement` prose line beside their gear clause
        segments.push(
          segment('tool', 'control', resolveOption(mode, part.control, selections)[part.field ?? 'clause'])
        );
        break;
      case 'block': {
        const block = presets.sharedBlocks[part.block];
        if (!block) throw new Error(`Unknown shared block: ${part.block}`);
        const role = SCAFFOLD_BLOCKS.has(part.block) ? 'scaffold' : 'block';
        segments.push(segment('tool', role, block));
        break;
      }
      case 'break':
        segments.push(segment('tool', 'break', '\n\n'));
        break;
      default:
        throw new Error(`Unknown template part type: ${part.type}`);
    }
  }
  return segments;
}

/**
 * Assemble one prompt into its parts.
 * Returns null when there is no usable subject, which is how the page knows to
 * disable Copy. An empty action is not that state: the mode's own defaultAction
 * clause fires instead.
 */
export function assembleParts(presets, modeId, state = {}) {
  const mode = getMode(presets, modeId);
  const subject = normalizeSubject(state.subject);
  if (!subject) return null;

  const context = { subject, action: normalizeAction(state.action) };
  const selections = state.selections;

  if (!isVideoMode(mode)) {
    const template = imageTemplate(mode, state.register);
    return {
      modeId: mode.id,
      mediaType: 'image',
      segments: walkTemplate(presets, mode, template, selections, context),
    };
  }

  const refs = activeRefs(mode, state.refs);
  const blocks = mode.blocks.map((block) => {
    const segments = walkTemplate(presets, mode, block.template, selections, context);
    for (const ref of refs) {
      for (const piece of ref.segments) {
        if (piece.block === block.id) segments.push(segment('tool', 'ref', piece.text));
      }
    }
    return { id: block.id, label: block.label, segments };
  });

  return { modeId: mode.id, mediaType: 'video', blocks };
}

/** Every segment of a parts object, blocks flattened, in emission order. */
export function allSegments(parts) {
  if (!parts) return [];
  if (parts.mediaType === 'video') return parts.blocks.flatMap((block) => block.segments);
  return parts.segments;
}

/** The text the tool wrote. Every tool invariant is asserted against this, never the whole prompt. */
export function toolText(parts) {
  return allSegments(parts)
    .filter((part) => part.kind === 'tool')
    .map((part) => part.text)
    .join('\n');
}

/** The text the visitor wrote, passed through verbatim. */
export function userText(parts) {
  return allSegments(parts)
    .filter((part) => part.kind === 'user')
    .map((part) => part.text)
    .join('\n');
}

export function blockContent(block) {
  return block.segments.map((part) => part.text).join('');
}

/** Blocks render as `Label: content`, one blank line between, no title line above. */
export function renderBlocks(blocks) {
  return blocks.map((block) => `${block.label}: ${blockContent(block)}`).join('\n\n');
}

export function renderParts(parts) {
  if (!parts) return null;
  if (parts.mediaType === 'video') return renderBlocks(parts.blocks);
  return parts.segments.map((part) => part.text).join('');
}

/**
 * Assemble one prompt.
 * Returns null when there is no usable subject, which is how the page knows to
 * disable Copy.
 */
export function assemble(presets, modeId, selections, subject, options = {}) {
  return renderParts(assembleParts(presets, modeId, { ...options, selections, subject }));
}

/* ---------- the enhance seam ---------- */

/**
 * Appending onto a body the client did not write: the piece brings its own
 * leading space when the grammar gave it one, otherwise we add exactly one.
 */
function joinAppend(base, text) {
  const trimmed = base.replace(/\s+$/, '');
  return /^\s/.test(text) ? trimmed + text : `${trimmed} ${text}`;
}

export function refSegmentsOf(block) {
  return block.segments.filter((part) => part.role === 'ref');
}

export function scaffoldSegmentsOf(block) {
  return block.segments.filter((part) => part.role === 'scaffold');
}

/**
 * The four bodies a model is allowed to rewrite, with the reference sentences
 * and the client's scaffold lines taken out. What is not in here never leaves
 * the browser, so it cannot come back altered.
 */
export function mutableBodies(parts) {
  const bodies = {};
  for (const block of parts.blocks) {
    const key = MUTABLE_BLOCKS[block.id];
    if (!key) continue;
    bodies[key] = block.segments
      .filter((part) => part.role !== 'ref' && part.role !== 'scaffold')
      .map((part) => part.text)
      .join('')
      .trim();
  }
  return bodies;
}

/**
 * Rebuild all eight blocks from a model's four bodies. The client owns
 * everything else: the reference sentences go back in from the deterministic
 * parts, the scaffold lines are appended, and the four locked blocks are the
 * deterministic ones untouched.
 */
export function rebuildBlocks(parts, bodies) {
  return parts.blocks.map((block) => {
    const key = MUTABLE_BLOCKS[block.id];
    if (!key) return block;

    const body = String(bodies[key]).trim();
    const segments = [{ kind: 'model', role: 'body', text: body }];
    let text = body;
    for (const piece of [...refSegmentsOf(block), ...scaffoldSegmentsOf(block)]) {
      text = joinAppend(text, piece.text);
      segments.push({ ...piece });
    }
    return { id: block.id, label: block.label, segments, text };
  });
}

/** Blocks straight out of rebuildBlocks carry their own joined text. */
export function renderRebuilt(blocks) {
  return blocks
    .map((block) => `${block.label}: ${block.text === undefined ? blockContent(block) : block.text}`)
    .join('\n\n');
}

/** Paragraph split for rendering. Never used for the copied text. */
export function toParagraphs(prompt) {
  if (!prompt) return [];
  return prompt.split('\n\n');
}
