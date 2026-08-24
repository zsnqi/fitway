# Reference-gating repair 1 — activation invariant correction

- Repair run: `p11_ref_gate_b02`.
- Source-only candidate: `9b874e7`.
- Exact candidate parent: `b52ddb1`.
- Exact candidate paths: `apps/server/src/reference-gating.test.ts`, `scripts/verify.mjs`.
- Source behavior: focused 2/2 test run passed before commit.

The first registered `verify:phase` launch stopped at repository invariants before any type/unit/simulator step. The live ledger had assigned both the reference milestone and the still-active Access UI milestone to the coordinator branch/worktree. That contradicted the repository's unique active branch/worktree invariant.

The correction is ledger-only and does not change the source candidate: Access UI now points back to its preserved live candidate branch/worktree, `work/phase11-access-ui-b01` at `D:/Projects/fitway-worktrees/phase5-staff-integration`; reference-gating remains on the coordinator integration worktree. Those are the actual distinct candidate locations already present in `git worktree list`.

The registered phase ladder must be rerun from a clean tree after this coordinator record commits. The failed launch does not consume repair 2 because it made no candidate repair and exposed an activation-record inconsistency inside repair 1.
