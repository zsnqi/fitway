# P2 independent verification, attempt 1 — escalation and coordinator action

- Stage: `p11_access_tx_b01 / stage-5-independent-verification`, attempt 1.
- Verifier: **deepseek-v4-pro** (`opencode-go/deepseek-v4-pro`, control `max`, transport
  `opencode-cli`), session `ses_fd18a66dbffeecFPf40lwpiEez`, exit 0, 166 events, 62 tool calls.
  Route record: `docs/phase-records/route-decisions/p11_access_tx_b01-independent-verification.json`.
- Candidate examined: `805f6759e56674ac27668b05b39292833bef7574`. Base
  `aaa646b174d4dbb248eb1a73a6b7273fa40af3e7`.
- Isolated verifier worktree `D:/Projects/fitway-worktrees/phase11-access-tx-v01`, detached at the
  candidate commit, prepared per `docs/WORKFLOW.md` steps 7-8, with a disposable Postgres role,
  run-owned integration and application databases, and freshly generated auth and cron secrets. The
  repository `.env` was never sourced into the worker's shell.
- Outcome: **ESCALATION**, not `PASS` and not `FAILED_VALIDATION`. `pnpm verify:full` failed twice,
  each time in a different place and neither in code the candidate touches, and the verifier stopped
  and handed the decision back rather than guessing. That is the contract behaving correctly.
- Repair budget after coordinator action: **1 of 2 consumed.**

## Coordinator gate on the return

Checked against the repository rather than against the report.

**The central finding was confirmed, and my first check of it was wrong.** I grepped for
`drop schema public cascade`, got zero matches in every integration file, and briefly concluded the
verifier had misread the suite. The actual pattern is `drop schema if exists public cascade`. Twelve
integration files reset `drizzle` and `public` and recreate `public` before migrating;
`apps/server/src/phase11-access.integration.test.ts` was the only file that migrated onto whatever
its predecessor left behind. `phase7-reset-evaluator` neither drops nor migrates and is not a
counterexample. The verifier was right on the fact and right on the file it cited.

**Repaired, because it is inside this slice's owned paths.** The access integration file now resets
its own schema exactly as its siblings do. `vitest.integration.config.ts` sets
`fileParallelism: false`, so the reset cannot disturb a concurrently running sibling - checked
before making the change rather than assumed from the fact that twelve other files already do it.
The repair also strengthens the pre-principal provisioning race, which previously rested on the
deletes underneath having caught everything and now rests on a guaranteed empty schema.

Verification of the repair: the access file 24/24 on a fresh database (`p11_access_tx_r1a`), and the
complete integration component 18 files / 122 tests (`p11_access_tx_r1b`).

## Findings, and what was done with each

| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | significant | The access integration file migrated without first resetting the schema, alone among its siblings, and could fail its `beforeAll` with SQLSTATE 42710 inside a full run | **Repaired.** Inside owned paths. Repair attempt 1 of 2 |
| 2 | significant | `apps/server/src/phase2.integration.test.ts:779` timed out on a Playwright `locator.waitFor`, in a file this candidate cannot influence | **Not repaired.** Outside owned paths. Recorded as a failure observation and handed to P1 |
| 3 | minor | The PIN-exclusion unit test is a standing guard, not change-discriminating - it passes against the pre-change code too | **Accepted and labelled.** The test is kept and now says so in a comment. The verifier is right that secrecy holds by construction, and construction is what a later edit can change silently |
| 4 | minor | `staff_pin_shape` is now unreachable through the transport | **No action, and the verifier agrees it is intended and safe.** It remains the domain invariant with its own unit test; removing a member of a locked refusal surface is not this slice's decision |

## What the verifier proved that the implementer had not

Three non-vacuity controls, all stronger than the single one run during implementation:

- Replacing the classifier's constraint name with a wrong one made **both** new integration tests
  fail, losers reverting to bare 500s.
- Applying a wrong constraint name to the staff caller made the **pre-existing** staff provisioning
  race fail — which is the direct evidence that the narrowing did not change that path.
- Reverting the seam conversion made the M3 unit test fail on its own assertion.

Criteria (c) through (f) were checked and hold: no PIN reachable through message, `cause` chain at
any depth, log, audit row, or API response; the server's RPC `onError` logs only `error.name`; the
eleven locked 2026-08-11 decisions untouched; the SPEC PIN rules untouched; canonical 401/403
intact; exactly one `owner_provisioned` audit row for a won race and none for losers.

## Stated gaps carried forward

The verifier's own gaps, recorded rather than smoothed over: `verify:full`'s browser and
accessibility steps never executed in either attempt, because both failed earlier in the integration
step, so the candidate's 83/83 browser claim was **not** independently reproduced. It also did not
run `verify:full` at the base commit to show the flakes pre-exist. Both gaps are reasons the
re-submission below goes to a fresh verifier rather than being waved through.

## What was deliberately not claimed

Finding 2 is **not** attributed to the known-flaky register. The register's three entries are all
browser specs; `phase2.integration.test.ts:779` is an integration file and appears in none of them,
and the register's own first rule is that a failure not in it is a real failure. It is recorded as a
failure observation in `docs/phase-records/verification/` and is **not** added to the register by
this session, because the session that repairs a candidate should not be the one that opens the
entry which would later excuse that candidate's gate. A second independent observation, or P1's
work, is what should move it.
