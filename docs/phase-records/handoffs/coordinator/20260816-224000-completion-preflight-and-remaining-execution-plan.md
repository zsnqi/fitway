# FITWAY completion preflight — recovered frontier and remaining execution plan

- Recorded: 2026-08-16 22:40 +03:00.
- Mode: read-only recovery audit. No production code, test, configuration, design file, Paper file,
  branch, worktree, or existing project-state record was changed while producing this plan. Creating
  this document is the only repository write it performed.
- Authority baseline: `main` at `3bb55f644152210e405f15dcbee5ef8602913ffb`, clean.

## Context — why this record exists

The previous Codex orchestration run stopped mid-flight when its local approval/usage service
reported exhaustion (retry after 2026-08-20 16:46) and refused the unsandboxed Vitest and Git
commands the verification ladder requires. It stopped at a stage boundary in one slice and at a
human decision gate in another, leaving two divergent recovery branches and one uncommitted
coordinator ledger transition. This record reconstructs the true frontier from Git, the working
tree, `PROJECT_STATE.yaml`, and the durable phase records, and sequences the remaining authorized
work so a fresh execution agent can continue without reading any conversation history.

It supersedes the resume ordering in
`docs/phase-records/handoffs/coordinator/20260815-221500-frontier-recovery-and-remaining-plan.md`
and in `20260815-010500-remaining-frontier-execution-plan.md`. Those records remain accurate as
history and as standing operational notes.

---

## Part 1 — Recovered frontier

### 1.1 Git topology

| Ref | Head | Base | State |
| --- | --- | --- | --- |
| `main` | `3bb55f6` | — | Coordinator baseline, clean, not final-ready. `origin/main` is a stale `initial commit` 328 behind; **nothing has ever been pushed and nothing may be pushed.** |
| `codex/phase11-audit-gen-recovery` | `1253e10` | merge-base `3bb55f6` | **Current checkout** in `D:/Projects/fitway-worktrees/phase5-staff-integration`. 10 commits ahead. Working tree dirty (see 1.2). |
| `codex/phase10-ui-csv-b03` | `4c253de` | merge-base `3bb55f6` | 13 commits ahead. **Not checked out in any worktree.** Carries the green Phase 10 candidate plus the Paper-fidelity decision gate. |
| `codex/phase10-ui-csv-recovery` | `786d6e3` | merge-base `3bb55f6` | First 6 commits of the b03 line. Strict ancestor of `codex/phase10-ui-csv-b03`; historical only. |
| `work/phase10-ui-csv-b01` | `5b7ad80` | merge-base `95ff3cb` | The originally interrupted b01. Its four commits were replayed onto the recovery line as `b8a2678 / bd9ecf6 / a5ab831 / 7152efa`. **Preserve; do not continue from here.** |

All other `work/*` and `preserve/*` branches are integrated or terminal provenance and require no
further action. `git worktree list` shows 48 worktrees; only
`D:/Projects/fitway-worktrees/phase5-staff-integration` is live for the remaining work.

### 1.2 Uncommitted work in the current checkout — valid, must be preserved

```
 M PROJECT_STATE.yaml
?? docs/phase-records/handoffs/phase11-audit-generalization/
     20260816-222500-p11_audit_gen_c01-approval-service-blocked-handoff.md
```

Both are the coordinator's own durable `BLOCKED` transition, written but never committed because
Git metadata writes required the unavailable approval service. The ledger diff moves
`phase11-audit-generalization` from `IN_PROGRESS` to `BLOCKED`, sets `unit: PASS`, nulls
`ownerSession`, repoints `handoff`, and records the stop reason. **This is correct and complete —
commit it as-is; do not re-derive it.**

### 1.3 Coordinator ledger has diverged across the two recovery branches

`PROJECT_STATE.yaml` was edited independently on both branches, from the same `3bb55f6` base, in
**disjoint hunks**:

- `codex/phase11-audit-gen-recovery` carries only the `phase11-audit-generalization` section.
- `codex/phase10-ui-csv-b03` carries only the Phase 10 sections: `phase10-ui-csv` →
  `FAILED_VALIDATION` (terminal b02, repair 2/2), a **new** `phase10-ui-csv-b03` milestone →
  `NEEDS_HUMAN`, and `phase-10.dependencies` repointed from `phase10-ui-csv` to
  `phase10-ui-csv-b03`.

Neither branch sees the other's transition. Reconciling the union is a required, explicit
coordinator step (Stage S0). The two branches also declare the **same** worktree
(`D:/Projects/fitway-worktrees/phase5-staff-integration`); `scripts/verify-repository.mjs:191-198`
rejects two milestones sharing a worktree while both are in an active status, so the ledger itself
enforces one-writer serialization between them. Never activate both at once.

### 1.4 Milestone truth table

**Durably closed — do not reopen.** `phase-1`, `phase-2`, `phase-3`,
`baseline-reconciliation-gate`, `phase4-auth`, `phase4-health`, `phase4-staff-web`, `phase-4`,
`phase5-command-domain`, `phase5-staff-ui`, `phase-5`, `phase-6`, `phase7-reset-evaluator`,
`phase7-integration-b02`, `phase-7`, `phase8-alert-evaluator`, `phase8-integration`, `phase-8`,
`phase9-analytics-domain`, `phase9-owner-ui`, `phase-9`, `phase10-domain`,
`phase10-paper-reporting`, `phase10-csv-transport`, `phase11-shell`, `phase11-audit`,
`phase11-health`, `phase-12`. Each has an `integratedCommit` and all gates `PASS`/`NOT_REQUIRED`.

