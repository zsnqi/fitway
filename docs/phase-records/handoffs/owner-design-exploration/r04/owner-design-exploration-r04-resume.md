<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` after `47d233b2`, 2026-10-13 22:45 +03:00 (launcher-fixes merged; shared-frame reported; vf-parallel and the Claude Code replay running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-53), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds now run on DeepSeek V4.1 Flash** through the user's Open Design subscription (WORKING_AGREEMENTS
  §"Delegation", 2026-10-13): the Codex CLI stays the harness; `pnpm codex:round <brief>` launches DeepSeek at `max`
  (`--model gpt-6.1-sol <level>` for GPT). The key is the user-level variable `OPENDESIGN_API_KEY` (never read or
  printed). Every DeepSeek call carries the route in `D:/fitway-temp/opendesign-smoke/route-args.txt`, a catalog the
  launcher builds per run from Codex's cached `gpt-5.5` entry, and hooks off (F151: the Impeccable hook's message
  makes Open Design refuse the request). The pre-launch review is DeepSeek at `max` reading the brief with the files
  its Read first and Decisions lines name (`codex-rounds.md` §"Evaluation: DeepSeek for the brief review").
  deepseek-route merged as `8dd8f8d8` (graded in `9da5739b`: brief 6/6, held-out 11/12; F150-F152).
- **Done earlier on 2026-10-13:** vf-speed merged `ebbfecd6`; vf-hold merged `f2c89624` (F143, F144 fixed; F148, F149
  found). Decision 50: Daily's light tuner goes, after shared-frame merges (it also ends F126). Decision 51: every
  page in the concept before any production move (Settings, Operations and Monitoring, the public crowd page, the
  front-desk screen, sign-in); the move's Product/Spec amendments and Readex Pro are accepted in principle. The
  demo's direction is private: `D:/fitway-private/demo-plan.md` (read it before any demo material).
- **The user's order of work (2026-10-13):** tool and testing fixes come before the next pages, since they make those
  pages faster and better; small design issues nobody sees wait until after the demo; anything visible that would
  make the demo look bad is fixed before it. Findings get two labels: who sees it (the owner on the page, our checks
  slowed, a check we cannot run yet, setup) and its effect on the demo (blocks it, lowers it, waits).
- **Owner screens:** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, clean at `4352181f`). Previews: eclipse-build (3174), LAN (3180).

- **Done this evening:** launcher-fixes merged as `47d233b2` (6/6, held-out 9/10; F150, F152, F153 fixed; F156 the test gap).
- **shared-frame** reported at 22:19: 237 of 237 jobs, every F3 difference inside F126 (69 samples) or F148 (21), one
  F126 item DIFFERENT after its rerun (Daily's tuner chip, `tuner-speed-reset`, English phone, 1 ms), no code change
  (result `4352181f`). DeepSeek cannot view images, so no frame was looked at by the model. Graded so far: SH5, SH10
  (folder only, its history file and evidence folder unchanged) and GH7 pass; SH4 partial (the four pages define the frame
  once; `components.js` keeps its own copy of three frame words from the base, outside the brief's cause). SH1-SH3 and
  SH6-SH9 need compares: run them after vf-parallel merges, on a pair it frees, with 4 workers; then the coordinator
  looks at the F126 item's captures, records the round, merges, pushes.
- **The environment block** in every brief template says a message without a tool call ends the run (`0361d77e`), a
  mitigation of F154, not a proven fix.

## Running now

DeepSeek ends a run early at times with a message and no tool call, under Codex and Claude Code alike (F154): when a
run's launcher exits, read its last message before treating it as a report, and resume it on its thread with a message
naming where it stopped (the `resume-turn-ended-*.md` and `message.md` files beside each run are the form).

- **vf-parallel** (DECISIONS 48; F147), on DeepSeek since 21:18 (its turn ended at 21:33, F154; resumed 21:34) in
  `D:/fitway-temp/codex-round-6cb545e8-2571-48fd-af5e-db0c44320e48`, worktree
  D:/Projects/fitway-worktrees/owner-r04-vf-parallel (code `0fbad66d`), brief
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel-continue.md`. It holds the ports
  since 22:22 (`D:/fitway-temp/owner-r04-ports/free-for-vf-parallel.txt`) and measures P1-P3 and L1; a full 1,224-item
  compare takes about 19 minutes on one worker. When it reports: grade VP1-VP11
  (`D:/fitway-grader/owner-r04/vf-parallel-heldout.md`) with the checks the review left open (time the 1-worker
  command with the CLI at `5493e888`, check each rerun's difference mask, watch the listening ports while compares
  overlap); merge; CI.
