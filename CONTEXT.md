# Glossary

Words this repo uses in a specific way. If a discussion starts drifting, it is usually because two of these got mixed up.

**Grammar** — the rules that make a prompt read like a working director wrote it: which mode does what, the ten universal rules, the flat grade, the cinema stack. Lives in `grammar/`. The markdown files are the human truth, `grammar/presets.json` is the machine copy of the same thing. Everything else in the repo derives from those files, never the other way around.

**Mode** — one of the six jobs an image prompt can be doing: Face Lock, Outfit Styling, Character Sheet, Scene, Detail, Outfit Replacement. The mode decides the framing, the wardrobe rules, and which closing block the prompt ends with. Picking the wrong one is the most expensive mistake available here, because a reference plate with lighting baked in poisons every generation downstream of it.

**Preset** — one selectable option inside a mode, for example "Golden hour" under Scene's Light control, or "Ghost mannequin" under Character Sheet's Neckline control. A preset is a label a human picks; a clause is what it emits.

**Clause** — the exact sentence or paragraph a preset writes into the prompt. Clauses are stored in `presets.json` and copied verbatim. Assembly never rewords a clause, and neither should you: the wording is the product.

**Block** — a long locked paragraph shared across modes: `FLAT_GRADE`, `FLAT_GRADE_SHEET_SUFFIX`, `CINEMA_STACK`, `CINEMA_PROSE_CLOSE`, `DETAIL_FIDELITY`. Character modes close on the flat grade, finished frames close on the cinema family, and mixing the two families is the failure this repo's tests exist to catch.

**Door** — one of the three ways to use the grammar: the web tool in `docs/`, the Claude Code skill in `skill/`, and the paste-anywhere `PROMPT.md`. Three doors, one grammar. The parity test is what keeps them from drifting apart.

**Enhance** — the optional pass where the visitor's own OpenRouter key sends the assembled prompt to a model for a rewrite. It is strictly optional, it never overwrites the deterministic prompt, and no key of Marco's is involved anywhere.

**Flat grade** — the closing block that puts a character reference on an even 18% gray seamless with completely shadowless illumination and zero cast shadow. It exists because a reference plate is not a finished photo: any shadow in it gets inherited and amplified later, and fights whatever lighting the real scene wants.

**Assembly** — walking a mode's template in `presets.json` and joining its parts (text, subject, clause, block, paragraph break) into the finished prompt. Deterministic, no model involved, same inputs always give the same output. Implemented once in `docs/assemble.js` and shared by the page and the tests.