**Terminal preserved provenance — no work indicated.** `phase7-integration` (`FAILED_VALIDATION`,
b01, superseded by `phase7-integration-b02` `DONE`); `phase10-ui-csv` (`FAILED_VALIDATION` on the
b03 branch, terminal b02, superseded by the b03 line).

**Interrupted / open frontier.**

| Milestone | Repository truth | Classification |
| --- | --- | --- |
| `phase11-audit-generalization` | `BLOCKED` (uncommitted transition). Candidate `1253e10`. Migration `0007`, generalized schema, governance builders, `effectiveValue: null` filter, 800-line PostgreSQL integration test, and a leased one-file Phase 7 fixture repair are all **committed**. Unit gate PASS (3 files / 35 tests). Integration and independent review **PENDING**. | **Interrupted at the verification gate.** Implementation complete for Slice A; not verified, not integrated. |
| `phase10-ui-csv-b03` | `NEEDS_HUMAN` on the b03 branch. Candidate `96875e1` (decision-gate commit `4c253de`). Gates: unit/integration/browser/accessibility **PASS**, visual **FAIL** on Paper hierarchy, independent review PENDING. `verify:phase`, `verify:fast`, and `check-types` all recorded PASS at `20260816-205000`. | **Verified candidate blocked on a now-resolved human decision.** Needs a bounded fidelity repair, then review and integration. |
| `phase-10` | `PLANNED`, dependency repointed to `phase10-ui-csv-b03`. | Remaining aggregate. |
| `phase11-access` | `PLANNED`. All human decisions resolved and immutable (`20260811-154032`). Blocked only on `phase11-audit-generalization` reaching `DONE`. | Remaining, greenfield, plan-ready. |
| `phase11-settings` | `PLANNED`. Blocked on the same. No authority packet or reviewed plan exists yet. `settings_versions` table already exists; there is **no settings write path in non-test code**. | Remaining; needs a plan + independent design review first. |
| `phase-11` | `PLANNED`, depends on all six Phase 11 slices. | Remaining aggregate. |
| `login-paper-adoption` | `PLANNED`. Preserved candidate `9b65356`; terminal b01 failure was a **test-locator** defect only (`getByRole("button", { name: "Open operations" })` vs the `Signing in…` submitting name). Its record states no implementation change is indicated. | Remaining; reuse the candidate under a fresh attempt record. |
| Product-wide focus-parity accessibility gap | Recorded in `20260815-031500-focus-parity-gap.md`, coordinator-confirmed. **Not a tracked milestone.** Three concrete gaps in `apps/web/src/index.css`, `apps/web/src/components/staff/staff.css`, `apps/web/src/components/owner/owner-shell.css`. | Remaining; must be added to the ledger before it can be worked. |
| Canonical screenshot baselines for `/staff`, `/login`, `/admin`, Owner reporting | Required by the standing human decision; current baseline count is 8 and the Phase 10 candidate adds none. | Remaining; human-approved serialized pass. |

### 1.5 Two facts that materially change the sequencing

1. **The `phase10-ui-csv-b03` contract cannot carry the Paper-fidelity repair.** Its `ownedPaths`
   are exactly `tests/browser/phase10-ui-csv.browser.spec.ts` plus its handoffs, and its
   `forbiddenPaths` name *"all production code, including … apps/web/**"*. b03 was a test-only
   attempt. The authorized repair writes
   `apps/web/src/components/owner/reporting/owner-reporting-section.tsx` and its CSS/tests, so it
   **requires a fresh activation (`b04`)** with widened owned paths — not an amendment claimed
   under b03.
2. **Slice B of the audit generalization is on the critical path to Access and Settings.**
   `scripts/verify-repository.mjs:162-170` forbids a milestone entering an active status while any
   dependency is not `DONE`. The reviewed correction plan (`20260816-214500…scope-correction-plan-v2`)
   states explicitly that integrating the backend foundation leaves `phase11-audit-generalization`
   `IN_PROGRESS`. Therefore `phase11-access` and `phase11-settings` stay legally blocked until the
   atomic shared-DTO + `apps/web` audit-view switch (Slice B) is integrated.

---

## Part 2 — True dependency critical path

```
S1 Slice A verify+integrate  ──►  S2 Phase 10 fidelity repair (b04)  ──►  S3 phase-10 aggregate
                                            │
                                            └─ releases the /admin + router + context wiring lease
                                                            │
                                                            ▼
                                     S4 Slice B (shared DTO + apps/web audit view, atomic)
                                                            │
                                          ┌─────────────────┴─────────────────┐
                                          ▼                                   ▼
                                  S5 phase11-access                   S6 phase11-settings
                                          └─────────────────┬─────────────────┘
                                                            ▼
                       S7 focus-parity a11y  ─►  S8 login-paper-adoption  ─►  S9 canonical baselines
                                                            │
                                                            ▼
                                          S10 phase-11 aggregate  ─►  S11 final DoD closure
```

Ordering rationale, not phase numbering:

- **S1 before S2** because Slice A is already at its gate with a complete candidate, is backend-only,
  and both branches contend for the same physical worktree. Integrating Slice A first means Phase 10
  is carried forward onto a `main` that already has migration `0007` — and Phase 10's integration and
  browser ladders must be re-run after the fidelity repair anyway, so this costs nothing extra. The
  reverse order would force a redundant re-run of Slice A.
