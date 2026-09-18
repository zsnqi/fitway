# FITWAY design-agent environment repair — durable handoff and independent-audit charge

- Recorded: 2026-09-15 18:41 +03:00.
- Status: `NEEDS_HUMAN` — all agent-executable repairs from the 2026-09-15 design-agent environment
  diagnosis are implemented and verified. This record authorizes no Owner redesign, no UI change,
  no Paper or canonical change, and no authority promotion. It requests three human decisions and a
  fresh independent audit of the repaired environment.
- Run ID: `design_env_repair_r01`.
- Branch / worktree / HEAD: `codex/owner-distill-r01` /
  `C:/Users/Pc Force/.codex/worktrees/6d57/phase5-staff-integration` / `1a24a973570371949008a7a5f037c47b818c0e01`.
- Submission state: every change in this repair is uncommitted on top of the preserved dirty
  frontier. No commit was created (coordinator policy: no commits without explicit human request).
- Pre-repair dirty-frontier baseline: `docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01-pre-existing-frontier.txt`
  (raw `git status --short` listing; original capture SHA-256
  `8BCA7D43D29E51CB7BB319E843CB7DD7782375C7ABAC449E3F8E939E28DB555F`).
- Final verification fingerprint (pre/post `pnpm verify:fast`): `AD76930D67FB95DBA470DEB895D22319DF71DFBAC0EE02DB61312F02071B015C`;
  zero status drift during the run.
- Diagnosis under repair:
  `docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md`.

## 1. Purpose and scope

This repair fixes the environment that produces and evaluates FITWAY design work, not the product
UI. It addresses the diagnosis's confirmed root causes: visual authority that preserves the
incumbent topology without an explicit authority decision; the broken FITWAY-to-Impeccable context
bridge; baseline promotion without independent perceptual approval; automated checks that read as
taste; missing compositional primitives (deferred); active state overloaded with history; stale
normative records; and stale exports standing in for live Paper.

The current product UI is preserved byte-for-byte by this repair. The frozen
`owner-governance-layout-recomposition-r02` candidate frontier is untouched.

## 2. Execution summary

Five serialized single-writer workstreams plus coordinator integration, per the AGENTS.md
one-writer rule:

| Workstream | Outcome |
| --- | --- |
| WS-A | Split `PROJECT_STATE.yaml` (active frontier) from `PROJECT_STATE_HISTORY.yaml` (89 append-only terminal records); same schema validates both; verifier enforces the union. |
| WS-B | Reconciled stale normative records: Staff capacity, OpenCode route-first removal, design-authority and perceptual-acceptance rules, false polish closure. |
| WS-C | Created the design-authority package: per-surface register, Paper-vs-Guide conflict map, Owner redesign readiness decision requests, design-packet and acceptance-record templates; comment-only status legend in both manifests. |
| WS-D | Repaired the Impeccable context bridge: root `PRODUCT.md`/`DESIGN.md` routers, `.impeccable/config.json`, `pnpm check:design-context`. |
| WS-E | Documented the synthetic non-routable unit environment in the workflow; corrected the PHASES.md ledger-location sentence. |
| Integration | Coordinator review of every returned result against executed evidence, ledger milestone, this handoff, final fast ladder. |

## 3. Changes by file

### State and history separation (WS-A)
- `PROJECT_STATE.yaml` — now 2 active records only: `design-agent-environment-repair-r01`
  (this repair) and the preserved `owner-governance-layout-recomposition-r02`.
- `PROJECT_STATE_HISTORY.yaml` (new) — 89 terminal records moved verbatim, original order.
- `docs/schemas/project-state.schema.json` — root `oneOf` variants `activeState` / `historyState`
  sharing the unchanged `$defs.milestone`.
- `scripts/verify-repository.mjs` — validates both files, union dependency graph, duplicate-id
  rejection, terminal-only history, baseline cross-check over the union, new count output.
- `scripts/verify-repository.schema.test.ts` (new) — 6 Vitest cases for the contract.

### Normative workflow records (WS-B, WS-E)
- `AGENTS.md` — lint-vs-taste and frame-inspection acceptance rule; Impeccable as the single broad
  design skill through the FITWAY bridge; `pnpm check:design-context` in verification essentials;
  authority register/conflict map in the router; active-vs-history source-of-truth order.
