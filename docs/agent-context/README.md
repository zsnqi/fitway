# FITWAY agent context layer

This directory is routing and process infrastructure. It is not a Product, Spec, security,
privacy, data, accessibility, or visual-authority source, and it cannot override any of those
sources.

The precedence order is:

1. `AGENTS.md` for repository-wide safety, ownership, conflict, and stop rules.
2. `FITWAY_PRODUCT.md`, `SPEC.md`, reviewed schemas/DTOs, ADRs, and the approved visual-authority
   chain for the truth governed by each source.
3. `docs/WORKFLOW.md` for execution and verification procedure.
4. `PROJECT_STATE.yaml` for the coordinator-owned active frontier.
5. A task packet for the bounded assignment and exact selectors, only insofar as it agrees with the
   sources above.
6. `PROJECT_STATE_HISTORY.yaml`, handoffs, archives, and other phase records only when a named
   decision, predecessor, incident, or audit requires them.

`ROUTES.yaml` names the minimum initial route for each task class. It does not copy authority text.
`TASK_PACKET_TEMPLATE.yaml` and `EVIDENCE_RECEIPT_TEMPLATE.md` are templates, not authority. A
packet is coordinator-authored derived context; it never resolves a conflict with a cited source.
The packet path remains stable for the lifetime of its milestone and becomes immutable evidence
after closure. A route's optional `packetRequiredConditionals` list explicitly names conditional
sources that may be promoted to required for a packet. Supplemental packet sources may add exact
affected files/selectors only under a role registered by that route; arbitrary or unauthorized
historical authorities are rejected.

During M2 the layer is in compatibility mode. Existing active milestones may have no packet; the
checker reports that condition as a warning and does not pretend that packet context was loaded.
Once the prospective active-state migration makes packets mandatory, the same condition becomes a
failure. Any evaluable path, case, tracking, schema, selector, scope, or pointer violation fails
even in compatibility mode.

Use:

```text
pnpm check:agent-context
pnpm context:show -- --milestone <milestone-id>
```

`context:show` prints a bounded route plan, selectors, conditional triggers, destinations, and
stop conditions. When a packet exists, it also prints that packet's exact required and conditional
authority entries. It does not concatenate source files, claim that a source was read, summarize an
authority, or resolve a conflict automatically.

Historical pointer exceptions are deliberately narrow. They document immutable records whose
targets are known to be absent; they do not repair, rewrite, or promote historical material.
