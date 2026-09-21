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

A successor attempt (a fresh attempt record with a reset repair budget) may open only after the
terminal record of the failed lineage names the failure mode prior checks did not cover, the
changed hypothesis or changed scope, and why that failure mode will not recur. Human
authorization for a successor is required whenever any existing rule also requires it; the
evidence gate above is a minimum, not a substitute.

These states and the two-repair rule govern implementation and validation attempts. A plan whose
deliverable is handed to the user or to an external executor ends at plan delivery: it may be
recorded durably, but it is not registered as a milestone, carries no gates, and does not enter
repair-budget or terminal machinery. Such a plan may still be reviewed when the human asks or when
it will execute unattended without the human in the loop; findings are settled as ordinary plan
edits before hand-off.

Only the coordinator changes states. The top-level baseline status/commit must match the
`baseline-reconciliation-gate` milestone; repository verification rejects drift. A resumed
blocked/failed item receives a new attempt record; history is never overwritten.

## Active ledger and closed history

`PROJECT_STATE.yaml` holds the active frontier and any blocking or terminal record the coordinator
has not yet archived. `PROJECT_STATE_HISTORY.yaml` holds only terminal records (`DONE`, `BLOCKED`,
`NEEDS_HUMAN`, `FAILED_VALIDATION`), is append-only, is coordinator-owned, and is never rewritten.
Open-status milestones may never be archived. Archived records stay dependency-resolvable and are
mutable only through an explicit successor milestone whose own record carries the new attempt.
`pnpm check:repository` fails on duplicate ids, on any open status in history, on unknown
dependencies across the union, and on `DONE` records missing commit/gates. Closed history is
retrieved only when a decision requires it and is never read wholesale into a session. New
transitions append v2 receipts under `docs/phase-records/history-transitions/`; legacy whole-file
snapshot anchors remain immutable compatibility evidence and are never regenerated.

## Before creating a phase worktree

1. Confirm BRG is `DONE` and use its integrated commit as the base.
2. Confirm every dependency is `DONE` in the union of the active ledger and closed history
   (`PROJECT_STATE.yaml` plus `PROJECT_STATE_HISTORY.yaml`).
3. Define the outcome, acceptance criteria, owned paths, forbidden paths, shared leases, and
   required verification commands.
4. Assign a unique lowercase `FITWAY_RUN_ID`, for example `p4_auth_s01`.
5. Register the slice's focused verification profile and exact test paths before launch.
6. Create a non-overlapping branch/worktree. Never start from another worker's unintegrated branch.
7. Prepare the new worktree before any agent or test work. `node_modules` is untracked, so a fresh
   worktree starts without it, and a partial install leaves `node_modules/.bin` without the root
   tool links. From the worktree root run `pnpm install --frozen-lockfile`; the frozen install and
   a clean host-selected process start are setup preconditions, not defenses against hostile local
   code, malicious same-user processes, compromised dependencies, or a compromised host/OS.
   Authoritative evidence begins only when the host directly invokes an absolute Node path on
   `scripts/check-test-runtime.mjs`, `scripts/run-vitest.mjs run ...`, or
   `scripts/verify.mjs fast|phase --phase <name>|full` from that prepared worktree. Each direct
   invocation acquires one repository-local Vitest runtime session, verifies the root lockfile
   resolution and realpath containment in the worktree and the package, and revalidates a bounded
   integrity set immediately before and after every Vitest launch; Vitest is never selected through
   `PATH`, `node_modules/.bin`, or a package-manager shim. A failure means the local install is
   incomplete or an unsafe Vitest resolution is being reported, and no test result from that
   worktree is trustworthy. `pnpm check:test-runtime`, `pnpm test`, `pnpm test:integration`, and
   `pnpm verify:*` remain developer conveniences whose exit status is corroboration only, never
   reusable authority for another process. Repair only by reinstalling from the frozen lockfile;
   never rewrite the lockfile to make a worktree resolve.