- `docs/WORKFLOW.md` — new "Active ledger and closed history"; new "Design work: authority,
  concepts, and perceptual gates" (entry, per-surface authority, Paper availability/freshness,
  concept-before-code, perceptual promotion gate, automated checks are lint, active design packet);
  consolidated "Standing review duties"; the obsolete route-first OpenCode requirement replaced by
  native delegation with the 2026-08-21 authorizations as historical provenance only; synthetic
  unit environment documented in worktree preparation and the verification ladder.
- `PHASES.md` — closed-history location in the status block; Phase 4 Staff capacity coordination
  note recording the 2026-08-09 human supersession.
- `DESIGN_GUIDE.md` — per-surface authority pointer; authority-aware replacement of the
  "do not restart a redesign" sentence (topology change requires a recorded authority decision plus
  the concept gate); `VIS-004` pointer; new perceptual-acceptance paragraph.
- `docs/POLISH_BACKLOG.md` — `VIS-004` reopened with later Owner evidence.

### Design-authority package (WS-C, all new, all derived views or templates)
- `docs/design/VISUAL_AUTHORITY_STATUS.md` — ten surfaces, all still status 1
  (`Paper composition authority`); three carry `DECISION REQUIRED` (Reports, Activity Log,
  Settings); manifest status-name legend; frozen-r02 record; 2026-09-10 procedural caveat.
- `docs/design/PAPER_GUIDE_CONFLICT_MAP.md` — fulfills the `paper-design-phase-closeout.md:82`
  open item; honest `NOT YET DETERMINED — requires live Paper` rows; composition-quality
  exceptions separated from guide conflicts.
- `docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md` — three decision requests, a
  `DRAFT — NO AUTHORITY` scoped ADR-007 amendment, deferred composition primitives, explicit freeze.
- `docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md`, `docs/design/VISUAL_ACCEPTANCE_RECORD_TEMPLATE.md`
  — the workflow's operative templates.

### Impeccable bridge (WS-D)
- `PRODUCT.md`, `DESIGN.md` (new, repo root) — pointer-only routers, schema-stamped, authority-neutral.
- `.impeccable/config.json` (new) — `{ "buildPath": "code" }`; the coordinator removed the
  redundant `projectRoots` after proving it produced a spurious
  `config-project-roots-match-nothing` finding when Doctor ran from a workspace target.
- `scripts/check-design-context.mjs` (new) and the `package.json` script `check:design-context` —
  engine resolution, bridge resolution at repo root and `apps/web`, Doctor findings printed,
  non-zero exit when the bridge does not resolve.
- `.gitignore` — `.impeccable/*` ignored except `.impeccable/config.json`.

### Manifest clarifications (WS-C, comments only)
- `visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml` and
  `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` — comment blocks defining top-level
  `IN_PROGRESS` and the `CANDIDATE`/`SUCCESSOR` provenance naming. No key or value changed.

## 4. Verification evidence

Environment: this worktree had no `apps/server/.env`. The coordinator copied the ignored file from
`D:/Projects/fitway/apps/server/.env` (untracked, ignored, never printed) and exported the
documented synthetic non-routable unit environment for every fast-ladder run (values are now
recorded in `docs/WORKFLOW.md` step 8; non-secret placeholders only).

| Command | Result |
| --- | --- |
| `pnpm verify:fast` before repair provisioning | Failed only in `apps/server/src/cron.test.ts` and `reference-gating.test.ts` on missing process env; no tracked status drift — this identified the environment-provisioning gap now documented. |
| `pnpm verify:fast` after provisioning, before repairs | Passed: 90 milestones, 546 files Biome, 669/669 unit, 120/120 simulator, mutation guard. |
| `pnpm check:repository` after the split | Passed: 1 active, 89 archived, 8 canonical approval screenshots, 424 authority cases, 228 hash-verified exports, 41 rejected screenshots. |
| `pnpm exec vitest run scripts/verify-repository.schema.test.ts` | 6/6 passed. |
| `pnpm check:design-context` | Passed at repo root and `apps/web`; engine 4.0.0; Doctor root reports one `mention` (`workspace-context-inherited`, intended inheritance); Doctor from `apps/web` clean after the config correction. |
| `scripts/check-design-context.mjs` negative path | Temp-fixture engine returning null paths produced exit 1 with explicit failures; no repo file used. |
| `pnpm verify:fast` final (with the ledger milestone in place) | Passed: 2 active / 89 archived, 549 files Biome, 8 type projects, 675/675 unit, 120/120 simulator, "Verification fast passed without repository mutation." |
| `git status --short` before/after the final run | Identical; fingerprint `AD76930D…`, zero drift. |
| `git diff --check` | Clean. |
| Pre/post status comparison across the whole repair | Exactly the expected additions (Section 8), zero pre-existing entries removed. |

