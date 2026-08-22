# Phase 11 access Slice A b02 — independent verification: PASS

- Verdict: **PASS**. Candidate `cb7cd96b8d1fab187e494091b136397fe4e11116`, base
  `6071e1b6489cf2a477e766dbc95743791092e0fd`, verified at `3066aff` (which adds only durable
  records on top of the code candidate).
- Verifier: fresh native worker, `opus` class, run ids `v11f_access_b02_r1` and `r2`. It did not
  produce the candidate, held no context from the session that did, and edited nothing.
- Route decision and its closed gate outcome:
  `docs/phase-records/route-decisions/p11_access_b02-independent-verification.json`.

## Independence, stated exactly

The verifier is a fresh worker spawned by the implementing coordinator session, not a separately
launched one. It shares no context with that session. It was briefed to form and write its own
assessment from the diff, `SPEC.md`, `FITWAY_PRODUCT.md`, and the surrounding code **before**
opening the implementer's candidate record, per the rule in `CLAUDE.md`, and it reports that reading
that record afterwards changed no verdict, no acceptance item, and no finding. It corroborated two
things the verifier had already established independently and surfaced no constraint it had missed.

That is the substance of independence. The limitation is recorded rather than claimed away, and the
gate remains the coordinator's.

## Acceptance

All six items from the b01 terminal record's successor list: **HELD**.

| # | Item | Evidence the verifier used |
|---|---|---|
| 1 | Every mutation locks what it reasons about | Dumped the SQL the Drizzle chains actually emit; all three lock helpers end in `for update`, and `countActiveOwnersForUpdate` emits `order by … asc for update`. Confirmed by a two-session probe that the emitted statement blocks. |
| 2 | The `appendGovernanceRow` comment claims only what the code guarantees | Substance correct; one residual overstatement found and now corrected — see below. |
| 3 | `resetOwnerCredential` refuses an inactive principal | The assertion fires before the unconditional `active: true` write. |
| 4 | The three state refusals no longer share `staff_pin_shape` | Two codes across three sites; `staff_pin_shape` now reachable only from the shape assertion. |
| 5 | The SPEC shape rule is enforced on the generated PIN | Both provision and rotate route through `generateStaffPin`; the pair is no longer test-only. |
| 6 | Concurrency covered for every mutation, and the assertions can fail | Proved by the verifier's own probes, not by rerunning the suite — see below. |

All eleven locked 2026-08-11 decisions: **HELD**, each against a probe the verifier chose. None
could not be probed.

## What the verifier proved for itself

Recorded because it is worth more than the reruns, and because it answers the two questions the
candidate record flagged as load-bearing and not obviously right.

- **The lost update, reproduced and cured.** It replicated `rotateStaffPin`'s read-decide-write with
  three concurrent transactions. Unlocked: all three reported version 2, stored 2, one distinct
  version — the exact b01 defect. Locked: versions 2/3/4, stored 4, three distinct. It did the same
  for `reactivateOwner`: unlocked, three transactions each appended a row claiming `false -> true`;
  locked, one appended and two refused. This is an independent negative control for the suite's two
  central assertions, reached without relying on the implementer's measured one.
- **The tests genuinely contend.** The verifier named the right worry — the assertions are
  outcome-identical whether requests overlap or serialise, so they only discriminate if the requests
  really collide. It polled `pg_stat_activity` during a live integration run and observed 48
  lock-wait samples across all three lock statements. The suite is testing concurrency, not
  sequence.
- **Deadlock under mixed traffic.** 40 rounds × 16 concurrent transactions (640 operations) mixing
  the two-lock `deactivateOwner` sequence with the single-lock sequences: zero deadlocks, zero other
  errors, agreeing with the structural argument that only `deactivateOwner` takes two locks and
  always takes the ordered active-owner set first.
- **Lock sufficiency, with a latent caveat.** Inside the module every credential is reached through
  its principal and both credential tables carry `unique(principal_id)`, so locking the principal
  serialises its credential. Outside it, the verifier found one unlocked writer —
  `PostgresAuthRepository.upsertSharedStaffCredential` — reachable only through
  `AuthService.setSharedStaffPin`, which no mounted route calls. The claim holds at runtime; it
  would break if a future seed or CLI path called that concurrently with the access leaves.

## Gate results reproduced by the verifier

| Command | Run id | Result |
|---|---|---|
| `pnpm check:repository` | — | PASS |
| `pnpm verify:fast` | — | PASS, 62 files / 473 tests, 117 simulator tests |
| access integration file ×4 | `v11f_access_b02_r1` | 22/22 each; run 1 on a database created immediately beforehand |
| `pnpm verify:full` | `v11f_access_b02_r2` | PASS, exit 0, browser step **83/83** |

No command failed. Tree clean after every run; `git status --porcelain` empty and HEAD unmoved at
the end, confirmed by the coordinator against the repository rather than accepted from the report.

