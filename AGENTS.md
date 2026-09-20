# FITWAY Agent Policy

## Locked decisions and safety

- Binding product, security, privacy, content, accessibility, and data-semantic decisions remain in force. Do not silently change locked product or content decisions or FITWAY's core identity; surface any material proposal explicitly.
- Privacy/security ambiguity, a locked-product conflict, unleased shared-file work, or a material visual-direction change is immediately `NEEDS_HUMAN`.
- No visitor identity, image, video, frame, biometric, or per-visitor data is stored or transmitted, and stale, absent, closed, or loading data never looks live.
- Automated checks, detector cleanliness, canonical identity, and hash stability are lint and provenance, never evidence of design quality; visual acceptance requires explicit inspection of named exact rendered frames, and broad authorization to proceed is never visual acceptance.
- Do not disable or uninstall globally useful skills, plugins, MCP tools, or integrations merely for FITWAY.

## Startup route

`AGENTS.md` is automatic; every other source is an explicit read.

1. Read `PROJECT_STATE.yaml` for the active frontier. No open milestone means no assigned task; do not infer one.
2. Run `pnpm context:show -- --milestone <milestone-id>` to resolve the assigned task packet and its ordered required sources, selectors, and conditional triggers.
3. Read the packet's required sources in order. Expand a conditional source only when its recorded trigger is observed, and perform its recorded `READ` or `NEEDS_HUMAN` action.
4. Never load `PROJECT_STATE_HISTORY.yaml`, `docs/archive/**`, or unrelated handoffs by default. Expand history only through a named decision, predecessor, incident, or audit pointer.
5. A missing, untracked, case-mismatched, stale, hash-mismatched, or conflicting packet, route, or required source is a stop condition. Repair it through the coordinator; never guess or infer authority.
6. When the task is cross-cutting, security-sensitive, visual-authority, historical, or ambiguous, deliberately widen beyond the minimum route and record why.

The route registry `docs/agent-context/ROUTES.yaml` names the minimum authority roles each task class requires; a packet supplies exact paths and selectors and never becomes authority. `docs/agent-context/README.md` defines the context-layer precedence and `docs/WORKFLOW.md` defines the operational procedure, including the documented compatibility fallback.

## Working agreements

- One writer at a time. Never run concurrent writers; parallelism is for genuinely independent read-only work. Freeze the exact target and outcome before handing mechanical work to a lighter writer.
- Use subagents when they materially help with broad reading, narrow investigation, test execution, or bounded fixes; delegation buys context cleanliness and permission narrowing, not speed alone. The main session retains final ownership and reviews every returned result against rendered or executed evidence — a subagent's own claim of success is not evidence.
- Impeccable is FITWAY's single broad design skill, entered through the FITWAY bridge (`pnpm check:design-context`, the active packet's visual authority fields, and the authority register/conflict map); do not stack competing design or taste skills. Reserve structured audit skills for a fresh final review or a deliberately requested polish session, and use brainstorming only when substantial planning or real ambiguity benefits from alternatives.
- Use Browser for interactive visual inspection and repository Playwright for repeatable screenshots, responsive checks, RTL/LTR, keyboard behavior, and functional verification.

## Source-of-truth order

1. `AGENTS.md` governs agent process, safety, ownership, validation, and escalation.
2. `FITWAY_PRODUCT.md` governs product identity, users, content hierarchy, and surface boundaries. `SPEC.md` governs security, privacy, data semantics, interfaces, and acceptance. A conflict between them is `NEEDS_HUMAN`; neither silently overrides the other.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs prove implementation conformance. A mismatch with Product/Spec is a stop condition, not permission to change a locked decision.
4. The approved visual-authority chain governs presentation: Paper where `docs/adr/ADR-007-paper-visual-source-of-truth.md` keeps it active, `DESIGN_GUIDE.md`, `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`, and any named human decision that supersedes them for a surface, subject to Product/Spec and to ADR-007 for composition. `DESIGN_GUIDE.md` and the manifest govern responsive, RTL, interaction, accessibility, token-baseline, and artifact-provenance behavior. `docs/adr/ADR-009-owner-composition-authority-supersession.md` supersedes Paper composition authority for the Owner surfaces and keeps it as reference only; the packet's visual fields resolve the exact current surface status.
5. `PHASES.md` governs durable dependency and acceptance scope, and the packet routes the exact sections a task needs. `PROJECT_STATE.yaml` is the coordinator-owned active frontier ledger; `PROJECT_STATE_HISTORY.yaml` is closed, append-only terminal history — evidence, never authority — and `pnpm check:repository` validates the active frontier and the closed history together.
6. ADRs, `RESEARCH.md`, and phase records preserve rationale and evidence. `docs/archive/`, prototypes, generated reviews, handoffs, Stitch, Claude, G1B, and VDG material are provenance only.

`README.md` is an index, not a normative source. If two sources at the same level disagree, stop and record the conflict in `PROJECT_STATE.yaml` rather than choosing opportunistically.

## Process in brief

- The coordinator alone updates `PROJECT_STATE.yaml`, owns shared-file leases, integrates work, and declares terminal states: `DONE`, `BLOCKED`, `NEEDS_HUMAN`, `FAILED_VALIDATION`.
- Worker sessions use isolated worktrees and one bounded phase or phase slice inside owned paths; coordinator-owned shared surfaces require an explicit lease.
- Validation failure permits at most two focused repair attempts; the third recurrence is `FAILED_VALIDATION`. A successor attempt may open only after its terminal record names the failure mode prior checks did not cover, the changed hypothesis or scope, and why that failure mode will not recur.
- A plan whose result is handed to the user or an external executor ends as a plan delivery, not a `PROJECT_STATE.yaml` milestone.
- The full operational procedure, including worktree preparation, resource isolation, verification, handoff fields, and integration, is `docs/WORKFLOW.md`. Handoffs use `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md`.

## Verification boundary

- `pnpm verify:fast`, `pnpm verify:phase --phase <registered-name>`, and `pnpm verify:full` are developer conveniences whose exit status is corroboration only.
- Authoritative verification begins only when the host directly invokes an absolute Node path on `scripts/check-test-runtime.mjs`, `scripts/run-vitest.mjs run ...`, `scripts/verify.mjs fast`, `scripts/verify.mjs phase --phase <registered-name>`, or `scripts/verify.mjs full`, from a worktree prepared with `pnpm install --frozen-lockfile`. `docs/WORKFLOW.md` defines the exact scope, provenance, bounded-set, and non-claim rules of that evidence.
- `pnpm check:design-context` is the required entry check for any design or UI session; it is not part of `verify:fast`.
- Integration tests accept only the explicitly named disposable database and marker.
- A passing run must leave `git status --short` unchanged from its pre-run state.
