# FITWAY per-surface visual authority — status register

> **Authority status: DERIVED VIEW — NOT AUTHORITY.** This register creates no authority, grants no
> approval, and changes no locked product, privacy, security, accessibility, content, or visual
> decision by itself. It compacts what ADR-007, the approval manifests, and accepted human records
> already establish so a design session can see, per surface, what currently governs composition
> before reading any history. Every status below is derived from those sources; where this register
> and a source disagree, the source governs and this register is the defect. Changing a status is a
> human decision recorded in a reviewed record, never an edit made here alone. Since 2026-09-15 the
> register also derives the Owner composition-authority supersession recorded by the human decision
> in `docs/adr/ADR-009-owner-composition-authority-supersession.md` (ADR-009).

- Recorded: 2026-09-15 (WS-C of the design-agent environment repair; documentation only).
- Updated: 2026-09-15 (WS-G of the design-agent environment repair; documentation only) to derive
  the Owner composition-authority supersession from ADR-009 and the decision record
  `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`.
- Derivation sources: `docs/adr/ADR-007-paper-visual-source-of-truth.md` (ADR-007),
  `docs/adr/ADR-009-owner-composition-authority-supersession.md` (ADR-009),
  `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`,
  `visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml`
  (abbreviated below as `RAM`), and the accepted human/independent records cited per row.
- Live Paper tool exposure during the 2026-09-15 diagnosis: **not exposed**; see
  `docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md:118-128`
  and root cause 7 at `:235-239`. Stored exports and canonicals are provenance and comparison
  references, never live authority.
- This file changes no locked decision. It does not downgrade or upgrade any surface; the Owner
  statuses below derive from ADR-009 and grant no approval of their own.

## Status vocabulary (exactly five statuses plus one flag)

1. **`Paper composition authority`** — Paper governs composition; the repository governs behavior.
2. **`Paper identity/behavior cues only`** — Paper no longer governs composition.
3. **`Previous baseline / comparison reference`** — Paper is retained only as a comparison reference.
4. **`Superseded by newly approved concept`** — a new human-approved concept governs composition.
5. **`Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)`** — the seven Owner surfaces only. No composition authority is in force: the previous Owner Paper compositions, their accepted canonical routed screenshots, the accepted-case authority mappings, and the frozen `owner-governance-layout-recomposition-r02` candidate are provenance and comparison references only and cannot constrain the redesign; `DESIGN_GUIDE.md` system rules and the non-visual contracts listed in ADR-009 remain binding; authority returns only when a new concept is approved through the concept-selection gate and the perceptual-promotion gate in `docs/WORKFLOW.md`.
6. **`DECISION REQUIRED`** (flag, not a status) — a change of status is requested but not granted.

`public`, `login`, and `staff` are status 1 today; the seven Owner surfaces are status 5, derived
from ADR-009 and the 2026-09-15 decision record. Statuses 2, 3, and 4 are unassigned; assigning one
requires the human decision recorded in a reviewed record.

## Register

`RAM` column notation: `RAM` = `visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml`;
`surfaces.<key>` names the entry; the parenthesized line is the entry-level `status:` line unless
noted. The route manifest's own top-level `status: IN_PROGRESS` (RAM:16) is explained in the legend
below. All ten surfaces carry the 2026-09-05 human visual approval
(`docs/phase-records/handoffs/full-route-paper-fidelity/20260905-human-visual-approval.md`,
grant 2 at `:19-36`) and the closure record
(`docs/phase-records/handoffs/full-route-paper-fidelity/20260905-fidelity-closure.md:13-21`); for
the seven Owner surfaces that approval is superseded as composition authority and retained as
provenance only (ADR-009 decision 2).