Workstream evidence notes: WS-A probed the new verifier rules (duplicate id, open status in
history, cross-file dependency, baseline mismatch) against backed-up/restored copies; WS-D
reproduced the negative bridge path with an out-of-repo fixture. These probes are reported by the
implementing workstreams; the independent audit must re-probe from a scratch copy before treating
the negative paths as verified.

## 5. Diagnosis coverage

| Diagnosis item | Disposition |
| --- | --- |
| Root cause 1 — authority preserves incumbent topology | Per-surface register created; three Owner surfaces flagged `DECISION REQUIRED`; scoped ADR-007 amendment drafted with no authority; no status changed by agents. |
| Root cause 2 — Impeccable cannot discover FITWAY authority | Bridge adapters + config + `check:design-context`; Doctor false-clean replaced by an explicit resolution gate; false-clean limitation documented in WORKFLOW. |
| Root cause 3 — promotion without independent perceptual approval | WORKFLOW/AGENTS/DESIGN_GUIDE perceptual-promotion rule; acceptance-record template; 2026-09-10 record marked not usable as future pixel acceptance. |
| Root cause 4 — automated verification measures conformance, not composition | "Lint, not taste" rule in all three normative documents; concept gate precedes production code; perceptual gate precedes promotion. |
| Root cause 5 — no compositional primitives | Deferred by design (UI must not change); recorded as a post-decision workstream in the readiness doc with `owner-layout.css` as evidence only. |
| Root cause 6 — active state overloaded with history; stale records | Ledger split + verifier/schema/test; Staff capacity reconciled; route-first requirement removed; VIS-004 reopened; manifest naming legend. |
| Root cause 7 — stale exports may replace live Paper | WORKFLOW Paper availability/freshness rule; conflict-map rows marked `NOT YET DETERMINED — requires live Paper`. |
| Required change 1 — resolve the r02 candidate | Not resolvable by agents; recorded as human decision request #1. The candidate is preserved. |
| Required change 2 — per-surface authority | Register created with as-is statuses; decision request #2 recorded. |
| Required changes 3–10 | Addressed as described above; item 9 deliberately deferred. |

## 6. What was explicitly not changed

- All product UI source: `apps/**`, `packages/**`, `tests/**`, i18n, routes, hooks, CSS, fixtures.
- The preserved Owner/Staff dirty frontier (see the companion pre-repair listing), including
  `owner-layout.css`, all Owner/Staff work, PNG evidence artifacts, `plans/`, and `audit/`.
- `FITWAY_PRODUCT.md`, `SPEC.md`, ADRs, migrations, OpenAPI/DTOs, auth, analytics, CSV behavior.
- Paper exports, canonical screenshots, authority hashes, and all manifest keys/values
  (comments only were added).
- No commit, no push, no deployment, no release, no credential handling beyond copying the ignored
  local `.env` into this worktree (contents never printed or recorded).

## 7. Residual human decisions (unblock conditions)

Recorded with options and evidence in `docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md`:

1. `owner-governance-layout-recomposition-r02` disposition: accept for later canonical
   reconciliation, reject with exact visual concerns, or archive as exploration.
2. Per-Owner-surface visual authority status: keep `Paper composition authority` or move one or
   more surfaces to status 2/3/4.
3. Approve or decline the scoped ADR-007 amendment enabling Owner composition redesign; the draft
   has no authority until approved.

No Owner composition redesign may begin until these decisions are recorded and the independent
audit below passes.

## 8. Repair additions vs the pre-repair frontier

Added by this repair (nothing else changed; zero pre-existing entries removed):

