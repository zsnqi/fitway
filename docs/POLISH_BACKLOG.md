# FITWAY deferred polish backlog

These observations survived approval but are deliberately **not** a new redesign gate. Product,
privacy, state, and visual-system decisions stay locked. An item is addressed only inside the
focused polish loop of its owning phase, then verified in the affected routes/states.

| ID | Observation | Owner / trigger | Acceptance boundary | Status |
| --- | --- | --- | --- | --- |
| `VIS-001` | Static red atmospheric lighting should read as softly blurred, naturally positioned depth behind the interface—not a sharp geometric block. | First UI-producing phase that edits the shared page atmosphere; expected Phase 4 staff-web integration. | CSS-only static layers; no canvas/WebGL/RAF; board/text contrast stable in AR/EN at 390, 768/820, 1440; no bright hotspot over content. | DONE — Phase 4 staff-web evidence in `docs/phase-records/batch-02-integration.md` |
| `VIS-002` | Page-level FITWAY watermark may need better optical placement. | Same shared-shell polish pass as `VIS-001`; expected Phase 4 staff-web integration. | Remains behind route surfaces, never inside a data card; does not compete with headings/data or create RTL/LTR imbalance; safe-area and overflow checks pass. | DEFERRED |
| `VIS-003` | Delayed/stale signal colors and patterns need a semantic review. | Phase 6 offline/manual-fallback polish, when delayed/manual/recovery semantics are exercised together. | Last-known state is unmistakable without color alone; remains distinct from live, closed, unavailable, and error; no public capacity inference; screen-reader name and visual pattern agree. | DEFERRED |
| `VIS-004` | Compact informational surfaces should adapt to their content instead of keeping fixed minimum heights. | Phase 4 staff operational UI polish, then applied to later owner surfaces as they are implemented. | Short content does not leave artificial empty slabs; expanded AR/EN copy does not clip; alignment remains deliberate across responsive recompositions. | REOPENED — remains open and is subsumed into the authorized Owner composition redesign scope (`docs/adr/ADR-009-owner-composition-authority-supersession.md`); the Phase 4 staff-web closure in `docs/phase-records/batch-02-integration.md` did not cover Owner surfaces; later Owner audits (`docs/phase-records/handoffs/owner-demo-polish/20260912-owner-presentation-audit-r01.md`) and the 2026-09-15 design-agent environment diagnosis found fixed-height/repeated-surface and balance problems there. |

## Rules

- Do not implement these items outside the named phase merely to “finish the design.”
- If an item requires a material change to the approved identity, state grammar, public privacy,
  or information hierarchy, mark the phase `NEEDS_HUMAN`.
- Completion requires before/after screenshots, the applicable accessibility checks, and a fresh
  verifier. Record the evidence in the owning phase record and change only that row's status.