| Surface | Current status | Exact authority source | Governing acceptance record(s) | Known composition concern (exact evidence path) |
| --- | --- | --- | --- | --- |
| `public` | `Paper composition authority` | `RAM` `surfaces.public` (`:32-35`), `status: ACCEPTED_PAPER_AUTHORITY` (`:35`); area `PUBLIC CROWD BOARD PRODUCTION SET — CURRENT` (`:33`) | `docs/phase-records/handoffs/full-route-paper-fidelity/20260902-213926-public-paper-repair.md`; 2026-09-05 approval + closure | Minor accepted difference: Public EN 390 legend spacing differs slightly from Paper, no collision or clipping (`docs/phase-records/handoffs/full-route-paper-fidelity/20260904-final-independent-reviews.md:30`). Paper-vs-guide conflicts: see `PAPER_GUIDE_CONFLICT_MAP.md`. |
| `login` | `Paper composition authority` | `RAM` `surfaces.login` (`:83-87`), `status: ACCEPTED_PAPER_AUTHORITY` (`:86`) | `docs/phase-records/handoffs/full-route-paper-fidelity/20260902-211102-login-staff-paper-checkpoint.md`; 2026-09-05 approval + closure | Open, unmapped hover-contrast exception — see "Login hover-contrast exception" below. |
| `staff` | `Paper composition authority` | `RAM` `surfaces.staff` (`:139-145`), `status: ACCEPTED_SPLIT_AUTHORITY` (`:144`); composition area QPD-0 (`:140-141`), interaction area 146R-0 (`:142-143`) | `20260902-211102-login-staff-paper-checkpoint.md`; 2026-09-05 approval + closure; capacity/monitoring-only human decision 2026-08-09 | Capacity is DTO-only and unrendered by human decision 2 (`docs/phase-records/handoffs/phase5-staff-ui/20260809-030128-p5_staff_monitoring-activation-ratification.md:39-43`; `PHASES.md:184-189`). Approved deviation `staff-camera-failure-semantic-distinction` (`RAM:145`). No composition-weakness finding. |
| `owner-shared-navigation` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerSharedNavigation` (`:247-254`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:250`, area `OWNER SHARED NAVIGATION — FULL-ROUTE SUCCESSOR — CURRENT` `:248`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: human approval `docs/phase-records/handoffs/full-route-paper-fidelity/20260902-192833-owner-shell-approved-activity-candidate-needs-human.md` (also `RAM:253`); 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** provenance deviation `owner-shared-navigation-uniform-material` (`RAM:254`). Cross-surface (not shell-topology) concern: section tab strip anchored from content-measured heading heights re-lands 3-7px between sections (`docs/phase-records/handoffs/owner-demo-polish/20260912-owner-presentation-audit-r01.md:22`). |
| `owner-daily` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerDaily` (`:267-273`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:270`, area `OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT` `:268`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: `docs/phase-records/handoffs/full-route-paper-fidelity/20260903-115000-owner-daily-paper-repair.md` and the 2026-09-05 marker-closure package referenced in grant 1 of the approval record (`docs/phase-records/handoffs/full-route-paper-fidelity/20260905-human-visual-approval.md:3-17`); 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** no Paper-topology weakness finding. Implementation-level hard-code noted by audit: Daily heading `padding-inline-end: 510px` (`20260912-owner-presentation-audit-r01.md:36`); the current `apps/web/src/components/owner/owner-analytics.css` no longer contains that literal. Provenance deviation `owner-daily-bounded-truthful-curve` (`RAM:273`). |
| `owner-reports` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerReports` (`:340-346`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:343`, area `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` `:341`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: `docs/phase-records/handoffs/full-route-paper-fidelity/20260903-121300-owner-reports-paper-repair.md`; 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** independent audit found a Report Range row ~190px mid-row void, CSV board ~520px dead space, lower boards 99px height mismatch and a clipped hourly row (`20260912-owner-presentation-audit-r01.md:24-26`). The frozen r02 candidate recomposes this surface; it is preserved as provenance only and cannot constrain the redesign (ADR-009 decision 2). The former scoped-amendment requirement is resolved: prior Owner composition authority is superseded by ADR-009. |
| `owner-access` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerAccountsAndSignIn` (`:389-395`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:392`, area `OWNER ACCESS — BEHAVIOR-CORRECT SUCCESSOR — CURRENT` `:390`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: `docs/phase-records/handoffs/full-route-paper-fidelity/20260903-122659-owner-access-paper-repair.md`; 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** no surface-specific Paper-topology weakness finding; systemic Owner quality findings apply (`20260912-owner-presentation-audit-r01.md:45-53`). The frozen r02 candidate includes this surface (`docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r02.md:3, 24-27`); it is provenance only and cannot constrain the redesign (ADR-009 decision 2). Provenance deviation `owner-access-runtime-contract-columns` (`RAM:395`). |
| `owner-activity-log` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerActivityLog` (`:428-437`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:433`, successor area `OWNER ACTIVITY LOG — SHARED-SHELL SUCCESSOR — CURRENT` `:431`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: human approval `docs/phase-records/handoffs/full-route-paper-fidelity/20260902-202148-activity-log-approved.md` (also `RAM:436`); `docs/phase-records/handoffs/full-route-paper-fidelity/20260903-170437-owner-activity-log-paper-repair.md`; 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** independent audit found filter dropdown options rendering one word per line (P0), inconsistent widths, orphaned numeric inputs, uneven rhythm (`20260912-owner-presentation-audit-r01.md:27`). Provenance deviation `owner-activity-log-bidi-and-presentation` (`RAM:437`). |
| `owner-system-status` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerSystemStatus` (`:469-478`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:474`, desktop area `OWNER UPTIME & INCIDENTS PRODUCTION SET — CANDIDATE` `:470`, mobile area `OWNER UPTIME — MOBILE STACKED RECORDS SUCCESSOR` `:472`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: human approval `docs/phase-records/handoffs/phase11-uptime-paper-successor/20260825-003100-p11_uptime_paper_c01-coordinator-done.md` (also `RAM:477`); 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** no surface-specific Paper-topology weakness finding; systemic Owner quality findings apply (`20260912-owner-presentation-audit-r01.md:45-53`). The frozen r02 candidate includes this surface (`20260915-owner-governance-layout-recomposition-r02.md:3, 24-27`); it is provenance only and cannot constrain the redesign (ADR-009 decision 2). Provenance deviation `owner-system-status-shared-shell-runtime-data-and-bidi` (`RAM:478`). |
| `owner-settings` | `Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)` | ADR-009 decisions 1-2 and 5 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) plus the decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`; previous source `RAM` `surfaces.ownerSettings` (`:512-519`, `status: SUPERSEDED_FOR_OWNER_REDESIGN` `:515`, area `OWNER SETTINGS — FRESH r01 SUCCESSOR CANDIDATE` `:513`) retained as provenance, re-statused from `ACCEPTED_PAPER_AUTHORITY` by the follow-on manifest workstream | Superseded as composition authority (ADR-009); retained as provenance: human approval `docs/phase-records/handoffs/phase11-settings-paper-successor/20260830-193000-p11_settings_paper_fresh_r01-done.md` (also `RAM:518`); 2026-09-05 approval + closure | **Redesign input (ADR-009), not an authority conflict:** diagnosis root cause 1 records weak characteristics (wide form-heavy rows, limited role differentiation, overextended horizontal topology) already encoded in the Paper export and promoted canonical, superseded as composition authority (`20260915-165423-design-agent-environment-diagnosis.md:134-138`). Audit: 425px control boxes with pointer-dead trailing zones; heaviest material carrying least content (`20260912-owner-presentation-audit-r01.md:28-29`). Provenance deviation `owner-settings-shared-shell-and-runtime-values` (`RAM:519`). |

`owner-access` and `owner-system-status` carry no surface-specific independent weakness citation;
their recomposition appears only inside the frozen r02 candidate. This register asserts nothing
beyond that; like every Owner surface they carry status 5, and the absence of a surface-specific
finding is not a composition-quality claim.

## Staff capacity and monitoring-only

Staff's Paper composition is authoritative (`RAM` `surfaces.staff`, `:139-144`). The 2026-08-09
human decision (decision 2) keeps capacity DTO-only and unrendered: capacity may remain in the
DTO/data model where required, and its presence does not require Staff UI rendering. This supersedes
the older `PHASES.md` Phase 4 acceptance wording that required private capacity visibility; the
historical sentence is retained unedited and the coordination note records the supersession
(`docs/phase-records/handoffs/phase5-staff-ui/20260809-030128-p5_staff_monitoring-activation-ratification.md:39-43`;
`PHASES.md:182` and `:184-189`).

## Login hover-contrast exception

The approved Paper Login frame `login/login-deviations-contract.png` (`RAM:138`, nodeId `V3A-0`)
specifies the enabled-submit hover as `#FF2946` (and pressed `#C41430`); white text on that hover
measures 4.35:1, below WCAG AA 4.5:1. The conflict was resolved in favor of accessibility by
recorded human authority on 2026-08-31: a repository-local exception sets the hover to `#c41430`
(about 6:1) with a source comment, the global `--fw-red-bright` token is untouched, and independent
verification measured rendered 6.0174:1 with a fault-injection control
(`docs/phase-records/handoffs/login-paper-adoption/20260831-103000-login_paper_r01-candidate.md:13-20`
and `:78-81`; `apps/web/src/components/login/login.css:357-366`).

