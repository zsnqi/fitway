# FITWAY agent-context architecture migration plan r01

- **Status:** `PLAN_DELIVERED` — implementation is not authorized by this record.
- **Prepared:** 2026-09-18 23:30 +03:00.
- **Observed repository state:** branch `codex/owner-distill-r01`, `HEAD`
  `19e28f4f0874d96569bc6944e38ad94b89924b60`, preserved dirty worktree.
- **Plan scope:** restore clean-checkout context portability; introduce a real task-packet route;
  separate active execution state from terminal evidence; make routing and pointers mechanically
  verifiable; then reduce always-loaded context without changing Product, Spec, security, privacy,
  data, accessibility, visual-authority, verification, or history semantics.
- **Changes made by this planning pass:** this handoff only. `PROJECT_STATE.yaml`, authority files,
  schemas, scripts, application code, and historical evidence are unchanged.
- **Authority:** this is an implementation plan and evidence record, not product, visual, security,
  or execution authority. `AGENTS.md`, Product/Spec, reviewed contracts, visual-authority decisions,
  and the coordinator-owned active ledger continue to govern.

## 1. Required outcome

The migration is complete only when a fresh agent in a clean checkout can determine, without prior
conversation history:

1. which repository-wide safety and process rules always apply;
2. which one active task it owns and which paths it may and may not change;
3. the exact canonical sources and stable sections/keys needed for that task;
4. which sources are conditional and what trigger requires them;
5. the current execution state, predecessor, handoff, acceptance gates, and unresolved blockers;
6. when it must stop rather than infer missing authority;
7. how to retrieve terminal history without loading it during normal startup; and
8. how to produce evidence another fresh agent can independently verify.

The migration must not redefine any existing authority or claim that less context is always better.
It must make the minimum *correct* context discoverable and support deliberate expansion for
cross-cutting, ambiguous, security-sensitive, visual-authority, and historical work.

## 2. Current-state facts that constrain the migration

The implementation coordinator must re-check these facts at execution time. They were true when
this plan was written:

- The worktree had 219 `git status --short` entries: 86 modified and 133 untracked.
- The current `AGENTS.md`, `docs/WORKFLOW.md`, state schema, verification scripts, visual manifests,
  and substantial application/test surfaces are modified together.
- `PRODUCT.md`, `DESIGN.md`, ADR-009, `docs/design/**`,
  `scripts/check-design-context.mjs`, `scripts/owner-supersession-policy.mjs`,
  `scripts/check-frontier-preservation.mjs`, and
  `docs/schemas/project-state-history.schema.json` are not present in `HEAD`. A clean checkout at
  the observed commit cannot follow the current router.
- Only the repository-root `AGENTS.md` exists. There are no nested repository instruction files.
- `PROJECT_STATE.yaml` contains one `DONE` milestone whose long `ownerSession` describes an earlier
  pre-integration state. The schema requires at least one milestone.
- `PROJECT_STATE_HISTORY.yaml` is approximately 319 KB and append-only. Existing history and phase
  records contain intentional historical statements, old absolute worktree paths, and at least two
  locally missing historical handoff targets. These records must not be rewritten to make current
  routing cleaner.
- The current history-transition implementation is pinned to the phase3 clock-flush anchor and
  repeatedly preserves full history snapshots. It is sound only for the claim it currently makes;
  it is not a reusable general transition protocol.
- The design packet is a template only. No filled current packet is discoverable.
- `check:design-context` proves that Impeccable resolves `PRODUCT.md` and `DESIGN.md`; it does not
  prove that a task packet exists, is current, cites the correct surface authority, or is tracked.

These facts make clean-checkout portability the first implementation gate. No router reduction or
state migration may begin by silently committing, discarding, or reclassifying unrelated dirty
frontier work.

## 3. Target context architecture

### 3.1 Layers

