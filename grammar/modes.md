# The Five Modes

Every image job is one of five modes. Picking the right mode before writing a single word is most of the craft: each mode has its own goal, its own framing defaults, and its own closing block. Mixing them is the #1 reason AI portraits come out plastic and scenes come out flat.

| Mode | Job | Closes with |
|------|-----|-------------|
| **Face Lock** | Create a new character's canonical face reference | Flat grade (see `constraints.md`) |
| **Outfit** | First full-styling image of a character/outfit pairing | Flat grade |
| **Character Sheet** | One 3-panel multi-angle reference image | Flat grade, stated per-panel |
| **Scene** | Cinematic plate, with or without characters | Cinema-prose paragraph (see `cinema-stack.md`) |
| **Detail** | Tight chest-up / face close-up, maximum skin fidelity | Cinema stack |

Character modes (Face Lock, Outfit, Sheet) are **reference builders**: their output feeds later generations, so they carry zero lighting information. Scene and Detail are **finished frames**: they're the only modes where directional light lives.

---

## Mode: Face Lock

Run once per new character, before any outfit or scene work. Identity only.

- Framing: 3:4 headshot, forehead to upper chest, face filling most of the frame.
- Wardrobe locked to a neutral baseline: plain black thin-strap camisole (women) or plain black ribbed tank (men). No jewelry, no logos. This keeps the face plate identity-pure.
- Backdrop: 18% neutral gray seamless, completely flat (see `constraints.md` for why gray beats white).
- Content: heritage, build, skin tone and finish, hair (color with every nuance, length, texture), eye shape and color, and every identity marker you want permanent — piercings with exact position and metal, scars with placement and size, beauty marks with placement.

Structure:

```
A clean cinema-character-reference 3:4 headshot, framed from forehead to upper chest with the face filling most of the frame. [Identity essentials — heritage, build, skin tone and finish, hair color/length/texture, eye shape and color, key identity markers]. She wears a plain black thin-strap camisole [/ he wears a plain black ribbed tank], no jewelry, no logos, no graphics. Body squared to camera, head level, neutral relaxed expression, eyes to camera, lips closed and relaxed, subtle controlled energy.

[THE FLAT GRADE CLOSE — verbatim from constraints.md]
```

The output becomes the character's canonical reference. Every future prompt anchors to it.

## Mode: Outfit

First image of any character/outfit pairing. Full styling readable head to toe, environment minimal so the character is the only subject.

- Framing default: full body (it's an outfit reference — show the whole fit). Weight shifted onto one hip, body angled 15–30° from camera, chin level, model face-card neutral expression. Never a teeth-showing smile unless asked.
- Describe the wardrobe top to bottom: fabric, color, fit (cropped, oversized, fitted), structural details (ribbing, cutouts, denim wash, leather finish, mesh), neckline, sleeve length, hem position, layering, footwear, every piece of jewelry.
- Backdrop and light: same flat gray grade as Face Lock.

When generating a series of bases for the same character, vary ONE parameter per shot (pose, framing, or expression) and keep face, skin, and identity markers locked.

## Mode: Character Sheet (3-panel)

One image, one horizontal frame, three equal vertical panels. Built only after an approved Outfit base exists. Three panels beat six: the sheet has a fixed pixel budget, and six cells starve the face panel — the one thing the sheet exists to lock.

1. **LEFT — full body front, headless.** The head is *removed from the body*, not cropped by the frame: full headroom preserved, generous empty backdrop above the shoulders. Two variants by garment:
   - *Ghost mannequin* (structured/closed necklines — tees, collars, tanks, hoods): no head, no neck, nothing above the shoulder line; the collar holds its shape and the opening reads as an empty dark hollow looking down into the garment.
   - *Clean neck cut* (strapless, halter, plunging, scooped): the neck rises a short way and terminates in a clean flat horizontal edge at the base of the throat, like a dress-form mannequin.
   - Both variants: no blur, no fade, no wisps, no ghosting, no anatomy at the cut — and the hair goes with the head.
2. **CENTER — full body rear, head attached.** Hair fall, garment back construction, hem, footwear from behind.
3. **RIGHT — tight chest-up face lock.** Top of head to collarbones ONLY. Chest-up, not waist-up — if this panel drifts wider the sheet loses its reason to exist.

Rules that keep sheets usable:
- One prompt, one image. Identity and wardrobe described ONCE in opening paragraphs, applied to all panels; each panel describes only what differs.
- Label every panel explicitly (LEFT / CENTER / RIGHT) so the model composes the grid.
- **Skin-tone consistency clause is mandatory** — "skin renders at its true natural skin tone, identical in value and hue across the face, arms, and body in every panel." Rear panels drift darker without it.
- Flat grade stated as uniform across all panels.

## Mode: Scene

Cinematic plates — a character in a fully realized environment, or a pure environment with no one in it. Written like a DP describing a real frame, not a spec sheet. Five paragraphs, no labels, flowing prose:

1. **Opening shot** — one long sentence: medium ("a cinematic anamorphic still photograph"), framing register, subject at high level, camera position in prose, mood.
2. **Character** — identity markers as visible facts in the frame; pose, attention, held props. If you have a character reference image, write "carrying identically from the attached character reference" instead of re-describing the face.
3. **World** — the location as ambience and atmosphere, not architecture. Background subjects get positional prose ("in the deeper background camera-left"), never coordinates.
4. **Subject anchor** — whatever the focal anchor is (a screen, a car, a horizon glow) gets its own paragraph; fold into 3 if there isn't one.
5. **Camera spec + finish** — the cinema-prose close from `cinema-stack.md`, ending in the realism clause.

Key writing rules:
- No labeled blocks, no coordinates, no "MUST/CRITICAL" rules, no negations in the body. Write what IS: "the cool wash catching only the floor patch around his feet," not "the wash MUST NOT hit the wall."
- **Resolution-aware detail**: describe only what a real lens at this distance, motion, and light would resolve. A car at 200 feet is silhouette + color blocks + light trails, not badges and spoke counts. Detail is earned by proximity, lens length, stillness, and light.
- Positional prose from rule-of-thirds thinking: "anchored on the left third," "horizon sitting at the upper third," "lead room ahead of the car in its direction of motion."

## Mode: Detail

Tight chest-up or face-only shot where skin fidelity is the entire point.

- Framing: chest-up, shoulders-up, or forehead-to-collarbone.
- Lighting: classical beauty — soft key from slightly above and camera-left at 35 degrees, soft fill at chest level from camera-right, subtle hair light defining the crown, soft underlight bounce lifting the eye sockets.
- Fidelity paragraph: visible pores, fine peach fuzz along the jawline and upper lip, subsurface scattering on the nose bridge and ears, individual lash detail, visible iris pattern with real moisture, real lip texture, strand-by-strand hair at the hairline, fabric weave at the collar.
- Close with the full cinema stack.

## Bonus: Outfit Replacement (two references)

Put the character from one image into the outfit and pose from another. Reference order is fixed: **image 1 = outfit/pose source, image 2 = character/identity source.** The prompt stays lean — the references carry everything:

```
Replace the character in @image1 with the character in @image2. Keep the outfit and pose from @image1 exactly. Match the face, bone structure, body type, skin tone, and hair from @image2. Clean mid-gray seamless studio background, even neutral mid-gray with no seam line, soft large-source studio lighting, skin and outfit rendering at their true natural tone against the neutral gray, natural film grain, full body framing.
```

Do not add styling description, character description, or the cinema stack — stacking language on a swap operation degrades the identity transfer. (Some tools attach references in the UI instead of @tags; if so, drop the @tags and say "the first reference / the second reference".)
