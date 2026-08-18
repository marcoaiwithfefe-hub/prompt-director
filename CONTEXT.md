# Glossary

Words this repo uses in a specific way. If a discussion starts drifting, it is usually because two of these got mixed up.

**Grammar** — the rules that make a prompt read like a working director wrote it: which mode does what, the ten universal rules, the flat grade, the cinema stack, the video block order. Lives in `grammar/`. The markdown files are the human truth, `grammar/presets.json` is the machine copy of the same thing. Everything else in the repo derives from those files, never the other way around.

**Media** — image or video. Not a preference, a different document: an image prompt is one flowing description, a video prompt is eight labelled blocks aimed at a different family of models. The web tool's Image/Video toggle is also the target picker, which is why `targetModel` in the registry names a prompt DIALECT (`banana-image`, `seedance`) and not a product.

**Mode** — one of the twelve jobs a prompt can be doing. Image: Face Lock, Outfit Styling, Character Sheet, Scene, Detail, Product Shot, 9:16 Ad, Poster (plus Outfit Replacement, which lives in the doors only). Video: Product Ad, UGC, Narrative, Atmospheric. The mode decides the framing, the wardrobe rules, and which closing block or camera line the prompt ends with. Picking the wrong one is the most expensive mistake available here, because a reference plate with lighting baked in poisons every generation downstream of it.

**Preset** — one selectable option inside a mode, for example "Golden hour" under Scene's Light control, or "Ghost mannequin" under Character Sheet's Neckline control. A preset is a label a human picks; a clause is what it emits.

**Clause** — the exact sentence or paragraph a preset writes into the prompt. Clauses are stored in `presets.json` and copied verbatim. Assembly never rewords a clause, and neither should you: the wording is the product.

**Block** — two meanings, kept apart on purpose. A SHARED block is a long locked paragraph reused across modes: `FLAT_GRADE`, `CINEMA_STACK`, `CAPTURE_REALISM_PERSON`, `VIDEO_ONER` and the rest. A VIDEO block is one of the eight labelled sections a video prompt is made of, in fixed order: Scene & Mood, Subject Lock, Movement, Last Frame, World Plate, Sound Bed, Capture Realism, Camera Capture. A video block's content is often built partly from shared blocks. Character modes close on the flat grade, finished frames close on the cinema family, and mixing the two families is the failure this repo's tests exist to catch.

**Segment** — the smallest piece of an assembled prompt, carrying who wrote it. A `tool` segment is template text, a chip clause, a scaffold line or a reference sentence. A `user` segment is the subject or the action, passed through verbatim. Every invariant the tool owes the reader (no unresolved tokens, no ratio language, no `@` with the reference boxes off, English only) is asserted against tool segments alone, so a visitor typing a brace or a Cantonese sentence can neither break one nor satisfy one.

**Scaffold** — the client-owned lines a prompt is never allowed to ship without: the one-shot clause closing Movement, the lock-down line closing Subject Lock, the text-suppression line closing Last Frame, the diegetic-only opening of Sound Bed. They are appended by the client on both the deterministic path and the enhanced one, which is why enhance cannot lose them: they are never sent.

**Register** — a complete alternative wording for a mode, picked by a toggle rather than by a chip. Product Shot and 9:16 Ad each carry a `cinema` and a `phone` register. A register swaps the whole template, not a clause, and assembly is a pure function of state, so switching back restores the previous output byte for byte.

**Reference** — a picture the visitor attaches in their own generator, anchored in the prompt by a tag (`@product_ref`, `@person_ref`). In the web form a reference is a checkbox and its sentences are conditional tool segments at the end of a declared block; there are no slots to fill and no error path. The doors go further and let you name your own tags.

**Door** — one of the three ways to use the grammar: the web tool in `docs/`, the Claude Code skill in `skill/`, and the paste-anywhere `PROMPT.md`. Three doors, one grammar. The two LLM doors each carry a GENERATED shared-grammar section between HTML comment markers, written by `scripts/sync-presets.mjs` and byte-compared by the parity test. That section is a manifest, not a sample: a clause filed under the wrong mode fails it, where a plain search for the clause would not.

**Enhance** — the optional pass where the visitor's own OpenRouter key sends the assembled prompt to a model for a rewrite. It is strictly optional, it never overwrites the deterministic prompt, and no key of Marco's is involved anywhere.

**Flat grade** — the closing block that puts a character reference on an even 18% gray seamless with completely shadowless illumination and zero cast shadow. It exists because a reference plate is not a finished photo: any shadow in it gets inherited and amplified later, and fights whatever lighting the real scene wants.

**Assembly** — walking a mode's template in `presets.json` and joining its parts (text, subject, action, clause, block, paragraph break) into the finished prompt. Deterministic, no model involved, same inputs always give the same output. Implemented once in `docs/assemble.js` and shared by the page and the tests. The page never stores the prompt: state lives in `docs/state.js` and the prompt is recomputed after every change, so a restored mode recomputes rather than redisplaying.

**Generation id** — one string standing for every input that can change the prompt. Enhance stamps its request with it, and a reply whose id no longer matches the current state is dropped without a word, because it answers a question nobody is asking any more.
