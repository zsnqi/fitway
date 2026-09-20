# Agent-context architecture migration r01 — M5 closure

- Prepared: 2026-09-20 17:25 +03:00.
- Stage: M5 — switch startup routing to active packet discovery.
- Scope: repository context/routing infrastructure only; no Product, Spec, application, UI,
  visual-authority, screenshot, Paper, dependency, lockfile, or database change.

## Active routing cutover

- `docs/agent-context/ROUTES.yaml` now records `mode: active`, and the route schema accepts exactly
  `compatibility` or `active`.
- `check-agent-context` fails in active mode when an open milestone has no validated packet.
  `compatibility` remains only as the documented one-release fallback; it still fails every
  evaluable path, case, tracking, schema, selector, scope, pointer, and lifecycle violation.
- `context:show` fails closed in active mode when packet metadata is absent, partial, or the packet
  is missing/stale, and rejects an unknown routing mode. The legacy permissive output survives only
  under `compatibility`, where it is explicitly labeled as not claimed packet context.
- `docs/WORKFLOW.md` Clean-session startup is now: root policy -> active state -> `context:show`
  packet continuity -> required sources -> conditional expansion. History is excluded from startup,
  and the coordinator-authorized compatibility fallback is recorded as a bounded exception.
- `AGENTS.md` points startup at that bounded route. The full root-policy rewrite and the
  sentence-level responsibility migration remain M6.
- Registered the migration verification profile `agent-context-architecture-migration` in
  `scripts/verify.mjs` (fast ladder; no phase-specific browser or integration files).
- Packet validation before `READY` is enforced by the active-packet lifecycle rules: a missing,
  partial, stale, or untracked packet is blocking, and only a `READY` packet may back a milestone
  that is not `PLANNED`.

## Verification

- Authoritative focused runner: `scripts/check-agent-context.test.ts`,
  `scripts/show-agent-context.test.ts`, `scripts/verify-repository.schema.test.ts`,
  `scripts/project-state-history-transition.test.ts`, and `scripts/project-state-history-v2.test.ts`
  — PASS, 5 files / 99 tests.
- `scripts/check-agent-context.mjs` — PASS: 8 task classes, `startup routing mode: active`, only
  admitted historical-pointer warnings.
- `scripts/verify-repository.mjs` — PASS: 1 active, 103 archived, valid receipt chain and union.
- `scripts/check-frontier-preservation.mjs` — PASS: 110 non-excluded protected entries verified,
  3 excluded, additions unconstrained.
- Biome — PASS for every changed code, test, and schema file; no fixes left applied.
- Clean detached worktree at behavioral candidate
  `fe3a0f035c2bd9495e6d1a5962063e6c54bc0792`: frozen install, direct runtime diagnostic, and
  authoritative `scripts/verify.mjs fast` — PASS, 86 files / 1092 unit tests and 120 Python
  simulator tests, with repository/context/type/build steps and the mutation guard green;
  `git status --short` was empty after the run.
- This report-only closure commit changes only this record, the packet continuity pointer and hash,
  and the coordinator state handoff pointer and packet hash.

## Preserved boundaries and next stage

- No Product, Spec, application, UI, visual-authority, canonical, Paper, dependency, or database
  bytes changed. All existing history records remain byte-identical.
- The compatibility fallback is documented for one release, is not the default, and cannot be used
  to skip a required packet on the active route.
- M6 may now shorten `AGENTS.md`, move the full handoff contract onto the evidence template, and
  build the sentence-level responsibility migration map.

## Final-commit gates

- Clean detached worktree at the closure commit
  `1e05fbf641a6a3a56674bfbcaf40a7a5e5ec2a33`: `scripts/check-agent-context.mjs` PASS (8 task
  classes, `startup routing mode: active`, admitted historical-pointer warnings only);
  `scripts/verify-repository.mjs` PASS (1 active, 103 archived milestones); clean-candidate
  `scripts/check-frontier-preservation.mjs` PASS (110 non-excluded protected paths not integrated
  relative to the frozen M0 base; 3 policy exclusions).
- Authoritative focused runner at the same commit: 5 files / 99 tests PASS.
- `git status --short` remained empty after every final-commit gate.
- The behavioral candidate `fe3a0f035c2bd9495e6d1a5962063e6c54bc0792` differs from the closure
  commit only by this report-only record, the packet continuity pointer/hash, and the coordinator
  state handoff pointer/packet hash.
