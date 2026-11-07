<!-- brief-format: v1 role: fixer -->
# Fixer brief: every dialog's buttons at the inline start (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Opus, medium). Concept-only. A mechanical edit with a frozen target; make no
design decision. If the target below does not produce the outcome, stop and report instead of choosing another.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `5c2106b`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Decision:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 35, read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** in `design-research/owner-composition-exploration-r04/directions/eclipse/` ("the
  folder"), `reports.css` around line 345 and its 720 px and 400 px rules for `.dlg-foot` (about 494-506),
  `components.css` line 214, `DESIGN-SPEC.md` row DLG-2 and any other row that says where a dialog's actions sit.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Port 3176 only. Frames and scratch under `D:/fitway-temp/owner-r04-dialog-start/`.

## The edit

1. `reports.css:345`: `.dlg-foot` takes `justify-content: flex-start` instead of `flex-end`. Every page's dialogs use
   this rule (Reports, Activity log, Access; the markup already puts Cancel first, then the primary). At 720 px and
   below the buttons keep filling the width as they do now.
2. `components.css:214`: `.cx-panel-foot` the same, so the component sheet draws what the pages build.
3. `DESIGN-SPEC.md`: DLG-2's foot reads "actions at the inline start (the right in Arabic, the left in English),
   Cancel first, then the primary (DECISIONS item 35)", and any other row that places a dialog's actions at the end
   or the primary last says the same. INDEX.md regenerated with the command at its top if lines moved.

Why: the user decided that a dialog's buttons start where its text starts, Cancel first, so a destructive primary is
not the first thing the eye reaches.

## Outcome to check

At 1440 and 768, AR and EN, over HTTP: in every dialog of Reports (the custom period, the minute export in each
state), Activity log (the dates), and Access (each confirmation, the code's two steps, add owner, reset, change my
password), the first button's start edge lines up with the dialog body's start edge (the title, text and fields),
Cancel (or Close, or Cancel change) first, the primary after it; a dialog whose foot holds one button has it at the
start. At 390 and 320 the foot is unchanged from `5c2106b`. Daily, the pages at rest and every non-dialog element are
unchanged: compare frames against `5c2106b`. The double tap on «متابعة» still never commits (Access's guard).
`node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, `access-capture.mjs`
and `states-capture.mjs` pass as at `5c2106b`. One commit; `git status --short` empty after.

## Report

Each edit in a line; the measured start-edge offsets per dialog (AR and EN at 1440); which frames differ from
`5c2106b` and why; a few named crops in `D:/fitway-temp/owner-r04-dialog-start/`; the commit SHA. At most 20 lines.
