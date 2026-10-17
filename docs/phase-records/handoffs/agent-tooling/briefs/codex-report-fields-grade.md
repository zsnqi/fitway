<!-- brief-format: v1 role: codex -->
# Codex brief: grade report-fields by running these checks (agent-tooling-r01, report-fields-grade)

- **Worktree:** `D:/fitway-temp/tooling-report-fields-grade/wt`, branch `grade-report-fields`, HEAD `d2fad437`
- **Milestone:** `agent-tooling-r01`. Decisions: items 6 and 9 of
  `D:/Projects/fitway/.claude/worktrees/busy-bartik-858366/docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway/.claude/worktrees/busy-bartik-858366/docs/phase-records/handoffs/agent-tooling/briefs/codex-report-fields.md`,
    whole: the brief of the result you grade; your contract is G1-G9 below;
  - `scripts/agent-environment/codex-report.mjs`, `scripts/agent-environment/brief-format.mjs` and the report path of
    `scripts/agent-environment/codex-round.mjs` (`execute` and what it calls to check a report);
  - `docs/agent-context/briefs/codex.md` §"Report".

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

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output (pnpm, Vitest, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, scratch repositories, drivers and logs in
  `D:/fitway-temp/tooling-report-fields-grade/`. The base is `cf5d7858`; the round's commit is `610b54a6`; the builder's
  commit `d2fad437` after it, applying the diff review's findings, is the result HEAD. Take any base copy with
  `git archive` outside every git tree, and check each copied file against `git show <commit>:` before using it.
  This worktree has its own install; link no `node_modules` between folders (DECISIONS item 8).
- **Drive the launcher's real report path.** Run `codex-round.mjs` with the fake Codex the result's tests use, or call
  the result's exported report functions from your own driver, on scratch repositories you make: a base commit B (the
  launch HEAD), two later commits C1 and C2 (HEAD = C2) with real changes, a clean tree, and run events holding one
  successful `git commit` whose output names C2 and one successful `node scripts/verify.mjs fast` after it, written in
  the format real runs record (a PowerShell `-Command` wrapper, terminal escape sequences in outputs, `item.started`
  and `item.completed` events). Copy real records from `D:/fitway-temp/codex-round-*` folders where a check needs one.
  Start no real Codex round; never run `codex:round` or `main:advance` with arguments they accept on a real brief.
  Run single test files, not the whole ladder; the coordinator's CI run on the result decides the ladder.

## Goal

The coordinator knows, row by row, whether the delivered launcher decides a round's commit from the brief's field,
reads the commit from one field, holds each PASS row to a command that ran and printed its line after the last edit,
and records each check, on cases its own run did not make.

## Causes and required outcomes

- **G1. The brief's field (R1).** Outcome: `pnpm brief:check` reports a brief-format failure for a Codex brief whose
  first line is `<!-- brief-format: v1 role: codex -->`, for `<!-- brief-format: v1 role: codex delivers: Commit -->`,
  and for `<!-- brief-format: v1 role: builder delivers: commit -->`, and none for `<!-- brief-format: v1 role: builder -->`
  or either accepted Codex form; `docs/agent-context/briefs/codex.md` starts with the `delivers: commit` line and its
  brief:check result has no brief-format problem. A `delivers: report` brief whose Scope says "commit once when done",
  with a report holding every row PASS and matched, no commit line and no `git commit` in the events, is accepted; a
  `delivers: commit` brief whose Scope says "make a single commit at the end", with a report holding matched rows and
  no commit line, is refused for the missing commit line. `resume` of a run whose `input.md` starts with a launch note
  line and then the `delivers: commit` line reads the field; `resume` of a run whose `input.md` has no field is refused
  before the fake Codex starts, naming the field, and so is one whose brief's first line has no field while a later
  line or a fenced example in it carries `delivers: commit`. Intent: whether a round commits is read from the field alone.
- **G2. The commit field (R2).** Outcome: with the block's commit line naming C1 and the prose citing C2 as "HEAD after
  commit", the report is refused naming C1 and the HEAD; with the commit line naming C2's 7-hex prefix and the prose
  citing B's full SHA first, it is accepted; two commit lines both naming C2 are refused; a commit line naming a
  fabricated 12-hex SHA is refused as no commit object; a `STOPPED: blocked` message with no block is accepted.
  Refusals kept from the base, each made from an accepted control by breaking only that condition, and each refusal
  line naming it: HEAD reset to B (the launch HEAD), a dirty tree, no successful `git commit` in the events, HEAD
  moved to a commit that does not descend from B, an empty commit, and the only successful fast ladder before the
  commit with a PASS row for an outcome that names the ladder. Say whether a `STOPPED:` line inside a fenced output
  excerpt of an otherwise incomplete report is taken as a stop (the base read any such line). Intent: the commit claim is the field, and
  nothing else loosened.
