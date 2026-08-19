# Prompt Director

A free, open prompt grammar and the tools to use it. Type a plain subject, get a prompt a working director would write: an image prompt for Nano Banana / Banana Pro, Midjourney, Flux, Imagen, Seedream, GPT Image and the like, or a Seedance video prompt for a product ad, a UGC testimonial, a story beat or a b-roll plate.

No account, no key, no backend. The web tool is a static page that assembles the prompt in your own browser.

## Why it exists

Most bad AI images are bad prompts. The fixes are not secret, they are just unevenly known: character references carry no lighting, aspect ratios belong in the generator's interface and never in the prompt, the closing realism block does more work than any adjective you can add, and mixing a scene's cinema language into a face plate quietly ruins every generation downstream of it.

This repo writes those rules down once and gives you three ways to use them.

## Three doors

### 1. The web tool

**MARCO_PAGES_URL**

Pick Image or Video, pick a mode, type a subject, copy the prompt. On video you also get a "what happens" box for the action across the clip, and tick boxes for the reference images you are attaching. Works on a phone. The interface speaks English and Cantonese (auto-detected from your browser, switchable in the header); the prompt itself always outputs in English. Optional: paste your own [OpenRouter](https://openrouter.ai) key to run an AI pass over your subject. The key stays in your browser, goes only to OpenRouter, and the plain prompt is never overwritten.

Running it locally:

```bash
git clone https://github.com/marcoaiwithfefe-hub/prompt-director.git
cd prompt-director/docs
python3 -m http.server 8000
# open http://localhost:8000
```

### 2. The Claude Code skill

```bash
git clone https://github.com/marcoaiwithfefe-hub/prompt-director.git ~/Code/prompt-director
ln -s ~/Code/prompt-director/skill/prompt-director ~/.claude/skills/prompt-director
```

Clone it somewhere permanent and symlink, because the skill reads the grammar by relative path (`../../grammar/`) and that path only resolves inside the repo. If you would rather copy than symlink, copy the whole repo and symlink from there, or point your agent at the clone directly.

Then ask for a face lock, an outfit sheet, a scene plate, a detail shot, a product still or an eight-second clip and it writes the prompt in the grammar. The skill and PROMPT.md carry more than the web form does: user-named reference tags, multi-subject Frame Maps, Cross-Frame Rules and multishot sequences with cuts.

### 3. The paste-anywhere system prompt

Open [PROMPT.md](PROMPT.md), copy everything below the divider, and paste it into ChatGPT, Gemini, Claude, or any chat model as a system prompt or custom instruction. It is fully self-contained: the mode tables, the ten rules, the video block grammar and every locked block are inlined, so the chat needs nothing from this repo.

## The grammar in one minute

Media first, then mode, and picking the right one is most of the craft.

| Image mode | Job | Closes with |
|------|-----|-------------|
| Face Lock | A new character's canonical face reference | Flat grade |
| Outfit Styling | First full-styling image of a character and outfit | Flat grade |
| Character Sheet | One 3-panel multi-angle reference image | Flat grade, stated per panel |
| Scene | A cinematic plate, with or without people | Cinema prose close |
| Detail | Tight face close-up, maximum skin fidelity | Detail fidelity, then the cinema stack |
| Product Shot | The product looks premium and real | Product stack, speculars intentional |
| 9:16 Ad | Vertical ad still with clean headline space | Its own close, or the phone-shot register |
| Poster | Composition-led key visual, negative space doing the work | Its own close |
| Outfit Replacement | Character from one reference into the outfit of another | Nothing, it stays lean |

Face Lock, Outfit Styling and Character Sheet are **reference builders**: their output feeds later generations, so they carry zero lighting information. Any shadow baked into a reference gets inherited and amplified downstream. Everything else is a **finished frame**, and those are the only modes where directional light lives. The three ad modes never render text: real type gets added afterwards in a design tool, so the composition reserves clean space for it.

| Video mode | Job | Camera energy |
|------|-----|---------------|
| Product Ad | The product looks premium in motion | Tripod push-in, slow orbit, locked-off, or pedestal rise |
| UGC | Fake phone-shot testimonial, person talks to camera | Handheld arm's length, or a propped phone |
| Narrative | A story moment, a character doing something | Handheld breath, follow, reverse or side track, dolly-in, or arc |
| Atmospheric | Location and mood only, no people | Locked-off, slow push-in, lateral drift, crane rise, or aerial pull-back |

A video prompt is not one sentence, it is eight labelled blocks: Scene & Mood, Subject Lock, Movement, Last Frame, World Plate, Sound Bed, Capture Realism, Camera Capture. Speeds go in km/h, atmosphere in % and metres, lenses in degrees of field of view, and the sound is diegetic only.

Read the full thing:

- [`grammar/modes.md`](grammar/modes.md) the eight image modes plus the outfit swap
- [`grammar/constraints.md`](grammar/constraints.md) the ten universal rules, reading reference images, the flat grade, the lens table
- [`grammar/cinema-stack.md`](grammar/cinema-stack.md) fighting the AI render aesthetic, the cinema prose close, night registers
- [`grammar/video-blocks.md`](grammar/video-blocks.md) the block grammar every video mode shares, the FOV ladder, Capture Realism
- [`grammar/video-modes.md`](grammar/video-modes.md) the four video modes and the camera moves each one offers
- [`grammar/presets.json`](grammar/presets.json) the machine registry every door reads from

## Repo layout

```
grammar/     the single source of truth, human docs plus presets.json
docs/        the web tool, served by GitHub Pages
skill/       the Claude Code skill wrapper
scripts/     presets sync (docs/presets.json plus the generated door sections)
test/        node tests, no framework, plus a Playwright smoke pass
PROMPT.md    the paste-anywhere system prompt
CONTEXT.md   glossary
```

Changing the grammar means changing `grammar/`, then:

```bash
node scripts/sync-presets.mjs      # web copy of the registry, plus the door sections
node test/run.mjs                  # assembly, hostile input, three-door parity, enhance
python3 test/smoke.py              # Playwright pass at 1440x900 and 390x844
```

The parity test is the one that matters. `PROMPT.md` and the skill each carry a generated shared-grammar section between HTML comment markers, and the test regenerates it from the registry and compares byte for byte, so a clause that ends up under the wrong mode fails instead of quietly passing a search. That drift is how a project like this normally rots.

## Credits

Built by Marco. If it saved you an afternoon, the follow is the payment:

- Instagram [@marcoaiwithfefe](https://instagram.com/marcoaiwithfefe)
- YouTube [@marcorefusestocode](https://youtube.com/@marcorefusestocode)

MIT licensed, see [LICENSE](LICENSE). Fork it, ship it, sell what you make with it. Keeping the credit line is a courtesy, not a licence term.
