<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: evidence has a home, folders say who made them, documents stay readable (agent-tooling-r01, round evidence-home)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-evidence-home`, branch `tooling-evidence-home`, HEAD `<set at launch>`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 6, 14,
  16 and 17.
- **Read first, only these:**
  - `D:/fitway-temp/retro-20261028/gone-evidence/REPORT.md` §4: which run folders say who made them today.
  - `scripts/agent-environment/codex-session.mjs:90-140`: what the launcher writes into a run folder.
  - `scripts/agent-environment/code-health-ratchet.mjs:12-40` and `.agents/skills/gardener/code-health.mjs:270-300`:
    the ratchet's roots and the giant-file measure.
  - `docs/agent-context/RULE_ENFORCERS.md`: the table H4 keeps true (`docs/agent-context/README.md` §"Which check
    enforces each rule" points to it).
  - `scripts/agent-environment/tool-registry.mjs`: how a `pnpm` command is registered.
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

- `<run>` is `codex-round-evidence-home`.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

The evidence a decision rests on can be kept where no cleanup reaches and every checkout sees it; every run folder
the coordinator or the launcher makes says who made it, from which brief and commit, and where its report is; a
concept document cannot grow too large to read in one call; and the rule-to-enforcer table cannot name a check that
does not exist.

## Causes and required outcomes

- **H1.** Evidence a decision rests on lives only under `D:/fitway-temp`, which is pruned and exists on one machine;
  13 verdict or grade records lost their data (the gone-evidence report's §2). Outcome: `pnpm evidence:keep <path>...
  --to <milestone>/<topic>` copies each named file, or each file under a named folder, into
  `docs/phase-records/evidence/<milestone>/<topic>/` keeping its path relative to the named folder; refuses, naming
  it, a file over 1 MB, an image or video (frames a user decision rests on belong in the concept's `evidence/`
  folder), and a target that already holds a different file; writes or extends `SOURCES.md` there with each
  original path and its SHA-256; and prints the repository path to cite. Check: tests for a copied folder, each
  refusal and a rerun that changes nothing. Intent: one command makes evidence durable, and refuses what would make
  the repository heavy.
- **H2.** `run.json` records the worktree, HEAD, model and level but not the brief, the round or the report
  (`scripts/agent-environment/codex-session.mjs:100-106`); the coordinator's own folders for subagents record
  nothing; 19.7% of top-level temp folders say anything about their origin (the report's §4). Outcome: (a) `run.json`
  also records the brief's repository path and SHA-256, the round's name from the brief's title, and the path of the
  report file the launcher writes; (b) `pnpm run-folder:new <name> --brief <file> [--for <who>]` creates
  `D:/fitway-temp/<name>/`, refusing one that exists, copies the brief in as `BRIEF.md`, and writes `manifest.json`
  with the brief's path and SHA-256, the checkout's commit and branch, the creation time and `for`. Check: extend the
  launcher's tests that read `run.json` with the new fields; tests for `run-folder:new`, including the refusal (with
  the temp root injected). Intent: a folder says where it came from without a search through transcripts.
- **H3.** The Owner concept's `DESIGN-SPEC.md` is 283 KB and `SETTINGS-SPEC.md` 78 KB, and agents read them whole
  several times a session; its page scripts reach 188 KB; the ratchet covers neither, since the concept was to join
  "when the build branch takes this line's tooling" (DECISIONS item 6). The coordinator's own records grow the same
  way: r04's `DECISIONS.md` is 127 KB and was read 16 times in 6 sessions. Outcome: the code-health measures gain
  `giantDocuments`, a tracked Markdown file over 40,000 bytes outside `docs/archive/` (frozen, read only through a
  pointer) and `.claude/skills/` (unchanged upstream copies, `.claude/skills/SOURCES.md`), baselined and ratcheted
  like `giantFiles`; and the
  concept folder named in `.agents/skills/verify-fitway/concept-source.json` joins the ratchet's roots for
  `giantFiles` and `giantDocuments` only (its other measures wait for the move to production, agent-environment
  DECISIONS item 20). The giant-file split message names the document case: split by section into files a reader
  opens one at a time. Check: tests in the code-health test files for a 40,001-byte Markdown file (counted), a
  40,000-byte one (not counted), a 40,001-byte one under `docs/archive/` (not counted), growth of a baselined giant
  document (fails) and a concept JavaScript file over the
  giant-file line (counted). Intent: a document a reader must open whole stays one read.
- **H4.** Agents have searched code for a check that does not exist. `docs/agent-context/RULE_ENFORCERS.md` now says,
  for each rule, which check enforces it or that it is written only. Outcome: `pnpm check:agent-context` fails, naming
  the row, when that table names a `pnpm` command that `package.json` does not define, or a file that does not exist
  (the cells name files without line numbers); a row whose enforcer is "written only" passes. Check: tests planting a
  renamed command and a missing file. Intent: the table cannot point at an enforcer that is gone.
- **K1.** `pnpm verify:fast` passes after the commit; existing commands keep their output.
- **K2.** CI has no `D:/fitway-temp`: tests inject their temp root.
- **K3.** No ratchet, test floor or check limit is loosened beyond H3's addition; the baseline is regenerated with
  `pnpm code-health:baseline` and the commit message names each new baselined item; `pnpm check:tooling-map` passes
  (regenerate with `pnpm map:tooling`).

## Scope

You may change `scripts/agent-environment/` (`codex-session.mjs` and `code-health-ratchet.mjs` must change; new
command modules and tests go here), `.agents/skills/gardener/code-health*.mjs` and its code-health test files,
`scripts/check-agent-context.mjs` and its tests (must change), `package.json` (the two new scripts only),
`docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and `docs/agent-context/CODE_HEALTH_BASELINE.json` (both regenerated);
commit once when done. Everything else is read-only. Add no dependencies.

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

Include exactly one `commit` line and one row for each of H1-H4 and K1-K3. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed and anything you could not do.
