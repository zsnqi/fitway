# Phase 5 staff UI — monitoring-only closeout

- Status: `READY_FOR_INTEGRATION` (worker candidate; the coordinator declares `DONE`)
- Date: 2026-08-07
- Branch / worktree: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry`
- Base commit: `229b9ce1f50ba8f598ea60556913a8b98ac0c228`
- Run ID: `p5_staff_b03_retry`
- Authority: [ADR-008](../adr/ADR-008-staff-monitoring-only.md), `FITWAY_PRODUCT.md`,
  `SPEC.md`, `PHASES.md` Phase 5, `DESIGN_GUIDE.md`
- Specification:
  [the monitoring-only closeout plan](handoffs/phase5-staff-ui/20260806-155000-p5_staff_monitoring_only-plan.md)
- Provenance: [the Paper design phase closeout](paper-design-phase-closeout.md) open question 4,
  and the [human visual verdict](handoffs/phase5-staff-ui/20260727-230622-p5_staff_b03_retry-human-visual-verdict.md)
  on the unmerged candidate

## Outcome

The deliverable of this slice is the **absence** of a staff command surface, plus the monitoring
and login salvage that survives the decision. `/staff` is monitoring-only: live occupancy, device
health, and freshness, with no correction, direct entry, reset, or reset confirmation dialog.

The staff command UI was never merged to `main`; this branch is its only record. Nothing was
removed from the running product UI. What was removed from `main`'s behavior is the two
integrated oRPC leaves.

## What was retired

| Retired | Where it lived |
| --- | --- |
| `staff.issueCorrection`, `staff.issueReset` | `packages/api/src/routers/index.ts` (integrated on `main`) |
| `staff.recentCommands` and `recentCommandsSchema` | `packages/api/src/commands/recent-commands.ts` (branch-only) |
| `requireCommandService`, `handleCommandIssue` | `packages/api/src/routers/index.ts` |
| `commandService` and `readRecentCommands` context dependencies | `packages/api/src/context.ts`, `apps/server/src/index.ts` |
| `createRecentCommandReaderDatabase`, `readRecentCommands` | `apps/server/src/command-repository.ts` |
| Staff command panel, stylesheet, messages, validation, `useStaffCommands` | `apps/web/src/components/staff/commands/**`, `apps/web/src/hooks/use-staff-commands.*` (branch-only) |
| `tests/browser/phase5-staff-ui.browser.spec.ts` | branch-only |

The `commandService` field was **removed** from the oRPC context rather than left inert. An
optional injected command service with no caller is a standing re-exposure path for a surface the
product withdrew; removing it makes the decision structurally true rather than merely unused.

## What was preserved

`CommandService` and its unit tests, the command queue, `commandTypeSchema`/`correctionInputSchema`
/`resetInputSchema` and the rest of `packages/api/src/commands/schemas.ts`, edge push delivery and
acknowledgement, supersession, the transactional audit path, `createCommandServiceDatabase`, the
exported `commandService` singleton that Phase 7's cron route calls directly, `packages/db`'s
`edge_commands` schema and migration `0005`, the edge simulator and its fixtures,
`apps/server/src/openapi.ts`, and `operationalSnapshotSchema.source`.

`CommandActor` and `HumanAuditEntry` keep their `shared_staff | owner` human actor types. The
rewritten integration test still constructs a canonical human principal to prove lifecycle
mechanics. Reconciling the actor model with `system`-issued scheduled resets is Phase 7 work and
was not started here.

## Coverage that stopped being provable

This is the honest cost of the retirement. It is recorded here because the plan and the shared
lease both require it to be stated rather than silently erased.

**1. Staff-or-owner role enforcement on the retired leaves.**
`packages/api/src/commands/router.test.ts` (deleted) proved, through `call(appRouter.staff.issueCorrection, …)`:

- a `shared_staff` principal is accepted and canonical provenance reaches the service unchanged
  (`issueCorrection` called with the exact `CanonicalAuthContext`);
- an `owner` principal is accepted on the same leaf;
- a null principal is rejected with oRPC code `UNAUTHORIZED`;
- `appRouter.staff.issueReset` enforces the same authorization.

`apps/server/src/phase5-command-domain.integration.test.ts` proved the same property over real
HTTP: an unauthenticated `POST /rpc/staff/issueCorrection` returned `401`, and staff and owner
cookies both returned `200`.

None of this is provable now, because the procedures no longer exist. It is **not** a regression
in role enforcement: `staffProcedure` and `ownerProcedure` are unchanged, `staff.session`,
`staff.operationalSnapshot`, and the `admin.*` leaves still re-check role server-side, and
`apps/server/src/phase4-auth.integration.test.ts` still proves the authorization middleware
itself. What is gone is per-leaf proof for two leaves that no longer exist.

A second loss travels with this one and is recorded separately because it is easy to miss. The
rewritten integration test synthesizes a `CanonicalAuthContext` from a principal row
(`apps/server/src/phase5-command-domain.integration.test.ts:100-122`) instead of obtaining one from
the real staff-PIN and owner-password logins the file previously performed, and its audit
assertions check `actorPrincipalKind` and `actorRole` but not `actorPrincipalId`. So the
login → context → audit provenance chain is no longer exercised *in this file*: a change writing
the wrong principal id into `audit_log` would not be caught here. Impact is low — no product
surface issues commands, and `apps/server/src/phase4-auth.integration.test.ts:126,133,189,199` with
`packages/api/src/auth/session-router.test.ts:35-63` still prove session issuance and the
authorization middleware over real HTTP.

**2. Leaf-level input validation.**
The same deleted test proved that `{ absolute: -1 }` was rejected at the procedure boundary
*before* the command service was called (`expect(commandService.issueCorrection).not.toHaveBeenCalled()`),
and the integration test proved four malformed correction shapes and one malformed reset shape
returned HTTP `400`.

This property survives in weakened form and is re-proved in the rewritten integration test: the
command service itself calls `correctionInputSchema.parse` / `resetInputSchema.parse` before
opening a transaction, so the same five malformed inputs are rejected and the database is proved
byte-identical afterwards. What is lost is the HTTP status code mapping, not the validation.

**3. `CommandIssueError` → `BAD_REQUEST` translation.**
`handleCommandIssue` in `packages/api/src/routers/index.ts` translated a `CommandIssueError`
(`current_count_unavailable`, `device_unavailable`, `target_out_of_range`) into oRPC
`BAD_REQUEST`. The helper is deleted with its only callers.

Note for accuracy: no test ever exercised that translation directly. A repository-wide search for
`BAD_REQUEST` before this slice found it in exactly two places — the helper itself and a mocked
route in the unmerged browser spec. So this is the loss of an untested behavior, not of test
coverage. The underlying errors are still raised and still unit-tested in
`packages/api/src/commands/service.test.ts`; only the HTTP translation is gone.

**4. `/rpc/staff/recentCommands` end-to-end coverage.**
`apps/server/src/phase5-staff-recent-commands.integration.test.ts` (branch-only, deleted) proved
authorization, the four-row cap, private lifecycle field shape, and the absence of audit/actor
data in the response. Its whole subject was a leaf that was never merged.

**5. The browser end-to-end staff correction.**
`SPEC.md`'s thin end-to-end pass previously included "a staff correction flows through the
simulated edge to the public payload". There is no staff correction to flow. The command path is
now exercised at the integration level instead; `SPEC.md` records the amendment.

## The re-proof of `phase5-command-domain`'s acceptance evidence

`phase5-command-domain` is `DONE` with `integration: PASS`, and three of its four `it` blocks
drove the lifecycle through the retired leaves. This slice rewrites issuance to call
`commandService.issueCorrection(actor, …)` / `issueReset(actor, …)` directly against the disposable
database, using a canonical `shared_staff` or `owner` principal. Every non-authorization assertion
is unchanged.

| `it` block | Change |
| --- | --- |
| `rejects strict correction/reset input and backfill-shaped live pushes without side effects` | Was `enforces authorization and strict …`. The `401` assertion is gone with the endpoint; the five malformed-input rejections moved to the service, and the no-side-effect snapshot now spans the invalid issuance attempts as well as the invalid backfill. The backfill half is unchanged. |
| `atomically issues monotonic commands, floors delta, supersedes latest-only, and preserves cloud current state` | Issuance swapped to direct service calls. All assertions — delta flooring to 0, monotonic IDs, `superseded`/`pending` statuses, `supersededByCommandId`, both audit rows with their actor kind/role/action/values/reason, and current state still at 10 — unchanged. |
| `delivers latest-only and advances lifecycle only on eligible accepted acknowledgements` | Only the reset issuance swapped. The whole edge delivery/acknowledgement half — first delivery, replay, sequence gap, ineligible and superseded acknowledgement ids, latest-only reset delivery, applied transition, idempotent replay of an applied command, and current state at 0 — unchanged. |
| `rolls back command, supersession, and audit together when audit append fails` | Already used a direct service call. Now reuses the shared staff actor instead of re-querying the principal. |

The rewritten file also drops the staff/owner HTTP logins and the `rpc()` helper, which existed
only to reach the retired leaves. Principals are still provisioned through `AuthService`, so the
actors are real rows, not fabricated identities. Edge push still crosses real HTTP.

## Also landed

- The `apps/server/src/command-repository.test.ts` module-scope `packages/db` blocker that kept
  `pnpm verify:fast` red is resolved. Its only subject was `createRecentCommandReaderDatabase`,
  which this slice retires; the file is removed with it. See "Deviation" below.
- The monitoring and login salvage carried in `885b5b0` (replayed from `6cc6d6a`) is retained:
  `staff.css` login watermark pinning, the login skip-link fix, card lighting and monitoring
  layout; `operational-snapshot-view.tsx` dropping the decorative `HeartPulse`, the
  `schemaVersion` row, and the always-"now" computed line; the matching `messages.ts` type
  removals; and the `ar`/`en` login copy and `جهاز العد` terminology.
- `staff.description` is reverted in both catalogs to its pre-`6cc6d6a` monitoring-only wording.
  It was the last place the monitoring surface advertised command controls.

## Deviation from the recorded lease, for coordinator ratification

The shared lease grants `CONSTRAINED WRITE` to `apps/server/src/command-repository.test.ts` "for
the known module-scope packages/db test-collection repair". The file was **deleted** instead.

Reason: the same lease requires removing the retired recent-command plumbing from
`apps/server/src/command-repository.ts`, and `createRecentCommandReaderDatabase` is that
plumbing's only export. The test file (branch-only, added by `67feb96`) has no other subject. The
collection failure is caused by importing `./command-repository` at all — the surviving
`commandService` singleton evaluates `@fitway/db` at module scope — so no write to the test file
could repair it while keeping a truthful subject. Deletion is the only outcome that satisfies both
lease clauses. Flagged rather than assumed.

## Not in scope, and deliberately not done

- **No Paper production family was implemented.** `/staff` does not match
  `STAFF MONITORING PRODUCTION SET — CURRENT`. Per ADR-007 no production family has been
  implemented anywhere in the repository; adopting the staff family is separate later work.
- **Decision 6 stays deferred.** `operationalSnapshotSchema.source` and the frozen operational
  snapshot DTO are untouched. The `manual` enum value is retained and recorded as a Phase 6
  review item in `PHASES.md`.
- **`scripts/verify.mjs` was not edited by this slice's implementation commits.** The repoint was
  withheld from the worker lease and performed by the coordinator afterwards in `3fac5ad`, which is
  on this branch: `browserFiles` now names `tests/browser/phase4-staff-web.browser.spec.ts` and
  `integrationFiles` names `apps/server/src/phase5-command-domain.integration.test.ts`, closing the
  empty-`integrationFiles` gap that `docs/phase-records/paper-design-phase-closeout.md` preserved as
  open question 3. `pnpm verify:phase --phase phase5-staff-ui` therefore does pass at this head.
- **`RESEARCH.md` was not edited.** Its risk table still names "manual fallback" as a mitigation
  (`RESEARCH.md:283`) and `:576` still names "Staff correction/reset usability". Both are
  rationale/provenance, not normative, and outside this slice's lease. Carried forward.
- **`SPEC.md:496-498` still lists "pending command status"** in the staff-or-owner operational
  snapshot, while the frozen DTO at `packages/api/src/health/snapshot.ts:41-50` carries no such
  field. This pre-dates the slice on `main` and does not contradict ADR-008 — reading pending status
  is monitoring, not issuance — so it is a spec/implementation mismatch, not a surviving
  command-surface requirement, and reconciling it is outside the monitoring-only lease. Carried
  forward to its owning slice.
- **No automated negative control guards the deliverable.** The deliverable is the *absence* of a
  command surface, but the repointed browser profile runs Phase 4's monitoring coverage;
  reintroducing a command control on `/staff` would fail no test. The plan defers this to human
  confirmation (validation item 7). Carried forward.
- No Phase 6, 7, 10, or 11 work, no actor-model change, no redesign, no unrelated cleanup.

## Validation

Run with `FITWAY_RUN_ID=p5_staff_b03_retry`, Playwright port `20645`, and the disposable database
`fitway_integration_p5_staff_b03_retry` in the guarded local container `fitway-phase2-postgres`
(`127.0.0.1:55432`), which had to be started for this run.

| Command | Result |
| --- | --- |
| `pnpm check:repository` | PASS — 31 milestones, 8 canonical approval screenshots |
| `pnpm verify:fast` | Repository invariants PASS; Biome fails on the untracked machine-local `.claude/launch.json` only (see below); `pnpm check-types` PASS; `pnpm test` 35 files / 138 tests PASS; `pnpm test:simulator` 5 tests PASS |
| `pnpm exec biome check apps packages tests scripts edge docs brand design-research visual-direction-gate *.ts *.json *.jsonc` | PASS — 210 files, no diagnostics |
| `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase5-command-domain.integration.test.ts` | PASS — 4/4 `it` blocks |
| `pnpm exec playwright test tests/browser/phase4-staff-web.browser.spec.ts` with `VITE_SERVER_URL=/api` | PASS — 10/10 |

`pnpm verify:fast` is red for exactly one reason unrelated to this slice: an untracked,
machine-local `.claude/launch.json` in this worktree is not Biome-formatted. It is the only Biome
diagnostic in the tree. It was not deleted and `biome.json` was not edited; Biome restricted to
tracked source is clean.

After the coordinator repoint landed in `3fac5ad`, `pnpm verify:phase --phase phase5-staff-ui` was
run twice at this head and passed both times, once by the coordinator (run id `p5_staff_b03_retry`,
port `20645`) and once by an independent verifier from a clean session with its own run id
(`p5_verify_indep`), its own disposable database, and port `20647`: repository invariants PASS
(31 milestones, 8 canonical approval screenshots), Biome 211 files clean, all workspace type checks
PASS, 35 unit files / 138 tests PASS, 5 simulator tests PASS, 4/4 integration blocks PASS, 10/10
`phase4-staff-web` browser tests PASS, repository mutation guard clean. The untracked machine-local
`.claude/launch.json` was Biome-formatted in place by the coordinator so it stops blocking the
ladder; no tracked source and no `biome.json` entry changed.

Independent verification returned `PASS`. Its findings were minor and are recorded above: the
weakened validation oracle (item 2), the provenance-chain loss (item 1), the carried-forward
`SPEC.md:496-498` mismatch, and the absent negative control. Human confirmation that `/staff` shows
no command affordance remains outstanding and is the coordinator's to schedule.

## Coordinator integration, 2026-08-08

Integrated by merge commit `6321949` onto `main` head `6e65774`. The candidate branch carried
**twelve** commits since the recorded `baseCommit` `229b9ce`, not the five this record and the
handoff foreground: `608c1f8` and its six predecessors were also absent from `main`. Cherry-picking
only the five would have failed, because `f5bc29e` retires a command UI that `ed10781` introduces.
A merge was therefore both the repository's established convention and the only correct mechanism.

The worker branch never touched `PROJECT_STATE.yaml` — it is byte-identical to the M0 baseline — and
`main`'s four coordinator commits touched only the ledger and two handoff files. The merge therefore
preserved coordinator history verbatim: no ledger commit was replayed and no handoff duplicated.
This was confirmed before committing by diffing the predicted merge tree against both parents; the
resulting tree `444e1ce` matched that prediction exactly.

`pnpm verify:full`, run id `p5_staff_full2`, Playwright port `20657`, disposable database
`fitway_integration_p5_staff_full2`, at `6321949`:

| Step | Result |
| --- | --- |
| Repository invariants | PASS — 31 milestones, 8 canonical approval screenshots |
| Biome | PASS — 210 files, no fixes |
| Type checks | PASS — all workspaces |
| Unit tests | PASS — 35 files / 138 tests |
| Python simulator | PASS — 5 tests |
| Build | PASS — `pnpm -r build` |
| All integration tests | PASS — 7 files / 26 tests |
| All browser and accessibility tests | PASS — 29/29 |
| Repository mutation guard | PASS — "Verification full passed without repository mutation" |

**The browser gate depends on an untracked file, and this cost a full run.** The first `verify:full`
at `6321949` failed one test — `tests/browser/phase4-staff-web.browser.spec.ts:187`, "honors
Retry-After" — which asserted the alert contains `5` but received a 30-second cooldown. It was not
merge-caused: `apps/web/src/routes/login.tsx` and `apps/web/src/lib/auth-client.ts`, the entire code
path producing that value, are byte-identical across the merge, and the test mocks the network with
`page.route`, so no server limiter was involved. The cause is that `playwright.config.ts` does not
pin `VITE_SERVER_URL`, so the run inherited `http://localhost:3100` from untracked machine-local
`apps/web/.env`. `Retry-After` is not a CORS-safelisted response header, so cross-origin it reads as
`null` and `login.tsx:80` falls back to `?? 30`. Re-running with the canonical `/api` — the value
`scripts/sync-vercel-env.ts` maps for deployment, and the value this record already documents at the
row above — passes 29/29. No test, config, or threshold was changed to obtain the green run.
Pinning that variable belongs to whoever owns test-resource configuration; it is not Phase 5's.

### Gate resolution

`unit`, `integration`, `browser`, `independentReview` — `PASS`, from the run above.

`accessibility` — `PASS`. This is real evidence for this surface, not a suite-level inference:
`tests/browser/phase4-staff-web.browser.spec.ts:409` navigates to `/staff` at `:417` and runs
`new AxeBuilder({ page }).analyze()` at `:438`, in Arabic RTL and English LTR at every required
width, and passed.

`visual` — **stays `PENDING`, and `verify:full` cannot close it.** `toHaveScreenshot` appears only
in `tests/browser/public-baseline.browser.spec.ts`, whose six canonical baselines cover the public
surface. **No canonical `/staff` baseline exists**, so a green visual step proves nothing about the
surface this slice changed — and it did change it: `staff.css` by 116 lines and
`operational-snapshot-view.tsx` by 19. Marking this `PASS` would claim evidence that does not exist.

### Why this phase is `NEEDS_HUMAN` and not `DONE`

The human visual verdict of 2026-07-27 did not approve the staff experience and required a bounded
refinement pass **followed by a fresh human visual review**. The refinement landed in `885b5b0` and
is now integrated. The fresh human review never happened. The monitoring-only plan asserts at line
146 that the salvage "answered" the verdict, but that is an agent-authored claim, and an agent
cannot discharge a human approval requirement. Several verdict items — metric balance, empty space,
label clarity, header hierarchy, RTL/LTR visual continuity, login copy density, decorative controls
that look interactive — concern the monitoring and login surfaces that survive the retirement, so
they are not made moot by removing the command UI.

Independently, the plan's validation item 7, human confirmation that `/staff` shows no command
affordance, is outstanding. It has no automated negative control by design: the deliverable is an
absence, and the repointed browser profile runs Phase 4 monitoring coverage, so reintroducing a
command control would fail no test.

`scripts/verify-repository.mjs:205-211` independently enforces this: a `DONE` milestone with a
`PENDING` gate fails the invariant check. `phase-5` therefore cannot close either, per `:164-166`.

### Coordinator ratification

`docs/phase-records/paper-design-phase-closeout.md` was edited by `12d8be2` and `608c1f8` although
`forbiddenPaths` reads "every other milestone's phase record". Ratified: the diff only closes that
document's own open question 4, which is precisely the human decision this slice implements, and it
introduces no new product decision. Recorded here rather than waived silently.

The four shared leases are released; the work they covered is integrated. Release reflects that no
writer holds these files, **not** that the phase is complete.
