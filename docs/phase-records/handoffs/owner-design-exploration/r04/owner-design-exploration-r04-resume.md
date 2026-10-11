<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `79f3efd6`, 2026-10-11 04:45 +03:00 (the environment phase closed)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-44), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04); the motion round is done (DECISIONS 36-39). The user reviews on
  the live site (the eclipse-build preview on port 3174), not on a published copy (2026-10-07).
- **The environment phase is closed** (agent-environment-r03 DONE, 2026-10-11, `79f3efd6`; main at `044000ed`).
  The Owner screens now work with its tools: the verify-fitway skill and CLI (a full-motion compare of the concept
  against itself is equal), the no-store preview, `pnpm codex:round`, and the weekly gardener, whose code-health
  reading found Daily's code inside the shared files (DECISIONS 44).
- **ui-forensics** (the user's machine-level skill) is 1.3.0; the 1.3.1 copy, which a held press needs, waits on the
  user's install (agent-environment-r03 resume point). Its 1.1.0 review: `D:/fitway-temp/ui-forensics-1.1.0/REPORT.md`. Its observation (on the phone the tuner's
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
  - the recipes lack observable state proofs for 22 features of Access, Activity and Reports, and Daily's
    `tuner-control-nowHot` proof never holds (F123-F125 in agent-environment's `findings.tsv`): every compare
    reports them as capture problems;
  - the concept's index check (its tools folder) runs only inside a worktree.
- Phone testing research (2026-10-10): `D:/fitway-temp/mobile-testing-research/ios/REPORT.md` and
  `D:/fitway-temp/mobile-testing-research/android/REPORT.md`. The user tries both phones themselves (no ADB, no cloud).
- Report-only, under load only: the dialogs', popover's and records card's parts split across threads under a planted
  stall; rounds item 11 to decide whether they are errors on a real machine.

## Next steps

Sessions (the user, 2026-10-11): the environment phase is closed. A plain «كمّل» starts step 1;
access-reason-cap-r01, typed «كمّل مهمة الـ240», may run beside it in its own worktree, and restarts before Settings
with its scope revisited first (the ledger).

1. **Start here: Daily gets its own files** (DECISIONS 44), the first concept round, before Settings. Daily's script
   and styles move out of the shared files into their own, as Reports, Access and Activity have; the page looks and
   behaves the same, and the verify-fitway compare of the build before and after is equal under both motions. The
   recipe gaps (F123-F125) are closed with it or just before it, so the compare covers those states too. The
   gardener's next reading shows whether the shared files' size and boundary counts fall. The concept CSS check and
   `check-press-layer` join the fast ladder only once the build is on the trunk.
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

The ui-forensics 1.3.1 install (agent-environment-r03 resume point); nothing in step 1 needs it.

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
  hard reload; the verify-fitway launch serves with no-store.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that adds this text (parent `79f3efd6`).
- Build: D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build, expected HEAD `d1a01f3c`.
- The environment phase: `docs/phase-records/handoffs/agent-environment/20261007-140000-agent-environment-r03-activation.md`.
- Motion: designer `D:/fitway-temp/owner-r04-motion/`, review `D:/fitway-temp/owner-r04-motion-review/`, research
  `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
