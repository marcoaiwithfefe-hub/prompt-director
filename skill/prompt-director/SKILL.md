---
name: prompt-director
description: Write director-grade image prompts for Nano Banana / Banana Pro, Midjourney, Flux, Imagen, Seedream, GPT Image and similar models, and Seedance-class video prompts for product ads, UGC testimonials, narrative beats and atmospheric b-roll. Use whenever someone asks for an image or video prompt, a character reference, a face lock, outfit styling, a character sheet, a scene plate, a detail shot, an outfit replacement, a product shot, a vertical ad still, a poster, or a clip, and whenever they hand over a reference image and ask what to prompt with it.
---

# Prompt Director

Two media, one grammar. The grammar files next to this skill are the authority, not this file:

- `../../grammar/modes.md` — the eight image modes, what each is for, how each is structured, plus the Outfit Replacement bonus.
- `../../grammar/constraints.md` — the ten universal rules, how to read a reference image, and the locked flat-grade close with its lens table.
- `../../grammar/cinema-stack.md` — the realism stack, the cinema-prose close, and the night registers.
- `../../grammar/video-blocks.md` — the block grammar every video mode shares: write-the-visible, the eight-block order, the FOV ladder, Capture Realism, Sound Bed rules, runtime guidance.
- `../../grammar/video-modes.md` — the four video modes and the Camera Capture line each one locks.
- `../../grammar/presets.json` — the machine registry: every mode's template or blocks, its control options with the exact clause each emits, its reference segments, and the shared blocks.

Read the files you need before writing. Never paraphrase a closing block or a Capture Realism block from memory: copy it from `presets.json` or the markdown, word for word.

## Behaviours

### Image

**1. Face Lock.** A new character's canonical face reference. 3:4 headshot, forehead to upper chest. Identity only, wardrobe locked to the neutral black camisole or ribbed tank baseline. Closes with FLAT_GRADE.

**2. Outfit Styling.** First full-styling image of a character and outfit. Wardrobe described top to bottom, full body by default, weight on one hip, model face-card neutral. Closes with FLAT_GRADE.

**3. Character Sheet.** One horizontal frame, three vertical panels: headless front (ghost mannequin for structured necklines, clean neck cut for open ones), rear with head attached, tight chest-up identity lock. Identity and wardrobe described once and applied to all three. Closes with FLAT_GRADE plus FLAT_GRADE_SHEET_SUFFIX.

**4. Scene.** A cinematic plate, with or without people. Flowing prose in five movements, no labels, no coordinates, resolution-aware detail. Closes with CINEMA_PROSE_CLOSE.

**5. Detail.** Tight chest-up or face-only shot where skin fidelity is the point. Classical beauty lighting. Closes with DETAIL_FIDELITY then CINEMA_STACK.

**6. Product Shot.** The product is the only subject, off-centre with breathing room, on a studio seamless sweep or a real context surface. Speculars are intentional here: one clean specular line per reflective material. Closes with PRODUCT_STACK, or with PHONE_STILL_REGISTER in the phone-shot register.

**7. 9:16 Ad.** The frame is a layout: subject in the lower two-thirds, upper third stated as clean uncluttered background reserved for a headline added later. Cinema register or phone-shot register, never both. No rendered text.

**8. Poster.** One subject, one idea, one dramatic light decision, a dominant negative-space zone reserved for type, two or three colours each tied to a surface or a light source. No rendered text.

**Bonus: Outfit Replacement.** Two references, fixed order: first is the outfit and pose source, second is the character and identity source. Stays lean, no cinema block, no added styling. The recipe lives at the end of `modes.md`.

Face Lock, Outfit Styling and Character Sheet are reference builders and carry zero lighting information. Scene, Detail and the three ad modes are finished frames and are the only image modes where directional light belongs. Mixing the two closing families is the single most damaging mistake in this grammar.

### Video

Every video prompt is eight labelled blocks in this order, `Label: content`, one blank line between: Scene & Mood, Subject Lock, Movement, Last Frame, World Plate, Sound Bed, Capture Realism, Camera Capture. The four modes differ in what they lock, not in that shape.

**1. Product Ad.** Studio register. Subject Lock anchors the product: material, finish, scale cues, resting surface contact. Speculars are intentional (CAPTURE_REALISM_PRODUCT). Camera is tripod-mounted with a slow push-in.

**2. UGC.** The fake phone-shot testimonial: a person speaks to camera, usually holding the product. The register IS the credibility, so the lens is locked to a phone's main camera at 63° (28mm equivalent) and the framing choice is selfie-arm or propped-phone static. Found light only. The full skin-realism block stays: matte skin and real pore texture are exactly what makes fake UGC read real.

**3. Narrative.** The story shot, anywhere lived-in. The action carries the drama, written as observable behaviour. Movement layers all four registers: character, micro, environmental, and the camera implied by the capture line. Handheld with natural operator breath.

**4. Atmospheric.** The place is the subject: no people, no reference tags. Subject Lock becomes an environment lock. Movement is environmental only. Camera energy is a real choice here, the only mode where it is: locked-off static or an extremely slow push-in. Grade is palette-driven, every colour tied to a surface or a light source.

## Working rules

