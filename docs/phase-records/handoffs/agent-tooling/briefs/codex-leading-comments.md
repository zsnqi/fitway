<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: every mapped tooling file says what it is for (agent-tooling-r01, round leading-comments)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-leading-comments`, branch `tooling-leading-comments`, HEAD `ac337544`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16
  and 17.
- **Read first, only these:**
  - `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`: every entry that shows `(no leading comment)` is a file this round
    changes; the entries that have one show the house style.
  - `scripts/agent-environment/tooling-map-document.mjs` and `scripts/agent-environment/tooling-map-parser.mjs`: how
    the map reads a file's leading comment and its first sentence.
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

- `<run>` is `codex-round-leading-comments`.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

An agent looking for where something lives reads the tooling map, one line per file. 86 of its 122 files show
`(no leading comment)`, so the map names their exports but not what they are for, and the agent opens the file to
find out; three more show a comment that does not say it. After this round every mapped file opens with a comment
that says what it is for.

## Causes and required outcomes

- **L1.** The map round left the comments for later, since the files belonged to other rounds then (the map's brief,
  `docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-index.md`). Outcome: each file the map shows
  with `(no leading comment)` at `ac337544` gains a leading comment as the map reads one: `//` lines before the first
  statement (after a shebang if there is one). So does `.agents/skills/verify-fitway/compare.mjs`, whose leading
  comment is only the ratchet's `code-health-exception:` marker: its purpose line goes above the marker, which stays
  unchanged (the ratchet finds the marker anywhere, `scripts/agent-environment/code-health-ratchet.mjs:31`). So do
  three files whose comment the map shows does not say what the file is for: `scripts/concept-css-parse.mjs` (a
  constraint), `.agents/skills/verify-fitway/worker-pool.mjs` (an ordering rule) and
  `scripts/agent-environment/shell-words.mjs` (cut off at "`powershell ...`"): a purpose sentence goes above the
  existing comment, which stays unchanged.
  - The map shows only the first sentence, so the first sentence carries the purpose: one plain sentence of at most
    120 characters, ending with a period, with no `.`, `!` or `?` followed by a space inside it (no "e.g." or
    "i.e."), so the map shows it whole.
  - It names the file's own subject and what it does with it (what it reads, builds, checks, writes or runs), read
    from its code and exports, specific enough that it would be false for every other mapped file in its folder, in
    the style of the existing entries (for example `survey-checks.mjs`: "Survey rule-home, graph, environment, and
    command checks."). A sentence that could describe several files ("Helpers for the tooling.") does not meet L1.
  - It names what the file does, not its history: no round, decision or finding numbers and no dates. A second
    sentence is allowed for a reader of the file; the map does not show it.

  Check: `pnpm map:tooling` prints `0 without a leading comment` and `pnpm check:tooling-map` passes; each changed
  file's line in the regenerated map shows its whole first sentence, ending with its period; each sentence is read
  against its file at the diff review. Intent: the map answers "where does X live" without opening files.
- **L2.** Comments are the only change. Outcome: in every changed source file, the diff against `ac337544` adds lines
  only, all of them comment lines (and at most one blank line after the comment) above the first statement; no
  existing line changes. Check: a script in the run folder reads `git diff --numstat` and each file's diff, and
  prints `ONLY LEADING COMMENTS <n> files` or the first file and line that breaks the rule; run it on the result,
  then on a copy of one changed file with one code character changed, where it must not print `ONLY`. Intent: the
  round cannot change behaviour.
- **K1.** `pnpm verify:fast` passes after the commit.
- **K2.** No ratchet, test floor or check limit is loosened. If a comment takes a file over the giant-file line, report
  it instead of shortening other comments or code. Regenerate the baseline with `pnpm code-health:baseline` only if a
  measure changes, and name each change it makes in the commit message.
- **K3.** `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` is regenerated with `pnpm map:tooling`; `pnpm check:tooling-map`
  passes.

## Scope

You may change, in the files the map shows with `(no leading comment)` at `ac337544` and in the four files L1 names,
only the lines above each file's first statement (adding lines, never changing one); and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and
`docs/agent-context/CODE_HEALTH_BASELINE.json` (both regenerated). Commit once when done. Everything else is
read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it: the L2 script reads Git's own diff. Your diff is reviewed against
`docs/agent-context/briefs/CODE_REVIEW.md` D1-D8, and each comment is read against its file's code. (agent-tooling
DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of L1-L2 and K1-K3. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed and anything you could not do.
