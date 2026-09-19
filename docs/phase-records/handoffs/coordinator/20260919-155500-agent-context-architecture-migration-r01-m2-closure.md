# Agent-context architecture migration r01 — M2 closure

## Status

- Stage: M2 route registry, schemas, checker, templates, and compatibility wiring.
- Verdict: `PASS`.
- Candidate commits: `8f4d80c` (routing layer), `bb9524f` (clean-checkout historical-pointer classification), and `b445a8e` (frontier acceptance timeout stabilization).
- Clean validation worktree: `C:/Users/Pc Force/.codex/worktrees/agent-context-m1-final/phase5-staff-integration` at `b445a8e8ba3a2ff582f360684b958437d79f58e2`.

## Integrated result

- Added the eight task classes, ordered required sources/selectors, conditional expansion rules, responsibility destinations, packet/evidence templates, and schemas under `docs/agent-context/**` and `docs/schemas/**`.
- Added `check:agent-context` and `context:show`; repository and authoritative fast verification now execute the context checker.
- Compatibility mode warns when an active packet is absent, while all currently evaluable path, case, tracking, selector, authority, handoff, containment, history-exception, and packet-state failures are blocking.
- Owner ADR-009 remains conditional: non-Owner visual-authority packets do not load it, while Owner packets must cite the exact `Decision` selector and cannot promote superseded composition.
- Fixed route canonicals cannot be substituted. Focused supplemental sources are allowed only through registered roles, and arbitrary historical expansion is rejected.
- Active handoffs, packet/receipt/config paths, frame hashes, and packet continuity are bounded to tracked repository files. `context:show` prints the packet's exact selectors without claiming that it loaded or interpreted them.
- Classified 20 immutable historical pointer exceptions. Eighteen point to protected untracked frontier files absent from a clean checkout; none were imported, rewritten, or given inferred replacements.

## Review and repair evidence

- Luna implementation worker completed the bounded M2 surface.
- Two independent Luna reviews rejected early candidates for authority substitution, unchecked handoffs, path-containment gaps, omitted packet selectors, Owner selector drift, nullable continuity, and arbitrary history expansion. Each finding was inspected and repaired before acceptance.
- Final Luna acceptance review returned `ACCEPT` with no M2 blocker.
- Clean-checkout replay exposed the protected-untracked historical targets. A bounded Luna repair added explicit sidecar classifications and tracked/untracked semantics; coordinator inspection confirmed all exact record/target pairs.
- First authoritative fast replay reached 1,048 passing tests and timed out only the existing real-repository frontier acceptance at 60 seconds. Its isolated authoritative run passed 30/30 in 55.96 seconds. The evidence-backed timeout was raised to 120 seconds; the next full fast replay passed.

## Validation

- Fresh frozen install: pass.
- Direct test-runtime diagnostic: pass.
- Authoritative focused context suite: 32/32 pass in the repaired source and clean worktrees.
- Strict `check-agent-context`: pass from the clean candidate with the 20 explicit historical warnings and the expected absent-packet compatibility warning.
- Repository invariants: pass; eight agent-context routes.
- Frontier preservation: pass; 110 protected paths preserved and three policy exclusions.
- Design-context bridge: pass; Impeccable 4.0.0 and both FITWAY routers resolved.
- Authoritative fast ladder: pass; 84 Vitest files / 1,049 tests, 120 Python simulator tests, repository/type/build/format gates, and mutation guard.
- Post-run clean-candidate `git status --short`: unchanged and empty.

## Preserved boundaries and next stage

- No application behavior, Product, Spec, database, DTO, security/privacy, visual authority, canonical frame, Paper artifact, or protected Owner/Staff frontier file was changed or promoted.
- Receipt-chain semantic verification beyond ordering/hash linkage is deliberately deferred to M4.
- M3 may now add optional state packet fields and run the approved read-only backend/API and Login UI pilots. The legacy startup route remains valid until M5.
