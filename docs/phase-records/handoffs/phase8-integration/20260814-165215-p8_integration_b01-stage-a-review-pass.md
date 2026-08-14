# Phase 8 health-alert integration b01 — Stage A independent review

- Status: `STAGE_A_REVIEW_PASS`. Milestone `phase8-integration` remains `IN_PROGRESS`. No formal
  candidate exists and the formal complete-candidate ladder has not begun. Stage B has not begun.
- Reviewed commit: `ba8e6537` on `work/phase8-integration-b01`, worktree
  `D:/Projects/fitway-worktrees/phase8-integration`, clean before and after review.
- Branch point: `git merge-base main HEAD` → `45d1edfbb4f9a727c3589e600cfff66151fd45f6`, the
  activation commit, exactly as the approved plan's activation contract requires. `e897ba8` (the
  coordinator's b01-start ratification) is **not** an ancestor of the branch and is not required to
  be — it is a ledger-only commit on `main`. A two-dot `git diff e897ba8..HEAD` therefore reports a
  spurious `M PROJECT_STATE.yaml` and `D …coordinator-start.md`; the correct comparison is from the
  branch point and is clean.
- Reviewer independence: this session did not implement Stage A. Scope containment, the gate ladder,
  and every finding below were established from the plan, the diff, the frozen authority files, and
  executed commands **before** the worker's Stage A record was opened, per `CLAUDE.md`. The record
  was then read only to run the record gate.
- Review run ID: `p8_integration_rev_a`. Process-local synthetic environment values, reviewer-generated,
  never the worker's; none reached a tracked file, commit, log, or this record.

## Verdict

`PASS`. No blocking and no significant Stage A findings. Stage B may begin.

## Scope containment — verified

`git diff --name-status 45d1edf..HEAD` reports exactly six paths:

| Path | Authority |
| --- | --- |
| `packages/api/src/alerts/message.ts` (A) | owned |
| `packages/api/src/alerts/message.test.ts` (A) | owned |
| `apps/server/src/alert-notifier.ts` (A) | owned |
| `apps/server/src/alert-notifier.test.ts` (A) | owned |
| `packages/env/src/server.ts` (M, +5) | leased, `PROJECT_STATE.yaml:731` |
| `docs/…/20260814-161448-p8_integration_b01-worker-stage-a.md` (A) | owned, matches the `*-p8_integration_b01-worker-*.md` glob |

538 insertions, 0 deletions, of which 158 are the worker record. Nothing outside `ownedPaths` and
the one `sharedLeases` entry changed. The second leased path `apps/server/src/index.ts` is
unmodified, correctly deferring composition to Stage C. Frozen authority independently confirmed
untouched: `packages/api/src/alerts/{evaluator,evaluator.test,types,notifier}.ts`,
`apps/server/src/alert-repository.ts`, `apps/server/src/cron.ts`, `vercel.json`, every migration and
schema artifact. No router, OpenAPI, UI, retention, or cron-composition change exists.

## Gates run by this reviewer

```text
pnpm exec vitest --version                    → vitest/4.1.10 win32-x64 node-v24.14.0
focused unit command (plan line 380)          → 4 files / 39 tests passed
  packages/api/src/alerts/message.test.ts     → 6 passed  (verbose, named)
  apps/server/src/alert-notifier.test.ts      → 12 passed (verbose, named)
pnpm check-types                              → PASS, 8 of 9 workspace projects
pnpm verify:fast                              → PASS: 35 repository invariants, Biome 242 files,
                                                types green, 45 files / 248 unit tests,
                                                18 Python tests,
                                                "passed without repository mutation"
git diff --check / --cached --check           → clean
git status --short --branch                   → clean on work/phase8-integration-b01
```

`verify:phase` deliberately not run. Confirmed not-yet-applicable against the plan's own
verification section (lines 400–406): the registered profile names
`apps/server/src/phase8-integration.integration.test.ts`, which Stage B creates, and
`scripts/verify.mjs` passes `integrationFiles` verbatim to Vitest. This is documented expected
behaviour, not a gate failure. It becomes a real gate from Stage B onward.

Integration suite not run: Stage A produces no integration artifact and the plan assigns every
PostgreSQL claim to Stage C.

## Acceptance criteria, judged against the plan's explicit Stage A gate limitation

