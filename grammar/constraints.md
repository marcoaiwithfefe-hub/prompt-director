# Universal Constraints

Rules that apply to every prompt this grammar produces, plus the flat-grade recipe that all character reference work closes with.

## The ten universal rules

1. **No character names.** Image models don't know your character's name. Describe by visual handle: "the rose-pink haired woman in the cropped white ribbed tank." Visual descriptors survive across prompts; names don't.
2. **No real brand names or protected IP.** Generic visual descriptors only: "black three-stripe athletic sneakers," not the brand. "Wide-angle action camera," not the product name.
3. **No age words.** Never *boy, girl, child, kid, young, teen, little, middle-aged, elderly, old*. Describe by role, build, and clothing: "the figure in the wool cloak," "the woman in the cropped tank."
4. **No aspect ratios in the prompt body.** Set ratio in the generator's UI. The prompt describes framing in plain language only: "full body," "chest-up portrait," "wide establishing shot."
5. **No negative prompt blocks.** The only place "no X, no Y" language appears is inside the locked closing blocks (flat grade / realism clause), where the model reads it as a quality filter.
6. **No meta-commentary.** Every word describes a visible thing in the frame. No "this is the still," no "the read is...", no production context like "matching the previous scene." Every prompt is standalone.
7. **No teeth-showing smiles unless asked.** Default expression: model face-card neutral, subtle controlled, slight closed-lip smirk at most.
8. **No invention.** Working from a reference image? Don't add wardrobe or markers that aren't in it. Only describe what's visible; if something's missing, decide it explicitly, don't let the model guess.
9. **Photoreal is the default.** Never "stylized," "illustration," "anime," "painterly," "rendered" unless deliberately overriding.
10. **Lean beats long when references exist.** If a sentence re-describes something an attached reference already shows, cut it unless it's load-bearing for composition. One distinguishing visual handle per subject; spend the prompt on composition, pose, light, and what's unique to THIS frame. A 2,500-character prompt with strong references beats a 5,000-character one every time — models read the front of the prompt most heavily.

## Reading reference images

Extract by visual description only, never names:
- **Hair**: color with every nuance (platinum, jet black with cool undertone, ash brown), length, texture, parting, styling, accessories.
- **Makeup**: skin finish, coverage register, brow shape, eye treatment, lashes, lip, cheek. Freckles/beauty marks only if visible — do not invent.
- **Wardrobe**: every garment top to bottom — fabric, color, fit, structural details, neckline, sleeves, hem, layering.
- **Jewelry, body markers, pose and energy**: every piece, every visible marker, body angle, weight distribution, expression register.

## The flat grade — why character references carry zero lighting

Character plates (face locks, outfit bases, sheets) are references, not finished frames. Any shadow baked into a reference — a cheek triangle, a nose shadow, a contact shadow, a backdrop falloff — gets inherited and amplified by every downstream generation that reads it, and fights whatever lighting the real scene wants later. So the plate carries **no lighting information at all**: form is described by bone structure, hair strands, and fabric folds alone.

**Why 18% gray, not white.** White seamless maximizes subject-to-background contrast, and generators amplify mistakes most at high-contrast edges — halo, edge breathing, contour instability. Neutral mid-gray lowers that contrast: cleaner edges, less inherited plastic. Gray is the standing default; white only for a finished standalone card.

**The gray stays neutral; the subject does not.** Skin renders at its true natural tone, wardrobe at its true color — never washed out or cool-shifted by the background.

### The locked flat-grade close (append to every character plate and sheet)

```
Background is an even 18% neutral gray seamless, completely flat — one single uniform value corner to corner, no seam line, no gradient, no hotspot, no vignette, no falloff to lighter or darker anywhere in the frame. Relight from scratch overriding any reference lighting: completely flat shadowless illumination — one enormous soft frontal source at camera position wrapping the subject evenly, matched equal fill from camera-left and camera-right at identical intensity, matched fill from above and below, so both sides of the face read at exactly the same brightness. No key-and-fill ratio, no modelling, no shadow side, no cheek triangle, no nose shadow, no under-chin shadow, no rim light, no hair light, no kicker, no specular hotspot. Zero shadow cast onto the background — the backdrop stays clean flat gray behind the entire figure. No contact shadow, no drop shadow, no ambient occlusion anywhere in the frame. Extremely low contrast, even, milky, catalogue-flat. Form is described by bone structure, hair strands, and fabric folds alone, not by light and shadow. Skin reads matte and velvety — zero shine on forehead, nose bridge, cheekbones, temples, and chin, no oily T-zone. Skin renders at its true natural skin tone and wardrobe at its true natural color, warmth preserved and natural against the neutral gray, never pale or washed-out or cool-shifted by the background. Real peach fuzz at the jaw and hairline, real soft fine even pore texture, subsurface scattering reading as semi-translucent biology, never plastic, never waxy AI render, never glass-skin, never harsh — fine flattering texture that keeps the face looking good, no acne, no blemishes, no rough pores. Photographed on a 50mm prime, even sharpness, soft natural film grain. Photographed not generated.
```

### The three things every flat close must contain

1. **Flat backdrop** — one uniform gray value corner to corner, no seam, no gradient, no vignette, no falloff.
2. **Shadowless illumination** — huge frontal source, matched equal fill on all sides, no key/fill ratio, no shadow side, no rim, no hair light, no kicker.
3. **Zero cast shadow** — nothing on the background, no contact shadow, no ambient occlusion under feet or hem.

Miss any one and the plate comes back with modelling baked in. On sheets, state all three as uniform across every panel.

**The white exception:** on explicit request, swap the backdrop line for "Pure white seamless studio background, no gradient, no seam line, perfectly even" — and keep every flat/shadowless clause. Flatness never comes off.

## Lens table

| Job | Lens language |
|-----|--------------|
| Face lock, outfit base, sheet, detail portrait | clean fast 50mm-equivalent prime, wide aperture, round bokeh, even sharpness |
| Scene plate | vintage 55mm-equivalent 2x anamorphic character, oval bokeh, gentle horizontal squeeze, edge falloff |
| Wide establishing | wider anamorphic field, deep staging, atmospheric perspective carrying the depth |

Always as look language, never brand or model names — generators don't know gear, they know the look gear produces.
