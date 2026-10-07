<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `81334114`, 2026-10-07 10:39 +03:00; owner-followup-r04-build at `e74ca06`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261005-002341-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (new today: 40), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build at `e74ca06`
  (worktree D:/Projects/fitway-worktrees/owner-followup-r04-s04); the motion round is done (DECISIONS 36-39). The user
  reviews on the live site (the eclipse-build preview on port 3174), not on a published copy (2026-10-07).
- **Decided 2026-10-07 (DECISIONS 40):** this line merges into main, which becomes the trunk; a verification-tooling
  round runs before Settings; pstack's two verification skills are tried in that round.
- **pstack skills installed** user-level and unmodified (cursor/plugins at `df58112`, MIT): create-verification-skill
  and maintain-verification-skill in C:/Users/Pc Force/.agents/skills, with junctions from ~/.claude/skills and
  ~/.codex/skills, and a LICENSE and SOURCE.md beside each.
- **CI** (`.github/workflows/checks.yml`) failed on every push from 2026-10-02, always in
  `scripts/verify-repository.mjs`: relative paths in the r04 resume point (2026-10-05), the same file missing "Waiting on
  the user" (2026-10-06), and expired leases in the build branch's older copy of `PROJECT_STATE.yaml`. The commit that
  adds this file makes this resume point through `pnpm handoff:new`, renews the agent-environment-r02 and
  access-reason-cap-r01 leases as the coordinator (nothing else in either changes), and drops the backticks from
  machine-local paths and branch names in their handoffs, because the runner has neither.
- **Discussion digests**, saved verbatim (the talk, what the repository enforces, the mistakes agents repeat, the
  concept's capture code): `D:/fitway-temp/verification-discussion-20261007/` (REPORT-1 to REPORT-4, grouped.txt).
- access-reason-cap-r01 stays paused by the user (its own handoff says how to resume). Parked by the user: the
  pixel-character pane mod and the usage-band redesign (`D:/fitway-temp/claude-pixel-crew/`).

## Running now

- **The integration of this line into main** (Next steps 1-3).
- Report-only, under load only: the dialogs', popover's and records card's parts split across threads under a planted
  stall; rounds item 11 to decide whether they are errors on a real machine.

## Next steps

1. **Merge origin/main into this branch.** One conflict, `docs/WORKFLOW.md`: take main's `bbb51709` removal of the
   retired "External worker data boundary" section (the line's 2026-09-19 rewrite is the earlier text). Run the four
   CI steps locally (`pnpm biome ci apps packages scripts`, `node scripts/check-agent-context.mjs`,
   `node scripts/verify-repository.mjs`, `node scripts/run-vitest.mjs run scripts`), push, and wait for the Checks run.
2. **Fast-forward main** to that merge (`git push origin codex/owner-redesign-r04:main`, never force) and check its
   Checks run. Leave the main checkout D:/Projects/fitway alone: it carries an uncommitted one-line AGENTS.md change
   from 2026-09-06.
3. **Merge main into owner-followup-r04-build.** Two conflicts,
   `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` and
   `docs/agent-context/WORKING_AGREEMENTS.md`, from the build side's 2026-10-04 brief commits `4064738a` and
   `8451f711`: keep both sides' entries, the coordinator line's wording where they overlap; push and check its Checks run.
4. **Publish the discussion page** (Arabic, a private artifact; approved by the user on 2026-10-07) and add its link here.
5. **Open the tooling milestone** from the new main, per DECISIONS 40: its packet, owned paths and first brief, from
   `D:/fitway-temp/verification-discussion-20261007/` and the two installed skills.
6. **Then Settings**, Operations (the header status's details) and Monitoring, each per rounds items 6 and 8-11 in
   DECISIONS, built with the motion and checked with the new tools.
7. **Daily and Reports' last round:** the user's open comment on Reports' «معدّل الموجودين» card (`#fig-avg`,
   DECISIONS 30), redrawn by a designer and shown before it is built; fix-3's open findings
   (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`); the waiting lows.
8. **Access's last round:** the items in Next steps 4 of the previous resume point (N1-N7, the Retry ring, OWN-C9, the
   rail's focus ring).

## Waiting on the user

Nothing. The user approved the main merge and the page on 2026-10-07.

## Known risks

- **The resume-point checker on CI:** on the GitHub runner, a backticked machine-local absolute path (other than
  D:/fitway-temp) or a slashed branch name other than the one being built fails
  `scripts/agent-environment/resume-point.mjs`. Write them as plain text until the tooling round fixes the checker.
- **Leases on CI:** the lease check reads the wall clock, so a branch carrying an older `PROJECT_STATE.yaml` fails CI
  once a lease in it passes. The tooling round scopes the check.
- main has no branch protection (a private repository on GitHub's free plan); nothing found deploys on a push to main.
- The Agent tool's worktree isolation cuts from main: until main moves, such agents start from 2026-09-24.
- Artifacts are per account; links from an earlier account do not open or update on a later one. Claude's auto-mode
  classifier refuses changes to the frontier preservation guard, and refused one artifact publish until the user
  approved it in chat.
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30); the motion's
  smoothness was measured headless only (V10).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The preview server (Python's http.server) sends no cache headers; after a build a stale reports.js can throw until a
  hard reload.
- Lighter sessions in this worktree: its untracked .claude/settings.local.json turns off account-synced plugins and
  claude.ai connectors for this worktree only.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that adds this file (parent `81334114`).
- Build: D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build, expected HEAD `e74ca06`.
- Discussion digests: `D:/fitway-temp/verification-discussion-20261007/`.
- Motion: designer `D:/fitway-temp/owner-r04-motion/`, review `D:/fitway-temp/owner-r04-motion-review/`, research
  `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
