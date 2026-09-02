# FITWAY Long-Running Agent Workflow

This is the operational procedure for multiple long-running agent sessions, whichever tool runs
them. `AGENTS.md` is the concise policy; `PROJECT_STATE.yaml` is the coordinator-owned live
ledger; phase records preserve accepted evidence.

## Roles

- **Coordinator:** sole writer of `PROJECT_STATE.yaml`; allocates worktrees, owned paths, and
  shared leases; owns migrations/generated ordering; integrates work; declares terminal state.
- **Worker:** one bounded phase or slice in one worktree, based on the recorded baseline.
- **Subagent:** bounded reading, investigation, focused test execution, or isolated module work.
  The parent worker reviews every result and retains ownership.
- **Independent verifier:** fresh session that did not implement the candidate; reviews the diff,
  reruns gates, and records findings without repairing the work.
- **Human approver:** resolves locked Product/Spec/security/privacy decisions and material visual
  changes; approves canonical screenshot changes.

## State machine

```text
PLANNED → READY → IN_PROGRESS → VALIDATING → READY_FOR_INTEGRATION → DONE
                   │              │                    │
                   ├──────────────┼──────────────┬─────┘
                   ▼              ▼              ▼
                BLOCKED       NEEDS_HUMAN   FAILED_VALIDATION
```

- `DONE`: integrated commit exists and every required gate plus independent verification passed.
- `BLOCKED`: an external prerequisite or upstream dependency is unavailable. Record the exact
  unblock condition; difficulty alone is not a blocker.
- `NEEDS_HUMAN`: a locked decision, security/privacy ambiguity, material visual change, or
  shared-ownership conflict needs human authority.
- `FAILED_VALIDATION`: the same gate remains red after two focused repair attempts or the fresh
  verifier rejects the result.

These states and the two-repair rule govern implementation and validation attempts. A plan whose
deliverable is handed to the user or to an external executor ends at plan delivery: it may be
recorded durably, but it is not registered as a milestone, carries no gates, and does not enter
repair-budget or terminal machinery. Such a plan may still be reviewed when the human asks or when
it will execute unattended without the human in the loop; findings are settled as ordinary plan
edits before hand-off.

Only the coordinator changes states. The top-level baseline status/commit must match the
`baseline-reconciliation-gate` milestone; repository verification rejects drift. A resumed
blocked/failed item receives a new attempt record; history is never overwritten.

## Before creating a phase worktree

1. Confirm BRG is `DONE` and use its integrated commit as the base.
2. Confirm every dependency is `DONE` in `PROJECT_STATE.yaml`.
3. Define the outcome, acceptance criteria, owned paths, forbidden paths, shared leases, and
   required verification commands.
4. Assign a unique lowercase `FITWAY_RUN_ID`, for example `p4_auth_s01`.
5. Register the slice's focused verification profile and exact test paths before launch.
6. Create a non-overlapping branch/worktree. Never start from another worker's unintegrated branch.
7. Prepare the new worktree before any agent or test work. `node_modules` is untracked, so a fresh
   worktree starts without it, and a partial install leaves `node_modules/.bin` without the root
   tool links. From the worktree root run `pnpm install --frozen-lockfile`, then
   `pnpm exec vitest --version` as the gate. If that gate does not print a version, the executable
   links are incomplete and no test result from that worktree is trustworthy. Repair only by
   reinstalling from the frozen lockfile; never rewrite the lockfile to make a worktree resolve.
8. Provision `apps/server/.env` in the worktree before any integration or `pnpm verify:full` run.
   It is untracked and absent from every new worktree; without it those runs fail on environment
   validation rather than on the change under test.
9. Record owner, branch, worktree, actual initial worker HEAD, lease expiry, and handoff path
   before edits. `baseCommit: SELF` is allowed only when the activation commit itself is that HEAD.

The BRG commit remains the immutable feature baseline. The coordinator may place one activation
commit directly on top of it containing only live state, launch contracts, corrected execution
dependencies, and verification profiles. When used, every phase record names both the BRG base
and activation commit (`SELF` inside that commit), and every worker branch starts at the same
activation commit. No feature implementation or speculative dependency change belongs in it.
The baseline's `integratedCommit` remains the immutable BRG hash; `SELF` in an activated worker's
`baseCommit` means the activation commit, not the BRG commit.

