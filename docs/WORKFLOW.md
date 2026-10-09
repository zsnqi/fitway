# FITWAY Long-Running Agent Workflow

This is the operational procedure for long-running agent sessions, whichever tool runs them.
`AGENTS.md` holds the rules (startup, ownership, records, git, CI and verification); this file holds
how to carry them out. `PROJECT_STATE.yaml` is the coordinator-owned ledger; phase records preserve
accepted evidence.

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
                   ├──────────────┼──────────────┬─────┴────────┐
                   ▼              ▼              ▼              ▼
                BLOCKED       NEEDS_HUMAN   FAILED_VALIDATION  SUPERSEDED
```

- `DONE`: integrated commit exists and every required gate plus independent verification passed.
- `BLOCKED`: an external prerequisite or upstream dependency is unavailable. Record the exact
  unblock condition; difficulty alone is not a blocker.
- `NEEDS_HUMAN`: a locked decision, security/privacy ambiguity, material visual change, or
  shared-ownership conflict needs human authority.
- `FAILED_VALIDATION`: the same gate remains red after two focused repair attempts or the fresh
  verifier rejects the result.
- `SUPERSEDED`: a successor milestone carries the open work. The record names it in `supersededBy`
  and says why in `stopReason`; it never satisfies a dependency, so a dependent names the successor.

The repair budget, the successor gate and plan deliveries are ruled in `AGENTS.md`, "Ownership and
records". A successor needs human authorization whenever another rule also requires it.

Only the coordinator changes states. The top-level baseline status/commit must match the
`baseline-reconciliation-gate` milestone; repository verification rejects drift. A resumed
blocked/failed item receives a new attempt record; history is never overwritten.

## Active ledger and closed history

`PROJECT_STATE.yaml` holds only open-status milestones. When a milestone reaches a terminal outcome,
the coordinator closes it in one commit: the record moves from `PROJECT_STATE.yaml` to the end of
`PROJECT_STATE_HISTORY.yaml`, its packet becomes `CLOSED`, and nothing else is written. History holds
only terminal records, is append-only and coordinator-owned, and is never rewritten; review and git
keep it so. Open-status milestones may never be archived. Archived records stay dependency-resolvable
and change only through a successor milestone whose own record carries the new attempt.
`pnpm check:repository` fails on duplicate ids, on any open status in history, on unknown
dependencies across the union, on a misused `supersededBy`, and on `DONE` records missing commit or
gates. Closed records are frozen: checks validate their shape and never follow a path inside them.
History is retrieved only when a decision requires it and is never read wholesale into a session.
The receipts under `docs/phase-records/history-transitions/` and the legacy anchor are frozen
provenance from the earlier closure procedure; nothing reads them.

The ledger's optional `gardener` entry names the last gardener pass the coordinator reviewed. The
weekly pass runs from the Windows scheduled task `FITWAY gardener weekly` (Fridays 14:00; a missed
run starts at the user's next logon): `scripts/agent-environment/gardener-weekly.ps1` fetches, starts
`gardener/<date>` from `origin/main` in `D:/Projects/fitway-worktrees/gardener`, and runs
`.agents/skills/gardener/SKILL.md` headless on Sonnet 5.5 at `high`. It deletes and pushes nothing,
and a Windows notification reports its end. The coordinator reviews each `gardener/*` branch newer
than the entry, merges what it accepts, writes the entry, and then reruns the report's final survey
command, because the entry changes an open record and the cleanup script the pass left no longer
runs; the user gets the new script.

## Before creating a phase worktree

1. Base the worktree on the commit the ledger names as the milestone's `baseCommit`, normally the
   head of `main`.
2. Confirm every dependency is `DONE` in the union of the active ledger and closed history
   (`PROJECT_STATE.yaml` plus `PROJECT_STATE_HISTORY.yaml`).
3. Record the outcome and acceptance criteria in the packet, and the owned paths, forbidden paths,
   shared leases, branch, worktree and handoff in the ledger.
4. Assign a unique lowercase `FITWAY_RUN_ID`, for example `p4_auth_s01`.
5. Register the slice's focused verification profile and exact test paths before launch.
6. Create a separate branch and worktree for each writer (`AGENTS.md`, "Ownership and records").
   Never start from another worker's unintegrated branch.
7. Prepare the new worktree before any agent or test work: from its root run
   `pnpm install --frozen-lockfile` (with `CI=true` when no terminal is attached). `node_modules` is
   untracked, so a fresh worktree starts without it. Repair a broken install only by reinstalling
   from the frozen lockfile; never rewrite the lockfile to make a worktree resolve.
8. Provision `apps/server/.env` in the worktree before any integration or `pnpm verify:full` run.
   It is untracked and absent from every new worktree; without it those runs fail on environment
   validation rather than on the change under test (first in `apps/server/src/phase2.integration.test.ts`,
   on `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `CORS_ORIGIN`). Where only the integration suite needs
   them, a gitignored `.env.integration.local` at the worktree root with loopback test-only values (a
   32+ character `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://127.0.0.1/api/auth`,
   `CORS_ORIGIN=http://127.0.0.1`) is enough: `tests/integration/setup.ts` loads it after
   `apps/server/.env`, and shell values still win.

   The ignored `apps/server/.env` does not reach the unit test process. `pnpm verify:fast` gives
   its unit step non-secret placeholders for every key declared in `packages/env/src/server.ts`
   (`UNIT_TEST_ENV` in `scripts/verify.mjs`, the single source locally and in CI; the database URL
   is valid but non-routable). A bare `pnpm test` lacks them, and then fails in
   `apps/server/src/cron.test.ts` and `apps/server/src/reference-gating.test.ts`. Real
   credentials, production databases, and `.env` contents are never exported into a unit process
   or written into any record.

## After startup

Startup itself is `AGENTS.md`, "Startup"; `docs/agent-context/README.md` describes what
`context:show` checks and prints. Before editing, verify `git status --short`, `git rev-parse HEAD`,
the worktree and branch, tool versions, required services, and the owned paths in the ledger. Stop
if the base or the ownership differs from the ledger.

## Worker implementation loop

1. Establish a focused failing test at a stable seam where practical.
2. Make the smallest coherent change inside owned paths.
3. Run the focused test/type check frequently.
4. Run the fast ladder, `pnpm verify:fast`, before broad integration checks.
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

`scripts/verify.mjs` runs three ladders; `pnpm verify:fast`, `pnpm verify:phase` and
`pnpm verify:full` call them:

- `fast` — repository invariants, Biome, owner token fidelity, types, every unit and component
  test, and the edge simulator tests. CI runs it on every push.
- `phase --phase <registered-name>` — the fast ladder plus the phase's focused integration and
  browser checks.
- `full` — the fast ladder plus the full disposable-Postgres integration suite, build, browser,
  automated accessibility, and visual comparison.

The verification a record cites is the green CI run on the pushed commit (`AGENTS.md`); a local
run with the same result is corroboration while the work is in progress. Commands may write ignored
transient output only under the run-specific directories, and every ladder fails when a run leaves
`git status --short` different from its pre-run state. The coordinator records command, result,
commit, run ID, and artifact path in the phase record.

## Phase UI polish loop

For production UI work. A concept-only milestone runs its rounds by its own `DECISIONS.md`.

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
4. **Concept before code.** For a topology or material visual-direction change, explore as many
   whole-page *directions* or revisions as the user wants. There is no fixed minimum, required
   count, or maximum; a request for one fresh attempt is enough to begin, and the user may compare,
   revise, request more, or pause without an implied selection. Production implementation waits
   for an explicit selected direction and separate authority/promotion decision, not for a
   prescribed number of alternatives. Each concept names its own visual world and follows the
   active packet's human-authorized exploration envelope. When comparing multiple concepts, keep
   their worlds meaningfully distinct. Exploration artifacts derive their own palette, type, and
   material basis within only the identity and non-visual requirements the user kept; do not inline
   production token files, production atmosphere recipes, or shell CSS wholesale except in a
   fidelity reference the packet explicitly requires. The concept gate scores spatial thesis,
   first-glance focal hierarchy, grouping and reading order, vertical and horizontal rhythm,
   density and intentional whitespace, separation of governance/controls/actions/data, behavior
   at 1440px, mobile, 320px/200% reflow, EN, and AR, and distinctness where concepts are compared
   side by side. Incumbent component placement is not authority merely because code exists; neither
   is the incumbent skin.

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
- Concept-phase lifecycle: a `visual-authority-change` packet with `authorityStatus: VACANT` may
  be `READY` while its milestone is `READY` or `IN_PROGRESS` with the design-context check `PASS`
  and the accessibility and perceptual gates still `PENDING`; both gates must be `PASS` before the
  milestone advances to `VALIDATING` or reaches a `DONE` record, and before any concept is
  promoted.
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
   style choice. When a dropdown or select is in scope, visually check the rendered indicator
   inset and label clearance in Arabic RTL and English LTR at desktop, mobile, and 200% reflow;
   native-arrow placement cannot be inferred from text padding.
3. **Exploratory walkthrough.** The final gate for user-facing work includes a continuous interactive
   walkthrough of the real product — navigating between sections, opening controls near viewport
   edges, refreshing mid-section, switching locale, exercising loading/error/empty states —
   judged on perceived stability, motion quality, and composition, not only on per-assertion
   results. A settled screenshot is evidence of state, not of quality.

## Handoff format

- **Resume file.** Each milestone resumes from one file, `<milestone-id>-resume.md`, beside its
  earlier handoffs or in the folder named with `--dir`. `pnpm handoff:new --milestone <id>` creates
  it from `docs/agent-context/HANDOFF_TEMPLATE.md` and points the ledger at it; later runs refresh
  only its "As of" line, and the coordinator rewrites its sections in place. Git history is the
  chain; older timestamped handoffs stay as they are. Decisions that outlive a round live in the
  milestone's `DECISIONS.md`, edited in place, and agreements about how the user and agents work
  live in `docs/agent-context/WORKING_AGREEMENTS.md`.
- **Round report.** A Codex round or a subagent reports in its brief's Report block, as its final
  message; the coordinator saves the report verbatim as `REPORT.md` in the round's run folder
  outside the repository and cites in the records only what decides something.
- **Evidence receipt.** A worker's or verifier's handback at a milestone's closure, using
  `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md`.

Keep them concise and evidence-based.

Do not paste secrets, raw PINs/tokens, unbounded logs, screenshots containing sensitive data, or
claims that were not independently observed.

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

The coordinator integrates candidates one at a time in the order defined by `PHASES.md`:

1. inspect candidate history and diff;
2. reconcile coordinator-owned shared files and generate any single ordered migration;
3. run focused checks after each shared-spine integration;
4. run `pnpm verify:full` at the completed batch;
5. confirm validation left the worktree clean;
6. record the integrated commit and evidence, then close the milestone in one commit (see
   "Active ledger and closed history"), which also releases its scope and leases.

A worker branch being green is `READY_FOR_INTEGRATION`, never `DONE`. Pushing and the trunk follow
`AGENTS.md`, "Git, CI and verification"; deploying or provisioning external systems needs the
user's authorization.
