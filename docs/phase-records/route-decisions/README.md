# Route decision records

`docs/WORKFLOW.md` requires the coordinator to choose, per stage, whether a stage runs directly,
on a native subagent, or on an authorized external worker. Until now those choices were recorded
only as prose inside handoffs — for example
`docs/phase-records/handoffs/phase11-audit-generalization/20260822-010500-p11_audit_gen_c04-review-reroute.md`.
Prose describes a decision; it is not a record a later stage can read without re-deriving it.

This directory is the designated location for the machine-readable record, one file per stage:

```text
docs/phase-records/route-decisions/<run-id>-<stage>.json
```

Rules:

- Written by the coordinator when the route is selected, **before** the stage is assigned or any
  write lease for it is opened.
- Completed with `gate_outcome` after that stage's gate closes. A stage whose outcome was never
  appended leaves a stale decision looking current.
- Never edited to make a later stage reusable. A later stage that needs a different route writes
  its own record.
- `durable_authorization_records` names the in-force authorizations the decision relied on. For
  FITWAY the external-worker data-processing consent is already durable and is not re-requested
  per stage; see the two 2026-08-21 coordinator authorizations named in `docs/WORKFLOW.md`.
- These records are evidence, not authority. `AGENTS.md` and `docs/WORKFLOW.md` still decide.

The record shape is `route-decision/1`. `candidate_id: "native"` with `route: null` covers both a
native subagent and direct coordinator execution; `execution` distinguishes them.
