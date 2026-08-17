// Deterministic prompt assembly.
//
// Plain ESM, no DOM, no dependencies: the web app and the node tests import the
// same module, so what the tests prove is what the page ships.
//
// grammar/presets.json is the single source of truth. This file only walks the
// template it finds there. Grammar changes belong in that file, never here.

const SUBJECT_TRAILING_PUNCTUATION = /[.,;:!?。，、；：！？]+$/;

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

/** Every control group at its declared default. */
export function defaultSelections(mode) {
  const selections = {};
  for (const [controlId, group] of Object.entries(mode.controls || {})) {
    selections[controlId] = group.default;
  }
  return selections;
}

function resolveOption(mode, controlId, selections) {
  const group = (mode.controls || {})[controlId];
  if (!group) throw new Error(`Mode ${mode.id} has no control: ${controlId}`);
  const wanted = selections && selections[controlId] ? selections[controlId] : group.default;
  const option = group.options.find((candidate) => candidate.id === wanted);
  if (!option) throw new Error(`Mode ${mode.id} control ${controlId} has no option: ${wanted}`);
  return option;
}

/**
 * Assemble one prompt.
 * Returns null when there is no usable subject, which is how the page knows to
 * disable Copy.
 */
export function assemble(presets, modeId, selections, subject) {
  const mode = getMode(presets, modeId);
  const subjectText = normalizeSubject(subject);
  if (!subjectText) return null;

  const parts = [];
  for (const part of mode.template) {
    switch (part.type) {
      case 'text':
        parts.push(part.value);
        break;
      case 'subject':
        parts.push(startsSentence(parts.join('')) ? capitalizeFirst(subjectText) : subjectText);
        break;
      case 'control':
        parts.push(resolveOption(mode, part.control, selections).clause);
        break;
      case 'block': {
        const block = presets.sharedBlocks[part.block];
        if (!block) throw new Error(`Unknown shared block: ${part.block}`);
        parts.push(block);
        break;
      }
      case 'break':
        parts.push('\n\n');
        break;
      default:
        throw new Error(`Unknown template part type: ${part.type}`);
    }
  }
  return parts.join('');
}

/** Paragraph split for rendering. Never used for the copied text. */
export function toParagraphs(prompt) {
  if (!prompt) return [];
  return prompt.split('\n\n');
}