- **G3. Row form (R3).** Outcome: a row with `"status": "pass"`, a row with an ID the brief does not define, a missing
  ID, a repeated ID, two `report` blocks, an unclosed block, a line that is not JSON, a row with an extra key, and
  a PASS row with an empty output are each refused with a line naming it; a FAIL row whose command never ran is not refused; a
  message with prose PASS lines for every ID and no block is not taken as a report, and the automatic resume says that
  a report needs the `report` block or a `STOPPED:` line. Intent: statuses come from the rows alone.
- **G4. Command matching (R3).** Outcome: rows naming the unquoted inner commands of records 150 (double-quoted) and
  160 (single-quoted) of `D:/fitway-temp/codex-round-036b9ba0-94ca-452f-9036-2b9c9aaa6768/events-resume-2.jsonl`,
  with a line of each record's output, match; the raw quoted text between the wrapper's outer quotes does not match
  when it differs from the unquoted command; a row command with one extra trailing space is refused; a PowerShell
  record whose command holds Arabic text, and one whose command holds a newline, each match a row giving that command
  exactly. Intent: a row names the command as it was run.
- **G5. Output matching (R3).** Outcome: a row whose output has extra surrounding spaces matches; a row quoting
  `tests passed` against a recorded line `12 tests passed` is refused; the console-wrapped line of record 32 of the same
  events file (`... Feature path unavailable at 390 CSS pixels by its recipe ...`) matches as one line; a synthetic
  record whose 80-column line ends `abab`, followed by a line break, a cursor move to row 23 column 80 and `bab tail`,
  gives the line with `abab` kept and `ab tail` after it; the last line of an 813,357-character output matches. Intent:
  a row's output is a line as the terminal displayed it.
- **G6. Edits after evidence (R4).** Outcome: for a `delivers: commit` brief, a PASS row whose only matching record
  started before a `file_change` to a worktree file and completed after it is refused; one followed only by a
  `file_change` to a file under `D:/fitway-temp/` is accepted; one followed by a `file_change` to a worktree file that
  the commit does not keep (restored) is refused; F265's sequence (measure, edit a committed file, commit) is refused
  and the same with the measurement repeated after the edit is accepted. Intent: a PASS row describes the committed
  code.
- **G7. The record (R5).** Outcome: `report-checks.jsonl` after a refused report has a line with accepted false, the
  refusal lines and a null record for the unmatched row; after an accepted report each PASS row names an events file
  and line that hold its matching command; for a row matched before and after an edit it names the later line; a
  `STOPPED:` report's line says it carried the line. Intent: one read of a file answers which event backs each row.
- **G8. The repair proven, nothing weakened (L0-L2).** Outcome: run from the result's test files on `cf5d7858`'s
  production code, every case added since `cf5d7858` fails at an assertion on its outcome, never at a missing module,
  export, helper, fixture or setup (list each case and what it asserts), and passes unchanged on the result; every
  test at `cf5d7858` still runs, none skipped or made conditional, and every pre-existing test body that changed
  changed only by a fixture brief's first line gaining `delivers`, a fixture report gaining the block for claims it
  already made, or an assertion on the Scope words, a SHA anywhere in the message or a PASS word on any line moving to
  the new behaviour (list each changed body with which); `git diff cf5d7858 HEAD -- <file>` for
  `scripts/agent-environment/codex-round.mjs`, `codex-round.test.ts`, `check-brief.mjs` and `check-brief.test.ts`
  removes no blank line, comment or explanation outside code replaced or moved, and each ends at or below 2279, 4484,
  1132 and 1423 lines. Every fixture file at `cf5d7858` is byte for byte the same, and each change to a shared test
  helper or test configuration is listed with what it changes. The Report section of
  `docs/agent-context/briefs/codex.md` gives the `report` block's form, asks for a PASS row's command exactly as run
  and one line of its output, run after the last edit inside the worktree, and still asks for the files changed and
  anything not done. Intent: the cases see the defects and nothing was loosened to pass.
- **G9. Report against events.** Outcome: the round's run folder
  (`D:/fitway-temp/codex-round-ba3f61b1-c452-4f4b-9d90-e6ce4c68be04/`) records the `git commit` whose output names
  `610b54a6` and every command its report cites for R1-R6, L0 and L1 with the output line the report quotes; list any
  report claim that no recorded command backs. Intent: the round's report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C D:/fitway-temp/tooling-report-fields-grade/wt status --short` is empty at
  the end, and no commit is made in that worktree.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-report-fields-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of G1-G9 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