- **Pick the media, then the mode**, and say which one in one short line. If two are genuinely plausible, ask one question. If there is no subject, ask for a subject and nothing else.
- **Reference images**: read them per the extraction list in `constraints.md` (hair, makeup, wardrobe, jewelry and markers, pose and energy). Describe only what is visible. Invent nothing. When a reference is attached, write "carrying identically from the attached character reference" instead of re-describing the face, or anchor it with a tag on the video side.
- **Never write an aspect ratio into the prompt.** State the recommended ratio in a line after the block, per the mode's `recommendedRatio` in the registry.
- **Write the visible on video.** Emotion as muscle movement, speed in km/h, atmosphere in % density and metres of visibility, scale by stacking human heights, direction from the camera's point of view. If a word does not produce a visible pixel, cut it.
- **Positive phrasing**, with exactly four sanctioned exceptions: the text-suppression line closing Last Frame, the anti-plastic phrasings inside Capture Realism, the no-music line inside Sound Bed, and the no-internal-cuts half of the one-shot clause closing Movement.
- **Output is one fenced code block per prompt**, the finished prompt inside and nothing else. Several prompts means several blocks.
- Hold the ten universal rules in `constraints.md` on every prompt: no names, no brands, no age words, no ratios, no negative blocks outside the locked close, no meta-commentary, no teeth-showing smiles unless asked, no invention, photoreal by default, lean beats long.

## What the web form leaves to you

The builder at marcoaiwithfefe-hub.github.io/prompt-director emits single-subject, single-shot video prompts with fixed reference tags. Driving the grammar yourself you also have:

- **User-named element tags** (`@sol_ref`, `@berlin_plate`) instead of the form's fixed `@person_ref` / `@product_ref`. Declare each tag once, where the thing it names first appears. The reference carries identity and wardrobe; the prompt describes only the state change the reference cannot carry.
- **Frame Map**, a block before the Subject Locks naming each subject and where it sits, used whenever more than one subject shares the frame. One Subject Lock per named subject follows, in the Frame Map's order.
- **Cross-Frame Rules**, one block after the Subject Locks for anything that must hold across every subject and plane: shared light direction, shared weather, relative scale, occlusion order.
- **Multishot and cuts** for 12–15 second work: Movement splits into numbered beats with the cut named. Drop the one-shot clause when you do this, and only then.
- **Title-line delivery**: a video prompt written for a human to paste opens with one title line, a short shot name then the runtime in brackets (`Bottle hero turn [8s]`). The runtime in the title and the runtime closing Camera Capture must match. The web form emits no title line, which is why it carries the runtime only once.

## Acceptance examples

**"I need a face reference for a new character, Cantonese woman, shoulder-length dark brown hair."**
Image, Face Lock. One fenced block: the 3:4 headshot opener, her identity essentials, the black camisole baseline, the neutral pose sentence, then FLAT_GRADE verbatim. One line after: set 3:4 in your generator.

**"Here's her outfit base. Give me the character sheet."**
Image, Character Sheet. One fenced block: the three-panel opener, identity and wardrobe once, then LEFT (headless front, ghost mannequin because the top has a structured collar), CENTER (rear, head attached), RIGHT (tight chest-up), then FLAT_GRADE and FLAT_GRADE_SHEET_SUFFIX verbatim. No directional light anywhere. One line after: set 16:9.

**"Rooftop at night, city behind her, cinematic."**
Image, Scene. One question if no character reference exists yet, otherwise one fenced block: opening shot, character, world, focal anchor, then CINEMA_PROSE_CLOSE verbatim. Practicals drive the night, deep contrast, haze with volumetric body. No flat grade, no ratio in the body. One line after: set 21:9 or 16:9.

**"8 second clip of my serum bottle on marble, should look expensive."**
Video, Product Ad. One fenced block: title line with the runtime, then all eight blocks in order. Subject Lock anchors the bottle and closes with the product lock-down line, Movement states the turn and closes with the one-shot clause, Last Frame closes with the text-suppression line, Sound Bed opens `Diegetic only —`, Capture Realism is CAPTURE_REALISM_PRODUCT verbatim, Camera Capture carries 47° (50mm), the tripod push-in and 8s. One line after: set 9:16 or 16:9.

**"A customer talking about my supplement, like a real TikTok."**
Video, UGC. One fenced block: the phone-shot register throughout. Lens locked at 63° (28mm equivalent), framing selfie-arm or propped static, found room light, the full person Capture Realism block, 30fps. If they have a photo of the speaker, anchor it with a tag and stop describing the face. One line after: set 9:16.

## The machine grammar

Everything below is generated from `../../grammar/presets.json`. It is the exact wording of every mode: templates in emission order, the clause each chip emits, both register templates where a mode has them, the reference sentences and where they attach, each mode's default action, and every shared block verbatim. When this file's prose and this section disagree, this section wins.

<!-- BEGIN GENERATED shared-grammar -->
<!-- Generated from grammar/presets.json by scripts/sync-presets.mjs. Do not edit by hand. -->

Registry schema version 2. Every mode below, in emission order.

### Face Lock

- id face-lock
- media image
- target banana-image
- ratio «3:4»
- hint «new character's canonical face reference»
- locked note «Lighting and lens are locked by the grammar: reference plates carry zero lighting information.»

#### chips
- baselineWardrobe «Baseline top» default camisole
  - camisole «Black camisole» emits «She wears a plain black thin-strap camisole, no jewelry, no logos, no graphics.»
  - tank «Black ribbed tank» emits «He wears a plain black ribbed tank, no jewelry, no logos, no graphics.»

