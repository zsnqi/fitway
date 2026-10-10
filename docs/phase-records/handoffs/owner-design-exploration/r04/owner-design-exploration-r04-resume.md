<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `435b5268`, 2026-10-11 00:30 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-44), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 12-16, the environment phase), `docs/agent-context/WORKING_AGREEMENTS.md`

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
  focus trial on the build: `D:/fitway-temp/ui-forensics-1.1.0/REPORT.md`. Its observation (on the phone the tuner's
  «الإضاءة» toggle takes keyboard focus while offscreen) is Codex round tuner-reach and its repair (`codex-rounds.md`).
- **SPEC.md** is no longer in this milestone's owned paths (the user said yes, 2026-10-08): its one wording landed in
  `4851cccf`; a later Product/Spec amendment opens separately.
- **main is the trunk** (DECISIONS 40), fast-forwarded to this line whenever CI passes on it.
- **pstack skills installed** user-level and unmodified (cursor/plugins at `df58112`, MIT): create-verification-skill
  and maintain-verification-skill, with a LICENSE and SOURCE.md beside each.
- **The discussion page** for the user (Arabic, private): https://claude.ai/artifact/88rd7XwoWHvnYhqbtxA1dm, updated as
  the environment phase moves. Its digests: `D:/fitway-temp/verification-discussion-20261007/`.
- access-reason-cap-r01 stays paused by the user (its own handoff says how to resume). Parked by the user: the
  pixel-character pane mod and the usage-band redesign (`D:/fitway-temp/claude-pixel-crew/`).

## Running now

- **The CSS round is closed** (2026-10-10, build `d1a01f3c`; spec `css-round-spec.md`, DECISIONS 41-43). Its rounds
  and grades are in `codex-rounds.md`:
  - the mechanical part (`691d62d5`);
  - the press and the two lists (`b2b2f4c1`);
  - the independent review (`D:/fitway-temp/owner-r04-css-review/`);
  - the taste fixes (`41821f38`);
  - the review fixes (`3b673daa`), which the user tried on both phones and found without problems (DECISIONS 43);
  - press-hook (`eb18b17a`), whose mechanism was replaced;
  - press-hook-2 (`d1a01f3c`): the tried mechanism, `data-press` for a new control, and
    the concept's new `check-press-layer` tool guarding the layer.
- Lows left open, all from before the round:
  - a key's glyph softens during the 240 ms settle (MOT-1 is the suspect);
  - Reports' and Activity's recipes have no error-state proof for `page-retry`;
  - the concept's index check (its tools folder) runs only inside a worktree.
- Phone testing research (2026-10-10): `D:/fitway-temp/mobile-testing-research/ios/REPORT.md` and
  `D:/fitway-temp/mobile-testing-research/android/REPORT.md`. The user tries both phones themselves (no ADB, no cloud).
- Report-only, under load only: the dialogs', popover's and records card's parts split across threads under a planted
  stall; rounds item 11 to decide whether they are errors on a real machine.

## Next steps

Sessions (the user, 2026-10-11): three kinds of work, three sessions.
- the environment phase's last items (step 0), typed «كمّل البيئة»;
- access-reason-cap-r01, typed «كمّل مهمة الـ240»; it may run beside the first, in its own worktree;
- Settings (step 2), typed «كمّل الإعدادات»; it starts only after the environment phase closes, on its fixed tools.
A plain «كمّل» starts the first that is open, in that order.

0. **Start here: the environment phase's last items** (agent-environment-r03 resume point). These are:
   - F115, the CLI's held press counting a hover as a press;
   - F116, `brief:check` passing a decision pointer the named file does not hold;
   - a written rule that a check an agent scripts twice becomes a feature of the verify-fitway CLI (the user agreed,
     2026-10-10);
   - then its closing review.
   access-reason-cap-r01 restarts after the CSS round, before Settings, with its scope revisited first (the ledger).
   The concept CSS check, and now `check-press-layer`, join the fast ladder only once the build is on the trunk.

1. **After the environment phase:** the Owner screens resume with its tools (the verify-fitway skill and the CLI).
   The first concept round moves Daily into its own script and stylesheet, before Settings (DECISIONS 44); the
   frames before and after compare equal.
2. **Then Settings**, Operations (the header status's details) and Monitoring, each per rounds items 6 and 8-11 in
   DECISIONS, built with the motion and checked with the new tools.
3. **Daily and Reports' last round:** the user's open comment on Reports' «معدّل الموجودين» card (`#fig-avg`,
   DECISIONS 30), redrawn by a designer and shown before it is built; fix-3's open findings
   (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`); the waiting lows.
4. **Access's last round:** the items in Next steps 4 of the 2026-10-05 resume point (N1-N7, the Retry ring, OWN-C9,
   the rail's focus ring).
5. **After each resume point,** fast-forward main to this line once CI passes on it (DECISIONS 40), and update the
   discussion page.
6. **The good-css review** (2026-10-08, `good-css-review.md` in this folder) became the CSS round above. The skill
   goes in slash-only, as a reference, at the production (apps/web) stage (the user, 2026-10-08).

## Waiting on the user

Nothing; the phone try comes after the Codex round (Next steps 0.2).

## Known risks

- **The build** is pushed at `ec314ce2` (2026-10-08): the tuner's repair, graded and accepted; its one open finding is a
  flash of one or two frames where the closed toggle covers the phone header's buttons after a jump to the top
  (`codex-rounds.md`, tuner-reach fix-1).
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
  commit that adds this text (parent `090a272b`).
- Build: D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build, expected HEAD `d1a01f3c`.
- The environment phase: `docs/phase-records/handoffs/agent-environment/20261007-140000-agent-environment-r03-activation.md`.
- Motion: designer `D:/fitway-temp/owner-r04-motion/`, review `D:/fitway-temp/owner-r04-motion-review/`, research
  `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