8. Provision `apps/server/.env` in the worktree before any integration or `pnpm verify:full` run.
   It is untracked and absent from every new worktree; without it those runs fail on environment
   validation rather than on the change under test.

   The ignored `apps/server/.env` does not by itself reach the unit test process in every shell.
   `pnpm verify:fast` additionally requires process-local synthetic NON-SECRET values for every key
   declared in `packages/env/src/server.ts`. Recorded runs use exactly these non-secret
   placeholders:
   `DATABASE_URL=postgresql://unit_test:unit_test@127.0.0.1:1/fitway_unit_placeholder`
   (valid but non-routable), `BETTER_AUTH_SECRET` and `CRON_SECRET` at 32+ non-secret characters,
   `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` non-secret placeholders,
   `BETTER_AUTH_URL=http://127.0.0.1:9/api/auth`, `CORS_ORIGIN=http://127.0.0.1:9`, and
   `NODE_ENV=test`. A `pnpm verify:fast` failure in `apps/server/src/cron.test.ts` or
   `apps/server/src/reference-gating.test.ts` caused by missing those values is an
   environment-provisioning gap, not a candidate defect, and consumes no repair budget. Real
   credentials, production databases, and `.env` contents are never exported into a unit process
   or written into any record.
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

`AGENTS.md` is loaded automatically and carries the repository-wide safety, ownership, and
conflict rules. Startup then follows the bounded route in this order:

1. **Root policy.** Read `AGENTS.md`. It is the only automatic instruction file.
2. **Active state.** Read `PROJECT_STATE.yaml` for the active frontier. If no milestone is open,
   no task is assigned; do not infer one.
3. **Assigned packet.** Run the bounded continuity check
   `pnpm context:show -- --milestone <milestone-id>` (authoritative form:
   `<absolute-node> scripts/show-agent-context.mjs --milestone <milestone-id>`). It validates the
   stable packet path, state hash, packet identity, task class, base commit, scope, handoff, and
   lifecycle, then prints the ordered required sources/selectors and conditional triggers. A
   missing, stale, hash-mismatched, untracked, case-mismatched, or conflicting required packet is
   a stop condition; the coordinator repairs the packet before any work continues.
4. **Required sources.** Load exactly the packet's ordered required sources and selectors against
   their canonical files. `docs/agent-context/ROUTES.yaml` names the minimum authority roles for
   each task class; the packet supplies the exact paths, headings, keys, or pointers.
5. **Conditional expansion.** Expand a conditional source only when its recorded trigger is
   actually observed, and perform the recorded action (`READ`, or stop at `NEEDS_HUMAN`).
6. **History stays out of startup.** `PROJECT_STATE_HISTORY.yaml`, `docs/archive/**`, phase
   records, and unrelated handoffs are retrieved only through a named decision, predecessor,
   incident, or audit pointer. Never read them by default.

`context:show` never claims that a source was loaded, never summarizes an authority, and never
resolves a conflict automatically. If a packet contradicts a cited authority, the authority
governs and execution stops for packet repair.

Legacy broad reading remains available only as a documented compatibility fallback: a session
whose coordinator has explicitly authorized the legacy route may read the route's required
authorities directly from `docs/agent-context/ROUTES.yaml` without a packet. The fallback is not
the default, is not authorized by a green checker, and must never be used to skip a required
packet on the active route.

Then verify `git status --short`, `git rev-parse HEAD`, the worktree/branch, tool versions, the
repository-local test runtime with the direct diagnostic
`<absolute-node> scripts/check-test-runtime.mjs` from the worktree root (`pnpm check:test-runtime`
is convenience corroboration only), required services, and the declared owned paths. If an
activation commit is recorded, verify that the BRG base is its parent
and that the worker starts at that exact activation commit.
Check `leaseExpiresAt` against the current wall clock at startup and before every shared-file edit;
an expired lease requires coordinator renewal and immediate `NEEDS_HUMAN`. Stop if the base,
activation head, lease, or ownership differs.

## Worker implementation loop

1. Establish a focused failing test at a stable seam where practical.
2. Make the smallest coherent change inside owned paths.
3. Run the focused test/type check frequently.
4. Run the authoritative fast ladder, `<absolute-node> scripts/verify.mjs fast`, before broad
   integration checks; `pnpm verify:fast` is a convenience alias whose exit status is corroboration.