The plan limits Stage A's gate to message text, the failure mapping of the injected transport, and
that no token reaches a log or a thrown value. Each is met.

- **Message.** `formatAlertMessage` is pure — no clock, no locale, no transport, no credential.
  `CONDITION_LABELS` (`message.ts:9-14`) covers all four members of `ALERT_CONDITION_TYPES`
  exhaustively via `Record<AlertConditionType, string>`, so a fifth condition would be a type error
  rather than a silent blank. All eight condition × kind combinations render distinct, repeatable
  text carrying `deviceId`, `conditionStartedAt`, and `sentAt` as UTC ISO-8601 in Western digits.
  An invalid instant throws `RangeError` instead of emitting `Invalid Date` (`message.ts:16-22`).
- **Failure mapping.** Every path in `alert-notifier.ts` — thrown transport error, non-2xx,
  unparseable body, and Telegram `ok !== true` — throws one fixed-message `Error`. Confirmed against
  `alert-repository.ts:103-111`, whose `outcomeFor` maps any rejection to a durable `failed` row and
  returns normally, so a transport outage produces no aggregate error. Signature conformance to the
  frozen `AlertNotifier = (notice: AlertNotice) => Promise<void>` (`notifier.ts:7`) holds.
- **Token containment.** The token appears only inside the endpoint URL string. No failure path
  propagates the transport error, response body, status, or a `cause`. The dedicated test drives a
  transport error whose own message embeds the full endpoint and asserts the token appears in
  neither `message`, `stack`, `String(error)`, nor own-property JSON serialisation, and that `cause`
  is `undefined`. A second test asserts nothing reaches `console.log`/`error`/`warn` on the success
  or the failure path. A `globalThis.fetch` spy proves no ambient socket is opened by any test.

Conformance checks beyond the mechanical gate:

- `SPEC.md:531-533` requires the Telegram bot token and chat id validated in the env package like
  existing variables. `packages/env/src/server.ts:35-36` does so. `SPEC.md:478-479` scopes the
  device-identity prohibition to the schema-version-2 **public** contract, so carrying `deviceId` in
  the maintainer channel is correct, not a privacy regression.
- No secret reached a tracked file. `apps/server/.env` is ignored via `apps/server/.gitignore:32`;
  the test fixture literal in `alert-notifier.test.ts:5` does not occur in that file (checked
  without reading the values), so no provisioned value was copied into source or tests.

## Findings

None blocking. None significant against Stage A's gate.

```
[significant — carried forward to Stage C, not a Stage A rejection]
  The notifier imposes no delivery deadline of its own.
  Where:    apps/server/src/alert-notifier.ts:44-50 (no AbortSignal on the fetch call)
  Evidence: no AbortSignal or `signal:` appears anywhere in apps/server/src or packages/api/src.
            The repository's only outbound-call precedent sets one: edge/simulator.py:198,
            `timeout: float = 15`. The Stage A "timeout" test (alert-notifier.test.ts:79-85)
            injects an AbortError from the fake transport, so it proves the mapping of a timeout
            the transport raises — not that the notifier bounds one.
  Expected: The plan's frozen composite-runner failure contract exists so "an alerting fault can
            never silently suppress the scheduled reset". A rejection satisfies that; a hang does
            not. If Stage C injects bare global fetch, undici's 300 s header/body defaults exceed a
            minutely cron and the platform kills the invocation, losing that invocation's reset
            issuance while leaving a claimed alert row with no outcome row.
  Judgement: correctly OUT of Stage A's gate — the plan requires only that the injected transport's
            failures map, and they do. Stage C must inject a bounded fetch or bound it in the
            composite runner. Recorded here so Stage C's plan and review cannot lose it.

[minor] A tautological assertion reads as a character-set guard but constrains nothing.
  Where:    packages/api/src/alerts/message.test.ts:40
  Evidence: /^[\S\s]*$/ matches every string, including the empty string.
  Expected: the adjacent line 41, not.toMatch(/[٠-٩۰-۹]/), is the real Western-digit check and does
            discriminate. Line 40 can be removed or given actual content.

[minor] The forbidden-substring guard will misfire on innocuous future copy.
  Where:    packages/api/src/alerts/message.test.ts:76 ("bot" in the forbidden list)
  Evidence: the guard is a plain substring test, so a later label containing "both", "robot", or
            "bot" fails with a credential-leak message.
  Expected: harmless today (no current label matches); noted so a future failure is read correctly.

[minor / observation, not a departure]
  TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are z.string().min(1) while the CRON_SECRET precedent the
  plan cites is z.string().min(32).
  Where:    packages/env/src/server.ts:35-36 vs :15
  Evidence: min(1) plus emptyStringAsUndefined enforces presence only.
  Expected: SPEC.md:531-533 requires only "validated in the env package like existing vars", which
            is met, and the token format is externally issued rather than project-chosen. A
            truncated token passes startup and fails at delivery into a durable `failed` row —
            acceptable. Recorded, not scored against the stage.
```