The hover state is open and unmapped as a route-manifest accepted case: the login entry lists
required states `idle, focus, invalid-code, too-many-attempts, unavailable, submitting`
(`RAM:87`), no login `approvedDeviationIds` exist, and the accepted login canonicals cover the idle
state only. The 2026-09-05 closure records the hover conflict as excluded from every accepted case's
depicted state and preserved as a standing exception in the terminal `login-paper-adoption` record
(`docs/phase-records/handoffs/full-route-paper-fidelity/20260905-fidelity-closure.md:20-21` and
`:97-99`; `docs/phase-records/handoffs/full-route-paper-fidelity/20260905-human-visual-approval.md:50-58`).
Composition authority is unaffected; the divergence concerns one interaction-state color value.

## Route-manifest status-name legend

The route manifest carries several status strings that are not interchangeable. Definitions:

Repository verification enforces that an `ACCEPTED` authority case may map only to a surface
whose manifest status is an active-authority value; a superseded surface cannot carry accepted
authority. While the ADR-009 supersession stands, no acceptance record and no manifest edit can
change that.

Supersession records are byte-pinned: verification re-reads every registered record and enforces
its exact byte count and SHA-256, and a `SUPERSEDED` case may cite only a registered record.
Byte/digest verification proves file identity against the pinned decision (byte count + SHA-256);
it does not prove authorship or human intent, and a matching hash is never by itself a human
decision.

