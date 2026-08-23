# P2 independent verification, attempt 2 — PASS

- Stage: `p11_access_tx_b01 / stage-5-independent-verification`, attempt 2.
- Verifier: **deepseek-v4-pro** (`opencode-go/deepseek-v4-pro`, control `max`, transport
  `opencode-cli`), session `ses_fd1482bedffeclLjNw5PNmm3wC`, exit 0, 151 events, 52 tool calls.
- Candidate: `6299a7568f8dfd30813f54e85a4ececdf22efee3`. Base
  `aaa646b174d4dbb248eb1a73a6b7273fa40af3e7`.
- Isolated worktree `D:/Projects/fitway-worktrees/phase11-access-tx-v02`, detached at the candidate,
  prepared per `docs/WORKFLOW.md` steps 7-8, with its own disposable Postgres role, run-owned
  integration and application databases, and freshly generated auth and cron secrets. The repository
  `.env` was never sourced into the worker's shell.
- **Verdict: `PASS`. No findings.**
- Route requalified rather than reused; record
  `docs/phase-records/route-decisions/p11_access_tx_b01-independent-verification-2.json`.

## Scope of this PASS

It attaches to `6299a75`. Commits after it in this slice contain records and coordinator-owned
ledger state only and no executable code; a later commit touching executable code in the access
paths inherits nothing from this verdict.

## Checks the verifier ran

| Command | Result |
|---|---|
| `pnpm check:repository` | PASS — 43 milestones, 8 canonical approval screenshots |
| `pnpm verify:fast` | PASS — unit 63 files / 476 tests, simulator 117, mutation guard clean |
| focused unit `access-service.test.ts` | PASS — 1 file / 3 tests |
| focused integration `phase11-access.integration.test.ts` | PASS — 24/24, repeated, including once deliberately against a database a sibling had left dirty |
| `pnpm verify:full` | PASS, exit 0 — integration 18 files / 122 tests, **browser and accessibility 83/83**, mutation guard clean |

No red result in any command, so nothing needed attribution and the known-flaky register was never
invoked. The browser and accessibility steps running green closes the gap attempt 1 left open: until
now 83/83 had only ever been measured by the implementer.

## Non-vacuity, including one honest refusal

| Claim | Result |
|---|---|
| 1 — typed duplicate-email refusal, concurrent and case-insensitive | **PROVED** — reverting `access-repository.ts` made the race test fail on 400-vs-500 and the case test return `{status:500, code:undefined}` |
| 2 — generator defect no longer surfaces as 400 | **PROVED** — reverting `access-service.ts` failed the seam test on its own assertion |
| 3 — classifier narrowed without changing the staff path | **NOT PROVED, and reported as such** |
| 4 — the schema reset is change-bearing and safe | **PROVED** — with the reset lines removed the file's `beforeAll` failed with FK 23503 after a sibling run; with them, 24/24 on the same dirty database |

Claim 3 is the one worth reading. The verifier reported that the narrowing is not behaviour-visible
on the current schema, because only one unique index is reachable from the owner insert, so no
discriminating test can exist; and that its own synthetic control did not fail for a timing reason
rather than a correctness one. It rests the claim on inspection plus the owner tests and says so.

That is the correct outcome, and it matches what the narrowing was for: it is defensive against a
future unique index on `auth_principals` inheriting a refusal about email addresses, not a fix for
present behaviour. An unprovable claim reported as unproved is worth more than a fourth PROVED line.

## What it confirmed on the security axis

The cause chain is `Error → AccessRuleError(static message) → null`, depth 1, with no PIN value
reachable through message, cause at any depth, log, audit row, or API response. The RPC `onError`
logs only `error.name`. Refused races abort their transaction before `appendGovernanceRow`, so a
lost race writes no audit row. The eleven locked 2026-08-11 decisions, the SPEC PIN rules, and
canonical 401/403 are untouched.

## Stated gaps

`verify:full` was not run at the base commit — there were no red results to compare against. The
`apps/web` rendering of `owner_email_taken` was not reviewed; `apps/web` is forbidden to this
candidate and is Slice B's surface. The verifier read the implementer handoffs once, after forming
its verdict, and reported that nothing in them was unchecked and that they did not change it.
