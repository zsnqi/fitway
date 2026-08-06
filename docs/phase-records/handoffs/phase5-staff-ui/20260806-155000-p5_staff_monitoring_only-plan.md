# phase5-staff-ui — monitoring-only reconciliation plan

- Status: `NEEDS_HUMAN` resolved; plan only, nothing implemented
- Date: 2026-08-06
- Branch / worktree: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry`
- Supersedes for planning purposes:
  [the human visual verdict](20260727-230622-p5_staff_b03_retry-human-visual-verdict.md)
- Related: [closeout record](../../paper-design-phase-closeout.md),
  [ADR-007](../../../adr/ADR-007-paper-visual-source-of-truth.md)

## Product decision

`/staff` is **monitoring-only**. The approved Paper family
`STAFF MONITORING PRODUCTION SET — CURRENT` is complete for the intended scope; its omission of
command controls is deliberate. There must be no staff-facing command centre, reset control,
reset confirmation dialog, or other staff-triggered operational command UI.

The command **system** is not cancelled. Backend, edge, scheduled, recovery, and internal command
infrastructure stay wherever an existing behavioral contract or a later phase still needs them.

This closes open question 4 in the closeout record. It is a locked-Spec change, so it is a
product decision the repository must now absorb — not a cleanup.

## The finding that shapes everything

**The staff command UI was never merged.** Verified with `git cat-file -e main:<path>`:

| Path | On `main` |
| --- | --- |
| `apps/web/src/components/staff/commands/staff-commands-panel.tsx` | no — branch only |
| `apps/web/src/hooks/use-staff-commands.ts` | no — branch only |
| `tests/browser/phase5-staff-ui.browser.spec.ts` | no — branch only |
| `packages/api/src/commands/recent-commands.ts` | no — branch only |
| `apps/server/src/command-repository.ts` | **yes** |
| `staff.issueCorrection`, `staff.issueReset` in `appRouter` | **yes** |

`main`'s `/staff` route imports no command component. So there is nothing to retire from the
integrated product at the UI layer. The task is to **not merge** five implementation commits, to
decide the fate of two already-integrated oRPC procedures, and to bring the normative documents
into line.

## Bucket 1 — staff-facing command UI to exclude

All branch-only, all on `work/phase5-staff-ui-b03-retry`, none on `main`. Excluded by not
merging; nothing is deleted from `main` because nothing is there.

- `apps/web/src/components/staff/commands/staff-commands-panel.tsx` (530 lines)
- `apps/web/src/components/staff/commands/commands.css` (461 lines; owns `.command-page-layout`)
- `apps/web/src/components/staff/commands/messages.ts`
- `apps/web/src/components/staff/commands/validation.ts`, `validation.test.ts`
- `apps/web/src/hooks/use-staff-commands.ts`, `use-staff-commands.test.tsx`
- `tests/browser/phase5-staff-ui.browser.spec.ts` — all seven scenarios exercise the command
  surface, including the reset confirmation dialog
- `apps/web/src/routes/staff.tsx` lines 4, 56, 58–66 — the import, the `command-page-layout`
  wrapper, and the panel mount

## Bucket 2 — shared and internal command infrastructure that stays

Integrated, `phase5-command-domain` is `DONE`, and each is required by a live contract or a
later phase. Do not touch.

- `packages/api/src/commands/{queue,schemas,service}.ts` and their tests — `CommandService`
  is the issuance seam Phase 7's scheduled reset needs
- `packages/api/src/edge-push.ts`, `apps/server/src/edge-push.ts` — command delivery and
  acknowledgement
- `apps/server/src/command-repository.ts`, `apps/server/src/audit-repository.ts`
- `packages/db` `edge_commands` schema and migration `0005` — never re-generate
- `edge/simulator.py`, `edge/fixtures/{push,acknowledgement}.json`
- `packages/api/src/occupancy/engine.ts` command application
- ADR-003's command lifecycle: durable, monotonic, auditable, supersession, apply-before-live
  on reconnect

`SPEC.md:349` already models `system` as the issuer for scheduled resets, and `SPEC.md:518-519`
and `571` put the daily zero-reset on the internal cron endpoint (`CRON_SECRET`), not on any
staff procedure. The scheduled path therefore never depended on the staff UI.

## Bucket 3 — the one consequential decision: `staff.issueCorrection` and `staff.issueReset`

These are **on `main`**, integrated under a `DONE` milestone, and
`staffProcedure = publicProcedure.use(requireAuth)` — reachable by any authenticated principal,
staff or owner. With no UI they become an authenticated mutation capability with no product
caller. That is a security-surface question, not tidiness.

Verified: nothing else calls them. `CommandService.issueCorrection`/`issueReset` (the service,
bucket 2) is the seam the cron will use; the oRPC leaves are a UI transport only.

| Option | Effect | Cost |
| --- | --- | --- |
| **A. Retire both leaves** | Removes the only staff-triggered command capability from the running product. `CommandService` untouched. | Contract change to a `DONE` milestone: `packages/api/src/routers/index.ts`, `commands/router.test.ts`, `phase5-command-domain.integration.test.ts`, and the Phase 5 acceptance line |
| **B. Keep, restrict to owner** | Retains an emergency correction path behind `ownerProcedure`. | Still contradicts "no staff-triggered command UI" only partially — it is an owner capability with no surface, and `FITWAY_PRODUCT.md:14` gives the owner staff operations |
| **C. Keep as-is** | No code change now. | Leaves an authenticated, unreachable mutation endpoint indefinitely; the audit model still labels it a human action |

**Recommended: A.** It is the only option that makes the running product match the decision. B
preserves an undesigned capability that no approved Paper family exposes, and would need its own
product decision. C is the status quo the decision exists to end. If Hussein wants an emergency
correction path, that is a new, designed surface — not a leftover endpoint.

**A needs Hussein's explicit confirmation before the slice starts.** It changes an integrated
contract.

## Bucket 4 — normative documents that now misdescribe the product

Each must change; none may change alone.

- `FITWAY_PRODUCT.md:14` — staff row: "correct, directly set, or reset the count when needed"
- `SPEC.md` — the product-summary staff bullet; stories **12, 13, 14, 17**; the acceptance
  criterion "Staff view provides live count + health, stepper correction, direct count entry,
  and confirmed reset"; the **Correction propagation** timing criterion, which measures a staff
  correction reaching the public payload; story **33**'s "so that staff corrections reach my
  local counter" wording
- `PHASES.md` Phase 5 acceptance — "pending/applied/superseded UI"
- `DESIGN_GUIDE.md` §2 ("actions placed near their consequences, and destructive actions
  deliberately separated") and §11:229 ("A staff correction shows pending/application state. A
  reset requires a confirmation dialog.")
- `docs/adr/ADR-003-edge-authority-and-reconciliation.md:23-25` — the staff manual fallback
  clause

### Phase 6 is the largest downstream consequence

`PHASES.md` Phase 6 delivers "staff manual fallback with its own validity window", and
ADR-003:23-25 records it as a **decision**: when the edge is unavailable, explicit staff manual
fallback may temporarily set current state with `source=manual` while creating the command the
edge later applies. Monitoring-only removes the staff trigger for that path, so Phase 6's scope
shrinks materially. `SPEC.md` also asserts "Manual fallback works when the edge is offline and
reconciles on reconnect."

Consequently `operationalSnapshotSchema.source: z.enum(["edge","manual"]).nullable()`
(`packages/api/src/health/snapshot.ts`, `.strict()`) may lose its reachable `manual` value.
**Do not touch that enum in this slice.** It is a frozen contract the staff lease explicitly
excludes, and the monitoring view rendering `manual` is harmless. It is a Phase 6 question.

Whether Phase 6 keeps a non-staff fallback, or drops fallback entirely, is a **separate product
decision** and is not settled by this handoff.

## Bucket 5 — monitoring and login work to salvage

Commit `6cc6d6a` answered the recorded human visual verdict. Most of it is monitoring and login
work that survives the decision and should reach `main`.

Carries forward:

- `apps/web/src/components/staff/staff.css` — zero `command` selectors; the diff is login
  watermark pinning, the login skip-link fix, card lighting, and monitoring layout. Imported by
  `staff-shell.tsx` and `login.tsx`.
- `apps/web/src/components/staff/operational-snapshot-view.tsx` — drops the decorative
  `HeartPulse`, the `schemaVersion` row, and the always-"now" computed line
- `apps/web/src/components/staff/messages.ts` — the matching type removals
- `apps/web/src/i18n/messages/{ar,en}.ts` — login copy, `جهاز العد` terminology, and the removed
  `computed`/`schemaVersion` keys

**Must be changed again:** `staff.description` in both catalogs now reads "Occupancy, device
health, and count controls in one view." / "الإشغال وحالة الجهاز وأدوات ضبط العدد في عرض واحد."
That is the one place the monitoring surface advertises commands. Revert to monitoring-only
wording; the pre-`6cc6d6a` string was already correct.

This also settles most of the decision-8 question about the five files outside `ownedPaths`
(`staff/messages.ts`, `operational-snapshot-view.tsx`, `staff.css`, `i18n/messages/ar.ts`,
`i18n/messages/en.ts`): four of the five are named in `forbiddenPaths`, but their content is
monitoring and login work that is still wanted. They need a lease, not reversal.

## Proposed next slice

**Outcome:** `/staff` is monitoring-only in code and in every normative document, Phase 5 can
close, and the command system remains intact for Phases 6, 7, and 12.

Smallest safe shape — one slice, three ordered commits, no UI implementation:

1. **Coordinator activation.** Redefine `phase5-staff-ui` in `PROJECT_STATE.yaml`: scope becomes
   "retire the staff command surface and align `/staff` with the approved Paper monitoring
   family", new `ownedPaths`, fresh lease, `handoff` repointed at this file. The milestone cannot
   be deleted — `phase-5` depends on it, and the schema has no cancelled state.
2. **Product and authority.** Write **ADR-008** (monitoring-only `/staff`) **together with** the
   `FITWAY_PRODUCT.md`, `SPEC.md`, `PHASES.md`, `DESIGN_GUIDE.md`, and `ADR-003` amendments in
   bucket 4, in one commit. Writing ADR-008 alone would recreate exactly the split-authority
   state the 2026-08-06 reconciliation removed — an ADR saying one thing while `SPEC.md` story 14
   says another. This is why this handoff, not an ADR, carries the decision across the session
   boundary.
3. **Code.** Option A if confirmed: remove the two oRPC leaves and their tests. Land the bucket-5
   salvage with the `staff.description` correction. Leave `staff.tsx` as monitoring-only.

**Do not** merge the command UI, redesign the Staff Monitoring family, touch Paper, regenerate
migration `0005`, change the operational-snapshot schema, or delete the branch.

### Coordinator-owned files requiring a lease

- `PROJECT_STATE.yaml` — coordinator-only; step 1
- `FITWAY_PRODUCT.md`, `SPEC.md`, `PHASES.md` — normative; a locked-product change, so
  human-approved
- `DESIGN_GUIDE.md`, `docs/adr/**` — visual contract and decision records
- `packages/api/src/routers/index.ts`, `packages/api/src/commands/router.test.ts`,
  `apps/server/src/phase5-command-domain.integration.test.ts` — belong to the `DONE`
  `phase5-command-domain` milestone; option A needs an explicit shared lease
- `apps/web/src/i18n/messages/**`, `apps/web/src/components/staff/{staff.css,messages.ts}`,
  `operational-snapshot-view.tsx` — shared catalogs and shell styles; explicit lease

### Validation

- `pnpm check:repository`
- `pnpm verify:fast` — **currently red** on a pre-existing blocker:
  `apps/server/src/command-repository.test.ts` imports `packages/db` at module scope, so
  `packages/env` throws without `DATABASE_URL`. Passes under `SKIP_ENV_VALIDATION=1`. Fix this
  first; `verify:fast` cannot be a gate until it is green.
- `pnpm verify:phase --phase phase5-staff-ui` — the profile registers no `integrationFiles`, so
  `apps/server/src/phase5-staff-recent-commands.integration.test.ts` never runs. If
  `staff.recentCommands` is excluded with the UI, delete the profile gap question with it;
  otherwise register the file.
- `pnpm verify:full` before integration, plus a fresh independent verifier.
- Prove `/staff` still renders monitoring correctly in Arabic RTL and English LTR across the
  canonical widths after the salvage lands.

### Rollback boundary

The command UI is unmerged, so the rollback boundary is simply **do not merge the five
implementation commits** `06454f9`, `36aa857`, `67feb96`, `9ebbf37`, `6cc6d6a`. The branch stays;
nothing is deleted. It is the durable record of the candidate and of the human visual verdict.

**Mechanical hazard:** the three documentation commits `c735a77`, `f212bc1`, `9b31486` sit on the
same branch and *do* need to reach `main`. They must be cherry-picked, or moved to a separate
branch, before or instead of any merge. Merging the branch wholesale would bring the command UI
with them.

If option A is applied and later regretted, the two oRPC leaves are recoverable from `main`'s
history at `4211b17` (`phase5-command-domain` integration).