- **S2/S3 before S4** because `phase10-ui-csv` holds an exclusive lease through 2026-08-22T18:45 on
  `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`,
  and `apps/web/src/routes/admin.tsx` — the exact paths `phase11-audit-generalization` lists as
  forbidden for that reason. Slice B also lands in `apps/web`, and `apps/web` work is strictly
  serialized (`20260815-221500`, "One-writer discipline").
- **S5/S6 after S4** by the ledger dependency invariant above.
- **S7–S9 after S6** because every one of them lands in `apps/web` and gates on the same `/admin`
  and public browser specs.

---

## Part 3 — Execution stages

Global rules that apply to **every** stage below and are not repeated in each:

- One writer at a time. Read-only review may run concurrently with a writer; two writers may not.
- Every run sets a unique `FITWAY_RUN_ID`, a unique disposable Postgres database whose name
  contains that run ID, and a run-scoped artifact directory (`docs/WORKFLOW.md` §Resource isolation).
- A passing run leaves `git status --short` byte-identical to its pre-run state (mutation guard).
- Root-run verification requires the machine-local root `.env` loaded with `CRON_SECRET`,
  `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`; `pnpm verify:fast` rejects a set `FITWAY_PHASE`.
- **Playwright and any command taking an `/api`-shaped argument must run from PowerShell.** Git Bash
  rewrites it to a Windows path and the run fails for that reason alone.
- Canonical `toHaveScreenshot` baselines are coordinator-owned read-only acceptance evidence. A
  canonical diff is a stop condition, never a regeneration.
- Two focused repairs maximum per attempt; the third recurrence of the same failed gate is
  `FAILED_VALIDATION`. A material visual change is `NEEDS_HUMAN`.
- Never push, never deploy, never provision external systems.

### S0 — Ledger reconciliation and blocked-state commit *(coordinator, no implementation)*

- **Objective.** Make the durable ledger reflect the union of both recovery branches before any
  writer starts.
- **Start point.** `codex/phase11-audit-gen-recovery` at `1253e10` in
  `D:/Projects/fitway-worktrees/phase5-staff-integration`, working tree as-is.
- **Inputs.** The uncommitted `PROJECT_STATE.yaml` diff; the untracked
  `20260816-222500-p11_audit_gen_c01-approval-service-blocked-handoff.md`;
  `codex/phase10-ui-csv-b03:PROJECT_STATE.yaml`; this plan.
- **Writable scope.** `PROJECT_STATE.yaml`, `docs/phase-records/handoffs/coordinator/**`, and the
  already-authored Phase 11 handoff. Nothing else.
- **Work.**
  1. Commit the existing uncommitted `BLOCKED` transition and its handoff **unchanged**.
  2. Merge `codex/phase10-ui-csv-b03`'s ledger hunks into the working ledger: `phase10-ui-csv` →
     `FAILED_VALIDATION` with its stop reason, the new `phase10-ui-csv-b03` milestone, and
     `phase-10.dependencies` → `[phase10-domain, phase10-paper-reporting, phase10-csv-transport,
     phase10-ui-csv-b03]`.
  3. Record the human decision of 2026-08-16 — *repair Phase 10 to the approved Paper hierarchy; do
     not supersede Paper* — as a coordinator decision record, and move `phase10-ui-csv-b03` off
     `NEEDS_HUMAN`. Preserve `20260816-211500-p10_ui_csv_b03-paper-fidelity-needs-human.md` verbatim
     as immutable provenance.
  4. **Resolve the repair-budget discrepancy explicitly.** The ledger records
     `phase11-audit-generalization.validationRepairAttempts: 2`; the independently reviewed
     correction plan declares the c01 slice at `0/2`. Precedent in this repository (`phase-6` b03,
     `phase10-ui-csv` b03) is that a fresh attempt with its own reviewed plan and attempt record
     starts at `0/2`. Either write that reset with its rationale into the ledger, or proceed under
     the conservative reading that no repair remains. Do not leave it ambiguous.
  5. Add the focus-parity accessibility slice as a tracked `PLANNED` milestone so it cannot be lost.
- **Gate.** `node scripts/verify-repository.mjs` (or `pnpm verify:fast`) must pass the ledger
  invariants: no active-status milestone sharing a branch or worktree, no expired lease on an active
  milestone, no dependency-ready milestone with a non-`DONE` dependency, every stopped milestone
  carrying a stop reason and every non-stopped milestone carrying none.
- **Closure.** Ledger committed on `codex/phase11-audit-gen-recovery`; a coordinator record naming
  this plan and the resolved decisions exists.
- **Precondition, environmental — two distinct authorities, resolved separately.** The approval
  service reported usage exhausted until 2026-08-20 16:46 and refused both unsandboxed Vitest **and**
  Git metadata writes; the sandbox path fails with child-process `EPERM`. Apply this rule exactly:
  - **Git writes available, unsandboxed Vitest unavailable.** S0 completes in full, including its
    commits. **S1 waits** until Vitest runs unsandboxed — no verification gate may be claimed,
    skipped, or run in the failing sandbox.
  - **Git writes also unavailable.** S0 **cannot** complete: its required commits are Git metadata
    writes. **Preserve the current dirty working tree exactly as it stands** — no stash, reset,
    discard, branch switch, or history rewrite — and stop before S0's commit boundary until Git write
    authority is restored. Documentation may be drafted, but nothing after that boundary proceeds.
  - In both cases the requirement is unchanged: **the existing dirty `BLOCKED` transition and its
    handoff must be committed unchanged before any later execution stage proceeds.** No stage from S1
    onward may start on top of an uncommitted ledger.