5. Run the phase-selected verification with a unique run ID and disposable resources.
6. If a gate fails, record the command, concise failure, and artifact; make at most two focused
   repair attempts. Do not reset the count by changing sessions. A successor after
   `FAILED_VALIDATION` must satisfy the evidence gate in the state machine section above.
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
by operating-system platform and Playwright project. On surfaces where Paper composition authority
is active, they become acceptance evidence only after a recorded comparison to the exact accepted
Paper authority, and an implementation-generated baseline, including a latest phase baseline, may
never substitute for Paper during initial acceptance. For superseded Owner surfaces (ADR-009), the
acceptance evidence is the human-approved concept/acceptance record once approved; while no concept
is approved, there is no Owner composition acceptance, and the canonical files are reference-only
regression evidence. Ordinary workers read canonical files but do not update them. Generate or
promote a platform baseline only in a serialized human-approved pass using the locked
browser/toolchain; rendering is not assumed portable across operating systems.

Integration tests must accept only the explicitly named disposable database and marker. They
must never fall back to `DATABASE_URL`, a general development database, or a name merely
containing `test`, `dev`, or `local`. Schema/database destruction is limited to that exact
target. Until a test proves isolation, serialize integration runs.

Ports and output directories are not contracts between phases. Never reuse another worker's
server or artifacts to obtain a green result.

## Verification ladder

The authoritative ladder is the host-selected absolute Node directly invoking `scripts/verify.mjs`
from the prepared worktree. Each direct invocation acquires one Vitest runtime session before its
first Vitest step and revalidates that session's bounded integrity set around every Vitest launch;
package scripts are developer conveniences whose exit status is corroboration only:

- `<absolute-node> scripts/verify.mjs fast` — repository invariant checks, formatting/lint, types,
  unit/component tests.
- `<absolute-node> scripts/verify.mjs phase --phase <registered-name>` — fast ladder plus
  phase-selected focused integration/browser checks.
- `<absolute-node> scripts/verify.mjs full` — fast ladder plus full disposable-Postgres integration,
  simulator, build, browser, automated accessibility, and visual comparison.
- `pnpm verify:fast`, `pnpm verify:phase`, and `pnpm verify:full` — equivalent convenience aliases
  for the same ladders; their exit status is corroboration, not the authoritative record.

The direct focused runner `<absolute-node> scripts/run-vitest.mjs run ...` is evidence only for the
exact printed config path, SHA-256, and byte length with the requested focus/filter arguments, for
repository-local Node/Vitest selection and the bounded integrity set, for bounded pre/post-launch
integrity, and for unchanged repository content during that invocation. It does not prove the fast,
phase, or full ladder, does not authenticate dependencies, and does not confine test code; package
aliases remain developer conveniences whose own bootstrap is not authoritative. The session's
coverage is bounded to its recorded Vitest provenance, lockfile resolution, realpath containment,
and integrity set: it is not authentication, attestation, or a sandbox, it says nothing about bytes
outside the bounded set, and native addons, forks/Workers, subprocesses, and external executables
remain permitted runtime behavior.

Commands may write ignored transient output only under the run-specific directories. A bare
`pnpm verify:fast` in a fresh shell can fail `apps/server/src/cron.test.ts` and
`apps/server/src/reference-gating.test.ts` until the synthetic unit environment above is exported;
that is environment provisioning, not a candidate failure. A passing run must leave
`git status --short` unchanged from its pre-run state. The coordinator records command, result,
commit, run ID, timestamp, and artifact path in the phase record.

## Phase UI polish loop

1. Inspect the affected route/state interactively with Browser.
2. Run deterministic Playwright functional checks in Arabic RTL and English LTR.
3. Cover every affected state: loading, live, delayed, unavailable, closed, and error where
   applicable.
4. Check applicable widths from 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440px.
5. Verify keyboard order, focus visibility/return, target size, reduced motion, concise live
   regions, screen-reader names, 200% zoom/reflow, asymmetric safe areas, and page overflow.
6. Run automated accessibility checks and manually inspect semantics that automation cannot prove.
7. On surfaces where Paper composition authority is active, compare full routed screenshots with
   the registered Paper authority. Full-route captures include the global shell, shared
   navigation, and active page panel regardless of authority status. A `captureReview` artifact
   is evidence generation only and cannot produce a passing verdict.
8. Make at most two focused polish cycles. A material design change becomes `NEEDS_HUMAN`.
9. Have a fresh verifier rerun the checks. Human approval is required to update a canonical
   baseline or alter a locked visual decision.

### Non-circular visual acceptance

