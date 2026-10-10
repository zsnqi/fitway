<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `93ed2403`, 2026-10-10 21:30 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-43), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 12-16, the environment phase), `docs/agent-context/WORKING_AGREEMENTS.md`

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

- **The CSS round** (the spec `css-round-spec.md` on the build branch, `ab504b28`; DECISIONS 41-42): the mechanical
  part was accepted at `691d62d5` (`codex-rounds.md`), and the press and the two lists finished at `b2b2f4c1`. The
  independent review (`verifier-css-round.md`, `767cd57c`; evidence and NOTES.md in
  `D:/fitway-temp/owner-r04-css-review/`) passed 15 of 19 checks. Its findings:
  - F1 medium: in forced colours, the figures region paints a ring after "Try again";
  - F2 medium, in the tool: the held press counts hover as a press (F115);
  - F3 low: the press is spread over selector lists;
  - F4 and F8 low, taste: the held chalk rim; two text sizes in Activity's tools;
  - F5 low: Activity's list rings on a mouse press;
  - F6: the tuner's textarea at 16 px. The coordinator keeps it: C5 covers every textarea on the pages, and it stops
    the iPhone's zoom;
  - F7 low: the dialog cap divides by a length;
  - F9 low: the long-name recipe's Arabic is question marks.
- **F4 and F8 are fixed** at `41821f38` by a fresh designer (`designer-css-review-taste.md`, evidence
  `D:/fitway-temp/owner-r04-css-taste/`). A held chalk key now shades from its top edge. Activity's open search takes
  its row's width. The coordinator looked at the keys and the tools frames.
- **Codex, high, done at `3b673daa`** (2026-10-10; graded so far in `codex-rounds.md`): `codex-css-review-fixes.md` (`c1cd84ab`), run folder
  `D:/fitway-temp/codex-runs/owner-r04-css-review-fixes`, held-out rows Y1-Y7 in
  `D:/fitway-grader/owner-r04/css-review-fixes-heldout.md`. It covers D1 (F1, every script-focused region), D2 (F5),
  D3 (F7), D4 (F9) and D5 (the README's held chalk paragraph). B6 is relaxed; each cause is graded separately.
- **Phone testing research** (the user asked for agents instead of their own finger for most checks, 2026-10-10):
  `D:/fitway-temp/mobile-testing-research/ios/REPORT.md` and `D:/fitway-temp/mobile-testing-research/android/REPORT.md`.
  The user chose to try both phones themselves instead (2026-10-10: no ADB, no cloud service).
  - Android: the user's own phone over USB with ADB is free and stays local; `adb shell input` gives real touch
    events, and screencap or screenrecord captures them. CDP-injected touch never shows `:active`.
  - The Android report reads in Chromium's source that a tap faster than about 100 ms may show no `:active` at all.
    That would break item 42's "even a very fast tap shows" on Android. The user's try settles it before F3's refactor.
  - iPhone: there is no free automated path from Windows. Real iPhones in the cloud start at about $39 a month (AWS
    Device Farm has a one-time trial) and need an account, a card and a tunnel.
- Report-only, under load only: the dialogs', popover's and records card's parts split across threads under a planted
  stall; rounds item 11 to decide whether they are errors on a real machine.

## Next steps

0. **The CSS round's close (start here).**
   1. Done: the Codex round is graded on Y2, Y5 and Y7; Y1, Y3, Y4 and Y6 join the post-F3 verifier pass. F3 waits for step 2.
   2. Done: the user tried both phones on the LAN preview (build `3b673daa`, 2026-10-10) and said everything works
      («كلشي تمام»), including a very fast tap on Android, so F3 needs no pointerdown class.
   3. F3 done at `eb18b17a` (graded in `codex-rounds.md`; P3 one invisible release frame accepted as an allowance).
      The verifier pass runs: `verifier-press-hook.md` (`e217534d`), evidence `D:/fitway-temp/owner-r04-press-review/`.
      Codex high, `codex-press-hook.md` (`348ca375`), run folder `D:/fitway-temp/codex-runs/owner-r04-press-hook`,
      held-out rows Z1-Z7 in `D:/fitway-grader/owner-r04/press-hook-heldout.md`. Then one short verifier pass at high,
      covering F3 and the css-review-fixes rows Y1, Y3, Y4 and Y6. The user found no problems on the phones and
      needs no second look (DECISIONS 43); report the close in a line. Later problems or improvements are welcome.
   5. F115 (the held press counts hover) goes to an agent-environment round. The concept CSS check joins the fast
      ladder only once the build is on the trunk.

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
- Build: D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build, expected HEAD `e217534d`.
- The environment phase: `docs/phase-records/handoffs/agent-environment/20261007-140000-agent-environment-r03-activation.md`.
- Motion: designer `D:/fitway-temp/owner-r04-motion/`, review `D:/fitway-temp/owner-r04-motion-review/`, research
  `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