### S1 — Phase 11 audit generalization, Slice A: verify and integrate the backend foundation

- **Objective.** Close the interrupted verification gate on the existing candidate and integrate the
  backend foundation. **This does not complete the milestone**; it stays `IN_PROGRESS`.
- **Start point.** `codex/phase11-audit-gen-recovery` at the S0 commit, in
  `D:/Projects/fitway-worktrees/phase5-staff-integration`. Review boundary `3bb55f6..candidate`.
- **Authoritative inputs.** `20260815-224500-audit-generalization-proposal-v4.md` (the approved
  design; `IMPLEMENTATION_READY`); `20260816-214500-p11_audit_gen_c01-scope-correction-plan-v2.md`
  (the corrected slice boundary, independently plan-reviewed `PASS` at `20260816-215500`);
  `20260816-221500-p11_audit_gen_c01-phase7-fixture-repair-plan.md` (the leased one-file fixture
  repair, plan-reviewed `PASS`); `20260815-013000-audit-generalization-design.md`;
  `20260811-154032-p11_access-authority-resolved-capacity-blocked.md` (human-locked action set).
- **Writable scope.** Exactly the milestone's `ownedPaths`: `packages/db/src/schema/application.ts`,
  `packages/db/src/migrations/0007_*`, `meta/0007_snapshot.json`, `meta/_journal.json`,
  `packages/api/src/audit/**`, `apps/server/src/audit-repository.ts(.test.ts)`,
  `apps/server/src/phase11-audit-generalization.integration.test.ts`, the leased
  `apps/server/src/phase7-integration.integration.test.ts`, and this slice's handoffs. Forbidden:
  all of `apps/web/**` and `tests/browser/**`; `packages/api/src/context.ts`,
  `packages/api/src/routers/index.ts`, `apps/server/src/index.ts` (live Phase 10 wiring lease);
  migrations `0000`–`0006`.
- **Planning/review before implementation.** Already done and passed. **No new implementation is
  expected in this stage** — the candidate is complete through `1253e10`.
- **Implementation work.** None planned. Only repairs arising from the gates below, inside the
  repair budget resolved in S0.
- **Validation gates, in order.**
  1. Read-only preflight: count rows in the real `fitway_local_coord.audit_log`. **Any non-zero,
     non-conforming row is a hard stop** — audit rows are immutable and are never repaired to make a
     migration apply.
  2. Focused Vitest on the exact `c01` resource: `packages/api/src/audit/list.test.ts`,
     `packages/api/src/audit/governance.test.ts`, `apps/server/src/audit-repository.test.ts`.
  3. `apps/server/src/phase11-audit-generalization.integration.test.ts` and
     `apps/server/src/phase11-audit.integration.test.ts` against
     `fitway_integration_p11_audit_gen_c01`, run serially.
  4. `pnpm check-types` across all workspace projects.
  5. `pnpm verify:fast`, with a clean mutation guard.
  6. `git diff --check` plus an exact `3bb55f6..candidate` scope audit.
  - Note: `scripts/verify.mjs` has **no** `phase11-audit-generalization` profile. Adding one is a
    coordinator-owned change to a file this milestone forbids; either add it in a separate
    coordinator commit outside the candidate, or run the focused commands directly and record them.
- **Independent review.** Required. A fresh read-only verifier on resource `p11_audit_gen_v01` /
  `fitway_integration_p11_audit_gen_v01`, reviewing `3bb55f6..candidate` against proposal v4, the
  correction plan, and the activation record — **without** the implementer's reasoning, and without
  resuming or forking the implementing session. It must independently confirm the v4 verification
  list: null-role rejection on both the command and governance paths; omitted-issuer rejection and
  explicit-null acceptance; action↔class binding rejected at write; the four count columns closed on
  governance rows; rotation without a reason accepted; both deactivations without a reason rejected;
  a ticket-number reason **accepted**; credential versions sourced from `auth_principals` inside the
  mutation transaction with no input channel; and `phase7-integration.integration.test.ts` green.
- **Repair/failure handling.** Repair budget as resolved in S0. A third recurrence of the same failed
  gate is `FAILED_VALIDATION` — preserve the branch and candidate, write the terminal record, stop.
- **Durable updates before proceeding.** A candidate handoff in the WORKFLOW format; the verifier's
  finding record; the ledger updated with the integrated commit, released Phase 7 fixture lease, and
  `phase11-audit-generalization` **remaining `IN_PROGRESS`** with a stop reason of `null` and an
  explicit note that Slice B is outstanding.
- **Integration and closure.** Only on verifier `PASS`. Merge to `main`, run focused checks after the
  shared-spine integration, confirm the worktree is clean, record the integrated commit. Do not mark
  the milestone `DONE`.

### S2 — Phase 10 owner reporting: authorized Paper-fidelity repair *(new attempt `b04`)*

- **Objective.** Bring the green Phase 10 candidate into fidelity with the approved Paper
  composition, then re-close its browser/a11y/visual gates.
- **Start point.** A **fresh activation, branch, and worktree (`b04`) created from post-S1 `main`.**
  The valid b03 candidate is carried forward into `b04` by a **non-destructive** repository-appropriate
  method — merge or replay of `codex/phase10-ui-csv-b03`'s content onto the new branch. Do not reuse
  the b03 contract (see 1.5(1)).
