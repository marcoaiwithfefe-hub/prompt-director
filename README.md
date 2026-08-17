# Prompt Director

A free, open image-prompt grammar and the tools to use it. Type a plain subject, get a prompt a working director would write, paste it into Nano Banana / Banana Pro, Midjourney, Flux, Imagen, Seedream, GPT Image, or whatever you generate with.

No account, no key, no backend. The web tool is a static page that assembles the prompt in your own browser.

## Why it exists

Most bad AI images are bad prompts. The fixes are not secret, they are just unevenly known: character references carry no lighting, aspect ratios belong in the generator's interface and never in the prompt, the closing realism block does more work than any adjective you can add, and mixing a scene's cinema language into a face plate quietly ruins every generation downstream of it.

This repo writes those rules down once and gives you three ways to use them.

## Three doors

### 1. The web tool

**MARCO_PAGES_URL**

Pick a mode, type a subject, copy the prompt. Works on a phone. Optional: paste your own [OpenRouter](https://openrouter.ai) key to run an AI pass over your subject. The key stays in your browser, goes only to OpenRouter, and the plain prompt is never overwritten.

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

Then ask for a face lock, an outfit sheet, a scene plate, or a detail shot and it writes the prompt in the grammar.

### 3. The paste-anywhere system prompt

Open [PROMPT.md](PROMPT.md), copy everything below the divider, and paste it into ChatGPT, Gemini, Claude, or any chat model as a system prompt or custom instruction. It is fully self-contained: the mode table, the ten rules, and the locked closing blocks are all inlined, so the chat needs nothing from this repo.

## The grammar in one minute

Six jobs, and picking the right one is most of the craft.

| Mode | Job | Closes with |
|------|-----|-------------|
| Face Lock | A new character's canonical face reference | Flat grade |
| Outfit Styling | First full-styling image of a character and outfit | Flat grade |
| Character Sheet | One 3-panel multi-angle reference image | Flat grade, stated per panel |
| Scene | A cinematic plate, with or without people | Cinema prose close |
| Detail | Tight face close-up, maximum skin fidelity | Detail fidelity, then the cinema stack |
| Outfit Replacement | Character from one reference into the outfit of another | Nothing, it stays lean |

Face Lock, Outfit Styling and Character Sheet are **reference builders**: their output feeds later generations, so they carry zero lighting information. Any shadow baked into a reference gets inherited and amplified downstream. Scene and Detail are **finished frames** and are the only modes where directional light lives.

Read the full thing:

- [`grammar/modes.md`](grammar/modes.md) the five modes plus the outfit swap
- [`grammar/constraints.md`](grammar/constraints.md) the ten universal rules, reading reference images, the flat grade, the lens table
- [`grammar/cinema-stack.md`](grammar/cinema-stack.md) fighting the AI render aesthetic, the cinema prose close, night registers
- [`grammar/presets.json`](grammar/presets.json) the machine registry every door reads from

## Repo layout

```
grammar/     the single source of truth, human docs plus presets.json
docs/        the web tool, served by GitHub Pages
skill/       the Claude Code skill wrapper
scripts/     presets sync (grammar/presets.json -> docs/presets.json)
test/        node tests, no framework, plus a Playwright smoke pass
PROMPT.md    the paste-anywhere system prompt
CONTEXT.md   glossary
```

Changing the grammar means changing `grammar/`, then:

```bash
node scripts/sync-presets.mjs      # push presets.json to the web copy
node test/run.mjs                  # assembly, hostile input, three-door parity, enhance
python3 test/smoke.py              # Playwright pass at 1440x900 and 390x844
```

The parity test is the one that matters: it fails if `PROMPT.md` and the preset registry ever drift apart, which is how a project like this normally rots.

## Credits

Built by Marco. If it saved you an afternoon, the follow is the payment:

- Instagram [@marcoaiwithfefe](https://instagram.com/marcoaiwithfefe)
- YouTube [@marcorefusestocode](https://youtube.com/@marcorefusestocode)

MIT licensed, see [LICENSE](LICENSE). Fork it, ship it, sell what you make with it. Keeping the credit line is a courtesy, not a licence term.
