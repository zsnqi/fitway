# S5 / phase11-access Slice B — successor slice plan

Mode: `plan`. Deliverable is this plan only. Nothing was implemented and no slice was started.

> **Durable-record note.** Plan mode confines writes to this file. On adoption, the coordinator
> copies this document into the repository as
> `docs/phase-records/handoffs/phase11-access/<timestamp>-p11_access_ui_b01-activation-and-plan.md`
> inside the activation commit. The conversation is not the record.

---

## Context

`phase11-access` Slice A (domain and transport) is accepted and integrated. `PHASES.md` defines
`phase11-access` as spanning a credential domain, a transport, an owner management surface,
bilingual copy, and canonical baselines — which is not one rollback boundary, so the slice was
split along the seam the repository already uses for `phase9-analytics-domain` / `phase9-owner-ui`
and `phase11-audit` / `phase11-audit-generalization`. Slice A shipped; Slice B is the owner access
surface and has not started.

**Frontier, checked against the repository, not remembered:**

| Fact | Value |
|---|---|
| Branch / worktree | `main` at `aaa646b`, clean, in `D:/Projects/fitway-worktrees/phase5-staff-integration` |
| Slice A integrated commit | `8ff55f9` (`phase11-access-b02`, `DONE`, all gates PASS, repair budget 0 of 2) |
| Two commits after it | `be98817`, `aaa646b` — ledger and verification records only, no executable code |
| Predecessor | `phase11-access` terminal `FAILED_VALIDATION`, preserved unintegrated on `work/phase11-access-b01`, never rewritten |
| Transport in place | `admin.access` mounted at [packages/api/src/routers/index.ts:135](packages/api/src/routers/index.ts:135) via `adminAccessProcedures` |
| `phase-11` aggregate | `PLANNED`, depends on `phase11-access-b02`; `phase11-settings` still `PLANNED` |
| Focused verify profile | **None exists for access** — `scripts/verify.mjs` has `phase11-health`, `phase11-audit`, `phase11-shell`, `phase10-ui-csv`, but no access profile |

**Authority.** The eleven human decisions of 2026-08-11 are locked and implemented as written
(no self-deactivation; no deactivation of the last active owner; deactivation invalidates
credentials and sessions; reactivation is a separate explicit action; no hard delete in V1;
staff PINs system-generated, 6-12 Western digits, revealed once, never emailed; owner password
reset in-app with no email flow; the seven-action secret-free audit set; a reason required only
for the two destructive actions). Slice B renders them; it does not reinterpret them.

**Two human decisions taken in this planning session** (recorded here because they exist nowhere
in the repository):

1. **The load-sensitive browser debt is stabilized before Slice B activates.** All three entries in
   `docs/phase-records/verification/known-flaky-register.json` carry
   `surface: ["apps/web/**", "tests/browser/**"]`. Slice B is entirely inside that surface, so the
   fail-closed rule *"a candidate that touches the entry's surface loses the attribution"* means
   Slice B could not attribute any of those three reds — a load-sensitive failure would be scored
   as a real gate failure against its repair budget. The register is not narrowed and the risk is
   not accepted; the debt is fixed first.
2. **M1 and M3 take their own transport slice, not Slice B.** They are transport-level, and folding
   them in would break Slice B's rollback boundary and force it to hold both server and web scope.

---

## Sequence

Three slices, strictly sequential, one writer at a time. Slice B is the third.

```
P2  access transport follow-ups (M1, M3)      →  P1  browser load-sensitivity debt  →  B  Slice B
    packages/api, apps/server                     tests/browser only                     apps/web + tests/browser
```

`P2` runs first because Slice B must map its new typed refusal to copy, and because a server-only
candidate can still attribute a register red while the debt is open. `P1` runs immediately before
Slice B so the deflaked ladder is the one Slice B is judged on.

### What is coordinator-only, across all three slices

The distinction that matters is **authority versus execution**, and this plan keeps them apart.

Coordinator-only, because each is an actual authority, ledger, or integration responsibility:
activation and the ledger transition; granting and releasing write leases, including a lease over
another milestone's owned paths; owning migration and generated-file ordering; writing
`PROJECT_STATE.yaml` and `scripts/verify.mjs`; submitting a candidate to independent verification;
integrating; and declaring a terminal state.

