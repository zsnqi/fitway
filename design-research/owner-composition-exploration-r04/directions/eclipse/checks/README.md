# Eclipse check harness

From the worktree root, in PowerShell:

```powershell
node design-research/owner-composition-exploration-r04/directions/eclipse/checks/run.mjs all --rev 8ae88f3 --base 6123863
node design-research/owner-composition-exploration-r04/directions/eclipse/checks/run.mjs rest --rev 8ae88f3 --base 6123863 --workers 1
node design-research/owner-composition-exploration-r04/directions/eclipse/checks/run.mjs hover gap --rev a14009f
node design-research/owner-composition-exploration-r04/directions/eclipse/checks/run.mjs readings --rev 8ae88f3 --plant readings
```

Checks: `rest readings hover gap nohist width quality guard layout`. `--workers` defaults to 4.
`--out` must be new or empty, local, and outside every Git working tree; the default is a fresh system-temp directory.
`guard` requires system-temp output and Windows, as does the original capture path guard. No dependencies are added.
The harness uses the worktree's installed `@playwright/test` and Chromium. Web-font failure fails collection rather
than silently substituting fallback. The deliberate fallback-font abort is excluded from error gates.

Each revision is resolved to a commit, archived with `git archive`, and served from its own extracted Eclipse
directory on an available port in **3180–3189**. The checked-out page, capture script, evidence and tuning files are
never written. The harness at HEAD can measure older revisions. A non-zero exit means a check or collection failed.
Missing jobs, fonts, reference sweeps, observer support or mismatched snapshot coverage cannot produce a pass.

`raw/` holds every measured row. `summary.json` and `REPORT.md` hold numbers, thresholds and results.
`--frames` adds named AR/EN desktop/mobile key frames and frame-by-frame motion strips, rendered into sheets with the
installed **ui-forensics** sheet implementation (vendored here with its attribution). `frames/manifest.json` names
each frame, its configuration, time and selection. Images are evidence for inspection, not visual acceptance.

`timing.json` records wall time separately. It is intentionally nondeterministic. For serial/parallel equivalence,
compare every `raw/sweep/**/*.json` and `results/rest.json` byte for byte. With two **rest-only** runs, also compare
`summary.json` and `REPORT.md`. Per-check result files permit the same comparison with the rest stage of `all`.
They contain no elapsed times, ports, worker IDs, absolute output paths or capture dates. Browser processes own
configuration jobs; contexts, clocks and fonts are isolated. Fake-clock work can run concurrently. Capture guard
subprocesses exit before `quality`, which runs alone and last using real time.

## Reference definitions

The supplied independent verifier's source hashes are in `reference-provenance.json`. The adapted collection and
analysis modules retain those probes' geometry, state sets, fake clock, frame interval, rounding and quantiles.

- `rest`: 48 configurations (four viewports × two fonts × AR/EN × three states), every stop at every minute from
  822 (7:42 PM) through 1139. The number width is `ceil(max numbered max-content width + 2)`. Rendered clearance is
  at least 11 px, with no tolerance below that minimum. The start edge is right for Arabic and left for English.
  Ring rectangles and the actual SVG time-axis y are also retained in each row.
- Minimal change uses the verifier's **final `rule3dig.mjs`** classification and tolerances. Its rendered rectangle
  test supersedes `analyze-sweep.mjs`'s ideal-coordinate test, whose saved output has 196 false positives. Original
  boxes already clear at the base must retain left/top within 0.0101 px. Alternatives are centred within 0.011 px;
  the reference's 10.95/11.05 px ideal/rendered boundary checks, 0.2 px maximum extra clearance, smaller-shift
  direction test and upward tie preference are unchanged. The earlier ideal diagnostic is retained and named as
  such in the summary, separately from the acceptance result.
- `readings` / `width`: 12 desktop configurations, 42 reference stop keys, every one of the 317 minute ticks.
  Every tick executes the reference's 61 virtual frames. Frames are measured individually for every rest geometry,
  content or width change; unchanged ticks always measure before, immediate and settled positions. The independent
  rest sweep plans this sampling. A changed tick omitted by the plan fails collection. The settled position is
  checked against rest at **every** tick. Removing sampling does not change the clock or the specified case sets.
  The width check uses all 62 pre/frame samples only when the same L/R side mode is kept.
- Motion allowance is the reference's maximum response increment at 60 Hz, times total pinned-edge travel, plus
  0.5 px. Its unrounded curve is recovered from `chart.timings` and checked against `chart.response()` (the API
  rounds fractions to 0.001). At the reference speed the factor is 0.12832092727510347. Final left/top must match
  rest within 0.011 px. The reading gate counts still frames specifically at a live morph's end; the reference's
  other still-frame/stall diagnostics remain in raw results.
