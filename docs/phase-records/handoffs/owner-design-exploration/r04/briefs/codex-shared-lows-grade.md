<!-- brief-format: v1 role: codex -->
# Codex brief: grade shared-lows by running these checks (owner-design-exploration-r04, shared-lows-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-shared-lows-grade/wt`, branch `grade-shared-lows`, HEAD `89b9d814`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 67 and 74 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-shared-lows.md`, whole (the round you grade; your contract is G1-G11 below);
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.

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

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output (pnpm, Playwright, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, probes, crops and logs in
  `D:/fitway-temp/owner-r04-shared-lows-grade/`.
- **Tools.** The verify-fitway CLI, read-only, from the coordinator's worktree: `node
  D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/cli.mjs`, ports 3186-3187
  only; if one is held by a process you did not start, never stop it; ports 3174 and 3180 serve the user's preview.
  Another grader runs on this machine meanwhile: record the load beside every timed or compared run.
- **The base** is the concept folder `design-research/owner-composition-exploration-r04/directions/eclipse/` at
  `23314b3a`, the result the same folder at `89b9d814`; take each with `git archive` and extract it outside every
  git tree.
- **Your report names no commit by its SHA and holds no hexadecimal word of seven or more characters:** call the
  graded commit "the result HEAD", and name folders without their hash parts. The launcher's claim check reads any
  such word as a commit claim and would refuse a grader's report (F258). You make no commit, in any folder, and run no
  ladder.
- **Look at the frames** you cite for S2, S3 and S4: open the PNG crops yourself and say what you saw.

## Goal

The coordinator knows, row by row, whether the delivered concept holds on checks its own run did not make.

## Causes and required outcomes

- **G1. What each action ends.** Outcome: `list` on the four pages shows `changesState` only on Access's
  `record-navigation`; every `ends` entry matches a before rule, and none ends a rule its own action does not change:
  a language feature ends only the language it leaves, a page-retry only `state=error` (and a fail switch it clears, if
  any), never `motion=off` or a `lang` rule; judge Access's `refused-staff_pin_already_active` ending `pin=none` and
  Activity's `clear-search` ending its two find rules from what each action does in the page's script (quote the
  lines). Intent: the frames keep proving what the action leaves alone.
- **G2. A kept rule still fails when broken.** Outcome: a self-compare of Access `page-retry` (Arabic, desktop,
  reduced motion) shows `afterFrameProof` naming the motion and language rules it keeps, and your own planted break of
  the motion rule's proof in a scratch copy fails at the after frame; then for each of the other fourteen features with
  `ends`, a self-compare shows its `afterFrameProof`, and a planted break of one rule it keeps fails at the after
  frame (report each). Intent: as G1.
- **G3. The recipes changed only there.** Outcome: per page, the rule and feature counts at the base and the result
  are equal, and the recipes' diff touches only `changesState` and `ends` lines. Intent: nothing else was loosened.
- **G4. The rail's ring.** Outcome: on each of the five pages, Tab to each rail item, collapsed and open rail, desktop
  and tablet, Arabic and English: the item's computed outline is none or transparent and its tile shows a visible 2 px
  ring, confirmed on the rendered frame; a button
  inside Access's content still shows its 2 px ring at a 3 px offset; in forced colours the tile ring is `CanvasText`
  and the item shows no second ring. Intent: one ring per control.
- **G5. Rings after a pointer.** Outcome: Access's desk retry in its failed state (`fail=1`): after a mouse click the
  desk title holds focus and shows no ring; after Enter it shows the ring; after a tap on the phone in Arabic it shows
  none. Daily's page-retry: by keyboard the ring shows where focus lands, by mouse none. Intent: a finger leaves no
  ring; a key always does.
- **G6. Phone and tablet coverage.** Outcome: for every place the report's S3 lists, run key, mouse and touch on the
  phone in Arabic and English (the report covered six phone placements); report each place's result, and every place
  where a pointer or touch leaves a ring or a key leaves none; then every `focus()` call in the five pages' scripts that
  the report's list does not name (`git grep`), by key, mouse and touch, desktop, Arabic. Intent: S3 holds at the phone size the demo shows.
- **G7. Ring-only differences.** Outcome: for the 122 differing items of the report's all-features compare (its
  `D:/fitway-temp/owner-r04-shared-lows/s4-all-features/comparison.json`) and the 264 differing timeline samples (`D:/fitway-temp/owner-r04-shared-lows/s5-access-focus/comparison.json`), with
  your own mask of each focused element's ring band only (from its border box grown by the outline offset to that
  box grown again by the outline width, from the computed styles), no pixel outside the band differs, the element's
  own interior included; report the count checked and every exception with its crop. Intent: only the ring
  changed (the report says no mask pass was run).
- **G8. The spec.** Outcome: OWN-C9 no longer says programmatic focus always shows its ring and states the input rule;
  FOC-1 is unchanged. Intent: the spec says what the pages do.
- **G9. `motion.js`.** Outcome: say what the 13 added lines of `motion.js` do, which S outcome needs them, and whether
  a press, its release light or any moment's timing changes (a self-compare of Daily's press moments, Arabic, desktop,
  full motion, against the base); if the added lines run on any path other than focus, compare that path's timeline on
  every page it reaches, Arabic and English, reduced and full motion. Intent: no moment changed beyond the rings.
- **G10. Untouched records.** Outcome: `git diff --name-only` between the base and the result lists only files inside
  the concept folder that the round's Scope allows; `HISTORY.md` and the evidence folder are byte-equal to the base; the checks the
  shared-frame brief's L1 names pass on the result. Intent: only the concept's own files changed.
- **G11. Report against commands.** Outcome: the result's commit exists and is your HEAD, and the round's run folder
  (`D:/fitway-temp/codex-round-bd3edec8-d939-4284-b853-7e796d42c26c/`) records a successful `git commit` whose output
  names the result HEAD (say so, without writing its SHA). Intent: the report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; plants go in scratch copies outside the worktree; everything you keep goes in
`D:/fitway-temp/owner-r04-shared-lows-grade/`. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G11 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed and its crop; anything you could not run.
