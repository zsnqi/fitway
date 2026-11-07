<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-11-07 (the demo's polish round; §"Running now")
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-112; 112 last), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B14 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds** run on DeepSeek V4.1 Flash at `max` through Open Design, or GPT-6.1 Sol where decision 64 says
  (`pnpm codex:round <brief> [level] [--model gpt-6.1-sol]`); the launcher reviews first and stops for dispositions.
- **The user's order of work (decision 52):** tool and testing fixes before the next pages; what nobody sees waits
  until after the demo; anything visible that would make the demo look bad is fixed before it.
- **Owner screens:** the six pages on `owner-followup-r04-build`, now at `695600d4` (2026-11-06, measured), worktree
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04`. Previews: eclipse-build (3174), LAN (3180).
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
- **Decision 67 in force:** pickups check this file's claims against their sources; claims say measured, inferred or guess.

## Running now

**The demo's polish round** (decisions 104, 105; its page `docs/phase-records/handoffs/owner-design-exploration/r04/demo-polish-target.md`).
All four items of that page are built on the build branch, pushed, CI green (measured): `a3e3b90a` one gym,
`18180f83` saved changes, `f835e520` words and dead ends, then Reports' average and comparison cards (decisions 106,
108) through two independent checks to `bac01253`. The user accepted that top row on its Arabic frames (decision 109;
evidence `D:/fitway-temp/owner-r04-avg-level/`). The six-page check (`D:/fitway-temp/owner-r04-polish-verify/`)
went to a fixer: `695600d4` on the build branch, pushed, CI green (measured). The user's quick look said
"ممتازة"; acceptance follows the first-time owner walkthrough (decision 110), whose report is
`D:/fitway-temp/owner-r04-walkthrough/REPORT.md` (2026-11-07, not yet checked against its frames): F1 the public page
is unreachable from the owner pages (would notice); F2 Today's and Reports' "last 7 days" disagree and F3 Activity's
settings row hides what changed (might notice); F4-F6 would not notice. F1-F3 are settled and built (decision 111): `17027639` on the build branch, pushed,
checked on its frames. The user accepted the six pages (decision 112). Next: merge the build branch, rerun the belonging check on
the merged head, then the demo's materials (decision 104's clip). Agent briefs live in
`docs/phase-records/handoffs/owner-design-exploration/r04/agent-briefs/`.

- **Eclipse's spec is split into parts** (`2aa2fc4d`, `ef9fa810`, 2026-10-29): edit a section in its part.
- **The belonging check is built** (DECISIONS 93, `codex-rounds.md` §"belonging-check", measured):
  `pnpm verify:owner belonging-check`, merged `dbf9b683`; today's concept passes all 13,028 frames. Sol and Terra were
  at capacity, so DeepSeek alone reviewed the brief and Opus the diff (the user, 2026-10-28: continue on DeepSeek).
- **Left from finding 5:** Reports' first paint now waits for Readex Pro (opacity, 1.5 s cap); Activity, Access and
  Settings keep the same font-swap pattern. Waits until after the demo (decision 52), then goes in the shared
  frame.

- **The builder eval, task 1** (DECISIONS 92 (3)): `D:/fitway-temp/owner-r04-tbl14-grade/EVAL.md` (Sonnet and Opus at
  `high`, byte-identical code from a reference implementation, 6/6 each; decision 85's Sonnet trial there too). The builder stays Opus; the next paired task
  has no reference code. Worktrees `owner-r04-tbl14-a`/`-b` stay (see Known risks before removing).
- **The reading review** (rtl-ltr-reviewer, Opus): `D:/fitway-temp/owner-r04-reading-review/` (report in the
  coordinator's transcript only; its frames and tools in that folder). Findings 1-5 kept by the user (DECISIONS 93's
  scope, narrowed); finding 6 and the row count under the name: built as DECISIONS 95, which supersedes 93's Arabic part.
- **Decision 103 is built** (`18411a15`; `D:/fitway-temp/owner-r04-busy-unlit/`) and accepted (2026-10-29). The
  build branch lacks `dbf9b683`: rerun the belonging check on the merged head. F304 and F305 open, after the demo.
- **The launch-film trial** (the user's, a cloud session): branch `ccr-026baa79-tycnnr`, its folder
  eclipse-launch-film under design-research (start at its RESUME.md). An experiment kept for its lessons, unmerged and no
  milestone; read it when the demo's materials start (decision 84).
- **Next: the tooling first** (decisions 96 (1), 101, 102): the retro's four rounds and the `compare` fix are merged;
  what is left is `docs/phase-records/handoffs/agent-tooling/agent-tooling-r01-resume.md` §"Next steps".
- **The public page:** its paper accepted and applied (decisions 98, 99; ADR-010); it runs as its own milestone,
  public-redesign-r01 (`docs/phase-records/handoffs/public-redesign/public-redesign-r01-resume.md`), its first round
  without a skeleton, after the retro's four fixes (decision 102). Friday's dash: A kept (DECISIONS 89).

## Next steps

1. **main** moves only by `pnpm main:advance` to a pushed coordinator commit whose CI passed (§"Running now").
2. **The pages** (decision 84): Settings, then the public crowd page, then the demo's polish and materials (private
   plan); Operations and Monitoring, sign-in and the front-desk screen after the gym owner accepts. **Settings** is built
   and verified (decision 81's round, verify-9 to verify-11: no High or Medium left,
   `D:/fitway-temp/owner-r04-verify-11/REPORT.md`), and accepted by the user at `fedbdb6d` (decision 97); left for after
   the demo: the dialogs' parts splitting under a planted stall and the key's glyph softening (F148, decision 69).
3. **F266 is fixed** (`873e03fc` on the build branch, pushed: Components places its tip with Reports' shared placement; 204
   cases measured, no overlap). **F285** (Components' heat grid at 390 is broken) waits: the user, 2026-10-18, the sheet is
   not in the demo; any designer brief whose page shows a heat or hour grid on the phone says the sheet's grid at 390 is
   known broken and follows Reports' one-day pattern; fixed only if a remaining page needs that grid at phone width.
4. **Grading briefs for focus work** state a control's tab order (the first Tab can leave the page), keep a pixel
   rule's allowances the round's brief gives, and list every outcome whose rings may differ (the five rows above).

## Waiting on the user

- Drive C: the user put the open items of D:/fitway-temp/drive-c-cleanup-20261016/REPORT.md off until later
  (2026-10-24; C 34.8 GB free, measured in `D:/fitway-temp/cc-temp-survey/REPORT.md`).
- fitway-temp: the user ran the prune (2026-10-24, `D:/fitway-temp/cleanup-20261024/`, 352.88 GB freed, 0 failures; D
  398 GB free, measured). The 17 grading worktrees there stay: the gardener's citation and merge rules
  refuse them, and agent-tooling DECISIONS item 15 carries the change.
- Optional: Windows Update's active hours (F159).

## Known risks

- **GPT-6.1 Sol accounts:** the user's rule (2026-10-15): stay on the current account until it reaches its limit,
  then switch; two accounts are saved, `smhsdxsz5h` (current, 2026-10-24) and `hhmam1435`; `ryshyjhad85` left the
  rotation at the user's word (2026-10-24; its file is in `D:/dev-cache/codex-removed-accounts`). `bash D:/fitway-temp/resume-auto.sh <run> <message> limit-first` switches saved accounts, but with
  `limit-first` it sends its own generic message (`D:/fitway-temp/resume-after-limit.md`), not the one passed.
- **DeepSeek reports can claim steps that never ran** (F242): check a round's commit and ladder against its events
  before grading, until the launcher does.
- **Grading briefs name the round's brief by its absolute coordinator path** (the copy at a result's HEAD can be
  older than the version launched; launcher-fixes-4's grader stopped on it).
- **`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` holds Codex briefs only:** two unit tests read
  every file there as one (CI red from `bb7444b6` to `949c2bbd`). Agent briefs go in the sibling folder agent-briefs.
- **Timed or load-sensitive work needs a quiet machine** (B13); P3 of `compare-parallel.test.mjs` failed
  once at about 92% CPU.
- **DeepSeek's catalog source** is pinned at `D:/fitway-private/codex/deepseek-catalog-source.json` (F172).
- **Temp worktrees with node_modules junctions:** unlink each junction with cmd's rmdir before `git worktree
  remove` (on 2026-10-15 a remove without it emptied this worktree's `node_modules`, restored by `pnpm install
  --frozen-lockfile --offline`). All twelve grading checkouts under `D:/fitway-temp/` were removed on 2026-10-15
  after unlinking (measured: `git worktree list` shows none there); their evidence folders stay.
  `D:/Projects/fitway-worktrees/owner-r04-tbl14-a` and `-b` (2026-10-27) got their `node_modules` from `pnpm install
  --frozen-lockfile --offline`, which on Windows links into the shared store: check for junctions inside them before any
  `git worktree remove`.
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
- Codex evaluations: `docs/phase-records/handoffs/agent-tooling/ROUNDS.md` (the index; the two `codex-rounds.md` are frozen).
