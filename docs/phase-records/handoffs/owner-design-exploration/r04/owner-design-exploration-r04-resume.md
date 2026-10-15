<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-16 00:05 +03:00 (three tool rounds running on DeepSeek; main at `e64006d0`)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-72), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds** run on DeepSeek V4.1 Flash at `max` through Open Design, or GPT-6.1 Sol where decision 64 says
  (`pnpm codex:round <brief> [level] [--model gpt-6.1-sol]`); the launcher reviews first and stops for dispositions.
- **The user's order of work (decision 52):** tool and testing fixes before the next pages; what nobody sees waits
  until after the demo; anything visible that would make the demo look bad is fixed before it.
- **Owner screens:** Daily, Reports, Activity log and Access on `owner-followup-r04-build`, now at `23314b3a`
  (reports-css merged: the shared styles in `shared.css`, F160's loading proofs; no pixel changed). Worktree
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04`. Previews: eclipse-build (3174), LAN (3180).
- **Wave 1 is done and recorded** in `codex-rounds.md` and `rounds.tsv`: no-comments (report-only; 50 `MUST KILL`
  findings F184-F233), diagnosis (report-only, 3/6; nothing reproduced under load it did not record), reports-css
  (merged into the build branch), the vf-runner trial (below).
- **launcher-fixes-4 is merged** into the coordinator line (`285eacb6`; F156 and F182 fixed; held-out 5/6, F235).
- **vf-runner is merged** into the coordinator line (`f6ef81cf`): the trial's DeepSeek arm `3ac1770a`, then
  vf-runner-fix (`1ff1f9cf`: 4/6 brief rows, three overclaims including a commit SHA that never existed, F242) and
  vf-runner-fix-2 (`a8791d1a`: 6/6, 9/9 held-out, no overclaim). F168, F175, F176, F183 and F238-F240 are fixed.
  The Sol arm's branch `owner-r04-vf-runner` stays unmerged. `772400e4` made the launcher tests create
  `D:/fitway-temp` themselves (F243: CI had it only from the old compare tests).
- **Diagnosable logging (decision 70):** F242 and F245 go to the next launcher round, F246 with it or the next
  encoding round; F247 is done (dated lines and visible account errors in `D:/fitway-temp/resume-auto.sh` and
  `resume-any.sh`, backups `.bak-20261015`); the server's error logs wait for production.
- **Decision 66's reviewer tally (measured):** three briefs reviewed by both models: launcher-fixes-4 (Sol 1 closed
  reading DeepSeek did not raise; DeepSeek 5), vf-runner-fix (Sol 2; DeepSeek 4), vf-runner-fix-2 (Sol 1; DeepSeek
  5): Sol averages 1.33 per brief; the rule needs at least four briefs. Grading briefs had the DeepSeek review only.
- **Pickup check (decision 67, measured):** the last resume point's "main at `699c111f`" did not hold; main was already at
  `a28574a7`, so its step 1 had been done.
- **Decision 67 in force:** pickups check the resume point's claims against their sources; every claim says measured,
  inferred or guess; Opus (`owner-direction-verifier`, high) grades chosen rounds beside Sol.

## Running now

Three DeepSeek rounds at `max`, launched 2026-10-16 about 00:00 from `a944207f` (worktrees at `5b81b3b7`), each
reviewed by DeepSeek and GPT-6.1 Sol first (dispositions in each `D:/fitway-temp/brief-review/codex-<name>-1[-sol]/`):

- **launcher-fixes-5** (F235, F236, F237, F242, F245): `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-5`,
  run `D:/fitway-temp/codex-round-cbeae1b0-f192-467a-8c3a-d410e7c09a34`.
- **brief-ladder** (F234, F246): `D:/Projects/fitway-worktrees/owner-r04-brief-ladder`,
  run `D:/fitway-temp/codex-round-0b658846-8e7e-41a8-a134-00cfd66c49f4`.
- **vf-proofs** (F241's mechanism, F244): `D:/Projects/fitway-worktrees/owner-r04-vf-proofs`,
  run `D:/fitway-temp/codex-round-2c7cab40-1cba-4527-b9ad-13e4eb9fe35b`.

Held-out rows: `D:/fitway-grader/owner-r04/{launcher-fixes-5,brief-ladder,vf-proofs}-heldout.md`. Each round is
graded (Sol, or DeepSeek with two rows reproduced, decision 72) before it merges.

## Next steps

1. **main is at `e64006d0`** (moved by `pnpm main:advance` after CI run 38795346728 passed in 1,305 s; the job's
   timeout is now 30 minutes, decision 71). The commits after it go with the next batch.
2. **Grade and merge the three running rounds** (Running now): vf-proofs (`bb313de0`) and brief-ladder (`abf26cdf`)
   are merged; launcher-fixes-5 failed its grade and launcher-fixes-5-fix is running. Then **a small round for F250**
   (stand-in steps reach the ladder only from its tests, never from a real run's environment; the user asked for it
   after launcher-fixes-5-fix, through a side session, 2026-10-16), then main moves once for the batch.
3. **The shared lows (decision 47)** on the build branch after vf-proofs merges, with the `ends` declarations for
   the build branch's `changesState` features that vf-proofs' report lists (F241's rest); F248 waits for the next
   verify-fitway round.
4. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).

## Waiting on the user

Nothing blocking. Optional: Windows Update's active hours (F159).

## Known risks

- **GPT-6.1 Sol accounts:** the user's rule (2026-10-15): stay on the current account until it reaches its limit,
  then switch; at 22:20 `ryshyjhad85` was current and had carried both gradings and both second reviews without a
  limit. `bash D:/fitway-temp/resume-auto.sh <run> <message> limit-first` switches saved accounts, but with
  `limit-first` it sends its own generic message (`D:/fitway-temp/resume-after-limit.md`), not the one passed.
- **DeepSeek reports can claim steps that never ran** (F242): check a round's commit and ladder against its events
  before grading, until the launcher does.
- **Grading briefs name the round's brief by its absolute coordinator path** (the copy at a result's HEAD can be
  older than the version launched; launcher-fixes-4's grader stopped on it).
- **Timed or load-sensitive work needs a quiet machine** (B13); P3 of `compare-parallel.test.mjs` failed
  once at about 92% CPU.
- **DeepSeek's catalog source** is pinned at `D:/fitway-private/codex/deepseek-catalog-source.json` (F172).
- **Temp worktrees with node_modules junctions:** unlink each junction with cmd's rmdir before `git worktree
  remove` (on 2026-10-15 a remove without it emptied this worktree's `node_modules`, restored by `pnpm install
  --frozen-lockfile --offline`). All twelve grading checkouts under `D:/fitway-temp/` were removed on 2026-10-15
  after unlinking (measured: `git worktree list` shows none there); their evidence folders stay.
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9 (DECISIONS 33, 34).
- Ports: 3174 the user's preview; 3176-3177, 3186-3187 and 3188-3189 the verification pairs; 3178-3179 reviewers and
  the probe kit; 3180 the LAN preview.
- The main checkout D:/Projects/fitway keeps its local main at `bbb51709` and an uncommitted one-line AGENTS.md change
  from 2026-09-06; left untouched.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text.
- Trial evidence: `D:/fitway-temp/owner-r04-encoding-coord/vf-runner-trial-replays.md`, the graders' folders under
  D:/fitway-temp/ (owner-r04-vf-runner-grade-sol, -grade-ds, -opus-sol, -opus-ds), and each arm's
  trial-metrics.md in its own temp folder.
- Held-out rows: `D:/fitway-grader/owner-r04/`.
- Logging review: `D:/fitway-temp/owner-r04-logging-review/REPORT.md`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
