<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `fcc8365b`, 2026-10-16 22:25 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-74), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

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
- **Diagnosable logging (decision 70):** F242, F245 and F246 are fixed (launcher-fixes-5, brief-ladder); F247 is
  done; the server's error logs wait for production.
- **The tools moved (decision 73, F253):** agent-tooling-r01 owns the tool paths from 2026-10-16
  (`docs/phase-records/handoffs/agent-tooling/agent-tooling-r01-resume.md`); this milestone uses them and changes none.
  The same coordinator session runs both.
- **Both reviewers on every brief from 2026-10-16** (decision 66's rule met: 13 Sol readings closed that DeepSeek did
  not raise over nine briefs, measured; `codex-rounds.md` §"Evaluation: both reviewers, decision 66's rule applied").
- **Pickup check (decision 67, measured, 2026-10-16):** main at `3cde7a07` and nothing running both held; the
  reviewer tally here (three briefs) was stale.
- **Decision 67 in force:** pickups check the resume point's claims against their sources; every claim says measured,
  inferred or guess; Opus (`owner-direction-verifier`, high) grades chosen rounds beside Sol.

## Running now

- **shared-lows-fix-2** (`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-shared-lows-fix-2.md`,
  both reviews dispositioned), on `owner-r04-shared-lows` from `9619f3ce` (D:/Projects/fitway-worktrees/owner-r04-shared-lows),
  ports 3176-3177, run folder D:/fitway-temp/codex-round-036b9ba0-94ca-452f-9036-2b9c9aaa6768: P1 the brand rail item's
  second ring, P2 a ring after a mouse or touch arrival from another page, P3 every non-ring difference since
  `23314b3a` named or reverted, P4 the error ring's colour declared once. Held-out rows SL15-SL17 are in the grader's
  folder. Its launcher may auto-resume it after a "no report" turn; check its commit and checks against the events.
- How it got here: shared-lows-fix delivered `f87906ea` (Q1-Q4); the Sol diff review's two findings
  (D:/fitway-temp/code-review/shared-lows-2/) were applied at `9619f3ce` (Components compare 384 equal; its one
  difference and Access's eight are compare instability, F262); the Sol grade of `f87906ea`
  (D:/fitway-temp/codex-round-8395d9ec-800f-4f8f-af3b-10a45cfa7218, three Sol accounts) gave 8 PASS and 8 FAIL, of
  which G4, G6 and G7 are real (the coordinator looked at their frames) and G10-G14 were the grading brief's errors, the
  grader's own path slip, pre-existing wording findings or the specimen rings the review fixer removed.

## Next steps

1. **main is at `fcc8365b`** (2026-10-16): the agent-tooling wave and every r04 commit up to it; later commits go
   with the next batch.
2. **shared-lows-fix-2:** check its result against the events, push, run the Sol diff review (a fixer for blocking
   findings), then grade it with a fresh brief from `codex-shared-lows-grade.md` (G4, G6, G7 and G14 retargeted, P1-P4,
   SL15-SL17); the coordinator looks at the ring frames. Then merge `owner-r04-shared-lows` into
   `owner-followup-r04-build`. Left for later, with their reasons: the dialogs' parts splitting under a planted stall
   (report-only, under load only) and the key's glyph softening (F148, decision 69).
3. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan). Settings waits for
   agent-tooling-r01's ratchet and CLI contract (decision 73).

## Waiting on the user

- Drive C: 15 items wait for the user's decision in D:/fitway-temp/drive-c-cleanup-20261016/REPORT.md (12.04 GB free
  after the safe cleanup, measured).
- Optional: Windows Update's active hours (F159).

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
