<!-- brief-format: v1 role: codex -->
# Codex brief: probe kit and index repairs (owner-design-exploration-r04, round nav-4)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-nav`, branch `owner-r04-nav`, HEAD `0c51f7c`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 2 and 3 (§"How this milestone's rounds run").
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/README.md`;
  `design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs`;
  `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-3-probe-kit.md` and
  `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-2-index.md` (what each tool must
  already do; it still must).

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- A local server uses port 3178 or 3179.

## Goal

The probe kit finds text that runs past its own box anywhere on a page, can be run from any worktree, and explains a
busy port; the index lists every named function.

## Causes and required outcomes

- **T1.** `overflowProbe` (`design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/lib.mjs:267`)
  checks a fixed list of classes, clipped elements and the viewport edges, so a word that runs past its own box while
  staying inside the viewport goes unseen. Outcome: it reports every element whose text runs past its own box, on any
  element and in either writing direction, naming the element and by how much; everything it reports today it still
  reports. Show it on a page you plant the defect in, over `file://` and HTTP.
- **T2.** The probe kit's README gives its run line as an absolute path into this worktree. Outcome: the run line works
  unchanged from any worktree of this repository.
- **T3.** A port already in use fails with Node's raw `EADDRINUSE`. Outcome: the kit says which port is busy and how
  to choose another (`PROBE_PORT`), in one line, and exits non-zero.
- **T4.** `build-index.mjs` indexes a function only when it is a declaration or a `const`, so a function bound with
  `let` (`design-research/owner-composition-exploration-r04/directions/eclipse/tuner.js:186`) is missing. Outcome:
  every named function binding is indexed whatever declares it; `INDEX.md` in the eclipse folder is regenerated and
  `node design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs --check` passes.

The kit runs as its README says, over `file://` and over HTTP; the index tool runs as
`node design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs` with or without
`--check`. Biome's config excludes `design-research/**`; do not require it.

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/tools/**` and
`design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; commit once when done. Everything
else is read-only, including the pages the probes measure. Add no dependencies. Output stays outside any git tree.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.