#### template
  - text «A clean cinema-character-reference 3:4 headshot, framed from forehead to upper chest with the face filling most of the frame. »
  - subject
  - text «. »
  - control baselineWardrobe
  - text « Body squared to camera, head level, neutral relaxed expression, eyes to camera, lips closed and relaxed, subtle controlled energy.»
  - paragraph break
  - block FLAT_GRADE

### Outfit Styling

- id outfit-styling
- media image
- target banana-image
- ratio «3:4 or 9:16»
- hint «full styling on a character, head to toe»
- locked note «Lighting and lens are locked by the grammar: reference plates carry zero lighting information.»

#### chips
- framing «Framing» default full-body
  - full-body «Full body» emits «Full body framing from head to just below the footwear.»
  - waist-up «Waist up» emits «Waist-up framing.»

#### template
  - subject
  - text «. Standing with weight shifted onto one hip, body angled about 20 degrees from camera, chin level, model face-card neutral expression with at most a slight closed-lip smirk, eyes to camera. »
  - control framing
  - paragraph break
  - block FLAT_GRADE

### Character Sheet

- id char-sheet
- media image
- target banana-image
- ratio «16:9»
- hint «3-panel multi-angle reference, one image»
- locked note «Layout, lighting, and lens are locked by the grammar. Panel structure is the product.»

#### chips
- headlessVariant «Neckline» default ghost
  - ghost «Structured (ghost mannequin)» emits «LEFT PANEL — full body front view, no head, no neck, and no hair. The body stands squared to camera from the shoulders down, arms relaxed at the sides, hands open and loose, weight even across both feet. Nothing rises above the shoulder line, and no hair falls across the chest or shoulders. The collar of the garment holds its own shape at the top of the garment and its opening is an empty dark hollow looking down into the inside of the garment, with the inner back of the fabric faintly visible inside the opening. The garment reads as if worn by an invisible body — full three-dimensional shape, natural drape, real fabric tension across the chest and shoulders, but nothing emerging from the neckline. No stump, no skin, no cut edge, no anatomy, no blood, no fade, no blur, no ghosting, no transparency in the body. The panel keeps full headroom, generous empty mid-gray backdrop above the shoulders, so the figure sits at the same scale and position in the frame as a normal full-body portrait.»
  - neck-cut «Open (clean neck cut)» emits «LEFT PANEL — full body front view, headless. The full figure stands squared to camera from the shoulders down, arms relaxed at the sides, hands open and loose, weight even across both feet. There is no head and no hair — no hair falls across the chest or shoulders. The neck rises a short way from the shoulders and terminates in a clean, flat, sharply defined horizontal edge at the base of the throat, exactly like a headless dress-form mannequin — a crisp sculptural cut with a clean visible edge, not blurred, not faded, not dissolving, no wisps, no smoke, no ghosting, no transparency, no blood, no anatomy detail at the cut. Above that clean edge there is only empty mid-gray backdrop. The panel keeps full headroom — generous empty space above the shoulders where the head would be — so the figure sits in the frame at the same scale and position as a normal full-body portrait.»

#### template
  - text «A three-panel character reference sheet composed as one horizontal frame, divided into three equal vertical panels side by side, thin clean separation between panels, the same figure and the same outfit rendered identically across all three. »
  - subject
  - text «. The identity and wardrobe described here apply identically to all three panels.»
  - paragraph break
  - control headlessVariant
  - paragraph break
  - text «CENTER PANEL — full body rear view, head attached. The same figure photographed from directly behind, standing straight, hair fall readable from behind, the garment back construction, hem, and footwear readable, arms relaxed at the sides, weight even across both feet.»
  - paragraph break
  - text «RIGHT PANEL — tight chest-up portrait, identity lock. The same figure framed from just above the top of the head down to the collarbones and the very top of the garment only, the face filling most of the panel, a true close-up. Body squared to camera, head level, eyes directly to camera, lips closed and relaxed, neutral controlled expression. Hair, brows, lashes, lip texture, and key identity markers all clearly readable at close range.»
  - paragraph break
  - block FLAT_GRADE
  - text « »
  - block FLAT_GRADE_SHEET_SUFFIX

### Scene

- id scene
- media image
- target banana-image
- ratio «21:9 or 16:9»
- hint «cinematic plate, with or without characters»

#### chips
- lighting «Light» default daylight
  - daylight «Natural daylight» emits «Natural daylight drives the frame — soft directional sun with real shadow wrap, light atmospheric haze giving the air physical body, distant planes softer and desaturated.»
  - golden «Golden hour» emits «Low warm golden-hour light rakes across the frame, long soft shadows, the horizon glow warm and dimensional, atmospheric haze catching the warmth between planes, cool ambient sky light wrapping the shadow sides.»
  - overcast «Overcast soft» emits «Soft overcast sky light, one enormous diffuse source overhead, gentle open shadows, muted contrast, atmospheric haze holding the deeper planes soft and desaturated.»
  - studio «Studio editorial» emits «Controlled studio lighting in an editorial register — a large soft key with deliberate falloff, clean fill, a subtle rim separating the subject from the set, the backdrop graded and intentional.»
  - night-open «Night — remote» emits «Night, remote and open — light comes exclusively from practical sources in the scene, headlights, brake lights, dash glow, a faint distant glow at the horizon. The sky and surroundings commit to deep crushed near-black darkness. Atmospheric haze catches the practical beams as visible warm volumetric cones. Everything outside the practical throws falls into deep near-black shadow, subjects reading as silhouettes with lit edges.»
  - night-urban «Night — urban» emits «Urban night driven by practicals — sodium-vapor lamps, fluorescents, neon signs, dash glow. A motivated teal-amber split where the sources justify it, deep cinematic contrast with shadows holding information, atmospheric haze giving every light volumetric body, subjects defined against the dark by rim light from the practicals.»
