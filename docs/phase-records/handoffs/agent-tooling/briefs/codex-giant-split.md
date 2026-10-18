<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: the giant tooling source files are split into modules by moving code (agent-tooling-r01, giant-split)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-giant-split`, branch `tooling-giant-split`, HEAD `72b95888`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 6
  and 10.
- **Read first, only these:**
  - the six files this round splits, whole: `scripts/agent-environment/codex-round.mjs`,
    `scripts/agent-environment/check-brief.mjs`, `scripts/check-agent-context.mjs`, `scripts/verify-repository.mjs`,
    `.agents/skills/gardener/survey.mjs` and `.agents/skills/verify-fitway/runner.mjs`;
  - `scripts/agent-environment/tool-contract-cases.ts`, `entryFiles` and `sourceScanTest`: the scan of entry modules
    for private argument reading;
  - `.agents/skills/verify-fitway/fixture-copy.mjs`, `HELP_MODULES`, and `scripts/agent-environment/tooling-map-parser.mjs`,
    `MAPPED_PATHS`: two lists that name files by path.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, no Codex and no network.
- **Your temp folder** is `D:/fitway-temp/tooling-giant-split/codex/`. Start no Codex process and never run
  `codex:round` or `main:advance` with arguments they accept. If a test fails in the fast ladder only by reaching its
  timeout (F261, F278, F281: on a loaded machine `scripts/check-agent-context.test.ts` K1, `new-handoff.test.ts` V2,
  `compare-parallel.test.mjs` P3 and the `codex-report-events.test.ts` R3 cases have), rerun that file alone once and
  report both runs; the coordinator's CI run on your commit decides L3. Link no `node_modules` between folders; this
  worktree has its own install.
- **Another round runs beside this one** in another worktree and changes the ratchet's own files:
  `.agents/skills/gardener/code-health.mjs`, `code-health-source.mjs`, `code-health-duplication.mjs` and their tests,
  `scripts/agent-environment/check-code-health.mjs`, `scripts/agent-environment/code-health-baseline.mjs` and
  `scripts/agent-environment/code-health-ratchet.test.ts`. This round changes none of them, and
  `.agents/skills/verify-fitway/compare.mjs` stays as it is (its `compareOwned` is one function of 846 lines at this
  HEAD; splitting it would rewrite it, which this round does not do).
- **Commit once, plainly, after everything else.** Make one commit with `git commit -m "<message>"`; never
  `git reset`, amend or rewrite commits; run the fast ladder after that commit, never only before it. If the launcher
  refuses your report, report the refusal as it stands instead of re-committing.
- **No second path** (DECISIONS item 6): a moved declaration has one home; its old file does not re-export it unless
  a file this round may not change imports it from there (S4 names the three).

## Goal

The six giant tooling source files are split into modules that each hold one responsibility and stay at or below the
giant-file line, by moving their declarations unchanged, so later rounds can change this code without meeting the
line; every command, test and check behaves as at this HEAD.

## Causes and required outcomes

- **S1. No file over the line.**
  - **Cause (measured at this HEAD with `wc -l`).** `codex-round.mjs` 2104 lines, `survey.mjs` 1203,
    `check-agent-context.mjs` 1132, `runner.mjs` 1130, `check-brief.mjs` 1128, `verify-repository.mjs` 953; the
    ratchet forbids each from growing (DECISIONS item 10), and the code lines alone (blank and comment lines not
    counted) are over 800 in each.
  - **Outcome.** Each of the six files (must change) and every module made from them has at most 800 lines by
    `wc -l` on your committed tree. The widest single declaration is `drive` in `runner.mjs` (`export async function
    drive`, 728 lines from line 403): the module that holds it has at most 72 other lines.
  - **Intent.** Each piece has room to change; the line is met by where code lives, never by deleting text (S3).
- **S2. Moved, never rewritten.**
  - **Outcome.** Every top-level statement of the six files at this HEAD, other than an `import` and an
    `export ... from`, appears in your result byte for byte, a leading `export ` or `export default ` aside, among the
    six files and the modules new since this HEAD, as many times as it appears among the six at this HEAD (`sha256`
    is declared identically in `codex-round.mjs`, `check-agent-context.mjs` and `verify-repository.mjs`; each copy
    stays where it is). The only new top-level statements are `import` and `export` statements. Each new module sits
    in the folder of the file its code came from.
  - **Intent.** A reviewer reads moves, not new code: behaviour comes from the same statements, and nothing is
    rewritten on the way.
- **S3. Nothing explained is lost.**
  - **Outcome.** Every comment line of the six files at this HEAD appears in your result among the same files, with
    the code it describes when it sits directly above or inside a moved statement; a file's opening comment stays in
    that file, and each new module may begin with one comment saying what it holds. `git diff 72b95888 HEAD` removes
    no blank line, comment or explanation that is not added back in another of those files.
  - **Intent.** DECISIONS item 10: room is made by moving code out, never by deleting blank lines, comments or
    explanations.
- **S4. Every importer reads from the new home.**
  - **Outcome.** Every file that imports from one of the six at this HEAD imports each name from the module that now
    declares it, with these three exceptions, which stay declared in their file because the parallel round's files
    import them: `formatReport` and `collectSurveyCodeHealth` in `survey.mjs`, and `listTrackedFiles` in
    `verify-repository.mjs`. No old file re-exports a moved name.
  - **Intent.** One path to each declaration, and no change to the other round's files.
- **S5. Entry commands are unchanged.**
  - **Outcome.** `pnpm check:repository`, `pnpm check:agent-context`, `pnpm brief:check`, `pnpm codex:round`,
    `pnpm verify:owner`, `pnpm check:verification-map` and `node .agents/skills/gardener/survey.mjs` keep their entry
    paths in `package.json` and the gardener skill, their arguments, output and exit codes. Before your first edit,
    write each entry's `--help` output at this HEAD to your temp folder; on your committed tree each is byte for byte
    the same.
  - **Intent.** Nobody who runs these tools can tell the split happened.
- **S6. Every check that reads a split file by name still reads the code it read.**
  - **Cause (measured).** Some code names a split file's path and reads, copies or edits its text:
    `fixture-copy.mjs` `HELP_MODULES` copies verify-fitway modules into fixtures; `tooling-map-parser.mjs`
    `MAPPED_PATHS` names `scripts/check-agent-context.mjs` and `scripts/verify-repository.mjs` as single files;
    `tool-contract-cases.ts` `sourceScanTest` scans entry modules only; `compare-parallel.test.mjs` plants defects in
    `runner.mjs` by replacing a text (lines 482-487 and 624-629); `cli.test.mjs` reads `runner.mjs`'s source
    (lines 4050-4056) and imports from it (lines 1991 and 2609).
  - **Outcome.** Each such place names the file that now holds the text or code it reads, so that: every planted
    defect still finds the text it replaces and its test still fails the way it does at this HEAD when the plant is
    applied; the source scan reports a `process.argv` read planted in any module made from an entry module, as it
    reports one planted in the entry module at this HEAD (show both reports); fixtures copy every module the copied
    code imports; the code map covers every new module. Find every such place with `git grep` on the six file names,
    not only these.
  - **Intent.** No check silently stops reading code because the code moved.
- **S7. The ratchet and the code map.**
  - **Outcome.** `docs/agent-context/CODE_HEALTH_BASELINE.json` is regenerated with `pnpm code-health:baseline` and
    `pnpm check:code-health` passes with no exception added; for each measure, the sum of the counts over the six
    files and the modules made from them is at or below the sum over the six at this HEAD, no count rises in any other
    file, and none of the six has a `giantFiles` entry. `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` is regenerated
    with `node scripts/agent-environment/generate-tooling-map.mjs` and `pnpm check:tooling-map` passes; its
    callables count equals this HEAD's (785) and its count without a covering test is at or below this HEAD's (614);
    no callable that has a covering test at this HEAD loses it.
  - **Intent.** A move neither hides debt from the ratchet nor loses a callable's test.

## Limits the result keeps

- **L1. Today's tests.** Every test at this HEAD still runs, none skipped, excluded or made conditional, and keeps
  its assertions. The only test edits are import lines and the file names and source reads S6 requires; list each
  edited test file with the lines and why. Every fixture file at this HEAD stays byte for byte. The fast ladder on
  your committed tree reports the counts CI run 39079351885 reported on this HEAD: Vitest `Test Files 114 passed
  (114)` and `Tests 2161 passed | 1 skipped (2162)`, and `node --test` `tests 127`, `pass 127`.
- **L2. Nothing outside the scope.** `git diff --stat 72b95888 HEAD` lists only files the Scope allows; the
  parallel round's files and `compare.mjs` are unchanged.
- **L3. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, run after your commit;
  `git status --short` is empty after your commit and after the ladder.

## Scope

You may change the six files of S1 (each must change), add new modules beside them (in `scripts/`,
`scripts/agent-environment/`, `.agents/skills/gardener/` and `.agents/skills/verify-fitway/`), change the import
lines of files that import from the six, change the places S6 finds (including `fixture-copy.mjs`,
`tooling-map-parser.mjs`, `tool-contract-cases.ts` and the tests S6 and L1 allow), and regenerate
`docs/agent-context/CODE_HEALTH_BASELINE.json` and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`; commit once when
done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish
and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line, and one row for each of S1-S7 and L1-L3. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list: each of the six files' line count before and after, each new module with its line count and one
line on what it holds, the test files L1 lets you edit with their lines, the files you changed, and anything you
could not do.