**Everything else — every implementation and investigation stage in all three slices — has its route
left open.** Cross-milestone ownership is a reason the *coordinator must grant the lease*; it is not
a reason the coordinator must *perform the edits*. Holding one authoritative writer at a time is
satisfied by a single leased worker exactly as it is by the coordinator. The qualified OpenCode pool
named in `docs/WORKFLOW.md` — DeepSeek V4 Pro, Ox Alpha, GLM-5.3, MiniMax M3 — competes normally on
every one of those stages, under the two durable 2026-08-21 authorizations, which are reconciled
rather than re-requested.

### P2 — access transport follow-ups (precondition, not started here)

- **Objective.** `owner/provision` returns a typed refusal for a duplicate owner email instead of a
  bare 500 on `auth_principals_owner_email_unique` (M1), with a concurrency test in the same shape
  as the staff-path collision `insertSharedStaffPrincipal` already closes; and `assertStaffPinShape`
  no longer maps a server-side generator defect to a caller-facing 400 (M3).
- **Scope.** `packages/api/src/access/**`, `packages/auth/src/access.ts`,
  `apps/server/src/access-repository.ts`, `apps/server/src/access-service.ts`,
  `apps/server/src/phase11-access.integration.test.ts`. No `apps/web`, no `tests/browser`.
- **Explicitly not in it.** M4 (spurious `deactivateOwner` refusal — fails closed, widening the lock
  has deadlock implications and needs its own verification) and M5 (`AuthService.loginOwner` race —
  pre-existing Phase 4 code in `packages/auth/src/auth-service.ts`, must not be repaired
  opportunistically). Rate limiting on the owner access leaves remains an open new decision.
- **Gate.** Focused unit; the access integration file on a disposable database including the new
  concurrency case; `verify:fast`; `verify:full`; fresh independent verification.
- **Stages and routing.** Run ID `p11_access_tx_b01`.

  | # | Stage | Rollback boundary | Route |
  |---|---|---|---|
  | 0 | Activation — ledger milestone, lease grant, plan committed | the activation commit | Coordinator by authority. |
  | 1 | Refusal-surface investigation — read-only: how the existing typed refusals are declared, mapped, and tested, and how `insertSharedStaffPrincipal` closes the staff-path collision | nothing to revert | **Open.** Evaluate before any of that reading. |
  | 2 | M1 — typed duplicate-email refusal plus its concurrency test | one commit; additive at the transport | **Open.** |
  | 3 | M3 — `assertStaffPinShape` no longer maps a server defect to a caller 400 | one commit | **Open.** |
  | 4 | Freeze | n/a | Whoever held the last writing stage; submission is coordinator. |
  | 5 | Independent verification | n/a, read-only | **Open**, qualifies on Independence. |
  | 6 | Integration and `DONE` | the integration commit | Coordinator by authority. |

### P1 — browser load-sensitivity debt (precondition, not started here)

- **Objective.** The three registered assertions stop being load-sensitive, and their register
  entries close with evidence rather than staying open as debt nobody owns.
- **Scope, exactly three assertions.** [tests/browser/phase2.browser.spec.ts:72](tests/browser/phase2.browser.spec.ts:72)
  (cache-expiry elapsed-time margin), [tests/browser/phase3.browser.spec.ts:57](tests/browser/phase3.browser.spec.ts:57)
  and [tests/browser/phase10-ui-csv.browser.spec.ts:742](tests/browser/phase10-ui-csv.browser.spec.ts:742)
  (both sample a transient state that completes before the assertion runs, under ladder load).
- **Ownership versus execution.** These specs sit inside other milestones' owned paths, so the
  **coordinator must grant the lease** — a three-file, assertion-scoped lease over
  `tests/browser/phase2.browser.spec.ts`, `tests/browser/phase3.browser.spec.ts`, and
  `tests/browser/phase10-ui-csv.browser.spec.ts`. That is an authority requirement and nothing more.
  It does **not** make this coordinator-executed work, and an earlier draft of this plan wrongly
  concluded that it did.
