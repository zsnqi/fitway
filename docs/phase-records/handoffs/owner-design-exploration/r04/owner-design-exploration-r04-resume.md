<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-14 16:20 +03:00 (three DeepSeek rounds running: tuner-removal, launcher-fixes-3, vf-fixes; main at `862e45ba`)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-58), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds run on DeepSeek V4.1 Flash** through the user's Open Design subscription (WORKING_AGREEMENTS
  §"Delegation"): `pnpm codex:round <brief>` runs the pre-launch review, stops for dispositions, then launches
  DeepSeek at `max` with hooks off (F151). The key is the user-level `OPENDESIGN_API_KEY` (never read or printed).
- **The user's order of work (2026-10-13):** tool and testing fixes before the next pages; small design issues nobody
  sees wait until after the demo; anything visible that would make the demo look bad is fixed before it. Findings
  carry `seen_by` and `demo` labels (decision 52). The demo's direction is private: `D:/fitway-private/demo-plan.md`.
- **Owner screens:** Daily, Reports, Activity log and Access on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, clean at `4352181f`). Previews: eclipse-build (3174), LAN (3180).
- **vf-parallel is merged** (`4910963a`; record in `codex-rounds.md` §"vf-parallel", row in `rounds.tsv`): port pairs,
  up to 4 workers per compare and kept captures per item (F147 fixed); the full compare 3.0x faster with 4 workers
  (coordinator's timing alone, 1,136.6 s against 375.0 s, the same 1,224 verdicts). Brief 12/12, held-out 10/11:
  VP4 partial on F148 (NOT-HELD in 5 of 5 runs with 4 workers, 2 of 4 with 1). New: F160 (Reports' and Access's
  loading proofs capture inside the 300 ms skeleton window, a false DIFFERENT under load; one kept reserve frame
  holds the skeleton), F161 (the tests' leftover lease folders).
- **launcher-fixes-2 is merged** (`6d472338`): every real review answer read, and a run that ends without a report
  resumed on its own up to 10 times (`auto-resumes.log` in the run folder; F157 fixed, F154 resolved). Held-out 5/8:
  F156's silent read still untested, a numbered list inside a reading refuses the answer (F162), the resume message
  escapes quotes (F163).
- **shared-frame is graded** (record in `codex-rounds.md`): brief 6/6, held-out 8/10; every page unchanged outside the
  base's own instabilities (the Lights chip, F126; touch presses, F165). New: F164 (navigating features cannot be
  captured under touch or keyboard), F166 (the build branch's CI red since 2026-10-11 on a Node script Vitest collects).
- **access-reason-cap-r01 is DONE** (integrated `bfc23713`, closed `446bb9fa`): restarted by the coordinator, main
  merged in, the review's carry-over findings fixed after one added criterion (`b62594d3`); its resume file lists the
  follow-ups for the move to production (the password-reset form's pending Cancel among them).
- **The pstack reading (decision 56):** nothing installed; `correct`'s method adopted, `benchmark-checklist` folded
  into B13 (three runs, more only where they could change the decision), B6 loosened (small causes may share a round
  when each has its own outcome and check), one report-only `no-comments` trial on the tool code.
- **Windows Update restarted the machine at 06:36** during grading (F159; the user's setting, never an agent's).

## Running now

Three DeepSeek rounds, each launched by `pnpm codex:round` with its review dispositioned in
`D:/fitway-temp/brief-review/<brief>-<n>/dispositions.md` (held-out rows in `D:/fitway-grader/owner-r04/`):
- **tuner-removal** (`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-tuner-removal.md`; T1-T5 with F140 and F166), build worktree
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04` from `4352181f`, pair 3188-3189, run folder
  `D:/fitway-temp/codex-round-62a57dd6-5c06-45b8-9ded-996d11222dab`.
- **launcher-fixes-3** (`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-3.md`; F156, F162, F163), `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-2`
  from `a6ad0ae4`, run folder `D:/fitway-temp/codex-round-29b568cf-1e61-4a63-ab53-bec121e985f1`.
- **vf-fixes** (`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-fixes.md`; F131, F132, F136, F149, F158, F161, F164), `D:/Projects/fitway-worktrees/owner-r04-vf-fixes`
  from `088711e0`, pair 3186-3187, run folder `D:/fitway-temp/codex-round-af865e5d-1ef1-4efc-b1b3-f0a3b6975895`.

The launcher resumes a run that ends early by itself (up to 10 times); when it exits, read its last message and
`auto-resumes.log` before treating it as a report.

## Next steps

1. CI on this resume point's commit; fast-forward main to it only when that run's conclusion is success (F129).
2. **Grade each running round when it reports** against its held-out rows, record it (`codex-rounds.md`, `rounds.tsv`,
   findings), merge, CI, main. The tuner round adds `.impeccable/config.json` at the build branch's root to the owned
   paths (F140); its live moments stay reachable by a key under a URL switch (coordinator, reported to the user on
   2026-10-14).
3. **After the tuner merges:** F160 (Reports' and Access's loading proofs wait for `data-load="shown"`) goes with the
   `reports.css` split on the build branch; F148 and F165 need a diagnosis round of their own (cause unknown).
4. **The other tool rounds before Settings:** the `reports.css` split (draft
   `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); the encoding round of decision 56
   (F129 twice: K1 checks the frontier against the packets, and main moves only through a command that refuses a commit
   without a green CI run; BOM check, the launcher's `MSYS_NO_PATHCONV` and `TEMP` guards, a B3 check, `CLAUDE.md`'s agent table against the
   definitions; each check proven on its real past mistake; and decision 57's outcome-and-limit count in `brief:check`
   with its threshold from the past rounds, then B6, B8 and B13 unfolded); the shared lows (decision 47); the `no-comments`
   report-only trial. The Claude Code replay is deferred (DECISIONS 58); its worktree
   `D:/Projects/fitway-worktrees/owner-r04-cc-replay` (uncommitted launcher edits, not needed) can be removed once
   its `node_modules` is checked for a junction and unlinked first.
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).

## Waiting on the user

Nothing. Optional, the user's call: Windows Update's active hours or a pause on nights when rounds run (F159).

## Known risks

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