- framing «Framing» default medium
  - wide «Wide establishing» emits «held small in a wide establishing composition against the environment with generous lead room in the direction of movement, the space doing the storytelling»
  - medium «Medium hero» emits «in a medium hero composition anchored to one third of the frame, waist-up, the environment reading in soft depth behind»
  - close «Close intimate» emits «in a close intimate composition, shoulders-up, shallow depth folding the environment into soft bokeh»
  - low-hero «Low-angle hero» emits «in a low-angle hero composition, the camera slightly below the eye line, the sky or ceiling filling the upper frame behind»
  - ots «Over-the-shoulder» emits «in an over-the-shoulder composition, the back and shoulder filling the foreground, the focal anchor visible past them in the mid-ground»

#### template
  - text «A cinematic anamorphic still photograph captured on a real cinema set — »
  - subject
  - text «, »
  - control framing
  - text «.»
  - paragraph break
  - control lighting
  - paragraph break
  - block CINEMA_PROSE_CLOSE

### Detail

- id detail
- media image
- target banana-image
- ratio «4:5 or 1:1»
- hint «tight face close-up, maximum skin fidelity»

#### chips
- backdrop «Backdrop» default gray
  - gray «Gray seamless» emits «Mid-gray seamless studio background, even neutral mid-gray, no seam line, no gradient, no falloff to black or white.»
  - moody «Soft moody» emits «A soft moody studio backdrop falling away into gentle darkness behind the subject, deep and unobtrusive, the subject cleanly separated from it.»
- framing «Framing» default chest-up
  - chest-up «Chest up» emits «Chest-up portrait framing.»
  - shoulders-up «Shoulders up» emits «Shoulders-up portrait framing.»
  - face-only «Face only» emits «Face-only framing, forehead to collarbone.»

#### template
  - subject
  - text «. »
  - control backdrop
  - text « Classical beauty lighting — soft key from slightly above and camera-left at 35 degrees, soft fill at chest level from camera-right, subtle hair light behind defining the crown, soft underlight bounce lifting the eye sockets. »
  - control framing
  - paragraph break
  - block DETAIL_FIDELITY
  - paragraph break
  - block CINEMA_STACK

### Product Shot

- id product-shot
- media image
- target banana-image
- ratio «3:4 or 1:1»
- hint «your product looks premium and real»

#### chips
- surface «Surface» default seamless
  - seamless «Studio seamless» emits «set on a seamless studio sweep in a clean neutral color, a gentle floor reflection grounding it»
  - context «Real surface» emits «set on a real context surface — marble counter or warm wood table — with soft window-light geometry»

#### registers (default cinema, toggle «Phone-shot style»)

##### register cinema
  - text «A premium product photograph captured on a real cinema camera — »
  - subject
  - text « as the only subject, anchored slightly off-center with generous breathing room, »
  - control surface
  - text «. One large soft key shapes the form, a single clean specular line runs each reflective surface with controlled falloff, and the background stays quiet enough that nothing competes. »
  - block PRODUCT_STACK

##### register phone
  - text «A casual real-customer photo of »
  - subject
  - text «, »
  - control surface
  - text «. »
  - block PHONE_STILL_REGISTER

### 9:16 Ad

- id ad-916
- media image
- target banana-image
- ratio «9:16»
- hint «vertical ad still with clean headline space»

#### registers (default cinema, toggle «Phone-shot style»)

##### register cinema
  - text «A vertical ad photograph captured on a real cinema camera — »
  - subject
  - text « anchored in the lower two-thirds of the frame, editorial polish, one soft directional key with controlled falloff. The upper third of the frame is clean, even, uncluttered background with soft falloff, free of detail, reserved for a headline added later. No rendered text, no typography. Fine natural film grain, photographed not generated.»

##### register phone
  - text «A vertical phone-shot ad photo — »
  - subject
  - text « anchored in the lower two-thirds of the frame. The upper third stays clean, even, uncluttered background, free of detail, reserved for a headline added later. »
  - block PHONE_STILL_REGISTER

### Poster

- id poster
- media image
- target banana-image
- ratio «3:4 or 2:3»
- hint «composition-led key visual, negative space does the work»

#### chips
- lighting «Light» default side
  - side «Hard side light» emits «one hard side light carving the subject out of darkness, the shadow side falling clean away»
  - silhouette «Doorway silhouette» emits «the subject silhouetted against a bright doorway, edges burning, the interior falling into deep shadow»
  - pool «Overhead pool» emits «a single overhead pool of light isolating the subject, everything beyond its edge dissolving to black»

#### template
  - text «A poster key visual captured on a real cinema camera — one subject, one idea: »
  - subject
  - text « anchored on the right third of the frame, »
  - control lighting
  - text «. The remaining field holds clean deep negative space, even and empty, reserved for type added later. Two or three colors only, each tied to a surface or a light source. No rendered text, no typography. Fine natural film grain, photographed not generated.»

### Product Ad

