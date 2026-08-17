# The Cinema Stack — Fighting the AI Render Aesthetic

AI images fail in predictable ways: digital sharpness, dewy plastic skin, block-of-hair rendering, uniformly lit faces, blown highlights, flat backdrops. The cinema stack is one merged closing block that fights all of them at once by forcing a real photographic register. Most prompts this grammar produces end with a version of it.

## The five render rules behind the stack

**1. Real human skin.** Natural pore texture — soft, fine, even, never blemishes or clinical macro-detail. Peach fuzz catching light at the jawline and hairline. Subsurface scattering: skin is semi-translucent biology, not opaque plastic. No retouching, no smoothing, no porcelain, no beauty bloom. The flattering-realism ceiling: realism never means unflattering — no acne, no enlarged pores, no harsh texture. Matte carries the anti-plastic; fine-and-even carries the flattering. Both always on.

**2. Real hair physics.** Strand by strand, flyaways, baby hairs at the hairline, light transmission through ends — never a solid block. Hair responds to the environment: still interior = settled, wind = drift, action = kinetic lift, wet = damp matte clumping. Default register matte, never glossy sheen.

**3. Real lens character.** Wide-latitude digital cinema capture. Portraits and studio work: a clean fast 50mm-equivalent prime at a wide aperture — round bokeh, even sharpness, no anamorphic stretch. Scene plates: vintage 2x anamorphic character — oval bokeh, gentle horizontal squeeze on out-of-focus highlights, soft frame-edge falloff, light diffusion bloom lifting highlights into halation.

**4. Real light physics.** Atmospheric perspective default-on: visible haze and air density between planes, distant elements softer and desaturated — this is the single biggest fix for the "video game" look. Shadow falloff wraps real anatomy with soft transitions. Highlights roll off in a filmic curve, never clipping to white. Blacks lifted and open, never crushed.

**5. Real grain.** Color-negative motion-picture film look — daylight-balanced by day, tungsten-balanced and pushed at night — with fine theatrical 35mm grain across the entire frame including skin, fabric, and backdrop. Grain is what ties the frame to real photographic capture.

## The stack (append to Detail-mode and white-card standalone prompts)

```
Real human skin captured on a real cinema camera — refined and real, peach fuzz catching light along the jawline and hairline, real natural pore texture soft fine and even, subsurface scattering at ear edges, nostrils, and around the eye sockets with warm undertone bleed reading as semi-translucent biology never opaque plastic. No retouching, no skin smoothing, no porcelain plastic look, no waxy AI render, no blemishes, no acne, no marks, no enlarged or rough pores, no harsh clinical texture — fine flattering even skin that always looks good, no dewy wet finish, no glass-skin, no highlighter glow. Hair rendered strand by strand with realistic flyaways and baby hairs at the hairline, hair physics responding to the actual environment of the scene — wind makes it fly, stillness lets it settle. Fabric with real weave detail, real weight, real drape. Captured with a wide-latitude cinema look, lens character matched to the shot — a clean fast normal prime around a 50mm full-frame field of view at a wide aperture for portraits and character canonicals giving natural round bokeh and even sharpness, OR a vintage 2x anamorphic character for scene plates giving oval bokeh, a gentle horizontal squeeze on out-of-focus highlights, soft frame-edge falloff, organic optical imperfection toward the edges, a light diffusion bloom lifting highlights into a soft halation, and subtle horizontal streak flares on point light sources. Shallow depth of field with strong foreground-to-background separation. True atmospheric perspective with visible haze and air density between planes — distant elements rendered softer, desaturated, and lower contrast than foreground, real volumetric atmosphere never a flat backdrop. Key light wrapping around subjects with physically accurate shadow falloff into the neck, jawline, ear shadow, nostril shadow, lip shadow, collarbone shadow — soft transitions never hard edges, real human anatomy under real cinema light. Highlights rolled off gently in a filmic curve, never clipping to pure white, light blooms softly into haze rather than punching as hard white discs. Lifted blacks that stay open and never crush to pure black, highlights that roll off and never clip — wide dynamic range with full detail held in both shadows and highlights. Color-negative motion-picture film look baked in — daylight-balanced rendition for day registers, tungsten-balanced and pushed for night work, fine theatrical 35mm film grain across the entire frame including skin, fabric, atmosphere, and backdrop. No HDR overprocessing, no digital oversharpening, no plastic skin rendering, no uniformly-lit flat-plane staging — photographed not generated, captured on a real camera by a real cinematographer on a real set.
```

For pure environment plates with no humans: drop the skin, hair, subsurface, and anatomy-shadow lines; keep lens character, atmospheric perspective, light physics, grain, and the closing realism clause.

**Never append this stack to a character plate or sheet** — its key-wrap, anatomical shadow, and atmospheric language actively fight the flat reference grade those modes need. Character modes close with the flat grade in `constraints.md`.

## The five most load-bearing phrases

- **"atmospheric perspective with visible haze and air density between planes"** — forces multi-plane depth instead of single-plane staging.
- **"shadow falloff into the neck, jawline, ear shadow, nostril shadow"** — kills the AI uniform-lit face.
- **"subsurface scattering at ear edges, nostrils, and around the eye sockets with warm undertone bleed"** — kills plastic skin at the biological level.
- **"highlights rolled off gently in a filmic curve, never clipping to pure white"** — kills the blown digital highlight.
- **"photographed not generated, captured on a real camera by a real cinematographer on a real set"** — a surprisingly strong language-level signal against AI uniformity.

## Scene mode: the cinema-prose close

Scene plates don't append the stack as a block — they fold the same language into a closing camera paragraph written as prose, ending with the realism clause. Shape:

```
Captured with a wide-latitude cinema look and a vintage 55mm-equivalent 2x anamorphic character at a wide aperture, a light diffusion bloom softening the highlights, color-negative daylight film rendition pushed slightly, in a cinematic narrative register. Real anamorphic optical character with oval bokeh on the deeper elements, organic handheld operator breath, subtle frame-edge falloff, a faint horizontal streak flare on the brightest highlight. Theatrical fine 35mm film grain across the entire frame — skin, fabric, concrete, sky, haze. Contemporary cinema grade with warm and cool temperatures meeting on the subject, shadows lifted gently never crushed, highlights rolled off softly never blown. Real photographic frame captured on a real cinema camera, real anamorphic lens, real fabric, real human subject, real atmosphere — no CGI, no rendered look, no digital cleanliness, no plastic surfaces, no AI smoothness, no skin smoothing, no glossy highlights.
```

The trailing "no X, no Y" list is load-bearing and belongs ONLY here, at the very end — after all positive description the model treats it as a quality filter instead of a conflicting instruction.

## Night scenes

Theatrical night cinema is **mostly dark, with hard punchy practicals cutting through** — never bright-night, never saturated-teal-everywhere. Two registers:

- **Open/remote night** (canyon roads, cliffs, empty exteriors): light comes exclusively from practicals in the scene — headlights, brake lights, dash glow, a faint distant city glow. Sky and surroundings commit to deep crushed near-black. Haze catches beams as visible volumetric cones. Everything outside the practical throws falls to near-black; subjects read as silhouettes with lit edges.
- **Urban/interior night** (garages, streets, warehouses): practicals drive the look — sodium lamps, fluorescents, neon, dash glow. A teal-amber split can read here because the sources motivate it. Deep contrast, background readable through the lit zones.

Universal night rules: shadows deep but holding information; practicals punch with real intensity and volumetric throw; subjects defined against darkness by rim light from practicals, never flat-lit and never disappearing; skin stays warm against cool ambient, natural face-side lighting from the practical side.
