# Anatomy of a Video Prompt

A competent Seedance prompt is a production document, not a beautiful sentence. It answers, in order: what is the moment, who is in frame, what moves, what the final frame looks like, where we are, what it sounds like, and what physics keep it from looking like AI. This file is the block grammar every video mode shares. The modes themselves live in `video-modes.md`.

## Write the visible

A video model is a physics engine, not a mood board. It renders what it can see and count. Mood words evaporate. Convert every abstraction into a physical action, a measurable value, or a specific object.

- ❌ "she looks stressed" → ✅ "shoulders lift, jaw locks, exhales through the nose, eyes fix on the door"
- ❌ "the alley feels dangerous" → ✅ "only light source is one buzzing sodium bulb 30 meters back, wet brick, standing water, no other figures visible"
- ❌ "fast" → ✅ a number: "carves through traffic at 110 km/h"

Measurables the model actually reads:

- **Speed** in km/h. Never "fast," "slow," "quick."
- **Atmosphere** in % density and meter visibility: "haze 30%, readable to 40 meters." Never "light fog."
- **Scale** by stacking humans: "as tall as three humans standing on each other's shoulders." Never "huge."
- **Direction** always from the camera's point of view: "moves screen-left."
- **Emotion** rendered in muscle: jaw sets, breath quickens, knuckles blanch. Never a bare feeling word.

Read the prompt back as if watching the shot. If a word doesn't produce a visible pixel, cut it.

## Positive phrasing

State what happens, not what shouldn't. Negative language weakens the signal: the model sees the noun and rounds toward it.

- ❌ "the camera doesn't shake" → ✅ "locked-off tripod, zero operator drift, frame edges rock-steady"
- ❌ "no other people" → ✅ "the only figure in frame is the subject, the surrounding street reads empty"

Three sanctioned exceptions, kept because they suppress known failure modes: the on-screen text suppression line closing Last Frame, the anti-plastic phrasings inside Capture Realism, and the "no music" line inside Sound Bed. Everything else ships positive.

## The block order

Every prompt is a stack of labeled blocks, always in this order:

```
Scene & Mood: [one or two sentences — what the moment IS, translated to observable action]

Subject Lock: [the subject pinned — identity, body orientation, pose, physical state, gaze, contact points, and a lock-down line holding face, hair, wardrobe, and silhouette identical throughout]

Movement: [what happens across the runtime — character motion, micro-motion (breath, hair, fabric), environmental motion (rain, dust, traffic), speeds in km/h, atmosphere in % and meters — closing with the one-shot clause: one uninterrupted shot, no internal cuts]

Last Frame: [the exact closing composition — where the subject sits, final pose and gaze, what holds focus — closing with: No on-screen text, no captions, no signage typography, no rendered text in the frame.]

World Plate: [location, time of day, weather, set dressing, atmospheric quality]

Sound Bed: [Diegetic only — the real sounds of the scene, no music, no score. Footsteps name their surface; ambience is specific.]

Capture Realism: [the anti-plastic physics block — see below]

Camera Capture: [one closing line — lens as FOV° (mm), movement, stock, grade, frame rate, runtime. The only place camera or grade language lives.]
```

Rules that keep the stack working:

- One main idea per shot: one dominant action, one camera strategy, one lighting motivation.
- Movement names its layers explicitly, even when a layer is "nothing else moves" — saying nothing moves is a directive; absence is not.
- No platform names, no character names, no meta-commentary inside the prompt. Pure visual description.
- Runtime appears in the Camera Capture line and matches what you asked the generator for.
- Reference images are anchored with tags (`@product_ref`, `@person_ref`): the reference carries identity and wardrobe, the prompt only describes what the reference can't carry (a state change: damp hair, dirt on a cheek). Never re-describe wardrobe the reference already shows.

## The FOV ladder

The model latches onto **field-of-view in degrees** as a snap value. Millimeters read as suggestion; degrees read as instruction. Always write degrees first, mm in parentheses, and only use ladder values — 23° is not on the ladder, so use 18° or 29°.

| FOV | mm equiv | Feel | Use for |
|---|---|---|---|
| 107° | 14–16mm | architectural ultra-wide | vast interior scale, epic establishing |
| 84° | 20–24mm | wide | full-body blocking, environment establish |
| 63° | 28–35mm | reportage wide | observational, walking-alongside, phone-camera feel |
| 47° | 40–50mm | eye-level neutral | universal medium, waist-up |
| 29° | 75–85mm | portrait compression | isolated bust, tight coverage |
| 18° | 100–135mm | portrait tight | identity-hold close-up, held emotional beat |
| 12° | 180–200mm | tele detail | hand insert, object close, texture |

## Capture Realism — the real-footage engine

The block that makes a shot read as camera capture instead of AI video. It names the physics; Camera Capture names the gear. Four mechanics, tuned per scene:

1. **Depth via suspended atmosphere.** Haze, mist, or air density suspended *between* camera, subject, and background; distant planes render softer, desaturated, lower-contrast, so the figure sits within the air instead of pasted on a flat plane.
2. **Moisture without shine** (wet scenes only). Surfaces damp, not beaded; wet but matte. No specular hotspot.
3. **Per-zone specular kill on skin, with the flattering ceiling.** Zero shine on forehead, nose bridge, cheekbones, temples, chin. Real peach fuzz, soft even pore texture, subsurface scattering, warmth preserved — and never harsh: no acne, no blemishes, no cratered pores. Realism never makes a face look ugly.
4. **Contrast curve stated three ways.** Shadows lifted gently, highlights rolled off softly, nothing clipped or crushed; speculars removed from skin, hair, fabric, surfaces; low-contrast, slightly desaturated grade with warmth preserved.

Canonical block (tune every bracket to the scene; drop the skin sentence for no-humans shots; drop the moisture sentence for dry scenes):

```
Capture Realism: [Foreground subject] sits inside real depth — [thin/light/heavy] atmosphere suspended in the air between camera, subject, and [the far background element], the background rendered softer, desaturated, and lower-contrast than the foreground so the figure sits within the air rather than pasted on a flat plane. Skin reads true cinematic matte — zero shine on forehead, nose bridge, cheekbones, temples, chin, and collarbones, real peach fuzz catching light at the jaw and hairline, real soft fine even pore texture, light absorbed like true subsurface scattering, warmth preserved and natural, never plastic, never doll-skin, never AI-rendered, and never harsh — no acne, no blemishes, no enlarged or rough pores, fine flattering texture that keeps the face looking good. Low-contrast curve — shadows lifted gently holding texture, highlights rolled off softly never clipping to white, nothing crushed to black. All specular highlights surgically removed from skin, hair, fabric, and surrounding surfaces, every pixel reading matte and diffuse. Slightly desaturated grade with warmth preserved.
```

One deliberate exception: studio product work WANTS controlled speculars (chrome, glass, liquid). There the block keeps atmosphere and contrast but states intentional highlight bloom on the product's reflective materials instead of killing them. See Product Ad in `video-modes.md`.

## Sound Bed rules

Diegetic only: the sounds the scene itself makes. Footsteps (name the surface), fabric movement, breath, object sounds, specific ambience, weather. Never song names, lyrics, "music plays," score descriptors, or genre cues. The block always opens: `Diegetic only —`.

## Runtime guidance

- **4–8 seconds** — one strong action, single locked composition.
- **8–12 seconds** — one action plus a reveal or hold.
- **12–15 seconds** — 2–3 simple beats (LLM-driven multishot territory; the web tool stays single-shot).

One speed per shot. Complex multi-action sequences split into separate prompts.
