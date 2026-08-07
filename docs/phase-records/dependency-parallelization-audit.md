# Dependency and parallelization audit — read-only

- Status: `RECORDED` — evidence and planning context only; no milestone, branch, worktree,
  lease, roadmap entry, coordinator state, or executable artifact was created or changed
- Date: 2026-08-07
- Branch / worktree: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry`
- Audit HEAD / `main` at audit time: `43b08da08cb554b1dcd233ea4b85d6c65e4cfdce` /
  `680cccc48c8f2b6aef4f6746016cc639f74f9798`
- Related: [PHASES.md](../../PHASES.md), [PROJECT_STATE.yaml](../../PROJECT_STATE.yaml),
  [docs/WORKFLOW.md](../WORKFLOW.md),
  [ADR-007](../adr/ADR-007-paper-visual-source-of-truth.md),
  [closeout record](paper-design-phase-closeout.md),
  [monitoring-only plan](handoffs/phase5-staff-ui/20260806-155000-p5_staff_monitoring_only-plan.md)

## What this record is, and what it is not

This is a point-in-time, read-only audit of the real dependency graph between remaining phases
and of which phases are safe to develop concurrently in isolated worktrees. It is **evidence and
planning context**.

It does **not** replace or amend `PHASES.md`, `PROJECT_STATE.yaml`, any ADR, `FITWAY_PRODUCT.md`,
`SPEC.md`, Git history, or executable verification. Where this record and any of those disagree,
those win and the disagreement is a finding to escalate, not a licence to follow this file. Every
conclusion below is a recommendation to the coordinator and the human approver; none is a
decision, an activation, or an approval.

Findings are classified `VERIFIED` (directly supported by inspected evidence, cited),
`INFERRED` (an engineering conclusion drawn from verified evidence but not stated by the source),
or `UNVERIFIED` (could not be confirmed from the inspected evidence). A `VERIFIED` claim describes
what was true at the two commits named above; verify it against the repository before acting.

**Scope note.** `docs/phase-records/` is outside `phase5-staff-ui`'s `ownedPaths` and inside its
`forbiddenPaths`. Creating this record here was explicitly human-authorized for this audit and for
nothing else, in the same manner recorded at
[the closeout record](paper-design-phase-closeout.md). No other path was touched.

## 1. Repository baseline at audit time

| Fact | Value | Status |
| --- | --- | --- |
| Working tree | clean; `git status --porcelain` empty | VERIFIED |
| HEAD vs `main` | 11 ahead, 0 behind; `merge-base` = `680cccc` (`main` is a strict ancestor) | VERIFIED |
| `origin/main` | `04c0def` "initial commit"; local `main` ahead 65 — the remote is not a baseline | VERIFIED |
| Worktrees | 10 registered, all clean, no uncommitted writer state | VERIFIED |

Unmerged branch inventory (`git rev-list --count main..<branch>`), VERIFIED:

- Fully merged (0 ahead): `work/phase4-auth-b01`, `work/phase4-health-b01`,
  `work/phase4-staff-web-b02`, `work/phase5-command-domain-b03`,
  `work/phase8-alert-evaluator-b02`, `work/phase8-alert-evaluator-b02-retry`,
  `work/phase9-analytics-domain-b01`, `work/phase9-owner-ui-b03-retry`.
- Unmerged: `work/phase5-staff-ui-b03` (3, superseded by the retry),
  `work/phase9-owner-ui-b03` (1, a blocker record), `work/phase5-staff-ui-b03-retry` (11).

### The baseline is red — headline finding

`node scripts/verify-repository.mjs` was executed in both worktrees. VERIFIED:

```text
D:/Projects/fitway (main @ 680cccc):
  FAILED_VALIDATION: phase5-staff-ui has an expired lease at the current wall-clock time   exit=1

D:/Projects/fitway-worktrees/phase5-staff-ui-retry (43b08da):
  Repository invariants passed: 31 milestones, 8 canonical approval screenshots.           exit=0