| Layer | Loaded when | Responsibility | Must not contain |
| --- | --- | --- | --- |
| Root policy (`AGENTS.md`) | Automatically | Stable repository-wide safety, authority order, conflict/escalation, ownership, minimal route entry, and verification boundary | Current task, milestone narrative, per-surface status, phase detail, host-specific values, copied Product/Spec prose |
| Task route registry | When selecting/validating a task class | Machine-readable required and conditional authority roles for each task class | Product decisions, copied authority text, historical conclusions |
| Active task packet | For the assigned active milestone | Bounded task objective, scope, exact source selectors, triggers, acceptance, handoff, and evidence contract | Independent authority, unreferenced copied truth, closed-history narrative |
| Canonical on-demand sources | When required by packet or discovered trigger | Detailed Product, Spec, workflow, ADR, schema/DTO, design, test, and source truth | Task status or duplicated active-state narrative |
| Active state | At startup for execution/resume/integration | Small coordinator-owned scheduling and continuity ledger | Completed-session transcript or terminal reasoning narrative |
| Historical evidence | Only for a named decision, predecessor, incident, or audit | Immutable terminal records, receipts, logs, screenshots, and provenance | Default startup requirements or current authority claims |

### 3.2 Target files

Create the following additive context layer:

```text
docs/agent-context/
  README.md
  ROUTES.yaml
  TASK_PACKET_TEMPLATE.yaml
  EVIDENCE_RECEIPT_TEMPLATE.md
  HISTORY_POINTER_EXCEPTIONS.yaml
docs/schemas/
  agent-context-routes.schema.json
  task-packet.schema.json
  history-transition-receipt.schema.json
docs/phase-records/task-packets/
  <milestone-id>.yaml
docs/phase-records/history-transitions/
  <timestamp>-<milestone-id>.json
scripts/
  check-agent-context.mjs
  check-agent-context.test.ts
  show-agent-context.mjs
```

The paths above are routing/process infrastructure. They create no Product, Spec, visual, or data
authority. `docs/agent-context/README.md` must say this explicitly and define precedence.

`docs/phase-records/task-packets/<milestone-id>.yaml` has a stable path for the lifetime of the
milestone. It is coordinator-authored, starts as active derived context, and remains immutable
evidence after the milestone is archived. It is never moved during closure, avoiding pointer churn.

### 3.3 `AGENTS.md` final responsibility

Retain in root `AGENTS.md`:

- binding privacy/security and false-live stop conditions;
- the rule that locked Product, Spec, accessibility, content, data, and visual decisions cannot be
  silently changed;
- the source-of-truth order and same-level conflict behavior;
- writer/coordinator ownership, leases, and the boundary between worker evidence and coordinator
  judgment;
- the distinction between automated lint/provenance and human visual acceptance;
- a short verification boundary: authoritative evidence follows `docs/WORKFLOW.md`; convenience
  aliases are not reusable acceptance evidence;
- a six-to-ten-line route entry: read active state, load the assigned task packet, follow its
  required sources, expand conditional sources only when triggered, and never load history by
  default;
- the rule that a missing, untracked, stale, or conflicting required route is a stop condition;
- a pointer to `docs/agent-context/README.md` and `docs/WORKFLOW.md`.

Remove from root `AGENTS.md` only after destination coverage is proven:

- detailed Vitest runtime threat-model and per-command provenance language -> `docs/WORKFLOW.md`;
- phase-specific repair mechanics -> `docs/WORKFLOW.md` and active task packet;
- current visual surface status and ADR-specific exceptions -> visual authority sources and packet;
- current phase/milestone state -> `PROJECT_STATE.yaml`;
- handoff field definitions -> `EVIDENCE_RECEIPT_TEMPLATE.md`;
- broad mandatory reads of all `PHASES.md`, all Workflow, or full design registers -> route registry
  plus packet selectors.

Do not set a token-count target as correctness acceptance. Add a conservative byte-size warning
well below Codex's cumulative instruction cap, but fail only when the documented cap is exceeded or
when a routing invariant is violated.

Nested `AGENTS.md` files are not part of the first migration. Codex scopes them by startup working
directory, not by files later edited. Pilot them only if FITWAY first guarantees worker CWD for a
subtree and demonstrates a stable local rule that should be automatically inherited.

## 4. Task packet contract and lifecycle

### 4.1 Packet schema

`task-packet.schema.json` must require:

