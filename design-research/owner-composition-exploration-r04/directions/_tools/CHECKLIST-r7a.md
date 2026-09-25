# Verification checklist — Eclipse Round 7, step 1 (marker forms A and B)

Worktree: `D:\Projects\fitway-worktrees\owner-design-exploration-r04` (PowerShell is the primary shell; Git Bash is
available). Direction folder: `design-research/owner-composition-exploration-r04/directions/eclipse/`.
Scratchpad root (call it SP):
`C:\Users\PCFORC~1\AppData\Local\Temp\claude\D--Projects-fitway-worktrees-owner-design-exploration-r04\8f6a215f-9d39-4251-a39f-d9ed1baf14d0\scratchpad`

## What was asked (the spec you verify against)
`directions/NEXT-DIRECTION-BRIEF.md`, "Round 7", decision 2 and work-plan step 1, plus these constraints the
coordinator gave the designer:
- Writes only inside `eclipse/`. `eclipse/evidence/pre-motion-hashes.json`, `eclipse/.impeccable/**`, and the
  `:root` light values in `style.css` are unchanged. The digit roll, the level bars, the live tail and pulse,
  the rail, and the current Round 6 glide along the curve are unchanged.
- **Form A:** a lit bead, meaning a solid FITWAY-red dot with a thin chalk rim and a soft red glow that reads
  as light on the line.
- **Form B:** a hollow ring with a dark centre and a red edge, on the line with the line passing behind it,
  and a soft glow.
- **Both forms:**
  - no level ticks and nothing above the point (no guide over the marker);
  - the thin red hairline from the point to the time axis stays;
  - after now, a hollow chalk ring on the usual line, never red;
  - no marker after now when there is no history;
  - fitting variants at the peak (on or in the peak marker) and at the missing span (not reading-like).
- **Switch:**
  - a tuner control "Marker: A / B" with AR and EN labels, persisted in its own key and ignored with
    `?tuner=0`;
  - `?marker=a|b`;
  - default A;
  - the form is exposed on `window.__eclipse.chart`.
- **Still frames:** with `reducedMotion: reduce` and with `?motion=off`, every frame in `pre-motion-hashes.json`
  is pixel-identical, except `daily-ar-1440x900-tuner-open` and `daily-ar-1440x900-hover`. The EN hover also
  changes.
- **Marker on the rendered line:** ≤ 0.5 px for every stop, in AR and EN, and in the live, no-history, and
  delayed states.

## Baseline (taken just before the designer started)
- `SP\r7a-before\`:
  - `outside-eclipse.sha256` covers the 120 direction files outside `eclipse/`, including the brief;
  - `owned.sha256` covers the handoff, packet, SPEC, biome, and ledger;
  - `status.txt`, `index.sha256`, `tracked-diff-outside-eclipse.sha256` (from
    `git diff HEAD -- . ":(exclude)<directions>/eclipse"`), and `eclipse.sha256`.
- `SP\eclipse-before-r7a\` is a full copy of `eclipse/` before the step.
- Pre-motion reference PNGs, whose hashes match `pre-motion-hashes.json`:
  `C:\Users\PCFORC~1\AppData\Local\Temp\claude\D--Projects-fitway-worktrees-owner-design-exploration-r04\d329255d-7158-42d6-8349-b9c7d39168a4\scratchpad\eclipse-v3-user-copy\evidence\`

## Reference tools (the coordinator's, from Round 6; copy them into your folder and adapt, do not edit in place)
`SP\tools\`:
- `static.mjs` + `compare.py`: 23 still frames × modes against the reference PNGs.
- `hover.mjs`: the marker centre from the DOM against the SVG paths sampled every 0.2 px, tooltip values
  against the axis, pointer snapping, keyboard order, and the glide staying on the curve. It assumes the
  Round 6 DOM (`#sel .sg-mark[data-form]`, `.sg-core`); adapt it to the new markup.
- `motion.mjs`: first paint, animations, roll, bars, delayed, and the header chip.
- `video.mjs` + `frames.py` + `marks.py`: Playwright recordVideo at 25 fps, with CDP slow motion, decoded with
  OpenCV into strips.

Known pitfalls:
- Use `file://` URLs and `colorScheme: "dark"`.
- The motion-on first paint equals the still frame only after network idle, because a font subset arrives
  late.
- VP8 video has a quality ramp in the first ~2 s and a keyframe blip at frames 128–129. These are not the page.
- Do not run `eclipse/capture.mjs`, because it rewrites repository evidence. Judge the evidence's currency by
  file times and by comparing your own renders with the evidence frames.

## Checks
1. **Scope:**
   - the baseline hashes, git status, and index;
   - the changes are confined to `eclipse/`;
   - the protected files inside `eclipse/` are unchanged;
   - the `:root` block is identical to the copy's.
2. **Still frames:**
   - all 23 frames in both modes are pixel-identical to the references;
   - with motion on, after network idle and with the pulse hidden, AR and EN are identical.
3. **Marker geometry, for both forms:** AR and EN, in the live, no-history, and delayed states.
   - The distance to the line, or to the usual line, is at most 0.5 px.
   - The peak sits on the peak marker, and the latest reading on the end point.
   - Nothing of the marker is drawn above the point, and there are no ticks.
   - The hairline runs to the axis.
   - After now it is hollow chalk. With no history there is no marker after now.
   - The gap variant is not reading-like.
4. **Glide:** both forms stay on the curve on every sampled frame.
5. **Switch:**
   - the tuner control and its labels;
   - a live switch;
   - persistence across a reload in its own key;
   - `?tuner=0` ignores the stored choice;
   - `?marker=b`;
   - the default is A;
   - the API.
6. **Unchanged behaviour:** spot-check the roll, the bars, the live tail and pulse, the rail, and delayed.
7. **Craft:**
   - Render your own tight 3x crops of both forms at every stop kind, in AR and EN, and look at them.
   - Does either form read as a crosshair or a target?
   - Is the red FITWAY red, not pink or purple?
   - Does the glow read as light on the line, not as a background halo?
   - Is anything cheap, noisy, or misaligned?
   - Compare `evidence/marker-compare-ar-3x.png` with your own crops.
8. **Real-time video:** a short hover sweep with each form. Inspect strips of it.
9. **Evidence currency:** the evidence is newer than the last code edit, and your hover renders match the
   hover evidence frames.
10. **README:** only after your own findings, check that it matches what you observed.

## Output
Write everything in `SP\r7a-verify\`:
- `REPORT.md`: a PASS or FAIL per check, with the numbers, and findings with severity and file and line or frame
  evidence;
- your numbers as JSON;
- your key images.

Keep your final message short. List the 4–8 evidence files the coordinator should open.
