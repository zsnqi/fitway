<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `b4a9f095`, 2026-10-17 18:22 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-75), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds** run on DeepSeek V4.1 Flash at `max` through Open Design, or GPT-6.1 Sol where decision 64 says
  (`pnpm codex:round <brief> [level] [--model gpt-6.1-sol]`); the launcher reviews first and stops for dispositions.
- **The user's order of work (decision 52):** tool and testing fixes before the next pages; what nobody sees waits
  until after the demo; anything visible that would make the demo look bad is fixed before it.
- **Owner screens:** Daily, Reports, Activity log and Access on `owner-followup-r04-build`, now at `51d5a783`
  (2026-10-17, measured): the shared-lows series (one ring per control, a ring only when a key brought focus there,
  across pages too; graded, `codex-rounds.md` §"shared-lows-fix-2"), then the user's heat-cell selection (decision
  75: a flush inner edge for every input, the other cells dimmed, the keyboard ring outside the cell). Worktree
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

- **Nothing of this milestone runs** (measured 02:27; agent-tooling-r01's ratchet-fix runs, its resume point). The fix-2 grade reported at 00:51 (run
  D:/fitway-temp/codex-round-3e6c4f04-9467-4931-a8c2-46e6b433af71, report accepted): FAIL on G1, G2, G4, G5, G8, G9
  and G11. The coordinator's reading, with reproductions (`codex-rounds.md` §"shared-lows-fix-2"; scripts and logs in
  D:/fitway-temp/owner-r04-shared-lows-fix-2-grade/coordinator/): five rows from the grading brief's wording, the
  caret in forced colours (F264, a tool defect, agent-tooling-r01's), and a report resting on less than it claims
  (F265); the concept holds, and SL13 passes at phone size. Its grading checkout
  D:/fitway-temp/owner-r04-shared-lows-grade/wt (branch `grade-shared-lows-fix-2`, its own install) is no longer
  needed.
- Fix-2 carries the last input across pages as a `focus-input` URL parameter that `motion.js` writes on a link's
  click and removes on arrival (over http); no visitor data is stored.

## Next steps

1. **main is at `b4a9f095`** (agent-tooling-r01's CLI contract with this milestone's records, measured
   2026-10-17); later commits go to main with the next integration.
2. **The pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan). Decision 76 (the demo first):
   Settings starts now (the CLI contract is on main), with that milestone's report-fields round
   and the verification-map part of map upkeep (F252) beside it; what is visible and would make the demo look bad is
   fixed first, Arabic without compromise. Left for later, with their reasons: the dialogs' parts splitting under a
   planted stall (report-only, under load only) and the key's glyph softening (F148, decision 69).
3. **F266:** Components' heat tooltip covers the selected cell after a click (measured; Reports places its tip below
   the cell); it goes with the next concept round that touches Components.
4. **Grading briefs for focus work** state a control's tab order (the first Tab can leave the page), keep a pixel
   rule's allowances the round's brief gives, and list every outcome whose rings may differ (the five rows above).

## Waiting on the user

- Drive C: 15 items wait for the user's decision in D:/fitway-temp/drive-c-cleanup-20261016/REPORT.md (12.04 GB free
  after the safe cleanup, measured).
- Optional: Windows Update's active hours (F159).

## Known risks

- **GPT-6.1 Sol accounts:** the user's rule (2026-10-15): stay on the current account until it reaches its limit,
  then switch; `hhmam1435` is current since 00:14 on 2026-10-17 (`smhsdxsz5h` limited until 02:26). `bash D:/fitway-temp/resume-auto.sh <run> <message> limit-first` switches saved accounts, but with
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
