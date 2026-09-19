# Agent-context architecture migration r01 — M1 closure

- **Stage:** M1 — restore clean-checkout portability
- **Branch:** `codex/owner-distill-r01`
- **Candidate commit:** `27f137c606e11f47a0c89fc82a715158804f0041`
- **Frozen M0 base:** `19e28f4f0874d96569bc6944e38ad94b89924b60`
- **Clean validation worktree:** `C:/Users/Pc Force/.codex/worktrees/agent-context-m1-final/phase5-staff-integration`
- **Verdict:** PASS

## Integrated portability closure

M1 selectively integrated the predecessor-owned context, design-authority routing, state/history
schemas and checks, trusted Vitest runtime, repository fingerprinting, frontier validation, and
their required evidence. It did not integrate application/UI source, canonical screenshots,
Paper artifacts, visual baselines, or unrelated historical/user artifacts.

The clean-candidate frontier check is anchored to the literal M0 commit, requires M0 ancestry,
rejects dirty worktrees and repository-wide `assume-unchanged`/`skip-worktree` flags, and compares
every non-excluded protected path against M0. The historical baseline listing was recorded from a
Windows CRLF worktree although Git stores LF; clean mode accepts only that deterministic LF-to-CRLF
projection and explicitly does not claim checkout byte identity.

## Validation repair and preserved boundary

The first authoritative fast-ladder attempt exposed that six Owner class/spacing validator,
test, and data files were authored against the protected dirty Owner UI. Dirty UI validation
passed, while the clean candidate produced 35 new/one vanished spacing records and 24 class
contract mismatches. Regenerating the baseline or expanding the allowlist would have coupled M1
to unfinished Owner UI or masked real contract failures.

After a Luna/Max read-only architecture review, the coordinator therefore:

- left all six files byte-preserved and untracked in the dirty frontier;
- removed only their package/fast-ladder wiring from the clean candidate;
- retained the superseded `20260919-010000` policy pointer unchanged; and
- added `20260919-134000-agent-context-architecture-migration-r01-frontier-policy-correction.json`
  as the live successor, reducing newly excluded protected paths from nine to three.

No Owner UI, Product, Spec, security, privacy, data, accessibility, or visual-authority semantics
changed. The six validators remain owned by the future workstream that integrates their matching
Owner UI.

## Evidence

From a new clean worktree prepared with `pnpm install --frozen-lockfile`:

- direct runtime diagnostic: PASS, Vitest `4.1.10`, bounded-set SHA-256
  `fbcff86d2685e375d3f219bc93aceaaed75de9b518f8791ef881448783eb365c` after correction;
- `scripts/verify-repository.mjs`: PASS (`2` active, `100` archived milestones);
- `scripts/check-frontier-preservation.mjs`: PASS (`110` protected, `3` excluded);
- `scripts/check-design-context.mjs`: PASS with Impeccable `4.0.0` at root and `apps/web`;
- authoritative focused runner: PASS, `6` files / `385` tests;
- authoritative `scripts/verify.mjs fast`: PASS, `83` files / `1017` unit tests and
  `120` Python simulator tests, with type/build and mutation guards green; and
- `git status --short --untracked-files=all` remained empty after the passing fast ladder.

The independent Luna/Max frontier review first found the hidden-index and mode-dependent-test
defects, then approved their repair. A second Luna/Max architecture review approved the six-file
deferral as the narrowest clean-portability correction.

## Next stage

M2 may add the route registry, schemas, checker/show commands, templates, package wiring, and
focused tests in compatibility mode. Root routing, active-state v1, and the existing design packet
remain valid until their ordered migration stages.
