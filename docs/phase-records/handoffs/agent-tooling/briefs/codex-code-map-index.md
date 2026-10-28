<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: the code map becomes a per-file index (agent-tooling-r01, round code-map-index)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-code-map-index`, branch `tooling-code-map-index`, HEAD `<set at launch>`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16
  and 17.
- **Read first, only these:**
  - `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`, its first 60 lines: what the map holds today.
  - `scripts/agent-environment/generate-tooling-map.mjs` and `scripts/agent-environment/tooling-map-document.mjs`: the
    generator and the drift check.
  - `scripts/agent-environment/generate-tooling-map.test.ts` §`describe("M2: fast-ladder drift check"`: the drift
    tests this round extends.
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

- `<run>` is `codex-round-code-map-index`.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

The tooling code map answers "which file holds this" in one read, and stops failing a round whose edits only moved
lines.

## Causes and required outcomes

- **N1.** The map lists every callable with its line range and the tests that call it: 857 callables, about 63 KB
  and 1,200 lines (`docs/agent-context/AGENT_TOOLING_CODE_MAP.md`). In the last ten coordinator sessions and their
  subagents no agent read it, and agents searched the wrong files for where a size, a capture or a check lives
  (agent-tooling DECISIONS item 17). Outcome: the map has one entry per mapped file, grouped by folder: the file's
  path, the first sentence of its leading comment when it has one, and its exported names sorted; no line numbers
  and no per-callable test lists. Today's 110 files fit in under 20 KB. Intent: an agent reads the whole map in one
  call and finds the file to open.
- **N2.** Line ranges change on every edit, so `pnpm check:tooling-map` fails a round whose edits only moved code
  (the compare-fullpage round's ladder failed on "Agent tooling map drift" after its commit). Outcome: the check
  passes after an edit that moves lines without changing a file's exports or its leading comment's first sentence;
  it fails, naming the file and `pnpm map:tooling`, after an export is added, removed or renamed, after that
  sentence changes, and after a mapped file is added or removed. Proof: the tests in `describe("M2: fast-ladder
  drift check"` in `scripts/agent-environment/generate-tooling-map.test.ts` change to this rule (the test "fails
  when a callable moves or a test call is removed" becomes a move that passes), each with its real failure planted.
  Intent: the map changes only when what it tells a reader changes.
- **N3.** The per-callable coverage and its call tracing exist only to fill the lists N1 removes. Outcome: code that
  only served them is removed, not left unreached, with its tests and its entry in
  `scripts/agent-environment/tool-contract-cases.ts`'s `TOKEN_READERS`; `scripts/agent-environment/tool-help-notes.mjs`
  and `docs/agent-context/README.md` describe the new map in one sentence each. Intent: the map's code shrinks with
  what it produces.
- **K1.** `pnpm verify:fast` passes in the worktree after the commit.
- **K2.** The command names `pnpm map:tooling` and `pnpm check:tooling-map` and the ladder step that runs the check
  stay as they are (the tool registry and the ladder call them).
- **K3.** No giant-file, ratchet, test floor or check limit is loosened; a fall in a counted measure is recorded
  with `pnpm code-health:baseline`.

## Scope

You may change `scripts/agent-environment/generate-tooling-map.mjs`, the `scripts/agent-environment/tooling-map-*.mjs`
modules (must change), `scripts/agent-environment/generate-tooling-map.test.ts` (must change),
`scripts/agent-environment/tool-contract-cases.ts`, `scripts/agent-environment/tool-help-notes.mjs`,
`docs/agent-context/README.md`, `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated, must change) and
`docs/agent-context/CODE_HEALTH_BASELINE.json` (regenerated); commit once when done. Everything else is read-only.
Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before
you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of N1-N3 and K1-K3. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed, the map's size in bytes before and after, and anything you could not do.
