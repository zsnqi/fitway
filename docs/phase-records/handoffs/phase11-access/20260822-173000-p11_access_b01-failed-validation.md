# Phase 11 access Slice A b01 — FAILED_VALIDATION on independent verification

## Terminal state of this attempt

- Status: `FAILED_VALIDATION`. Repair attempts consumed by b01: **0 of 2**.
- The stop is a rejected candidate, not an exhausted budget and not an authority conflict. The
  defects are ordinary, located, and repairable; no repair was attempted because this session was
  instructed to complete closure only and stop.
- Base / candidate: `6071e1b` / `8e77536bebcda08f401d0c3d4db296bab8cf3286`. Candidate preserved on
  `work/phase11-access-b01`, **not integrated**. `main` remains at `6071e1b`.
- Slice B has not started and must not start on this candidate.

## Independent verdict

Fresh verifier, run ID `v11f_access_r1`, a session that did not produce the candidate, returned
**FAILED_VALIDATION**. All eleven locked 2026-08-11 decisions were marked HELD against probes it
designed and ran itself, and it found **no secret material** reachable in any audit row, response, or
log by any path it could construct. It also proved the audit row shares the mutation's transaction by
installing a trigger that fails the append and confirming the principal update, the credential
update, and the session revocation all rolled back with it, and proved two of the candidate's own
assertions can fail by disabling the guards they cover and restoring the files to verified blob
hashes.

The rejection rests on defects the locked-decision checklist does not cover.

## Coordinator confirmation, independent of the verifier's measurements

Confirmed by reading `apps/server/src/access-repository.ts` on the candidate, not by accepting the
report:

**Exactly one of the six governance mutations locks the rows it reasons about.** `deactivateOwner`
calls `countActiveOwnersForUpdate` at `:467`, whose `.for("update")` is at `:161`. Every other
mutation reads through `readStaffState` (`:255`, `:326`, `:372`) or `readOwnerState` (`:527`, `:583`)
with no lock at all, then writes a value derived from what it read. Under READ COMMITTED two
concurrent transactions read the same version and both write the same successor. The mechanism is
unambiguous from the code; the verifier's reproduction counts (3/3 for rotation, 5/5 for
reactivation) are its measurements, recorded here as its evidence rather than re-measured.

**The module comment overstates what the design guarantees.** `appendGovernanceRow` at
`access-repository.ts:171-180` says a caller "cannot describe a transition that did not happen."
That holds against a malicious caller — the snapshots are read server-side — but not against a
concurrent one: two simultaneous reactivations each observe `active=false`, each pass the assertion,
and each append a row claiming `false → true`. One of those two rows describes a transition that did
not happen. The comment must be corrected along with the code.

## Confirmed findings, ranked

1. **[significant] Concurrent `staffPin/rotate` reveals two PINs, only one of which is the stored
   credential.** `access-repository.ts:319-362`. The one-time reveal is the only channel by which a
   PIN reaches a human, and there is no read path, so an owner handed the losing reveal has no
   recovery except another rotation — for the single credential the whole front desk shares. This is
   the most consequential of the three.
2. **[significant] Concurrent `owner/reactivate` writes two `owner_reactivated` rows for one
   transition.** `access-repository.ts:521-566`.
3. **[significant] Concurrent `owner/resetCredential` writes rows asserting the same version
   transition twice and loses an increment.** `access-repository.ts:575-625`. No authentication is
   weakened — every one of the concurrent transactions revoked the principal's sessions, and the
   verifier confirmed the old cookie stays dead.
4. **[minor] `owner/resetCredential` on a deactivated owner re-enables the credential row while the
   principal stays inactive.** `access-repository.ts:582-607` has no `active` check on the target and
   sets `active: true` unconditionally. Login is still refused because `AuthService` checks both
   flags, so nothing is exploitable — but it half-undoes a deactivation without an
   `owner_reactivated` row, which is a state the audit log does not describe.
5. **[minor] Concurrent `staffPin/provision` surfaces as an untyped 500** rather than the domain
   refusal, arbitrated by the unique indexes. It fails closed and leaks nothing.
6. **[minor] `isStaffPinShape` and `assertStaffPinShape` are test-only.** Confirmed by the
   coordinator: `grep` across `packages/` and `apps/` finds callers only in
   `packages/auth/src/access.test.ts`. **This makes a claim in the b01 candidate record inaccurate.**
   That record's decision table says the 6-12 Western digits rule "lives now" in `isStaffPinShape`;
   in fact nothing in the access path calls it, and the shape holds only because `createStaffPin`
   emits exactly eight digits. The candidate record is the durable record of what was submitted and
   is correctly left unedited; the correction lives here.
7. **[minor] Three state refusals reuse the `staff_pin_shape` code** (`:257`, `:328`, `:374`).
   "An active staff PIN already exists" and "There is no active staff PIN to rotate" are not shape
   problems, and Slice B will map codes to copy.

## The blocking finding, and why it is not attributed to this slice