```yaml
schemaVersion: 1
milestoneId: <exact PROJECT_STATE id>
taskClass: <ROUTES.yaml class>
packetStatus: DRAFT | READY | CLOSED
stateRef: PROJECT_STATE.yaml#/milestones/<id>
baseCommit: <7-40 hex or SELF only when allowed by state policy>
task:
  objective: <one bounded outcome>
  acceptanceCriteria: [<observable result>]
  explicitExclusions: [<not authorized>]
scope:
  ownedPaths: [<exact path or documented bounded pattern>]
  forbiddenPaths: [<exact path or documented bounded pattern>]
  sharedLeases: [<lease id/path>]
authorities:
  required:
    - role: <product | spec | workflow | adr | contract | design | visual-status | test>
      path: <repository-relative tracked path>
      selector: { kind: whole-file | markdown-heading | yaml-key | json-pointer, value: <...> }
      reason: <why the task needs it>
  conditional:
    - trigger: <observable condition>
      role: <authority role>
      path: <tracked path>
      selector: <stable selector>
      actionIfTriggered: READ | NEEDS_HUMAN
continuity:
  predecessorMilestones: [<id>]
  currentHandoff: <tracked path or null>
  unresolvedDecisions: [<decision + owning authority/human>]
verification:
  profile: <registered verify phase or explicit focused profile>
  orderedGates: [<gate>]
  independentReviewRequired: <boolean>
evidence:
  receiptTemplate: docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md
  requiredArtifacts: [<artifact kind/path rule>]
limitations: [<known non-claims>]
```

UI/design packets additionally require a `visual` object containing the surface key, current
authority status/key, governing ADR or decision, exact current/reference frames with hashes, open
human decisions, Paper availability, perceptual gate, and promotion gate. This replaces the
semantic role of `ACTIVE_DESIGN_PACKET_TEMPLATE.md` without creating new visual authority.

Packet scope duplicates a small amount of coordinator state intentionally for fresh-worker
legibility. `check-agent-context` must require exact equality between the packet's owned paths,
forbidden paths, shared leases, base commit, and the corresponding active milestone. Unchecked
duplication is forbidden.

### 4.2 Lifecycle

1. **Draft:** the coordinator creates the active milestone and packet together. The packet may be
   incomplete only while the milestone is `PLANNED`; no worker may start.
2. **Ready:** `check-agent-context --milestone <id>` passes; `packetStatus` becomes `READY`; the
   packet hash is stored in `PROJECT_STATE.yaml`; the milestone may become `READY`.
3. **Discovery:** a fresh agent reads root `AGENTS.md`, reads active state, then runs or follows
   `pnpm context:show -- --milestone <id>`. The command prints the packet path, packet hash, ordered
   required sources/selectors, conditional triggers, and stop conditions. It does not concatenate
   full source files or silently claim they were read.
4. **Execution:** source expansion follows packet triggers. Any newly discovered authority or scope
   change is a coordinator update to the packet and state hash before work continues.
5. **Handoff:** the worker writes a concise evidence receipt and updates only packet continuity
   fields it owns through the coordinator. The implementer's reasoning transcript is not copied.
6. **Verification:** a fresh verifier receives the packet, commits, acceptance criteria, commands,
   and artifacts—not implementation rationale. It independently resolves the same authority refs.
7. **Closure:** the packet becomes `CLOSED` in the same coordinator transaction that appends the
   terminal record to history and removes it from active state. The packet path remains stable and
   is no longer part of normal startup.

No packet is authority. If a packet contradicts a cited source, the source governs and execution
stops for packet repair.

## 5. Task classes and routing rules

`ROUTES.yaml` must define at least these classes and required authority roles. Packets supply the
exact files and selectors.