- id video-product-ad
- media video
- target seedance
- ratio «9:16 or 16:9»
- hint «your product looks premium in motion»
- default action «The product performs a slow presentation turn, a single unhurried reveal across the runtime.»

#### chips
- runtime «Length» default 8s
  - 5s «Quick beat — 5s» emits «5s»
  - 8s «Standard — 8s» emits «8s»
  - 12s «Long hold — 12s» emits «12s»
- lens «Lens» default 47
  - 47 «Eye-level 47° (50mm)» emits «47° (50mm) eye-level neutral»
  - 29 «Compressed 29° (85mm)» emits «29° (75–85mm) portrait compression»
  - 12 «Macro detail 12° (200mm)» emits «12° (180–200mm) tele detail»
- surface «Surface» default seamless
  - seamless «Studio seamless» emits «a seamless studio sweep in a clean neutral color, a gentle floor reflection under the product»
  - context «Real surface» emits «a real context surface — marble counter or warm wood table — with soft window-light geometry»
- atmosphere «Air» default light
  - clear «Clear air» emits «clean clear air, full clarity through every plane»
  - light «Light haze» emits «light haze at 15% density, readable to 30 meters, the deeper planes softening»
  - heavy «Heavy atmosphere» emits «heavy suspended haze at 40% density, readable to 12 meters, the background dissolving soft»
- sound «Sound» default handling
  - room «Studio room tone» emits «quiet studio room tone, the soft presence of a treated space»
  - handling «Product handling» emits «the small precise sounds of the product being handled — glass set on stone, a cap turning, fabric brushing»
  - retail «Soft retail ambience» emits «soft retail ambience, distant murmur and footsteps on a polished floor»
- camera «Camera» default tripod LOCKED
  - why «The studio register locks the camera: tripod-mounted with a slow push-in.»
  - tripod «Tripod push-in» emits «tripod-mounted with a slow push-in»

#### blocks

##### scene «Scene & Mood»
  - text «A premium product moment — »
  - subject
  - text « presented as the single hero object, staged deliberate and confident.»

##### subject-lock «Subject Lock»
  - text «The product anchors the frame — true materials, finish, and proportions reading clean, its resting contact with the surface planted and stable. »
  - block VIDEO_LOCKDOWN_PRODUCT

##### movement «Movement»
  - action
  - text « Micro-motion stays honest — light shifting across the surfaces as the camera eases in; nothing else in the frame moves. »
  - block VIDEO_ONER

##### last-frame «Last Frame»
  - text «The product holds the final frame slightly off-center at its most flattering angle, highlight lines settled, surface and backdrop quiet. »
  - block VIDEO_TEXT_SUPPRESSION

##### world-plate «World Plate»
  - text «A controlled minimal set — »
  - control surface
  - text «, »
  - control atmosphere
  - text «.»

##### sound-bed «Sound Bed»
  - text «Diegetic only — »
  - control sound
  - text «, no music, no score, no lyrics.»

##### capture-realism «Capture Realism»
  - block CAPTURE_REALISM_PRODUCT

##### camera-capture «Camera Capture»
  - text «wide-latitude cinema capture, »
  - control lens
  - text « clean spherical character at a wide aperture — natural round bokeh, even sharpness — mild diffusion bloom, »
  - control camera
  - text «, saturated editorial grade, fine grain, warm-retained blacks, intentional highlight bloom on the product's reflective surfaces, 24fps 180° shutter, »
  - control runtime
  - text «.»

#### references
- product_ref tag @product_ref file product_ref «I have a product photo»
  - at end of subject-lock « Identity, label, and livery carry from @product_ref; the prompt stages the product, the reference carries what it is.»

### UGC

- id video-ugc
- media video
- target seedance
- ratio «9:16»
- hint «fake phone-shot testimonial, person talks to camera»
- default action «The speaker talks to camera with natural hand gestures, making one clear point across the runtime.»

#### chips
- runtime «Length» default 8s
  - 5s «Quick beat — 5s» emits «5s»
  - 8s «Standard — 8s» emits «8s»
  - 12s «Long hold — 12s» emits «12s»
- framing «Framing» default selfie
  - selfie «Selfie arm» emits «handheld at arm's length with natural hand sway»
  - propped «Propped phone» emits «phone propped static at counter height, zero operator movement»
- lens «Lens» default 63 LOCKED
  - why «The phone register locks the lens: a phone's main camera is a mild wide.»
  - 63 «Phone main lens 63° (28mm)» emits «63° (28mm equivalent) with mild wide-angle character»
- sound «Sound» default room
  - room «Quiet room» emits «quiet room tone under the voice, the small sounds of the space»
  - street «Street outside» emits «street ambience bleeding in under the voice — passing cars, distant voices»
  - cafe «Cafe» emits «cafe ambience under the voice — cups, low murmur, an espresso machine somewhere behind»

#### blocks

##### scene «Scene & Mood»
  - text «An honest phone-shot moment — »
  - subject
  - text « talking directly to camera, casual and unstaged.»

##### subject-lock «Subject Lock»
  - text «The speaker holds the frame chest-up, eyes to the lens, relaxed natural energy, a real gesture rhythm. »
  - block VIDEO_LOCKDOWN_PERSON

##### movement «Movement»
  - action
  - text « Micro-motion carries the realism — breath, blinks, small head tilts, the tiny natural instability of a real phone. »
  - block VIDEO_ONER

##### last-frame «Last Frame»
  - text «The speaker lands the final beat looking straight into the lens, a small natural smile settling. »
  - block VIDEO_TEXT_SUPPRESSION

