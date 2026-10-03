<!-- brief-format: v1 role: designer -->
# Designer brief: <title> (<milestone-id>)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. This round shows the user options and stops; a builder builds the pick.

- **Worktree:** `D:/Projects/fitway-worktrees/<worktree>`, branch `<branch>`, HEAD `<short-sha>`
- **Milestone:** `<milestone-id>`. Decisions: `<repo path to DECISIONS.md>` items <n, m>.
- **Read first, only these:** `<repo path>` §"<heading>" or rows `<ID, ID>`; one line each.

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

- Run `pnpm check:design-context` and `pnpm context:show --milestone <milestone-id>` first. Impeccable is the one
  design skill; load no other design or taste skill. (AGENTS.md)

## The open question

<What the user has to decide, and why it is open: the observed problem, with the frame or row that shows it.>

## Constraints

- <Decision numbers and spec rows that bind, as pointers. `DO-NOT.md` binds in full.>

## Deliverable

<Two or three> genuinely different options, each rendered as real pages at <sizes>, AR and EN, in <states>. Number
every crop the same way across options so the user can compare them. No recommendation is needed; say where an
option breaks.

Write options only under `<path>`; commit when done.

## Report

Per option: one line on the idea, its frame paths, and where it breaks. Any rule or decision that makes an option
read wrong, named (WORKING_AGREEMENTS "Rules and findings"). The files you changed; the commit SHA. At
most 40 lines.

## Coordinator checklist (delete before launch)

- [ ] The question is open; no option is prescribed. Examples, if any, are marked as examples.
- [ ] The sizes match r04 DECISIONS item 2 (1440, 768, 390 designed; 320, 1024 and 200% zoom checked).
- [ ] Every field is a pointer (path and §heading, row IDs, decision numbers); nothing is pasted from a source.
- [ ] `pnpm brief:check <this file>` passes against the worktree it names.
