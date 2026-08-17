---
name: prompt-director
description: Write director-grade image prompts for Nano Banana / Banana Pro, Midjourney, Flux, Imagen, Seedream, GPT Image and similar models. Use whenever someone asks for an image prompt, a character reference, a face lock, outfit styling, a character sheet, a scene plate, a detail shot, or an outfit replacement, and whenever they hand over a reference image and ask what to prompt with it.
---

# Prompt Director

Six jobs, one grammar. The grammar files next to this skill are the authority, not this file:

- `../../grammar/modes.md` — the five modes, what each is for, how each is structured, plus the Outfit Replacement bonus.
- `../../grammar/constraints.md` — the ten universal rules, how to read a reference image, and the locked flat-grade close with its lens table.
- `../../grammar/cinema-stack.md` — the realism stack, the cinema-prose close, and the night registers.
- `../../grammar/presets.json` — the machine registry: every mode's template, its control options with the exact clause each emits, and the shared closing blocks.

Read the files you need before writing. Never paraphrase a closing block from memory: copy it from `presets.json` or the markdown, word for word.

## Behaviours

**1. Face Lock.** A new character's canonical face reference. 3:4 headshot, forehead to upper chest. Identity only, wardrobe locked to the neutral black camisole or ribbed tank baseline. Closes with FLAT_GRADE.

**2. Outfit Styling.** First full-styling image of a character and outfit. Wardrobe described top to bottom, full body by default, weight on one hip, model face-card neutral. Closes with FLAT_GRADE.

**3. Character Sheet.** One horizontal frame, three vertical panels: headless front (ghost mannequin for structured necklines, clean neck cut for open ones), rear with head attached, tight chest-up identity lock. Identity and wardrobe described once and applied to all three. Closes with FLAT_GRADE plus FLAT_GRADE_SHEET_SUFFIX.

**4. Scene.** A cinematic plate, with or without people. Flowing prose in five movements, no labels, no coordinates, resolution-aware detail. Closes with CINEMA_PROSE_CLOSE.

**5. Detail.** Tight chest-up or face-only shot where skin fidelity is the point. Classical beauty lighting. Closes with DETAIL_FIDELITY then CINEMA_STACK.

**6. Outfit Replacement.** Two references, fixed order: first is the outfit and pose source, second is the character and identity source. Stays lean, no cinema block, no added styling. The recipe lives at the end of `modes.md`.

Face Lock, Outfit Styling and Character Sheet are reference builders and carry zero lighting information. Scene and Detail are finished frames and are the only modes where directional light belongs. Mixing the two closing families is the single most damaging mistake in this grammar.

## Working rules

- **Pick the mode first**, and say which one in one short line. If two are genuinely plausible, ask one question. If there is no subject, ask for a subject and nothing else.
- **Reference images**: read them per the extraction list in `constraints.md` (hair, makeup, wardrobe, jewelry and markers, pose and energy). Describe only what is visible. Invent nothing. When a reference is attached, write "carrying identically from the attached character reference" instead of re-describing the face.
- **Never write an aspect ratio into the prompt.** State the recommended ratio in a line after the block: Face Lock 3:4, Outfit Styling 3:4 or 9:16, Character Sheet 16:9, Scene 21:9 or 16:9, Detail 4:5 or 1:1.
- **Output is one fenced code block per prompt**, the finished prompt inside and nothing else. Several prompts means several blocks.
- Hold the ten universal rules in `constraints.md` on every prompt: no names, no brands, no age words, no ratios, no negative blocks outside the locked close, no meta-commentary, no teeth-showing smiles unless asked, no invention, photoreal by default, lean beats long.

## Acceptance examples

**"I need a face reference for a new character, Cantonese woman, shoulder-length dark brown hair."**
Face Lock. One fenced block: the 3:4 headshot opener, her identity essentials, the black camisole baseline, the neutral pose sentence, then FLAT_GRADE verbatim. One line after: set 3:4 in your generator.

**"Here's her outfit base. Give me the character sheet."**
Character Sheet. One fenced block: the three-panel opener, identity and wardrobe once, then LEFT (headless front, ghost mannequin because the top has a structured collar), CENTER (rear, head attached), RIGHT (tight chest-up), then FLAT_GRADE and FLAT_GRADE_SHEET_SUFFIX verbatim. No directional light anywhere. One line after: set 16:9.

**"Rooftop at night, city behind her, cinematic."**
Scene. One question if no character reference exists yet, otherwise one fenced block: opening shot, character, world, focal anchor, then CINEMA_PROSE_CLOSE verbatim. Practicals drive the night, deep contrast, haze with volumetric body. No flat grade, no ratio in the body. One line after: set 21:9 or 16:9.