```
 M .gitignore
 M AGENTS.md
 M DESIGN_GUIDE.md
 M PHASES.md
 M docs/POLISH_BACKLOG.md
 M docs/WORKFLOW.md
 M docs/schemas/project-state.schema.json
 M scripts/verify-repository.mjs
 M visual-direction-gate/approved/APPROVAL_MANIFEST.yaml
 M visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml
?? DESIGN.md
?? PRODUCT.md
?? PROJECT_STATE_HISTORY.yaml
?? docs/design/
?? scripts/check-design-context.mjs
?? scripts/verify-repository.schema.test.ts
```

(`PROJECT_STATE.yaml` and `package.json` were already modified in the pre-repair frontier and were
edited in place; `.impeccable/` was already untracked.)

## 9. Independent audit charge (next session)

A fresh session that did not perform this repair must audit the repaired environment read-only
before any Owner redesign begins. The audit must not repair; it returns `PASS` or
`FAILED_VALIDATION` with file:line evidence by severity.

Required audit steps:

1. Confirm the submission boundary: the repaired state is uncommitted and exists only in this
   worktree. Audit in place; do not commit, clean, revert, or regenerate anything.
2. Reconstruct the change set: compare `git status --short` against the companion pre-repair
   listing; verify the only additions are Section 8's list and that nothing was removed.
3. Inspect every repair diff and new file against the diagnosis: state split, verifier logic,
   normative wording, register/conflict-map/readiness facts, bridge adapters, check script,
   manifest comments. Verify no product UI, package, test, Paper, canonical, or hash change is
   attributable to this repair.
4. Re-probe the new negative paths from a scratch copy of the worktree (outside the repo): history
   file with an open status must fail; duplicate id must fail; an unknown union dependency must
   fail; baseline commit mismatch must fail; a broken bridge context must make
   `check:design-context` exit non-zero.
5. Re-run the ladder with the documented unit environment: `pnpm exec vitest --version`;
   `pnpm check:repository`; `impeccable doctor --json` from root and `apps/web`;
   `pnpm check:design-context`; `pnpm verify:fast`. A passing run must leave `git status --short`
   unchanged.
6. Spot-check at least five factual claims in `docs/design/VISUAL_AUTHORITY_STATUS.md` and
   `docs/design/PAPER_GUIDE_CONFLICT_MAP.md` against their cited sources, including that no
   surface status was changed and that the 2026-08-09 Staff capacity decision is quoted correctly.
7. Verify every diagnosis item maps to the disposition table in Section 5, and that the deferred
   items are explicitly deferred rather than silently dropped.
8. Record the audit as a new independent record under `docs/phase-records/handoffs/coordinator/`
   with exact commands, observed results, and findings. Do not edit this handoff or any repaired
   file.

Environment note for the auditor: `pnpm verify:fast` requires the ignored `apps/server/.env` plus
the process-local synthetic non-routable values documented in `docs/WORKFLOW.md` step 8. Missing
those values produces two environment-dependent server test failures, not a candidate defect.

## 10. Stop and escalation conditions

- Any UI, Paper, canonical, or authority-hash drift attributable to this repair → hard stop.
- Any repair claim not reproducible from executed evidence → `FAILED_VALIDATION` for the audit,
  and a successor repair milestone may open only under the WORKFLOW successor rule.
- The audit's PASS authorizes only the beginning of a concept-selection phase after the three
  human decisions are recorded; it does not authorize implementation.

## Update 2026-09-15 19:40 — human decision recorded and reconciled

The three human decisions requested in §7 were recorded on 2026-09-15
(`docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`):
the current Owner visual composition is not approved as the design to preserve; the previous Owner
composition authority, canonicals, accepted-case mappings, and the frozen r02 candidate are
superseded to provenance and comparison reference only (ADR-009); Public, Login, and Staff
authority and all non-visual contracts remain unchanged.

The reconciliation is complete. The `design-agent-environment-repair-r01` and
`owner-governance-layout-recomposition-r02` terminal records are archived to
`PROJECT_STATE_HISTORY.yaml`, the active ledger holds only
`owner-visual-authority-supersession-r01`, and the environment now awaits the fresh independent
audit charged in
`docs/phase-records/handoffs/coordinator/20260915-194000-owner-visual-authority-supersession-r01.md`,
whose audit charge replaces §7 and §9 of this record. This update changes no earlier statement,
which remains accurate as of its recording time.
