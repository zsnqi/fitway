# Phase 11 Uptime mobile fidelity — b02 terminal plan validation

- Durable state: `FAILED_VALIDATION` before activation. The fresh b02 plan received its initial independent review and two focused plan repairs; the independent final review rejected plan repair 2. The frozen stop rule permits no third plan repair, so Uptime planning now requires new human direction.
- Reviewed candidate: coordinator plan-repair commit `20f2f62337ab89060232c4a446185b2555e68feb`.
- Preserved history: terminal b01/B2 remains immutable at `2/2`, including accepted A1/A2/B1 commits and the separately recorded uncommitted B2 test candidate. This b02 attempt did not create a branch, worktree, lease, database, source change, runtime run, Browser run, or integration commit.
- Budget: b02 implementation validation repairs remain `0/2`; rejection occurred at the plan gate, before the implementation budget opened.

## Independent final-review findings

1. The writer, verifier, and coordinator runtime ladders were deterministically red because `FITWAY_PHASE` remained set for `verify:fast` or `verify:full`, while `scripts/verify.mjs` rejects a phase in non-phase modes.
2. The pre-review freeze did not independently re-prove every accepted carry commit, and the activation SHA was captured from mutable `HEAD` rather than pinned by a separately reviewed record.
3. Integration targeted the mutable branch name instead of the exact independently verified candidate SHA.
4. Runtime blocks omitted required location, frozen-HEAD, status, fail-fast, install, Vitest, and `.env` preconditions across writer/coordinator paths; the coordinator checkout also had unrecognized executable-link state.
5. The paint oracle still allowed an opaque static negative-margin `pointer-events:none` descendant to false-pass, incompletely enumerated pseudo paint sources, and risked rejecting the accepted border-only `tr::before` treatment.
6. Formatted-value requirements conflicted: one instruction prohibited hard-coded ICU punctuation while another required exact full rendered cell literals.
7. Disposable database provisioning was ordered before live-ledger activation even though the `PLANNED` milestone still forbade database and external-system use.

Additional review notes: the final route retained retired external candidates as if current alternatives, and the direct repair route used a non-canonical `candidate_id`. The adversarial matrix found exact region-name matching, transparent connector paint, bounded-summary swaps, finite max/outer clipping, and Arabic unconfirmed-row checks directionally sensitive, but the static negative-margin overlay remained a false-pass.

## Verification and disposition

- Review was fresh, independent, and read-only against both prior rejection records, workflow policy, verification scripts, current repository/worktree state, accepted source commits, and adversarial counterexamples.
- Repository invariants passed at the reviewed commit and the coordinator worktree was clean. A read-only verification smoke check reproduced the phase-environment failure; no implementation or browser gate was run.
- The final verdict is `FAILED_VALIDATION`. No Uptime b02 activation, repair, or integration is authorized from this plan. Settings Paper and the Login WCAG-AA successor remain separately human-authorized follow-up slices and are not changed by this outcome.
