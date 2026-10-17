<!-- brief-format: v1 role: codex -->
# Codex brief: one command contract: a registry, `--help`, unknown options refused by name, failures that say how to fix them (agent-tooling-r01, cli-contract)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-cli-contract`, branch `tooling-cli-contract`, HEAD `57dad1c0`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6, 7, 8 and 9 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `package.json`, its `scripts` section;
  - `docs/agent-context/README.md`, whole;
  - the argument handling of each command C1 registers: `parseArgs` in `scripts/agent-environment/advance-main.mjs`, `scripts/agent-environment/codex-round.mjs`, `scripts/show-agent-context.mjs` and `scripts/check-agent-context.mjs`; `parseHandoffArgs` in `scripts/agent-environment/new-handoff.mjs`; `parseBriefArgs` in `scripts/agent-environment/check-brief.mjs`; `parse` in `.agents/skills/verify-fitway/cli.mjs`; and the command-line entry (the `main` function or the block after `process.argv[1]`) of `scripts/agent-environment/start-load.mjs`, `scripts/agent-environment/generate-tooling-map.mjs`, `scripts/agent-environment/code-health-baseline.mjs`, `scripts/agent-environment/check-code-health.mjs`, `scripts/check-concept-css.mjs`, `scripts/check-design-context.mjs`, `scripts/verify-repository.mjs`, `scripts/verify.mjs`, `.agents/skills/gardener/survey.mjs` and `.agents/skills/gardener/remove-worktree.mjs`.

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
- **Your temp folder** is `D:/fitway-temp/tooling-cli-contract/run/`. Start no preview, compare or Codex process of
  your own. Another round runs on this machine: if `scripts/check-agent-context.test.ts` K1 or a verify-fitway test
  times out or fails in the fast ladder (F261), rerun that file alone once and report both runs; the coordinator's CI
  run on your commit decides L2. Link no `node_modules` between folders (DECISIONS item 8); this worktree has its own
  install.
- **Some commands act when they run:** `main:advance` pushes, `codex:round` launches a round, `handoff:new`,
  `code-health:baseline` and `map:tooling` write tracked files, `remove-worktree.mjs` removes a worktree, and today
  `check:repository --help` and `code-health:baseline --help` run as if no option were given (below). At this HEAD,
  run a command with anything but arguments it already refuses only in a scratch clone in your temp folder with its
  remote removed (`git remote remove origin`) and no worktrees of its own; never run `main:advance`, `codex:round` or
  `remove-worktree.mjs` with arguments they accept. Every case you commit runs a command only with arguments that make
  it refuse or print help before any work.
- **Commit once, plainly.** Make one commit for this round with `git commit -m "<message>"`; never `git reset`,
  amend or rewrite commits. If the launcher refuses your report, report the refusal as it stands instead of
  re-committing.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder (`docs/agent-context/README.md`). Six of
  the files you change are over its 800-line giant-file line and cannot grow (`scripts/verify-repository.mjs`,
  `scripts/check-agent-context.mjs`, `scripts/agent-environment/check-brief.mjs`,
  `scripts/agent-environment/codex-round.mjs`, `.agents/skills/verify-fitway/cli.mjs`,
  `.agents/skills/gardener/survey.mjs`). A count your change lowers is written into the baseline with `pnpm
  code-health:baseline` in the same commit.

## Goal

Every command an agent runs answers the same way: it explains itself on `--help`, refuses what it does not know by
name, and, when it cannot start, says what failed and how to fix it; one listing names them all.

## Causes and required outcomes

- **C1. One registry, one listing (F251).**
  - **Cause (measured by the coordinator at `b3946bc3`, whose commands this HEAD keeps).** The commands are known only from `package.json` and the
    skills' prose, so an agent learns each one's usage by trial: 21 agent-facing entry points answer `--help` and an
    unknown option in more than seven different forms (C2, C3).
  - **Outcome.** One registry file holds one entry per agent-facing command: its `pnpm` name with its exact
    `package.json` invocation string (fixed arguments such as `--check`, `fast` or `drift-tree` included), or its node
    entry; a one-line purpose; its usage line; every option it accepts, with whether the option takes a value and
    whether that value is free text; and its exit codes. Each command's `--help` text and its `pnpm tools` row come
    from that one entry. It covers every `package.json` script that runs a file under `scripts/` or
    `.agents/skills/`, except the product's own (`dev*`, `build`, `check-types`, `db:*`, `edge:*`, `deploy*`, `env:*`,
    `demo:*`, `owner:review`, `test*`, `check`, `format`), plus `.agents/skills/gardener/survey.mjs` and
    `.agents/skills/gardener/remove-worktree.mjs`; the cleanup script the survey writes for the user to run is not an
    agent's command and stays out. `pnpm tools` prints the registry as a table, exit 0. A test fails when such a
    `package.json` script, or a registered entry, is missing from the other side, or when their invocation strings
    differ.
  - **Intent.** An agent finds every tool and how to call it from one command.
