# phase-6 handoff

- Status: `NEEDS_HUMAN` recommended; the coordinator alone updates `PROJECT_STATE.yaml`.
- Base commit / candidate commit: activation HEAD
  `9909377423d82670f4aa3569a2231f13c26a7bb5`, parent
  `06486487914c5a78afb3aa6e264e6988e0c5cb85`; no candidate commit.
- Branch / worktree / run ID: `work/phase6-offline-b01` /
  `D:/Projects/fitway-worktrees/phase6-offline` / `p6_offline_b01`.
- Owned paths / shared leases used: only this handoff directory was written. No leased source file
  was edited. The edge-spine lease was verified valid through
  `2026-08-16T18:30:00+03:00` at startup.

## Completed

- Read the activation authorities in the required order and confirmed the worktree was clean on
  the exact branch, HEAD, and parent before repository edits.
- Repaired the untracked dependency links with `pnpm install --frozen-lockfile`; the repository
  Vitest shim reports `vitest/4.1.10 win32-x64 node-v24.14.0` when the existing
  `node_modules/.bin` is present on this sandboxed shell's `PATH`.
- Established the pre-change green baseline: the edge schema, occupancy engine, and OpenAPI suites
  passed 6 tests in 3 files; the Python simulator passed 5 tests.
- Wrote the unadopted slice plan at
  `docs/phase-records/handoffs/phase-6/20260809-183500-p6_offline_b01-plan.md`.
- Completed the ADR-008 decision-6 evidence review: no valid production writer of
  `source=manual` remains. `processLivePush` writes only minute `source=live` and current
  `source=edge`; command issuance writes commands/audit only; the Python simulator applies a
  command locally and returns through the same edge/live writer. Retained database enum values,
  DTO/analytics acceptance, tests, and labels are consumers, not producers. No implemented
  manual-validity settings field or source-specific freshness branch exists.

## Exact current state

- Working tree: uncommitted, with only two new owned documentation files: this handoff and the
  plan above. No source, configuration, migration, ledger, or UI file changed.
- Committed/deployed: no commit, push, deployment, or external mutation.
- Implementation: not started; Stage 1 was not adopted because the mandatory phase gate cannot be
  invoked with the current human instruction.
- Safe state: yes. Removing the two new handoff files returns the exact activation tree; retaining
  them preserves the blocker and completed audit evidence.

## Decisions and findings

- Human-locked: use `FITWAY_PHASE=phase-6` for the required gate; this rules out silently using a
  different selector.
- Coordinator-locked: `scripts/verify.mjs` is forbidden to this worker; this rules out adding or
  renaming the profile here.
- Technical Phase 6 finding: no valid internal `source=manual` producer remains. This does not
  authorize enum/settings removal. A complete cleanup crosses forbidden database, DTO, analytics,
  test, catalog, and normative-document paths and requires a coordinated follow-up. Existing data
  must be audited for legacy manual rows before a migration decides their disposition.

## Remaining

1. Resolve the verification-profile authority mismatch below.
2. Resume the written test-first plan: strict live/backfill device authority, history-only engine
   behavior, command-before-live reconnect, disposable-Postgres acceptance, and Python/OpenAPI/
   fixture parity.
3. Run `pnpm verify:fast`, then the corrected exact Phase 6 gate with the disposable database.
4. Obtain a fresh independent verifier review; the worker candidate is then
   `READY_FOR_INTEGRATION`, never `DONE`.
5. Schedule the `source=manual` cleanup separately under coordinator ownership; do not fold it
   into this no-migration worker slice.

## Blocker

- `scripts/verify.mjs` registers the Phase 6 profile only as `6`, but the current human instruction
  requires `FITWAY_PHASE=phase-6`. The exact command exits before running checks with:
  `FAILED_VALIDATION: verify:phase requires one of: ... 6 ...`. This blocks adoption of a writing
  stage that must finish with that gate.

  Options:

  1. Coordinator adds/registers the canonical `phase-6` selector and updates the activation record
     consistently. This changes the forbidden verifier but makes the required command durable.
  2. Human explicitly replaces the current instruction with `FITWAY_PHASE=6`. This needs no code
     change but preserves inconsistent milestone naming in worker commands.

  Recommendation: option 1, performed by the coordinator, so the named milestone and verifier
  selector cannot drift again.

## Validation commands and results

- Startup: branch `work/phase6-offline-b01`, clean initial status, HEAD `9909377`, parent
  `0648648`, lease valid at `2026-08-09T18:26:49+03:00`.
- `pnpm install --frozen-lockfile` — pass, already up to date.
- Focused Vitest baseline — pass: 3 files, 6 tests.
- `py -m unittest discover -s edge -p test_*.py` — pass: 5 tests.
- Exact `FITWAY_RUN_ID=p6_offline_b01 FITWAY_PHASE=phase-6 pnpm verify:phase` — rejected before
  test execution because `phase-6` is not a registered profile.
- Not run: Phase 6 implementation/integration, `pnpm verify:fast`, and independent review, because
  no implementation stage was adopted after the coordinator-owned gate mismatch was confirmed.
- Browser/a11y/visual: not required; no UI was produced.

## Recommended next session

Mode: `execute`, after the coordinator or human resolves the selector mismatch.

Resume Phase 6 from the activation HEAD and written plan. Preserve the no-UI/no-migration/no-router
scope and the exclusive edge-spine lease. Implement the strict device contract, history-only
backfill, command-before-live reconnect, durable Python minute buffer, and TypeScript/OpenAPI/
Python fixture parity test-first at the named public seams. Retain all `manual` enum/settings
acceptance in this slice while carrying forward the evidence that no producer remains. Run the
focused tests, `pnpm verify:fast`, the newly authorized exact Phase 6 profile with the named
disposable database, and report a fresh independent review plus a durable handoff.

## Stop/escalation conditions

All activation stop conditions remain unchanged. In particular, do not edit
`scripts/verify.mjs`, `PROJECT_STATE.yaml`, `packages/db/**`, environment schemas, router/context/
server-index files, or any UI without a new explicit lease/authority. Recheck the edge-spine lease
before every leased-file edit.