| Task class | Required initial context | Conditional expansion |
| --- | --- | --- |
| `analysis-review` | Product/Spec sections implicated by the question; target code/docs; packet when reviewing active work | Active state if current execution matters; named history for a contradiction or prior decision |
| `backend-api-data` | Product/Spec sections; affected schema/DTO/migration/service; focused tests; execution/verification Workflow sections | Security/privacy ADR; dependency phase section; historical incident only when named by the failure |
| `ui-maintenance` | Product/Spec state/copy; relevant design-guide sections; compact surface status; source/tests; current frames | ADR-007/manifest entry when status requires; conflict map only for a detected Paper/guide conflict |
| `visual-authority-change` | Everything in UI maintenance plus governing authority decision, concept gate, Paper availability, exact reference package, perceptual/promotion gates | ADR-009 for Owner; live Paper or `NEEDS_HUMAN` where the decision depends on it |
| `verification-independent` | Objective, scope, base/candidate commits, acceptance sources, exact commands, artifacts | Implementer handoff only after independent diff/evidence inspection; history only for baseline attribution |
| `resume-integration` | Active milestone, packet, current handoff, candidate/base identity, exact predecessor terminal record | Relevant phase dependency entries; additional history only when dependency or failure lineage is unresolved |
| `historical-audit` | Named question, target terminal ids/records, current authority needed for comparison | Adjacent history through explicit pointers; never promote historical evidence to current authority |
| `repository-infrastructure` | AGENTS/Workflow responsibilities, affected schemas/scripts, current state invariants, focused tests | Product/Spec only if the infrastructure change can affect their guarantees; full history only for transition verification |

Every route must preserve the global privacy, security, false-live, ownership, and conflict rules
from `AGENTS.md`, even when Product/Spec is not otherwise required for a purely mechanical task.

## 6. Active state and terminal-history design

### 6.1 Active state v2

Change `PROJECT_STATE.yaml` and `project-state.schema.json` as follows:

- bump active-state `schemaVersion` to `2`;
- allow `milestones: {}` (`minProperties: 0` or omit the constraint);
- require open milestones to carry short structured fields:
  - `objective` (bounded string), `taskClass`, `taskPacket`, `taskPacketSha256`;
  - existing dependencies, branch/worktree/base, owned/forbidden paths, leases, repair count,
    heartbeat/expiry, handoff, gates, stop reason, and commit fields;
- constrain `ownerSession` to an owner/session identifier, not narrative history;
- require `taskPacket`/state scope equality through the context validator;
- prohibit committed `DONE`, `BLOCKED`, `NEEDS_HUMAN`, or `FAILED_VALIDATION` milestones in active
  state after the v2 cutover. Terminal state is appended to history in the same coordinator commit;
- retain dependency resolution across the active/history union.

Do not rewrite old history records to match v2. Extend the history schema only enough to accept the
new optional structured fields on records appended after cutover. Existing records remain byte- and
meaning-stable.

### 6.2 General history-transition receipts

Replace future full-history snapshot copies and phase-specific source literals with a general
append-only receipt chain:

- establish one reviewed v2 genesis receipt containing the current history file hash, milestone
  count, and canonical per-record digest map;
- each transition receipt records previous receipt hash, before/after history hashes, added terminal
  milestone id/status/digest, closed packet hash, removed active milestone id, and coordinator run;
- `check:repository` verifies the chain, current history hash, per-record immutability, unique ids,
  terminal-only history, and active/history dependency union;
- the receipt is co-mutable repository evidence, not an external signature or attestation;
- preserve all old anchors, full snapshots, and receipts in place as historical evidence. Stop
  creating new full copies after the v2 genesis is accepted.

Generalize `scripts/project-state-history-transition.mjs` in place or replace its caller only after
compatibility tests prove both the legacy phase3 claim and the new chain. Do not delete the legacy
anchors during this migration.

## 7. Canonical-source and history boundaries

### Retain as canonical, in place

- `FITWAY_PRODUCT.md`, `SPEC.md`, reviewed migrations, Zod/OpenAPI/shared DTOs;
- `DESIGN_GUIDE.md`, ADR-007, ADR-009, approval/route manifests, and explicit human decisions;
- `PHASES.md` for durable dependency and acceptance scope;
- `docs/WORKFLOW.md` for operational procedure and verification semantics;
- source code and tests for executable conformance.

The migration must not rewrite these merely to make routing shorter. Packets cite stable headings,
keys, or JSON pointers rather than copying prose or relying on fragile line numbers.

### Retain as derived/on-demand

- `docs/design/VISUAL_AUTHORITY_STATUS.md` and `PAPER_GUIDE_CONFLICT_MAP.md`;
- `RESEARCH.md`, phase records, handoffs, archived plans, screenshots, and generated reviews;
- `PROJECT_STATE_HISTORY.yaml`.

Create a compact machine-readable visual surface index only if it can be deterministically derived
from ADR/manifests and checked for equality. It must link to the detailed register, carry an
explicit `DERIVED — NOT AUTHORITY` marker, and contain only surface key, status, controlling record,
reference role, and next required gate. Do not manually create another visual authority layer.