**On the browser-step debt.** This is now four data points: the b01 verifier red 4/4, the b01
coordinator green, the b02 coordinator green, this verifier green on its first and only attempt.
Consistent with load sensitivity, and consistent with the diff having no runtime presence in that
gate — no `apps/web/**` or `tests/browser/**` file changed, and `apps/web/src/utils/orpc.ts` imports
the router as a type only. The debt remains recorded and outside this slice's owned paths.

## Findings: none blocking, none significant, six minor

One was fixed; the rest are carried as named follow-ups.

**Fixed — M2, `appendGovernanceRow`'s comment was still written as universal.** It said the target
principal is locked before the before snapshot is read, while two of its seven call sites take no
lock: `provisionOwner`, and `provisionStaffPin` when the shared staff principal does not yet exist.
Both are correct — they *create* the row they describe rather than transitioning one, so there is no
prior state a concurrent transaction could have moved, and a racing caller is arbitrated by a unique
index. But this is the same class of overstatement b01 was rejected for, in the same comment the
successor was told to correct, and shipping a new one there would be a poor outcome at any severity.

The correction is **comment text only** and was made after the PASS. Recorded plainly rather than
folded in silently: `git diff` shows no non-comment line changed, and `pnpm verify:fast` plus the
access integration file on a freshly created database (`p11_access_b02_m1`, 22/22) were re-run
afterwards. A comment cannot change behaviour, and the deterministic gates confirm nothing regressed.

**Carried as follow-ups** — all behaviour changes or out-of-scope, and none appropriate to fold into
a candidate that has already passed:

- **M1 — `owner/provision` has no typed refusal for a duplicate email and no concurrency test.**
  `access-repository.ts` inserts the owner principal with no `try`/`catch`, so a collision on
  `auth_principals_owner_email_unique` propagates as an unknown error and reaches the caller as a
  bare 500. It fails closed and leaks nothing — the transport replaces the body and the error
  interceptor logs only `error.name`. Same class as b01 finding 5, which `insertSharedStaffPrincipal`
  now closes for the staff path. `owner/provision` is a pure insert with no read-decide-write and
  therefore no lost update, which is why it has no concurrency test, but it is the literal gap
  against acceptance item 6. **Inherited unchanged from the b01 carry.**
- **M3 — a generator defect would surface as a caller error.** `assertStaffPinShape` in the service
  raises `AccessRuleError`, which the transport maps unconditionally to `BAD_REQUEST`, so a server
  defect would reach the owner as a 400. Unreachable today, since `createStaffPin` emits eight
  digits. A status/naming inconsistency, not a live bug.
- **M4 — `deactivateOwner` can refuse spuriously.** The count locks only currently-active owners, so
  a reactivation or provisioning that commits after it is not reflected. The count can only
  under-report, so the last-active-owner invariant is never violated: it fails closed and a retry
  succeeds. Fixing it means widening the lock, which has deadlock implications and belongs in a
  separately verified change.
- **M5 — the "reactivation cannot resurrect sessions" guarantee is not concurrency-safe.**
  `AuthService.loginOwner` reads principal state, spends a full scrypt verification, then checks the
  now-stale `active` flag and inserts a session. A login landing inside `deactivateOwner`'s
  transaction can create an un-revoked row, and `reactivateOwner` does not advance the credential
  version, so on reactivation that row authenticates again. Practical impact nil — reactivation
  restores the same credential, so the session grants exactly what a fresh login would. **This is
  pre-existing Phase 4 code in `packages/auth/src/auth-service.ts`, outside this slice's
  `ownedPaths`. It must not be repaired here.** The equivalent race against `rotateStaffPin` and
  `resetOwnerCredential` fails closed permanently, because those do advance the version.
- **M6 — `gate_outcome: null` in the route-decision records.** Correct at the time and required to be
  completed after the gate by the directory's own README. Both records are now closed with their
  outcome and a note on what the route actually demonstrated.

M5 is the only finding with any security shape, and it is inherited, inert in practice, and outside
the scope this slice was authorized to touch. M1 and M3 are the strongest candidates for a small
follow-up slice; M4 needs its own verification because it changes locking.

## Verifier's own stated gaps

Recorded because an honest gap statement is worth more than a clean-looking one:

- It did not watch the candidate's own tests go red against the unrepaired carry — editing and
  worktrees were forbidden, so its negative control is at the SQL level plus the contention
  measurement. It neither reproduced nor relied on the implementer's measured control.
- It did not run `verify:full` at the base commit, so the browser flake is still attributed rather
  than experimentally proven pre-existing. Same gap the b01 verifier named.
- The deadlock evidence is database-level, not HTTP-level, and 640 operations on one machine is a
  bounded sample; the structural argument carries the conclusion.
- M5's scenario is traced through the code, not staged against a live server.
- It did not construct a deeper or differently-shaped driver wrapping for the `isUniqueViolation`
  cause-chain walk; the depth bound of 5 is exercised only by the pinned lockfile's shape.
- Rate limiting was not evaluated — correctly out of scope, a new decision named in the b01 record.
- No browser, accessibility, or visual inspection: the slice has no UI and those gates are
  `NOT_REQUIRED`.
