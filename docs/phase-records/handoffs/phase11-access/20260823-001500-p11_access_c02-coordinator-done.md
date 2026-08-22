# Phase 11 access Slice A — b02 integrated and DONE

- Status: **`DONE`**. `phase11-access-b02` integrated into `main`.
- Integrated commit: `8ff55f9badcfe17b49ab1de788dd64cf20ec0682`, reached by fast-forward — `main`
  had not moved from `6071e1b` and no other branch had touched the shared spine since.
- Predecessor `phase11-access` remains terminal `FAILED_VALIDATION`, preserved and unintegrated on
  `work/phase11-access-b01` at `623e4c3`, candidate `8e77536` reachable, never rewritten.
- Repair budget: **0 of 2 consumed**.
- Slice B has not started and was not started here.

## What shipped

The owner access-management domain and transport: provision, rotate, and deactivate the shared
staff PIN; provision, deactivate, and reactivate owners; reset an owner credential in-app. Each
mutation is atomic with its audit row, invalidates the sessions the locked decisions say it should,
and returns canonical 401 to anonymous callers and 403 to staff. No UI — that is Slice B.

b01 built all of this correctly for the sequential case and was rejected on three concurrency
defects. b02 carried that work forward unchanged in one revertible commit and closed every item on
the successor list.

## Chain of custody

| Commit | Stage |
|---|---|
| `453b82a` | Activation: ledger reconciliation, b01 preserved as rejected evidence, route-decision location designated |
| `f50a31d` | One-time path-scoped carry-forward of b01 candidate `8e77536` — twelve files, byte-identical, verified blob by blob by the independent verifier |
| `4a1df6b` | New refusal codes and the credential-reset rule |
| `d1a64bb` | Row locking on every mutation, typed refusals, corrected guarantee comment |
| `b273e7d` | The SPEC PIN-shape rule enforced at the seam |
| `cb7cd96` | Concurrency tests, and the `isUniqueViolation` defect they found |
| `54fc9b7` | Candidate record and gate results |
| `3066aff` | Independent-verification route decision |
| `8ff55f9` | Independent PASS recorded, one comment corrected, route records closed |

`git diff f50a31d 8ff55f9` is what b02 actually did; `git diff 6071e1b 8ff55f9` is the whole slice.

## Coordinator reconciliation performed before the attempt

The ledger on the S4 frontier had no record that b01 had ever run: its activation and terminal
state lived only on the unintegrated b01 branch. Corrected in the activation commit —
`phase11-access` now carries its terminal `FAILED_VALIDATION`, its stopReason, its candidate hash,
and its three handoffs as read-only rejected evidence on the frontier lineage. Its two shared leases
were released and re-granted to `p11_access_b02` with the same boundaries; the `phase-11` aggregate
was re-pointed from the terminal attempt to the successor, matching the `phase7-integration-b02`
precedent.

Two durable conventions were established because the active workflow requires them and FITWAY had
no location for either:

- `docs/phase-records/route-decisions/` — the machine-readable per-stage route record, with rules in
  its README. Both of this attempt's decisions live there and are closed with their gate outcome.
- `docs/phase-records/verification/` — the known-flaky register and the failure records checked
  against it. See below; this is the one that stops the next session re-deriving what two sessions
  have now paid for.

The two 2026-08-21 external-worker authorizations were reconciled as in force and **not**
re-requested, per the reuse rule.

## Gates

| Gate | Result |
|---|---|
| Unit | PASS — 62 files / 473 tests |
| Integration | PASS — 18 files / 120 tests at the integrated commit; the access file 22/22 over seven runs, four on freshly created databases |
| Browser / accessibility / visual | NOT_REQUIRED — the diff contains zero files under `apps/web/**` or `tests/browser/**` |
| Independent review | PASS |
| Full ladder at the integrated commit | PASS — `p11_access_int3`, complete, browser step 83/83, mutation guard clean |

## The one red run, and what was actually proven

`pnpm verify:full` at the integrated commit was **red on its first invocation** (`p11_access_int2`):
2 failed / 81 passed in the browser step. It is recorded here rather than re-run away.

Both failures were `tests/browser/phase2.browser.spec.ts:72` and
`tests/browser/phase10-ui-csv.browser.spec.ts:742` — two of the exact three locations the b01
independent verifier recorded as load-sensitive. They were put through
`scripts/flaky-attribution-check.mjs`, which fails closed, and returned `ATTRIBUTED_TO_REGISTER`
with no refusals. The two rules that actually bite both held: the candidate touches **zero** files
in either entry's surface, and the standalone re-run at that same commit is PASS (83/83,
`p11_access_std1`).

**The base-commit control did not reproduce it.** `pnpm verify:full` at `6071e1b` (`p11_access_base1`)
passed complete, browser 83/83. This is the experiment the b01 verifier named as its largest gap and
could not run for want of a prepared worktree. Running it narrowed the gap; it did not close it. A
single green sample cannot reproduce a stochastic load-sensitive failure, so it is **not** evidence
that the flake pre-exists, and it is equally not evidence against it. Recorded as inconclusive.