- `hover`: all stops to their ±1/2/3 neighbours at minutes 883, 930, 960, 1002 and 1085. `gap` is the from/to gap
  subset. A stall/jump is two or more steps under 0.05 px while more than 1 px from rest, followed by a step over
  3 px. Settle uses 0.1 px, the reference quantile index, and paired transition IDs. Median/p90 must not increase
  against a supplied base; the number more than one frame slower is reported. `gapdig.mjs` is the supplied final
  analyzer for the missing-span subset: its box-corner allowance yields the brief's 0 clean / 2,481 bad count.
  `analyze-hover.mjs` instead records 350 pinned-edge allowance flags on the clean gap subset, caused by width
  changes; those remain a reported diagnostic. Non-gap hover keeps the pinned-edge allowance. A supplied `--base`
  must have the full 13,416-transition set and pair every moving candidate transition; partial base data fails.
- `nohist`: the reference pointer sweeps, every-stop visits in both directions, Home and mirrored arrow stepping,
  then rapid keys, in AR/EN × three states × motion on/off. Each observed box must have its selected stop's text
  and settled position within 0.02 px. All checks and the independent rest map are retained. The reference script and
  saved summary total **1,976** checks (eight × 166 and four × 162), although the brief says 1,992; the report
  explicitly records that discrepancy rather than changing the reference sequence.
- `quality`: the original input and reading sequence, dwell times and six state/language configurations. LoAF
  over 50 ms, rAF gaps over 50.1 ms or any errors fail. All layout-shift sources are retained. CLS is the reference
  sum of **all** entries, including recent input, and is measured only. The supplied reference JSON already records
  0.02221–0.03283 using this definition, differing from the brief's 0.009–0.016. Accessibility compares the original
  idle/focus/keys/Home/reading/slider phases against `--base`; without one that comparison is reported as unrun.
  A real in-page `setTimeout` 90-ms task, layout prepend and changed label must exercise their detectors.
- `guard`: the reference's 14 refusal paths plus a valid scratch path that reaches Chromium. Full actual
  `capture.mjs --plant=once` and `--plant=always` runs check exit codes **and** their recapture logs. Only the
  temporary capture copy's fixed port is changed to the allocated allowed port. The capture's exact-revision
  light-study calibration dependency is also archived, and its module lookup uses a temp junction to the installed
  dependencies. On Windows, this capture copy uses a short system-temp path so Chromium's `file://` calibration
  avoids the long-path limit; raw measurements and logs still use `--out`. Every output stays in temp. No protected
  repository path is used for a destructive control.

## Layout baseline and controls

`layout` has **no acceptance thresholds**. It reports:

- own-ring overlap: point-to-box distance less than the measured SVG circle's radius + 2 px; gap and no-ring stops
  have no own-ring test;
- any box area below the SVG time axis, including a box crossing into the label band;
- whether the stop's x is at least 24 px inside both box edges, or its mode is L/R;
- signed vertical distance to its actual ring/point (positive above/below, negative when vertically overlapping);
  missing and no-ring stops have no point measurement, and their anchor gaps are retained separately;
- collapsed placement-mode reversals A→B→A where departure from A and return are within 30 minutes;
- the reference's AR/EN live desktop Home/End sequence, 50 frames per key, plus box/ring positions and travel.

`--plant <check>` changes only the disposable page (or a temp capture copy). It plants an overlap with now (`rest`),
an instant reading placement (`readings`), a two-frame stall and snap (`hover` / `gap`), wrong content and a no-history
throw (`nohist`), a 2 px width-edge displacement (`width`), a real 90-ms task and changed label (`quality`), an omitted
Git-tree guard (`guard`), or a measured new own-ring overlap (`layout`). These must exit non-zero. Layout's plant
uses its measured before/after control only, leaving the unplanted layout baseline without invented thresholds.

Known-bad revision commands use `6123863` for rest, `3b1c3da` for readings, and `a14009f` for hover, gap, width and
nohist. Quality and guard have planted known-bad controls rather than a published bad revision. Layout is a new
measured baseline. This harness does not run the repository fast ladder or declare project milestones complete.

The saved known-bad summaries have narrower collection sets. `3b1c3da` has six web-font configurations
(79,884 ticks): its 88 allowance violations match this harness; the complete matrix adds 42 fallback-font
violations, for 130. The reference 97.547 px reading step remains AR/live/web, `h1140`, minute 1012, frame 16.
The analyzer reports the largest step/allowance ratio, which can select a different case in the full matrix.
Each revision is checked against its own rest map; the original analyzer defaults to the `8ae88f3` rest map.
The saved `a14009f` width summary has only 12,214 same-side cases (29,798 ticks in three configuration
directories). The full 25,376-case matrix yields 12,359 failures; its 12.1094 px maximum deviation matches
the reference. Reports state these collection differences without changing the geometry or allowance rules.
