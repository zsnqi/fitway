<!-- brief-format: v1 role: codex -->
# Codex brief: Daily's light tuner removed, its live moments kept for checks (owner-design-exploration-r04, tuner-removal)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `4352181f`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 44-47 and 50. The build branch's copy of DECISIONS.md is
  behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame.md`
    §"Causes and required outcomes" (F2, F3 and the reruns) and §"Limits the result keeps", which this brief reuses.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/tuner.js` lines 1-20 and 210-260.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/index.html` lines 30-40.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/daily.js` lines 450-530 and 2860-2910.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/style.css` lines 1-60 and 835-950.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json`, Daily's entry.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/tools/check-press-layer.test.mjs`, whole.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/findings.tsv`
    rows F126, F140, F148, F160, F164, F165 and F166.

"The folder" below is the Eclipse folder these files are in.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- **Your temp folder** is `D:/fitway-temp/owner-r04-tuner-removal/`. Set `PROBE_OUT` to a folder inside it before you
  run the folder's tools. Sandbox, escalation, hooks, tools and ways to open the concept: as in the shared-frame
  brief's same paragraphs, except that the CLI is at `6d472338` or later and your compares run on ports
  3188-3189 only, with `--workers 4`.
- **Known instabilities** (the findings rows F148, F160, F164 and F165 named above): an item or sample that is
  NOT-HELD, DIFFERENT or a problem on the base side as well, or that matches one of those rows, is reported with its row
  and not counted against T3; rerun it once, and report both runs.
- **The base** is the folder at the HEAD above. Take it from your own `git archive`, extracted outside every git tree.

## Goal

The user no longer needs the light tuner (decision 50): Daily loses the dashed "الإضاءة · Lights" button, the panel it
opens and everything that exists only for them, while every page looks, moves and behaves as at the base, and the
live moments the tuner's Motion group was the only way to start stay reachable for checks and recordings.

## Causes and required outcomes

- **Cause.** `tuner.js` (462 lines) builds a floating toggle and panel on Daily that override the lights' custom
  properties live, keep presets and stored tuning, and in its Motion group start Daily's live moments through
  `window.__eclipse.motion` (`step`, `reset`, `crowd`) and `window.__eclipse.intro`. 36 of Daily's 44 recipe features
  drive it, and its toggle's render is unstable between captures (F126).
- **T1. The tuner gone.**
  - **Outcome.** `tuner.js` is deleted and no file in the folder loads, styles, reads or describes the tuner, its
    toggle, panel, presets (`?preset`), switch (`?tuner`), stored tuning or Motion group, apart from `HISTORY.md` and
    the evidence folder, which keep their record. The static lights (LGT-1 to LGT-8) and their custom properties stay
    in `style.css` with the values they have at the base. Daily's recipes drop the 36 `tuner*` features and keep the
    other 8 unchanged; Reports 31, Access 46, Activity 30 and the components sheet 14 stay as they are. Report every
    remaining line in the folder that names the tuner, with why it stays.
  - **Intent.** Nothing of the tool is left to load, maintain or measure; what the owner sees was never the tool.
- **T2. The live moments still reachable.**
  - **Outcome.** A new reading, resetting the readings, and the crowd level going up and down across the nearest
    boundary, which today start only from the tuner's Motion group, start from a key press on Daily when a URL switch
    that `daily.js` reads is present, through the same `window.__eclipse.motion` calls the tuner's buttons make.
    Without the switch the page has no listener, element, text or announcement of it. Each of the four gets a recipe
    feature that the CLI drives with its actions and samples with `--timeline`; `README.md` names the switch and keys.
    Measured: each moment, started at the result by its key and at the base by the same `window.__eclipse.motion` call
    with `?tuner=0`, gives pixel-equal frames at 1 ms and every 20 ms until its last movement ends, Arabic and
    English, desktop and phone, full motion, from a script in your temp folder whose output you report.
  - **Intent.** The live update, the digit roll, the crowd bars and the live announcement stay checkable and can be
    recorded for the demo, without a visible tool on the page.
- **T3. Every page unchanged otherwise.**
  - **Outcome.** F2 and F3 of the shared-frame brief, run as written there with this round's base and result, hold
    on all five pages, except that on Daily an item may differ only inside the rectangle the tuner's toggle occupied
    at the base (measured from the base's page at each size and language), where the result shows what lay behind it;
    report each such item with its region. The tuner's own features are absent from the result's recipes and are not
    compared. Its reruns rule applies as written.
  - **Intent.** Removing the tool changes the pixels it drew and nothing else, at rest or in motion.
- **T4. The hook's configuration readable (F140).**
  - **Outcome.** The build branch's tracked `.impeccable/config.json` no longer starts with a byte-order mark and is
    otherwise byte-identical; `JSON.parse` of its UTF-8 text succeeds.
  - **Intent.** Impeccable's hook reads the tracked exceptions instead of rejecting the file as malformed.
- **T5. The branch's CI green (F166).**
  - **Cause.** The folder's press-layer check, named above, is a plain Node script with `node:assert`; its
    `*.test.mjs` name makes the fast ladder's Vitest collect it as a test file with no suite, so CI on this branch has
    failed since 2026-10-11.
  - **Outcome.** `node scripts/verify.mjs fast` passes on your committed tree, and the press-layer check still fails
    when one press layer is removed from a stylesheet (the planted defect the script checks today), run the way the
    folder's tools document it.
  - **Intent.** The branch's CI vouches for its commits again, and the press-layer guard keeps working.

## Limits the result keeps

- **L1. The checks pass.** As the shared-frame brief's L1, with every tool in the folder that drove the tuner either
  moved to T2's switch where its moment remains or, for the parts that captured the tuner itself, reported and removed.
- **L2. Only the folder and the hook's file.** `HISTORY.md` and the evidence folder are unchanged; outside the folder only
  `.impeccable/config.json` changes.
- **L3. A clean tree.** Scratch files and scripts live in your temp folder: `git status --short` is empty after your
  commit, and the commit adds no file outside the Scope.

## Scope

You may change, in the folder: `tuner.js` (delete), `index.html`, `daily.js`, `daily.css`, `style.css`,
`verification-recipes.json`, `README.md`, `INDEX.md`, `DESIGN-SPEC.md`, the capture scripts and the files under its
tools folder that name the tuner, the press-layer check (T5, which may be renamed); and `.impeccable/config.json` at the repository root. Commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then
stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it. Then: the switch and keys
you chose; the lines that still name the tuner; T3's Daily items with their regions; every rerun; the files you changed;
the commit SHA; anything you could not do; any hook message you did not act on. At most 30 lines.
