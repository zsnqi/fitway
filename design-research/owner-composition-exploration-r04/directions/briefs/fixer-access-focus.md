<!-- brief-format: v1 role: fixer -->
# Fixer brief: Access's focus ring back to the keyboard, and two stale spec lines (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Opus, medium). Concept-only. A mechanical edit with a frozen target; make no
design decision. If the target below does not produce the outcome, stop and report instead of choosing another.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `5f84c98`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Read first, only these:** the review `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md` (F1, F2); in
  `design-research/owner-composition-exploration-r04/directions/eclipse/` ("the folder"), `access.css` lines 1-70,
  160-190 and 265-275, `DESIGN-SPEC.md` rows DLG-8 and EMP-6, and the header comment of `activity.js` (lines 1-30).

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

- Port 3176 only. Frames and scratch under `D:/fitway-temp/owner-r04-access-focus/`.

## The edit

1. **F1.** In `access.css`, every focus rule that `376c845` turned from `:focus-visible` or `outline: none` into a
   plain `:focus` ring becomes the same rule on `:focus-visible`, declarations unchanged: `.acc :focus`,
   `.acc #main:focus`, `.acc .fw-mi:focus`, `.acc .h-status:focus` (lines 19-20), `.acc-card:focus` (56),
   `.acc-title:focus`, `.prs-name:focus` (61), `.done:focus`, `.acc-alert:focus` (169), `.acc .dlg-head h2:focus` (184),
   `.acc-msg:focus` (270). Add no `outline: none` rule that could beat a `:focus-visible` ring (the first build's F1).
   Why: the ring marks where keyboard focus went; a mouse click or a tap must not leave one (EMP-6). Activity log's
   rules are not touched: its arrival ring is intended.
2. **F2.** DLG-8 in `DESIGN-SPEC.md` describes the reason as optional, as built (at most 240, «السبب (اختياري)»);
   `activity.js`'s header comment says the reason is optional and lists the `record=<id>` query beside the others.
   Comments and spec text only.

## Outcome to check

Over HTTP and from `file://`, AR and EN, at 1440 and 390 (touch): a mouse click or tap leaves no ring on the clicked
button, on the opener after a dialog's Cancel, on the copy control, or on the one-time view's title; by keyboard
(Tab, Enter, Escape) a ring shows on every element focus reaches, including the one-time view's title, the done
sentence, a card alert, and the first-load message after a retry by keyboard. `node tools/lint-spec.mjs`,
`node tools/check-index.mjs`, `node tools/build-index.mjs --check` and `access-capture.mjs` pass (regenerate INDEX.md
with the command at its top if line numbers moved). One commit; `git status --short` empty after.

## Report

Each edit in a line; the outcome check's result per case with the frame names in
`D:/fitway-temp/owner-r04-access-focus/`; the commit SHA. At most 15 lines.
