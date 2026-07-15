# Approved FITWAY theme snapshot — 2026-07-15

This directory is an immutable, curated promotion of the approved visual-lab work. Its source is
the preservation commit `40c4abd1c8aaa4806662af44c0036f9a93bcc8be` on
`preserve/brg-visual-approved-20260715`.

- `VISUAL_SYSTEM_SOURCE.md` is the exact approved source description.
- `HANDOFF_FINAL_REFINEMENT_SOURCE.md` preserves the final-refinement history; it is not current
  workflow authority.
- `prototype/` is a self-contained review-only relocation of the source prototype, not
  production implementation. Its `provenance/` stylesheet is byte-exact; runnable paths and
  copied asset locations are authenticated by the manifest tree hash.
- `screenshots/` is a small canonical subset. The preservation commit retains the complete matrix.
- `../APPROVAL_MANIFEST.yaml` records hashes, retained decisions, and supersessions.

Production must follow Product, Spec, and the root Design Guide. Do not import fixture content,
fake identities, email/password staff flow, or future route functionality from this prototype.
Do not edit the snapshot in place; a future approved change receives a new dated snapshot and a
manifest/ADR/phase-record update.