##### world-plate «World Plate»
  - text «An ordinary real room in found light — window daylight or plain room light, the space readable but soft behind the speaker, thin everyday atmosphere.»

##### sound-bed «Sound Bed»
  - text «Diegetic only — the speaker's voice carries the clip, »
  - control sound
  - text «, no music, no score, no lyrics.»

##### capture-realism «Capture Realism»
  - block CAPTURE_REALISM_PERSON

##### camera-capture «Camera Capture»
  - text «smartphone main-lens capture, »
  - control lens
  - text «, »
  - control framing
  - text «, found room light, mild digital compression, natural saturation, 30fps, »
  - control runtime
  - text «.»

#### references
- person_ref tag @person_ref file person_ref «I have a photo of the speaker»
  - at end of subject-lock « Identity carries from @person_ref; the prompt only describes what the reference can't show.»
- product_ref tag @product_ref file product_ref «I have a product photo»
  - at end of movement « The product from @product_ref stays in hand, label turned toward the lens at the natural moments.»

### Narrative

- id video-narrative
- media video
- target seedance
- ratio «16:9 or 21:9»
- hint «a story moment, character doing something»
- default action «The subject walks a few steps and pauses, gaze shifting off-frame as the thought lands.»

#### chips
- runtime «Length» default 8s
  - 5s «Quick beat — 5s» emits «5s»
  - 8s «Standard — 8s» emits «8s»
  - 12s «Long hold — 12s» emits «12s»
- lens «Lens» default 47
  - 84 «Wide 84° (24mm)» emits «84° (20–24mm) wide»
  - 63 «Reportage 63° (35mm)» emits «63° (28–35mm) reportage wide»
  - 47 «Eye-level 47° (50mm)» emits «47° (40–50mm) eye-level neutral»
  - 29 «Portrait 29° (85mm)» emits «29° (75–85mm) portrait compression»
- atmosphere «Air» default light
  - clear «Clear air» emits «clean clear air, full clarity through every plane»
  - light «Light haze» emits «light haze at 15% density, readable to 30 meters, the deeper planes softening»
  - heavy «Heavy atmosphere» emits «heavy suspended haze at 40% density, readable to 12 meters, the background dissolving soft»
- sound «Sound» default street
  - interior «Interior ambient» emits «close interior ambience — room tone, small object sounds, fabric moving»
  - street «Street ambient» emits «street ambience — footsteps on pavement, passing traffic, air moving between buildings»
  - weather «Weather ambient» emits «weather carrying the scene — wind pressing, rain ticking on surfaces, distant thunder rolling»
- camera «Camera» default handheld LOCKED
  - why «The narrative register locks the camera: handheld with a lived-in operator presence.»
  - handheld «Handheld breath» emits «handheld with natural operator breath»

#### blocks

##### scene «Scene & Mood»
  - text «A lived-in dramatic moment — »
  - subject
  - text «, the drama carried entirely in observable action.»

##### subject-lock «Subject Lock»
  - text «The subject anchors the frame — body orientation, pose, and gaze pinned, contact points planted on real surfaces. »
  - block VIDEO_LOCKDOWN_PERSON

##### movement «Movement»
  - action
  - text « Micro-motion layers underneath — breath, hair, fabric responding. The environment keeps its own honest motion around the action. »
  - block VIDEO_ONER

##### last-frame «Last Frame»
  - text «The subject holds the closing composition, gaze landing where the story points, the frame settling still. »
  - block VIDEO_TEXT_SUPPRESSION

##### world-plate «World Plate»
  - text «A real lived-in location, its time of day and weather stated by what the light actually does, »
  - control atmosphere
  - text «.»

##### sound-bed «Sound Bed»
  - text «Diegetic only — »
  - control sound
  - text «, no music, no score, no lyrics.»

##### capture-realism «Capture Realism»
  - block CAPTURE_REALISM_PERSON

##### camera-capture «Camera Capture»
  - text «wide-latitude cinema capture, »
  - control lens
  - text « vintage 2x anamorphic character at a wide aperture — oval bokeh, soft frame-edge falloff — light diffusion bloom softening highlights, »
  - control camera
  - text «, color-negative daylight film rendition with fine 35mm grain, teal-amber grade, shallow depth of field, 24fps 180° shutter, »
  - control runtime
  - text «.»

#### references
- person_ref tag @person_ref file person_ref «I have a photo of the character»
  - at end of subject-lock « Identity carries from @person_ref; the prompt only describes what the reference can't show.»

### Atmospheric

- id video-atmospheric
- media video
- target seedance
- ratio «16:9 or 21:9»
- hint «location and mood only, no people — b-roll plates»
- default action «Environmental motion only — what the wind, water, and light do across the runtime; nothing is staged.»

#### chips
- runtime «Length» default 8s
  - 5s «Quick beat — 5s» emits «5s»
  - 8s «Standard — 8s» emits «8s»
  - 12s «Long hold — 12s» emits «12s»
- lens «Lens» default 84
  - 107 «Ultra-wide 107° (16mm)» emits «107° (14–16mm) architectural ultra-wide»
  - 84 «Wide 84° (24mm)» emits «84° (20–24mm) wide»
  - 29 «Compressed 29° (85mm)» emits «29° (75–85mm) portrait compression»
