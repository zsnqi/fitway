<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `090a272b`, 2026-10-08 18:25 +03:00
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

- The CSS round's mechanical part (Codex high, 2026-10-10): brief
  `codex-css-round.md` in the build branch's briefs folder (`cd2938ec`), run folder
  `D:/fitway-temp/codex-runs/owner-r04-css-round`, held-out rows X1-X10 in
  D:/fitway-grader/owner-r04/css-round-heldout.md, base focus sweep `D:/fitway-temp/owner-css-base-focus/`. B6
  is relaxed on purpose: the spec's five independent mechanical causes are graded separately in one pass. Next come
  agent-environment round 21 (a held press in the CLI) and the designer's pressed state, with the two 13.5 px lists.
  - **Accepted at `691d62d5`** (2026-10-10, graded in `codex-rounds.md`; repair 1 of 2 after X10's unconditional
    transparent outlines; pushed). The build's concept CSS check reports only two named allowances (programmatic
    focus targets, F113). Next: agent-environment round 21 (held press), then the designer's pressed state and the two
    lists, then the user's try on both phones (item 7) with the whole round.
- The pressed state and the two lists: the first designer built "the key seats" (`a4639c5e`, `dbdcea0a`;
  `D:/fitway-temp/owner-r04-pressed/NOTES.md`). The user answered its questions (DECISIONS 42). A fresh designer
  (`designer-pressed-state-2.md`, `3348f082`) finishes it, launched 2026-10-10:
  - the release fade;
  - a held segment that reads as chosen;
  - a held primary that reads as disabled;
  - one forced-colours rest frame that changed («EN» on the sheet);
  - the current tile's press.
  Output goes to `D:/fitway-temp/owner-r04-pressed-2/`. Then one independent review of the whole round, its fixes, and
  the user's try on both phones (3180).
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
   the rail's focus ring).
5. **After each resume point,** fast-forward main to this line once CI passes on it (DECISIONS 40), and update the
   discussion page.
6. **CSS findings from the good-css review** (2026-10-08, `docs/phase-records/handoffs/owner-design-exploration/r04/good-css-review.md`,
   counts re-checked by the coordinator): 5 of the concept's 77 `:hover` rules sit behind a hover media query, so hover
   sticks after a tap on the phone and tablet (gate with `(hover: hover)` only, not `pointer: fine`, because of the
   tablet band); 12 `outline: none` rules to check against a visible focus; no `forced-colors` support; no
   `viewport-fit=cover`, so the safe-area insets are inert. A Codex fix round on the build, proved with `pnpm check:concept-css -- <the build's eclipse folder>` (round 13 of
   the environment phase; 87 findings at `1d3539a3`). With it, DECISIONS 41
   (the user said yes, 2026-10-08): press feedback on every pressable control (its form drawn by a designer first)
   and field text of at least 16 px. The
   skill is not installed; it goes in slash-only, as a reference, at the production (apps/web) stage (the user,
   2026-10-08).
   **2026-10-10:** the round's spec is on the build branch at `ab504b28` (D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/css-round-spec.md). It
   came from the grilling and to-spec trial, agent-environment DECISIONS item 21 step 6. The user's answers:
   - they try the work on both an iPhone and an Android phone;
   - the designer is free on the pressed state within the stated limits;
   - forced colours at the minimum level;
   - no vibration;
   - a disabled control does not react to a press;
   - the four test seams.

   Order: a small environment round adds forced colours and a held press to the verify-fitway CLI. Then Codex does the
   mechanical part. Then the designer builds the pressed state.

## Waiting on the user

- The CSS round's spec (`ab504b28`): the briefs are written after the user's yes.

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
- Build: D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build, expected HEAD `ec314ce2`.
- The environment phase: `docs/phase-records/handoffs/agent-environment/20261007-140000-agent-environment-r03-activation.md`.
- Motion: designer `D:/fitway-temp/owner-r04-motion/`, review `D:/fitway-temp/owner-r04-motion-review/`, research
  `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
