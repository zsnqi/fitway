<!-- brief-format: v1 role: codex -->
# Codex brief: the CLI contract's review findings: one parser, one declaration, room made by moving code (agent-tooling-r01, cli-contract-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-cli-contract`, branch `tooling-cli-contract`, HEAD `cb1cfe65`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6, 7, 8 and 9 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract.md`, whole: the round this fixes; its outcomes and limits still hold;
  - `D:/fitway-temp/code-review/cli-contract-1/last.md` and `D:/fitway-temp/code-review/cli-contract-1/dispositions.md`, whole: the diff review's seven findings and the coordinator's two;
  - `scripts/agent-environment/tool-contract.mjs`, `scripts/agent-environment/tool-registry.mjs` and `scripts/agent-environment/tool-contract.test.ts`, whole; the argument handling of each registered command, as the contract brief above lists it.

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
  with no other branch, no Impeccable binary, no Codex and no network: every test you add passes there, with no file
  outside the repository.
- **Your temp folder** is `D:/fitway-temp/tooling-cli-contract/fix/`. Start no preview, compare or Codex process of
  your own. If `scripts/check-agent-context.test.ts` K1 or a verify-fitway test times out or fails in the fast ladder
  (F261), rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2. Link
  no `node_modules` between folders (DECISIONS item 8); this worktree has its own install.
- **Some commands act when they run** (`main:advance` pushes, `codex:round` launches a round, `handoff:new`,
  `code-health:baseline` and `map:tooling` write tracked files, `gardener:remove-worktree` removes a worktree): run
  them with arguments they accept only in a scratch clone in your temp folder (`git clone --no-hardlinks -c
  core.longpaths=true`, its remote removed) with no worktrees of its own; never run `main:advance`, `codex:round` or
  the worktree removal with arguments they accept.
- **Commit once, plainly, after everything else.** Make one commit for this round with `git commit -m "<message>"`;
  never `git reset`, amend or rewrite commits; run the fast ladder after that commit, never only before it. If the
  launcher refuses your report, report the refusal as it stands instead of re-committing.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder; a count your change lowers is written
  into the baseline with `pnpm code-health:baseline` in the same commit. A giant file (over 800 lines) cannot grow;
  room in one is made by moving code out of it, never by deleting blank lines, comments or explanations (F272).

## Goal

The command contract has one parser and one declaration per command, and its giant files keep their shape.

## Causes and required outcomes

- **E1. One parser (review 1).** Outcome: `beginToolCommand` (or the shared contract's one entry) returns what it
  parsed: each declared option's value or presence, the positionals, and anything after a passthrough `--`; every
  registered command takes its arguments from that result and keeps only its own checks of their meaning (a value's
  range, a folder's contents); no registered command still holds its own loop or table of option names (`parseArgs`
  in `scripts/agent-environment/advance-main.mjs`, `scripts/agent-environment/codex-round.mjs`,
  `scripts/show-agent-context.mjs` and `scripts/check-agent-context.mjs`, `parseHandoffArgs`, `parseBriefArgs`,
  verify-fitway's `parse`, the survey's option loop, the worktree removal's positional reading, `start-load`'s own
  parsing, and the like: name each one you removed). Every command given its existing valid arguments still does
  what it does at this HEAD (the contract brief's L1). Tested.
- **E2. One declaration (reviews 2, 3, 4, 6).** Outcome: `.agents/skills/verify-fitway/cli.mjs` imports the shared
  contract unconditionally, with no fallback validator and no help text of its own, and any test that copies the CLI
  elsewhere copies what it imports; a command's fixed arguments are declared once in the registry and its invocation
  string derived from them; `scripts/agent-environment/tool-contract.test.ts` types the value metadata options and
  positionals share, with no cast; `fail` writes `toolFailure`'s line. Tested where behaviour shows it.
- **E3. Nothing left over (reviews 5, 7).** Outcome: `start-load`'s unreachable `USAGE` and `values.help` branch are
  gone; `invocationArguments` and `failTool` are used by a caller or removed; `git grep` shows no other export of the
  new modules without a caller outside its own file.
- **E4. The giant files keep their shape (coordinator 8).** Outcome: the blank lines between functions that the round
  removed from `scripts/agent-environment/codex-round.mjs`, `scripts/agent-environment/check-brief.mjs`,
  `scripts/verify-repository.mjs`, `scripts/check-agent-context.mjs` and `.agents/skills/gardener/survey.mjs` are back
  (`git diff 57dad1c0 HEAD -- <file>` shows no removed blank line or comment outside code you replaced); each of those
  files ends at or below its `wc -l` at `57dad1c0` (2316, 1141, 960, 1167 and 1228), the room coming from E1's removed
  parsers or from code moved into modules of its own. Report each file's count.
- **E5. One prefix per line (coordinator 9).** Outcome: `check:concept-css`'s start-up failures print
  `check:concept-css: FAIL: <what> (<how to fix>)` with no `ERROR:` inside it, exit 2 kept. Tested.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (E1-E5), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. Report each failing
  output. E3's and E4's checks may be a `git grep` or `wc -l` you report instead of a case.
- **L1. The earlier outcomes.** C1-C5 and every limit of `codex-cli-contract.md` still hold (report each again with
  the command that shows it, C5's three planted breaks included); every test at this HEAD keeps its assertions and
  still runs; the launcher's review, resume and claim checks behave as at this HEAD.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, run after your commit;
  `pnpm check:code-health` passes; `git status --short` is empty after your commit and after the ladder.

## Scope

You may change the files `cb1cfe65` changed and their tests, add modules that code moved out of a giant file goes
into, and regenerate `docs/agent-context/CODE_HEALTH_BASELINE.json` and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`;
commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the parsers you removed;
each giant file's line count; the files you changed; the commit SHA; anything you could not do; any hook message you
did not act on.