What carries the conclusion is the rest of the record, not that control:

| Run | Commit | Browser step |
|---|---|---|
| `p11_access_b02_g1` | `cb7cd96` candidate | 83/83 |
| `v11f_access_b02_r2` independent verifier | `3066aff` candidate | 83/83 |
| `p11_access_int2` | `8ff55f9` integrated | **2 failed / 81** |
| `p11_access_std1` standalone | `8ff55f9` integrated | 83/83 |
| `p11_access_base1` control | `6071e1b` base | 83/83 |
| `p11_access_int3` | `8ff55f9` integrated | 83/83 |

Five green full-or-standalone browser runs against one red, the red attributable under a check that
refuses by default, and the only difference between the green `3066aff` and the red `8ff55f9` being
a comment and some documents — which cannot reach the browser suite at all.

The debt itself is unchanged and remains coordinator work for whoever owns those specs. It is now
**registered** rather than re-described: `docs/phase-records/verification/known-flaky-register.json`
holds the three locations with their mechanism, provenance, and surface, transcribed from the b01
verifier's observations rather than opened by the session that first used it.

## Findings carried forward, from independent verification

Six minor, none blocking, none significant. One was fixed before integration — the
`appendGovernanceRow` comment was still written as universal while two call sites correctly take no
lock, which is the same class of overstatement b01 was rejected for. Comment text only, made after
the PASS, with `verify:fast` and a cold-database integration run afterwards.

Open, and deliberately not repaired here:

- **M1 — `owner/provision` has no typed refusal for a duplicate email and no concurrency test.** A
  collision on `auth_principals_owner_email_unique` reaches the caller as a bare 500. Fails closed,
  leaks nothing. Same class as the staff-path defect `insertSharedStaffPrincipal` now closes.
  Inherited unchanged from the b01 carry. **Best candidate for a small follow-up slice, with M3.**
- **M3 — a generator defect would surface as a caller error.** `assertStaffPinShape` raises
  `AccessRuleError`, which the transport maps unconditionally to `BAD_REQUEST`, so a server defect
  would reach the owner as 400. Unreachable today.
- **M4 — `deactivateOwner` can refuse spuriously.** The active-owner count locks only currently
  active rows, so a reactivation committing after it is not reflected. The count can only
  under-report, so the last-active-owner invariant is never violated: fails closed, retry succeeds.
  Fixing it widens the lock and has deadlock implications — **needs its own verification**.
- **M5 — the "reactivation cannot resurrect sessions" guarantee is not concurrency-safe.**
  `AuthService.loginOwner` reads principal state, spends a full scrypt verification, then checks the
  now-stale `active` flag and inserts a session, so a login landing inside `deactivateOwner`'s
  transaction can leave an un-revoked row that authenticates again after reactivation. Practical
  impact nil — reactivation restores the same credential, so that session grants exactly what a
  fresh login would. **Pre-existing Phase 4 code in `packages/auth/src/auth-service.ts`, outside
  this slice's `ownedPaths`. It was not repaired here and must not be repaired opportunistically.**
- **M6 — route records left `gate_outcome: null`.** Closed.
- **`isUniqueViolation`'s depth-5 cause-chain walk** is exercised only by the pinned driver's
  wrapping shape. A driver upgrade could in principle move `23505` out of reach and silently return
  a refusal to a 500. Worth a note on any `drizzle-orm`/`pg` bump.

## Environment finding

`pnpm verify:fast` fails in a fresh shell with `CRON_SECRET must be supplied to the cron test
process`. Neither `vitest.config.ts` nor `scripts/verify.mjs` loads a `.env`; the latter passes
`process.env` through unchanged. From this worktree root, `set -a; . ./.env; set +a` supplies the
whole required set. `docs/WORKFLOW.md` step 8 names `apps/server/.env` for `verify:full` but does
not name this — that document is outside this slice's owned paths, so the gap is recorded as
coordinator follow-up rather than edited here.

## Recommended next session

**Slice B — `phase11-access-ui`**, the owner access surface: the management UI, its bilingual copy,
its states, its accessibility pass, and its canonical baselines. It is now unblocked: Slice A is
integrated at `8ff55f9`, and the seven approved action labels, the secret-free audit rule, and the
owner lifecycle decisions remain human-locked and implemented as written.

Slice B will need the refusal codes this slice added — `staff_pin_already_active`,
`staff_pin_not_active`, and the reused `owner_already_inactive` — mapped to copy. The b01 record
anticipated exactly that.

Before it starts, a coordinator should decide whether M1 and M3 fold into Slice B or take their own
small slice. They are transport-level, not UI, so a separate slice is cleaner.

Not blocked on any human decision. Rate limiting on the owner access leaves remains an open **new**
decision, named in the b01 terminal record and neither added nor evaluated here.
