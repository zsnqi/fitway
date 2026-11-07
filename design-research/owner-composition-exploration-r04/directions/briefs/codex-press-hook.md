<!-- brief-format: v1 role: codex -->
# Codex brief: the press as one pattern a new screen applies in one step (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `3b673daa`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 41 and 42, and "How this milestone's rounds run" items
  3 and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/css-round-spec.md`
  §"Implementation Decisions" (the paragraph on the pressed state) and user story 37; in the folder below,
  `DESIGN-SPEC.md` rows MOT-1, MOT-11, MOT-18, MOT-20 and STA-16, and `style.css` §"the press" (its opening comment).
  "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- **Your temp folder** is `D:/fitway-temp/owner-r04-press-hook/`. Set `PROBE_OUT` to a folder inside it before you
  run the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git
  commit` and anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git)
  fail inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Tools.** Run these read-only from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04`
  at `f642dbf7` or later. Never edit them.
  - The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`. At the base it reports
    six `outline-without-ring` findings, all on regions that only script focuses; they stay as they are.
  - The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`, guide in its `SKILL.md`. Its
    held-press capture is not reliable with a mouse: it reads the "before" style before the pointer reaches the
    control, so a hover counts as a press (F115). Measure held looks with your own mouse hold, taken after the hover
    has settled. Headless Chromium never shows `:active` under an emulated touch. Use ports 3176-3177 only. If one is
    held by a process you did not start, never stop it.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop 1440×900 and phone
  390×844; normal and forced colours; motion on, reduced, and `?motion=off`.
- **The base** is the folder at the HEAD above, from your own `git archive`. Port 3180 serves this worktree to the
  user's phones; leave it running.

## Goal

The press (MOT-20, STA-16) looks and behaves exactly as it does now, and the next screen (Settings) gets it in one
step. B6 holds: this is one change, aimed at one cause.

## Cause and required outcomes

- **Cause.** The press is spread out, so it is easy to lose:
  - A control kind gets the press only by being added to about eight selector lists in `style.css` §"the press"
    (about lines 1398-1530).
  - Keys that draw their own shadow repeat the press's inset layer in their own shadow rules: `activity.css` about
    18-29, `reports.css` about 103, 146 and 167-168, `components.css` about 179, and `picker.css` about 66. A later
    shadow rule that leaves the layer out silently removes the press's light and its release fade.
- **P1. One step for a new control.**
  - **Outcome.** A new control gets the press without anyone editing a selector list, either by what it is or by one
    hook it carries, together with at most the name of its kind: dark key, option of a lit group, chalk key, current
    tile, or small square. Show it with a scratch copy of a page, outside the folder, that adds a new button of each
    kind using only that step: each one shows its kind's press when held and draws nothing at rest.
  - **Intent.** The Settings round applies the press without reading the whole stylesheet (spec user story 37).
- **P2. A control's own shadow cannot remove the press.**
  - **Outcome.** No control's own shadow rule (at rest, hover, open or chosen) has to repeat the press layer. Show it
    with a scratch copy that gives one key of each kind a new `box-shadow` on hover with no press layer in it: held,
    each still shows its press light, and on release the light still fades over the same time as at the base.
  - **Intent.** A later style change to a key cannot silently switch its press off.
- **P3. The look is unchanged.**
  - **Outcome.** For every control that has the press, on the five pages, in Arabic and English, at 1440×900 and
    390×844, in normal and forced colours, its frame at rest, hovered, held (mouse, hover settled first), and 60 ms
    and 200 ms after release equals the base's. With reduced motion and `?motion=off`, held shows no scale and the
    release is instant, as at the base. Measure the noise between two captures of the base and state it.
  - **Intent.** This is a refactor: the user tried the press on both phones and accepted how it feels.
- **P4. What has no press still has none.** Disabled and Working controls, the charts' plots and the light tuner show
  no press, as at the base. The browser's tap flash stays removed on exactly the same controls as at the base, and the
  page still registers its touch listener.
  - **Intent.** The exclusions and the iPhone's condition (MOT-20) survive the move.
- **P5. The record says the one step.** `DESIGN-SPEC.md` MOT-20 or STA-16, and `README.md` §"Motion", say how a new
  control gets the press and name the kinds.
  - **Intent.** A designer or builder of the next screen follows it without asking.

## Limits the result keeps

- **L1. Rest is unchanged.** In normal colours, mouse at rest, reduced motion, `compare` against the base on every
  page and the components sheet, in both languages, at desktop, tablet and phone, shows EQUAL.
- **L2. Hover is unchanged** on every control, with a mouse, as at the base; touch leaves no hover style.
- **L3. The checks pass.** The concept CSS check reports only the six findings above; in the folder
  `node tools/lint-spec.mjs`, `node tools/check-index.mjs` and `node tools/build-index.mjs --check` pass, `node --check`
  passes on every script, and the CLI's `drift` passes on the folder's recipes.
- **L4. The index is current.** `INDEX.md` is regenerated with the command at its top if anything it lists changed.

## Scope

You may change, in the folder: the CSS files, the pages' HTML and `.js` only where a control needs the hook,
`DESIGN-SPEC.md` (MOT-20, STA-16), `README.md` §"Motion", and `INDEX.md`. Scratch copies stay in the temp folder.
Commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- the one step a new control takes, in a sentence;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