The seven Owner surfaces superseded by ADR-009 are enforced at runtime as a closed exact domain
obtained from `scripts/owner-supersession-policy.mjs` (the policy root), independent of the
mutable registry evidence in `tests/browser/visual-authority-cases.mjs` and of the route
manifest. The policy root pins one enforcement-owned binding per Owner surface — exact surface
key, ADR-009 surface label, `ownerSection`, `/admin` route, Paper area, pinned canonical routed
artifacts, and the standing decision — and `validateOwnerSurfaceBindings` rejects any binding
table that is duplicated, incomplete, or drifted in surface, ADR label, section, route, area,
artifact, or decision. Verification then derives each case's authority domain from those bindings
before any status logic (`resolveCaseAuthorityIdentity`): the case's `surface`, route,
`ownerSection`, Paper area, and routed artifact are claims that must agree with the resolved
binding, and any Owner
signal — an Owner surface key, `/admin`, a registered Owner section, a supersession record, a
pinned canonical artifact, or a pinned Owner Paper area — keeps the case in the Owner domain even
when another mutable field claims `public`, `login`, or `staff`. Status is enforced inside the
resolver after identity is fixed: `SUPERSEDED` requires the standing decision and a pinned
canonical artifact of the binding, `PLANNED` requires a null routed artifact and no supersession
record, and `ACCEPTED` fails while the supersession stands. Verification requires exactly one
registered ADR-009 authority whose path, byte count, and SHA-256 match the pinned decision; its
surface set must equal the seven-surface policy set exactly (missing or extra surfaces are
reported); the registry's Paper family map and exported superseded-surface mirror must agree with
the policy table; every other registered authority may not name any policy surface; each policy
surface must exist in the manifest with a superseded status and `supersededBy` equal to the
standing decision path; no `ACCEPTED` case may exist on a policy surface; each pinned canonical
artifact must be presented by exactly one case whose normalized identity is its binding surface;
and at least one registered visual-authority case must remain on each policy surface, so deleting
a surface's cases cannot sanitize its record
(`scripts/visual-authority.mjs` `validateAuthorityRegistry` policy and normalized-identity
cross-checks, `verifyVisualAuthorityRepository`, and `verifySupersessionAuthorities`).

