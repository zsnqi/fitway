<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-15 13:40 +03:00 (the first parallel wave stopped by the user and saved for resuming; handover to a session the user starts)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-66), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds run on DeepSeek V4.1 Flash** through the user's Open Design subscription (WORKING_AGREEMENTS
  §"Delegation"): `pnpm codex:round <brief>` runs the pre-launch review, stops for dispositions, then launches
  DeepSeek at `max` with hooks off (F151). The key is the user-level `OPENDESIGN_API_KEY` (never read or printed).
- **The user's order of work (2026-10-13):** tool and testing fixes before the next pages; small design issues nobody
  sees wait until after the demo; anything visible that would make the demo look bad is fixed before it. Findings
  carry `seen_by` and `demo` labels (decision 52). The demo's direction is private: `D:/fitway-private/demo-plan.md`.
- **Owner screens:** Daily, Reports, Activity log and Access on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04 at `c2fe4661`, the tuner removed). Previews: eclipse-build
  (3174), LAN (3180).
- **vf-parallel is merged** (`4910963a`; record in `codex-rounds.md` §"vf-parallel", row in `rounds.tsv`): port pairs,
  up to 4 workers per compare and kept captures per item (F147 fixed); the full compare 3.0x faster with 4 workers
  (coordinator's timing alone, 1,136.6 s against 375.0 s, the same 1,224 verdicts). Brief 12/12, held-out 10/11:
  VP4 partial on F148 (NOT-HELD in 5 of 5 runs with 4 workers, 2 of 4 with 1). New: F160 (Reports' and Access's
  loading proofs capture inside the 300 ms skeleton window, a false DIFFERENT under load; one kept reserve frame
  holds the skeleton), F161 (the tests' leftover lease folders).
- **launcher-fixes-2 and -3 are merged** (`6d472338`, `3a959ac2`; records in `codex-rounds.md`): every real review
  answer read, automatic resume up to 10 times (F154, F157), the resume quote exact (F163); their open F156, F162 and
  F169 are in encoding-launcher.
- **shared-frame is graded** (record in `codex-rounds.md`): brief 6/6, held-out 8/10; every page unchanged outside the
  base's own instabilities (the Lights chip, F126; touch presses, F165). New: F164 (navigating features cannot be
  captured under touch or keyboard), F166 (the build branch's CI red since 2026-10-11 on a Node script Vitest collects).
- **access-reason-cap-r01 is DONE** (integrated `bfc23713`, closed `446bb9fa`): restarted by the coordinator, main
  merged in, the review's carry-over findings fixed after one added criterion (`b62594d3`); its resume file lists the
  follow-ups for the move to production (the password-reset form's pending Cancel among them).
- **The pstack reading (decision 56):** nothing installed; `correct`'s method adopted, B13 and B6 changed, one
  report-only `no-comments` trial on the tool code.
- **main is protected on GitHub** (decision 63): a push to main needs the `checks` job passed on that exact commit,
  administrators included; no force push or deletion.
- **Windows Update restarted the machine at 06:36** during grading (F159; the user's setting, never an agent's).

## Running now

Nothing. **The first parallel wave (decision 64) was stopped by the user on 2026-10-15 at about 13:30 +03:00**, to
move coordination to a new session, not as a judgement of the rounds. Each worktree and temp folder is left as it
stood; each round's progress is in `D:/fitway-temp/owner-r04-<name>/STOPPED-2026-10-15.md`, and a ready resume message
in `D:/fitway-temp/owner-r04-encoding-coord/resume-wave1-<name>.md`. Briefs in
`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-<name>.md`.

| Round | Model | Worktree (branch of the same name) | Run folder | Reached |
| --- | --- | --- | --- | --- |
| reports-css + F160 | DeepSeek `max` | `owner-r04-reports-css` from `c2fe4661` | `codex-round-6f244aad-...` | split written (uncommitted, saved as `wip/reports-css-stopped-20261015` `10a93960`); C2 matrix begun |
| vf-runner F168, F175, F176 | Sol `xhigh` | `owner-r04-vf-runner` from `c699d3fb` | `codex-round-6570b67a-...` | sources read; nothing changed |
| diagnosis F148, F165, F171 | Sol `xhigh` | `owner-r04-diagnosis` | `codex-round-f84ff767-...` | concept extracted; no run yet |
| no-comments trial | DeepSeek `max` | `owner-r04-no-comments` | `codex-round-5175a893-...` | 167 comments found by two agreeing passes; judging begun |

- **To resume a round on its own thread:** `pnpm codex:round resume D:/fitway-temp/<run folder> --message-file
  D:/fitway-temp/owner-r04-encoding-coord/resume-wave1-<name>.md`, one launcher per round, each started as its own
  background command; its log line `exit=` marks the end. Ports: reports-css 3176-3177, vf-runner 3186-3187, diagnosis
  3188-3189; the killed compare left a dead claim (pid 33472) in `D:/fitway-verify-captures/.port-3176-lease` and
  `.port-3177-lease`, which the CLI's next run removes. If a thread cannot resume, a fresh session gets a short
  continue brief naming its STOPPED note (decisions 54 and 59), from the saved state.
- **Grading by Sol** (decision 64): the launcher takes only `role: codex` briefs and `brief:check` refuses the words
  for held-out checks, so a grading round is a Codex brief written after the round delivers, outcomes being the
  checks themselves (no such words), run with `--model gpt-6.1-sol` at `xhigh` against a detached worktree of the
  result (`git worktree add --detach`), changing nothing tracked. Reproduce at least one row before using its verdict.
- **Merging:** wait for the branch CI with the full SHA (`gh api repos/zsnqi/fitway/commits/<sha>/check-runs`; `gh run
  list --commit` with a short SHA returns nothing), merge only on `success`, and move main once per batch with
  `pnpm main:advance`. A push to the coordinator branch cancels its running CI (`cancel-in-progress`).
- **The encoding round and scope-rule are merged** (records in `codex-rounds.md`; scope-rule `89a3bc95`, merge
  `c699d3fb`, F180 fixed); main at `699c111f`; the coordinator line ahead of it only by records and briefs.

## Next steps

1. Resume the four wave-1 rounds (above), then grade each as it ends (reports-css and vf-runner by a Sol grading round
   plus a reproduced row; the two report-only rounds by reading their tables and sampling rows), record each in
   `codex-rounds.md` and `rounds.tsv`, merge on green CI (reports-css into `owner-followup-r04-build`), then
   `pnpm main:advance` once.
2. **Two trials, rules fixed in decision 66:** vf-runner runs on both models (the stopped Sol run resumed as one arm,
   a DeepSeek arm in a new worktree `owner-r04-vf-runner-ds` once a port pair is free), graded on the same rows with
   every claimed PASS replayed; and each brief of the next wave reviewed by DeepSeek and by Sol `xhigh` side by side.
3. **Then:** the shared lows (decision 47) after reports-css merges; fixes for what diagnosis proves; F182 and F156's
   child-process route with the next launcher round; the Claude Code replay stays deferred (DECISIONS 58).
4. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).

## Waiting on the user

Nothing blocking. Optional, the user's call: Windows Update's active hours or a pause on nights when rounds run
(F159).

## Known risks

- **Briefs written before decision 60** carry the old environment block, so `brief:check` now flags them; only a
  brief launched again needs its block refilled.
- **DeepSeek's catalog source** is pinned at `D:/fitway-private/codex/deepseek-catalog-source.json` (F172, the user's
  choice on 2026-10-14): a DeepSeek review or launch stops if it is missing; copy it from any run folder's
  `model-catalog.json` taken before 2026-10-14 21:00 (SHA-256 `2b39f705...`).
- **DeepSeek runs:** start load about 89k tokens, mostly cached; Open Design credit is not a constraint (DECISIONS 53).
  A thread whose history holds a hook message cannot resume.
- **F126** makes a full compare fail at random until the tuner goes; **F148** can leave a release sample NOT-HELD:
  rerun such an item once before reading it as a regression.
- **Timed outcomes need a quiet machine** (B13): no other round, ladder or replay beside them.
- **Temp junctions:** the vf-parallel grader's link `D:/fitway-temp/owner-r04-vf-parallel-grade/cli-5493e888/node_modules` was removed; relink it to time the old
  CLI again, then remove it (never with a recursive delete).
- **Test leftovers (F161):** every verify-fitway suite run leaves empty `.port-<port>-lease` folders in
  `D:/fitway-verify-captures` (713 so far); harmless to verdicts, and its fix clears them.
- main has no branch protection; nothing deploys on a push to main. The main checkout D:/Projects/fitway keeps its local
  main at `bbb51709` and an uncommitted one-line AGENTS.md change from 2026-09-06; left untouched.
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9 (DECISIONS 33, 34).
- Ports: 3174 the user's preview; 3176-3177, 3186-3187 and 3188-3189 the verification pairs (the CLI refuses others
  and a busy pair); 3178-3179 reviewers and the probe kit; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text.
- pstack reading (decision 56): GitHub cursor/plugins at `ce649c03` and michael-denyer/pstack-claude at `94f5ce95`;
  the coordinator's copies of the skills it read are in the session scratchpad only, so read them again upstream.
- Grading evidence: `D:/fitway-temp/owner-r04-vf-parallel-grade/`, earlier `D:/fitway-temp/owner-r04-vf-hold-grade/`
  and `D:/fitway-temp/owner-r04-vf-speed-grade/` (the `7e28c713` and `4352181f` extracts).
- GPT fallback: `bash D:/fitway-temp/resume-auto.sh <run folder> <message file>` switches saved Codex accounts.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
