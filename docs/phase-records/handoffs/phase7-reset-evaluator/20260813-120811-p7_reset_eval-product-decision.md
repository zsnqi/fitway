# Phase 7 reset evaluator Product decision record

- Status: the former settings-ownership `NEEDS_HUMAN` item is resolved. `SPEC.md` and ADR-004 now
  carry the normative rule; no further Product decision is pending for this seam.
- Coordinator base: `8bce121e4e65915fc6a5ab93acb3de0500050b2c` on clean `main`.
- Branch / worktree / run ID: coordinator `main` /
  `D:/Projects/fitway-worktrees/phase5-staff-integration` / `p7_reset_eval_decision_c02`.
- Owned paths: coordinator-only `SPEC.md`, `docs/adr/ADR-004-time-and-business-day.md`,
  `PROJECT_STATE.yaml`, and this Phase 7 decision handoff. No shared lease was used.
- Authoritative decision: the settings version effective immediately before scheduled close owns
  that session's reset. A version effective exactly at close does not own it. At close, freeze the
  owning settings version, `resetBufferMinutes`, and resulting `dueAt`. Later settings changes,
  including changes during the buffer, do not recompute, cancel, or transfer the pending reset and
  apply prospectively only. Historical evaluation resolves the relevant real instants and never
  substitutes current settings.
- Source hierarchy: the user supplied the Product decision explicitly; this commit records it in
  `SPEC.md` and synchronizes ADR-004's historical-time rationale. `FITWAY_PRODUCT.md`, reviewed
  schemas, and current append-only settings lookup do not conflict with it.
- Browser/a11y/visual: `NOT_REQUIRED`; this is a data-semantic authority record.
- Validation: run focused Biome where applicable, repository invariants, `git diff --check`, and
  clean-status proof before committing.
- Independent review: the previous plan review required exactly this normative amendment. A fresh
  read-only review is still required for a timestamped superseding b02 plan before activation.
- Remaining work: supersede, do not overwrite, the 2026-08-11 b02 plan; preserve the b01 terminal
  attempt; restore the Phase 7 verification profile only in the later activation commit; transition
  `NEEDS_HUMAN -> READY -> IN_PROGRESS` under workflow authority.
- Exact resume command: `git -C D:/Projects/fitway-worktrees/phase5-staff-integration status --short --branch`
  followed by authoring the superseding Phase 7 b02 plan from the committed decision.
- Stop conditions: a same-level authority conflict, unleased shared path, or independent plan
  rejection stops activation. The resolved exact-close/during-buffer question must not be
  re-escalated.
