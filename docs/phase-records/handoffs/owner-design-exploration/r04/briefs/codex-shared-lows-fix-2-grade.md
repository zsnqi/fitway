<!-- brief-format: v1 role: codex -->
# Codex brief: grade shared-lows-fix-2 by running these checks (owner-design-exploration-r04, shared-lows-fix-2-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-shared-lows-grade/wt`, branch `grade-shared-lows-fix-2`, HEAD `538b280a`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 67 and 74 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-shared-lows-fix-2.md`, whole (the round you grade: P1-P4 and L1-L4; your contract is G1-G11 below);
  - `D:/fitway-temp/codex-round-036b9ba0-94ca-452f-9036-2b9c9aaa6768/last-message.md`, whole (its report);
  - `D:/fitway-temp/codex-round-8395d9ec-800f-4f8f-af3b-10a45cfa7218/last-message.md`, rows G4, G6, G7 and G14 (the grade this round answers);
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
  `D:/fitway-temp/owner-r04-shared-lows-fix-2-grade/`. You make no commit, in any folder, and run no ladder.
- **Tools.** The verify-fitway CLI, read-only, from the coordinator's worktree: `node
  D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/cli.mjs`, ports 3186-3187
  only; if one is held by a process you did not start, never stop it; ports 3174 and 3180 serve the user's preview.
  Another round runs on this machine: record the load beside every timed or compared run. A compare over many
  features and both colour modes needs `NODE_OPTIONS=--max-old-space-size=6144` and one run per language and colour
  mode; a single DIFFERENT can be the baseline's own instability (F262): rerun such an item baseline against baseline
  before you count it against the result.
- **The bases** are the concept folder `design-research/owner-composition-exploration-r04/directions/eclipse/` at
  `23314b3a` (before both rounds), at `9619f3ce` (this round's launch HEAD) and at `4cc2db93` (this round's commit; a
  review fixer's commit `538b280a` follows it); take each with `git archive` and extract it outside every git tree.
  The Daily page is `index.html`.
- **Look at the frames** you cite for G1, G2, G3 and G8: open the PNG crops yourself and say what you saw.

## Goal

The coordinator knows, row by row, whether the delivered concept holds on checks its own run did not make.

## Causes and required outcomes

- **G1. One ring on the brand item (P1).** Outcome: on each of the five pages, Tab to each rail item, `#brand`
  included, collapsed and open rail, desktop and tablet, Arabic and English, normal and forced colours: the item's
  computed outline style is none and its tile shows one 2 px ring (`CanvasText` in forced colours), confirmed on the
  rendered frame; focus returned to `#brand` by a script after Escape shows the same. Intent: one ring per control.
- **G2. Rings across pages (P2).** Outcome: list every navigation in the five pages' scripts and markup that places
  focus on arrival (source page, control, destination, focused element); for each, Arabic and English, desktop and
  phone where the control exists, normal and forced colours: Enter on the control leaves the ring on arrival, a click
  and a tap leave none; a page opened directly shows no ring until the first Tab, which shows one; over http the
  arrival URL holds no `focus-input` parameter after load. Intent: how focus got there decides its ring, across pages.
- **G3. A popup after a pointer (the review fix).** Outcome: every popup or menu that takes focus when it opens
  (`.fw-pop` and the phone's menu), on every page that has it: opened by a click or a tap it shows no ring, opened by
  Enter it shows the 2 px ring, in normal and forced colours. Intent: a finger leaves no ring.
- **G4. Changes beyond the rings (P3).** Outcome: with your own mask of each focused element's ring stroke (from its
  computed outline, offset and border radius), compare `23314b3a` with your HEAD for Access's `pinOff`, `off`,
  `reset` and `pinChange` and every other item of
  `D:/fitway-temp/owner-r04-shared-lows-grade/pixels/exception-catalogue.tsv` whose class is
  `outside-ring-away-from-edges`: no pixel outside the stroke differs; report the count checked and every exception
  with its crop. Intent: the rounds changed rings and nothing else a reader sees.
- **G5. The ring and the error colour, once (P4).** Outcome: list every declaration in the concept's CSS that draws
  a focus ring (an outline with a width, a style and a visible colour, a focus `box-shadow`, or a pseudo-element)
  under a focus selector or a specimen focus class: all in `style.css`, the error colour too; every invalid field's
  computed ring colour is equal in normal and forced colours; in a scratch copy a change of that one error-colour
  declaration changes every field's ring. Intent: a change to a ring is one edit.
- **G6. Rings after a pointer, kept (the earlier rounds).** Outcome: Access's desk retry in its failed state
  (`fail=1`): a mouse click leaves the desk title focused with no ring, Enter shows the ring, a tap on the phone in
  Arabic shows none; Daily's page retry: a key leaves the ring where focus lands, a mouse none. Intent: the fix kept
  what the earlier rounds delivered.
- **G7. One input tracker (Q1).** Outcome: `git grep` in the concept's scripts: one listener pair writes the
  last-input state, in `motion.js`, which alone writes and reads the `focus-input` URL parameter; no page script keeps
  its own; on Activity's `.ac-sel` and Reports' `#dl-sort` native selects, a mouse press then Tab shows the wrapper's
  ring, and a key then a mouse press hides it. Intent: one place decides which input came last.
- **G8. Frames since the round's launch.** Outcome: a fresh compare of the five pages, every feature, Arabic and
  English, desktop and phone, reduced motion, normal and forced colours, between your HEAD and `9619f3ce`: every
  differing item is a ring P1, P2 or the review fix changes (name which for each) or an item that also differs
  baseline against baseline; report the counts and look at three differing crops. Intent: nothing else moved.
- **G9. The timelines it left.** Outcome: the round's report lists 7 differing Access timeline samples (one-pixel
  field-edge ring segments) and 3 Activity `clear-search` samples not held in forced colours. Run each of those
  timelines twice on your HEAD against itself and once against `9619f3ce`: say whether each sample is held on your
  HEAD alone and whether its difference is a ring segment; quote the lines. Intent: the coordinator knows whether L1's
  gaps are real.
- **G10. Untouched records.** Outcome: `git diff --name-only 9619f3ce HEAD` lists only files inside the concept folder
  that the round's Scope allows; `HISTORY.md` and the evidence folder are byte-equal to `9619f3ce`; `check-concept-css.mjs`
  and the INDEX checks the shared-frame brief's L1 names pass on your HEAD. Intent: only the concept's own files changed.
- **G11. Report against commands.** Outcome: your HEAD is `538b280a`, whose parent is `4cc2db93`; the round's run
  folder (`D:/fitway-temp/codex-round-036b9ba0-94ca-452f-9036-2b9c9aaa6768/`) records a successful `git commit` whose
  output names `4cc2db93` and a passing CSS check before it with no edit between; `538b280a` changes only `style.css`
  and `motion.js`. Intent: the report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; plants go in scratch copies outside the worktree; everything you keep goes in
`D:/fitway-temp/owner-r04-shared-lows-fix-2-grade/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G11 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed and its crop; anything you could not run.
