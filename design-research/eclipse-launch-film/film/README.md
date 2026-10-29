# Eclipse launch film: Station 2, the picture (silent)

The film's motion, built from `../TREATMENT.md` (the script), `../DECISIONS.md` and `../RULES.md`, with cinetic directing and
HyperFrames (HTML and one paused GSAP timeline) as the engine. It shows the real Eclipse screens from the pinned snapshot
(`../vendor/eclipse/`, `fedbdb6d`), never redrawn. Review notes are in `REVIEW.md`.

| | |
| --- | --- |
| Deliverable | `eclipse-silent-v1.mp4`: 1920x1080, 60 fps, 32.0 s (1920 frames), H.264 yuv420p, BT.709, +faststart, no audio track |
| Contact sheet | `contact-sheet.png`: one frame per beat-sheet row at its key moment, labelled with shot, frame, time and bar.beat |
| Re-render | `bash render.sh` (one command: setup, device textures, every frame, motion blur, encodes, probe, contact sheet) |

## The idea, the device, the grid
- **Idea:** today's red crowd line draws the gym's day; its live reading becomes the FITWAY mark's dot (DECISIONS item 18).
- **Device:** the line and its live reading (a dot in a ring), carried through every shot: the line on black, the line in
  Daily, the reading as its number, the end point's swell, the line as the last thing Reports covers (its head at the height
  of the pattern's first row), the pattern's fill front, the busiest hour's ring, the mark in the rail through the montage,
  the rail crossing the frame, the end point on the laptop, the construction's red dot, the mark's dot.
- **Grid:** 128 BPM, 16 bars + a 2 s tail. Bar n starts at 1.875 (n - 1) s: bar 3 = f225, bar 4 = f337, bar 5 = f450,
  bar 7 = f675, bar 9 = f900, bar 11 = f1125, bar 12 = f1237, bar 13 = f1350, bar 15 = f1575, bar 16 = f1687.

## Tempo: 128 BPM at 60 fps (a documented override)
At 60 fps a 128 BPM beat is 28.125 frames, so cinetic's `new-film.sh` refuses it ("one beat must be a whole number of
frames") and `grid-check.ts` reports `beat-whole`. The tempo is fixed (the music is written to it), so:
1. The project was scaffolded with `new-film.sh film --engine hyperframes --fps 60 --bpm 120 --size 1920x1080`, an allowed
   tempo, then `BPM = 128` was set in `motion.js` and `"bpm": 128` in `audio/score.json`. Nothing else in the starter changed.
2. `b(bar, beat, sixteenth)` in `motion.js` **floors** instead of rounding: every cue is the frame at or before the true
   grid point, so a visual hit is never late. Every 2 bars are a whole 225 f, so bars 1, 3, 5, ... are exact.
3. `timeline.js` exports `OFFGRID` (grid-check's own escape) for the cues whose floor sits more than half a frame before the
   true 16th, with the reason "floored to the frame at or before the 128 BPM 16th".
4. `grid-check.ts` therefore reports one expected error, `beat-whole`, and nothing else fails (REVIEW.md lists its output).
The floors move four of TREATMENT §5's frames by one: bar 4 is f337 (TREATMENT f338), bar 12 f1237 (f1238), bar 16 f1687
(f1688), 13.4 f1434 (copy enters on f1433, one frame early by the `cue - 1` rule).

## How it is built
- `index.html` is the HyperFrames composition (`data-composition-id="main"`, 32 s): four layers (`#ui` the real pages in
  iframes, `#gl` the three.js device scene, `#fx` the film's SVG, `#words` the copy) and one paused GSAP timeline
  registered last as `window.__timelines["main"]`. Its single linear clock calls `render(f)` (`src/film.js`), which sets every
  layer from the frame alone. `hf-seek` calls the same function.
- `motion.js` / `timeline.js`: cinetic's kit and the film's acts, cues, copy, construction schedule and `cues()` for Station 3.
- `src/pages.js` drives the real pages through their own DOM (the elements Eclipse's own intro drives): the line's
  dasharray by minutes, the end point's swell, the live pulse, the digit rolls, the level bars, the pattern's cells, the
  press, the period (`window.__reports.setRange`). Wall-clock transitions inside the pages are switched off.
- `src/devices.js`: the laptop and the phone (three.js), with the real Daily page captured by `tools/textures.mjs`.
- `src/mark.js`: the drafting construction and the lockup from `assets/mark-geometry.json` (Station 1's fitted mark).
- `src/copy.js`: the four lines from `timeline.js` COPY, one anchor (x 160, baseline 950, Readex Pro 500, 80 px).

## Rendering
`tools/render.mjs` is HyperFrames' render model run with the machine's Playwright Chromium: each worker opens the
composition, seeks the registered timeline to `frame / 60`, waits until the page and every iframe have painted, and
captures a PNG. Why not `npx hyperframes render`: the film's screens are live same-origin iframes and a WebGL scene,
which HyperFrames handles in its slower screenshot mode; driving the same timeline directly lets single frames render for
review, lets the slow device frames be shared between workers, and adds true motion blur (sub-frames averaged in linear
light, never across a cut) where `blur.json` lists a fast move. `hyperframes lint` passes with 0 errors.
- `node tools/render.mjs --frames 0,225,281` renders review stills into `../out/film/frames/`.
- `python tools/sheet.py <dir> <out.png> --frames ...` makes a labelled contact sheet.
- `node tools/audit.mjs` is cinetic's `layout-audit.sh` ported to this composition (that script renders a Remotion comp).
- `python tools/accent.py <dir> a b` measures FITWAY red on screen (the construction's accent test).
- Software GL: Chromium with SwiftShader, CPU raster for the page layers (GPU raster on SwiftShader left stale tiles on
  single frames), the device scene supersampled at 1.5x.

## Files
| Path | What |
| --- | --- |
| `index.html`, `motion.js`, `timeline.js`, `src/` | the composition |
| `tools/` | renderer, textures, sheets, audit, accent, encode |
| `render.sh` | the one-command re-render |
| `blur.json`, `qa.json` | where the master renders true motion blur; the declared hard cuts for `forensics.py` |
| `audio/` | the starter's sound files at 128 BPM, untouched (Station 3) |
| `setup.mjs` | restores everything gitignored: GSAP, three.js, the Eclipse link, Readex Pro, the mark, cinetic's scripts |
| `eclipse-silent-v1.mp4`, `contact-sheet.png` | the deliverables |
