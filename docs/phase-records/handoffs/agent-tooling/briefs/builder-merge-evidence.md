<!-- brief-format: v1 role: builder -->
# Builder brief: the pre-commit evidence check understands a merge (agent-tooling-r01)

For a fresh `owner-direction-builder` (Opus, high). The outcome is agreed (DECISIONS item 28); build it as written.

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-merge-evidence`, branch `tooling-merge-evidence`, HEAD `9a957324`
  (dependencies installed)
- **Milestone:** `agent-tooling-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `scripts/agent-environment/check-staged-evidence.mjs` (all);
  `.agents/skills/gardener/cited-evidence.mjs` lines 150-260 (`stagedLineNumbers`, `diffLineNumbers`, the changed-line
  matcher); `.agents/skills/gardener/staged-evidence-gate.test.ts` (how it builds a checkout and stages files);
  `.agents/skills/gardener/checkout-test-fixture.mjs`; `scripts/agent-environment/check-staged-briefs.test.ts` lines
  1-60.

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

## Why

The pre-commit job `staged-evidence` judges only lines a commit adds. It finds them with
`git diff --cached --unified=0` against HEAD (`stagedLineNumbers` in `cited-evidence.mjs`), and finds new files with
`git diff --cached --diff-filter=A` against HEAD (`changedFiles` in `check-staged-evidence.mjs`). In a merge, every
line and file the other parent brings differs from HEAD, so it is judged as new. Merging `owner-followup-r04-build`
into the coordinator line was refused on about 100 lines of briefs committed on that branch in October, before the
rule existed. Hooks are never skipped, so the check must understand a merge.

## Outcome

- **M1.** While a merge is in progress (`git rev-parse -q --verify MERGE_HEAD` succeeds; `.git/MERGE_HEAD` may list
  several commits, so read every line of it through git, for example `git rev-parse` of each, never a fixed path
  under `.git`, which is a file in a worktree), a staged line counts as added only when it is added against HEAD and
  against every merge parent: the intersection of the added line numbers of `git diff --cached --unified=0 <parent> --
  <file>` over HEAD and each parent. A file counts as new only when it is new against HEAD and against every parent.
  Both the temp-citation audit and the designer-brief check use these sets, through one function each, so that the
  two cannot disagree. Outside a merge nothing changes: the same git commands run and the results are byte-equal.
- **M2.** Tests in `.agents/skills/gardener/staged-evidence-gate.test.ts`, with a real temporary git checkout as that
  file builds one: (a) a merge whose other parent brings a line citing a missing temp folder passes; (b) the same
  merge with that line also edited during the merge, or a new such line added in the merge, fails naming that line;
  (c) a designer brief added on the other parent with a raw-tool line passes the merge, and a new raw-tool line added
  in the merge fails; (d) a plain commit (no merge) still fails on a new missing-folder line, as today. Name each test
  by the behaviour it proves.

## Limits

- Change only `check-staged-evidence.mjs`, `cited-evidence.mjs` and the two test files named above; no other check,
  no `lefthook.yml`, no CLI flag or environment switch.
- `pnpm check:code-health` passes with no raised baseline; regenerate the tooling map with `pnpm map:tooling` if a
  file's exports change, never by hand.
- Commit once on this branch with `fix(agent-tooling): the staged evidence check reads a merge against every parent`;
  do not push. Do not run the ladder or `lefthook`.

## Check and report

Run `pnpm exec vitest run --maxWorkers=3 .agents/skills/gardener/staged-evidence-gate.test.ts
.agents/skills/gardener/cited-evidence.test.ts scripts/agent-environment/check-staged-briefs.test.ts`,
`pnpm check:repository`, `pnpm check:code-health` and `pnpm check:tooling-map`. Show that test (b) fails when your
merge handling is removed (planted control). Final message, at most 15 lines: the commit, M1 and M2 each with the
lines and tests that prove them, each command with its result, the lines added and removed, anything left and why.
Run folder: `D:/fitway-temp/tooling-merge-evidence/`.
