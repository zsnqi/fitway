<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: verify-fitway runs an agent's own check (agent-tooling-r01, round run-and-ref)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-run-and-ref`, branch `tooling-run-and-ref`, HEAD `f79adba4`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16
  and 17.
- **Read first, only these:**
  - `D:/fitway-temp/retro-20261028/scripts-classified/REPORT.md`: what agents built for themselves, by class, and
    what each class worked around.
  - `.agents/skills/verify-fitway/SKILL.md` §"Discover and check", §"Compare" (its first paragraph and the extraction
    paragraph) and §"Evidence and advanced tools".
  - `.agents/skills/verify-fitway/drift-tree.mjs:14-118`: `extractDeclaredConcept`, the extraction this round reuses.
  - `.agents/skills/verify-fitway/core.mjs:84-134` and `:340-400`: fresh output folders, the preview, the port pairs.
  - `.agents/skills/verify-fitway/drive-plan.mjs:38-58`: `contextOptions`, drive's browser context.
  - `.agents/skills/verify-fitway/compare.mjs:180-235`: the exact diff compare runs on two pictures.
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

- `<run>` is `codex-round-run-and-ref`. The concept for the checks is the Owner Eclipse concept at the build
  branch's `fedbdb6d`; with V2 in place, reach it through `--ref fedbdb6d`. Use compare's port pairs only
  (3176-3177 and 3186-3187; 3188-3189 belong to other rounds).
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

An agent that needs a check no command makes writes only the check: verify-fitway serves the concept at any commit,
opens the browser as drive does, and hands the script what agents have been rebuilding in run folders, so no run
folder needs its own server, Playwright resolver, extraction or folder comparer.

## Causes and required outcomes

