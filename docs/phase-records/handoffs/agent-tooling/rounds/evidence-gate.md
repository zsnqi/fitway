# agent-tooling-r01: evidence-gate: `../briefs/codex-evidence-gate.md`, result `9a8a398b` on `tooling-evidence-gate` (from `b7487053`), DeepSeek V4.1 Flash, level `max`; fixer `ece1cbd2`; merged `b482e0b3`

- **Scope (agent-tooling DECISIONS item 23, findings 1 and 3):** a pre-commit job reads the lines a commit adds from
  the index and refuses a gone temp citation (G1) or one inside a folder made by hand from 2026-11-01 (G2), each
  message naming `pnpm run-folder:new` (G3); `pnpm brief:check` refuses a designer brief that asks for hand-built
  capture scripts or for frames without a `pnpm verify:owner` command (D1), and the hook applies it to new designer
  briefs and to the lines a commit adds to old ones (D2); a `RULE_ENFORCERS.md` row for the run-folder rule (R1).
- **Brief reviews** (`D:/fitway-temp/brief-review/codex-evidence-gate-1` and `-1-sol`): both found that a
  provenance record checked by shape alone can be copied or written by hand (closed: each record tied to its folder,
  its brief copy and a commit the repository holds), that a designer brief modified after its first commit escaped
  the hook (closed: added lines are judged), and that a brief can still be worded past a phrase list (closed in part:
  a registered command is required; deliberate evasion left to the reviews). DeepSeek also the record extensions the
  hook reads (left open: the same set `check:repository` reads) and placeholders in the fix (closed: the folder's name
  is filled in); Sol also the fix for an existing folder (closed: make a new run folder and move the evidence).
- **Run** (`D:/fitway-temp/codex-round-79f4e8d6-bdc7-418d-b00e-cd7e34523457`, start load 333,109): every row PASS but
  K1, whose `brief:check` on `codex-lease-ends.md` fails at the base too, since that worktree moved past the brief's
  named HEAD: a check the brief chose and could not pass (B7, brief-caused). T1: the job took 510 ms, median of three.
- **Diff review** (`D:/fitway-temp/code-review-evidence-gate-1/`): Sol `xhigh`, five blocking findings, all
  confirmed: `frames` and `sheet` added beside the registry in `designer-brief.mjs` (removed by the coordinator at
  integration, once public-frames registers them), options spread where one was needed, an injectable reader with no
  second implementation, a provenance fixture written twice, a test asserting the hook command's spelling.
- **The coordinator's grade on `9a8a398b`** (`GRADE.md` there): 150 tests pass; the real hook in the round's worktree
  refused a staged gone citation in 0.48 s and a new designer brief holding "Render with node scripts", and committed
  one naming `pnpm verify:owner frames`; `pnpm brief:check` fails the real sketch-25, polish-24, directions-1 and
  motion-17 briefs at their render lines. Eight planted defects: seven fail a test; the eighth (the `command` and
  `checkout` refusal removed) left every test green because the shape and brief tie already refuse an owner manifest,
  so the refusal was redundant (C2). Blocking C1: a gone citation of the run folder itself got no `run-folder:new`
  line. The post-cutoff path cannot be met on disk before 2026-11-01; the tests inject the creation time.
- **The fixer** (`owner-direction-fixer`, `D:/fitway-temp/tooling-evidence-gate-fix-1/BRIEF.md`): `ece1cbd2` fixed
  Sol's four and C1 and C2; 156 tests and `pnpm verify:fast` (1,009 s) passed. The coordinator replayed the real hook:
  `D:/fitway-temp/eg-grade-gone-2/` (gone: never made; the grade cites it to see the hook refuse it) now names `pnpm run-folder:new eg-grade-gone-2 --brief <file> --for <who>`.
- **Rows:** G1-G3, D1, D2, R1, K2 and T1 met at `ece1cbd2`; K1 brief-caused, the rest of it met (every touched suite,
  `check:repository`, the fast ladder). CI run 41238840993 passed on `9a81a355`, which carries the merge; main advanced
  to it.
