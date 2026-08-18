# The Four Video Modes

Every video job is one of four modes. Same discipline as the image side: pick the mode first, because each one locks its own camera energy, grade, and realism register. The shared block grammar lives in `video-blocks.md`. All four target Seedance-class video generators.

| Mode | Job | Camera energy | Register |
|------|-----|---------------|----------|
| **Product Ad** | Product looks premium in motion | Tripod-mounted, slow push-in | Clean spherical, saturated editorial, intentional speculars on the product |
| **UGC** | Fake phone-shot testimonial, person talks to camera | Handheld arm's-length or propped-phone static | Smartphone capture, natural light, anti-plastic skin |
| **Narrative** | A story moment, character doing something | Handheld with operator breath | Vintage anamorphic, color-negative film, teal-amber |
| **Atmospheric** | Location and mood only, no people | Locked-off static or extremely slow push-in | Vintage anamorphic, palette-driven grade |

Product Ad and UGC are **conversion material**: they exist to sell something. Narrative and Atmospheric are **content material**: story beats and b-roll. The realism engine (Capture Realism) ships on all four; only Product Ad relaxes the specular kill, because chrome, glass, and liquid are supposed to shine.

---

## Mode: Product Ad

The studio register. The product is the only subject; everything else serves it.

- Subject Lock anchors the product: material, finish, scale cues, resting surface contact. If a reference image is attached (`@product_ref`), the reference carries the product's identity and the prompt only stages it.
- Default action when none is given: a slow presentation turn or a single reveal gesture.
- Surface choice: studio seamless (color stated) or a real context surface (marble counter, wood table — stated plainly).
- Speculars are INTENTIONAL here: highlight bloom on reflective materials, controlled and named per surface. Atmosphere and contrast-curve discipline still apply.

Camera Capture line:

```
Camera Capture: wide-latitude cinema capture, [FOV°] ([mm]) clean spherical character at a wide aperture — natural round bokeh, even sharpness — mild diffusion bloom, tripod-mounted with a slow push-in, saturated editorial grade, fine grain, warm-retained blacks, intentional highlight bloom on the product's reflective surfaces, 24fps 180° shutter, [runtime].
```

## Mode: UGC

The fake-phone-shot testimonial. A person speaks to camera, usually holding or using the product. The register IS the credibility: it must read like something filmed on a phone in a real room, not a commercial.

- Subject Lock anchors the person: orientation to camera, expression register, gesture energy, and the lock-down line. `@person_ref` carries identity; `@product_ref`, when present, is pinned to the hands via contact points.
- Two framings: **selfie-arm** (handheld at arm's length, natural sway) or **propped phone** (static counter-top framing, subject seated or standing into frame).
- Light is found, not built: window daylight or ordinary room light, stated plainly.
- The full skin-realism block stays — matte skin and real pore texture are exactly what makes fake UGC read real.

Camera Capture lines (one per framing):

```
Camera Capture: smartphone main-lens capture, 63° (28mm equivalent) with mild wide-angle character, handheld at arm's length with natural hand sway, found room light, mild digital compression, natural saturation, 30fps, [runtime].
```

```
Camera Capture: smartphone main-lens capture, 63° (28mm equivalent) with mild wide-angle character, phone propped static at counter height, zero operator movement, found room light, mild digital compression, natural saturation, 30fps, [runtime].
```

## Mode: Narrative

The story shot. Real-world dramatic: streets, kitchens, cars, shops, interiors. Anywhere lived-in.

- Subject Lock anchors the character; the action carries the drama, written as observable behavior (write-the-visible rules apply hardest here).
- Default action when none is given: walks a few steps and pauses, gaze shifting off-frame.
- Movement layers all four registers: character, micro (breath, hair, fabric), environmental (rain, traffic, wind in % and meters), camera implied by the capture line.

Camera Capture line:

```
Camera Capture: wide-latitude cinema capture, [FOV°] ([mm]) vintage 2x anamorphic character at a wide aperture — oval bokeh, soft frame-edge falloff — light diffusion bloom softening highlights, handheld with natural operator breath, color-negative daylight film rendition with fine 35mm grain, teal-amber grade, shallow depth of field, 24fps 180° shutter, [runtime].
```

## Mode: Atmospheric

The place is the subject. B-roll plates, establishing mood, weather, empty environments.

- No people, no reference tags. Subject Lock becomes an environment lock: the one dominant element (the street, the shoreline, the room) pinned with its state.
- Movement is environmental only: what the wind, water, light, or traffic does across the runtime.
- Camera energy is a real choice here, the only mode where it is: locked-off static, or an extremely slow push-in.
- Grade is palette-driven: name the two or three dominant colors and tie each to a surface or light source, never a bare color list.

Camera Capture line:

```
Camera Capture: wide-latitude cinema capture, [FOV°] ([mm]) vintage 2x anamorphic character at a wide aperture — oval bokeh, soft edge falloff — light diffusion bloom softening highlights, [locked-off static frame / extremely slow push-in], color-negative film rendition with fine grain, [palette grade], atmospheric haze, weathered material detail, 24fps 180° shutter, [runtime]. The environment is the subject.
```

---

## What the web tool simplifies

The web builder emits single-subject, single-shot prompts with fixed reference tags. The full grammar in the agent-skill and system-prompt doors additionally covers: user-named element tags, multi-subject Frame Maps and Cross-Frame Rules, and multishot sequences with cut vocabulary. If you're driving an LLM with this grammar, those live in the doors, not here.
