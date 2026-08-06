# phase5-staff-ui — monitoring-only closeout slice

- Status: decisions confirmed; plan only, nothing implemented
- Written 2026-08-06 15:50; **revised 2026-08-06 16:15** after Hussein confirmed the six
  decisions below. The earlier draft offered three options for the mutation endpoints; option A
  is now authorized. Prior version recoverable at commit `6611c4b`.
- Branch / worktree: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry`
- Related: [closeout record](../../paper-design-phase-closeout.md),
  [ADR-007](../../../adr/ADR-007-paper-visual-source-of-truth.md),
  [human visual verdict](20260727-230622-p5_staff_b03_retry-human-visual-verdict.md)

## Confirmed product decisions

1. `/staff` is **permanently monitoring-only**.
2. Retire both staff-facing mutation endpoints, `staff.issueCorrection` and `staff.issueReset`.
   They must not remain as authenticated product mutations with no caller.
3. Preserve backend, edge, scheduled, recovery, reconciliation, audit, and internal command
   infrastructure wherever an existing behavioral contract or a later phase still needs it.
4. Phase 6 must not introduce a staff-facing manual fallback or any new staff/owner command UI.
   Automatic offline fallback, backfill, reconciliation, and recovery behavior are preserved.
5. Do not invent an owner/admin command surface to replace the retired staff controls.
6. Do not alter the frozen `operationalSnapshotSchema.source` enum during this slice. Record
   `manual` for review in its owning future slice (Phase 6) and remove it only after confirming
   no valid internal producer remains.

## Ground truth

**The staff command UI was never merged.** Verified with `git cat-file -e main:<path>`:

| Path | On `main` |
| --- | --- |
| `staff-commands-panel.tsx`, `commands.css`, commands `messages.ts`, `validation.ts` | no |
| `use-staff-commands.ts`, `use-staff-commands.test.tsx` | no |
| `tests/browser/phase5-staff-ui.browser.spec.ts` | no |
| `packages/api/src/commands/recent-commands.ts` and the `staff.recentCommands` leaf | no |
| `apps/server/src/command-repository.ts`, `CommandService`, migration `0005` | **yes** |
| `staff.issueCorrection`, `staff.issueReset` in `appRouter` | **yes** |

`main`'s `/staff` imports no command component and `apps/web` on `main` contains zero references
to either mutation. So nothing is deleted from the running UI — the UI work is excluded by not
merging, and the only code retirement is the two integrated oRPC leaves.

Also verified: every `command` reference in `apps/server/src/openapi.ts` and `openapi.test.ts`
describes the **edge push response** (command delivery to the device). The OpenAPI document never
exposed the staff mutations. It is untouched by this slice.

## The slice

Sequenced so nothing is ever half-true. Each step is one commit.

### Step 0 — land the documentation commits on `main`

Cherry-pick, in order, onto `main`: `c735a77`, `f212bc1`, `9b31486`, `6611c4b`, and this
revision's commit. **Do not merge the branch** — the five implementation commits share it.
`c735a77` also fixes `main`'s expired-lease failure, so `pnpm check:repository` goes green there.

### Step 1 — coordinator activation (`PROJECT_STATE.yaml` only)

Redefine `phase5-staff-ui`: scope becomes "retire the staff command surface and align `/staff`
with monitoring-only"; new `ownedPaths` covering steps 2–4; `sharedLeases` for every
coordinator-owned file listed under Leases; fresh lease; `baseCommit` at the step-0 head;
`handoff` repointed at this file. The milestone cannot be deleted — `phase-5` depends on it and
the schema has no cancelled state.

### Step 2 — product and authority, in one commit

Writing ADR-008 alone would recreate the split authority the 2026-08-06 reconciliation removed:
an ADR saying monitoring-only while `SPEC.md` story 14 still requires a staff reset dialog. These
land together or not at all. That is why this handoff, not an ADR, carried the decision across
the session boundary.

- **New `docs/adr/ADR-008-staff-monitoring-only.md`** — records decisions 1–6, the retirement of
  the two leaves, the Phase 6 constraint, and the explicit prohibition on an owner/admin
  replacement surface. Add the row to `docs/adr/README.md`.
- **`docs/adr/ADR-003-edge-authority-and-reconciliation.md`** — lines 23–25 record explicit staff
  manual fallback as a *decision*. Add a partial-supersession note pointing at ADR-008, in the
  same style as ADR-006→ADR-007, and preserve the decision body unedited. Line 32's "Scheduled
  resets use the same command and audit lifecycle as human operations" needs rewording: there are
  no human operations left.
- **`FITWAY_PRODUCT.md:14`** — staff row: "correct, directly set, or reset the count when needed".
  Line 15 gives the owner "staff operations plus…", which under decision 5 must not be read as an
  owner command surface.
- **`SPEC.md`** — the product-summary staff bullet; stories **12, 13, 14, 17**; story **33**'s
  "so that staff corrections reach my local counter"; the acceptance criterion "Staff view
  provides live count + health, stepper correction, direct count entry, and confirmed reset";
  the **Correction propagation** timing criterion, which measures a staff correction reaching the
  public payload and now has no trigger; and "Manual fallback works when the edge is offline"
  under decision 4.
- **`PHASES.md`** — Phase 5 acceptance drops "pending/applied/superseded UI"; Phase 6 changes
  "staff manual fallback with its own validity window" to automatic offline fallback, and gains
  the decision-6 review item for `operationalSnapshotSchema.source`'s `manual` value.
- **`DESIGN_GUIDE.md`** — §2 "actions placed near their consequences, and destructive actions
  deliberately separated" and §11:229 "A staff correction shows pending/application state. A
  reset requires a confirmation dialog."

### Step 3 — retire the two endpoints

- `packages/api/src/routers/index.ts` — remove `staffIssueCorrection`, `staffIssueReset`, both
  `appRouter.staff` entries, and the now-dead `requireCommandService` and `handleCommandIssue`
  helpers plus their imports (`commandMutationResultSchema`, `correctionInputSchema`,
  `resetInputSchema`, `CommandService`, `CommandIssueError`).
- `packages/api/src/context.ts` — remove the `commandService` field from `CreateContextOptions`
  and `Context`. Nothing in the oRPC layer will use it, and leaving an optional injected service
  is a standing re-exposure path. (Alternative if contested: keep the field. It is inert. But
  removal is the honest expression of the decision.)
- `apps/server/src/index.ts:123` — drop the `commandService` argument from `createContext`.
- `apps/server/src/command-repository.ts` — **keep** `createCommandServiceDatabase` and the
  exported `commandService` singleton. Phase 7's cron route calls it directly; `SPEC.md:312`
  puts cron endpoints in the Hono app, and `SPEC.md:518-519` and `571` put the daily zero-reset
  there, so it never needed the oRPC path.
- `packages/api/src/commands/router.test.ts` — delete. Its entire subject is the two leaves; its
  unique coverage (role enforcement, `CommandIssueError` → `BAD_REQUEST`) describes endpoints that
  no longer exist.

### Step 4 — re-prove the command domain, then land the salvage

**This is the material risk.** `phase5-command-domain` is `DONE` with `integration: PASS`, and
`apps/server/src/phase5-command-domain.integration.test.ts` drives three of its four `it` blocks
through `rpc("issueCorrection" | "issueReset", …)`. Removing the endpoints removes that test's
current means of exercising the lifecycle — which is the acceptance evidence for a completed
milestone.

Rewrite issuance to call `commandService.issueCorrection(actor, …)` / `issueReset` directly
against the disposable database, constructing a `CommandActor`. The fourth block already does
this at line 505, so the pattern exists in the file.

- `enforces authorization and strict correction/reset/backfill-shaped validation` — the command
  authorization and validation halves describe removed endpoints; the backfill half stays.
  Do not silently drop coverage: state in the phase record what stopped being provable because
  the surface no longer exists.
- `atomically issues monotonic commands, floors delta, supersedes latest-only, and preserves
  cloud current state` — swap issuance to direct service calls; assertions unchanged.
- `delivers latest-only and advances lifecycle only on eligible accepted acknowledgements` —
  swap issuance; the edge delivery/ack half, which is the valuable part, is unchanged.
- `rolls back command, supersession, and audit together when audit append fails` — unaffected.

**`scripts/verify.mjs`** — the `phase5-staff-ui` profile registers
`browserFiles: ["tests/browser/phase5-staff-ui.browser.spec.ts"]`, which **does not exist on
`main`**. It is latently broken today and the spec will now never land. Repoint the profile at
`tests/browser/phase4-staff-web.browser.spec.ts`, which is `main`'s monitoring coverage for
`/staff`, or empty `browserFiles`. Also fix the pre-existing `verify:fast` blocker:
`apps/server/src/command-repository.test.ts` imports `packages/db` at module scope, so
`packages/env` throws without `DATABASE_URL` (passes under `SKIP_ENV_VALIDATION=1`).

Then land the salvage from `6cc6d6a`, which answered the recorded human visual verdict and is
monitoring and login work that survives the decision:

- `apps/web/src/components/staff/staff.css` — zero `command` selectors; login watermark pinning,
  the login skip-link fix, card lighting, monitoring layout. Imported by `staff-shell.tsx` and
  `login.tsx`.
- `apps/web/src/components/staff/operational-snapshot-view.tsx` — drops the decorative
  `HeartPulse`, the `schemaVersion` row, and the always-"now" computed line.
- `apps/web/src/components/staff/messages.ts` — the matching type removals.
- `apps/web/src/i18n/messages/{ar,en}.ts` — login copy, `جهاز العد` terminology, and the removed
  `computed`/`schemaVersion` keys.
- **Must change again:** `staff.description` now reads "Occupancy, device health, and count
  controls in one view." / "الإشغال وحالة الجهاز وأدوات ضبط العدد في عرض واحد." That is the one
  place the monitoring surface advertises commands. Revert to monitoring-only wording; the
  pre-`6cc6d6a` string was already correct in both catalogs.

Do **not** carry over `staff.tsx`'s command import, the `command-page-layout` wrapper, or the
panel mount (lines 4, 56, 58–66 on the branch). `.command-page-layout` is defined only in
`commands.css`, which is imported only by the panel, so both disappear together.

## Must not change

`packages/api/src/commands/{queue,schemas,service}.ts` and their tests · `CommandService` ·
`packages/api/src/edge-push.ts` and `apps/server/src/edge-push.ts` · `apps/server/src/audit-repository.ts` ·
`packages/db` `edge_commands` schema and migration `0005` (never re-generate) ·
`edge/simulator.py` and its fixtures · `packages/api/src/occupancy/engine.ts` command
application · `apps/server/src/openapi.ts` · ADR-003's lifecycle rules (durable, monotonic,
auditable, supersession, apply-before-live on reconnect) ·
`operationalSnapshotSchema.source` (decision 6) · Paper.

`CommandActor` and `HumanAuditEntry` model only `shared_staff | owner`, and after retirement no
human issues commands. `SPEC.md:349` already names `system` as the scheduled-reset issuer.
Extending the actor model is **Phase 7** work — do not start it here, and do not delete the human
actor types, which the rewritten integration test still uses to prove lifecycle mechanics.

## Leases

- `PROJECT_STATE.yaml` — coordinator-only; step 1
- `FITWAY_PRODUCT.md`, `SPEC.md`, `PHASES.md` — normative; locked-product change, human-approved
- `DESIGN_GUIDE.md`, `docs/adr/**` — visual contract and decision records
- `packages/api/src/routers/index.ts`, `packages/api/src/context.ts`,
  `packages/api/src/commands/router.test.ts`, `apps/server/src/index.ts`,
  `apps/server/src/phase5-command-domain.integration.test.ts` — all belong to the `DONE`
  `phase5-command-domain` milestone; explicit shared lease required
- `scripts/verify.mjs` — named in `phase5-staff-ui`'s `forbiddenPaths`; explicit lease
- `apps/web/src/i18n/messages/**`, `apps/web/src/components/staff/{staff.css,messages.ts}`,
  `apps/web/src/components/staff/operational-snapshot-view.tsx` — shared catalogs and shell
  styles; four of these five are in `forbiddenPaths`. Their content is wanted, so they need a
  lease, not reversal. This resolves the decision-8 question the closeout record preserved.

## Validation

1. `pnpm check:repository`
2. `pnpm verify:fast` — only meaningful after the `command-repository.test.ts` env fix
3. `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase5-command-domain.integration.test.ts`
   with the registered disposable database — the re-proof of the rewritten evidence
4. `pnpm verify:phase --phase phase5-staff-ui` with the repointed profile
5. `pnpm verify:full` before integration
6. `/staff` monitoring in Arabic RTL and English LTR across 320/360/390/721/768/820/1024/1200/1440,
   keyboard, reduced motion, 200% reflow — `tests/browser/phase4-staff-web.browser.spec.ts` must
   stay green through the salvage
7. Fresh independent verifier; human confirmation that `/staff` shows no command affordance

## Rollback boundary

The command UI is unmerged, so the boundary is: **do not merge `06454f9`, `36aa857`, `67feb96`,
`9ebbf37`, `6cc6d6a`.** The branch stays; nothing is deleted. It is the durable record of the
candidate and of the human visual verdict.

Step 3 is recoverable from `main`'s history at `4211b17` (`phase5-command-domain` integration) if
the retirement is ever reversed. Step 4's test rewrite is the only step that changes existing
green evidence — land it in its own commit so it can be reverted independently.

## What "closed" means, and what it does not

After this slice `phase5-staff-ui` can reach `DONE`: its deliverable is the absence of a command
surface plus the monitoring salvage, and its gates are provable against
`phase4-staff-web.browser.spec.ts` and the re-proved command-domain integration. `phase-5` can
then close.

This does **not** mean `/staff` matches Paper. Implementing
`STAFF MONITORING PRODUCTION SET — CURRENT` is a separate later slice: per ADR-007 no production
family has been implemented, and this slice deliberately implements none.
