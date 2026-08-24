# FITWAY finalized remaining scope — coordinator activation

- Run: `p11_remaining_coord01`.
- Mode: discover, followed by separately adopted plan / execute / verify / review stages.
- Checkout: detached at `181480a`; `work/phase11-access-ui-b01` points at the same commit in the primary worktree. The tree was clean before this activation record.
- Integration baseline: `main` is `0ef72c2`, the merge-base and an ancestor of the current eleven-commit Access UI candidate.
- No repository write lease and no Paper write lease was open at activation. After the discovery gate, the coordinator opened exactly one Paper write lease for the new Owner Access behavior-correct successor area; no repository writer is active.

## Human authority carried into this run

The active human instruction supersedes stale candidate labels and the two Access handoff gates:

- Owner Access, Owner Audit, Owner Uptime & Incidents, and Owner Settings Paper families are implementation visual authority.
- The coordinator may create and accept bounded successor Paper corrections and routine canonical-baseline refreshes inside the approved FITWAY/G3 system after independent fidelity review; approved originals remain preserved.
- Owner Access preserves user-entered owner passwords and secret-free responses. Generated owner credentials in Paper are behaviorally non-authoritative.
- Settings edits are limited to capacity, band thresholds, weekly hours, business-day boundary, and reset buffer. Timezone, push interval, freshness/stale intervals, and poll interval remain read-only and are copied forward.
- M4/M5 access races, owner-access rate limiting, and the workflow environment-documentation gap are explicitly outside the approved scope.
- A schema or migration requirement is a stop condition.

## Ground truth already established

- OpenCode 1.18.21 is installed; live preflight confirms `opencode-go/deepseek-v4-pro` is available.
- This Codex checkout is not toolchain-ready: `node_modules/.bin/vitest.cmd` and `playwright.cmd` are absent, root and server `.env` files are absent, and `pnpm exec vitest --version` attempted a frozen-lockfile dependency repair instead of printing a version. No verification result from this checkout will be trusted until `pnpm install --frozen-lockfile` and the Vitest version gate succeed. The failed readiness probe's `.pnpm-store` residue was removed.
- The two 2026-08-21 FITWAY external-worker authorization records remain in force for non-secret repository content.
- External candidates are not qualified for real Paper design-content reads or writes. Paper content stages therefore route native; Paper remains one writer at a time.
- Paper file `FITWAY UX Exploration`, Page 1, contains the four named families. Their stale `CANDIDATE` labels do not reduce the human-granted implementation authority.
- Current Access UI implementation and browser baselines exist through stage 5 at `181480a`; freeze, independent verification, integration, and `DONE` have not occurred.

## Discovery wave and route records

1. Repository authority/frontier map — external DeepSeek V4 Pro / high, read-only, route record `p11_remaining_coord01-authority-frontier-discovery.json`.
2. Paper Access + Uptime rendered review — native Sol / high, read-only, route record `p11_remaining_coord01-paper-access-uptime-review.json`.
3. Paper Settings + Audit rendered review — native Sol / high, read-only, route record `p11_remaining_coord01-paper-settings-audit-review.json`.

These questions were independent and read-only. All three closed at the parent gate. The repository map is `PASS_WITH_CORRECTION`; both Paper evidence axes are `PASS`. Their compact findings are inputs to the coordinator's authority reconciliation, not acceptance decisions.

## Reconciled findings

- Access Paper is behaviorally wrong: it contains no owner-password entry state and does contain generated-secret Copy/نسخ actions. The smallest lawful successor preserves the FITWAY/G3 shell and list patterns while changing owner create/reset to user-entered password forms and secret-free confirmations.
- Uptime desktop is materially aligned. Mobile metrics already stack, but offline-period and incident records require auto-height stacked cards; the current 11px/16px horizontal lanes are not a resilient 390px authority.
- Settings is not ready for specification extraction. It renders static facts rather than controls and omits the push interval. A corrected successor must expose exactly the five editable axes and a visibly locked timing group containing timezone, push, freshness, stale, and poll values.
- Audit is materially aligned. Its mobile board claims five records but renders four; that significant bounded successor correction is carried with the Uptime/Settings Paper sequence, without reopening Audit architecture.
- Existing `settings_versions` columns and `settings_updated` audit infrastructure support the authorized Settings surface without a migration. No `admin.settings` procedure exists yet. Any discovered migration/schema need remains a stop condition.
- The reference-gating unit debt is a separate unledgered slice; the real propagation-wait milestone is already ledgered. Focus parity's dependency on Settings is stale and is reconciled to the completed shell dependency.
- The external map's one corrected statement: ADR-007 itself names the older CURRENT families. The four newer Owner families are authority because of the active human decision, subject to ADR-007's behavior/visual split.

## Provisional executable DAG

The discovery gate is closed. The following executable dependency edges are now durable in `PROJECT_STATE.yaml`:

1. Correct Owner Access in one labelled successor Paper area, independently review it, derive the bounded repository correction, then freeze / verify / integrate Access.
2. Create and review the Uptime mobile stacked-card successor, then implement and verify the bounded mobile fidelity correction.
3. Correct and review Settings Paper, extract a written specification, confirm the existing backend contract remains migration-free, then implement Settings.
4. Close the reference-gating unit debt and the real unmocked end-to-end propagation-wait milestone in bounded server slices; their full/integration ladders are serialized even where source ownership is disjoint.
5. Close focus parity and Login Paper adoption after their actual dependencies are current.
6. Run the Phase 11 aggregate only after Access, Settings, Uptime mobile fidelity, both debt milestones, focus parity, and Login adoption are terminal and integrated.

Canonical baseline promotion, repository integration, `PROJECT_STATE.yaml`, shared-file leases, and terminal `DONE` declarations remain coordinator-owned and serialized.

## Subsequent Paper routing instruction

The human instruction received after the Access successor write makes all later Paper mutation SOL-only. When practical, Uptime and Settings Paper writes route to a native SOL subagent with explicit Paper write capability and one narrow lease. Luna, Terra, Ox Alpha, DeepSeek V4 Pro, and every other model/provider are excluded from Paper mutation. The main SOL session retains Paper authority, sequencing, acceptance/rejection, and final fidelity judgment, and may write directly only if a qualified SOL subagent cannot perform the bounded edit.

## Verification status

No implementation verification was claimed at activation. Discovery was read-only. Its three route decisions now carry their checked gate outcomes; the Owner Access Paper successor writing stage is open with `gate_outcome: PENDING` and has not mutated Paper yet.