```

`main`'s `PROJECT_STATE.yaml` carries `phase5-staff-ui.leaseExpiresAt: 2026-07-29T21:11:56+03:00`;
the audit date is 2026-08-07. `scripts/verify-repository.mjs` rejects an expired lease on any
milestone in `READY | IN_PROGRESS | VALIDATING | READY_FOR_INTEGRATION`, and `check:repository` is
step 1 of `verify:fast` (`scripts/verify.mjs`, `fastSteps`), which is the base of every rung of
the ladder.

**INFERRED from those verified facts:** any new worktree branched from `main` as it stands fails
its first gate for a reason unrelated to its own work. No parallel phase can start from `680cccc`.

## 2. Phase inventory

Source: `PROJECT_STATE.yaml` and `PHASES.md`. All statuses VERIFIED at the audit commits.

| Milestone | Status | Ledger dependencies | Implementation surface | Verification profile registered |
| --- | --- | --- | --- | --- |
| `phase5-staff-ui` | READY | `phase5-command-domain` | Redefined by the monitoring-only plan: retire two oRPC leaves, normative document reconciliation, monitoring salvage | Yes, but broken (§3.3) |
| `phase-5` | PLANNED | command-domain, staff-ui | Coordinator ledger only | n/a |
| `phase-6` | PLANNED | `phase-5` | Edge protocol, occupancy engine, backfill/reconnect, frozen device/OpenAPI contract | No |
| `phase7-reset-evaluator` | PLANNED | BRG, `phase-3`, `phase-5` | Cron endpoint and `CRON_SECRET`; neither exists | No |
| `phase7-integration` | PLANNED | reset-evaluator, `phase-6` | Apply-before-live on reconnect | No |
| `phase-7` | PLANNED | both slices | Coordinator | n/a |
| `phase8-integration` | PLANNED | `phase8-alert-evaluator`, `phase-7` | Cron wiring, Telegram environment variables | No |
| `phase-8` | PLANNED | evaluator, integration | Coordinator | n/a |
| `phase-9` | PLANNED, both slices DONE | analytics-domain, owner-ui | Coordinator ledger only | n/a |
| `phase10-domain` | PLANNED | `phase-9` | `packages/api/src/analytics/**`, server-side reporting repository, possibly one index migration | No |
| `phase10-ui-csv` | PLANNED | `phase10-domain` | `/admin` heatmap, comparison, CSV export UI | No |
| `phase11-shell` | PLANNED | `phase-9` | `apps/web/src/routes/admin.tsx` (66 lines today), `StaffShell`, i18n catalogs | No |
| `phase11-audit` | PLANNED | `phase-5`, `phase-9` | `auditLog` table already exists | No |
| `phase11-access` | PLANNED | `phase-4`, `phase-5`, `phase-9` | `authStaffCredentials`, `authPrincipals` already exist | No |
| `phase11-settings` | PLANNED | `phase-3`, `-5`, `-6`, `-7`, `-9` | `settingsVersions` already exists, append-only | No |
| `phase11-health` | PLANNED | `phase-8`, `phase-9` | `edgeHealthLog`, `alertLog` already exist | No |
| `phase-10`, `phase-11` | PLANNED | their slices | Coordinator | n/a |
| `phase-12` | PLANNED | `phase-6` | `edge/` Python client and Windows lifecycle | No |

Supporting evidence, VERIFIED: no cron or `CRON_SECRET` reference exists anywhere under
`apps/server/src`, `packages/api/src`, or `packages/env/src`; `packages/env/src/server.ts`
declares only `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `NODE_ENV`;
`scripts/verify.mjs` registers eleven profiles and none for phases 6, 7, 8-integration, 10, 11,
or 12.

## 3. Roadmap-versus-repository mismatches

Reported, not repaired.

1. **`main` fails `check:repository`.** VERIFIED (§1). Recorded nowhere in `PHASES.md` or
   `PROJECT_STATE.yaml`.
2. **`phase-9` is `PLANNED` while both slices are `DONE` and `verify:full` passed.** VERIFIED —
   [the Phase 9 coordinator integration handoff](handoffs/phase9-owner-ui/20260727-195424-p9_owner_coord_integration.md)
   records `batch03_coord_full_final01` `pnpm verify:full` PASS. The aggregate is unclosed purely
   as a ledger act; `PHASES.md` batch 3 makes closing it the trigger for `phase10-domain` and
   `phase11-shell`.
3. **The registered `phase5-staff-ui` verification profile names a file absent from `main`.**
   VERIFIED — `scripts/verify.mjs` lists `tests/browser/phase5-staff-ui.browser.spec.ts`;
   `git cat-file -e main:…` reports it absent. `scripts/verify.mjs` is byte-identical on `main`
   and HEAD, so `pnpm verify:phase --phase phase5-staff-ui` is red on `main`.
4. **The recorded Step 0 cherry-pick set leaves the baseline red for a second reason.** VERIFIED —
   the monitoring-only plan prescribes cherry-picking `c735a77`, `f212bc1`, `9b31486`, `6611c4b`
   onto `main` and explicitly not merging the five implementation commits. But `c735a77` repoints
   `phase5-staff-ui.handoff` at
   `docs/phase-records/handoffs/phase5-staff-ui/20260727-230622-p5_staff_b03_retry-human-visual-verdict.md`,
   which is added by `9ebbf37` — one of the five commits that plan's rollback boundary forbids
   merging. `scripts/verify-repository.mjs` calls `readBytes(milestone.handoff)` for every READY
   milestone. Step 0 as written trades the lease failure for a missing-handoff failure. The
   verdict record is documentation-only and carries no code; including it in the Step 0 set, or
   repointing `handoff`, both resolve it. That choice is the coordinator's.
5. **No verification profile exists for any unstarted phase.** VERIFIED. `docs/WORKFLOW.md`
   requires one before launch, so every new worktree needs a coordinator edit to the single shared
   `scripts/verify.mjs`.
6. **`SPEC.md` still requires the staff command UI the human retired.** VERIFIED — `SPEC.md`
   corrections/resets and manual-fallback behaviour, and the staff/owner procedure list, still
   describe the retired surface. The retirement is recorded only in
   [the closeout record](paper-design-phase-closeout.md) and the monitoring-only plan. A live
   authority contradiction awaiting that plan's Step 2.
7. **ADR-007 approves four Paper families; six future UI surfaces have none.** VERIFIED —
   [ADR-007](../adr/ADR-007-paper-visual-source-of-truth.md) enumerates
   `OWNER DAILY ANALYTICS`, `STAFF MONITORING`, `LOGIN`, and `PUBLIC CROWD BOARD`, and states that
   implementation of any production family starts from Paper. No approved family covers owner
   navigation, heatmap, comparison, CSV, audit listing, access management, settings, or health
   incidents. **INFERRED consequence:** `phase10-ui-csv` and all five `phase11-*` UI slices face an
   unresolved visual-authority question that is not a Phase 5 dependency.

## 4. Dependency classification

- `phase-5` ← `phase5-staff-ui` — HARD — VERIFIED. `PROJECT_STATE.yaml`; the invariant checker
  refuses a `READY`-or-later status whose dependency is not `DONE`.
- `phase-6` ← `phase-5` — HARD and AUTHORITY — VERIFIED. Beyond the ledger edge, the closeout
  defines Phase 6's scope: its decision 4 forbids a staff-facing manual fallback, and its Step 2
  rewrites `PHASES.md` Phase 6 and the `SPEC.md` manual-fallback criterion. Starting Phase 6 first
  means building against a spec the human has already overruled.
- `phase7-reset-evaluator` ← `phase-5` — HARD and CONTRACT — VERIFIED. It calls
  `commandService.issueReset` with a `system` actor; the plan preserves
  `createCommandServiceDatabase` for it and assigns the `CommandActor` `system` extension to
  Phase 7.
- `phase7-integration` ← `phase-6` and the evaluator — HARD — VERIFIED.
- `phase8-integration` ← `phase-7` — HARD, plus FILE-OVERLAP with `phase7-reset-evaluator` on the
  non-existent cron endpoint and on `packages/env/src/server.ts` — VERIFIED. Serialized by the hard
  edge regardless.
- `phase-9` ← its two DONE slices — AUTHORITY/COORDINATION only — VERIFIED. No implementation
  remains; the gates read `PENDING` in the ledger while the evidence exists in the phase record.
- `phase10-domain` ← `phase-9` — AUTHORITY/COORDINATION, not CONTRACT — VERIFIED. The code it
  consumes is already on `main` at `680cccc`. The edge is real but discharged by one coordinator
  commit.
- `phase11-shell` ← `phase-9` — AUTHORITY/COORDINATION plus mild CONTRACT — VERIFIED that `/admin`
  and `OwnerAnalyticsPage` exist on `main`; INFERRED that restructuring `/admin` into nested
  sections touches `StaffShell`, which `/staff` and `/login` also render.
- `phase10-ui-csv` ← `phase10-domain` — HARD and CONTRACT — VERIFIED.
- `phase11-audit`, `phase11-access`, `phase11-settings` ← `phase-5` — CONTRACT — VERIFIED. They
  consume the audit, command, and settings contracts the closeout is reshaping.
- `phase11-health` ← `phase-8` — HARD — VERIFIED; transitively behind Phase 5 via Phase 7.
- `phase-12` ← `phase-6` — HARD and CONTRACT — VERIFIED; `SPEC.md` binds it to the Phase 6 frozen
  device/OpenAPI contract.

Explicit non-edges, VERIFIED unless noted:

- `phase10-domain` ∥ `phase11-shell` — NO MATERIAL DEPENDENCY (server/API versus web).
- `phase10-domain` ∥ Phase 5 closeout — NO MATERIAL DEPENDENCY — **INFERRED**, and conditional on
  the ownership design in §6.
- `phase11-shell` ∥ Phase 5 closeout — FILE-OVERLAP, requires coordination.
- `phase-9` aggregation ∥ Phase 5 closeout — NO MATERIAL DEPENDENCY; both write
  `PROJECT_STATE.yaml`, so serialize the commit, not the work.
- `phase-12` ∥ Phase 10 and `phase11-shell` — `edge/` is a disjoint tree, though `phase-12` is
  gated by Phase 6.

## 5. Dependency DAG

```text
Wave-0 prerequisites (coordinator, on main)
  BASELINE-FIX  -> every phase — HARD — VERIFIED — check:repository red on main
                  evidence: node scripts/verify-repository.mjs in D:/Projects/fitway -> exit 1
  phase-9 close -> phase10-domain — AUTHORITY — VERIFIED — READY requires dependencies DONE
                  evidence: verify-repository.mjs assertProjectStateInvariants + PROJECT_STATE.yaml
  phase-9 close -> phase11-shell  — AUTHORITY — VERIFIED — same rule

Phase 5 spine
  phase5-staff-ui(closeout) -> phase-5                  — HARD           — VERIFIED
  phase-5 -> phase-6                                    — HARD+AUTHORITY — VERIFIED
  phase-5 -> phase7-reset-evaluator                     — HARD+CONTRACT  — VERIFIED
  phase7-reset-evaluator + phase-6 -> phase7-integration — HARD          — VERIFIED
  phase7-reset-evaluator + phase7-integration -> phase-7 — HARD          — VERIFIED
  phase8-alert-evaluator + phase-7 -> phase8-integration — HARD          — VERIFIED
  phase8-alert-evaluator + phase8-integration -> phase-8 — HARD          — VERIFIED
  phase-6 -> phase-12                                   — HARD+CONTRACT  — VERIFIED

Phase 9/10/11 branch (free of Phase 5)
  phase-9 -> phase10-domain -> phase10-ui-csv -> phase-10 — HARD      — VERIFIED
  phase-9 -> phase11-shell                                — AUTHORITY — VERIFIED
  phase-5 + phase-9 -> phase11-audit                      — CONTRACT  — VERIFIED
  phase-4 + phase-5 + phase-9 -> phase11-access           — CONTRACT  — VERIFIED
  phase-3,-5,-6,-7,-9 -> phase11-settings                 — CONTRACT  — VERIFIED
  phase-8 + phase-9 -> phase11-health                     — HARD      — VERIFIED
  all five slices -> phase-11                             — HARD      — VERIFIED

Parallel-safe relationships
  phase10-domain || phase11-shell         — NO MATERIAL DEPENDENCY — VERIFIED
  phase10-domain || Phase 5 closeout      — NO MATERIAL DEPENDENCY — INFERRED (see §6)
  phase11-shell  || Phase 5 closeout      — FILE-OVERLAP, requires coordination — VERIFIED
  phase-9 aggregation || Phase 5 closeout — NO MATERIAL DEPENDENCY — VERIFIED
```

Edge discovered by this audit and absent from the roadmap:

```text
ADR-007 Paper family coverage -> phase10-ui-csv, phase11-{shell,audit,access,settings,health}
  — AUTHORITY — INFERRED — no approved Paper production family covers these surfaces
  — evidence: ADR-007 (four families; implementation starts from Paper),
              paper-design-phase-closeout.md (per-surface conflict list does not exist),
              AGENTS.md (a material visual-direction change is immediately NEEDS_HUMAN)
```

## 6. Parallel-safe groups

**Group A — Phase 5 closeout.** One writer, this worktree and branch. Not parallel with anything
touching `packages/api/src/routers/index.ts`, `packages/api/src/context.ts`,
`apps/server/src/index.ts`, `scripts/verify.mjs`, or the normative documents.

**Group B — `phase10-domain`.** New worktree. Parallel-safe with A and with C **provided** its
ownership replicates the `phase9-analytics-domain` pattern: additive and unexposed, with
`packages/api/src/routers/**`, `packages/api/src/context.ts`, and `apps/server/src/index.ts` in
`forbiddenPaths`. That exact pattern is VERIFIED in `PROJECT_STATE.yaml` and endorsed by
`PHASES.md` batch 1A ("analytics stays additive and unexposed"). Exposure wiring then happens
under a coordinator lease after A integrates.

**Group C — `phase11-shell`.** New worktree. Semantically independent of A, but shares
`apps/web/src/i18n/messages/{ar,en}.ts`, `apps/web/src/components/staff/staff.css`, and
`StaffShell` with A's salvage step — VERIFIED, those files appear in `6cc6d6a`'s file list and in
the plan's Leases section. It also carries the unresolved ADR-007 question. **Recommendation: hold
C until A integrates.**

Not parallel-safe with anything at the audit commits: `phase-6`, `phase7-*`, `phase8-integration`,
`phase-12`, and `phase11-{audit,access,settings,health}` — all behind an unclosed `phase-5`.

## 7. Phases that must remain serialized

| Serialization | Reason | Status |
| --- | --- | --- |
| `phase-6` after `phase-5` | Its scope is rewritten by the closeout (decision 4) | VERIFIED |
| `phase7-reset-evaluator` after `phase-5` | Consumes `commandService` and the actor model the closeout reshapes | VERIFIED |
| `phase7-integration` after `phase-6` | Reconnect ordering requires the frozen device contract | VERIFIED |
| `phase8-integration` after `phase-7` | Ledger HARD edge; also shares the cron endpoint and environment schema | VERIFIED |
| `phase10-ui-csv` after `phase10-domain` | Consumes its DTOs | VERIFIED |
| Any two writers on `packages/api/src/routers/index.ts` | One object literal; A removes two `appRouter.staff` entries while any exposure adds entries to the same literal | VERIFIED |
| Migration generation | One coordinator-controlled stream; `0000`–`0005` present with a shared `_journal.json` | VERIFIED |
| `PROJECT_STATE.yaml` writes | Coordinator-only by policy; the checker rejects duplicate branch, worktree, or lease across active milestones | VERIFIED |

## 8. What the Phase 5 closeout actually gates

1. **Cannot start until the closeout completes:** `phase-6`, `phase7-reset-evaluator`,
   `phase7-integration`, `phase-7`, `phase8-integration`, `phase-8`, `phase11-audit`,
   `phase11-access`, `phase11-settings`, `phase11-health`, `phase-11`, `phase-12`. VERIFIED.
2. **Can start while the closeout runs:** `phase10-domain` (VERIFIED-safe under unexposed
   ownership) and `phase11-shell` (VERIFIED-parallel semantically; requires coordination on shared
   web files plus an ADR-007 answer). Both require `phase-9` closed first. The `phase-9`
   aggregation itself is a coordinator act available immediately.
3. **Parallel implementation, integration after Phase 5:** `phase10-domain`, only if it needs
   router, context, or server-index exposure; its unexposed domain code has no integration ordering
   constraint. INFERRED.
4. **Parallel implementation, final verification after Phase 5:** `phase11-shell`, if started
   before A integrates — its browser and accessibility runs share `StaffShell` and the i18n
   catalogs A is editing, so a green run before A does not survive A. VERIFIED file overlap;
   INFERRED verification consequence.
5. **Only appear dependent:** `phase10-domain` and `phase11-shell` look Phase-5-blocked by
   numbering but are blocked only by the `phase-9` ledger act over already-merged `DONE` work
   (VERIFIED). `phase-12` is numbered last but depends only on `phase-6` and is off the critical
   path (VERIFIED). The repository-wide documentation on the current branch looks Phase-5-owned by
   branch placement and is not (§10).
6. **Repository-wide commits on the current branch that others should inherit independently of
   Phase 5:** yes, five of eleven — see §10.
7. **Baseline for a new parallel worktree:** not `680cccc`. See §15.

## 9. Shared-file and merge-risk matrix

| Surface | Contending work | Classification | Evidence |
| --- | --- | --- | --- |
| `packages/api/src/routers/index.ts` | Closeout removes two leaves and helpers; any exposure adds leaves | Requires coordination | One `appRouter` object literal; plan Step 3 |
| `packages/api/src/context.ts` | Closeout removes `commandService`; Phase 10/11 add readers | Requires coordination | `CreateContextOptions` and `Context`; plan Step 3 |
| `apps/server/src/index.ts` | Closeout drops one `createContext` argument; others add | Requires coordination | Single `createContext` call site |
| `scripts/verify.mjs` | Closeout repoints one profile; every new phase adds one | Manageable at integration | Distinct object entries |
| `packages/db/src/migrations/**` and `meta/_journal.json` | Phase 10 index migration (likely), Phase 7/8 cron tables, Phase 11 settings | Unsafe to parallelize | `PHASES.md` serial migration lane |
| `packages/env/src/server.ts` | Phase 7 `CRON_SECRET`, Phase 8 Telegram | Requires coordination | Five variables today; zero cron or Telegram hits |
| `apps/web/src/i18n/messages/{ar,en}.ts` | Closeout salvage; `phase11-shell`; `phase10-ui-csv` | Manageable at integration | `6cc6d6a` file list; plan salvage step |
| `apps/web/src/components/staff/{staff-shell.tsx,staff.css}` | Closeout salvage; `phase11-shell` navigation restructure | Requires coordination | Rendered by `/staff`, `/admin`, `/login` |
| `apps/web/src/routes/admin.tsx` | `phase11-shell` versus `phase10-ui-csv` | Requires coordination | 66-line single page today; serialized by the DAG regardless |
| `apps/server/src/phase5-command-domain.integration.test.ts` | Closeout Step 4 rewrite | Requires coordination | Rewrites a `DONE` milestone's acceptance evidence |
| `apps/web/src/routeTree.gen.ts` | Any new route | Harmless | Untracked and generated; `git ls-files` returns nothing |
| `tests/browser/**` and `__screenshots__/**` | Any UI phase | Requires coordination | Canonical baselines are coordinator-owned and human-gated |
| `SPEC.md`, `PHASES.md`, `FITWAY_PRODUCT.md`, `DESIGN_GUIDE.md`, `docs/adr/**` | Closeout Step 2 only | Requires coordination, human-approved lease | Plan Step 2 |
| `PROJECT_STATE.yaml` | Every activation | Requires coordination, coordinator-only | Checker uniqueness assertions |
| `packages/api/src/analytics/**` | Phase 10 domain versus everything else | Harmless | Nothing else owns it |
| `edge/**` | Phase 12 versus web/API phases | Harmless | Disjoint tree |

## 10. Baseline propagation

The eleven commits on `work/phase5-staff-ui-b03-retry` split cleanly. All VERIFIED by
`git log --name-status main..HEAD`.

**Repository-wide — every future worktree should inherit these:**

| Commit | Content |
| --- | --- |
| `c735a77` | `PROJECT_STATE.yaml` — the lease renewal that makes `check:repository` green |
| `f212bc1` | ADR-007, ADR-006 partial supersession, `AGENTS.md`, `DESIGN_GUIDE.md`, `README.md`, approval manifest |
| `9b31486` | `AGENTS.md`, archive migration of four formerly untracked root authority documents, `design-research/` |
| `43b08da` | `CLAUDE.md` (new) and `docs/WORKFLOW.md` — the root agent policy both tools read |
| `6611c4b`, `39a0204` | Phase-5-scoped planning documents; additive and inert. Safe to inherit, harmless to omit |

**Phase-specific — must not propagate:** `06454f9`, `36aa857`, `67feb96`, `9ebbf37`, `6cc6d6a` —
the staff command UI candidate, its salvage, and the human visual verdict record. The
monitoring-only plan's rollback boundary names exactly these five.

**Caveat, VERIFIED (§3.4):** `9ebbf37` is documentation-only but `c735a77` references the file it
adds, and the checker reads `milestone.handoff` for READY milestones.

**Recommended strategy:** integrate the shared commits to `main` first, as one coordinator commit
set, producing a single common baseline (`M0` below). Independent per-worktree cherry-picking would
duplicate the same content across branches and guarantee conflicts on `AGENTS.md`,
`docs/WORKFLOW.md`, and `PROJECT_STATE.yaml` at integration.

## 11. Verification dependencies

Five distinct gates per phase, per `docs/WORKFLOW.md` and `scripts/verify.mjs`.

| Phase | Implementation can begin | Can complete locally | Integration | Full verification | Formal close |
| --- | --- | --- | --- | --- | --- |
| Phase 5 closeout | Now; this branch is green | Now | After its own gates | `verify:full`, fresh verifier, human confirmation that `/staff` shows no command affordance | Coordinator |
| `phase-9` | Ledger only | Ledger only | n/a | Evidence already recorded (`batch03_coord_full_final01` PASS) | Coordinator, available now |
| `phase10-domain` | After `M0` and `phase-9` | Yes, unexposed | After the closeout if it needs router wiring | Needs a new `verify.mjs` profile and disposable Postgres | After `verify:full` |
| `phase11-shell` | After `M0` and `phase-9` | Yes | After the closeout (shared web files) | Browser and accessibility runs share `StaffShell` and catalogs with the closeout, so re-run after A | After the ADR-007 question is answered |
| `phase-6`, `phase7-*`, `phase8-integration`, `phase-12`, `phase11-{audit,access,settings,health}` | Blocked on `phase-5` | — | — | No profile registered | — |

The distinction that matters: `phase10-domain` is parallel-safe for implementation **and**
verification; `phase11-shell` is parallel-safe for implementation but **not** for final
verification.

## 12. Recommended execution waves

Recommendation only. Activation remains a coordinator act.

**Wave 0 — coordinator only, on `main`, no worktree.** Land the repository-wide commits (§10) as
`M0`, resolving the handoff-pointer issue in §3.4; close `phase-9` with gates set from the recorded
`verify:full`; re-run `check:repository` and `verify:fast` on `M0`; register the `phase10-domain`
verification profile. Gate: `check:repository` exit 0 on `main`. Nothing else starts before this.

**Wave 1 — two concurrent streams from `M0`.**

| | Stream A | Stream B |
| --- | --- | --- |
| Work | Phase 5 closeout, steps 1–4 of the monitoring-only plan | `phase10-domain`, additive and unexposed |
| Worktree/branch | Existing `phase5-staff-ui-retry` on `work/phase5-staff-ui-b03-retry`, rebased onto `M0` or re-activated with `baseCommit: M0` | New worktree, new branch |
| Owns | `packages/api/src/{routers/index.ts,context.ts,commands/router.test.ts}`, `apps/server/src/{index.ts,phase5-command-domain.integration.test.ts}`, `scripts/verify.mjs`, the normative documents under a human-approved lease, the web salvage files | New reporting and aggregation modules, the server-side reporting repository, its own integration test, its handoff directory |
| Forbids | New router leaves | `packages/api/src/routers/**`, `context.ts`, `apps/server/src/index.ts`, `packages/db/**`, `apps/web/**`, `scripts/verify.mjs`, `PROJECT_STATE.yaml` |
| Integration order | A first | B rebases and follows |
| Verification gate | `verify:full`, fresh verifier, human `/staff` confirmation | New profile with disposable Postgres, then `verify:full` at batch close |
| Hotspots | None with B under this ownership | None with A |

Deferred to integration: every `PROJECT_STATE.yaml` transition, B's profile registration, and any
Phase 10 migration.

**Wave 2** — after A integrates and `phase-5` closes: `phase-6` and `phase7-reset-evaluator`
concurrently; `phase11-shell` once the ADR-007 question is answered; `phase10-ui-csv` after B
integrates, with the same caveat.

**Wave 3** — `phase7-integration`, `phase-12`, `phase11-audit`, `phase11-access`.

**Wave 4** — `phase-7`, then `phase8-integration` and `phase11-settings`.

**Wave 5** — `phase-8`, `phase11-health`, then `phase-11`.

## 13. Critical path

```text
Phase 5 closeout -> phase-5 -> phase-6 -> phase7-integration -> phase-7
                 -> phase8-integration -> phase-8 -> phase11-health -> phase-11
```

- Closeout to `phase-5` — the only unclosed Phase 5 slice; ledger and checker enforced. VERIFIED.
- `phase-5` to `phase-6` — hard ledger edge reinforced by the authority edge. VERIFIED.
- `phase-6` to `phase7-integration` — `phase7-reset-evaluator` also feeds this node and also
  unblocks at `phase-5`, so the two run concurrently. **INFERRED** that Phase 6 (offline fallback,
  buffered backfill, reconnect ordering, frozen device/OpenAPI contract) is the longer of the two,
  making Phase 6 the critical predecessor rather than the evaluator.
- `phase7-integration` to `phase-7` — the aggregate needs both slices. VERIFIED.
- `phase-7` to `phase8-integration` — hard ledger edge, even though `phase8-alert-evaluator` has
  been `DONE` since `7b2fe32`. The longest-standing idle dependency in the plan. VERIFIED.
- `phase8-integration` to `phase-8` to `phase11-health` to `phase-11` — hard ledger edges. VERIFIED.

`phase-12` is off the critical path, and so is the entire Phase 10 chain. Numerical order is
actively misleading: Phase 12 can finish before Phase 8.

## 14. Worktree and branch ownership boundaries for parallel candidates

**Phase 5 closeout.** Reuse `D:/Projects/fitway-worktrees/phase5-staff-ui-retry` on
`work/phase5-staff-ui-b03-retry`. Owned, forbidden, and leased paths are enumerated in the
monitoring-only plan. Note, VERIFIED, that its `ownedPaths` in `PROJECT_STATE.yaml` still describe
the old command-UI slice and must be redefined at the plan's Step 1 before edits.

**`phase10-domain`.** New worktree and branch. Owned: new reporting and aggregation modules under
`packages/api/src/analytics/**`, a heatmap/comparison/CSV domain module, the server-side reporting
repository, `apps/server/src/phase10-domain.integration.test.ts`,
`docs/phase-records/handoffs/phase10-domain/**`. Forbidden: `packages/api/src/routers/**`,
`packages/api/src/context.ts`, `packages/api/src/index.ts`, `apps/server/src/index.ts`,
`packages/db/**`, `apps/web/**`, `edge/**`, `tests/browser/**`, `scripts/verify.mjs`,
`PROJECT_STATE.yaml`, `visual-direction-gate/**`, and the normative documents. This mirrors
`phase9-analytics-domain`'s recorded shape — a VERIFIED working precedent. The coordinator retains
the profile registration, any index migration, and the exposure wiring.

**`phase11-shell`.** New worktree and branch; hold until Wave 2. Owned:
`apps/web/src/routes/admin.tsx`, new owner navigation components, its browser spec, its handoff
directory. Requires leases for `apps/web/src/components/staff/staff-shell.tsx`,
`apps/web/src/components/staff/staff.css`, and `apps/web/src/i18n/messages/{ar,en}.ts`. Forbidden:
all server and API paths, `packages/db/**`, `tests/browser/__screenshots__/**`,
`PROJECT_STATE.yaml`.

## 15. Recommended starting baseline per worktree

| Worktree | Baseline | Evidence status |
| --- | --- | --- |
| Phase 5 closeout | `M0`, with the branch rebased onto it or re-activated with `baseCommit: M0` | INFERRED — `docs/WORKFLOW.md` requires basing on the recorded baseline; the current `baseCommit: SELF` predates `M0` |
| `phase10-domain` | `M0` | VERIFIED requirement; the `M0` value depends on Wave 0 |
| `phase11-shell` | `M0`, or the post-closeout `main` if held to Wave 2 (preferred) | INFERRED |
| Any Wave 2 or later worktree | The `main` head after the preceding wave integrates | VERIFIED policy |

`680cccc` is not a valid baseline for any new worktree — VERIFIED by the failing
`check:repository` run.

## 16. Unresolved and unverified questions

1. **UNVERIFIED — could not confirm from inspected evidence.** Whether a new Paper production
   family is required before `phase10-ui-csv` and the `phase11-*` UI slices may implement. ADR-007
   approves four families and says implementation starts from Paper; it does not say what governs a
   surface with no family. Needed: a human decision or an ADR amendment. This is a hard blocker for
   every remaining UI phase and is independent of Phase 5.
2. **UNVERIFIED.** Whether `phase10-domain` needs a migration. `occupancy_minutes` carries only the
   `(device_id, minute_start_utc)` primary key (VERIFIED); whether heatmap and range queries need
   an index was not measured. Needed: an `EXPLAIN` against representative data.
3. **UNVERIFIED.** The intended `phase-9` `integratedCommit` — `c02b4df` (the owner-UI merge) or
   `a7a7f64` (the coordinator closure). Needed: the coordinator's convention; `phase-4` used the
   coordinator commit `94b76a8`.
4. **UNVERIFIED.** Whether `verify:fast` passes on `M0`. The closeout record states it stops at
   `apps/server/src/command-repository.test.ts`'s module-scope `packages/db` import, but that file
   is absent from `main` (VERIFIED), so the blocker may not exist on the `M0` baseline. Needed: one
   `pnpm verify:fast` run on `M0`. Not run here; `M0` does not exist.
5. **Open, VERIFIED as unresolved.** The five files in `6cc6d6a` outside `phase5-staff-ui`'s owned
   paths and leases are still not retroactively authorized. Their diff review is closeout work.
6. **Open, VERIFIED as unresolved.** Decision 6 — the `manual` value in
   `operationalSnapshotSchema.source` is deferred to Phase 6, itself Phase-5-gated.

## 17. Recommendation

Start Wave 0: a coordinator-only session on `main`. It is short, it is the sole prerequisite for
everything else, and it converts the most valuable idle asset in the plan — a fully `DONE`, fully
verified Phase 9 whose aggregate was never closed — into two launchable parallel streams.

Then launch two worktrees from `M0`: the Phase 5 closeout on the existing rebased branch, and
`phase10-domain` as a new unexposed worktree following the `phase9-analytics-domain` ownership
pattern. Hold `phase11-shell` for Wave 2.

Separately and in parallel, put the ADR-007 Paper-family coverage question in front of a human. It
blocks six future UI slices, it is not on the Phase 5 critical path, and answering it late will
stall Wave 2 for reasons no engineering throughput can fix.

## Summary table

| Phase | Depends on | Dependency type | Evidence status | Parallel with | Start now | Integration prerequisite |
| --- | --- | --- | --- | --- | --- | --- |
| Wave-0 baseline fix | — | — | VERIFIED | — | Yes, first | none |
| `phase-9` | analytics-domain, owner-ui (both DONE) | AUTHORITY | VERIFIED | baseline fix | Yes, coordinator only | none |
| `phase5-staff-ui` (closeout) | `phase5-command-domain` (DONE) | HARD | VERIFIED | `phase10-domain` | Yes, from `M0` | `M0` |
| `phase-5` | closeout | HARD | VERIFIED | — | No | closeout `DONE` |
| `phase10-domain` | `phase-9` | AUTHORITY, not CONTRACT | VERIFIED | closeout, `phase11-shell` | Yes, from `M0` | `phase-9` closed; integrate after closeout |
| `phase11-shell` | `phase-9` | AUTHORITY + CONTRACT | VERIFIED | `phase10-domain` | Hold — ADR-007 and file overlap | closeout integrated |
| `phase10-ui-csv` | `phase10-domain` | HARD + CONTRACT | VERIFIED | `phase-6`, `phase7-reset-evaluator` | No | `phase10-domain` DONE, ADR-007 |
| `phase-10` | both Phase 10 slices | HARD | VERIFIED | — | No | both slices DONE |
| `phase-6` | `phase-5` | HARD + AUTHORITY | VERIFIED | `phase7-reset-evaluator` | No | `phase-5` DONE |
| `phase7-reset-evaluator` | BRG, `phase-3`, `phase-5` | HARD + CONTRACT | VERIFIED | `phase-6` | No | `phase-5` DONE |
| `phase7-integration` | evaluator, `phase-6` | HARD | VERIFIED | `phase-12` | No | both DONE |
| `phase-7` | both Phase 7 slices | HARD | VERIFIED | — | No | both DONE |
| `phase8-integration` | `phase8-alert-evaluator` (DONE), `phase-7` | HARD + FILE-OVERLAP | VERIFIED | `phase11-settings` | No | `phase-7` DONE |
| `phase-8` | evaluator, integration | HARD | VERIFIED | — | No | both DONE |
| `phase-12` | `phase-6` | HARD + CONTRACT | VERIFIED | `phase7-integration`, Phase 11 slices | No | `phase-6` DONE |
| `phase11-audit` | `phase-5`, `phase-9` | CONTRACT | VERIFIED | `phase11-access` | No | `phase-5` DONE, ADR-007 |
| `phase11-access` | `phase-4`, `phase-5`, `phase-9` | CONTRACT | VERIFIED | `phase11-audit` | No | `phase-5` DONE, ADR-007 |
| `phase11-settings` | `phase-3`, `-5`, `-6`, `-7`, `-9` | CONTRACT | VERIFIED | `phase8-integration` | No | `phase-7` DONE, ADR-007 |
| `phase11-health` | `phase-8`, `phase-9` | HARD | VERIFIED | — | No | `phase-8` DONE, ADR-007 |
| `phase-11` | all five slices | HARD | VERIFIED | — | No | all five DONE |

## Audit method and limits

Read-only throughout. Two commands were executed, both non-writing:
`node scripts/verify-repository.mjs` in this worktree and in `D:/Projects/fitway`. No test suite,
integration run, browser run, or `verify:fast`/`verify:phase`/`verify:full` ladder was executed, so
no gate result in this record is fresh evidence — the gate evidence cited is the previously
recorded evidence in the named phase records. No commit, branch, worktree, merge, cherry-pick,
rebase, or push occurred, and no file outside this record was created or modified.