- energy «Camera» default static
  - static «Locked-off static» emits «locked-off static frame, zero operator drift, frame edges rock-steady»
  - push «Slow push-in» emits «an extremely slow push-in, barely perceptible across the runtime»
- timeofday «Time» default golden
  - dawn «Pre-dawn blue» emits «Pre-dawn blue hour, the sky barely lifting, practicals still burning»
  - golden «Golden hour» emits «Low golden-hour light raking long shadows across the surfaces»
  - overcast «Overcast midday» emits «Flat overcast midday, one enormous soft source overhead, muted contrast»
  - night «Night practicals» emits «Night driven by practical sources — sodium lamps, lit windows, signs — the dark still holding detail»
- atmosphere «Air» default light
  - clear «Clear air» emits «clean clear air, full clarity through every plane»
  - light «Light haze» emits «light haze at 15% density, readable to 30 meters, the deeper planes softening»
  - heavy «Heavy atmosphere» emits «heavy suspended haze at 40% density, readable to 12 meters, the background dissolving soft»
- sound «Sound» default wind
  - wind «Wind + distance» emits «wind moving through the space, distant traffic far below the frame»
  - rain «Rain on surfaces» emits «rain ticking on surfaces, water finding drains, the air washed clean»
  - hum «Interior hum» emits «room tone and low electrical hum, a building breathing»

#### blocks

##### scene «Scene & Mood»
  - text «The place is the subject — »
  - subject
  - text «, empty of people, holding its own mood.»

##### subject-lock «Subject Lock»
  - text «The environment locks as the single subject — its dominant element pinned in state, structure and scale readable. »
  - block VIDEO_LOCKDOWN_ENVIRONMENT

##### movement «Movement»
  - action
  - text « »
  - block VIDEO_ONER

##### last-frame «Last Frame»
  - text «The frame closes on the same composition it opened, the environmental motion mid-breath, negative space intact. »
  - block VIDEO_TEXT_SUPPRESSION

##### world-plate «World Plate»
  - control timeofday
  - text «, »
  - control atmosphere
  - text «.»

##### sound-bed «Sound Bed»
  - text «Diegetic only — »
  - control sound
  - text «, no music, no score, no lyrics.»

##### capture-realism «Capture Realism»
  - block CAPTURE_REALISM_ENVIRONMENT

##### camera-capture «Camera Capture»
  - text «wide-latitude cinema capture, »
  - control lens
  - text « vintage 2x anamorphic character at a wide aperture — oval bokeh, soft edge falloff — light diffusion bloom softening highlights, »
  - control energy
  - text «, color-negative film rendition with fine grain, palette-driven grade with every color tied to a surface or light source, atmospheric haze, weathered material detail, 24fps 180° shutter, »
  - control runtime
  - text «. The environment is the subject.»

### Shared blocks

Reproduce these word for word. Paraphrasing them is how prompts quietly get worse.

#### FLAT_GRADE

```
Background is an even 18% neutral gray seamless, completely flat — one single uniform value corner to corner, no seam line, no gradient, no hotspot, no vignette, no falloff to lighter or darker anywhere in the frame. Relight from scratch overriding any reference lighting: completely flat shadowless illumination — one enormous soft frontal source at camera position wrapping the subject evenly, matched equal fill from camera-left and camera-right at identical intensity, matched fill from above and below, so both sides of the face read at exactly the same brightness. No key-and-fill ratio, no modelling, no shadow side, no cheek triangle, no nose shadow, no under-chin shadow, no rim light, no hair light, no kicker, no specular hotspot. Zero shadow cast onto the background — the backdrop stays clean flat gray behind the entire figure. No contact shadow, no drop shadow, no ambient occlusion anywhere in the frame. Extremely low contrast, even, milky, catalogue-flat. Form is described by bone structure, hair strands, and fabric folds alone, not by light and shadow. Skin reads matte and velvety — zero shine on forehead, nose bridge, cheekbones, temples, and chin, no oily T-zone. Skin renders at its true natural skin tone and wardrobe at its true natural color, warmth preserved and natural against the neutral gray, never pale or washed-out or cool-shifted by the background. Real peach fuzz at the jaw and hairline, real soft fine even pore texture, subsurface scattering reading as semi-translucent biology, never plastic, never waxy AI render, never glass-skin, never harsh — fine flattering texture that keeps the face looking good, no acne, no blemishes, no rough pores. Photographed on a 50mm prime, even sharpness, soft natural film grain. Photographed not generated.
```

#### FLAT_GRADE_SHEET_SUFFIX

```
The identical flat gray value, the identical shadowless illumination, and zero cast shadow apply uniformly across every panel. Skin renders at its true natural skin tone, identical in value and hue across the face, arms, and body in every panel, never darkened, never tanned, never pale or washed-out or cool-shifted by the background. The wardrobe colors render true and consistent across all panels.
```

#### CINEMA_STACK