- **Claude Code on DeepSeek, replay of deepseek-route** (DECISIONS 53), run
  `D:/fitway-temp/cc-replay-deepseek-route-2` (`[1m]`, a 1M window like Codex's 900k; run `-1` used the default 200k and
  was stopped after reading only) from 21:28; its turn ended at 22:09 and 22:33 (F154), resumed as `-2-resume1` and
  `-2-resume2` on session `33b78d33-32c0-4382-9cee-06544d23d9ed`; worktree D:/Projects/fitway-worktrees/owner-r04-cc-replay
  from `4a151786`. Grade with DR1-DR12 (`D:/fitway-grader/owner-r04/deepseek-route-heldout.md`) and the plants in
  `D:/fitway-temp/owner-r04-deepseek-route-grade/`, against Codex's 6/6 and 11/12 (two runs, the second on the first
  run's edits; 45.3M input tokens), counting each resume as an intervention. Later Claude Code launch scripts also set
  `CLAUDE_CODE_MAX_OUTPUT_TOKENS=128000`: Claude Code sends `output_config.effort` and adaptive thinking with display
  omitted, and caps output at 32K for a model it does not know (request captured with a local echo server; three low
  and three max runs suggest the level reaches DeepSeek).

## Next steps

1. **Done:** the open findings carry the two labels (`seen_by`, `demo`; DECISIONS 52): none blocks the demo, all 27
   wait. The page lows outside the table, labelled the same way (all `owner` unless named; recorded at their rounds,
   N1 and N2 re-read in the build's code on 2026-10-13):
   - **lowers** (fix before the demo; they stay with each page's last round, DECISIONS 47): Reports' «معدّل الموجودين»
     card too empty (`#fig-avg`, DECISIONS 30); Access N1, the reset named «تعيين» on the row and «إعادة تعيين» in
     its result; N2, the done line's link opens «هذا السجل غير موجود في هذه العينة.»; N3, the records card sparse at
     1440.
   - **waits:** Access N4 (zero dot at 1x), N5 (721 English pairs wrap), N6 (lone last words), N7 (the code face
     loads on every visit); the Retry ring, OWN-C9's stale ring rule and the rail's ring on Access (keyboard only;
     already in the shared lows before Settings, DECISIONS 47); fix-3's observations 1, 2 and 4 (the components sheet
     only, `setup`).
2. **vf-parallel** (running, above): grade, merge, CI.
3. **shared-frame's compares** (SH1-SH3, SH6-SH9) on the merged CLI with 4 workers; the F126 item's captures; record;
   merge `4352181f` onto the build line's record; push.
4. **Remove the light tuner** (decision 50); then the **`reports.css` split** (draft
   `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); then the **tool fixes** F148, F140,
   F131, F132, F136, F149 and F156 (DECISIONS 47); F154's harness side (an automatic resume when a run ends without
   its report) is worth a launcher change if the environment line does not stop it.
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).
6. After each resume point, fast-forward main once CI passes on it (DECISIONS 40).

## Waiting on the user

Nothing.

## Known risks

- **DeepSeek runs:** start load about 87k tokens (every tool schema; GPT's was about 27k), mostly cached; trimming it
  with a per-run setting is the coordinator's call (WORKING_AGREEMENTS). Open Design credit is not a constraint
  (the user, 2026-10-13: run in parallel without weighing it, DECISIONS 53). Open Design names no host and no
  retention period. A thread whose history holds a hook message cannot resume.
- **F126** makes a full compare fail at random until the tuner goes; **F148** can leave a release sample NOT-HELD:
  rerun such an item once before reading it as a regression.
- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` measures it.
- **Temp junctions:** a grader that links old-CLI `node_modules` removes the link after.
- main has no branch protection; nothing deploys on a push to main. The main checkout D:/Projects/fitway keeps its local
  main at `bbb51709` and an uncommitted one-line AGENTS.md change from 2026-09-06; left untouched.
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9 (DECISIONS 33, 34).
- The preview server sends no cache headers; after a build, hard-reload. Ports: 3174 the user's preview; 3176-3177
  builders, verifiers and Codex; 3178-3179 reviewers and the probe kit; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text.
- DeepSeek: smoke runs `D:/fitway-temp/opendesign-smoke/`; the round's runs `D:/fitway-temp/codex-round-deepseek-route-1`
  and `-2` (`REPORT.md`); its grading `D:/fitway-temp/owner-r04-deepseek-route-grade/`; review trials
  `D:/fitway-temp/brief-review-trial/l5/` and `D:/fitway-temp/brief-review-trial/l7/`; held-out rows and scoring in `D:/fitway-grader/owner-r04/`.
- Earlier grading evidence: `D:/fitway-temp/owner-r04-vf-hold-grade/`, `D:/fitway-temp/owner-r04-vf-speed-grade/`.
- GPT fallback: `bash D:/fitway-temp/resume-auto.sh <run folder> <message file>` switches saved Codex accounts.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