- **Constraint.** Fix the sampling, not the assertion's meaning. Deleting or weakening the behaviour
  under test is not stabilization; if an assertion cannot be made deterministic without changing
  what it proves, that is a stop condition to record, not a decision to take inline.
- **Gate.** Each spec standalone, then `verify:full` twice at the candidate with the browser step
  complete. Register entries move to closed with the closing evidence appended, per the register's
  own rule that an entry which never closes is a defect nobody scheduled.
- **Stages and routing.** Run ID `p11_browser_debt_b01`.

  | # | Stage | Rollback boundary | Route |
  |---|---|---|---|
  | 0 | Activation — ledger milestone, three-file assertion-scoped lease, plan committed | the activation commit | Coordinator by authority. |
  | 1 | Timing-mechanism investigation — read-only: what each assertion actually samples, what makes it load-sensitive, and which deterministic Playwright wait expresses the same proof | nothing to revert | **Open.** Evaluate before that reading. |
  | 2 | Stabilize the three assertions | one commit; each spec independently revertible if the stage is split | **Open.** |
  | 3 | Close the three register entries with evidence | one commit, records only | **Open.** |
  | 4 | Freeze | n/a | Whoever held stage 2-3; submission is coordinator. |
  | 5 | Independent verification | n/a, read-only | **Open**, qualifies on Independence. Reproducing the stochastic claim is the substance of this gate. |
  | 6 | Integration and `DONE` | the integration commit | Coordinator by authority. |

- **Reassessing a Playwright-capable worker for stage 2 — genuinely open, and here is what its
  preflight must actually test.** The stage is small, precisely bounded, and its brief is nearly
  complete already: three named locations, one named mechanism each, one constraint, and a gate that
  is objective. That profile is a good fit for a qualified external worker, and **Volume** plausibly
  applies to stage 1 on its own. What could rule a candidate out is not that the work is
  cross-milestone — it is tool and environment compatibility, and preflight must check exactly that
  rather than assume it either way:
  - can the candidate drive Playwright and read its failure output, or only edit spec source blind;
  - does it get a prepared worktree that passes the `pnpm exec vitest --version` gate, with `.env`
    provisioned, since no browser result from an unprepared worktree is trustworthy;
  - can it run `verify:full` twice, which is what proves a stochastic failure stopped recurring, or
    does the orchestrator have to run the gate for it — an acceptable split, but one to record;
  - does the stage's consequence sit inside the candidate's qualified consequence ceiling.

  If a candidate fails on tooling, record **tooling** as the material reason. A native selection made
  for one constraint and recorded without it reads six weeks later as a general preference for
  native, and preferences generalise where filters do not.

---

## Slice B — `phase11-access-ui`

Run ID `p11_access_ui_b01`. Branch `work/phase11-access-ui-b01`.
Base commit: **P1's integrated commit**, not `aaa646b`.

**Worktree: this one** (`D:/Projects/fitway-worktrees/phase5-staff-integration`), on a fresh branch,
matching how Slice A b02 ran. Reasons, in order: the canonical `win32/chromium` baselines this slice
creates must be generated with the locked toolchain in a worktree already proven to run Playwright,
disposable Postgres, and the full ladder to completion; `.env` and `apps/server/.env` exist here and
in no fresh worktree; and `pnpm verify:fast` needs `set -a; . ./.env; set +a` first, a recorded
environment finding that a fresh worktree reproduces from scratch. If a stage routes to an isolated
worker, that worker's worktree is prepared per `docs/WORKFLOW.md` steps 7-8 at that point —
`pnpm install --frozen-lockfile`, then `pnpm exec vitest --version` as the gate, then `.env`
provisioning — and no result from an unprepared worktree is trusted.

### Objective, in observable terms

An authenticated owner, on `/admin`, in both Arabic RTL and English LTR:

- sees the current governance state of principals — whether a shared staff PIN credential is active,
  and each owner with its active state — carrying only non-secret state;
- provisions, rotates, and deactivates the shared staff PIN, with a reason required on deactivation;
- receives the generated PIN through a **one-time reveal** at provision and rotate, and through no
  other path and no read path;