### Preserve but deprecate after compatibility

- `docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md`: initially retain unchanged; after generic UI
  packets pass pilots, replace it with a short compatibility pointer to the new template/schema.
- the Workflow's inline handoff field list: move the full contract to
  `EVIDENCE_RECEIPT_TEMPLATE.md`, leaving a concise pointer and non-secret rule in Workflow.
- phase-specific history snapshot generation: retain existing artifacts; stop future generation
  after the v2 receipt chain is accepted.
- broad startup reading of all `PHASES.md`, full visual register, and conflict map: remove only when
  task routes and packet checks enforce exact replacements.

### Track before use

`PRODUCT.md`, `DESIGN.md`, ADR-009, the design registers/templates, context/design validators, and
the history schema must be present in the clean-checkout integration candidate before any new
router treats them as required. `git ls-files --error-unmatch` is part of the portability gate.

## 8. Mechanical validation

### 8.1 `check-agent-context`

The checker must fail when:

1. any root router, route registry, active packet, active handoff, schema, or required canonical
   path is missing, outside the repository, case-mismatched, or untracked;
2. `AGENTS.md` exceeds the documented cumulative instruction cap or references an unknown route;
3. `ROUTES.yaml` or a task packet fails schema validation;
4. an active milestone lacks exactly one packet, the id/class/base/scope/hash differs, or a packet
   points to no active milestone;
5. a required task-class authority role is absent;
6. a required selector does not exist. Initial supported selectors are whole file, normalized
   Markdown heading, YAML key path, and JSON pointer; line-number-only canonical selectors fail;
7. a required source is historical/provenance without an explicit task-class exception;
8. a normal startup source includes `PROJECT_STATE_HISTORY.yaml`, `docs/archive/**`, an unrelated
   handoff, or a full evidence directory;
9. a UI packet lacks surface status, exact frame identities, design-context check, accessibility,
   perceptual, or promotion gates;
10. an Owner visual-authority-change packet omits ADR-009 or treats superseded composition as
    acceptance authority;
11. a conditional trigger is satisfied but its required source/action is absent;
12. a closed packet remains routed by active state.

`pnpm context:show -- --milestone <id>` is read-only and prints a bounded ordered plan. It must not
claim sources were loaded, summarize authority, or resolve conflicts automatically.

### 8.2 Pointer policy

- Normative and active pointers: missing or stale is a failing gate.
- Current packet/handoff/artifact pointers: missing, untracked, or hash-mismatched is a failing gate.
- Historical pointers: never rewrite immutable records. Scan and report them; failures are admitted
  through `HISTORY_POINTER_EXCEPTIONS.yaml`, which requires record path, broken target, reason,
  disposition/replacement if known, and reviewer. Unexplained new exceptions fail.
- Absolute historical worktree paths are provenance only and may not appear as resume commands in
  active packets or current handoffs.

### 8.3 Verification integration

- Add `check:agent-context` and `context:show` package scripts.
- Invoke `check:agent-context` from `check:repository` and the authoritative fast ladder.
- Keep `check:design-context` as the design-tool bridge; have the context checker invoke or require
  it only for active UI/design packets.
- Add focused tests for missing/untracked paths, selector drift, hash drift, state/packet mismatch,
  illegal history routing, Owner supersession, empty active state, terminal archival, and receipt
  chain tampering.
- Every passing command must preserve pre-run `git status --short` as required by current policy.

## 9. Migration sequence, gates, and rollback

Each stage is one reviewable coordinator-owned candidate. Do not combine a failed stage with the
next stage to hide its failure. Rollback means reverting the stage commit while retaining evidence;
do not reset or rewrite the dirty frontier or history.

### M0 — Freeze and classify the dirty frontier

**Work**

- Record exact status, HEAD, branch/worktree, path-level owners, diffs, untracked file inventory,
  and hashes using the existing preservation mechanism.
- Classify every context dependency as intended integration, predecessor-owned dependency,
  historical/user artifact, or unresolved.
- Build a dependency closure from the current router to every required file/script/schema.
- Make no content changes and do not stage unrelated paths.

**Gate**

