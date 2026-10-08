---
name: gardener
description: Survey FITWAY environment drift and sediment weekly, at milestone closure, or when a review repeats a known finding class; make at most one bounded correction and report to the coordinator.
---

# FITWAY gardener

Run a pass weekly, when a milestone closes, and when a review repeats a known
finding class. This skill is shared by Claude and Codex. Resolve the enclosing
checkout from this file; the current shell directory is not authoritative.

## Fixed checklist

Review every class, recording evidence or “none” for each:

1. **A correction seen twice:** turn the repeated cause into a lint, test, check
   or template field, or record why that would not help. Compare the previous
   rolling report and the current open records; follow a named review pointer
   when the trigger is a repeated review finding.
2. **Drift:** docs, maps, indexes and code disagree. Follow only the flagged
   source pair; product regressions go to the coordinator.
3. **Sediment:** dead files/scripts, duplicate tools, stale handoffs, merged
   branches/worktrees, dead registrations and unreferenced temp folders.
4. **Gate gaps:** a check is local only, called twice, fails, or cannot fail on
   its claimed defect. The survey identifies coverage/failures; verify a
   suspected ineffective gate with a disposable fixture outside the checkout.
5. **Rules nothing needs:** duplicate or dead-path rules and rules whose reason
   no longer applies. Propose policy removals to the coordinator.

## Survey

From PowerShell, replace the checkout path if this skill has moved:

```powershell
$root = 'D:/Projects/fitway-worktrees/agent-environment-r03-gardener'
$env:TEMP = 'D:/fitway-temp'
$env:TMP = 'D:/fitway-temp'
node "$root/.agents/skills/gardener/survey.mjs" --out D:/fitway-temp/gardener-pass
```

Use a fresh run directory. `SURVEY PASS` means collection finished, not that the
environment is clean. `SURVEY BLOCKED` names incomplete collection. Read both
`REPORT.md` and `survey.json` there. The command reads local Git state without
fetching, follows the ledger's open resume files and packets and their named
briefs, measures temp folders without traversing junctions, and executes each
`check:*` plus `brief:check` for running/next briefs. Checks run serially; their
exit codes and output are evidence. No dependencies or services are installed.
The sole writes are its external report and proposed cleanup script; no
housekeeping runs during the survey. Unknown check commands are blocked until
their read-only behavior is established in this helper.

## Pass procedure

1. Read `AGENTS.md` and the open ledger. Establish ownership before a change.
   Run the survey. Collection errors, missing sources and ambiguous open-brief
   references remain blockers; preserve their output, never call them clean.
2. Review all five classes. Treat flags as facts to investigate, not permission
   to remove anything. Preserve evidence any record points to, including a
   report named by a decision. Search references before proposing removal.
3. Choose **at most one bounded change**, ordered by repeated correction,
   drift, sediment, gate gaps, then obsolete rules; within a class sort by
   repository path. Prefer the first proven, authorized fix. Record every
   deferred finding so two passes on the same state choose the same outcome.
   Git housekeeping allowed by WORKING_AGREEMENTS may be that one change:
   delete only merged, unreferenced branches with no registered worktree;
   prune only confirmed missing registrations. Respect any narrower brief.
4. Verify the change with its focused check and required project gates; record
   command, exit code and proof line. A failed verification is **blocked**.
   For folders, only propose the generated `cleanup.mjs` for the user to run:
   `node D:/fitway-temp/gardener-pass/cleanup.mjs`. Never run it yourself.
   It uses `rmdir /s /q` with a `\\?\` absolute path, rechecks open records and
   worktree cleanliness, skips unsafe candidates, continues after failures,
   and reports each result. Folder age/size alone never authorizes deletion.
5. Replace `.agents/skills/gardener/REPORT.md` with the last pass's date,
   outcome, survey path and findings, the five-class assessment, change made
   or proposed, verification and items waiting for the coordinator. This is
   one rolling report, not a new milestone. Reports themselves are pass
   bookkeeping, not the bounded correction. Include the coordinator's proposed
   ledger entry; the gardener never edits the ledger:

   The rolling report must start with this YAML frontmatter (use the pass's
   actual date and outcome), followed by the findings and verification:

   ```yaml
   ---
   date: '2026-10-07'
   outcome: blocked
   ---
   ```

   ```yaml
   gardener:
     date: '2026-10-07'
     outcome: blocked
     report: .agents/skills/gardener/REPORT.md
   ```

   If proposing folder removals, run the same survey command once more with a
   fresh output directory after the rolling report and coordinator ledger entry
   are final. Give the user that final `cleanup.mjs`; any later record change
   invalidates it and requires another survey. Keep the report's referenced
   initial evidence. The cleanup script checks every open-record hash as well
   as current references, so it cannot use a stale proposal.

## Limits and outcomes

Product semantics, design decisions and referenced evidence are outside this
skill's edit scope. Policy removals, ownership conflicts, security/privacy
ambiguity, and any action outside authorization go to the coordinator as
proposals. Folder deletion always belongs to the user. Remote branch deletion
needs explicit authorization; the survey does not fetch or push.

- **clean:** collection and all five assessments complete, no actionable
  findings, no correction needed.
- **changed:** one authorized correction verified, collection complete, and
  every remaining flag resolved or explicitly deferred to the coordinator.
- **blocked:** collection/verification incomplete, or actionable findings
  remain but no correction can safely be made within this pass's authority.

Use blocked over changed if both apply. A proposal is not a completed change.
The coordinator reads the rolling report at startup via the optional `gardener`
ledger entry and writes that entry after reviewing the pass. Check it with
`pnpm check:repository`; date/outcome/path must match the rolling report.
