# FITWAY Owner visual-authority supersession — durable handoff and independent-audit charge

- Recorded: 2026-09-15 19:40 +03:00.
- Status: `NEEDS_HUMAN` — the 2026-09-15 human Owner visual-authority decision is recorded and fully
  reconciled. No UI redesign, no code change, no Paper or canonical change, and no authority
  promotion is authorized by this record. The remaining gate is the fresh independent audit.
- Run ID: `owner_visual_authority_supersession_r01`.
- Branch / worktree / HEAD: `codex/owner-distill-r01` /
  `C:/Users/Pc Force/.codex/worktrees/6d57/phase5-staff-integration` / `1a24a973570371949008a7a5f037c47b818c0e01`.
- Submission state: uncommitted on the preserved dirty frontier. No commit was created.
- Final verification fingerprint (pre/post `pnpm verify:fast`): `5F2A028C78CDD8FD727C20C4DCCF81ECC34224D35B7EBA369BF761C8E48CF042`;
  zero status drift during the run.
- Predecessor records (archived to `PROJECT_STATE_HISTORY.yaml`):
  `design-agent-environment-repair-r01` and `owner-governance-layout-recomposition-r02`.
  The repair handoff's §7 and §9 decision status is replaced by this record; its §9 audit charge
  remains in scope and is extended below.

## 1. The human decision

On 2026-09-15 the human decision-maker stated in session that the current Owner visual composition
is not approved as the design to preserve; the existing r02 candidate and the older Owner
visual/canonical composition must not constrain the upcoming Owner redesign; historical artifacts
remain provenance/reference only and must be removed or superseded from active visual authority;
product behavior, data semantics, privacy/security, accessibility, and explicitly approved
non-visual contracts are preserved; Public and Staff remain outside the redesign unless evidence
requires otherwise; records must be reconciled without redesigning the UI yet.

Binding records:

- `docs/adr/ADR-009-owner-composition-authority-supersession.md` — Accepted by human decision,
  2026-09-15. Supersedes ADR-007 in part, limited to Owner composition authority.
- `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`
  — the durable human-decision record; ADR-009 governs where any derived view disagrees.

Owner surfaces covered: `owner-shared-navigation`, `owner-daily`, `owner-reports`, `owner-access`,
`owner-activity-log`, `owner-system-status`, `owner-settings`. Public, Login, and Staff authority is
unchanged; Login is not an Owner surface.

## 2. What this reconciliation changed

| Area | Change |
| --- | --- |
| Binding records | ADR-009 created; `docs/adr/README.md` gained the ADR-009 row; the human-decision record created. |
| Authority register | `docs/design/VISUAL_AUTHORITY_STATUS.md`: the seven Owner surfaces now carry the fifth status "Owner composition redesign authorized — composition authority vacant; prior composition and canonicals reference-only (ADR-009)"; `DECISION REQUIRED` flags removed; the r02 disposition records not-adopted/provenance-only; the manifest legend defines `SUPERSEDED_FOR_OWNER_REDESIGN`. |
| Conflict map | `docs/design/PAPER_GUIDE_CONFLICT_MAP.md`: Owner composition rows are `SUPERSEDED BY HUMAN DECISION (ADR-009)`; guide system rules stay binding; quality exceptions become concept-selection inputs, not authority conflicts. |
| Readiness package | `docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md`: the three decision requests are DECIDED; the draft amendment is superseded by ADR-009; next sequence is audit → concept selection; composition primitives stay deferred; the redesign must start from a clean owned frontier. |
| Templates | `docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md` and `docs/design/VISUAL_ACCEPTANCE_RECORD_TEMPLATE.md`: stale anchors refreshed; the packet now references the five-status vocabulary. |
| Polish backlog | `docs/POLISH_BACKLOG.md` `VIS-004`: remains open, subsumed into the authorized redesign scope. |
| Normative pointers | `AGENTS.md` item 4, `DESIGN_GUIDE.md` header and §1, and `docs/WORKFLOW.md` design-work item 2 now record the ADR-009 exception. |
| Route manifest | `visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml`: the seven Owner surface entries are `status: SUPERSEDED_FOR_OWNER_REDESIGN` with `supersededBy` and `referenceStatus: provenance-and-comparison-only`; Public/Login/Staff entries and the global `IN_PROGRESS` status are byte-unchanged; top status-note comment updated. |
| Approval manifest | `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`: comment-only note that Owner composition authority is superseded by ADR-009. |
| Authority registry | `tests/browser/visual-authority-cases.mjs`: the eight accepted Owner canonical overrides become `SUPERSEDED` carrying `supersessionRecord: docs/adr/ADR-009-...`; the two Login and six Staff accepted cases remain `ACCEPTED`. |
| Tooling | `scripts/visual-authority.mjs`: `SUPERSEDED` status support (requires a byte-verified supersession record and a routed artifact for provenance mapping; skips acceptance-only checks; keeps the canonical-mapping and duplicate-path invariants); `ACCEPTED_CURRENT` stays strict; return counts added. `scripts/verify-repository.mjs`: summary line now reports the accepted/superseded breakdown. |
| Tests | `scripts/visual-authority.test.ts`: four new superseded-contract tests (valid superseded case, missing/empty supersession record rejects, `ACCEPTED_CURRENT` with a superseded case rejects, duplicate artifact assignment rejects). |
| Anchors | Every line-number citation in the design docs was re-verified against the current files after the manifest/registry shifts; template anchors and ledger anchors for the archived r02 record were corrected. |

