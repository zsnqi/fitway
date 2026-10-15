<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-15 09:00 +03:00 (the encoding round of decision 62 merged as two rounds; main moved by `pnpm main:advance`; nothing running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-63), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

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

Nothing.

- **The encoding round is merged as two rounds** (decision 62; records in `codex-rounds.md` §"encoding-checks" and
  §"encoding-launcher", rows in `rounds.tsv`). encoding-checks `c93f423d` (merge `0906f2a2`): K1 from the packets,
  `pnpm main:advance`, the BOM and agent-table checks, B3 in `brief:check`, ID counts without a length warning, Biome
  on tracked files; held-out 7/8 (F180: the Scope rule for a Codex brief with neither Scope nor Report waits for
  fixtures in `codex-round.test.ts` and `path-tokens.test.ts`). encoding-launcher `d6e603fc` (merge `3554065b`):
  bare and prefaced readings, every brief's IDs, `--message` refused under Git Bash (`MSYSTEM`), `TEMP`/`TMP`
  guarded, 8x test timeouts; held-out 7/8 (F156's child-process route). Fixed: F129, F162, F169, F170, F173, F174,
  F177; new F178-F181. Grading kits: `D:/fitway-temp/owner-r04-encoding-{checks,launcher}-grade/` (each holds a
  detached worktree `wt` with a pnpm-installed `node_modules`; remove it with `git worktree remove` after unlinking
  any junction).
- **main moves only through `pnpm main:advance`** (AGENTS.md, WORKFLOW.md §"Integration", `9deee692`), and GitHub
  refuses a push to main without a passing `checks` run (decision 63; tested both ways).

## Next steps

1. CI on this resume point's commit, then `pnpm main:advance <commit>`.
2. **The remaining tool rounds before Settings** (decisions 47 and 52), each its own round, parallel where files are
   disjoint: F180 with the fixtures in `codex-round.test.ts` and `path-tokens.test.ts`; the `reports.css` split on the
   build branch with F160 (draft `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); a
   verify-fitway round for F168, F175 and F176; a diagnosis round for F148, F165 and F171 (causes unknown); the shared
   lows (decision 47); the `no-comments` report-only trial (decision 56). The Claude Code replay is deferred
   (DECISIONS 58); its worktree `D:/Projects/fitway-worktrees/owner-r04-cc-replay` can go once its `node_modules` is
   checked for a junction and unlinked.
3. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
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