- **`codex/phase10-ui-csv-b03` is immutable provenance.** It is **not** rebased, rewritten,
  force-moved, amended, or deleted. Its ref stays exactly at `4c253de` and every one of its records —
  including the terminal b02 record, the diagnosis correction, the validation-pass record, and the
  Paper-fidelity `NEEDS_HUMAN` record — remains unchanged. The `b04` candidate legitimately contains
  the inherited b03 work **plus** the authorized Paper-fidelity repair; b03's own history does not
  move to make that true.
- **Authoritative inputs.**
  - Paper file `01KYPX5AF950XZVVDD88B6J7QB`, `FITWAY UX Exploration` / Page 1 /
    `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` (`17YY-0`), token hash `3b0faca3`.
    **Paper is the composition authority** (`docs/adr/ADR-007-paper-visual-source-of-truth.md`); the
    2026-08-16 human decision chose repair over superseding.
  - `20260816-211500-p10_ui_csv_b03-paper-fidelity-needs-human.md` — the exact finding.
  - `20260816-205000-p10_ui_csv_b03-recovery-validation-pass.md` — the passing ladder to re-close.
  - `DESIGN_GUIDE.md` for responsive, RTL, interaction, and accessibility behavior.
  - Paper desktop MCP tools appear bound in the current tool surface
    (`mcp__plugin_paper-desktop_paper__*`), unlike the 2026-08-15 record which had to reach Paper by
    raw JSON-RPC on `http://127.0.0.1:29979/mcp`. Confirm at run time; either path is acceptable.
- **Required change, stated concretely.** Paper's order is: page heading and local switch →
  **independent reporting and CSV ranges grouped together** → dominant 7×24 heatmap →
  comparison/disclosure. The candidate currently renders range (`owner-reporting-section.tsx:118-177`),
  heatmap (`:179-206`), comparison (`:208-218`), export (`:220`). Repair: group the reporting and CSV
  range controls ahead of heatmap and comparison; two columns at desktop, stacked at `≤820px`; and
  reconcile the extension's placement with Paper's reporting page composition rather than leaving it
  embedded below the sibling Owner sections. Hold this ordering at 1440 / 768 / 390 / 320 in both
  English LTR and Arabic RTL.
- **Writable scope for `b04`.** `apps/web/src/components/owner/reporting/**`,
  `apps/web/src/hooks/use-owner-reporting.ts(.test.tsx)`,
  `tests/browser/phase10-ui-csv.browser.spec.ts`, and this attempt's handoffs. Under the inherited
  wiring lease (exclusive through 2026-08-22T18:45, extend if needed):
  `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`,
  `apps/web/src/routes/admin.tsx` — wiring only. Forbidden: the frozen reporting contracts
  (`contracts.ts`, `csv.ts`, `reporting.ts`, `csv-transport.ts`), `apps/server/src/reporting-repository.ts`,
  all of `packages/db/**`, `apps/web/src/i18n/**`, `apps/web/src/routeTree.gen.ts`, every
  `tests/browser/__screenshots__/**` subtree, `PROJECT_STATE.yaml`, `scripts/verify.mjs`, and every
  other slice's surfaces.
- **Planning/review before implementation.** Yes — a bounded fidelity plan derived from the rendered
  Paper composition (not from layer names), independently plan-reviewed before any edit, because this
  is a material composition change to an already-green candidate.
- **Validation gates.** Re-run the full recorded ladder, because migration `0007` from S1 is now in
  the applied set: `pnpm check-types`; `pnpm verify:phase --phase phase10-ui-csv` (which already
  includes the sibling `/admin` browser profile — Phase 10 plus `phase11-audit` and siblings, ~29
  tests covering RTL/LTR, responsive, keyboard, reduced motion, and automated accessibility);
  `pnpm verify:fast`; and the Phase 10 integration file against a run-unique disposable database.
  Then the UI polish loop of `docs/WORKFLOW.md` §140 across 320/390/768/820/1024/1440 in both
  locales and both directions.
- **Visual gate.** A **read-only** rendered fidelity comparison against Paper `17YY-0`, performed by
  someone other than the implementer, closing the five FAIL rows of the b03 coverage matrix. Do not
  edit Paper. Do not regenerate canonical baselines here.
- **Independent review.** Required, fresh, over the complete Phase 10 candidate: scope, contracts vs.
  Product/Spec/Design Guide/ADR-007, a clean-run-ID re-run, and fresh browser/a11y/visual inspection.
- **Repair/failure handling.** `b04` starts at `0/2`. A second material composition disagreement with
  Paper is `NEEDS_HUMAN`, not a third repair.
- **Durable updates.** New activation record, worker handoff, fidelity-comparison record, verifier
  record; ledger updated. Preserve every b02/b03 record unchanged.
- **Closure.** On verifier `PASS`, integrate to `main`, mark the Phase 10 UI/CSV milestone `DONE`
  with its integrated commit, and **release the wiring lease** — S4 depends on that release.

### S3 — `phase-10` aggregate

- **Objective.** Coordinator acceptance of Phase 10 as a whole.
- **Start point.** `main` at the S2 integration commit.
- **Inputs.** `PHASES.md` §"Phase 10", the four slice records, `docs/phase-records/phase-09-aggregate.md`
  as the format precedent.