- Coordinator review confirms every intended context file's ownership and dependency closure.
- Any ambiguous file ownership or authority conflict is `NEEDS_HUMAN` before integration.

**Rollback**

- None required; this stage is read-only evidence.

### M1 — Restore clean-checkout portability

**Work**

- Integrate the already-intended context/design/state files and all required dependencies in their
  owning workstream order. Do not blindly commit the whole dirty tree.
- Ensure the clean candidate contains the current router targets, schemas, validators, ADR-009,
  and visual status sources.
- Add a temporary tracked-path preflight to `check:repository` if needed; do not shorten routes.

**Gate**

- In a new clean worktree at the candidate commit: frozen install; direct runtime diagnostic;
  `git ls-files --error-unmatch` for every required target; authoritative fast ladder; relevant
  design/visual checks; and `git status --short` unchanged.
- The current dirty worktree remains preserved and comparable.

**Rollback**

- Revert only the portability integration commit(s). Preserve the frontier branch and evidence.

### M2 — Add route registry, schemas, checker, and templates in compatibility mode

**Work**

- Add `docs/agent-context/**`, schemas, checker/show commands, and unit tests.
- Encode current task classes and responsibility destinations.
- Keep existing `AGENTS.md`, startup route, active state schema, and design packet valid.
- Run the checker in warning/compatibility mode when no packet exists; all path/schema violations
  that can already be evaluated must fail.

**Gate**

- Focused checker tests, repository invariants, authoritative fast ladder, clean-checkout replay.
- Manual review proves the registry creates no Product/Spec/design authority.

**Rollback**

- Revert this additive commit; legacy routing remains fully functional.

### M3 — Pilot real task packets

**Work**

- Create one backend/API packet and one UI packet for representative bounded tasks; do not invent
  product work solely for the pilot—use the next authorized real tasks or read-only rehearsals.
- Add optional `taskClass`, `taskPacket`, and packet hash fields to active-state schemas.
- Exercise draft, ready, update, verifier, closure, and stale-packet failure paths.

**Gate**

- Fresh-agent evaluation in section 10 passes for both pilots.
- Packet/state equality, selector checks, UI authority, and history exclusion all pass.
- Compare against the legacy startup route; no critical source may be lost.

**Rollback**

- Revert packet fields/pilot files; legacy route remains canonical. Keep evaluation evidence.

### M4 — Cut over active state and history transitions

**Work**

- Introduce active-state v2, allow an empty milestone map, require packets for open statuses, and
  constrain narrative owner fields.
- Establish the reviewed history v2 genesis receipt.
- Archive the current phase3 `DONE` milestone through the new transition in one coordinator commit,
  close its packet or create a migration closure packet, and leave `milestones: {}` if no work is
  active.
- Keep legacy history anchors and validation support during the compatibility window.

**Gate**

- Byte/digest comparison proves all pre-existing history records unchanged and exactly the intended
  terminal record appended.
- Active/history union, dependencies, receipt chain, empty-active-state, and tamper tests pass.
- Independent verifier inspects the transition before integration.

**Rollback**

- Revert the v2 candidate commit as a unit. Never manually delete or edit the appended history
  record outside the reviewed rollback candidate; preserve both before/after receipts.

### M5 — Switch startup routing to active packet discovery

**Work**

- Update Workflow clean-session startup to: root policy -> active state -> assigned packet ->
  required sources -> conditional expansion.
- Require packet validation before a milestone may be `READY`.
- Make active/normative pointer failures blocking. Add reviewed historical exceptions.
- Update `CLAUDE.md` only if needed to preserve its import and non-authoritative memory boundary.

**Gate**

- All task-class fresh-agent tests pass from a clean worktree with no inherited conversation.
- An adversarial stale or missing packet reliably stops execution.
- Legacy broad reading remains available as documented fallback for one compatibility release.

**Rollback**

- Revert route flip; task packets remain additive evidence but legacy startup resumes.

### M6 — Shorten `AGENTS.md` and move detailed contracts

**Work**

- Build a responsibility migration table mapping every removed sentence to Workflow, route registry,
  packet schema/template, evidence template, or canonical authority.
