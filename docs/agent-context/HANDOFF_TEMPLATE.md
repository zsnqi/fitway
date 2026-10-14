# Resume point template

A resume point is the coordinator's current state for the next session. A fresh session reaches
it from the startup route: `PROJECT_STATE.yaml` names the milestone's `handoff`, and
`pnpm context:show --milestone <id>` prints it. The user's next message may be only "كمّل"
(continue), so the resume point must stand alone.

## Writing one

1. Run `pnpm handoff:new --milestone <id>`. It uses `<id>-resume.md` in the current handoff's
   directory (or `--dir`), creates it from the block below if absent, and otherwise changes
   only its As of line. The ledger names the file; the packet and other ledger fields stay
   untouched. Git history is the chain.
2. Rewrite every section from the current truth. Carry forward only what is still true; a step
   that a later decision replaced is deleted, not annotated.
3. Put any decision that outlives this round in the milestone's `DECISIONS.md` (see below), and
   any rule about how the user and agents work in `docs/agent-context/WORKING_AGREEMENTS.md`.
   The resume point links to them and never restates them.
4. Run `pnpm check:repository`, then commit and push.

The file is done when a reader with no other context could take the first next step without
searching: every input is named by path and section, every worktree by absolute path, branch and
expected HEAD. An agent's report reaches only the session that launched it, so when its findings
feed a next step, the coordinator saves the report verbatim in that run's evidence folder as it
arrives (`D:/fitway-temp/<run>/REPORT.md`, outside the repository), and the resume point names that
file instead of summarising the findings. (coordinator, 2026-10-04, after the user asked why a
session searched an old transcript: the resume point had cut the findings to one line each)

Rules the checker enforces: at most 12 KB; the two required header lines and six sections below, in
order; every repository path in backticks exists; no session ids (`local_…`), because they change
when the app restarts. Name a session by its title instead. Older timestamped handoffs still
pass; an optional Previous resume point header is ignored by path validation.

Leave out reasoning and narrative. Evidence lives in commits, evidence receipts and phase records.

<!-- template:start -->
<!-- handoff-format: resume-point-v1 -->
# <milestone-id>: resume point

- **As of:** `<branch>` at `<short sha>`, <YYYY-MM-DD HH:MM> +03:00
- **Standing decisions:** `<repo path to the milestone's DECISIONS.md>`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

What exists now and what was last delivered, with commit hashes.

## Running now

Agents, Codex rounds or jobs in flight, and where their output will land. "Nothing." if none.

## Next steps

1. Decided steps only, in order; each names its inputs by path and section.

## Waiting on the user

Questions or picks the user owes, each answerable in one line. "Nothing." if none.

## Known risks

Traps the next session would otherwise rediscover: environment quirks, defects already in the
baseline, assumptions not yet measured.

## Pointers

- Worktree: `<absolute path>`, branch `<branch>`, expected HEAD `<short sha>`.
<!-- template:end -->

## The milestone's DECISIONS.md

One file per milestone, next to its resume points. It holds the decisions in force and nothing
else: each entry gives the date, who decided (user or coordinator), the decision in one or two
lines, and a pointer to where it was recorded. When a decision changes, edit its entry in place
and update the date; the old wording stays in git history. Long rule sets that already have a
home (a ban list, a design spec) are linked by path and section, not copied.