- **Writable scope.** `docs/phase-records/phase-10-aggregate.md` and `PROJECT_STATE.yaml`.
- **Gate.** `pnpm verify:full` on `main`, clean mutation guard. Confirm weekday/hour heatmap,
  week-over-week comparison, date range, and owner-only streamed CSV with UTC and gym-local time;
  closed / missing / zero remaining distinct; CSV UTF-8, spreadsheet-safe, Western digits, authorized
  private fields only.
- **Closure.** `phase-10` → `DONE` with its integrated commit. Independent review of the aggregate
  record is required per the precedent set by `phase-9`.

### S4 — Phase 11 audit generalization, Slice B: the atomic DTO and web switch

- **Objective.** Complete `phase11-audit-generalization` by switching the shared audit list output
  from command-only to all eleven actions, **atomically** with its `apps/web` consumer.
- **Start point.** Fresh branch and worktree from `main` at the S3 commit.
- **Why it must be atomic.** Independent plan review already rejected splitting this. Widening the
  shared output type while `apps/web/**` is forbidden fails typechecking, and casting around it would
  render governance actions as `undefined`. The Slice A mapper deliberately **fails closed** on
  governance rows until this switch lands.
- **Authoritative inputs.** Proposal v4 §D3 (the target read path), the correction plan v2's Slice B
  paragraph, the human-locked seven access action labels plus `settings_updated`, and the secret-free
  audit rule.
- **Writable scope.** `packages/api/src/audit/**`, `apps/server/src/audit-repository.ts`,
  `apps/web/src/components/owner/audit/**`, `apps/web/src/hooks/use-owner-audit.ts(.test.tsx)`,
  `tests/browser/phase11-audit.browser.spec.ts`, and the relevant integration tests. Forbidden:
  `packages/db/**` (migration `0007` is frozen once integrated), the Phase 5 command service and
  audit append semantics, `apps/web/src/i18n/**` and `routeTree.gen.ts`, canonical baselines.
- **Implementation work.** The eleven-action DTO and mapper; the second aliased join resolving the
  **target** principal's display name; the target column in
  `apps/web/src/components/owner/audit/owner-audit-view.tsx` with a bilingual header and an honest
  empty rendering for command rows, which have no target; bilingual labels for all eleven actions;
  target and from/to rendering; the `effectiveMode` filter control consuming the
  `effectiveValue: null` semantics Slice A already installed; and updating the assertion in
  `owner-audit-view.test.tsx:235` that currently expects exactly six `thead th[scope='col']`.
- **Gates.** Focused unit/component; the Phase 11 audit and generalization integration suites; the
  `phase11-audit` browser profile including RTL/LTR, keyboard, reduced motion, and automated
  accessibility; a governance row rendered in both locales and both directions with its target
  resolved; `pnpm check-types`; `pnpm verify:phase`; `pnpm verify:fast`.
- **Independent review.** Required, fresh, with browser/a11y inspection.
- **Closure.** Integrate; mark `phase11-audit-generalization` **`DONE`** with all gates. This is the
  event that unblocks S5 and S6 under the ledger invariant.

### S5 — `phase11-access`

- **Objective.** PIN provision/rotate/deactivate and real owner account management, fully audited.
- **Start point.** Fresh branch and worktree from `main` at the S4 commit.
- **Authoritative inputs.** `20260811-154032-p11_access-authority-resolved-capacity-blocked.md` —
  the human decisions are **resolved and immutable**: no self-deactivation; no deactivation of the
  last active owner; deactivation targets the principal and invalidates its credentials and active
  sessions; reactivation is an explicit separate action; no hard delete in V1; staff PINs are
  system-generated, 6–12 Western digits, revealed once and never emailed; owner password reset is
  in-app with no email flow; the seven-action secret-free audit set with a reason required only for
  destructive actions. Plus `PHASES.md` §"Phase 11", `SPEC.md`, and `FITWAY_PRODUCT.md`.
- **Planning/review before implementation.** Yes. No authority packet exists for the *implementation*
  shape; author a bounded plan and have it independently reviewed before any edit.
- **Writable scope.** New access API/server surfaces, the governance write path, `/admin` access UI,
  its browser spec, and its handoffs, under an explicit wiring lease for
  `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`,
  `apps/web/src/routes/admin.tsx`. Forbidden: migration `0007` and all of `packages/db/**` unless a
  fresh coordinator-serialized migration is separately reviewed and authorized; the frozen Phase 5
  command surfaces; the Staff surface (ADR-008 keeps `/staff` monitoring-only).
- **Non-negotiable implementation constraints.** Credential versions are read from the
  `auth_principals` row **inside the same transaction as the mutation**, never from procedure input,
  and no input schema carries a credential-version field. Audit prior/new state may carry only
  non-secret state. Every mutation is validated, atomic, audited, and versioned. Owner-only
  procedures keep canonical 401/403 behavior.
- **Gates.** Focused unit; disposable-Postgres integration proving each locked lifecycle rule and
  each secret-exclusion rule; the `/admin` browser profile **listing every sibling `/admin` spec from
  activation** — `scripts/verify.mjs` must gain a `phase11-access` profile in its activation commit;
  the full UI polish loop; `verify:phase`; `verify:fast`.
- **Independent review.** Required, fresh, including a security-oriented pass on the secret-free
  audit contract.
- **Closure.** Integrate; `phase11-access` → `DONE`.

### S6 — `phase11-settings`

- **Objective.** Append-only capacity, thresholds, schedule, business-day, reset, and freshness
  configuration, audited as `settings_updated`.