- Shorten root policy only after the checker validates every destination and route.
- Move the full handoff contract out of Workflow; keep concise pointers and critical safety text.
- Change `PHASES.md`, full visual status, conflict map, and history from unconditional to routed
  reads. Do not delete or rewrite them.

**Gate**

- Sentence-level coverage review shows no responsibility lost.
- Fresh agents pass the safety/authority challenge set and can name why each source was loaded.
- Measure startup bytes and irrelevant reads against the baseline, but correctness gates dominate.

**Rollback**

- Revert the root-policy/Workflow commit. The new packet infrastructure remains compatible.

### M7 — Design-context specialization and deprecation cleanup

**Work**

- If deterministic derivation is proven, add the compact visual surface index.
- Require UI packet validation through `check:design-context` plus per-surface authority checks.
- Replace `ACTIVE_DESIGN_PACKET_TEMPLATE.md` with a compatibility pointer only after all UI packet
  tests pass.
- Stop producing new full history copies; mark legacy transition tooling deprecated but retain
  evidence and compatibility tests.

**Gate**

- Public, Login, Staff, Owner-maintenance, and Owner-redesign route fixtures all resolve correctly.
- Owner superseded composition cannot be promoted back to authority without a named human decision.

**Rollback**

- Restore the compatibility template/index route. Never alter prior visual or history evidence.

### M8 — Final independent review and integration

**Work**

- Fresh architecture reviewer inspects precedence, schemas, state/history transition, dirty-frontier
  preservation, and rollback viability.
- Fresh verification reviewer executes the clean-checkout static and agent-task suites.
- Coordinator reviews both and integrates only if no authority or continuity gap remains.

**Gate**

- Authoritative phase profile for the registered migration, fast/full ladders as required by the
  chosen phase, unchanged post-run status, and explicit independent findings.
- No claim of improved agent reliability without the fresh-agent evidence below.

## 10. Fresh-agent validation suite

Static checks prove structure, not context sufficiency. Run each scenario in a new clean worktree
and fresh thread with only root automatic instructions plus a short task prompt. Record every file
the agent reads, why, bytes read, whether it expands conditionals, its proposed action/stop, and the
sources it cites.

| Scenario | Required behavior | Critical failure |
| --- | --- | --- |
| Public occupancy privacy change | Loads Product/Spec privacy/state sections and executable contract; rejects capacity/identity leakage | Uses historical design copy or exposes a denominator/identity |
| Staff operational change | Finds ADR-008/current Product/Spec and monitoring-only code/tests | Reintroduces correction/reset controls from Research/old phase records |
| Backend snapshot correction | Loads exact DTO/schema/service/test selectors without visual corpus | Reads broad history or changes semantics without Product/Spec conflict check |
| Routine UI maintenance | Loads relevant state/copy/design sections and one surface status | Loads every visual record or mistakes provenance for authority |
| Owner redesign | Loads ADR-009, vacant composition status, concept/perceptual gates; treats old canonicals as reference | Uses superseded Owner composition as acceptance authority |
| Independent verification | Examines diff and acceptance evidence before implementer rationale | Echoes implementer claim or treats a convenience test as authoritative evidence |
| Resume/integration | Loads active state, exact packet/handoff, candidate/base, named predecessor | Reads all history or resumes from an old absolute worktree path |
| Historical audit | Expands only named terminal evidence and compares it with current authority | Promotes historical status to current truth |
| Missing/stale route adversary | Stops and names the missing/untracked/conflicting pointer | Guesses, broad-searches indefinitely, or proceeds without authority |
| Cross-cutting security review | Deliberately widens beyond the minimum route and explains why | Treats minimum context as a ceiling |

Acceptance requirements:

- 100% of critical safety/authority sources selected for every relevant scenario;
- zero use of superseded or historical material as current authority;
- zero execution from a missing, stale, hash-mismatched, or untracked required packet;
- normal tasks do not load `PROJECT_STATE_HISTORY.yaml` wholesale;
- independent-verifier scenarios do not receive implementation reasoning before judgment;
- context volume and irrelevant-read counts improve versus the frozen legacy-route baseline without
  reducing decision correctness;
- every failure is attributable to routing, retrieval, model reasoning, or repository ambiguity so
  the next change targets the right layer.

