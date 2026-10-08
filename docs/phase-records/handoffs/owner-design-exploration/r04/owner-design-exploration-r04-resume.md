<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `16733852`, 2026-10-07 13:45 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (item 40), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 12-16, the environment phase), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04); the motion round is done (DECISIONS 36-39). The user reviews on
  the live site (the eclipse-build preview on port 3174), not on a published copy (2026-10-07).
- **The environment phase comes first** (2026-10-07, `16733852`). The user widened the coordinator's mandate for it:
  old rules, workflows, tools and records stay only on evidence (agent-environment DECISIONS 12-16).
  agent-environment-r03 carries it, with DECISIONS 40's tooling round, an audit, the cleanup and a permanent
  gardener. It absorbed agent-environment-r02, and took CLAUDE.md, .claude/agents/**, .claude/skills/** and
  biome.json from this milestone, which keeps the Owner concept and its records.
- **ui-forensics 1.1.0** (the user's machine-level skill), reviewed and extended for the phase; report, patch and a
  focus trial on the build: `D:/fitway-temp/ui-forensics-1.1.0/REPORT.md`. The trial left one observation for this
  milestone: on the phone, the tuner's «الإضاءة» toggle takes keyboard focus while offscreen.
- **main is the trunk** (DECISIONS 40), fast-forwarded to this line whenever CI passes on it.
- **pstack skills installed** user-level and unmodified (cursor/plugins at `df58112`, MIT): create-verification-skill
  and maintain-verification-skill, with a LICENSE and SOURCE.md beside each.
- **The discussion page** for the user (Arabic, private): https://claude.ai/artifact/88rd7XwoWHvnYhqbtxA1dm, updated as
  the environment phase moves. Its digests: `D:/fitway-temp/verification-discussion-20261007/`.
- access-reason-cap-r01 stays paused by the user (its own handoff says how to resume). Parked by the user: the
  pixel-character pane mod and the usage-band redesign (`D:/fitway-temp/claude-pixel-crew/`).

## Running now

- Nothing in this milestone; the environment phase runs in agent-environment-r03 (its handoff says what).
- Report-only, under load only: the dialogs', popover's and records card's parts split across threads under a planted
  stall; rounds item 11 to decide whether they are errors on a real machine.

## Next steps

1. **After the environment phase:** the Owner screens resume with its tools (the verify-fitway skill and the CLI).
2. **Then Settings**, Operations (the header status's details) and Monitoring, each per rounds items 6 and 8-11 in
   DECISIONS, built with the motion and checked with the new tools.
3. **Daily and Reports' last round:** the user's open comment on Reports' «معدّل الموجودين» card (`#fig-avg`,
   DECISIONS 30), redrawn by a designer and shown before it is built; fix-3's open findings
   (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`); the waiting lows.
4. **Access's last round:** the items in Next steps 4 of the 2026-10-05 resume point (N1-N7, the Retry ring, OWN-C9,
   the rail's focus ring); and the tuner toggle above, if the user wants it handled.
5. **After each resume point,** fast-forward main to this line once CI passes on it (DECISIONS 40), and update the
   discussion page.
6. **CSS findings from the good-css review** (2026-10-08, `docs/phase-records/handoffs/owner-design-exploration/r04/good-css-review.md`,
   counts re-checked by the coordinator): 5 of the concept's 77 `:hover` rules sit behind a hover media query, so hover
   sticks after a tap on the phone and tablet (gate with `(hover: hover)` only, not `pointer: fine`, because of the
   tablet band); 12 `outline: none` rules to check against a visible focus; no `forced-colors` support; no
   `viewport-fit=cover`, so the safe-area insets are inert. A Codex fix round on the build. With it, DECISIONS 41
   (the user said yes, 2026-10-08): press feedback on every pressable control (its form drawn by a designer first)
   and field text of at least 16 px. The
   skill is not installed; it goes in slash-only, as a reference, at the production (apps/web) stage (the user,
   2026-10-08).

## Waiting on the user

Nothing.

## Known risks

- **The build branch's CI:** owner-followup-r04-build still carries the old wall-clock lease check, which main has
  dropped (agent-environment-r03), and fails CI on a push after 2026-10-10: merge main into it before its next push.
- main has no branch protection (a private repository on GitHub's free plan); nothing found deploys on a push to main.
  The main checkout D:/Projects/fitway keeps its local main at `bbb51709` and an uncommitted one-line AGENTS.md change
  from 2026-09-06; it was left untouched.
- Artifacts are per account. Claude's auto-mode classifier refused one artifact publish until the user approved it in
  chat, and a commit that moved milestone ownership until the user granted the wider mandate (2026-10-07).
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30); the motion's
  smoothness was measured headless only (V10).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The preview server (Python's http.server) sends no cache headers; after a build a stale reports.js can throw until a
  hard reload (agent-environment-r03 delivers the no-store preview).
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that adds this text (parent `16733852`).
- Build: D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build, expected HEAD `a474fe30`.
- The environment phase: `docs/phase-records/handoffs/agent-environment/20261007-140000-agent-environment-r03-activation.md`.
- Motion: designer `D:/fitway-temp/owner-r04-motion/`, review `D:/fitway-temp/owner-r04-motion-review/`, research
  `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