## Record gate — `PASS`

Every load-bearing claim in `20260814-161448-p8_integration_b01-worker-stage-a.md` matched
independent measurement: base commit `45d1edf`; branch, worktree, and run ID; the five-path source
scope and 380 source insertions (538 total less the 158-line record); frozen-authority
non-modification; 6 and 12 tests per suite; 45 files / 248 tests on the full unit run; `check-types`
and `verify:fast` green with the exact mutation-guard line. Status is correctly restrained —
`STAGE_A_COMPLETE`, explicitly not `READY_FOR_INTEGRATION` and not `DONE`. No secret, token, PIN, or
session value is disclosed. The disclosed Biome formatting prerequisite on a file the stage itself
created is correctly scored as not a repair; repair budget remains `0/2`.

Two record statements are accepted with a qualification rather than as proof:

- The red evidence quoted at lines 37–42 is a module-resolution failure ("Cannot find module"). That
  establishes the tests were authored and executed before the implementation files existed, which is
  the ordering the plan's red/green seam requires. It does not establish that each individual
  assertion discriminates a wrong implementation. Single-commit history means no reviewer can verify
  more than this from the repository.
- "PASS, all workspaces" (line 91) is loose: `pnpm check-types` covers 8 of 9 projects, because
  `@fitway/config` holds only `tsconfig.base.json` and has no `check-types` script. This is the
  identical vocabulary already adjudicated as established, non-defect phrasing in the Phase 7 b02
  Stage 3 record. Not scored.

## Disclosed implementation choices — reviewed, not overruled

- **English, unlocalised maintainer message.** Checked against `FITWAY_PRODUCT.md:48-54`, whose
  language contract governs the localized product surfaces (RTL document direction, logical layout
  properties, copy expansion) — not a single-recipient operator diagnostic channel. The Western-digit
  requirement at line 54 is met and negatively asserted. This remains a human's to overrule; it is
  behind one pure function and trivially changed. Not a locked-decision violation, and it was
  surfaced rather than made silently.
- **Failure detail discarded rather than wrapped as `cause`.** Reviewed as correct: the endpoint
  embeds the token and transport errors routinely quote the URL. The diagnostic loss is bounded by
  the durable `failed` row.

## Gaps in this review, stated

- **No mutation testing was performed.** The suites were read and executed, not falsified. Combined
  with the module-resolution red seam above, this is the one residual assurance gap for Stage A. It
  is the `_v01` verifier's contracted mutation check that closes it, and it should not be assumed
  closed before then.
- **No PostgreSQL state was exercised.** Deliberate: the plan assigns every database claim,
  including that a delivery failure leaves `edge_current_health`, `current_state`, and
  `edge_health_log` byte-identical, to Stage C. This review neither demanded it nor accepted it from
  a stubbed driver.
- **`verify:phase` and the integration matrix were not run**, for the reasons above.
- Nothing was pushed, deployed, or externally provisioned; no real credential was used, requested,
  or held.

## Resulting state and next action

`phase8-integration` remains `IN_PROGRESS` with gates `unit: PENDING`, `integration: PENDING`, and
repair `0/2`. Stage A is accepted and frozen: any later mutation of the six Stage A paths without a
reviewed repair is a stop condition.

Next bounded slice: **Stage B — retention cleanup**, per the approved plan's Stage B section, on the
same branch and worktree with the same one-writer boundary. It creates
`apps/server/src/phase8-integration.integration.test.ts`, from which point `verify:phase` becomes a
real gate. Its review is judged against the plan's explicit unit/integration split: a
referential-integrity claim backed only by a stubbed driver is a Stage B rejection.

Stage C must additionally carry the delivery-deadline finding above.
