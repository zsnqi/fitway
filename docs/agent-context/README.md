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
exactly one validated packet: a missing, partial, stale, or untracked packet is a blocking failure
for `check-agent-context` and `context:show`, and a milestone may not reach `READY` without it.
`compatibility` mode is the documented one-release fallback for the legacy broad route; it warns
instead of failing when an open milestone has no packet, while every evaluable path, case,
tracking, schema, selector, scope, pointer, and lifecycle violation still fails. Partial packet
metadata fails closed in both modes.

At startup, use the bounded route and continuity check:

```text
pnpm context:show -- --milestone <milestone-id>
```

`context:show` reads `ROUTES.yaml` and `PROJECT_STATE.yaml`, then inspects and reads only the
selected packet, plus filesystem path inspection. For registered packets, it checks the stable
path, state hash, packet identity, task class, base, state reference, scope, handoff, and lifecycle
before printing a plan. It does not open history, concatenate authority files, claim those sources
were read, summarize an authority, or resolve a conflict automatically.

For repository-wide mechanical validation, run:

```text
pnpm check:agent-context
```

`check-agent-context` is a repository-wide mechanical validator that checks active context
invariants and audits closed ledger records against `PROJECT_STATE_HISTORY.yaml`. Its mechanical
history parsing is validator work; it does not load historical content into an agent's reasoning or
startup context. Agents open historical content only when a named trigger or pointer requires it.

Historical pointer exceptions are deliberately narrow. They document immutable records whose
targets are known to be absent; they do not repair, rewrite, or promote historical material.
