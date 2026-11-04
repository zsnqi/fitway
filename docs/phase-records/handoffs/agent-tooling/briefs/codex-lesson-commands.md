<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: two commands from the retrospective (agent-tooling-r01, round lesson-commands)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-tooling-r01`, branch `agent-tooling-r01`, HEAD `edbfcb53`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/decisions/025-040.md` item 26.
- **Read first, only these:** `scripts/agent-environment/tool-contract.mjs` and `scripts/list-agent-tools.mjs`: how a command joins `pnpm tools`; `scripts/agent-environment/run-folder.mjs`: a small command to follow; `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8.

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

- Codex has no Monitor: where the block above says to wait with one, poll the shell you started with `write_stdin`. (2026-11-04 retrospective)
- A shell output of `bash.exe ... CreateFileMapping ... Win32 error 5` comes from the harness, not your command: run the same command again once. (2026-11-04 retrospective)
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

Agents wait on a log and look up one decision with a repository command, instead of writing a loop or an `awk` each time.

## Causes and required outcomes

- **W1.** Agents wrote 47 hand-built wait loops in the last 10 sessions, because no command waits on a file; `pnpm tools` lists none. Outcome: `pnpm wait <file> --pattern <regex> [--timeout <seconds>]` exists. It exits 0 and prints the first matching line as soon as the file holds a match, including one there before it started. After its first read of the file, each check reads only what was added. A file absent at the start is waited for, not an error. On timeout (default 600 seconds) it exits 1 and prints what it waited for and the file's last line, or that the file never appeared. A missing or invalid `--pattern` exits with the contract's usage failure and prints why. A file read mid-write, with a partial last line, does not crash it or match a partial line that later completes differently. Intent: it replaces `until grep ...; do sleep ...; done` in PowerShell, Git Bash and Codex's shell alike, using no shell sleep, checking at most once a second and reading only the bytes added since the last check, so a waiting agent uses no tokens and no busy CPU.
- **D1.** Agents ran 74 hand-written decision lookups across `docs/phase-records/handoffs/*/DECISIONS.md` and the part files they point to, because the index holds only titles. Outcome: `pnpm decision <milestone-id> <n>` prints item n in full and nothing else, with the path it came from on the first line. It finds the decisions file from the `Standing decisions` line of `<milestone-id>-resume.md` under `docs/phase-records/handoffs/`. Forms it reads: an index line, `n. **Title**` followed by a part path in backticks, pointing to a part (`docs/phase-records/handoffs/public-redesign/DECISIONS.md`); the item in full in the index file itself (`docs/phase-records/handoffs/agent-environment/DECISIONS.md`); a file with both (`docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`). An item starts at `n. ` at column 0 and ends before the next numbered item at column 0, the next heading, or the end of the file; indented lines and blank lines inside it belong to it. The path comes from that line, whatever folder it names, and is never guessed from the milestone name. An unknown milestone, a resume with no such line or one naming a missing file, or an absent item exits 1 and prints one sentence naming what was looked for and the highest item number there. Intent: an agent gets the decision's whole text at the cost of its own lines, so `pnpm decision public-redesign-r01 67`, `pnpm decision agent-tooling-r01 26` and `pnpm decision agent-environment 3` must each print the real item.
- **T1.** Both commands are absent from the tool table. Outcome: both appear in `pnpm tools`, with the invocation there equal to the first usage line `--help` prints, through the same contract as `run-folder:new`. Intent: agents find them where they already look.
- **L1.** Limit: no new dependency, and neither command writes to the repository or anywhere else. The commands `pnpm check:repository` and `pnpm check:code-health` still pass with no raised baseline, and any tool map the repository's drift checks require is regenerated by its own command.

Each of W1 and D1 is new, so write its tests first, one named test per clause of W1 and per form and failure of D1, in `scripts/agent-environment/` beside the code (a real child process for W1, a temporary directory of fixture files for each D1 form): report its failing run before the change and its passing run after. These tests run in CI on Windows without Playwright Chromium or ui-forensics. Run the tests you wrote and the existing test of the tool contract; CI runs the whole ladder after the push, so do not run `pnpm verify:fast`.

## Scope

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse or extend it. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before you start. (agent-tooling DECISIONS item 14)

You may change `scripts/agent-environment/**`, `scripts/list-agent-tools.mjs`, `package.json` (must change) and generated tool maps; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"W1","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"D1","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"T1","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"L1","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
```

For `delivers: commit`, include exactly one `commit` line. Add one row for every outcome and limit ID the brief defines, with status PASS or FAIL. A PASS command must match a command started after the last edit inside the worktree, and its output must be one line the command printed. Outside the block, also list the files you changed and anything you could not do.
