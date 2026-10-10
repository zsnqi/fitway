<!-- handoff-format: resume-point-v1 -->
# agent-environment-r03: resume point

- **As of:** codex/owner-redesign-r04, 2026-10-10 08:50 +03:00 (rounds 16-19 merged, F100-F105 fixed; the user ran
  both cleanup scripts; TEMP is `D:\Temp`)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-25,
  `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- The audit is saved: `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` (rounds R1-R5). R1-R4 are done;
  the machine cleanup is done. Every round is in `docs/phase-records/handoffs/agent-environment/codex-rounds.md`,
  with its line in `rounds.tsv` and its side findings in `findings.tsv` beside it.
- R4 delivered the verify-fitway skill and CLI, the Codex launch command `pnpm codex:round`, the B8 and B9
  evaluation, and the gardener. Haiku 5.5 is the lookup agent (DECISIONS item 18). The environment page is published
  (Next steps 4).
- DECISIONS item 21: steps 1-4 are done (start-load baseline, tool lists, `rounds.tsv` and `findings.tsv`, the replay
  baseline). Step 5's first reading: the session that started from this file on 2026-10-09 at 23:20 carried 75K before
  its first read (2026-10-08 baseline 71K).
- 2026-10-10: round 17 (`b9fbc832`) fixed verify-fitway's misleading messages (F101 relaunch port, F102 foreign
  server); round 16 (`e0d00b5a`) and its two repairs 16b-16c (`eb5560d0`, `e0cd4c6e`) fixed the gardener's faults:
  a worktree holding an outward or dangling link is withheld and named, and the others are proposed with
  `remove-worktree.mjs` (F100); every tracked text file protects the temp folders it cites, also by a patterned path,
  while binaries, drive-root text and the temp root protect nothing (F104); the ladder parser names the step (F103).
  The repairs answered round 16's Y2 (nothing was proposable); the repair count for that failure is 2, now closed.
  A survey now takes about 250 s (101 s before). Round 18 (`70adc082`) made round 16's link test pass under CI's
  short temp path (`C:/Users/RUNNER~1`).
- 2026-10-10 morning, checked by the coordinator: the user ran the cleanup list (its 30 folders under
  `D:/fitway-temp` are gone) and `remove-copies.mjs --run` (all 27 worktrees and clones are gone, no dead
  registration is left; their commits are in the bundles named under Pointers). After the restart the user's TEMP and
  TMP are `D:\Temp` (item 24); the gardener, verify-fitway and `codex-round.mjs` still write under `D:/fitway-temp`
  by a fixed path, tests write under `D:\Temp`, and `pnpm verify:fast` passes there without mutation. Item 21 step 5,
  second reading: this session started from this file at 79K before its first read, 146K at its first edit.
- Round 19 (`01e704f4`, graded in `codex-rounds.md`) made verify-fitway's refusal name the foreign pid that shares a
  session's port (F105). F106-F107 and F109 go to the closing review rather than a round: the 2026-10-10 survey found
  no worktree with an outward link (0 of 31), the merged-clean count already includes protected worktrees, and
  F109's folder is cited by other records as well.
- DECISIONS item 25 (cache lifetime and session length, from the transcripts): only `owner-direction-verifier` keeps a
  one-hour prompt cache, from its next launch in a new session. The recommended restart from this file is at a
  natural break past about 300K, never drifting beyond 400K (the user's call).

## Running now

- The weekly gardener pass: the Windows task "FITWAY gardener weekly", Fridays 14:00 (next 2026-10-16),
  `scripts/agent-environment/gardener-weekly.ps1`, in the worktree D:/Projects/fitway-worktrees/gardener (each pass
  starts branch `gardener/<date>` from `origin/main`), ending with a Windows notification.

## Next steps

1. Open findings (`findings.tsv`): F106-F107 (link-withheld worktrees in the gardener's counts and prose) and F109
   (round 16c's test cites a real folder) are inputs to the closing review (Next steps 5). F108 (a pnpm setting
   blocked one survey inside Codex's sandbox) stays open until a sandbox survey hits it again. F110 (an edge Python
   test under a short local temp path) is outside this milestone; with TEMP on drive D, which makes no short names,
   the local ladder no longer meets it.
2. Step 2's real figure: `pnpm start-load -- --since 2026-10-09T19:15+03:00` after each Opus definition's first
   launch in a new session. After a few verifier runs, check item 25's predicted saving:
   `node D:/fitway-temp/cache-ttl-20261010/cache-usage.mjs --since 2026-10-11` (the verifier now writes one-hour
   caches) against `cache-usage.txt` beside it.
3. After each weekly pass (`docs/WORKFLOW.md` §"Active ledger and closed history", its last paragraph): review its
   `gardener/<date>` branch, merge what is accepted, write the ledger's `gardener` entry, rerun the report's final
   survey, and show the user the folder list before they run the new cleanup script. The main checkout keeps the
   user's uncommitted AGENTS.md edit of 2026-09-06.
4. The environment page, private: https://claude.ai/artifact/Kx1hDDw4Z67niKMmkgwRzY; republish to that URL from
   `D:/fitway-temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/06eea6dd-7c5b-44ad-b20d-f63072729f39/scratchpad/env-page/`
   (brief `docs/phase-records/handoffs/agent-environment/r03/briefs/env-page.md`, a standing brief the gardener lists
   as open).
5. Item 21's steps 6 and 7 run on the Owner screens' next briefs (step 6 on the CSS round, Owner resume point Next
   steps 6; step 7 on the Settings designer brief), so the Owner work restarts with them. Then the closing review (it
   moves the gardener's weight to code health, item 24) and the milestone's closure; the rest of the Owner screens
   follow.

## Waiting on the user

- Downloading `grill-with-docs` and `to-spec` (item 21, step 6) needs the user's yes at that point; the
  agreed Owner CSS round (Owner resume point, Next steps 6) waits for that step, whose trial writes its brief.

## Known risks

- When a Codex account reaches its limit, tell the user at once; after the switch, resume each stopped run.
- On this machine `git worktree remove` deletes through a junction (F100). Unlink junctions first; graders install
  their own dependencies; the gardener's `remove-worktree.mjs` refuses a worktree with an outward link.
- Claude Code's auto mode refuses to end Codex processes by hand ("interfere with workloads"), refused a ledger edit
  and writes in another milestone's worktree as "Modify Shared Resources" until the user said yes in chat
  (2026-10-08), and refused removing worktrees (2026-10-10); ask the user in plain words when it refuses again.
- Never run a generated cleanup script before the user reviews its list.
- A brief that changes what protects or proposes a folder needs an outcome that uncited folders stay proposable,
  measured on this machine's real temp root (round 16's Y2).
- access-reason-cap-r01 (paused) still names parts of the deleted check-frontier-preservation scripts; its scope is
  revisited when the user resumes it.

## Pointers

- Round results and the coordinator's own changes integrate on the coordinator line codex/owner-redesign-r04
  (worktree D:/Projects/fitway-worktrees/owner-design-exploration-r04), and main fast-forwards to it when CI passes;
  the branch agent-environment-r03 is behind main.
- Packet: `docs/phase-records/task-packets/agent-environment-r03.yaml`; briefs: `docs/phase-records/handoffs/agent-environment/r03/briefs/`.
- Grades: D:/fitway-temp/r03-r16-grade/, r03-r16bc-grade/, r03-r17-grade/ and r03-r19-grade/ (REPORT.md each; earlier
  rounds beside them), D:/fitway-grader/replay/; held-out rows in D:/fitway-grader/agent-environment/ and D:/fitway-grader/owner-r04/.
- The removed copies: their commits in `D:/fitway-grader/replay/<task>/result.bundle` and
  `D:/fitway-grader/preserved-clones/`, the grading worktrees' uncommitted report edits in
  `D:/fitway-temp/r03-cleanup-20261010/preserved/` (the only copy; this line keeps the gardener from proposing it).
- Round 19's worktree `D:/Projects/fitway-worktrees/agent-environment-r03-r19` (installed dependencies, no junction) is
  disposable once main holds `01e704f4`; its brief cites it, so the gardener will not propose it (a closing-review
  input: briefs keep every round's worktree protected).
