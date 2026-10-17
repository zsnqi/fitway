<!-- brief-format: v1 role: codex -->
# Codex brief: a brief says what it delivers, a report names its commit, and its rows are checked against the run (agent-tooling-r01, report-fields)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-report-fields`, branch `tooling-report-fields`, HEAD `cf5d7858`
- **Milestone:** `agent-tooling-r01`. Decisions: items 6, 9, 10 and 11 of
  `D:/Projects/fitway/.claude/worktrees/busy-bartik-858366/docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs`, from `outcomeIdsFromBrief` to `reportClaimFailures` (lines 949 to
    1420), `prepareResume` and `execute`: how a report is recognised and its claims checked today;
  - `scripts/agent-environment/check-brief.mjs`, the `FORMAT` constant (line 20) and `checkBrief` (lines 960 to 1090);
  - `docs/agent-context/briefs/codex.md`, whole: the template every Codex brief is written from;
  - `D:/Projects/fitway/.claude/worktrees/busy-bartik-858366/docs/phase-records/handoffs/agent-environment/findings.tsv`
    rows F242, F256 and F265 (the coordinator line's records);
  - `D:/fitway-temp/codex-round-036b9ba0-94ca-452f-9036-2b9c9aaa6768/events-resume-2.jsonl`, lines 296 to 350: a real
    run's recorded commands and file changes, F265's sequence (an edit at line 320 after the measurements before it).

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
  with no other branch, no Codex and no network: every test you add passes there, with no file outside the repository
  (copy the real event lines a test needs into a fixture under `scripts/agent-environment/fixtures/`).
- **Your temp folder** is `D:/fitway-temp/tooling-report-fields/`. Start no Codex process and never run `codex:round`
  or `main:advance` with arguments they accept; tests drive the launcher with the fake Codex the tests at this HEAD
  already use. If `scripts/check-agent-context.test.ts` K1 or a verify-fitway test times out in the fast ladder (F261),
  rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L3. Link no
  `node_modules` between folders; this worktree has its own install.
- **Commit once, plainly, after everything else.** Make one commit for this round with `git commit -m "<message>"`;
  never `git reset`, amend or rewrite commits; run the fast ladder after that commit, never only before it. If the
  launcher refuses your report, report the refusal as it stands instead of re-committing.
- **Your own report is checked by the launcher at this HEAD**, not by the one you build: a step counts as done only
  when a tool call ran it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your
  commit.
- **No validator, parser, option or guard beyond what an outcome needs, and no second path** (DECISIONS item 6): a
  wrapped command is unquoted by the shell scanner `codex-round.mjs` already uses, paths are compared with
  `path-identity.mjs`, and Git is read through the helpers already there.
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder; a count your change lowers is written
  into the baseline with `pnpm code-health:baseline` in the same commit. A giant file (over 800 lines) cannot grow;
  room in one is made by moving code out of it, never by deleting blank lines, comments or explanations (DECISIONS
  item 10).

## Goal

The launcher decides from a field of the brief whether a round must deliver a commit, reads the claimed commit from
one field of the report, and holds every PASS row of a report to a command that ran in the run and printed the line
the row quotes, after the last edit to the files the commit changes; each check it makes is written to the run
folder, so the coordinator checks a round's claims against its events without reading prose.

## Causes and required outcomes

- **R1. The brief says what the round delivers.**
  - **Cause (measured).** `briefRequiresCommit` (`codex-round.mjs` lines 1054-1058) holds a round to a commit only
    when the brief's Scope contains the words "commit once when done": a grading brief that quotes them is held to a
    commit, and an implementing brief that words its commit otherwise escapes every claim check (raised by both reviews
    of four grading briefs in this milestone). `FORMAT` (`check-brief.mjs` line 20) has no such field.
  - **Outcome.** A Codex brief's first line is exactly `<!-- brief-format: v1 role: codex delivers: commit -->` or
    `<!-- brief-format: v1 role: codex delivers: report -->`. `pnpm brief:check` fails a Codex brief whose first line
    lacks the field or carries any other value, and a builder, designer or verifier brief whose first line carries the
    field; their accepted first lines stay as at this HEAD. The launcher applies its commit checks to a
    `delivers: commit` brief and to no other, decided by that field alone: a `delivers: report` brief whose Scope says
    "commit once when done" is not held to a commit, and a `delivers: commit` brief whose Scope words its commit
    otherwise is. On `resume` the field is read from the run's recorded brief (`input.md`, after any launch note); a
    run whose recorded brief has no field is refused before Codex starts, with a line naming the missing field. The
    template `docs/agent-context/briefs/codex.md` starts with the `delivers: commit` line, and its checklist says when
    to write `report` instead.
  - **Intent.** Whether a round must commit is stated once, by the coordinator, and never inferred from prose.
- **R2. The report names its commit in one field.**
  - **Cause (measured).** `commitCandidates` and `resolveCommitCandidates` (`codex-round.mjs` lines 1078-1086 and
    1248-1290) take every 7-64 hex word of the report as a candidate and accept the report when any resolves to the
    worktree HEAD, so a report that claims a wrong commit and cites the real HEAD elsewhere passes (raised by both
    reviews of launcher-fixes-6 and of its grades).
  - **Outcome.** For a `delivers: commit` brief the claim is read from the commit line of the report block (R3's form)
    and from nothing else; every other hex word of the message is a citation the check ignores. The check accepts when
    that SHA (full, or an abbreviation of at least 7 hex digits) resolves to the worktree HEAD, and refuses, naming the
    cause: no commit line (except in a report with a `STOPPED:` line, as at this HEAD), more than one, a SHA that names
    no commit object, and a commit that is not the worktree HEAD (naming both). Every other refusal of the check stays
    as at this HEAD: the claimed commit equals the launch HEAD, the HEAD does not descend from the launch HEAD, an empty
    diff against it, no successful `git commit` in the run's events, a last commit output that does not name the HEAD,
    a tree not clean after the commit, and the fast-ladder order check. A `delivers: report` brief's report is never
    held to a commit line. Tests cover: a wrong commit line with the real HEAD cited elsewhere (refused); the right
    commit line with the launch HEAD cited before it (accepted); no commit line; two commit lines; a commit line naming
    no object.
  - **Intent.** A report is refused for claiming a commit the run did not make, never for citing history, and never
    accepted because the right SHA appears somewhere.
- **R3. Report rows are structured and checked against the run's events.**
  - **Cause (measured).** `reportStatuses` and `isReport` (`codex-round.mjs` lines 982-1022) read a PASS or FAIL word
    on any line as the status of every ID on that line, and the command and output a row cites are prose the launcher
    never checks: F242's report claimed L2 PASS with no ladder command in its events, F265's P2 figures described code
    edited after them, and shared-lows-fix-2's P1 cited `node .../focus-probe.mjs`.
  - **Outcome.** A report carries exactly one fenced code block whose opening fence is ```` ```report ```` and whose
    lines are JSON objects, one per line: for a `delivers: commit` brief one `{"commit": "<SHA>"}` line; and one row
    `{"id": "<ID>", "status": "PASS", "command": "<command>", "output": "<line>"}` (status `PASS` or `FAIL`) for each
    outcome and limit ID the brief defines. The launcher reads statuses from these rows only. A message with neither
    the block nor a `STOPPED:` line is not a report, as at this HEAD. A report is refused, with a line naming each
    cause: a block line that is not one JSON object of these forms, an ID missing (except in a `STOPPED:` report), an
    ID given twice, an ID the brief does not define, and a PASS row with no matching record. A record matches a PASS
    row when it is a completed command in this run's events (`events.jsonl` and every `events-resume*.jsonl`) whose
    command equals the row's `command` character for character, either as recorded or, for a command Codex recorded
    inside a `powershell ... -Command` or `bash ... -lc` wrapper, as the wrapped command with the wrapper's quoting
    removed; and whose output, after terminal escape sequences are removed, has a line that equals the row's `output`
    once surrounding whitespace is trimmed on both, with that `output` not empty. FAIL rows are not matched. The
    matching holds for the widest records the runs hold: a command spanning several lines, quotes of both kinds and
    non-ASCII text, and an output of at least 813,357 characters (the largest in F265's run). Tests use command records
    copied from real run folders under `D:/fitway-temp/codex-round-*` (a PowerShell-wrapped command containing a
    single quote, one containing double quotes, an output with terminal escape sequences, such as
    `D:/fitway-temp/tooling-launcher-ansi/real-commit-output.json`); a Bash-wrapped record may be written in the form
    the tests at this HEAD use. Each is accepted when the row matches and refused when the row's command or output
    differs by one character.
  - **Intent.** A PASS row is backed by a step that ran in this run and printed what the row quotes.
- **R4. Evidence older than the last edit does not count (F265).**
  - **Cause (measured).** In F265's run a file the commit changes was edited (`events-resume-2.jsonl` line 320) after
    the measurements its report cites, with only `node --check` and `git diff --check` between that edit and the
    commit; the claim check matches claims to commands, not to the edits after them.
  - **Outcome.** For a `delivers: commit` brief, a PASS row is refused when every record matching it (R3) comes, in the
    run's event order, before a recorded file change (Codex's `file_change` item) to a file that the diff from the
    launch HEAD to the claimed commit changes; the refusal names the row, the file and the position of the edit
    (events file and line). A matching record after the last such edit is accepted, and an edit to a file outside that
    diff (a temp file) does not count. Paths compare as `path-identity.mjs` compares them. Tests cover F265's sequence
    (measure, edit a committed file, commit: refused), the same with the measurement repeated after the edit
    (accepted), and a temp-file edit after the measurement (accepted).
  - **Intent.** A PASS row describes the code that was committed, not an earlier state of it. Edits made through a
    shell command are not `file_change` items and stay out of reach of this check (as F256's working directory does).
- **R5. Each check is written to the run folder.**
  - **Outcome.** Each report the launcher checks, accepted or refused, appends one JSON line to `report-checks.jsonl`
    in the run folder with: the events file of that turn, whether it was accepted, the brief's `delivers` value, the
    commit line's SHA and what it resolved to (or null), every row (ID, status, command, output, and the events file
    and line of its matching record, or null), and the refusal lines. Tests read the file after an accepted and after
    a refused report.
  - **Intent.** The coordinator checks which rows passed and which event backs each with one read of a file, not by
    reading the report's prose.
- **R6. The template asks for the block.** Outcome: the Report section of `docs/agent-context/briefs/codex.md` gives
  the block's exact form (R3), says that a PASS row names the command exactly as it was run and one line copied from
  its output, run after the last edit to the files the commit changes (R4), and keeps asking for the files changed and
  anything not done. Intent: a brief written from the template gets reports the launcher accepts on their first try.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (R1-R5), fails on this HEAD's
  production code at an assertion on that outcome's behaviour (not at a missing helper, import or fixture), and
  passes unchanged on your result; the cases you commit are the ones you showed failing, and the fast ladder runs
  them. Report each failing output.
- **L1. Today's behaviour elsewhere.** Every test at this HEAD still runs, none skipped, excluded or made conditional,
  and keeps its assertions, with two exceptions you list one by one in your report: a fixture brief's first line
  gains the `delivers` field and a fixture report gains the block for the same claims it already made; and an
  assertion on behaviour R1-R3 replace (the Scope words, a SHA anywhere in the message, a PASS word on any line)
  changes to the new behaviour. Every fixture file at this HEAD stays byte for byte. Launch, `resume` and the review
  keep their arguments, output and exit codes except where R1-R5 change them.
- **L2. The giant files.** `scripts/agent-environment/codex-round.mjs`, `scripts/agent-environment/codex-round.test.ts`,
  `scripts/agent-environment/check-brief.mjs` and `scripts/agent-environment/check-brief.test.ts` each end at or below
  their `wc -l` at this HEAD (2279, 4484, 1132 and 1423); `git diff cf5d7858 HEAD -- <file>` shows no removed blank
  line, comment or explanation outside code you replaced or moved. Report each file's count.
- **L3. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, run after your commit;
  `pnpm check:code-health` passes with no exception added; `git status --short` is empty after your commit and after
  the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/check-brief.mjs`
(must change), `docs/agent-context/briefs/codex.md` (must change; its first line, its Report section and the checklist
line for R1 only), the tests beside them, new modules and tests in `scripts/agent-environment/` that code moved out of
a giant file or new code goes into, new fixtures under `scripts/agent-environment/fixtures/`, and regenerate
`docs/agent-context/CODE_HEALTH_BASELINE.json` and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`; commit once when
done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish
and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; each giant file's line
count; the tests L1 lets you change, each with its exception; the files you changed; the commit SHA; anything you
could not do; any hook message you did not act on.
