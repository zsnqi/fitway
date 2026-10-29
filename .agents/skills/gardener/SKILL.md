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
2. **Code health:** report giant files, type escapes, suppressions, repeated
   workarounds, duplication, and concept boundary breaks with file and line
   evidence. Propose at most one report-only improvement to the coordinator;
   never edit architecture in this class.
3. **Drift:** docs, maps, indexes and code disagree. Follow only the flagged
   source pair; product regressions go to the coordinator.
4. **Gate gaps:** a check is local only, called twice, fails, or cannot fail on
   its claimed defect. The survey identifies coverage/failures; verify a
   suspected ineffective gate with a disposable fixture outside the checkout.
5. **Sediment:** dead files/scripts, duplicate tools, stale handoffs, merged
   branches/worktrees, dead registrations and unreferenced temp folders.
6. **Rules nothing needs:** duplicate or dead-path rules and rules whose reason
   no longer applies. Propose policy removals to the coordinator.

## Survey

From PowerShell in any FITWAY checkout, run this unchanged. The launcher resolves
`$root` from its own `$PSScriptRoot`, rather than a machine-specific checkout:

```powershell
& ./.agents/skills/gardener/pass.ps1
```

For folder, branch, registration, or worktree proposals, read
`.agents/skills/gardener/CLEANUP.md` before reviewing generated cleanup scripts
and their safety evidence.

The console states `SURVEY CLEAN` or `SURVEY BLOCKED` first, except when the survey cannot start:
a value it cannot use (such as `--out`) prints `gardener:survey: FAIL: <what> (<how to fix>)` first,
then `SURVEY BLOCKED`. Read both
`REPORT.md` and `survey.json` in the output. Collection runs local checks
without housekeeping; removal safety is defined in CLEANUP.md.

The survey runs every `check:*` in package.json except `config.json`'s
`notRunChecks`; each exception is reported as not run with its reason. A
configured name missing from package.json is a blocker. Every nonzero exit
remains a failure. Checks run serially; a mutating check is named and blocks
the pass. pnpm's dependency preflight uses `error`, never `install`; a
dependency mismatch withholds collection and cleanup. No dependencies or
services are installed, and scratch files stay under the excluded output.

The code-health concept scope derives its boundary-break shared-file set from
the configured concept folder's HTML pages. Stylesheet and script links are
followed through CSS `@import` and JavaScript `import` edges, and configured
specimen pages are excluded as page origins. Shared-file matching uses the
resolved path in the concept folder, never a basename. When this derivation
method changes, the concept boundary-break measure starts a new baseline rather
than reporting a rise or fall against the old list.

The survey runs `brief:check` for running or next briefs without a recorded
result in the environment round log. A clean worktree with committed work
beyond its brief's launch HEAD waits for its round record; an unlaunched or
ambiguous brief still gets checked. Unmeasured worktree status is explicitly
unknown with its reason, never dirty. The **Worktrees awaiting review** section
names old unmerged worktrees and the console counts them; review-only findings
are deferred to the coordinator and do not by themselves block the pass.

## Pass procedure

1. Read `AGENTS.md` and the open ledger. Establish ownership before a change.
   Run the survey. Collection errors, missing sources and ambiguous open-brief
   references remain blockers; preserve their output, never call them clean.
2. Review all six classes. Treat flags as facts to investigate, not permission
   to remove anything. Preserve evidence any record points to, including a
   report named by a decision. Search references before proposing removal.
3. Choose **at most one bounded change**, ordered by repeated correction,
   code health, drift, gate gaps, sediment, then obsolete rules; within a
   class sort by repository path. Prefer the first proven, authorized fix.
   Record every deferred finding so two passes on the same state have the same
   outcome. The pass deletes nothing; removals are proposals.

4. Verify the change with its focused check and required project gates; record
   command, exit code and proof line. A failed verification is **blocked**.
   For any removal proposal, follow CLEANUP.md. The pass deletes nothing and
   proposes only the generated script for user or coordinator review.

5. Replace `.agents/skills/gardener/REPORT.md` with the last pass's date,
   outcome, survey path and findings, the six-class assessment, change made
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

   List proposed folders as one absolute path per bullet in this exact section:

   ```markdown
   ## Folder removal proposals
   - `D:/fitway-temp/example-folder`
   ```

   Keep evidence citations outside that section. Finalize the rolling report,
   including both survey output paths, before the final survey. Then run the
   launcher with a fresh `-Out` and
   `-FinalReport <absolute-checkout>/.agents/skills/gardener/REPORT.md`.
   It rechecks safety and emits exactly the report's list; an unsafe listed folder
   blocks collection. Newly eligible folders wait for the next pass. An expected
   ledger/report date or outcome mismatch is reported as waiting for the coordinator;
   its failed check remains visible but does not block collection. Do not wait for
   the coordinator to write the ledger before producing the final script.
   The coordinator reviews and merges the accepted pass, writes its `gardener`
   ledger entry, then reruns the report's final survey command with a fresh `-Out`
   and the same `-FinalReport`, as `docs/WORKFLOW.md` prescribes. Give the user
   that rerun's `cleanup.mjs`. Do not edit the report after its final survey.
   A change only to the ledger's `gardener` entry leaves the earlier script
   runnable; any other open-record change invalidates it and names the changed
   source in the refusal. The coordinator still reruns to refresh checks and
   safety evidence after integration and bookkeeping.
   Keep the report's referenced
   initial evidence. The cleanup script checks every open-record hash (excluding
   only the ledger's `gardener` entry) as well as current references, so it
   cannot use a stale proposal.

## Limits and outcomes

Product semantics, design decisions and referenced evidence are outside this
skill's edit scope. Policy removals, ownership conflicts, security/privacy
ambiguity, and any action outside authorization go to the coordinator as
proposals. Folder deletion always belongs to the user. Remote branch deletion
needs explicit authorization; the survey does not fetch or push.

- **clean:** collection and all six assessments complete, no actionable
  findings, no correction needed.
- **changed:** one authorized correction verified, collection complete, and
  every remaining flag resolved or explicitly deferred to the coordinator.
- **blocked:** collection/verification incomplete, or actionable findings
  remain but no correction can safely be made within this pass's authority.

Use blocked over changed if both apply. A proposal is not a completed change.
The coordinator reads the rolling report at startup via the optional `gardener`
ledger entry and writes that entry after reviewing the pass. Check it with
`pnpm check:repository`; date/outcome/path must match the rolling report.