No revocation is currently accepted. Every non-null `revokedBy` fails closed because repository
bytes cannot authenticate a human authorization event; revocation stays disabled
(`OWNER_SUPERSESSION_SUCCESSOR_PROTOCOL.revocationEnabled` is false), and the
`SUPERSEDED_FOR_OWNER_REDESIGN` protections above cannot be retired by editing registry,
manifest, case, or caller-supplied data. A future successor decision must carry a unique decision
id, the predecessor decision path and digest, the affected surface subset, the new authority
state, a canonical decision-payload digest, and an external human-authorization proof or a
promoted digest recorded outside the repository; enabling that protocol is a reviewed code change
in `scripts/owner-supersession-policy.mjs`, not a data edit.

- `ACCEPTED_PAPER_AUTHORITY` — entry-level surface signal. Paper's accepted family governs the
  composition of the individually accepted cases; the repository governs behavior. Used at
  `RAM:35` (`public`) and `:86` (`login`). The seven Owner entries previously carried this status;
  per ADR-009 the follow-on manifest workstream re-statuses them
  `SUPERSEDED_FOR_OWNER_REDESIGN` (`:250`, `:270`, `:343`, `:392`, `:433`, `:474`, `:515`), and
  this register treats them as status 5.
- `SUPERSEDED_FOR_OWNER_REDESIGN` — entry-level surface signal applied to the seven Owner surface
  entries (`ownerSharedNavigation`, `ownerDaily`, `ownerReports`, `ownerAccountsAndSignIn`,
  `ownerActivityLog`, `ownerSystemStatus`, `ownerSettings`) by the follow-on manifest workstream.
  The surface's previous Paper composition and accepted cases are superseded as composition
  authority and retained as reference; no Owner composition authority is in force until a new
  concept is approved through the concept-selection and perceptual-promotion gates (ADR-009).
  Public and Login entry statuses remain `ACCEPTED_PAPER_AUTHORITY`; Staff remains
  `ACCEPTED_SPLIT_AUTHORITY`.
- `ACCEPTED_SPLIT_AUTHORITY` — Staff only (`RAM:144`). Paper composition authority is the
  `STAFF MONITORING PRODUCTION SET — CURRENT` area (`:140-141`, nodeId `QPD-0`); interaction
  authority is the `STAFF MONITORING PRODUCTION SET — SELF-CONTAINED AUTHORITY REPAIR CANDIDATE`
  area (`:142-143`, nodeId `146R-0`).
- `PROMOTED_ACCEPTED` — `finalReviewPackage.status` (`RAM:621`). The final independent-review
  package is promoted and accepted; it is not a surface composition status.
- `SUPERSEDED_BY_ACCEPTED_CASES` — `rejectedRoutedBaseline.status` (`RAM:562`). The hash-frozen
  rejected r05 baseline tree is superseded by the individually accepted cases; its files remain
  regression baselines only, never Paper authority (`rejectedRoutedBaseline.disposition`, `RAM:575-576`).
