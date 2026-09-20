# Agent-context architecture migration r01 — M7 closure

- Prepared: 2026-09-20 18:20 +03:00.
- Stage: M7 — design-context specialization and deprecation cleanup.
- Scope: context validation, design-packet compatibility, and process documentation only; no
  Product, Spec, application, UI, visual-authority, screenshot, Paper, dependency, lockfile, or
  database change.

## Visual surface index decision

- The compact machine-readable visual surface index is **not added**. Deterministic derivation is
  not proven:
  - `docs/design/VISUAL_AUTHORITY_STATUS.md` carries its statuses as prose cells that are updated
    only as a derived consequence of a reviewed human decision; its Maintenance section states that
    an edit not derived from such a decision is a defect. Status 5 is derived from ADR-009 plus a
    named human decision record, and statuses 2-4 are unassigned until a human assigns them.
  - The structured sources (`AUTHORITY_MANIFEST.yaml` `surfaces.<key>.status`, the ADR-009 policy
    module, the route-manifest status legend) do not form a total function by themselves: the
    register's ten surface keys, seven-surface ADR-009 supersession, status-vocabulary assignment,
    and per-surface evidence citations are prose decisions, and equality could only be checked by
    parsing them as prose.
  - The plan's guardrail is explicit: create the index only if it can be deterministically derived
    and checked for equality; do not create another hand-maintained visual layer.
- Documented fallback in force: UI packets resolve the surface status through the required
  `visual-status` register source (`docs/design/VISUAL_AUTHORITY_STATUS.md`, heading `Register`),
  the Owner ADR-009 conditional, and ADR-007 where status requires. The M6 route registry already
  carries those selectors.

## UI packet and design-context validation

- `check-agent-context` now rejects any UI packet whose `designContextCheck.command` does not run
  `check:design-context`. The command requirement applies to `ui-maintenance` and
  `visual-authority-change` packets in every lifecycle state, and the existing READY/executing
  rules still require that check to be `PASS`.
- New focused fixtures resolve all five route families: Public and Login (`ui-maintenance`,
  `ACTIVE` + `PAPER`), Staff (`ui-maintenance`, `ACTIVE` + `MANIFEST`), Owner-maintenance
  (`ui-maintenance`, `SUPERSEDED` + `HUMAN_DECISION`), and Owner-redesign
  (`visual-authority-change`, ADR-009 cited with the route's exact selector, `SUPERSEDED` +
  `HUMAN_DECISION`). A tamper fixture proves the design-context command is enforced, and another
  proves an Owner UI packet must carry the registered ADR-009 conditional.
- Owner superseded composition still cannot be promoted back to acceptance authority: the existing
  rule rejecting `SUPERSEDED` with `PAPER`/`MANIFEST` acceptance authority remains, and the ADR-009
  policy module keeps revocation disabled.

## Deprecation cleanup

- `docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md` is now a compatibility pointer, not a fill-in
  template. It keeps the `Paper availability/provenance` heading because the closed Login pilot
  packet cites it, and points to the active task packet contract
  (`docs/agent-context/TASK_PACKET_TEMPLATE.yaml`, `docs/schemas/task-packet.schema.json`).
  `docs/WORKFLOW.md` "Design work" step 7 now briefs sessions from the packet's `visual`,
  `designContextCheck`, `accessibilityGate`, `scope`, and `verification` fields.
- `scripts/project-state-history-transition.mjs` records the v2 receipt chain as the only path for
  new transitions; the legacy phase3 anchor and full-snapshot compatibility claim stay immutable
  for already-recorded history and are never regenerated. `docs/WORKFLOW.md` "Active ledger and
  closed history" states the same rule.

## Verification

- Authoritative focused runner: `scripts/check-agent-context.test.ts` and
  `scripts/show-agent-context.test.ts` — PASS, 2 files / 62 tests.
- History/schema focused runner: `scripts/project-state-history-transition.test.ts`,
  `scripts/project-state-history-v2.test.ts`, `scripts/verify-repository.schema.test.ts` — PASS,
  3 files / 41 tests.
- `scripts/check-agent-context.mjs` — PASS: 8 task classes, `startup routing mode: active`.
- `scripts/verify-repository.mjs` — PASS: 1 active, 103 archived milestones, valid union.
- Biome — PASS for every changed code/doc file.
- Clean detached worktree at behavioral candidate
  `fde3988cf37f037f20dfcfcee949fb63b6454f59`: authoritative `scripts/verify.mjs fast` — PASS,
  86 files / 1096 unit tests and 120 Python simulator tests, with repository/context/type/build
  steps and the mutation guard green.
- This report-only closure commit changes only this record, the packet continuity pointer and hash,
  and the coordinator state handoff pointer and packet hash.

## Preserved boundaries and next stage

- No Product, Spec, application, UI, visual-authority, canonical, Paper, dependency, or database
  bytes changed. Existing history records remain byte-identical.
- The retired template was a briefing template, never authority; the visual register, ADRs, and
  manifests remain the governing chain.
- M8 remains: fresh-agent scenario validation, independent architecture and verification reviews,
  the authoritative fast/phase/full ladders in a clean worktree, and the terminal v2 history
  transition.