- **Start point.** Fresh branch and worktree from `main` at the S5 commit.
- **Authoritative inputs.** `PHASES.md` §"Phase 11", `SPEC.md`, `FITWAY_PRODUCT.md`, and the
  existing `settings_versions` table in `packages/db/src/schema/application.ts:151-241` with its
  capacity, band-order, timezone, push-interval, freshness, reset-buffer, and per-day schedule-pair
  checks.
- **Planning/review before implementation — mandatory and larger than the other slices.** There is
  **no settings write path anywhere in non-test code**, so this slice authors both the write path and
  its audit representation. Author the plan, then have it independently design-reviewed before any
  edit, exactly as the audit generalization was.
- **Locked product semantics.** A capacity change may change the public **band** on the next payload
  but never exposes a public percentage or denominator. Historical analytics are unchanged because
  rows carry snapshots. Public schema v2 stays capacity-free. Every mutation is validated, atomic,
  audited, and versioned.
- **Writable scope.** New settings API/server surfaces, the write path, `/admin` settings UI, its
  browser spec, and handoffs, under an explicit wiring lease. `scripts/verify.mjs` gains a
  `phase11-settings` profile listing all sibling `/admin` specs in the activation commit.
- **Gates and review.** Same shape as S5, plus integration proof that a capacity change alters the
  public band without exposing a denominator and leaves historical analytics untouched.
- **Closure.** Integrate; `phase11-settings` → `DONE`.

### S7 — Product-wide focus-parity accessibility slice

- **Objective.** Close the three recorded accessibility gaps on shared surfaces.
- **Start point.** Fresh branch and worktree from `main` at the S6 commit.
- **Authoritative input.** `20260815-031500-focus-parity-gap.md` — coordinator-confirmed, with the
  fix shape already proved by the `phase11-shell` candidate.
- **Ownership note — S7 owns the `/login` focus-parity work.** The shared `/login` forced-colors and
  skip-link treatment lives in `staff.css`, which already scopes the `/staff`, board, **and login**
  shells. It is assigned to this stage and to this stage only. S8 does not redo it and does not own
  it; the two stages therefore cannot leave each other inconsistent.