## 3. Verification evidence

| Command | Result |
| --- | --- |
| `pnpm check:repository` (after the ledger move and before the final fast run) | `Repository invariants passed: 1 active milestones, 91 archived milestones, 8 canonical approval screenshots, 424 registered full-route visual-authority cases (8 accepted, 8 superseded), 228 hash-verified Paper exports, and 41 hash-frozen rejected r05 screenshots.` |
| `pnpm exec vitest run scripts/visual-authority.test.ts scripts/verify-repository.schema.test.ts` | Passed; the two files contribute the schema and supersession contract tests. |
| `pnpm exec biome check` on the changed code/registry/manifest-adjacent files | Clean. |
| `pnpm check:design-context` (repair round, unchanged) | Passed at repo root and `apps/web`; engine 4.0.0. |
| `pnpm verify:fast` final (synthetic unit environment per `docs/WORKFLOW.md` step 8) | Passed: repository invariants, Biome 549 files, Owner token/spacing/class guards, 8 type projects, 679/679 unit tests, 120/120 simulator tests, "Verification fast passed without repository mutation." |
| `git status --short` before/after the final run | Identical; fingerprint `5F2A028C…`, zero drift. |
| `git diff --check` | Clean. |

## 4. Explicit non-changes

- No product UI source, CSS, i18n, route, hook, component, fixture, or Playwright spec changed.
- No Paper export file, canonical screenshot byte, approval hash, deviation evidence, or
  rejected-r05 inventory changed. Paper exports remain hash-verified for every surface.
- Public, Login, and Staff manifest entries and accepted cases are unchanged.
- `FITWAY_PRODUCT.md`, `SPEC.md`, ADRs other than the new ADR-009, migrations, API/DTO/auth/
  analytics/CSV behavior, demo data, credentials, deployment, and releases are unchanged.
- The preserved Owner/Staff dirty frontier remains byte-identical except for the files listed in
  Section 2; the pre-repair frontier baseline is the companion listing referenced by the repair
  handoff.
- The frozen r02 candidate remains on disk and unmodified as provenance.

## 5. Ledger state

- `PROJECT_STATE.yaml` (active): only `owner-visual-authority-supersession-r01`, terminal
  `NEEDS_HUMAN` with `independentReview: PENDING`.
- `PROJECT_STATE_HISTORY.yaml` (closed, append-only): 91 terminal records, including
  `design-agent-environment-repair-r01`, `owner-governance-layout-recomposition-r02` (at :3506,
  stop reason at :3530), and the prior 89.
- Repository verification validates the active file and the closed history as one dependency graph.

## 6. Independent audit charge (next session)

A fresh session that did not perform the repair or this reconciliation must audit read-only before
any Owner concept selection or redesign begins. The audit must not repair; it returns `PASS` or
`FAILED_VALIDATION` with file:line evidence by severity.

The repair handoff §9 audit steps remain in scope (state/history split, verifier, bridge,
normative records) and are extended by:

