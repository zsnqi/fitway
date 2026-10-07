<!-- handoff-format: resume-point-v1 -->
# agent-environment-r03: resume point

- **As of:** `agent-environment-r03` at `10033949`, 2026-10-07 20:15 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-17,
  `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- The audit is saved: `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` (rounds R1-R5). R1-R3 are done and
  on main (CI on its own records, the record model, CI on the fast ladder, one home per rule); the machine cleanup is
  done (about 56 GB freed by the user's scripts). Their rounds are in
  `docs/phase-records/handoffs/agent-environment/codex-rounds.md`.
- R4, the verification path: Codex round 4 (`7c7a768`) delivered the verify-fitway skill at `.agents/skills/verify-fitway/`
  with a Claude pointer, its CLI (map, drift, launch with a no-store preview, doctor, drive, measure, cleanup), and a
  drift step in the ladder; G1-G4 now live in the skill. 6 of 8 brief rows and 17 of 20 held-out rows pass; a cold
  reader did two tasks with the CLI alone. Its corrections are round 6 (Next steps 1).
- R4, the Codex launch: rounds 5 and 5b (`a40ba39`) deliver `pnpm codex:round <brief> <level>` and
  `pnpm codex:round resume <run folder> --message "<text>"`, proved by a real launch and two real resumes; the
  agreements name it. CI failed on `a40ba39` (a test compared the runner's 8.3 short TEMP path as text); round 5c
  (`b80c3ad`), the first focused repair, compares paths as files.
- Evaluation B8 and B9 is recorded in codex-rounds.md: the Intent field is adopted in the Codex template; a Widest
  field was not shown to help, and B9 and B8 sharpen on classes seen twice.
- The concept defect round 4 found: on the phone, in English, the tuner's «الإضاءة» toggle sits outside the screen,
  so no tap reaches it (the r04 backlog's tuner item; the user's call).

## Running now

- Codex round 6 (the verification path's corrections, xhigh) in the r03 worktree, brief r03/briefs/round-6.md,
  thread `01a11777-f85f-7160-8ec9-4c76347ee877`, run folder D:/fitway-temp/r03-round6/.
- Codex round 7 (the gardener, xhigh) in its own worktree D:/Projects/fitway-worktrees/agent-environment-r03-gardener,
  branch agent-environment-r03-gardener (merged into agent-environment-r03 when it lands; paths disjoint from round 6),
  thread `01a1177a-d9ab-77d3-8898-694965893eb6`, run folder D:/fitway-temp/r03-round7/.
- If a run stops on a usage limit: tell the user, then `pnpm codex:round resume <run folder> --message "<text>"`.
## Next steps

1. Round 6, the verification path's corrections (draft ready): a pass only when the frame shows the asked state,
   switch dependencies and by-design absences, features derived from code with recipes kept beside the concept and
   new elements named by the drift check, any copy of the concept (a `git archive` baseline), a compare command, a
   foreign listener on any address, the doctor's fix commands, readable evidence and checkout-independent paths.
2. After round 6: merge main into owner-followup-r04-build, commit the build's recipe file there, and point the
   machine-local launch configuration (ports 3174 and 3180) at the no-store preview.
3. Remove the evaluation's test material: the four eval-b89 clones, the worktree eval-b89-base and the branch
   eval-b89-base (the decision is recorded: Intent adopted, Widest not shown).
4. R5, the gardener (DECISIONS item 16, brief drafted) and its first pass; its deletions of machine folders are
   scripts for the user to run (rmdir /s /q with the \\?\ prefix reaches a folder named "evidence.").
5. Follow-ups for a Codex round: name the field when `supersededBy` is misplaced; strip a standalone `--` in
   `scripts/run-vitest.mjs`; remove the routes' compatibility mode and the four unused task classes; separate the
   brief checker's rule ids from B1-B10 (audit A, C13); read the Impeccable path in `scripts/check-design-context.mjs`
   from the environment (audit A, A18); a check that open milestones' owned paths do not overlap (A7).
6. The closing review, then the milestone's closure.

## Waiting on the user

Nothing.

## Known risks

- When a Codex account reaches its limit, tell the user at once; after the switch, resume each stopped run with
  `pnpm codex:round resume <run folder> --message "<text>"`.
- Branch owner-followup-r04-build still carries the old lease check and fails CI on a push after 2026-10-10: merge
  main into it before its next push (Next steps 2).
- The eval clones and the worktree eval-b89-base hold only test material; remove them once the decision is recorded.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-environment-r03, branch agent-environment-r03; main and the coordinator
  line codex/owner-redesign-r04 follow it whenever its CI passes.
- Packet: `docs/phase-records/task-packets/agent-environment-r03.yaml`; briefs: `docs/phase-records/handoffs/agent-environment/r03/briefs/`.
- Round reports and grades: D:/fitway-temp/r03-round4/, r03-round5/, r03-round5b/ (REPORT.md each),
  D:/fitway-temp/r03-r4-grade/ (p1, a, b); the drafts of round 6 and the gardener's round:
  D:/fitway-temp/r03-drafts/.
