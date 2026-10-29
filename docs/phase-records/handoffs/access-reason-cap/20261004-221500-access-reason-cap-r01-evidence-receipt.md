# access-reason-cap-r01: evidence receipt

Candidate complete, blocked on the frontier snapshot.

## Receipt fields

- Status: candidate complete; `BLOCKED` on one coordinator-owned gate (see Remaining work). Not `DONE`.
- Milestone / task class: `access-reason-cap-r01` / `backend-api-data`.
- Base commit / candidate commit: base `312bd86` (fast-forwarded to `a343183`, the amended packet); candidate `dbc7431`.
- Branch / worktree / run ID: `claude/busy-bartik-858366` / `.claude/worktrees/busy-bartik-858366` / `arc_r01_20261004`.
- Owned paths / shared leases used: `packages/api/src/access/**`, `apps/web/src/components/owner/access/**`, one
  added block in `apps/server/src/phase11-access.integration.test.ts`, one SPEC.md line, this handoff. No leases.
- Decisions made (canonical source and selector): `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  item 33 (the reason is at most 240 characters, what the log stores). Packet
  `docs/phase-records/task-packets/access-reason-cap-r01.yaml` SHA-256
  `f03db5175b9b0c8a11d31d95f6defcc442b2e3694fc8bffc4433ba008ec48c15` (matches `PROJECT_STATE.yaml`). The DTO
  change triggered the packet's conditional read of SPEC.md "Interfaces & Contracts"; nothing in it conflicts.
  Implementation choice: the form checks on submit and clears on edit, as its password fields already do.
- Changes by file:
  - `packages/api/src/access/contracts.ts`: `requiredReason` is `.max(ACCESS_REASON_MAX_LENGTH)`, a new export equal to
    `AUDIT_REASON_MAX_LENGTH` (240) from `../audit/list`, replacing `.max(500)`.
  - `packages/api/src/access/contracts.test.ts` (new): both deactivation schemas accept 240, refuse 241, count after
    trimming, and still refuse whitespace.
  - `apps/web/src/components/owner/access/owner-access-view.tsx`: both reason inputs drop `maxLength={500}`; a submit
    past 240 (after trimming) is not sent and shows `reasonTooLong` with `role="alert"`, `aria-invalid`, and the error
    id in `aria-describedby`; editing clears it.
  - `apps/web/src/components/owner/access/messages.ts`: `reasonTooLong`, EN "Use no more than 240 characters.",
    AR «استخدم 240 حرفاً كحد أقصى.» (same form as the existing password-length copy).
  - `apps/web/src/components/owner/access/owner-access-view.test.tsx`: one test, both forms, both locales.
  - `apps/server/src/phase11-access.integration.test.ts`: block "a reason longer than the audit log stores": 241
    characters on `staffPin/deactivate` and `owner/deactivate` returns 400, the target stays active, and no
    deactivation row is written.
  - `SPEC.md` line 369: "optional reason (at most 240 characters)".
- Validation commands and results (all from the prepared worktree, `pnpm install --frozen-lockfile` "Already up to
  date", node `C:/Program Files/nodejs/node.exe`, synthetic non-secret env per docs/WORKFLOW.md step 8; integration
  `TEST_DATABASE_URL` = `FITWAY_INTEGRATION_RESET_DATABASE` = `fitway_integration_arc_r01_20261004` on
  `fitway-phase2-postgres` 127.0.0.1:55432; artifacts in `D:/fitway-temp/access-reason-cap-r01/`):
  - Red, before the fix: `scripts/run-vitest.mjs run packages/api/src/access/contracts.test.ts`, exit 1, 2 failed
    (241 accepted), `unit-red.txt`. `scripts/run-vitest.mjs run --config vitest.integration.config.ts
    apps/server/src/phase11-access.integration.test.ts`, exit 1, 2 failed with status 500 instead of 400,
    `integration-red.txt`; Postgres logged `violates check constraint "audit_log_reason_short_trimmed"` for both
    `staff_pin_deactivated` and `owner_deactivated`, `integration-red-postgres.txt`. Component test against the
    original view and messages: exit 1, `web-red.txt`.
  - Green on `dbc7431` content: contracts, view, `use-owner-access`, and `packages/api/src/audit` tests, exit 0,
    5 files, 75 tests, `unit-green-final.txt`; integration file exit 0, 26 tests, `integration-green-final.txt`.
    `git status --short` unchanged across both runs.
  - `scripts/verify.mjs fast`: exit 1 at "Frontier preservation evidence", `verify-fast.txt` (the blocker below).
    The steps after it, run one by one: `check-owner-tokens` 0, `check-types` 0, simulator 0; Biome clean on every
    changed file, with the repository-wide `biome check .` failing only in untouched `design-research/**` files;
    full unit suite `scripts/run-vitest.mjs run` 1330 passed, 1 failed:
    `scripts/check-frontier-preservation.test.ts` "real repository acceptance", the same drift, `unit-full.txt`.
- Rendered and accessibility evidence: none. Browser and visual gates are `NOT_REQUIRED` in the packet. The new message
  reuses the existing `.owner-access-inline__error` class; no CSS changed, and no frame has been inspected.
- Independent verifier findings: pending (gate `independentReview: PENDING`).
- Named historical evidence: none.
- Remaining work or exact blocker: `scripts/check-frontier-preservation.mjs` hash-protects three files this milestone
  is granted, in snapshot `docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01-frontier-preservation-pre-r02-anchor.json`
  (SHA-256 `86e416a7…`): `apps/web/src/components/owner/access/messages.ts`, `owner-access-view.tsx`, and
  `owner-access-view.test.tsx`. The snapshot, its pointer, and the check are coordinator-owned, so the worker did not
  touch them. The coordinator decides between recording a transition for these three paths, or another
  route. After that, rerun `scripts/verify.mjs fast`, then the independent review.
- Exact resume command: `pnpm context:show --milestone access-reason-cap-r01`, then read this file.
- Stop/escalation conditions: any change to the frontier snapshot or check beyond these three paths; any further
  access, audit or Owner copy change (excluded by the packet).
