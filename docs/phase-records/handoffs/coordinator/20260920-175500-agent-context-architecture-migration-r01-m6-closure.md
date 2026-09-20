# Agent-context architecture migration r01 — M6 closure

- Prepared: 2026-09-20 17:55 +03:00.
- Stage: M6 — shorten root `AGENTS.md` and move detailed contracts to their canonical destinations.
- Scope: repository process/routing documents and focused checker tests only; no Product, Spec,
  application, UI, visual-authority, screenshot, Paper, dependency, lockfile, or database change.

## Root-policy and contract migration

- Root `AGENTS.md` shrank from 8,926 bytes (commit `8515e84`, raw blob, SHA-256
  `5b24b0fbbdd2fe302280cb29b89c307377e76e8ac7df64f72865a07c68f63f0d`) to 7,614 bytes (SHA-256
  `970f7c03697ba7f6a3f4b99c913ed070ce97d381c08e38cd54eb15e7b5404dc8`). Locked safety decisions,
  working agreements, the source-of-truth order, coordinator ownership, the two-repair rule, and
  the verification boundary summary are retained. The unconditional router table is replaced by a
  six-step startup route that reads active state, loads the assigned packet, resolves required
  sources, expands conditionals only on their trigger, excludes history from startup, and names
  missing/stale/conflicting routes as stop conditions.
- `docs/agent-context/AGENTS_RESPONSIBILITY_MAP.md` maps every old `AGENTS.md` responsibility and
  every old Workflow handoff field to a destination that exists. An independent fresh reviewer
  returned `PASS` with no lost responsibility; its findings were fixed: the old-policy byte
  measurement, the Product/Spec verifier duty (now named in Workflow "Independent verification"),
  PHASES.md routing, approval-manifest and conflict-map coverage, and the Vitest bounded-coverage
  non-claim prose.
- The inline handoff field list was removed from Workflow; `docs/WORKFLOW.md` now points to
  `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md` for the field contract and keeps the
  non-secret rule.
- `PHASES.md` moved from an unconditional startup read to a routed read: `resume-integration` now
  carries a conditional `PHASES.md` (heading `Dependency DAG`) that expands only when a milestone's
  durable dependency or acceptance scope is unresolved. `PHASES.md` itself is unchanged.
- `check-agent-context` now warns conservatively at 24,000 bytes and still fails only above the
  documented 120,000-byte cap or on a routing invariant. The warning is covered by a focused test.

## Verification

- Authoritative focused runner: `scripts/check-agent-context.test.ts` and
  `scripts/show-agent-context.test.ts` — PASS, 2 files / 59 tests.
- `scripts/check-agent-context.mjs` — PASS: 8 task classes, `startup routing mode: active`.
- `scripts/verify-repository.mjs` — PASS: 1 active, 103 archived milestones, valid union.
- Biome — PASS for every changed code/doc file; no fixes outstanding.
- Clean detached worktree at behavioral candidate
  `1b376783381e4e2a777871c485d06af80436db2e`: authoritative `scripts/verify.mjs fast` — PASS,
  86 files / 1093 unit tests and 120 Python simulator tests, with repository/context/type/build
  steps and the mutation guard green.
- This report-only closure commit changes only this record, the packet continuity pointer and hash,
  and the coordinator state handoff pointer and packet hash.

## Preserved boundaries and next stage

- No Product, Spec, application, UI, visual-authority, canonical, Paper, dependency, or database
  bytes changed. Existing history records remain byte-identical.
- `docs/design/VISUAL_AUTHORITY_STATUS.md`, `docs/design/PAPER_GUIDE_CONFLICT_MAP.md`, and
  `PHASES.md` were not rewritten; only their unconditional startup read was removed.
- M7 may now decide the compact visual-index question, strengthen UI packet/design-context
  validation, retire the old active-design-packet template to a compatibility pointer, and mark
  legacy whole-history transition tooling deprecated while retaining its evidence.

## Final-commit gates

- Clean detached worktree at the closure commit
  `48905edb8f1107a43801b7c6f28b03ed1353b48c`: `scripts/check-agent-context.mjs` PASS (8 task
  classes, active mode); `scripts/verify-repository.mjs` PASS (1 active, 103 archived);
  clean-candidate `scripts/check-frontier-preservation.mjs` PASS (110 non-excluded protected paths
  not integrated relative to the frozen M0 base; 3 policy exclusions).
- Authoritative focused runner at the same commit: 3 files / 69 tests PASS.
- `git status --short` remained empty after every final-commit gate.
- The behavioral candidate `1b376783381e4e2a777871c485d06af80436db2e` differs from the closure
  commit only by this report-only record, the packet continuity pointer/hash, and the coordinator
  state handoff pointer/packet hash.
