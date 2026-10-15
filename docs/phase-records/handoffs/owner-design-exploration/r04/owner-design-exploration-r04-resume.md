<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-15 17:55 +03:00 (wave 1 resumed, graded and recorded; launcher-fixes-4 and the vf-runner trial done; nothing running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-69), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

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
- **The vf-runner trial (decision 66) is decided:** both arms 4/7 held-out and one overclaim each; the DeepSeek arm
  (`3ac1770a`, branch `owner-r04-vf-runner-ds`) wins on interventions (the Sol arm's one was the user's wave stop);
  the user then moved rounds of this kind to DeepSeek for its speed (decision 69). Neither arm is merged: both narrowed the guide test's existing guard (F239), and neither
  tests the static post-capture proof (F238). The Sol arm's branch `owner-r04-vf-runner` is kept unmerged.
- **Decision 66's reviewer tally:** one brief so far (launcher-fixes-4): Sol raised one closed reading DeepSeek did
  not (F234), DeepSeek five Sol did not. Grading briefs had the DeepSeek review only.
- **Decision 67 in force:** pickups check the resume point's claims against their sources; every claim says measured,
  inferred or guess; Opus (`owner-direction-verifier`, high) grades chosen rounds beside Sol.

## Running now

Nothing.

## Next steps

1. **Move main** once CI passes on the coordinator head: `pnpm main:advance <sha>` (main at `699c111f`; the batch is
   launcher-fixes-4 and the records).
2. **A fix round on `owner-r04-vf-runner-ds`** (from `3ac1770a`): F238 (a test that notices the static post-capture
   proof disabled; and static rules keep their post-capture proof when an `afterActions` rule applies), F239 (the
   guide test exempts per command, never by line keywords, and catches every plant the base caught), F240 (test
   roots under the system temp folder, not a round's run folder), and F183 (verify-fitway tests take no fixed
   verification ports). DeepSeek `max` (decision 69), reviewed by both models
   (decision 66); held-out rows written before launch; Opus grades it (decision 67). Merge after.
3. **The next launcher round:** F234 (`brief:check` checks named rows), F235 (a wrapped one-line reading), F236 (the
   keyword test of a one-line reading), F237 (the Git Bash tests inside Codex's sandbox).
4. **The shared lows (decision 47)** on the build branch, now that reports-css is in.
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).

## Waiting on the user

Nothing blocking. Optional: Windows Update's active hours (F159).

## Known risks

- **GPT-6.1 Sol usage limits:** the default account hit its limit at about 15:50 (resets 19:17); `bash
  D:/fitway-temp/resume-auto.sh <run> <message> limit-first` switches saved accounts, but with `limit-first` it sends
  its own generic message (`D:/fitway-temp/resume-after-limit.md`), not the one passed.
- **Grading briefs name the round's brief by its absolute coordinator path** (the copy at a result's HEAD can be
  older than the version launched; launcher-fixes-4's grader stopped on it).
- **F183:** `cli.test.mjs` binds 3176-3177; any round or grading running it beside a compare on that pair fails three
  tests; rerun them by name once the pair is free.
- **Timed or load-sensitive work needs a quiet machine** (B13); P3 of `compare-parallel.test.mjs` failed
  once at about 92% CPU.
- **DeepSeek's catalog source** is pinned at `D:/fitway-private/codex/deepseek-catalog-source.json` (F172).
- **Temp worktrees with node_modules junctions** (unlink each junction with cmd's rmdir before `git worktree
  remove`): `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/wt`, `D:/fitway-temp/owner-r04-reports-css-grade/wt` (no
  junction), `D:/fitway-temp/owner-r04-vf-runner-grade-sol/wt`, `D:/fitway-temp/owner-r04-vf-runner-grade-ds/wt`,
  `D:/fitway-temp/owner-r04-vf-runner-opus-sol/wt`, `D:/fitway-temp/owner-r04-vf-runner-opus-ds/wt` and
  `D:/fitway-temp/owner-r04-vf-runner-replay-base/wt`.
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
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
