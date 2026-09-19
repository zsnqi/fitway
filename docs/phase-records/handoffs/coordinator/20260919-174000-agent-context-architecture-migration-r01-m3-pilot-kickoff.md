# Agent-context architecture migration r01 — M3 pilot kickoff

Date: 2026-09-19 17:40 +03:00

## Purpose

M3 rehearses the task-packet lifecycle on two existing, authorized, read-only tasks. It creates no
product work and grants no application write authority.

## Frozen candidate

- Base commit: `7e79de90c52adb60127b3dfd57c88013985bbfc1`
- Lifecycle infrastructure: `feat: enforce task packet lifecycle`
- Legacy startup remains available while both pilot milestones are `PLANNED`.

## Pilot tasks

1. `agent-context-pilot-backend-operational-snapshot-r01` reviews the existing Staff
   `operationalSnapshot` read path and its focused unit/disposable-Postgres evidence. It must not
   change DTOs, repository behavior, API behavior, migrations, product semantics, or UI.
2. `agent-context-pilot-ui-login-r01` reviews the existing Login implementation, its focused
   browser/accessibility coverage, and the named Arabic desktop implementation/reference frames.
   It must not change UI, screenshots, Paper artifacts, visual authority, or Owner/Staff surfaces.

Both packets start as `DRAFT` while their milestones are `PLANNED`. Fresh-agent discovery,
focused verification, and independent review must pass before the coordinator updates either
packet to `READY`. Packet/state hashes are updated atomically for every packet-byte change.
The pilots keep migration lineage in packet continuity rather than state dependencies, because the
parent migration remains `IN_PROGRESS` while M3 runs and repository invariants require every
dependency of a `READY` milestone to be `DONE`.

## Safety boundaries

- The pilots are read-only rehearsals; their only owned write path is their future coordinator
  evidence receipt.
- `PROJECT_STATE_HISTORY.yaml` and all existing terminal records remain unchanged during the
  draft/ready rehearsal.
- No Owner implementation, preserved dirty frontier file, canonical screenshot, visual manifest,
  Product, Spec, ADR, or design-authority source may be edited.
- A stale selector, path, frame hash, packet hash, base commit, scope field, or handoff pointer is a
  blocking validation failure.

## Next evidence

The coordinator will run strict packet routing and `context:show`; the backend unit and registered
`phase4-health` profile; focused Login Playwright as bounded corroboration; the authoritative
migration fast/full ladders; and fresh no-history discovery for both packets. The M3 evidence must
also retain the focused lifecycle suite that exercises DRAFT, READY, update/stale hash, independent
verifier inputs, CLOSED/history continuity, and missing-packet stops; compare both pilots with the
frozen legacy startup route; show no critical source loss; and record all section-10 fresh-agent
observations. Closure evidence will name exact commands, artifacts, limitations, and review
verdicts. Actual pilot closure/history archival remains a serialized coordinator transaction; it
must never be simulated by editing history outside the validated lifecycle.