## Clean-session startup

Every worker or verifier reads, in order:

1. `AGENTS.md`;
2. `FITWAY_PRODUCT.md` and the relevant `SPEC.md` sections;
3. `DESIGN_GUIDE.md` for UI work;
4. `PHASES.md` and `PROJECT_STATE.yaml`;
5. the relevant ADR and phase record;
6. the latest handoff named in the ledger.

Then verify `git status --short`, `git rev-parse HEAD`, the worktree/branch, tool versions
(including `pnpm exec vitest --version` from the worktree root), required services, and the
declared owned paths. If an activation commit is recorded, verify that the BRG base is its parent
and that the worker starts at that exact activation commit.
Check `leaseExpiresAt` against the current wall clock at startup and before every shared-file edit;
an expired lease requires coordinator renewal and immediate `NEEDS_HUMAN`. Stop if the base,
activation head, lease, or ownership differs.

## Worker implementation loop

1. Establish a focused failing test at a stable seam where practical.
2. Make the smallest coherent change inside owned paths.
3. Run the focused test/type check frequently.
4. Run `pnpm verify:fast` before broad integration checks.
5. Run the phase-selected verification with a unique run ID and disposable resources.
6. If a gate fails, record the command, concise failure, and artifact; make at most two focused
   repair attempts. Do not reset the count by changing sessions.
7. UI work completes the phase polish loop below.
8. Produce a durable handoff and set the candidate ready for independent verification.

Worker sessions do not update canonical screenshot baselines, generate competing migrations,
edit coordinator-owned state, or broaden their phase to fix unrelated debt.

## Resource isolation

Every concurrent run must set `FITWAY_RUN_ID`. Verification derives or receives:

- a unique Playwright web port;
- unique `test-results/<run-id>` and browser artifact directories;
- a run-specific disposable visual-review path;
- a unique disposable Postgres database whose exact name includes the run ID;
- an explicit destructive-test marker.

Canonical `toHaveScreenshot` files are shared, coordinator-owned regression evidence, separated
by operating-system platform and Playwright project. They become acceptance evidence only after a
recorded comparison to the exact accepted Paper authority. An implementation-generated baseline,
including a latest phase baseline, may never substitute for Paper during initial acceptance.
Ordinary workers read canonical files but do not update them. Generate or promote a platform
baseline only in a serialized human-approved pass using the locked browser/toolchain; rendering is
not assumed portable across operating systems.

Integration tests must accept only the explicitly named disposable database and marker. They
must never fall back to `DATABASE_URL`, a general development database, or a name merely
containing `test`, `dev`, or `local`. Schema/database destruction is limited to that exact
target. Until a test proves isolation, serialize integration runs.

Ports and output directories are not contracts between phases. Never reuse another worker's
server or artifacts to obtain a green result.

## Verification ladder

The package scripts are non-writing with respect to tracked source and approved baselines:

- `pnpm verify:fast` — repository invariant checks, formatting/lint, types, unit/component tests.
- `pnpm verify:phase` — fast ladder plus phase-selected focused integration/browser checks.
- `pnpm verify:full` — fast ladder plus full disposable-Postgres integration, simulator, build,
  browser, automated accessibility, and visual comparison.

Commands may write ignored transient output only under the run-specific directories. A passing
run must leave `git status --short` unchanged from its pre-run state. The coordinator records
command, result, commit, run ID, timestamp, and artifact path in the phase record.

## Phase UI polish loop

1. Inspect the affected route/state interactively with Browser.
2. Run deterministic Playwright functional checks in Arabic RTL and English LTR.
3. Cover every affected state: loading, live, delayed, unavailable, closed, and error where
   applicable.
4. Check applicable widths from 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440px.
5. Verify keyboard order, focus visibility/return, target size, reduced motion, concise live
   regions, screen-reader names, 200% zoom/reflow, asymmetric safe areas, and page overflow.
