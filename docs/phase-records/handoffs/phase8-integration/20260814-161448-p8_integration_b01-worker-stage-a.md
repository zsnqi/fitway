# Phase 8 health-alert integration b01 — Stage A worker record

- Status: `STAGE_A_COMPLETE`, self-verified. Awaiting fresh independent Stage A review.
  Milestone stays `IN_PROGRESS`. Stage B has not begun.
- Base commit: `45d1edfbb4f9a727c3589e600cfff66151fd45f6` (the activation commit)
- Branch / worktree / run ID: `work/phase8-integration-b01` /
  `D:/Projects/fitway-worktrees/phase8-integration` / `p8_integration_b01`
- Approved plan: `docs/phase-records/handoffs/phase8-integration/20260814-133826-p8_integration_b01-plan.md`,
  Stage A section
- Repair budget: `0/2`, unchanged. No formal repair was consumed.
- Push/deploy: none.

## Scope delivered — exactly the reviewed Stage A boundary

| File | Ownership | Change |
| --- | --- | --- |
| `packages/api/src/alerts/message.ts` | owned, new | Pure notice → maintainer message text |
| `packages/api/src/alerts/message.test.ts` | owned, new | 6 tests |
| `apps/server/src/alert-notifier.ts` | owned, new | Telegram transport over an injected `fetch` |
| `apps/server/src/alert-notifier.test.ts` | owned, new | 12 tests |
| `packages/env/src/server.ts` | **leased**, modified | `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, +5 lines |

`git diff --cached --stat` reports 5 files, 380 insertions, 0 deletions. Nothing else was touched.
The second leased path, `apps/server/src/index.ts`, is deliberately **unmodified** — composition is
Stage C, and Stage A leaves the notifier unwired and unreachable from any runtime path.

Frozen authority confirmed unmodified: `packages/api/src/alerts/{evaluator,evaluator.test,types,notifier}.ts`,
`apps/server/src/alert-repository.ts`, `apps/server/src/cron.ts`, `vercel.json`, all of
`packages/db/**`, and every migration. No schema, migration, index, router, OpenAPI, UI, retention,
or cron-composition change exists.

## TDD red → green

Red first, as the plan requires. Both new suites were written and executed before any
implementation file existed:

```text
pnpm exec vitest run packages/api/src/alerts/message.test.ts apps/server/src/alert-notifier.test.ts
→ Test Files 2 failed (2) | Tests: no tests
  Error: Cannot find module './message'
  Error: Cannot find module './alert-notifier'
```

After implementing the two modules, the same command:

```text
→ Test Files 2 passed (2) | Tests 18 passed (18)   at 16:12:44
```

## What Stage A proves

- **Message determinism and distinctness.** All 8 `AlertConditionType` × `AlertNoticeKind`
  combinations render distinct text, and repeated calls are byte-identical.
- **Content contract.** Device id, condition start, and evaluation instant are carried as UTC
  ISO-8601 in Western digits; an explicit negative assertion rejects Arabic-Indic digits. The alert
  and recovery headings differ. An invalid instant throws `RangeError` rather than emitting
  `Invalid Date`.
- **No sensitive content.** Every rendered message is asserted to contain none of `token`, `secret`,
  `pin`, `password`, `session`, `cookie`, `bot`, `chat_id`, `authorization`, `count`, `occupancy`,
  `visitor`, `capacity` — covering both the credential class and the visitor/occupancy class.
- **Transport shape.** Exactly one POST per notice to the bot `sendMessage` endpoint, JSON
  content type, `chat_id` from configuration, and the rendered text in the body.
- **Failure mapping.** Non-2xx, 4xx, Telegram `ok: false`, a malformed non-JSON body, a thrown
  transport error, and an `AbortError` timeout each reject. `alert-repository.ts:103-111` already
  maps a rejection to a durable `failed` delivery row, so this is the complete Stage A half of
  "all delivery outcomes are durable".
- **The token never escapes.** Every failure path throws one fixed-message `Error` with no `cause`.
  A dedicated test drives four failure modes — including a transport error whose own message
  embeds the full endpoint URL — and asserts the token appears in none of the rejection's
  `message`, `stack`, `String(error)`, or own-property JSON serialisation, and that `cause` is
  `undefined`. A second test asserts nothing is written to `console.log`, `console.error`, or
  `console.warn` on either the success or the failure path.
- **No ambient network.** The transport is constructor-injected; a spy on `globalThis.fetch`
  asserts it is never called. No test performs real network I/O.
- **Construction guards.** An empty bot token or chat id throws `RangeError`.

## What Stage A deliberately does not prove

Per the plan, Stage A's gate is limited to what its own artifacts can prove. The database-state
claim — that a delivery failure leaves `edge_current_health`, `current_state`, and
`edge_health_log` byte-identical — is a PostgreSQL property and belongs to Stage C. It must not be
demanded of this stage, and must not be accepted from a stubbed driver. Nothing here asserts it.

## Validation commands and results, 2026-08-14 +03:00

```text
pnpm exec vitest run packages/api/src/alerts/message.test.ts apps/server/src/alert-notifier.test.ts
  → RED  2 failed / no tests   (pre-implementation)
  → GREEN 2 passed / 18 tests  (post-implementation)

pnpm check-types   → PASS, all workspaces, no errors
pnpm verify:fast   → PASS, "Verification fast passed without repository mutation."
pnpm exec vitest run → 45 files / 248 tests passed
                       (baseline at activation: 43 files / 230 tests; +2 files, +18 tests)

git diff --check / git diff --cached --check → clean
git status --porcelain → only the five Stage A paths
```

`verify:phase` was **not** run and is recorded as not-yet-applicable: the registered
`phase8-integration` profile names `apps/server/src/phase8-integration.integration.test.ts`, which
Stage B creates. This is the condition the approved plan documents in its verification section, not
a gate failure.

One prerequisite arose and consumed no repair budget: the first `verify:fast` failed Biome
formatting inside `apps/server/src/alert-notifier.test.ts`, a file this stage had just created.
`pnpm exec biome check --write` was applied to the five Stage A paths only, and the rerun passed.
Formatting a new file the stage owns is not a source defect.

## Environment

`packages/env/src/server.ts` now requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, validated as
non-empty strings, matching the existing required-variable pattern and the SPEC environment
additions. Because `createEnv` validates at import, **both are required from this commit onward at
every startup, unit run, and build** — Stage A is the one stage that is not inert.

Synthetic local values were provisioned in the untracked `apps/server/.env`
(`git check-ignore` → `apps/server/.gitignore:32:.env*`) and exported into the shell for the unit
gates, which no `.env` file reaches. No real credential was used, requested, or held at any point;
no value appears in any tracked file, commit, log, artifact, or this record. Real bot token and
chat id remain external go-live gates.

## Implementation choices, disclosed

- **Message language is plain English, unlocalised.** The maintainer channel is operator
  diagnostics for a single recipient, not a product surface: no public, staff, or owner view
  renders it, so the Arabic-first product contract does not reach it. Recorded as an
  implementation choice, not a product decision; the text lives behind one pure function and is
  trivially changed if a human decides otherwise.
- **Device id is included.** The plan requires it, `alert_log` already stores it, and the
  device-identity prohibition governs the public payload, not the maintainer channel.
- **Failure detail is discarded rather than wrapped.** Attaching the original error as `cause`
  would be the conventional choice, but the endpoint embeds the bot token and transport errors
  routinely quote the URL, so a wrapped cause is a credential leak one log line away. The
  diagnostic loss is bounded: the durable `failed` row already records which notice failed and
  when.

## Exact next action

A **fresh independent read-only Stage A review**, which must not repair what it reviews. It should
verify scope containment against `45d1edf`, that no frozen authority changed, that the token cannot
escape any failure path, and that no test performs real network I/O. Stage B does not begin until
that review passes.

## Resume command

```powershell
cd D:/Projects/fitway-worktrees/phase8-integration
git status --short --branch
git log --oneline -1
pnpm exec vitest run packages/api/src/alerts/message.test.ts apps/server/src/alert-notifier.test.ts
```

## Stop conditions

Unchanged. `NEEDS_HUMAN` on a forbidden-path need, a migration/index/schema need, a need to change
`cron.ts` or `vercel.json`, a lease widening, a secret reaching a tracked file, or any deployment
requirement.