- provisions an owner, deactivates another owner, reactivates a deactivated owner, and resets an
  owner credential in-app;
- is refused, with bilingual copy naming the reason, when they attempt to deactivate themselves or
  the last active owner, and for every typed refusal the transport returns — including
  `staff_pin_already_active`, `staff_pin_not_active`, the reused `owner_already_inactive`, and the
  duplicate-email refusal P2 adds;
- and a staff or anonymous caller reaches none of it, with the canonical 403/401 behaviour intact.

### Scope

**Owned paths** (worker-writable for the whole slice):

| Path | Note |
|---|---|
| `apps/web/src/components/owner/access/**` | New subtree — section, view, `messages.ts`, `use-owner-access-messages.ts`, css, view tests. Exactly the shape `owner/audit/` already uses. |
| `apps/web/src/hooks/use-owner-access.ts` and `.test.tsx` | Matches `use-owner-audit.ts` / `.test.tsx`. |
| `tests/browser/phase11-access.browser.spec.ts` | New. |
| `tests/browser/__screenshots__/win32/chromium/phase11-access.browser.spec.ts/**` | New subtree only. |
| `docs/phase-records/handoffs/phase11-access/*-p11_access_ui_b01-*.md`, `*-p11_access_ui_v01-*.md` | |
| `docs/phase-records/route-decisions/**`, `docs/phase-records/verification/**` | Append-only, per the b02 precedent. |

**Coordinator-owned, in the activation commit and nowhere else:**

- `PROJECT_STATE.yaml` — the new `phase11-access-ui` milestone, and `phase-11`'s dependency list
  extended to include it.
- `scripts/verify.mjs` — a `phase11-access` profile. `integrationFiles:
  ["apps/server/src/phase11-access.integration.test.ts"]`, and `browserFiles` listing **every**
  sibling `/admin` spec present at activation: the new access spec plus `phase11-audit`,
  `phase11-health`, `phase10-ui-csv`, `phase9-owner-ui`, `phase11-shell`. Omitting siblings has
  twice hidden a real regression on this surface — the comments at
  [scripts/verify.mjs:101](scripts/verify.mjs:101) and [scripts/verify.mjs:114](scripts/verify.mjs:114)
  record both incidents. Slice A deliberately shipped without a profile because it had no browser
  gate; Slice B is the slice that closes that gap.

**Shared lease, one file:** `apps/web/src/routes/admin.tsx`, exclusive, limited to mounting the
access Owner section — the owner shell composition, the route guard, every sibling section, and
every other URL stay unchanged. Same shape as the lease `phase11-audit` held. No server or router
lease is needed: `admin.access` is already mounted.

**Out of scope, and forbidden:**

- `apps/web/src/i18n/**`, `apps/web/src/routeTree.gen.ts`, global tokens, `packages/ui/**`.
- `packages/api/**`, `packages/auth/**`, `apps/server/**`, `packages/db/**`. If the UI turns out to
  need a transport or schema change, that is a **stop condition**, not a decision inside this slice.
- Every canonical screenshot subtree except this slice's own.
- `PROJECT_STATE.yaml`, `scripts/verify.mjs`, `scripts/verify-repository.mjs`, root manifests,
  lockfiles, environment schemas, test-runner configuration.
- Normative documents, `visual-direction-gate/**`, Paper, every other milestone's records, and the
  `work/phase11-access-b01` rejected evidence.
- The seven approved action labels, the secret-free audit rule, and the owner lifecycle decisions:
  human-locked.
- M4, M5, and rate limiting on the owner access leaves — named, deliberately unrepaired.

### Stages, rollback boundaries, and the delegation boundary

Each stage is one commit, independently revertible, leaving the tree building and green.

**The delegation-before-discovery rule governs every stage of all three slices — P2, P1, and Slice
B alike.** For each implementation or investigation stage, the delegation test is evaluated **when
the stage opens, from this plan and the durable records, before that stage's own target-file
reading, reconciliation, or repair-list derivation is performed by anyone — including the
coordinator.** Doing the stage's discovery inline first and then citing the accumulated context as
the reason it stays direct is a named anti-pattern, and the Slice A implementation route record
shows exactly how that reasoning reads afterwards. Nothing in this plan pre-assigns a route. This
plan deliberately performed **no** stage-specific target-file discovery in any of the three slices,
so every route comparison is still open on its merits.

