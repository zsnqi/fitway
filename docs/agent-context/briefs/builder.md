<!-- brief-format: v1 role: builder -->
# Builder brief: <title> (<milestone-id>)

For a fresh `owner-direction-builder` (Opus, high). The decision is made; build exactly it.

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
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

## The decision

<What the user decided, with the decision number and the exact renders they picked from.>

## Causes and required outcomes

- **<X>1.** <The cause, with `path:line`.> Outcome: <what the rendered page shows, at which sizes and states>.

## Frames

Render with the repository's `@playwright/test`, from <`file://` or the port named here>, at <sizes>, AR and EN,
in <states>. Inspect every frame yourself before reporting; a passing check is not a looked-at frame. (AGENTS.md)

## Scope

You may change `<paths>`; commit when done. Do not redesign beyond the decision; report anything that seems to need it. (CLAUDE.md)

## Report

Each outcome PASS or FAIL with its evidence; the frame paths, numbered; the files you changed; the commit SHA;
anything you could not do; anything the brief's rules produce that reads wrong, with the rule named
(WORKING_AGREEMENTS "Rules and findings"). At most 40 lines.

## Coordinator checklist (delete before launch)

- [ ] The decision is quoted by number, not paraphrased; the picked renders are named by path.
- [ ] `DO-NOT.md` is in "Read first" whenever copy or design is touched (r04 DECISIONS item 3).
- [ ] Every field is a pointer (path and §heading, row IDs, decision numbers); nothing is pasted from a source.
- [ ] `pnpm brief:check <this file>` passes against the worktree it names.