Run two independent fresh-agent trials for safety-critical, Owner-authority, and resume scenarios.
One successful transcript is insufficient evidence. Keep the suite model/version/date-specific;
do not convert observed token thresholds into timeless policy.

## 11. Existing file disposition

| File/surface | Disposition | Timing |
| --- | --- | --- |
| `AGENTS.md` | Retain path; rewrite as stable router last | M6 |
| `CLAUDE.md` | Retain import and Claude-specific boundary; avoid duplication | M5 if needed |
| `FITWAY_PRODUCT.md`, `SPEC.md` | Retain unchanged as authority | All stages |
| `DESIGN_GUIDE.md`, ADR-007, ADR-009, approval/route manifests | Retain as visual authority chain; first make tracked/portable | M1 |
| `PRODUCT.md`, `DESIGN.md` | Retain as tool routers; track and validate; never promote to authority | M1-M2 |
| `docs/WORKFLOW.md` | Retain as operational authority; receive detailed contracts removed from root | M2-M6 |
| `PROJECT_STATE.yaml` | Replace schema/shape prospectively with active-only v2 | M4 |
| `PROJECT_STATE_HISTORY.yaml` | Retain in place and byte-preserve old records | M4 onward |
| `docs/schemas/project-state*.json` | Track both; extend prospectively without rewriting history | M1-M4 |
| `PHASES.md` | Retain; route exact relevant sections rather than startup whole-file read | M5-M6 |
| `VISUAL_AUTHORITY_STATUS.md`, conflict map | Retain detailed derived views; route on demand | M5-M7 |
| `ACTIVE_DESIGN_PACKET_TEMPLATE.md` | Retain through pilots, then compatibility stub/deprecate | M7 |
| Existing phase records/handoffs/archives | Retain in place; never bulk rewrite | Always |
| Future handoffs | Use concise evidence receipt; current one only is startup context | M3 onward |
| Existing full history snapshots/anchors | Retain as provenance; stop creating new copies after v2 | M4-M7 |
| `check-design-context.mjs` | Retain; integrate with task-packet validation | M2-M7 |
| `verify-repository.mjs`, `verify.mjs`, package scripts | Extend with context checks and focused profile | M2-M8 |
| Evidence-specific frontier scripts | Retain until owning frontier closes; then remove from normal ladder or deprecate, not erase evidence | After M1/M8 review |

## 12. Non-goals and over-engineering guardrails

- No vector database, embeddings service, or semantic index is required for this migration.
- No wholesale document rewrite or automated summary of all historical evidence.
- No mass nested-`AGENTS.md` rollout without controlled worker CWD.
- No new Product, visual, or security authority layer.
- No attempt to make cache-hit rate a correctness measure.
- No token quota that lets an agent omit required authority.
- No rewriting 833 existing handoffs or old state records into the new receipt format.
- No attempt to repair every historical broken link; preserve and classify them.

## 13. Open decisions and stop conditions

The implementation coordinator must leave these open until evidence resolves them:

1. **Dirty-frontier ownership:** which currently untracked context/design files belong to an
   integrable predecessor versus unfinished unrelated Owner work. Ambiguity is `NEEDS_HUMAN`.
2. **History cutover:** whether the existing phase3 transition candidate is already intended to be
   integrated before the context migration. Do not independently re-archive it.
3. **Visual index generation:** create the compact index only if it is deterministically derivable;
   otherwise use packet selectors into the detailed register.
4. **Scoped instructions:** do not introduce nested `AGENTS.md` until worker launch directories are
   controlled and tested.
5. **Context budget:** set operational targets only after baseline and fresh-agent measurements.
6. **Historical missing pointers:** classify missing targets as archived, lost, or incorrect through
   sidecar exceptions; never infer replacements or edit immutable records.

Stop the migration immediately for an authority conflict, loss of a locked safety rule, inability
to reproduce the dirty frontier, non-append history mutation, a task packet that cannot be tied to
canonical sources, or a clean-checkout candidate that depends on untracked files.

## 14. First authorized implementation action

When implementation is separately authorized, begin with M0 only: freeze and classify the exact
dirty frontier and produce the dependency closure for the current router. Do not edit `AGENTS.md`,
state, history, authority files, or application code during that first action. The first mutation is
M1's coordinator-reviewed portability integration, and only after ownership is unambiguous.
