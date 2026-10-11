<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `8aa6ed82`, 2026-10-12 01:00 +03:00 (step 1's repair round stopped for an
  account switch; the user went to sleep)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-47), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md`, and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, HEAD `7e28c713`), with their motion and CSS rounds done and
  Daily in its own files (DECISIONS 36-44). The user reviews on the eclipse-build preview (3174) and the LAN preview
  (3180).
- **Step 1, the mid-motion compare (F139), is in its repair round.** `compare --timeline` on `owner-r04-midmotion`
  (worktree D:/Projects/fitway-worktrees/owner-r04-midmotion; the ledger gave this milestone
  `.agents/skills/verify-fitway/**`). The first round, `e39225e6`, is graded in `codex-rounds.md` §"midmotion-compare":
  it caught the real defect and four planted ones, but marked a sample not held whenever a page callback ran, which
  hid Access's PIN change at `50097ff7` (F141), and its Daily drive fix did not reproduce and added a style to the page
  (F142). The repair, `briefs/codex-midmotion-compare-fix.md` (`07c5a87f`, xhigh, outcomes X1-X6), runs on Codex thread
  `01a12bb7-759a-7d01-8e65-bd122b22b76e`, run folder `D:/fitway-temp/codex-runs/owner-r04-midmotion-fix`; its six changed
  files are uncommitted in that worktree.
- **The repair's own progress when stopped** (its messages, not yet graded): not held now needs two unequal captures;
  the Daily style injection is gone; X3 self runs show 0 different on Reports, Activity (first run), Access (two runs)
  and Daily (first run; one `ERR_NO_BUFFER_SPACE` capture, F137); X4 matched the base CLI on Reports' 128 items and
  was running Access's base side; X5's new fixture fails on `e39225e6` and passes with the fix.
- **Briefs.** Before a Codex launch, Codex at max reviews the brief alone (B11, `REVIEW.md`, adopted from the blind
  trial in `codex-rounds.md` §"Evaluation: a blind review of the brief before launch"); each reading's disposition goes
  in the round's record; B12 holds the readings that keep coming back. An evidence script first proves itself on a
  self-compare and a planted defect (WORKING_AGREEMENTS "Rules and findings").
- **main** is at `be4f665e`; the coordinator line is pushed past it. The discussion page for the user (Arabic,
  private): https://claude.ai/artifact/88rd7XwoWHvnYhqbtxA1dm.
- access-reason-cap-r01 stays paused by the user (its own handoff says how to resume).

## Running now

Nothing. The coordinator stopped the repair round's process tree at 00:55 so the user could switch Codex accounts;
ports 3176-3177 are free and the worktree keeps the round's changes.

## Next steps

The user's instructions for the night (2026-10-12): continue without them. Codex usage limits never stop the work:
when a run exits on a limit, read the reset time from its output, wait for it in the background (Monitor with an
until-loop on the clock), then resume the run on its thread. Accounts are the user's; never switch them.

1. **Start here: resume the repair round on its thread:** `pnpm codex:round resume
   D:/fitway-temp/codex-runs/owner-r04-midmotion-fix --message-file <file>`, the message saying the account was switched
   and to continue where it stopped (Access's X4 base side, the Daily and components X3 runs and their rechecks, X6, the
   fast ladder, one commit).
2. **Grade it:** the held-out rows still open in `D:/fitway-grader/owner-r04/midmotion-compare-heldout.md` (H4, H6, H8,
   H9, H10, H11; planted copies in `D:/fitway-grader/owner-r04/midmotion-plants/`) and the coordinator's own re-run of
   X1, X2 (Access's `pinChange` among the six) and X6 (two batches of 11). On a pass: merge `owner-r04-midmotion` into
   this line, update F119, F122, F126, F130, F139, F141 and F142, push, and fast-forward main once CI passes.
3. **Then, in DECISIONS 47's order, before Settings:** the shared-files rounds (DECISIONS 45, each refactor compared
   along its moments with `--timeline`), the shared lows, the verify-fitway round (F131, F132, F136, F137, and the
   launch command running the B11 review), F140; every Codex brief through the B11 review first.
4. **Then Settings**, Operations and Monitoring (rounds items 6 and 8-11 in DECISIONS).
5. **Daily and Reports' last round:** Reports' «معدّل الموجودين» card (`#fig-avg`, DECISIONS 30), fix-3's findings
   (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`), the page-only lows (DECISIONS 47).
6. **Access's last round:** N1-N7 in Next steps 4 of the 2026-10-05 resume point.
7. **After each resume point,** fast-forward main once CI passes on it (DECISIONS 40) and update the discussion page.

## Waiting on the user

- **Checking only what a change affects** (the user's proposal, 2026-10-12). The coordinator agreed, with two
  conditions: the affected pages come from the files each page loads (a shared file means every page), never from which
  features seem related (daily-files broke other pages through shared scripts and classes set at runtime); and the full
  check still runs at the end of every round. It also proposed caching the base side's frames, which never change
  between reruns. Both would join the verify-fitway round before Settings; waiting for the user's yes.

## Known risks

- **Codex usage limits** stop runs often; each resumes on its thread (`pnpm codex:round resume <run folder>`).
- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` now measures it.
- main has no branch protection (a private repository on GitHub's free plan); nothing found deploys on a push to main.
  The main checkout D:/Projects/fitway keeps its local main at `bbb51709` and an uncommitted one-line AGENTS.md change
  from 2026-09-06; it was left untouched.
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The preview server (Python's http.server) sends no cache headers; after a build a stale script can throw until a
  hard reload; the verify-fitway launch serves with no-store.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers and the probe kit;
  3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that adds this text (parent `8aa6ed82`).
- Round worktree: D:/Projects/fitway-worktrees/owner-r04-midmotion, branch owner-r04-midmotion, HEAD `e39225e6` plus
  the repair's uncommitted changes.
- Grading evidence: `D:/fitway-temp/owner-r04-midmotion-grade/`; the evidence the repair brief names:
  `D:/fitway-temp/owner-r04-midmotion-evidence/`; the brief-review trial: `D:/fitway-temp/brief-review-trial/` and
  `D:/fitway-grader/owner-r04/brief-review-trial.md`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