- Top-level `status: IN_PROGRESS` (`RAM:16`) — **the registered case map is not complete across all
  424 cases; the individually accepted cases are authoritative meanwhile.** It is not a statement
  that an accepted surface is provisional. Code contract: the global status domain is
  `IN_PROGRESS` or `ACCEPTED_CURRENT`, and `ACCEPTED_CURRENT` requires every registered case to be
   `ACCEPTED` (`scripts/visual-authority.mjs` `validateAuthorityRegistry` status domain `:170-177`
   and `ACCEPTED_CURRENT` precondition `:361-367`). Human approval scope: the
  2026-09-05 grant covers the accepted candidate and accepted-case mapping, and the closure records
  424 cases with 16 `ACCEPTED`
  (`docs/phase-records/handoffs/full-route-paper-fidelity/20260905-human-visual-approval.md:19-36`;
  `docs/phase-records/handoffs/full-route-paper-fidelity/20260905-fidelity-closure.md:29-31`).
- Area names containing `CANDIDATE` or `SUCCESSOR` (for example
  `OWNER UPTIME & INCIDENTS PRODUCTION SET — CANDIDATE` at `RAM:470` and
  `OWNER SETTINGS — FRESH r01 SUCCESSOR CANDIDATE` at `RAM:513`) are Paper provenance labels, not
  status. The entry-level `status:` field is the authority signal.

## Frozen candidate: `owner-governance-layout-recomposition-r02`

`owner-governance-layout-recomposition-r02` is terminal `NEEDS_HUMAN`; the handoff is
`docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r02.md`
(`PROJECT_STATE_HISTORY.yaml:3506`, `:3530`; r02 handoff status line at `:3`). No canonical, Paper, manifest, or
authority-hash promotion occurred (r02 handoff `:17`, `:26`; `PROJECT_STATE_HISTORY.yaml:3530` stop reason).

Human disposition (2026-09-15): **not adopted as the design to preserve; preserved as provenance;
must not constrain the redesign**; it must not be cited as acceptance authority or used to reject a
redesign for differing from it (ADR-009 decision 2; decision record "r02 disposition"). The
candidate remains frozen and immutable as a comparison reference. The coordinator archived the
terminal r02 record to `PROJECT_STATE_HISTORY.yaml:3506` on 2026-09-15; this register derives the
disposition from ADR-009 and does not itself perform ledger actions.

## Procedural caveat: the 2026-09-10 acceptance record

The human-authorization and acceptance record
`docs/phase-records/handoffs/owner-demo-polish/20260910-owner-surface-completion-visual-acceptance.md`
authorized the Owner implementation pass and its completion; the human did not perform a separate
contact-sheet inspection of the accepted frames, and the record says so itself (`:16-19`). The route
manifest repeats that fact in its promotion history (`RAM:597-608`). Under the perceptual-gate rule
now recorded in `docs/WORKFLOW.md:255-260` (acceptance must name the exact full-resolution frames
inspected and reach the reviewer before test scores or canonical comparisons), that record is
**not usable as future visual acceptance of exact pixels**. This register states the limitation
factually; it does not rewrite, invalidate, or reopen the historical record, and the diagnosis
records the same procedural finding at root cause 3
(`20260915-165423-design-agent-environment-diagnosis.md:164-170`). This caveat applies to any
future acceptance and is unaffected by the Owner composition supersession: ADR-009 changes which
artifacts govern composition, not what counts as visual acceptance.

## Maintenance

Update this register only as a derived consequence of a reviewed human decision (an ADR-007
amendment or successor, a superseding approved record, or a new acceptance record), and only
together with `PAPER_GUIDE_CONFLICT_MAP.md` where the decision changes guide-constraint status.
An edit here that is not derived from such a decision is a defect. The seven Owner surfaces return
to status 1 (`Paper composition authority`) only through a new human-approved concept and its
acceptance record — never by editing this register.
