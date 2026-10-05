<!-- brief-format: v1 role: fixer -->
# Fixer brief: finish M1, the Copy label's place at rest (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Opus, medium). A mechanical finish with a frozen target; no design decisions.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD is this
  brief's own commit on top of `4850e58`.
- **The working tree holds an uncommitted edit** to `design-research/owner-composition-exploration-r04/directions/eclipse/access.css`
  (three lines after the `.acc-copy .cp-ico` rule). Codex wrote it for outcome M1 of `directions/briefs/codex-motion-lows.md`
  and ran out of its usage limit while checking it. Keep it; do not reset or stash.
- **Read first, only these:** `codex-motion-lows.md` outcome M1 and limits L1-L4; `git diff` of the working tree.

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

Output under `D:/fitway-temp/owner-r04-motion-lows/fixer/`. Port 3176 only.

## The target (frozen)

M1's intent, with the coordinator's correction: L1 said "sub-pixel" because the brief assumed a 2 px offset; the
measured offset is 6.328 px on English "Copy"'s icon. L1 and L2 allow M1's restoring move whatever its size, and only
that move.

1. At rest, before and after a press, Access's «نسخ» / "Copy" control has its label and icon where they were at
   `54b2737`, within 0.5 px, at 1440, 768, 390 and 320 px, AR and EN, from `file://` and over HTTP; its width
   unchanged from `4850e58`. Render the `54b2737` baseline from your own `git archive` of the folder.
2. "Copy" and "Copied" stay on one line, unclipped, at 320 px in English.
3. The roll from «نسخ» to «نُسخ» still runs as at `4850e58` (icon and word roll together), and reduced motion and
   `?motion=off` reach the same end state.
4. Every other page and moment unchanged from `4850e58`: `motion-capture.mjs` passes as it did there; `node tools/lint-spec.mjs`,
   `node tools/check-index.mjs`, `node tools/build-index.mjs --check` pass (regenerate INDEX with the command at its
   top only if lines moved).

If the edit misses a target, adjust only those three lines' rules; if no edit within `.acc-copy` meets it, stop and
report.

## Commit and report

One commit on the branch with your attribution line, not pushed; `git status --short` empty after it. Report each
target with its measure, files, SHA; at most 12 lines.