The verifier's `pnpm verify:full` was red at the candidate on **4 of 4** runs, always exactly
`1 failed / 82 passed` in the browser step, and across three *different* specs —
`phase10-ui-csv.browser.spec.ts:742`, `phase3.browser.spec.ts:57`, `phase2.browser.spec.ts:72`. The
coordinator's own `verify:full` on `p11_access_b01_g1` passed complete. Both results stand.

Attribution, on the verifier's evidence and the coordinator's agreement: the diff contains no file
under `apps/web/**` or `tests/browser/**`; `playwright.config.ts` starts only the web dev server, so
this slice has no runtime presence in the browser gate at all; and `apps/web/src/utils/orpc.ts`
imports the router as a type only, so the router change is erased at build. The browser suite run
standalone at the same commit passes 83/83. The three failing assertions are transient-state and
cache-expiry timings.

This is **repository debt, and it is now broader than recorded at the S4 close.** That record named
one load-sensitive assertion, `phase2.integration.test.ts:788`. The correct statement is that the
browser step of `verify:full` is load-sensitive in at least four places once it runs after build,
unit, and integration in one invocation. Two independent sessions have now hit it on unrelated
candidates. It is outside this slice's `ownedPaths` and was correctly untouched.

The verifier states its own largest gap honestly: it did not run `verify:full` at the base commit
`6071e1b` to prove the flake pre-exists by experiment, because that needs a second worktree. The
attribution therefore rests on the diff's contents and the standalone run, not on a base-commit run.

## What the verifier found sound

Recorded because it is the part a successor attempt must not undo:

- All eleven locked decisions HELD, each against a probe the verifier designed.
- Self-deactivation, the last-active-owner rule under ten consecutive two-owner races and a seven
  request three-way storm, session invalidation, non-resurrection after reactivation (including
  after adversarially clearing `revoked_at`), no hard-delete path, injected-PIN rejection, no PIN in
  any read, seven approved actions only, no secret in any audit row, and reason-required on exactly
  the two destructive actions.
- Canonical 401 anonymous and 403 staff on all eight leaves, plus 401 for a forged cookie.
- No Phase 4 authentication guarantee weakened. `packages/auth/src/crypto.ts` and `auth-service.ts`
  are unmodified; the pepper derivation is byte-identical, only named.
- `packages/db/**` untouched — no migration. `packages/api/src/audit/**` untouched.
- Scope: every file inside `ownedPaths` or a recorded `sharedLeases` entry.

## Coordinator ruling on the governance note

The verifier flagged that `PROJECT_STATE.yaml` appears in the candidate diff while this phase's own
`forbiddenPaths` names it, and that the lease extension in `0ad2abf` was self-granted by the session
that then used it. Both observations are correct and were right to raise.

Ruling: within authority, and the pattern is the one `AGENTS.md` prescribes — the coordinator is the
sole writer of the ledger, the `forbiddenPaths` entry scopes worker sessions, and `ownerSession` for
this slice names a coordinator session. The self-granting is inherent to a coordinator executing a
slice directly rather than delegating it: there is no second authority to grant a lease. What makes
it auditable rather than silent is that each extension was recorded in its own commit **before** the
edit it authorized — `0ad2abf` precedes the `context.ts` change, and the `access-service.ts` and
`runtime.ts` entries precede those files. A successor attempt should keep that ordering.

## Verification not performed

- No repair, so no post-repair gate run exists.
- The coordinator did not re-measure the three concurrency races; the code path was confirmed by
  inspection and the counts are the verifier's.
- No `verify:full` run at the base commit, so the browser flake is attributed rather than proven
  pre-existing by experiment.
- No UI exists in this slice; browser, accessibility, and visual gates are `NOT_REQUIRED`.
- Rate limiting on the owner-authenticated access leaves was neither added nor evaluated. It is a new
  decision, not an omission from the locked eleven.

## What a successor attempt needs

Not a new human product decision — every rule it must satisfy is already locked and already
implemented correctly for the sequential case. A fresh `p11_access_b02` activation with a repair
budget of 2 would need to:

1. Lock the rows each mutation reasons about, as `deactivateOwner` already does, in
   `rotateStaffPin`, `deactivateStaffPin`, `provisionStaffPin`, `reactivateOwner`, and
   `resetOwnerCredential`.
2. Correct the `appendGovernanceRow` comment so it claims only what the code guarantees.
3. Refuse `resetOwnerCredential` on an inactive principal, or state why it is allowed and audit it.
4. Give the three state refusals their own codes.
5. Either call `assertStaffPinShape` on the generated PIN before it is hashed, or drop the pair and
   stop claiming the SPEC rule lives there.
6. Extend the integration test to the concurrent case for every mutation, not only deactivation —
   the sequential suite passed 16/16 six times and did not catch any of this.

The repository debt in the browser step of `verify:full` is coordinator work and belongs to whoever
next has authority over those specs; it is not a successor attempt's to fix.