For each stage: write `docs/phase-records/route-decisions/<run-id>-<stage>.json`
(`route-decision/1`) — `p11_access_tx_b01-*`, `p11_browser_debt_b01-*`, `p11_access_ui_b01-*`
respectively — **before** the stage is assigned or its write lease is opened, and append
`gate_outcome` after that stage's gate closes. The qualified OpenCode pool competes normally on
every stage marked **Open**; the two 2026-08-21 external-worker authorizations are already in force
for FITWAY and are reconciled, not re-requested. `route: null` with `execution:
"direct-coordinator"` is a legitimate outcome — but only as the result of a comparison that was
actually opened, and `material_selection_reason` must name the concrete advantage or requirement
that produced it. "Easier to spawn" and "the coordinator already has context" are not that, and the
second is only true when the discovery was consumed out of order.

| # | Stage | Rollback boundary | Delegation note (evaluated at stage open) |
|---|---|---|---|
| 0 | **Activation** — ledger milestone, `verify.mjs` profile, lease grant, this plan committed as the durable record | the activation commit | Coordinator by authority — ledger and coordinator-owned files. No route comparison. |
| 1 | **Surface investigation** — read-only | nothing to revert | **Open.** Likely qualifies on **Volume**: it reads across `admin.tsx`, the owner shell, two existing owner section subtrees, the hook and messages pattern, the access procedure surface, and the browser-spec auth/screenshot conventions, and returns a map far smaller than what it reads. The route must be selected **before** any of that reading happens. |
| 2 | **Data layer** — `use-owner-access.ts` and its tests | additive; nothing depends on it yet | **Open.** |
| 3 | **Presentation** — `owner/access/**`: view, section, bilingual copy, every state, css | additive | **Open.** |
| 4 | **Mount** — `admin.tsx` under the lease | removes the section; stages 2-3 still stand and still pass | **Open.** First shared-file stage: deliberately last and deliberately small. The lease is coordinator-granted; the edit under it is not coordinator-reserved. |
| 5 | **Browser spec, baselines, and the polish loop** | the spec and its own baseline subtree | **Open**, with the same tooling preflight P1 stage 2 names. Baseline generation is bound to this worktree's locked toolchain, and canonical baselines stay under human approval whoever generates them. |
| 6 | **Freeze, then submit** — durable records written, then the deterministic checks run last | n/a | Freeze belongs to whoever held the last writing stage — it is that stage finishing its own work. Submission to verification is coordinator, and is one-way. |
| 7 | **Independent verification** | n/a, read-only | **Open**, qualifies on **Independence** by definition. Fresh session that did not implement the candidate; receives outcome, base/candidate commits, owned scope, acceptance criteria, commands, and artifact locations — **not** the implementer's reasoning. It reports and does not repair. |
| 8 | **Integration and `DONE`** | the integration commit | Coordinator by authority. |

Fixed for stage 1 now, so its brief carries what inspection cannot reveal rather than a re-derived
question list: how `/admin` mounts an owner section and what the shell contributes; where owner
sections keep bilingual copy and how the `messages.ts` + `use-*-messages.ts` + hook pattern composes;
the exact `admin.access.*` procedure names, inputs, outputs, and the full typed-refusal set; how the
existing browser specs authenticate an owner and drive `/admin`; and how canonical screenshots are
named and scoped. Return contract: a compact map with `file:line` pointers, the refusal-to-copy
inventory, and named risks. **No file dumps, no transcript of the search.**

### Verification, fixed before the work starts

Run `set -a; . ./.env; set +a` from the worktree root first — `pnpm verify:fast` otherwise fails on
`CRON_SECRET must be supplied to the cron test process`. Neither `vitest.config.ts` nor
`scripts/verify.mjs` loads a `.env`, and `docs/WORKFLOW.md` step 8 names only `apps/server/.env`.
That documentation gap is recorded coordinator follow-up and is **not** fixed inside this slice.

