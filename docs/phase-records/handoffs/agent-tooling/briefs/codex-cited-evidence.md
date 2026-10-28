<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: cited evidence is never deleted, and loss is caught (agent-tooling-r01, round cited-evidence)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-cited-evidence`, branch `tooling-cited-evidence`, HEAD `f79adba4`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 15,
  16 and 17.
- **Read first, only these:**
  - `D:/fitway-temp/retro-20261028/gone-evidence/REPORT.md`: which cited paths are gone, and how each was lost.
  - `.agents/skills/gardener/CLEANUP.md`: the citation rule the survey and the cleanup share today.
  - `.agents/skills/gardener/survey-evidence.mjs:55-230`: how records and citations are collected.
  - `.agents/skills/gardener/remove-worktree.mjs`: worktree removal.
  - `D:/fitway-temp/cleanup-20261024/prune.mjs:1-30` and `:84-100`: the one-off prune's keep rule (outside the
    repository, read only).
  - `docs/agent-context/briefs/CODE_REVIEW.md`: D1-D8, which the diff is reviewed against.

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

- `<run>` is `codex-round-cited-evidence`. Never delete anything under `D:/fitway-temp` except what your own tests
  create inside the run folder; checks on real folders read them only.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

Nothing a tracked record cites under `D:/fitway-temp` is removed by the repository's own tools, and a citation whose
path is gone anyway is named, with its record and line, as soon as it is looked for.

## Causes and required outcomes

- **E1.** The prune that ran on 2026-10-24 never read citations: it kept files by extension and size, so three
  cited folders went whole and 28 cited files inside kept folders went (`.log`, `.cjs`, JSON over 64 KB, images no
  record named); the gardener prune promised by DECISIONS item 15 was never built (the report's §1 and §3).
  Outcome: the gardener gains that prune. For each top-level temp folder it proposes (it never runs it itself, as
  the cleanup does) to delete only files that no tracked record cites, by the file's own path or by a folder path
  above it when that folder is uncited; in a cited folder it keeps every file that is not a capture (image, video,
  trace, archive), whatever its extension or size, and every capture a tracked record cites or a kept text file in
  the folder names by file name. A tracked record is any tracked `.md`, `.yaml`, `.yml`, `.tsv` or `.txt` file (the
  survey's matcher reads only the first three today; `findings.tsv` and `rounds.tsv` are records), and a citation
  may name a file at any depth. Links are inspected and never followed, and registered worktrees withheld, through
  the same functions the cleanup and `remove-worktree.mjs` use (`inspectWorktreeLinks` among them), not new ones.
  The proposal names each folder, the bytes it frees and what it keeps. Check: a fixture temp root with the
  report's real loss shapes (a cited folder holding a `.log`, a `.cjs`, a 100 KB JSON and a PNG named only by a
  record outside the folder) keeps all four; an uncited capture beside them is proposed; an uncited folder holding a
  `.log` that a `.tsv` record cites by its nested path keeps that file; a link inside a folder is not followed; a
  registered worktree under the root is not proposed. Intent: space is freed only from what nothing cites.
- **E2.** Twelve cited paths went with `remove-worktrees.ps1` (a one-off script outside the repository) and fifteen
  with other grading-worktree removals (the report's §1). `remove-worktree.mjs` already refuses a tree with a staged,
  changed or untracked file (`.agents/skills/gardener/remove-worktree.mjs:55-66`), but `--exclude-standard` skips
  ignored files, where output folders sit. Outcome: it also refuses a worktree holding an ignored file a tracked
  record cites, by the file's path or a folder above it (the worktree's own path included), naming the file and the
  citing record and line; an uncited ignored file does not block. `CLEANUP.md` names `remove-worktree.mjs` as the
  one way to remove a worktree that may hold evidence. Check: extend the removal tests in
  `.agents/skills/gardener/round16b.test.ts` (or the file there that tests `removeWorktree`) with a cited ignored
  file (refused), a worktree cited by its own path holding an ignored file (refused) and an uncited ignored file
  (removed). Intent: removing a checkout cannot take evidence with it.
- **E3.** No check notices a citation whose path is gone; 22 cited folders and 62 cited files were found gone only
  by hand (the report's §1). Outcome: (a) the survey's report gains a section listing every cited `D:/fitway-temp`
  path, folder or file at any depth, that does not exist, each with its record and line, skipping a citation
  followed on its line by `(gone:` and a reason; (b) `pnpm check:repository` runs the same check on every tracked
  record when `D:/fitway-temp` exists: it fails naming each gone citation on a line that differs from `origin/main`,
  with the fix (correct the path, or mark it `(gone: <why>)`), and prints the count of gone citations on unchanged
  lines and the first five, without failing, until they are marked; it prints that it was not checked when the folder
  is absent, as in CI. Check: a fixture record citing a missing folder on a changed line fails (b) naming its line;
  the same citation marked gone passes; a missing nested file cited by a `.txt` record on an unchanged line is
  counted, not failed; a real survey run lists the report's gone folders and files. Intent: a lost or mistyped citation surfaces the day it is written, and old losses are
  listed until each is marked.
- **E4.** Scripts agents write in run folders are counted nowhere, so whether verify-fitway's new `run` command
  (round run-and-ref) removes the need for them cannot be seen (DECISIONS item 17). Outcome: the survey's report
  gains a section counting, for each top-level temp folder created since the previous report, the script files
  (`.mjs`, `.js`, `.cjs`, `.py`, `.ps1`, `.sh`) it holds outside `node_modules` and extracted Git trees, and the total;
  report only. Check: a fixture with two new folders, one holding three scripts in nested subfolders and an
  extracted tree and a `node_modules` with more, reports 3 and 0. Intent: the measure that tells whether the fix worked.
- **K1.** The cleanup's existing citation rule, refusals and tests stay as they are, and the survey's existing
  sections keep their content. `pnpm verify:fast` passes after the commit.
- **K2.** CI has no `D:/fitway-temp`: every test builds its own fixture temp root inside the run folder or the
  system temp folder.
- **K3.** No giant-file, ratchet, test floor or check limit is loosened; a fall is recorded with
  `pnpm code-health:baseline`; `pnpm check:tooling-map` passes (regenerate with `pnpm map:tooling`).

## Scope

You may change `.agents/skills/gardener/` (`remove-worktree.mjs`, `CLEANUP.md` and the survey modules must change; a new
prune module and test files go here), `scripts/verify-repository.mjs` and the modules it imports (must change),
`docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and `docs/agent-context/CODE_HEALTH_BASELINE.json` (both regenerated);
commit once when done. Everything else is read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it: the citation matcher in particular is the survey's, shared by all three outcomes. Your diff is
reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before you start. (agent-tooling
DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of E1-E4 and K1-K3. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed and anything you could not do.
