<!-- brief-format: v1 role: builder -->
# Fixer brief: the code review's three blocking findings on `pnpm wait` and `pnpm decision` (agent-tooling-r01)

For a fresh `owner-direction-fixer` (Sonnet). The targets are frozen; make exactly these edits.

- **Worktree:** `D:/Projects/fitway-worktrees/agent-tooling-r01`, branch `agent-tooling-r01`, HEAD `0aeebde8`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` item 26.
- **Read first, only these:** `scripts/agent-environment/decision.mjs` lines 15-45; `scripts/agent-environment/lesson-command-cases.ts`; `scripts/agent-environment/tool-contract.test.ts` lines 1-10 and 145-155; the one line naming that cases file in `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`.

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

## The decision

The round's diff review found three blocking findings and the coordinator accepted all three. The brief of that round named `pnpm decision agent-environment 3`, but `agent-environment` is not a milestone id and no resume of that exact name exists, so the code added a guess to meet it. The id is `agent-environment-r03`; that was the brief's mistake, not the implementer's.

## Causes and required outcomes

- **F1.** `scripts/agent-environment/decision.mjs` also accepts any file starting `<milestone-id>-` and ending `-resume.md`, and takes the last one in sort order. Outcome: only a file named exactly `<milestone-id>-resume.md` is found; if none exists, the existing failure sentence prints. `pnpm decision agent-environment-r03 3` prints the item as `pnpm decision agent-environment 3` did, and `pnpm decision agent-environment 3` exits 1 with that sentence. Change the probe labelled "decision prints agent-environment item 3" to the id `agent-environment-r03`, and its label to match. Keep the file walk; remove only what the prefix rule and the sort needed.
- **F2.** `waitUsageProbes` in the cases file repeats the missing-pattern case that `contractProbes` already generates from the registry. Outcome: the probe labelled "wait refuses a missing pattern through the usage contract" is gone. First confirm in `scripts/agent-environment/tool-contract-probes.ts` that a required-option case is generated for `wait`; if it is not, leave the probe, and say so in the report. If it leaves `waitUsageProbes` empty, remove that function and its call too.
- **F3.** The file and export are named after the round. Outcome: `git mv` `scripts/agent-environment/lesson-command-cases.ts` to `scripts/agent-environment/wait-decision-cases.ts`, and rename the export `lessonCommandProbes` to `waitDecisionProbes`, in that file, in `scripts/agent-environment/tool-contract.test.ts`, and in the code map's line.

## Limits

Change nothing else: not the commands' other behaviour, not `tool-compatibility.json`, not the registry, not `docs/phase-records/handoffs/agent-tooling/briefs/codex-lesson-commands.md`.

## Verification

Run, from the worktree: `node scripts/run-vitest.mjs scripts/agent-environment/tool-contract.test.ts`, `pnpm check:repository`, `pnpm check:code-health`, `pnpm decision agent-environment-r03 3`, `pnpm decision agent-environment 3`. Do not run the ladder; CI runs it on the push.

Commit once on `agent-tooling-r01` with the message `fix(agent-tooling): the review's three findings on wait and decision`. Do not push.

## Report

Final message: the commit, one line per outcome, each command above with its result, anything you left and why. Run folder: `D:/fitway-temp/tooling-lesson-commands-fix-1/`.
