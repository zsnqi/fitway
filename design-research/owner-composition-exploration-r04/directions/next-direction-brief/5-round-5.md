<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Round 5 — after Eclipse v2 (agreed 2026-09-24)

Eclipse v2 applied Round 4: a centered, center-weighted average; the "Inside now" light
concentrated in the corner; an oxblood chart light; the chip hidden when today is about usual;
and «المعتاد 318». The user likes it overall. Two light fixes, a tuner, and motion remain.

### 1. The "Inside now" light: a disc in front of a light

The user pointed out that the reference (light 4) reads like a **dark disc (قرص) sitting inside a
lit card**. Light shows only around the disc's edge. The coordinator's measurements agree. On
the reference's bottom row (y = 0.98 of the card height), OKLab L is 0.45 at the far corner,
0.19–0.30 across the middle, and 0.74–0.79 at the lit corner. Just above, at y = 0.95, the middle
is dark (0.15).

- **Build.** Layer 1 is a light background inside the card, brightest at the inline-end bottom
  corner. Layer 2 is a large dark ellipse on top of it, with a clean edge that is lightly
  feathered.
- **Visible result.**
  - The main crescent sits at the lit corner.
  - A thin rim of light, about 2–4% of the card height, runs along the entire bottom edge.
  - A small glow shows at the far bottom corner, because a disc cannot cover a rectangle's
    corners.
  - The disc's edge reads as one continuous, clean arc.
- **The ring fades out at its ends** (user note). Where the light climbs the inline-end side, and
  where the thin rim runs toward the far end, it fades smoothly to transparent. It never stops
  abruptly.
- Eclipse v2's blob, with its soft diagonal edge, is what to avoid. The coordinator's
  `disc-model.png` sketch only explains the principle. The target look is the reference's detail,
  in FITWAY red.

### 2. Chart card: back toward light-study A

The user prefers A because its light ends in clean black sooner. Measured on the chart card
(OKLab L relative to the card base):

| | Light-study A | Eclipse v2 |
| --- | --- | --- |
| Pure dark | 79% | 64% |
| Dim haze (+0.02 to +0.10) | 13% | 33% |
| Visibly lit (≥ +0.10) | 8% | 3% |
| Height the light takes to fade to black | 15–35% | 32–42% |

**Targets:**
- about 75% or more pure dark;
- 15% or less dim haze;
- the light fades to black within about 15–35% of the card height.

A's inline-end bottom corner was a little too strong (L 0.52 against about 0.30 elsewhere).
Balance the two corners.

### 3. A live light tuner

The page's light layers read CSS custom properties, and a small, collapsible, floating panel
changes them live:

- **"Inside now" card:** light intensity, core color, disc size, disc position, disc edge
  softness, rim thickness, far-corner glow, and ring-end fade.
- **Chart card:** intensity, fade distance, corner balance, and side height.
- **Page:** wash intensity and grain.
- **Presets:** v2, A-like, and Recommended.
- **"Copy values":** copies the settings as JSON.

It works from `file://`. The user tunes the lights, and the chosen values become the defaults.

*The lights are now tuned: the user's values in `:root` do not change (Round 6 §10). Round 6 §9
and Round 7 changed the tuner's controls.*

### 4. Motion (after the lights are settled)

*Superseded by Round 6 (the motion reset) and Round 7 §4 (the first-open intro). The user judged
this motion cliché; it stays here only as the record of what was tried.*

The user has only seen still frames so far, and wants the motion to be excellent too. Motion
must stay truthful:

- **Load.** Cards and the chart enter once with a short, calm stagger. The line draws from
  opening to now, then the peak marker appears.
- **Live.** A new reading extends the line; it does not redraw. The live dot pulses slowly only
  while live, and stops when delayed.
- **Numbers.** Update with a quick cross-fade. They never count up.
- **Interaction.** The tooltip and guide line follow smoothly. The rail opens with transform and
  opacity only.
- **Lights.** The user asked whether the lights can be interactive, only subtly. **User decision
  (2026-09-24):** try both the "switch on at load" and the "follow the pointer" behaviors in the
  motion step, starting with "follow the pointer". The coordinator's proposals:
  - **Proposed:** after the cards appear on load, the lights "switch on" once with a slow, calm
    fade.
  - **Proposed:** on desktop hover over a lit card, the light shifts a few pixels toward the
    pointer. It should feel as if the light peeks around the disc. This is off for touch and
    reduced motion.
  - **Optional, to try in the tuner as a toggle:** the "Inside now" light is dimmer when the gym
    is quiet and stronger when it is busy. The number and the level label still carry the truth.
  - **Not recommended:** a continuous "breathing" light. On a dashboard left open all day, it
    distracts.
- **Reduced motion.** `prefers-reduced-motion` and `motion=off` show final states.
- **How the user judges motion.** The user opens the page themselves (`index.html` directly).
  The designer verifies motion in Playwright, for example with time-stepped frames or a
  recording for its own inspection. Videos for the user are optional.

