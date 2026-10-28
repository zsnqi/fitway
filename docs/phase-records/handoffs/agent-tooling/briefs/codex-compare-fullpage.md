<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: compare sees the whole page (agent-tooling-r01, round compare-fullpage)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-compare-fullpage`, branch `tooling-compare-fullpage`, HEAD `9db242bb`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 52 and 96; `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` item 14.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Compare": what compare promises today.
  - `.agents/skills/verify-fitway/comparison-capture.mjs`: the settled capture.
  - `.agents/skills/verify-fitway/runner.mjs:222-240` and `.agents/skills/verify-fitway/timeline.mjs:742-756`: the two
    other screenshot calls, which stay as they are.
  - `.agents/skills/verify-fitway/drive-plan.mjs:15-55`: the phone/wide boundary and the mobile flag.
  - `.agents/skills/verify-fitway/cli.test.mjs:2580-2660`: the test that pins the capture's options.
  - `docs/agent-context/briefs/CODE_REVIEW.md`: D1-D8, which the diff is reviewed against.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

`compare`'s settled result judges the whole document, exactly as the reader sees it at each scroll position, instead
of only the first screen; and the phone/wide boundary under zoom is pinned by tests. (A scroll container inside the
document, such as a dialog's own scroll, is a separate cause and stays out of this round, K4.)

## Causes and required outcomes

`<run>` is `codex-round-compare-fullpage`. The concept for every check below is the Owner Eclipse concept at the build
branch's `fedbdb6d`, extracted once into the run folder with `git archive fedbdb6d design-research/owner-composition-exploration-r04/directions/eclipse` from
this worktree (the repository's objects are shared). Run compare as SKILL.md §"Compare" says, on the ports 3176-3177.
"Phone" is compare's `phone` size (390 x 844) and "desktop" its `desktop` size (1440 x 900).

- **C1.** `captureComparison` takes `page.screenshot({ fullPage: false, … })`
  (`.agents/skills/verify-fitway/comparison-capture.mjs:66-80`), so a settled comparison covers the viewport only. At
  phone size Settings' document is 1654 px tall against an 844 px viewport (measured at `fedbdb6d`): 810 px of it are
  never compared. Outcome: a settled comparison covers the document's whole scrollable area at the item's viewport
  width. A pixel difference anywhere in it gives `COMPARE DIFFERENT`, and its region in `comparison.json` is in document
  coordinates (y from the document's top). Two sides whose document sizes differ give `COMPARE DIFFERENT` and name both
  sizes. With no difference, the same items give `COMPARE EQUAL` on two consecutive runs. Check, on `settings.html`,
  `--feature page`, phone, Arabic and English: a candidate copy with (a) a change only below the first screen, (b) a
  change only in the document's last 24 px, (c) the document 1 px taller, each `COMPARE DIFFERENT` with the region or
  sizes named; the unplanted copy against the extracted concept `COMPARE EQUAL` twice. Settings is only two screens
  tall, so also: on a page at least four viewports tall at phone size (both sides' copies may lengthen the same page
  with the same added content), a plant in each non-overlapping 844 px band, one band per run, each `COMPARE
  DIFFERENT` with its region inside that band. Intent: content anywhere below the first screen can no longer change
  unseen; a plant inside the first screen, or only in the first and last screens, would not prove it.
- **C2.** The capture must not change the page it judges. Outcome: during a settled capture the page sees no change of
  its viewport (`innerWidth`, `innerHeight`, `visualViewport` width and height), no `resize` event and no change in
  which media queries match; every element's border box is the same before and after the capture to 0.00 px; after
  it, the scroll position, the focused element and the selection are what they were before it. Fixed and sticky
  elements appear in the picture as the reader sees them at the scroll position each part was taken from, and
  SKILL.md §"Compare" says how they appear. Check: a probe script in the run folder records those values around one
  capture of `settings.html` at phone and desktop and of `index.html` (Daily) at phone, Arabic and English, and lists
  every value that changed (none). And an independent pixel check: on a page with a fixed or a sticky element at phone
  size (Daily's, or the same element added to both copies in the run folder), each part of the settled picture equals,
  pixel for pixel, a plain viewport screenshot taken with the page scrolled to that part's position, so a fixed or
  sticky element that is missing, frozen at the top or misplaced fails. Intent: compare judges what a reader sees, not a page re-laid out for the screenshot
  (a capture beyond the viewport can resize it and re-lay out `vh` units and fixed elements); its approach is yours.
- **C3.** Outcome: for a document no taller and no wider than its viewport, the settled picture has the same dimensions
  and the same pixels as the baseline tool's capture: `settings.html` at desktop (its document is exactly 900 px tall)
  and `index.html` at desktop, Arabic and English, captured once with this worktree's tool at `9db242bb` and once with
  the changed tool. Intent: a page that fits its screen is judged exactly as before.
- **C4.** Baseline captures are cached and reused by bundle (SKILL.md §"Compare", "Baseline captures are kept in
  `D:/fitway-verify-captures`"). Outcome: no bundle captured by the viewport-only capture is reused after the change: the
  first run after it prints `BASELINE CAPTURES` with 0 reused for items the cache held from before it, and a second
  identical run reuses every one of them; after the first run the stored baseline images of those items have the
  document's size (390 x 1654 for Settings at phone), not the viewport's. Intent: a first-screen baseline is never
  compared with a whole-page candidate, whatever the counters say. Run it with the cache on and say which part of the bundle's identity the change moved.
- **C5.** `featureUnreachable` and `contextOptions` (`.agents/skills/verify-fitway/drive-plan.mjs:20-25` and `:43-55`)
  decide phone and wide features and the mobile flag from the CSS width (the width divided by the zoom); the coordinator's record calls
  the 720-721 px boundary under zoom untested (r04 resume point, "the grader's … L8, a 720-721 px zoom edge, untested";
  the grader's own text was not found). Outcome: ladder tests, calling these functions directly, pin at zoom 1 and zoom
  2 the CSS widths 720 and 721 (and one fractional width between them at zoom 2): a `widths: "phone"` feature is
  reachable at 720 and not at 721, a `widths: "wide"` one at 721 and not at 720, and `mobile` is true only for touch at
  720 CSS px or less. CI runs the ladder without a browser, so also a script in the run folder, run and reported, that
  plans and opens a real page through the tool's own planner and context options at zoom 1 and 2 for viewports giving
  720 and 721 CSS px, and records both the plan's phone/wide decision and whether the page matched `(max-width:
  720px)`; they agree in every case. If today's code disagrees, fixing it is in scope; say so in the report. Intent:
  the page's own `max-width: 720px` boundary and the tool's plan agree under zoom, in the call path compare uses.

Limits the result keeps:

- **K1.** The timeline samples (`timeline.mjs:748-752`) and ordinary drive's screenshots (`runner.mjs:231-235`) are
  unchanged from the baseline, and SKILL.md §"Compare" says the timeline samples cover the viewport only.
- **K2.** No tolerance is added anywhere: equality stays exact in pixels and dimensions.
- **K3.** The capture adds no styles, DOM elements or attributes (SKILL.md §"Compare" says so today and still does).
- **K4.** SKILL.md §"Compare" states what is compared: the whole document, how fixed and sticky elements appear, and
  what is not (content inside a scroll container other than the document, such as a dialog's own scroll; the timeline
  samples). No text is kept twice.
- **K5.** `pnpm verify:fast` passes in the worktree after the commit; the test at `cli.test.mjs:2580-2660` that pins
  `fullPage: false` pins the new capture instead; `pnpm check:tooling-map` passes (regenerate with `pnpm map:tooling`
  if the callables change). No giant-file, ratchet or check limit is loosened.

## Scope

You may change `.agents/skills/verify-fitway/comparison-capture.mjs` (must change), `.agents/skills/verify-fitway/SKILL.md`
(must change), `.agents/skills/verify-fitway/cli.test.mjs` (must change), a new or existing test file for C5 under
`.agents/skills/verify-fitway/`, `.agents/skills/verify-fitway/drive-plan.mjs` only if C5 finds it wrong, the file
that builds a baseline bundle's identity if C4 needs it, and the generated tooling map; commit once when done.
Everything else is read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before
you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of C1-C5 and K1-K5. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed, anything you could not do, and the wall time of one compare run
(`settings.html`, `--feature page`, desktop and phone, Arabic and English, cache off) before and after the change,
three runs each, alternating, with the median and range.