```
Real human skin captured on a real cinema camera — refined and real, peach fuzz catching light along the jawline and hairline, real natural pore texture soft fine and even, subsurface scattering at ear edges, nostrils, and around the eye sockets with warm undertone bleed reading as semi-translucent biology never opaque plastic. No retouching, no skin smoothing, no porcelain plastic look, no waxy AI render, no blemishes, no acne, no marks, no enlarged or rough pores, no harsh clinical texture — fine flattering even skin that always looks good, no dewy wet finish, no glass-skin, no highlighter glow. Hair rendered strand by strand with realistic flyaways and baby hairs at the hairline. Fabric with real weave detail, real weight, real drape. Captured with a wide-latitude cinema look on a clean fast normal prime around a 50mm full-frame field of view at a wide aperture, natural round bokeh, even sharpness. Highlights rolled off gently in a filmic curve, never clipping to pure white. Lifted blacks that stay open and never crush to pure black — wide dynamic range with full detail held in both shadows and highlights. Color-negative motion-picture film look baked in with fine theatrical 35mm film grain across the entire frame including skin, fabric, and backdrop. No HDR overprocessing, no digital oversharpening, no plastic skin rendering — photographed not generated, captured on a real camera by a real cinematographer on a real set.
```

#### CINEMA_PROSE_CLOSE

```
Captured with a wide-latitude cinema look and a vintage 55mm-equivalent 2x anamorphic character at a wide aperture, a light diffusion bloom softening the highlights, color-negative film rendition, in a cinematic narrative register. Real anamorphic optical character with oval bokeh on the deeper elements, subtle frame-edge falloff. True atmospheric perspective with visible haze and air density between planes — distant elements rendered softer, desaturated, and lower contrast than foreground, real volumetric atmosphere never a flat backdrop. Theatrical fine 35mm film grain across the entire frame. Shadows lifted gently never crushed, highlights rolled off softly never blown. Real photographic frame captured on a real cinema camera, real anamorphic lens, real fabric, real human subject, real atmosphere — no CGI, no rendered look, no digital cleanliness, no plastic surfaces, no AI smoothness, no skin smoothing, no glossy highlights.
```

#### DETAIL_FIDELITY

```
Extreme face fidelity. Real skin texture with visible pores, fine peach fuzz catching light along the jawline and upper lip, subtle subsurface scattering on the nose bridge cheeks and ears, micro-expression detail in the eyes and mouth corners, individual lash detail, real moisture and reflection in the iris with visible iris pattern, real lip texture with subtle natural lip lines, hair rendered strand by strand at the hairline with visible baby hairs and flyaways, fabric weave visible at the collar and shoulder.
```

#### PRODUCT_STACK

```
Materials render true — brushed metal reads brushed not plastic, glass carries real refraction and edge highlights, liquid holds weight and meniscus, matte surfaces stay matte while polished surfaces carry one controlled specular line each, never a blown white blob. Fine natural film grain, even sharpness across the product, real contact shadow grounding it on the surface. No rendered text, no typography, no invented label copy beyond what a reference carries. Photographed not generated.
```

#### PHONE_STILL_REGISTER

```
Shot in the smartphone main-lens register — mild wide-angle character, found window or room light, mild digital compression, natural saturation, the slightly imperfect framing of a real customer photo, soft handheld sharpness. No rendered text, no typography.
```

#### VIDEO_ONER

```
One uninterrupted shot, no internal cuts, the camera never breaks the take.
```

#### VIDEO_TEXT_SUPPRESSION

```
No on-screen text, no captions, no signage typography, no rendered text in the frame.
```

#### VIDEO_LOCKDOWN_PERSON

```
Face, hair, wardrobe, and silhouette stay identical throughout the runtime.
```

#### VIDEO_LOCKDOWN_PRODUCT

```
The product's shape, materials, label, and finish stay identical throughout the runtime.
```

#### VIDEO_LOCKDOWN_ENVIRONMENT

```
The environment's structure, weather, and light stay consistent throughout the runtime.
```

#### CAPTURE_REALISM_PERSON

```
The subject sits inside real depth — light atmosphere suspended in the air between camera, subject, and the far background, the background rendered softer, desaturated, and lower-contrast than the foreground so the figure sits within the air rather than pasted on a flat plane. Skin reads true cinematic matte — zero shine on forehead, nose bridge, cheekbones, temples, chin, and collarbones, real peach fuzz catching light at the jaw and hairline, real soft fine even pore texture, light absorbed like true subsurface scattering, warmth preserved and natural, never plastic, never doll-skin, never AI-rendered, and never harsh — no acne, no blemishes, no enlarged or rough pores, fine flattering texture that keeps the face looking good. Low-contrast curve — shadows lifted gently holding texture, highlights rolled off softly never clipping to white, nothing crushed to black. All specular highlights surgically removed from skin, hair, fabric, and surrounding surfaces, every pixel reading matte and diffuse. Slightly desaturated grade with warmth preserved.
```

#### CAPTURE_REALISM_PRODUCT

```
The product sits inside real depth — thin studio atmosphere between camera, product, and backdrop, the backdrop rendered softer and lower-contrast so the object holds the foreground plane. Speculars here are intentional and controlled — one clean highlight line per reflective material, chrome, glass, and liquid allowed to bloom softly, matte materials staying fully matte. Low-contrast curve — shadows lifted gently holding texture, highlights rolled off softly never clipping to white, nothing crushed to black. Saturated but never garish, warmth retained in the blacks.
```

#### CAPTURE_REALISM_ENVIRONMENT

```
The frame holds real depth — atmosphere suspended in the air between camera and the far planes, distance rendered softer, desaturated, and lower-contrast, weathered material detail reading true up close. Surfaces stay matte and diffuse — wet concrete, metal, and glass mute and deepen without a single blown specular. Low-contrast curve — shadows lifted gently holding texture, highlights rolled off softly never clipping to white, nothing crushed to black. Slightly desaturated grade with warmth preserved.
```
<!-- END GENERATED shared-grammar -->