The active route-authority manifest and test-only `VisualAuthorityCase` registry map each routed
surface/state/locale/viewport to its exact Paper family, landmark contract, expected full-route
artifact, approval record, and reviewed deviations. That mapping is acceptance authority only for
surfaces whose manifest status is an active-authority value; superseded Owner cases are retained
as `SUPERSEDED` provenance with the ADR-009 supersession record and carry no acceptance
authority. Repository verification fails if an `ACCEPTED` case maps to a surface whose manifest
status is not an active-authority value, so a superseded surface cannot silently regain accepted
authority. Repository verification fails when a canonical artifact is unmapped, a Paper export or
routed artifact hash changes, an accepted matrix case is missing, or a baseline lacks a new human
approval record.

On surfaces where Paper composition authority is active, exact Paper comparison detects unintended
drift; it is not blind pixel reproduction. A bounded correction is allowed only when its durable
deviation record names the Paper frame and affected region, the observed presentation or runtime
problem, the smallest correction, why design language and semantics remain intact, before/after
routed evidence, and independent rendered-review approval. For superseded Owner surfaces (ADR-009),
deviations and reference comparisons are provenance only and cannot be used to reject a redesign
for differing from the prior composition. Unrecorded or unreviewed deviations fail acceptance.
Charts and other runtime-rendered content are judged through container geometry, tokens, semantic
values, and rendered review rather than brittle raw-pixel identity.

Token fidelity is enforced in the fast ladder: `scripts/check-owner-tokens.mjs` fails on any
owner CSS custom property that is used but never defined, the failure mode that lets declarations
silently vanish. New owner CSS must define or reuse existing tokens; local one-off literals
require a recorded reason in the phase record.

## Design work: authority, concepts, and perceptual gates

1. **Entry.** Run `pnpm check:design-context` before any design or UI session and confirm the
   Impeccable bridge resolves FITWAY's `PRODUCT.md`/`DESIGN.md` routers. An empty Impeccable
   Doctor result is never proof of integration.
2. **Current visual authority.** Read the current per-surface authority from
   `docs/design/VISUAL_AUTHORITY_STATUS.md`. A materially different topology requires an
   explicitly approved authority change — a scoped ADR-007 amendment or a superseding
   human-approved record — before implementation. The Owner composition supersession is recorded
   in `docs/adr/ADR-009-owner-composition-authority-supersession.md` and in the register;
   superseded artifacts are reference-only.
3. **Paper availability and freshness.** When live Paper tools are not exposed, record the exact
   export package and its timestamp. Stored exports and canonicals are provenance and comparison
   references, never live authority. Any composition decision that depends on live Paper stops at
   `NEEDS_HUMAN`.
4. **Concept before code.** For a topology or material visual-direction change, produce two or
   three whole-page *direction* alternatives and judge them before production implementation or
   token polish. Each alternative names its own visual world and states, against the packet's
   exploration envelope, which axes it keeps and which it varies; no two alternatives may share a
   world, and when the envelope requires a departure from the incumbent atmosphere, at least one
   alternative must make it rather than restyle the incumbent. Exploration artifacts derive their
   own palette, type, and material basis and must not inline production token files, production
   atmosphere recipes, or shell CSS wholesale except in a fidelity reference the packet explicitly
   requires. The concept gate scores spatial thesis, first-glance focal hierarchy, grouping and
   reading order, vertical and horizontal rhythm, density and intentional whitespace, separation
   of governance/controls/actions/data, behavior at 1440px, mobile, 320px/200% reflow, EN, and AR,
   and direction distinctness from side-by-side full-resolution rendered frames. Incumbent
   component placement is not authority merely because code exists; neither is the incumbent skin.

### Exploration envelope

A concept exploration runs inside the envelope its active packet records in
`visual.explorationEnvelope`. The envelope exists only while the packet's `visual.authorityStatus`
is `VACANT`, and it authorizes exploration artifacts only. It names the locked axes (identity,
semantics, and any system rule a human decision keeps binding), the variable axes (the visual
decisions alternatives may genuinely change), the required departures from the incumbent, the
anti-ruts (the incumbent atmosphere, named frozen or rejected candidates, and quarantined prior
attempts), and the promotion rule.

- Exploration artifacts are concept-only. They change no production code, token, canonical,
  authority, manifest, or hash, and they are labeled as exploration artifacts rather than
  milestone concepts until the human selects one.
- A direction that departs from a locked production rule reaches production only through a new
  explicit human baseline decision with its own perceptual gate. The envelope, a green check, or a
  concept-selection record never promotes a departure.
