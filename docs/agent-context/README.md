# FITWAY agent context layer

This directory is routing and process infrastructure. It is not a Product, Spec, security,
privacy, data, accessibility, or visual-authority source, and it cannot override any of those
sources.

The precedence order is:

1. `AGENTS.md` — repository-wide safety, ownership, conflict, and stop rules.
2. `FITWAY_PRODUCT.md` and `SPEC.md` — product identity, surface boundaries, security, privacy,
   data, interfaces, and acceptance; a conflict between them stops the work.
3. Reviewed migrations, schemas, and DTOs — implementation conformance.
4. The approved visual-authority chain — Paper where ADR-007 keeps it active, `DESIGN_GUIDE.md`,
   the approval manifest, and named human decisions that supersede them for a surface.
5. `PHASES.md` for durable dependency and acceptance scope, and `PROJECT_STATE.yaml` for the
   coordinator-owned active frontier.
6. `docs/WORKFLOW.md` for execution and verification procedure.
7. A task packet for the bounded assignment and exact selectors, only insofar as it agrees with the
   sources above.
8. `PROJECT_STATE_HISTORY.yaml`, handoffs, archives, and other phase records only when a named
   decision, predecessor, incident, or audit requires them.

`AGENTS.md` is checked against a documented 120,000-byte cumulative instruction cap; growth above a
conservative 24,000-byte warning threshold is reported but is not itself a failure.

`ROUTES.yaml` names the minimum initial route for each task class. It does not copy authority text.
`TASK_PACKET_TEMPLATE.yaml` and `EVIDENCE_RECEIPT_TEMPLATE.md` are templates, not authority. A
packet is coordinator-authored derived context; it never resolves a conflict with a cited source.
The packet path remains stable for the lifetime of its milestone and becomes immutable evidence
after closure. A route's optional `packetRequiredConditionals` list explicitly names conditional
sources that may be promoted to required for a packet. Supplemental packet sources may add exact
affected files/selectors only under a role registered by that route; arbitrary or unauthorized
historical authorities are rejected.

`ROUTES.yaml` records the startup-routing mode. In `active` mode every open milestone must have
exactly one validated packet, and a milestone may not reach `READY` without it. A missing
packet blocks both `check-agent-context` and `context:show`. The repository-wide checker
validates schema, tracking, sources and lifecycle; `context:show` checks the selected packet's
identity, state reference, route and lifecycle.
`compatibility` mode is the documented one-release fallback for the legacy broad route; it warns
instead of failing when an open milestone has no packet, while every evaluable path, case,
tracking, schema, selector, active pointer, and lifecycle violation still fails.

At startup, use the bounded route and continuity check:

```text
pnpm context:show --milestone <milestone-id>
```

`context:show` reads `ROUTES.yaml` and `PROJECT_STATE.yaml`, then inspects and reads only the
selected packet, plus filesystem path inspection. For registered packets, it checks the stable
path, packet identity, state reference, task class route, and lifecycle before printing a plan.
`baseCommit`, scope (`ownedPaths`, `forbiddenPaths`, `sharedLeases`), and the current handoff
live in the ledger; `taskClass` lives in the packet. Old copies may remain as provenance but
are neither compared nor used. Packet hashes, heartbeat dates, and lease expiry dates have no
effect on validation, and tools do not refresh them. It does not open history, concatenate authority files, claim those sources
were read, summarize an authority, or resolve a conflict automatically. The CLI then opens the
selected current handoff to print its resume instruction.

For repository-wide mechanical validation, run:

```text
pnpm check:agent-context
```

`check-agent-context` is a repository-wide mechanical validator that checks active context
invariants and audits closed ledger records against `PROJECT_STATE_HISTORY.yaml`. Its mechanical
history parsing is validator work; it does not load historical content into an agent's reasoning or
startup context. Agents open historical content only when a named trigger or pointer requires it.

Closed history entries and CLOSED packets are frozen records. Checks validate their shape and
lifecycle without following any path inside them. Active records still require valid, tracked
source paths and selectors. `evidence.receiptTemplate` is optional; no check opens its target.

A closure is one commit that moves the terminal milestone from `PROJECT_STATE.yaml` to the end
of `PROJECT_STATE_HISTORY.yaml`. No receipt, declaration, or anchor is required. Existing
receipts and the legacy anchor remain untouched as provenance; review and git keep history
append-only. Checks reject duplicate ids, open statuses in history, unknown dependencies across
the union, and DONE records without an integrated commit and passing or NOT_REQUIRED gates.

`SUPERSEDED` is terminal. It requires a non-empty `stopReason` and `supersededBy` naming a
different milestone in the ledger or history. Other statuses cannot carry `supersededBy`.
Only DONE satisfies a dependency; dependents must name the completed successor.

`pnpm handoff:new --milestone <id>` uses `<id>-resume.md` next to the current handoff, or in
`--dir`. It creates that file from `HANDOFF_TEMPLATE.md` if absent. An existing file keeps
every byte except its As of line. Only the file and ledger handoff pointer change; git history
is the resume chain. Timestamped handoffs remain valid, and Previous resume point is optional
and never followed by a check.
