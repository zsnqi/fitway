<!-- brief-format: v1 role: verifier -->
# Verifier brief: the environment phase's closing review (agent-environment-r03)

For a fresh `sonnet-researcher` (Sonnet, high): an acceptance audit of a repository-infrastructure milestone, with no
UI to inspect. Verify independently: do not read the coordinator's resume files, handoff rationale or this session's
reasoning before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-design-exploration-r04`, branch `codex/owner-redesign-r04`, HEAD `5ab33aab`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-28.
- **Read first, only these:** `docs/phase-records/task-packets/agent-environment-r03.yaml` (acceptance criteria,
  verification profile, ordered gates, required artifacts); the milestone's record in `PROJECT_STATE.yaml` (owned and
  forbidden paths, base commit); `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md`.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/r03-closing-review/`; the coordinator checks `git status` afterwards. (r04 G5)

## What was delivered

The milestone's work from base `cf7758eb` to `5ab33aab` on the coordinator line. That line also carries
owner-design-exploration-r04's commits; judge only commits that touch this milestone's owned paths, and check that
none of them touches its forbidden paths. Evidence records: `docs/phase-records/handoffs/agent-environment/codex-rounds.md`,
`rounds.tsv`, `findings.tsv` beside it, `.agents/skills/gardener/REPORT.md`, the briefs under
`docs/phase-records/handoffs/agent-environment/r03/briefs/`.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| A1-A6 | Each of the packet's six acceptance criteria, met or not | the file, line or command output that shows it |
| A7 | Every audit item in AUDIT.md is closed by a named change, or still open with a reason | item, commit or record line |
| A8 | Scope: no milestone commit touches a forbidden path; owned-path commits contain no unrelated work | `git log --name-only` over the range |
| A9 | `node scripts/verify.mjs fast` passes and leaves `git status --short` unchanged | the last lines of its output |
| A10 | `pnpm check:repository`, `pnpm check:agent-context` and `pnpm exec biome ci .` pass | exit codes |
| A11 | The verify-fitway skill runs end to end: doctor, one mapped feature driven, cleanup with ports 3176-3177 free afterwards (concept from `git archive` of `owner-followup-r04-build`, never its worktree) | commands and the evidence folder |
| A12 | The gardener survey (`.agents/skills/gardener/pass.ps1 -Out <fresh folder under your run folder>`) completes and its report has the code-health and records sections | the report's lines |
| A13 | Every open line of `findings.tsv` for this milestone is either fixed, carried to a named milestone, or open with a reason a reader can act on | the line ids |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why; anything that reads or works wrong though it passes its check or meets its rule,
with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"). Then a verdict: PASS or
FAILED_VALIDATION for the milestone. At most 60 lines.
