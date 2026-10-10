<!-- brief-format: v1 role: codex -->
# Codex brief: the press the user tried, one step for a new control, and a check that guards it (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e217534d`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 41, 42 and 43, and "How this milestone's rounds run"
  items 3 and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/codex-press-hook.md`
  (the previous round's goal and outcomes P1-P5); in the folder below, `DESIGN-SPEC.md` rows MOT-1, MOT-11, MOT-18,
  MOT-20, STA-16 and FOC-8. "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- **Your temp folder** is `D:/fitway-temp/owner-r04-press-hook-2/`. Set `PROBE_OUT` to a folder inside it before you
  run the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git
  commit` and anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git)
  fail inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Tools.** Run these read-only from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04`
  at `59d9d011` or later. Never edit them.
  - The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`. It reports six
    `outline-without-ring` findings, all on regions that only script focuses; they stay.
  - The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`, guide in its `SKILL.md`. Its
    held-press capture counts a hover as a press (F115): measure held looks with your own mouse hold, after the hover
    has settled. Headless Chromium never shows `:active` under an emulated touch. Ports 3176-3177 only. If one is held
    by a process you did not start, never stop it.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop 1440×900 and phone
  390×844; normal and forced colours; motion on, reduced, and `?motion=off`.
- **The target** is the folder at `3b673daa`, the build the user tried on both phones; **the base** is the HEAD above.
  Take both from your own `git archive`. Port 3180 serves this worktree to the user's phones: leave it running.

## Goal

The press is the one the user tried and accepted on their iPhone and Android phone (`3b673daa`, DECISIONS 43), in CSS
those phones already run. A new control still gets it in one step, and a check, not a new mechanism, catches the
omission the previous round set out to prevent. B6 is relaxed for one separate defect, R5, graded on its own.

## Causes and required outcomes

- **Cause.** The previous round (`348ca375..eb18b17a`) met its rows by moving the press's light into a static
  additive CSS animation on every pressable control (`style.css` §"the press", `animation: press-face ... !important`,
  `animation-composition: add`, CSS nesting, `var()` inside keyframes). An independent review found two costs:
  - any CSS animation a later screen gives a control is silently dropped;
  - the press now relies on CSS features nobody measured in Safari, while the user accepted the earlier mechanism on
    an iPhone.
  The earlier mechanism's own weak point remains: a control whose shadow rules must repeat the press layer loses its
  light if a later rule leaves the layer out, and nothing catches it.
- **R1. The press the user tried.**
  - **Outcome.** For every control that has the press, on the five pages, in Arabic and English, at 1440×900 and
    390×844, in normal and forced colours, its frame at rest, hovered, held (mouse, hover settled first), and 60 ms
    and 200 ms after release equals the target's. With reduced motion and `?motion=off`, held shows no scale and the
    release is instant. The folder's CSS uses no nesting and no `animation-composition`, and the press sets no
    `animation` property on any control.
  - **Intent.** What the user felt on both phones is what the concept keeps, in CSS their browsers support.
- **R2. One step for a new control.**
  - **Outcome.** `data-press` with the previous round's five kinds (`dark`, `option`, `chalk`, `tile`, `square`)
    gives a new control its kind's press, with no edit to a selector list. The components sheet's specimens carry
    their `data-press` kind, so the markup holds a real example. A scratch page outside the folder shows each kind
    held and nothing at rest. A CSS animation given to a control in that scratch page still runs.
  - **Intent.** The Settings round applies the press in one step, and later screens keep their own animations.
- **R3. A check that guards the layer.**
  - **Outcome.** A new script in the folder's tools fails when a CSS rule gives a pressable control (a listed class
    or `[data-press]`) a `box-shadow` without the press layer, names the file and line, and passes on the folder. It
    ships with a planted-defect test: a copy with one such rule's layer removed fails.
  - **Intent.** The omission is caught when it is written, not found later on a phone.
- **R4. The record.** `DESIGN-SPEC.md` MOT-20 or STA-16 and `README.md` §"Motion" state:
  - the one step, and that the components sheet holds the examples;
  - where `data-press="tile"` goes, since the light falls on the tile inside a link;
  - that `option` treats a choice as chosen through `aria-pressed` or `aria-checked`;
  - that a Working control opts out through `aria-disabled`;
  - that a control's own `box-shadow` lists the press layer last, which the new check enforces.
  - **Intent.** A builder of the next screen follows it without reading the stylesheet.
- **R5. A chip's icon in high contrast** (a separate defect, present before this round). In forced colours, a busy
  level's chip ("Packed" / «شديد الازدحام» and its siblings, `app.js` levels) shows an empty icon slot.
  - **Outcome.** In forced colours each level chip's icon shows in a system colour, in Arabic and English; in normal
    colours nothing changes.
  - **Intent.** A high-contrast user sees the same signal as everyone else (FOC-8).

## Limits the result keeps

- **L1. Rest is unchanged.** In normal colours, mouse at rest, reduced motion, `compare` against the target on every
  page and the components sheet, in both languages, at desktop, tablet and phone, shows EQUAL.
- **L2. Hover is unchanged** on every control, with a mouse; touch leaves no hover style.
- **L3. The moments still run.** The export's done state, Daily's status popover, the retries, Access's arrival and the
  dialogs' opening and closing run as at the target, at full motion.
- **L4. The checks pass.** The concept CSS check reports only its six findings; in the folder `node tools/lint-spec.mjs`,
  `node tools/check-index.mjs` and `node tools/build-index.mjs --check` pass, `node --check` passes on every script,
  the new check and its test pass, and the CLI's `drift` passes on the folder's recipes.
- **L5. The index is current.** `INDEX.md` is regenerated with the command at its top if anything it lists changed.

## Scope

You may change, in the folder: the CSS files, `components.html` and `components.js` where a specimen carries
`data-press`, the file that draws the level chips' icon where R5 needs it, a new script and its test under the
folder's tools, `DESIGN-SPEC.md` (MOT-20, STA-16, FOC-8), `README.md` §"Motion", and `INDEX.md`. Scratch pages stay in
the temp folder. Commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be
met, do not work around it: finish and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- the one step a new control takes, in a sentence;
- the new check's command;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
