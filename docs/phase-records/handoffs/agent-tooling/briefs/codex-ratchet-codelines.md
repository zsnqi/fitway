<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: a giant file is measured in code lines, and a test suite is not a long function (agent-tooling-r01, ratchet-codelines)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ratchet-codelines`, branch `tooling-ratchet-codelines`, HEAD `72b95888`
- **Milestone:** `agent-tooling-r01`. Decisions: items 6, 10, 11 and 12 of
  `D:/Projects/fitway-worktrees/records-ratchet-codelines/docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `.agents/skills/gardener/code-health.mjs`, `MEASURE_DEFINITIONS` and `countLines` (lines 11-49) and
    `scanGiantFiles` (lines 270-284): the giant-file measure today;
  - `.agents/skills/gardener/code-health-source.mjs`, whole (320 lines): the source scanner every measure shares, with
    the comment spans it already finds (`scanComments`, `css`, `html`) and `scanLongFunctions` (lines 40-54);
  - `scripts/agent-environment/code-health-baseline.mjs`, `snapshotCodeHealth` (lines 158-212) and `compareCodeHealth`
    (lines 278-300): how the ratchet turns the measures into the committed baseline and compares with it;
  - `D:/Projects/fitway-worktrees/records-ratchet-codelines/docs/phase-records/handoffs/agent-environment/findings.tsv`
    rows F269 and F272 (the coordinator line's records).

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
  with no other branch, no Codex and no network: every test you add passes there, with no file outside the
  repository.
- **Your temp folder** is `D:/fitway-temp/tooling-ratchet-codelines/codex/`. Start no Codex process and never run
  `codex:round` or `main:advance`. If a test fails in the fast ladder only by reaching its timeout (F261, F281; on a
  loaded machine `scripts/check-agent-context.test.ts` K1, `new-handoff.test.ts` V2 and the launcher's report cases
  have), rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L3. Link
  no `node_modules` between folders; this worktree has its own install.
- **Commit once, plainly, after everything else.** Make one commit for this round with `git commit -m "<message>"`;
  never `git reset`, amend or rewrite commits; run the fast ladder after that commit, never only before it. If the
  launcher refuses your report, report the refusal as it stands instead of re-committing.
- **Your own report is checked by the launcher at this HEAD**: a PASS row counts only when its command ran in this
  run after your last edit inside the worktree and printed the line the row quotes; name the SHA `git rev-parse
  HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs, and no second path** (DECISIONS item 6): the
  comment spans come from the scanner `code-health-source.mjs` already runs, not from a second tokenizer, and the
  gardener and the ratchet keep one line count.
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder; the counts your change lowers are
  written into the baseline with `pnpm code-health:baseline` in the same commit. A giant file cannot grow; room in one
  is made by moving code out of it, never by deleting blank lines, comments or explanations (DECISIONS item 10).
- **Another round runs beside this one** and splits `scripts/agent-environment/codex-round.mjs`,
  `scripts/agent-environment/check-brief.mjs`, `scripts/check-agent-context.mjs`, `scripts/verify-repository.mjs`,
  `.agents/skills/gardener/survey.mjs`, `.agents/skills/verify-fitway/runner.mjs` and
  `.agents/skills/verify-fitway/compare.mjs`. Change none of these seven (L2).

## Goal

The ratchet's giant-file measure counts code lines, so deleting blank lines or comments buys no room in a giant file,
and its long-function measure stops counting test suites' `describe` callbacks; the gardener and the ratchet still
count from one source, and every other count stays as it was.

## Causes and required outcomes

- **C1. A giant file is measured in code lines (F272).**
  - **Cause (measured).** `countLines` (`code-health.mjs` lines 45-49) counts every physical line and
    `scanGiantFiles` (lines 270-284) holds a file over 800 of them, so three rounds made room in giant files by
    deleting blank lines and comments (F272; DECISIONS item 10).
  - **Outcome.** The giant-file measure, in the gardener's report and in the ratchet alike, counts a file's code
    lines: a line counts when, with the file's comments removed, it still holds a character that is not whitespace.
    The threshold stays "more than 800". Comments are those the scanner recognises for the file's type at this HEAD:
    `//` and `/* */` comments (JSDoc included) in `.js`, `.mjs`, `.cjs`, `.ts` and `.tsx`; `/* */` in `.css`; in
    `.html`, `<!-- -->` and the comments of each `<script>` and `<style>` body and `style` attribute as those types
    count them. Each hit's detail names the count as code lines (`<n> code lines`), and its `lineCount` is that count.
    The cases below each hold on their own fixture, the widest the scanner can meet: a comment marker inside a string,
    a template literal (head, middle and tail, around a substitution) or a regular-expression literal is code; a line
    holding code and a trailing comment is code; a block comment spanning lines, with code before its opening on the
    first line and after its close on the last, leaves those two lines code and the lines between not; a line of JSX
    text in `.tsx` that contains `//` or `/*` (`<p>// not a comment</p>`, a URL in text) is code; a line holding only a JSX comment
    expression (an opening brace, a block comment, a closing brace) is code, since its braces remain; a line of only
    whitespace (spaces, tabs) is blank; CRLF, CR and LF line endings and a file without a final line break count as at this HEAD; a hashbang line is code; in `.css` a
    `/*` inside a quoted string is code; in `.html` a `<!--` inside a `<script>` string is code. A file of 900 lines of
    which 120 are comments or blank (780 code lines) is not giant; one of 801 code lines is.
  - **Intent.** A giant file's count moves only when code moves; deleting a blank line or a comment changes nothing.

- **C2. A test suite is not a long function (F269, DECISIONS item 12).**
  - **Cause (measured).** `scanLongFunctions` (`code-health-source.mjs` lines 40-54) holds every function-like node
    over 80 lines, including the callback of each Vitest `describe` suite: at this HEAD 134 of its hits, in 94 files,
    are `describe` callbacks (measured with a scan of the tracked files under the ratchet's roots), so a case added to
    any long suite touches an over-80-line function.
  - **Outcome.** The long-function measure does not count a function that is the callback argument of a `describe`
    call, in each form the tracked tests use or Vitest accepts: `describe(name, fn)`, `describe(name, options, fn)`,
    `describe.each(table)(name, fn)`, `describe.sequential`, `describe.concurrent`, `describe.skip`, `describe.only`,
    `describe.todo`, `describe.skipIf(condition)(name, fn)`, `describe.runIf(condition)(name, fn)` and their chains
    (`describe.sequential.each(table)(name, fn)`), with an arrow function or a `function` expression written as that
    argument. The call is a `describe` call only when its root identifier is the binding the same test file imports
    from `"vitest"` (`import { describe } from "vitest"`, on one line or several, or under an alias such as
    `import { describe as suite } from "vitest"`); every tracked test at this HEAD imports it so. It still counts, as at
    this HEAD: an `it` or `test` callback (and their `.each` and other forms), a hook callback (`beforeEach`,
    `afterAll` and the others), a helper function declared inside a suite, a function passed to any other call, a
    callback passed to a `describe` the test file defines itself or imports from any other module, a callback passed to
    a `.describe(...)` method of another object (as zod's), and a function named `describe` defined and called in
    production code that is not a test file. A test file is one whose name ends in `.test.<ext>` or `.spec.<ext>` for a
    scanned script extension.
  - **Intent.** The measure points at functions someone can factor; a suite that groups cases is not one.

- **C3. The baseline moves by exactly these two changes.**
  - **Outcome.** `docs/agent-context/CODE_HEALTH_BASELINE.json` is regenerated with `pnpm code-health:baseline` in the
    commit, and against this HEAD's file it differs only in: each `giantFiles` value, now the code-line count; the
    `giantFiles` entry removed for each file whose code lines are 800 or fewer; and each `longFunctions` count lowered
    by the number of that file's `describe` callbacks over 80 lines (a file left with no count loses its entry); and
    the long-function hits themselves (file and line, from the gardener's `scanScope` on the tracked files) at your
    result are this HEAD's hits less exactly the `describe` callbacks C2 exempts, none added and no other removed. Every
    `duplication`, `typeEscapes`, `suppressions` and `repeatedWorkarounds` value stays as at this HEAD, and the files
    the measures scan stay those at this HEAD. Report the number of giant files before and after, and the total
    `longFunctions` count before and after.
  - **Intent.** The round changes two measures, not what any other measure sees.

- **C4. Proven against the ratchet itself.**
  - **Outcome.** A case in `scripts/agent-environment/code-health-ratchet.test.ts`, built on a temporary repository
    the way that file's cases at this HEAD build theirs, commits a baseline holding a file of more than 800 code lines
    that also has blank lines, line comments and a block comment, then runs `pnpm check:code-health`'s command three
    times: after every blank line and comment of that file is deleted it passes and the file's `giantFiles` count is
    unchanged; after one line of code is added to it instead it fails, with output naming the file, the baseline count
    and the current count; after one line of code is removed it passes. The same case fails at this HEAD's production
    code at its first assertion (L0).
  - **Intent.** The deletion that bought room before buys nothing now, and growth is still caught.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (C1 or C2), fails on this HEAD's
  production code at an assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes
  unchanged on your result; the cases you commit are the ones you showed failing, and the fast ladder runs them. Every
  form C1 and C2 list has a case. Report each failing output.
- **L1. Today's behaviour elsewhere.** Every test at this HEAD still runs, none skipped, excluded or made conditional,
  and keeps its assertions, with one exception you list one by one in your report: an assertion's expected value on a
  giant-file count or detail, or on a long-function hit that is a `describe` callback, changes to the new value. Apart
  from those expected values, every test body at this HEAD (its setup, inputs, fixtures it reads, mocks and
  assertions) stays byte for byte; new cases go beside them. Every fixture file at this HEAD stays byte for byte. `pnpm check:code-health`, `pnpm code-health:baseline` and the gardener keep their
  arguments, outputs and exit codes except for the counts and details C1 and C2 change.
- **L2. The other round's files.** `git diff 72b95888 HEAD --stat` lists none of the seven files named in the last
  Environment bullet, and no file over 800 lines (by either count) at this HEAD grows.
- **L3. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, run after your commit;
  `pnpm check:code-health` passes with no exception added; `git status --short` is empty after your commit and after
  the ladder.

## Scope

You may change `.agents/skills/gardener/code-health.mjs` (must change), `.agents/skills/gardener/code-health-source.mjs`
(must change), the other `.agents/skills/gardener/code-health-*.mjs` modules,
`scripts/agent-environment/check-code-health.mjs`, `scripts/agent-environment/code-health-baseline.mjs`, the tests
beside them, new fixtures beside those tests, and regenerate `docs/agent-context/CODE_HEALTH_BASELINE.json` (must
change) and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`; commit once when done. Everything else is read-only. Add
no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of C1, C2, C3, C4, L0, L1, L2 and L3. A PASS command must match
a command started after the last edit inside the worktree, and its output must be one line the command printed.
Outside the block, also list the files you changed, the tests L1 lets you change with each exception, the counts C3
asks for, and anything you could not do.