- Rejected directions, superseded candidates, and prior attempts are evidence, not references. A
  new alternative derives from the brief and its own world; copying a prior attempt's
  composition, material, or tokens forward is a defect, and quarantined attempts carry a notice
  that says so.
- A restyle that keeps the incumbent palette, material, and atmosphere and changes only layout
  does not satisfy the envelope.
5. **Perceptual promotion gate.** The perceptual reviewer receives full-resolution rendered
   frames before test scores, implementation rationale, or canonical comparisons and is allowed
   to reject the reference itself. A pass must name the exact frames inspected and the reviewer;
   "authorized the pass", "approved completion", a generated contact sheet, or a green suite is
   not visual acceptance. Canonical promotion is a separate serialized action after explicit
   human approval. Use `docs/design/VISUAL_ACCEPTANCE_RECORD_TEMPLATE.md` for the record.
6. **Automated visual checks.** Detectors, token/class/spacing guards, canonical comparison, and
   hash verification are lint and provenance, not taste.
7. **Active task packet.** Brief the implementation session with the active task packet's
   `visual`, `designContextCheck`, `accessibilityGate`, `scope`, and `verification` fields
   (`docs/agent-context/TASK_PACKET_TEMPLATE.yaml`, schema
   `docs/schemas/task-packet.schema.json`): surface/user task, locked behavior/content/
   accessibility/data semantics, current authority status, open visual decisions, known
   perceptual failures, exact current/reference screenshots and hashes, accepted spatial thesis,
   allowed source paths, Paper availability, and verification/promotion gates. The retired
   `docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md` remains only as a compatibility pointer.

### Standing review duties

Canonical comparison proves a surface matches its accepted reference; it cannot judge whether the
reference itself is good, and it cannot see across surfaces. These duties apply to any phase that
changes Owner, Staff, or Public presentation, in addition to the gates above.

1. **Design-judgment gate on baseline promotion.** Every canonical baseline promotion requires the
   new baseline images to be reviewed side-by-side across all affected surfaces — not as diffs —
   after the independent perceptual gate above has passed. The acceptance record must name the
   exact full-resolution frames inspected, the reviewer, and a quality judgment per surface
   relative to the product's strongest current surface. "The change was intentional", broad
   authorization to proceed, or a green suite is not an acceptance standard by itself. Material
   promotions of whole-surface compositions require a named human judgment.
2. **Cross-surface consistency sweep.** Work that touches shared control families (inputs, selects,
   popovers, date fields, buttons, cards) must run the Owner cross-surface review spec
   (`tests/browser/owner-cross-surface.review.spec.ts`) and keep its tripwires green: one popup
   material, one control fill/radius family, one focus-ring recipe, stable page-context and
   navigation-rest contracts. New controls reuse the existing family primitives and tokens;
   introducing a second parallel primitive for an existing control role is a defect, not a
   style choice.
3. **Exploratory walkthrough.** The final gate for user-facing work includes a continuous interactive
   walkthrough of the real product — navigating between sections, opening controls near viewport
   edges, refreshing mid-section, switching locale, exercising loading/error/empty states —
   judged on perceived stability, motion quality, and composition, not only on per-assertion
   results. A settled screenshot is evidence of state, not of quality.

## Handoff format

Store handoffs under `docs/phase-records/handoffs/<phase>/<timestamp>-<run-id>.md` and reference
the latest file from `PROJECT_STATE.yaml` through the active packet's `continuity.currentHandoff`.
Use `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md`, which carries the canonical field contract,
the required evidence sections, and the current-repository-relative resume-command rule. Keep
handoffs concise and evidence-based.

Do not paste secrets, raw PINs/tokens, unbounded logs, screenshots containing sensitive data, or
claims that were not independently observed.

### External worker data boundary

Native delegation is the default, and no native-versus-external route comparison is required
before delegating work. The two 2026-08-21 external-worker authorization records
(`docs/phase-records/handoffs/coordinator/20260821-021800-fitway-external-worker-authorization.md`
and
`docs/phase-records/handoffs/coordinator/20260821-152000-fitway-external-worker-pool-authorization.md`)
remain historical provenance only and grant nothing under native delegation. Any future external
processing of FITWAY material requires a new explicit human authorization. Secrets, credentials,
API keys, `.env` contents, personal/private data, and artifacts prohibited elsewhere by repository
policy are never transferred.

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