- **C2. `--help` explains and does nothing else.**
  - **Cause (measured).** `check:repository`, `check:design-context` and `code-health:baseline` ignore `--help` and run
    (the last rewrites its baseline); `check:concept-css` takes it as a folder path; `check:verification-map` takes it
    as an option wanting a value; `main:advance` and `check:code-health` refuse it; `start-load` and `verify:owner`
    answer `--help` but refuse `-h`; `verify:fast`, `verify:phase` and `verify:full` refuse it after their mode as
    `FAILED_VALIDATION: Unknown argument: --help`.
  - **Outcome.** Every registered command, given `--help` or `-h` in any option position (alone, before, between or
    after its other arguments), prints its usage, its options and its exit codes on stdout and exits 0, without
    validating its other arguments, running a check, starting a process, or writing or deleting any file, inside the
    repository or outside it. Two places are not option positions and keep today's meaning: anything after a `--` that
    passes arguments on to another tool (`verify:owner measure ... -- --help` reaches the measurement tool), and the
    value of an option the registry marks as free text (`codex:round resume <folder> --message --help` sends the text
    `--help`). `verify:owner`'s subcommands answer `<subcommand> --help` the same way.
  - **Intent.** Asking a tool how to use it is always safe.
- **C3. Unknown options refused by name.**
  - **Cause (measured).** The refusals read `<command> FAILED: Unknown argument: <option>`,
    `brief:check:1: FAIL: Unexpected argument: <option>`, `main:advance:1: FAIL: unknown option: <option>`,
    `codex-round: unexpected launch option: <option>`, `start-load FAILED: Unknown option '<option>'`,
    `FAILED_VALIDATION: Unknown verification mode: <option>` and `FAIL: <option> requires a value`; three commands
    run their checks instead and one reads the option as a path.
  - **Outcome.** Every registered command given an option it does not know refuses before any work, printing one line
    `<command>: FAIL: unknown option <the option> (run <command> --help)` on stderr, exit 1; an argument it takes as a
    path or value is still taken as before, except that an option-shaped token (one starting with `-`) in a value
    position is refused as that option's missing value (C4) unless the registry marks the value as free text (today
    `codex:round <brief> --run --new-reveiw` takes the typo as a folder).
  - **Intent.** A mistyped option never runs a different check or reads as a path.
- **C4. Start-up failures that say how to fix them.**
  - **Outcome.** A registered command that cannot start (a required argument missing, a value it cannot use, a file or
    folder named on its command line that does not exist) prints one line `<command>: FAIL: <what> (<how to fix>)` on
    stderr and exits 1, where `<how to fix>` names the concrete next step (the missing argument and its form, the path
    that was not found) rather than only pointing at `--help`, unless a test at this HEAD asserts another code for
    that failure, which then stays (name each). A check's own findings keep their format; a line another tool or test
    already reads (`FAILED_VALIDATION:` in `scripts/verify.mjs`, the launcher's review and claim lines) is kept after
    it, unchanged. List in your report every failure message you changed, with its before and after.
  - **Intent.** An agent reading a failure knows its next step without opening the script.
- **C5. One contract test.**
  - **Outcome.** One test, its cases generated from the registry, runs every registered command with `--help` and
    `-h` first, after a positional argument and between options; an unknown option first and after a known one; each
    declared option given so that it is not refused as unknown; an option-shaped token in each non-free-text value
    position; and each C4 failure class the command has (each one it refuses before any work). It checks C2, C3 and
    C4's forms and exit codes, and runs every help and refusal probe under a guard that records any child process the
    command starts and any file it writes or deletes anywhere; a probe that starts a process or touches a file fails.
    It fails when a registered command breaks any of them, shown in a scratch copy by three planted breaks, each
    reported: a refusal line in the wrong form, a help path that starts a `git` process with no output, and a help
    path that writes a file outside the repository. It runs in the fast ladder.
  - **Intent.** A new or changed tool cannot drift from the contract unseen.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests, fails at this HEAD at an assertion
  on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your result; the
  cases you commit are the ones you showed failing, and the fast ladder runs them. Report each failing output.
- **L1. Today's behaviour elsewhere.** Every command given its existing valid arguments does what it does at this HEAD,
  with the same exit codes and the same output apart from C4's failure lines; every test at this HEAD keeps its
  assertions and still runs, none skipped, excluded or made conditional; the launcher's review, resume and claim
  checks behave as at this HEAD.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, `pnpm check:code-health` passes,
  and `git status --short` is empty after your commit and after the ladder.
- **L3. Cost.** The contract test takes at most 60 s on this machine (three runs, median and range reported).
- **L4. Where it is found.** `docs/agent-context/README.md` names `pnpm tools` and the registry in one line.

## Scope

You may change the registered commands' files under `scripts/` and `.agents/skills/verify-fitway/` and
`.agents/skills/gardener/` (must change: at least `scripts/agent-environment/advance-main.mjs`,
`scripts/verify-repository.mjs`, `scripts/check-design-context.mjs`, `scripts/check-concept-css.mjs`,
`scripts/agent-environment/code-health-baseline.mjs`, `scripts/verify.mjs` and `.agents/skills/verify-fitway/cli.mjs`),
their tests, `package.json` (its `scripts` section only), `docs/agent-context/README.md` (must change),
`docs/agent-context/CODE_HEALTH_BASELINE.json` and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated), and
add the registry, its listing script, any shared module the commands use for their arguments, and the contract test;
commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the registered commands;
every failure message you changed, before and after; the files you changed; the commit SHA; anything you could not do;
any hook message you did not act on.