- **Writable scope, exactly three files plus tests.** `apps/web/src/index.css` (public skip link and
  a `forced-colors` focus block); `apps/web/src/components/staff/staff.css` (the `/staff`, board, and
  **`/login`** shells' skip link and a `forced-colors` focus block);
  `apps/web/src/components/owner/owner-shell.css`
  (include `.operations-skip-link` in the reduced-motion block at equal or higher specificity than
  the `0,2,0` selector at `:57-58`). These files belong to already-`DONE` milestones, so this
  **requires its own activation and explicit shared-file lease** — that is precisely why the
  `phase11-shell` b02 worker correctly declined to fix it in place.
- **Implementation constraint.** Keep `:focus-visible` for the ordinary treatment so approved
  compositions are untouched; add `:focus` **only** where the element is off-screen at rest or where
  forced-colors mode has discarded the ordinary indicator. A blanket `:focus` would change
  pointer-interaction appearance, which `DESIGN_GUIDE.md` §11 does not sanction.
- **Gates.** Focused browser evidence under forced-colors emulation and `prefers-reduced-motion:
  reduce` on `/`, `/staff`, `/login`, and `/admin`; every sibling browser spec including the
  canonical comparisons — a canonical diff here is a stop condition; `verify:phase`; `verify:fast`.
- **Independent review.** Required, with fresh accessibility inspection.
- **Closure.** Integrate; the tracked slice → `DONE`.

### S8 — `login-paper-adoption`

- **Objective.** Land the preserved, visually accepted `/login` Paper adoption.
- **Start point.** Fresh attempt (`b03`) reusing preserved candidate `9b65356`, carried onto `main`
  at the S7 commit. Repair counter `0/2`; the b01 terminal record and the
  `work/login-paper-adoption-b01` ref stay immutable.
- **Authoritative inputs.** `20260810-000500-login_paper_coord01-failed-validation.md` and
  `20260811-133335-login_paper_b02-preactivation-blocked.md`. Both state the failure was a
  **test-locator** defect and that **no implementation change is indicated**: the submitting-state
  assertions reuse `getByRole("button", { name: "Open operations" })`, but the accessible name
  becomes `Signing in…` during submission.
- **Writable scope.** The `/login` composition files already in the preserved candidate plus its
  browser spec. Do not rebuild the accepted Paper composition. **The `/login` forced-colors and
  focus-parity CSS is owned by S7 and is already integrated by the time this stage runs — do not
  re-implement it, re-own it, or modify `staff.css` here.** This stage reuses the preserved Paper
  candidate, fixes the known locator/test-boundary defect, and runs its deferred verification and
  Paper comparison; nothing more.
- **Gates.** Replace the locator with a stable owned selector; rerun the focused spec; then the
  deferred Phase 4 and full verification ladders, visual/responsive/accessibility/RTL/zoom/build/type/Biome.
- **Independent review.** Required, fresh, with visual inspection against Paper.
- **Closure.** Integrate; `login-paper-adoption` → `DONE`.

### S9 — Canonical screenshot baseline pass *(human-approved, serialized)*

- **Objective.** Establish canonical `toHaveScreenshot` baselines for the final adopted Paper
  surfaces `/staff`, `/login`, `/admin`, and Owner reporting.
- **Start point.** `main` at the S8 commit, with every UI surface final.
- **Why last.** Baselines taken before S2, S4, S7, and S8 would be invalidated by each of them.
- **Human gate.** `docs/WORKFLOW.md` §114-117 and §152-153: a new platform baseline is generated or
  approved **only in a serialized human-approved pass using the locked browser/toolchain**, and
  human approval is required to update a canonical baseline. Rendering is not assumed portable
  across operating systems. This stage cannot be completed autonomously.
- **Writable scope.** `tests/browser/__screenshots__/win32/chromium/**` only, plus the record.
  `scripts/verify-repository.mjs` asserts the canonical approval-screenshot count; update it in the
  same coordinator commit.
- **Closure.** Baselines committed with the human approval recorded in the phase record.

### S10 — `phase-11` aggregate

- **Objective.** Coordinator acceptance of Phase 11.
- **Start point.** `main` after S9.
- **Dependencies.** All six slices `DONE`: `phase11-shell`, `phase11-audit`,
  `phase11-audit-generalization`, `phase11-access`, `phase11-settings`, `phase11-health`.
- **Gate.** `pnpm verify:full` on `main`, clean mutation guard, plus an independent review of the
  aggregate record.
- **Closure.** `phase-11` → `DONE`.

### S11 — Final Definition-of-Done closure

- **Objective.** Prove the whole repository green and record closure.
- **Gate.** `pnpm verify:full` on `main` from a clean tree with the root `.env` loaded: repository
  invariants, Biome, all workspace type/build checks, the full unit/component suite, the Python
  simulator suite, full disposable-Postgres integration across every phase suite, the complete
  browser and automated-accessibility profile, and visual comparison against the canonical baselines.
- **Writable scope.** A final coordinator closeout record and `PROJECT_STATE.yaml`.
- **Explicitly out of scope.** The external go-live gates in `RESEARCH.md` — site checks, production
  database and Vercel provisioning, spend controls, credentials, actual capacity/thresholds/hours/timezone,
  hardware and feed geometry, transparency wording, and owner sign-off. `PHASES.md:303-308` states
  these do not permit speculative implementation and do not weaken the Definition of Done.
- **Prohibited at closure.** Pushing, deploying, or provisioning anything external.

---

## Part 4 — Genuine human-only items

**Unresolved and genuinely human:**

1. **Canonical screenshot baseline approval (S9).** A standing workflow requirement, not a
   manufactured one. Approving a new canonical baseline is a human act; an agent may prepare the
   serialized pass but may not approve it.
2. **External go-live gates (`RESEARCH.md`).** Human and external by definition. Outside the
   Definition of Done and outside this plan.

**Environmental, not a product decision, but blocking S1:**

3. **Local execution authority — two separate authorities.** The approval/usage service reported
   exhaustion until 2026-08-20 16:46 and refused unsandboxed Vitest **and** Git metadata writes; the
   sandbox path fails with child-process `EPERM`. Per S0: if Git writes work but Vitest does not, S0
   completes and **S1 waits**; if Git writes are also unavailable, **preserve the dirty tree and stop
   before S0's commit boundary**. Either way, no stage from S1 onward runs on an uncommitted ledger.
   This is a capacity/permission matter for the user to restore, not a decision to make.

**Explicitly NOT human blockers — already resolved by repository authority; do not re-escalate:**

- Phase 10 Paper fidelity. Resolved by the human on 2026-08-16: repair to the approved Paper
  hierarchy; do not supersede Paper. `phase10-ui-csv-b03`'s `NEEDS_HUMAN` is discharged by S0.
- Phase 11 access lifecycle, credential, and secret-free audit decisions. Resolved 2026-08-11 and
  immutable.
- The `reason` digit-run rule. Dropped in proposal v4 with executed evidence; declining to add a
  restriction required no authority. The named residual — an operator can type a secret into a
  free-text reason — is carried to go-live operator guidance, not re-opened.
- `/staff` stays monitoring-only (ADR-008); no product surface issues a command. Public schema v2
  stays capacity-free. Staff composition carries no visible capacity (2026-08-09 decision).
- The `phase11-audit-generalization` repair-budget discrepancy. A coordinator ledger decision with
  clear precedent, resolved in S0 — not a human escalation.

---

## Part 5 — What must not be disturbed

- The current checkout, its branch, and its dirty state until S0 commits them. No stash, reset,
  discard, branch switch, or history rewrite.
- Every preserved and terminal record: `phase7-integration` b01, `phase10-ui-csv` b02 and its
  diagnosis correction, `20260816-211500-p10_ui_csv_b03-paper-fidelity-needs-human.md`, the three
  rejected audit-generalization design rounds, the `login-paper-adoption` b01 closeout, and the
  `preserve/*` branches.
- The refs themselves: `codex/phase10-ui-csv-b03` stays at `4c253de`, `codex/phase10-ui-csv-recovery`
  at `786d6e3`, and `work/phase10-ui-csv-b01` at `5b7ad80`. No rebase, amend, force-move, or delete
  of any recovery or preserved branch. S2 carries b03's content forward without moving b03.
- All 28 `DONE` milestones and their integrated commits.
- Migrations `0000`–`0006`, and `0007` once S1 integrates it.
- Canonical `toHaveScreenshot` baselines until the human-approved pass in S9.
- Paper. Every stage above reads Paper; none writes it.

---

## Deliverable of this preflight

This document, at:

```
docs/phase-records/handoffs/coordinator/20260816-224000-completion-preflight-and-remaining-execution-plan.md
```

It is the only repository write authorized by the preflight task. No implementation follows from it
in the session that produced it; execution begins at S0 under the preconditions stated there.