1. **Submission boundary.** Audit in place; do not commit, revert, clean, or regenerate. Compare
   `git status --short` against the pre-repair frontier listing and the repair handoff §8; the only
   additions should be the repair set plus this round's set (Section 2 paths).
2. **Decision fidelity.** Verify the decision record states the human instruction faithfully and
   that ADR-009's "What remains binding" preserves behavior, data semantics, privacy/security,
   accessibility, and non-visual contracts. Verify no record claims human visual approval of any
   new design; there is none.
3. **Machine layer.** Confirm the seven Owner manifest entries are `SUPERSEDED_FOR_OWNER_REDESIGN`
   with `supersededBy`/`referenceStatus`, Public/Login/Staff entries and the global status are
   unchanged, the eight Owner cases are `SUPERSEDED` with ADR-009 as a byte-verified supersession
   record, and the canonical-mapping invariant still passes. From a scratch copy outside the repo,
   re-probe: a superseded case without a supersession record fails; an `ACCEPTED` case duplicating a
   superseded artifact path fails; `ACCEPTED_CURRENT` with any superseded case fails.
4. **Documentation.** Confirm the register's Owner rows carry the fifth status and no
   `DECISION REQUIRED` flags, the conflict map marks Owner composition rows superseded, the
   readiness package records the decisions and the audit-to-concept sequence, and no document
   claims the redesign is approved or started. Re-run the anchor resolver over the design docs and
   confirm every `:NNN` citation resolves to its claimed token.
5. **Ladder.** Provision the documented unit environment, then run `pnpm exec vitest --version`,
   `pnpm check:repository`, `impeccable doctor --json` (root and `apps/web`),
   `pnpm check:design-context`, and `pnpm verify:fast`; a passing run must leave
   `git status --short` unchanged.
6. **Hash boundary.** Confirm `git diff` shows no change to
   `tests/browser/__screenshots__/**`, no change to `leafExports`/`successorLeaves` records or
   hashes, and no change to the rejected-r05 inventory.
7. **Product boundary.** Confirm no diff in `apps/**` or `packages/**` is attributable to either
   repair round, and that the Owner/Staff dirty frontier is unchanged from the pre-repair listing
   other than the documented additions.

Record the audit under `docs/phase-records/handoffs/coordinator/` with commands, observed results,
and findings. Do not edit this handoff or any reconciled file.

## 7. After a passing audit

Concept selection may then begin for the Owner redesign: two or three whole-page alternatives
judged by the concept gate in `docs/WORKFLOW.md`, using the active design packet and the
Impeccable bridge. Canonical promotion remains a separate serialized human-approved action, and
this record authorizes no implementation.

## 8. Stop and escalation conditions

- Any UI, Paper, canonical, approval-hash, or Public/Login/Staff authority drift attributable to
  this reconciliation → hard stop.
- Any decision-fidelity gap between the human record and ADR-009 → `FAILED_VALIDATION`; a
  successor may open only under the WORKFLOW successor rule.
- The audit's `PASS` authorizes only concept selection, never implementation or promotion.

## Update 2026-09-15 22:20 — first independent audit returned FAIL; remediation successor

The fresh independent audit of this record's environment returned FAIL with four blockers: (1) the
authority registry did not couple an accepted case to its manifest surface status, so a superseded
Owner surface could silently regain accepted authority; (2) `docs/WORKFLOW.md` still required Paper
comparison unconditionally for superseded Owner surfaces; (3) active-ledger and closed-history
schema enforcement was not genuinely distinct, and `PHASES.md` and `SPEC.md` still located archived
records in `PROJECT_STATE.yaml`; (4) the dirty-frontier/UI-preservation evidence was not
independently reproducible, and this record's focused-test count was wrong (claimed 30/30; the
executed evidence was 24/24 — 18 visual-authority plus 6 schema).

The human-decision reconciliation itself stands; ADR-009 remains binding, and the audit found no
product UI, Paper, canonical, or authority-hash change. This record is now terminal
`FAILED_VALIDATION` and is archived to `PROJECT_STATE_HISTORY.yaml`. All four blockers are resolved
by the successor `design-environment-audit-remediation-r01`; its handoff
(`docs/phase-records/handoffs/coordinator/20260915-222500-design-environment-audit-remediation-r01.md`)
carries the corrected counts, the anchor refresh performed in this round, and the second-audit
charge, which replaces §6 of this record.