6. Run automated accessibility checks and manually inspect semantics that automation cannot prove.
7. Compare full routed screenshots with the registered Paper authority. For Owner routes, every
   comparison includes the global shell, shared navigation, and active page panel. A
   `captureReview` artifact is evidence generation only and cannot produce a passing verdict.
8. Make at most two focused polish cycles. A material design change becomes `NEEDS_HUMAN`.
9. Have a fresh verifier rerun the checks. Human approval is required to update a canonical
   baseline or alter a locked visual decision.

### Non-circular visual acceptance

The active route-authority manifest and test-only `VisualAuthorityCase` registry map each routed
surface/state/locale/viewport to its exact Paper family, landmark contract, expected full-route
artifact, approval record, and reviewed deviations. Repository verification fails when a canonical
artifact is unmapped, a Paper export or routed artifact hash changes, an accepted matrix case is
missing, or a baseline lacks a new human approval record.

Exact Paper comparison detects unintended drift; it is not blind pixel reproduction. A bounded
correction is allowed only when its durable deviation record names the Paper frame and affected
region, the observed presentation or runtime problem, the smallest correction, why design language
and semantics remain intact, before/after routed evidence, and independent rendered-review
approval. Unrecorded or unreviewed deviations fail acceptance. Charts and other runtime-rendered
content are judged through container geometry, tokens, semantic values, and rendered review rather
than brittle raw-pixel identity.

## Handoff format

Store handoffs under `docs/phase-records/handoffs/<phase>/<timestamp>-<run-id>.md` and reference
the latest file from `PROJECT_STATE.yaml`. Keep them concise and evidence-based:

```markdown
# <phase/slice> handoff

- Status:
- Base commit / candidate commit:
- Branch / worktree / run ID:
- Owned paths / shared leases used:
- Decisions made (with canonical source):
- Changes by file:
- Validation commands and results:
- Browser/a11y/visual artifacts:
- Independent verifier findings:
- Remaining work or exact blocker:
- Exact resume command:
- Stop/escalation conditions:
```

Do not paste secrets, raw PINs/tokens, unbounded logs, screenshots containing sensitive data, or
claims that were not independently observed.

### External worker data boundary

Two 2026-08-21 human authorizations, recorded in
`docs/phase-records/handoffs/coordinator/20260821-021800-fitway-external-worker-authorization.md`
and
`docs/phase-records/handoffs/coordinator/20260821-152000-fitway-external-worker-pool-authorization.md`,
permit FITWAY non-secret repository source code and non-secret project artifacts to be sent to and
processed by the currently qualified OpenCode external-worker pool — DeepSeek V4 Pro, Ox Alpha,
GLM-5.3, and MiniMax M3 — when the active `agent-project-workflow` route-first comparison selects
that route. The authorization is durable for FITWAY and need not be requested again at each stage.
It follows the currently qualified pool: a candidate that is not qualified is not authorized by it.

This grant does not include credentials, secrets, API keys, `.env` contents, personal/private data,
or any artifact prohibited elsewhere by repository policy. Route selection remains stage-specific:
the authorization removes the data-processing-consent blocker but does not predetermine that the
external route wins the required native-versus-external comparison.

## Independent verification

The verifier receives outcome, base/candidate commits, owned scope, acceptance criteria, commands,
and artifact locations—not the implementer's reasoning transcript. It must:

1. confirm the diff stays inside scope and contains no unrelated/user work;
2. compare code/contracts to Product, Spec, Design Guide, ADRs, and phase acceptance;
3. run the required checks from a clean run ID and disposable resources;
4. perform fresh Browser/a11y/visual inspection for UI work;
5. report findings by severity with file/line evidence;
6. return `PASS` or `FAILED_VALIDATION` without editing the candidate.

## Integration

The coordinator integrates candidates in the order defined by `PHASES.md`:

1. inspect candidate history and diff;
2. reconcile coordinator-owned shared files and generate any single ordered migration;
3. run focused checks after each shared-spine integration;
4. run `pnpm verify:full` at the completed batch;
5. confirm validation left the worktree clean;
6. record integrated commit and evidence, release leases, and mark `DONE`.

A worker branch being green is `READY_FOR_INTEGRATION`, never `DONE`. Do not push, deploy, or
provision external systems unless separately authorized.