- `pnpm exec vitest run` on the new unit and component test files, during stages 2-3.
- `pnpm verify:fast` after each stage that adds code.
- `pnpm verify:phase` against the new `phase11-access` profile, after stage 5.
- **The `/admin` polish loop** (`docs/WORKFLOW.md`), all of it: Arabic RTL and English LTR;
  every state — loading, live, empty, error, each typed refusal, and the one-time reveal; widths 320,
  360, 390, 721, 768, 820, 1024, 1200, 1440; keyboard order, focus visibility and focus **return**,
  target size, reduced motion, concise live regions, screen-reader names, 200% zoom and reflow,
  asymmetric safe areas, page overflow; automated accessibility plus manual inspection of the
  semantics automation cannot prove. At most two focused polish cycles; a material design change is
  `NEEDS_HUMAN`.
- `pnpm verify:full` on the candidate, unique `FITWAY_RUN_ID`, its own disposable database named for
  that run.
- `pnpm check:repository` and `scripts/candidate-freeze-check.mjs` over the full candidate range,
  run **last** — after every durable record this slice produces is written. A record is a tracked
  file inside the candidate; a check that ran before it was written did not check what was submitted.
- Fresh independent verification, including its own browser, accessibility, and visual inspection.

**Acceptance is measured one assertion per locked decision, exercised through the rendered UI**, not
through the hook in isolation. Plus three that are specific to this surface:

1. The revealed PIN appears in exactly the two flows the locked decision names, is not persisted in
   client state past the reveal, is not written to any log, and is not present in any rendered audit
   row.
2. No canonical screenshot captures real PIN material — the spec uses a deterministic fixture or
   masks the value. A baseline containing a credential is a blocking finding.
3. A staff session and an anonymous visitor reach the surface not at all, and the transport's
   canonical 403/401 behaviour is unchanged.

### Risks and unknowns

- **The one-time reveal is the highest-risk element in the slice**, on three axes at once: security
  (no persistence, no log, no screenshot leak), accessibility (focus placement and focus return
  around a transient credential display), and copy (it must be unambiguous that the value is shown
  once). Treat it as its own review axis, not as one component among several.
- **Canonical baselines need human approval.** New subtree or not, `docs/WORKFLOW.md` puts canonical
  screenshot changes under the human approver. They must be generated in this worktree with the
  locked browser/toolchain; rendering is not assumed portable across operating systems.
- **A new browser spec adds load to the browser step** — the exact mechanism behind the three
  registered flakes. P1 landing immediately upstream is the mitigation, not a guarantee. If new
  load-sensitive failures appear in Slice B's *own* spec, they are Slice B's to fix, and no register
  entry covers them.
- **RTL numerics.** The PIN length is 6-12 digits. In Arabic copy an en dash renders the range
  reversed; use a plain hyphen.
- **Refusal-to-copy completeness.** The transport's refusal set is authoritative and stage 1 must
  inventory it exhaustively. A refusal with no copy path surfaces to the owner as a bare error, which
  is the same class of defect M1 already represents.
- **The M4 and M5 races are visible from this surface but not fixable in it.** M4 can make
  `deactivateOwner` refuse spuriously (fails closed; retry succeeds) — the copy must not claim the
  invariant was violated. M5 lives in Phase 4 code outside these owned paths.
- **`isUniqueViolation`'s depth-5 cause-chain walk** is exercised only by the pinned driver's
  wrapping shape. Worth a note on any `drizzle-orm` or `pg` bump; not this slice's work.

### Open decisions

**None blocking.** The two scoping questions this plan opened were answered by the human above.
Carried forward as named non-decisions, so a later session does not re-derive them: rate limiting on
the owner access leaves is an open **new** decision belonging to nobody yet; M4 and M5 are recorded
and deliberately unscheduled; the `docs/WORKFLOW.md` step-8 environment gap is coordinator follow-up.

If a locked decision turns out to be underspecified in a way that changes user-visible behaviour,
that is `NEEDS_HUMAN` at the point of discovery, and the rest of the slice still ships.