- **V1.** 197 of the 202 run-folder scripts that import Playwright point at another worktree's `package.json` or
  `node_modules`; 28 servers use ports the CLI refuses; six serve two trees side by side; none imports the existing
  helpers (the report's §4 and §3). Outcome: `run --script <file> --concept <folder> [--baseline <folder>] --out
  <folder> [-- <script arguments>]` runs a script file from any folder, with no `package.json` or `node_modules`
  above it. The CLI serves the concept, and the baseline when given, on a pair it claims through
  `reserveVerificationPorts` (`core.mjs`, whose tests already cover a taken port), as compare does; launches
  the browser drive uses; and calls the script's default export with one object holding at least `playwright`,
  `browser`, `url(side, page, query)`, `newPage(axes)` (axes named as drive names them: size, language, input,
  motion, colours; the context exactly as drive builds it), `rewrite` (V3), `out` (the fresh output folder) and
  `args`. What the export returns is written as `result.json` in `out`; a throw exits 1 with a `FAIL` line naming
  it; previews and browser close either way. Check, through `run` itself: a script in the run folder with no
  package above it, given `--ref` and `--baseline-ref` of V2's two commits and `-- --label x`, opens Settings at phone
  and at desktop in Arabic on both sides and returns each side's document height and the setting label V2's check
  names, plus `args` (exit 0; the two sides' labels differ and `args` holds `--label x`); a script that throws exits
  1 with its message; `newPage`'s context options equal `contextOptions` for the same axes
  (a unit test). Intent: nothing an agent's check needs is left for the agent to rebuild.
- **V2.** 33 of 42 run folders hold hand-extracted old trees; the commands were typed by hand (the report's §4).
  Outcome: `drive`, `compare`, `belonging-check` and `run` take `--ref <commit>` in place of `--concept`, and
  `compare` and `run` take `--baseline-ref <commit>` in place of `--baseline`. The CLI extracts the declared concept
  folder (`concept-source.json`'s `concept`) at that commit once into a folder per commit outside every Git tree,
  reuses it on later calls, and prints the folder and the full commit. An unknown commit fails before any browser
  starts, naming it. The extraction is `extractDeclaredConcept`'s, shared, not a second one. Check: find, with `git
  log` on the concept folder of `concept-source.json`'s ref, an earlier commit whose Settings page shows a different
  label from `fedbdb6d`'s, and name both commits and the label in the report; `compare --ref fedbdb6d --baseline-ref
  <earlier>` on Settings, `--feature page`, phone, Arabic and English, gives `COMPARE DIFFERENT` and prints both full
  commits and both extraction folders; the same command again prints that it reused both extractions;
  `compare --ref fedbdb6d --baseline-ref fedbdb6d` gives `COMPARE EQUAL`; `--ref 0000000` fails naming it. Intent: an
  old version is one option away.
- **V3.** 41 files in 15 folders rewrite a page's script in flight with `page.route` to count handler calls, inject
  data or plant a defect; no tool offers it. Outcome: `rewrite(page, file, from, to)` serves that concept file to
  that page with the exact text `from` replaced by `to`, and throws, naming the file and the number found, when
  `from` occurs other than exactly once. Only that file, on that page, changes: the concept's files on disk and
  every other response keep their bytes. Check: unit tests for one occurrence, none and two, and for two scripts
  holding the same `from` where only the named one changes; in V1's script, a rewrite that changes a visible label
  changes the text the page shows, and the concept file's SHA-256 is the same before and after. Intent: the planted defect and the spy are
  one call, and a stale `from` cannot pass silently.
- **V4.** One two-folder PNG comparer was copied ten times byte for byte; twenty folders compare folders of
  pictures by hand (the report's class C). Outcome: `diff-folders --a <folder> --b <folder> --out <folder>` compares
  every PNG by its path relative to each folder and prints one line each: `EQUAL`, `DIFFERENT` with the region and
  the changed pixels, `SIZE` with both sizes, `ONLY-A` or `ONLY-B`, then a summary; it exits 0 only when every line
  is `EQUAL`. It measures with compare's exact diff, moved out of `compare` so both call it; no tolerance. Check:
  folders holding, in nested subfolders, an equal pair, a one-pixel change, a size change and a file on one side
  only give those four lines with their relative paths; the unit test fakes the diff the way the X5 test in
  `cli.test.mjs` fakes diff_map; and a script in the run folder runs `diff-folders` with the real diff on two of
  V2's compare output folders and reports a line with its region and changed pixels. Intent: comparing two
  capture runs is one command.
- **V5.** Seventy tool calls dug through transcripts to learn who made a run folder and from what (agent-tooling
  DECISIONS item 17). Outcome: every command that writes an `--out` folder writes `manifest.json` there before its
  work: the command and its arguments, the checkout's commit and branch, the concept folder or ref, the start time;
  on finishing, whether it passed or failed, it adds the exit status and the end time. It is written where the CLI
  claims the folder (`freshEmptyOutput` in `core.mjs`), so a command cannot skip it; a command that writes `--out`
  without that call is made to call it. Check: unit tests on a drive, a compare and a run output folder, and on a run
  whose script throws after it starts (the manifest names the command and arguments, and records exit 1 and the end
  time). Intent: a folder says where it came from.
- **V6.** `SKILL.md` §"Evidence and advanced tools" asks agents to extend the path "instead of writing another
  server, launcher or capture loop" (since `8e520995`), and 36 of 40 such scripts are newer. Outcome: that section
  states the target instead: a check no command makes is a script for `run`, with one short example; `--ref` and
  `diff-folders` are stated where their commands are. A new section `## Where things live` is a table of what an
  agent looks for (the sizes, drive's context options and feature reach, the settled capture, compare's verdict, the
  bundle identity, the extraction, the port pairs, output folders, the test fixtures `fixture-copy.mjs` and
  `invalidationCases` in `compare-speed.test.mjs`) with the file and the export that holds it. A new section `##
  Proving a change to this tool` names, for each kind of change, the existing test or table it extends. A test reads
  the "Where things live" table and fails when a subject listed above has no row, or a named file or export does not
  exist (planted: a renamed export, and a removed row). Whether each row points at the right code is checked at the
  diff review.
  Intent: the pointer is read where the agent is about to build, and cannot go stale.
- **K1.** Existing commands keep their options and output; the only addition to their output folders is
  `manifest.json`. `pnpm test:verification` and `pnpm verify:fast` pass after the commit.
- **K2.** CI runs the tests without Playwright's Chromium or ui-forensics (`.github/workflows/checks.yml`): unit tests
  use fakes; each real-browser check above is a script in the run folder, run through `run`, and reported.
- **K3.** New tests go in new files named by the behaviour they prove; `cli.test.mjs` (4,500 lines) does not grow.
  No giant-file, ratchet, test floor or check limit is loosened; a fall is recorded with `pnpm code-health:baseline`;
  `pnpm check:tooling-map` passes (regenerate with `pnpm map:tooling`).

## Scope

You may change `.agents/skills/verify-fitway/` (`cli.mjs`, `SKILL.md` and `compare.mjs` must change; new modules
and test files go here), `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and `docs/agent-context/CODE_HEALTH_BASELINE.json`
(both regenerated), and `scripts/agent-environment/tool-registry.mjs` and `scripts/agent-environment/tool-help-notes.mjs`
if a new command must be registered there; commit once when done. Everything else is read-only. Add no dependencies.

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

Include exactly one `commit` line and one row for each of V1-V6 and K1-K3. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed and anything you could not do.
