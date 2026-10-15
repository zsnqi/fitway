<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-15 22:20 +03:00 (vf-runner merged after two fix rounds; main to move once the merge's CI passes; nothing running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-71), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

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

Nothing.

## Next steps

1. **Move main** once CI passes on the merge `f6ef81cf` (run started 21:52; main at `a28574a7`): `pnpm
   main:advance f6ef81cf`; the records after it go with the next batch.
2. **Clean up the grading worktrees** of the vf-runner rounds (list below): unlink each `node_modules` junction first.
3. **The next launcher round:** F234 (`brief:check` checks named rows), F235 (a wrapped one-line reading), F236 (the
   keyword test of a one-line reading), F237 (the Git Bash tests inside Codex's sandbox), F242 (a report's SHA and
   ladder checked against the run's commands), F245 (each turn's times, exit, stop reason and HEAD in the run
   folder), and F246 if it fits (decision 70).
4. **The next verify-fitway round:** F241 (the `changesState` waiver; needs ended-rule declarations on the build
   branch) and F244 (a failed proof names its rule and capture).
5. **The shared lows (decision 47)** on the build branch, now that reports-css is in.
6. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
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
- **Temp worktrees with node_modules junctions** (unlink each junction with cmd's rmdir before `git worktree
  remove`; on 2026-10-15 a remove without it emptied this worktree's `node_modules`, restored by `pnpm install
  --frozen-lockfile --offline`): `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/wt`,
  `D:/fitway-temp/owner-r04-reports-css-grade/wt` (no junction), `D:/fitway-temp/owner-r04-vf-runner-grade-sol/wt`,
  `D:/fitway-temp/owner-r04-vf-runner-grade-ds/wt`, `D:/fitway-temp/owner-r04-vf-runner-opus-sol/wt`,
  `D:/fitway-temp/owner-r04-vf-runner-opus-ds/wt`, `D:/fitway-temp/owner-r04-vf-runner-replay-base/wt`,
  `D:/fitway-temp/owner-r04-vf-runner-fix-grade/wt` and `D:/fitway-temp/owner-r04-vf-runner-fix-opus/wt`
  (junctions), `D:/fitway-temp/owner-r04-vf-runner-fix-2-grade/wt` (its own install, no junction).
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
