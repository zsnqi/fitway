# FITWAY Agent Policy

## Locked decisions and safety

- Binding product, security, privacy, content, accessibility, and data-semantic decisions remain in force. Do not silently change locked product or content decisions or FITWAY's core identity; surface any material proposal explicitly.
- Privacy/security ambiguity, a locked-product conflict, unleased shared-file work, or a material visual-direction change is immediately `NEEDS_HUMAN`.
- No visitor identity, image, video, frame, biometric, or per-visitor data is stored or transmitted, and stale, absent, closed, or loading data never looks live.
- Automated checks, detector cleanliness, canonical identity, and hash stability are lint and provenance, never evidence of design quality; visual acceptance requires explicit inspection of named exact rendered frames, and broad authorization to proceed is never visual acceptance.
- Agents never disable or uninstall the user's global skills, plugins, MCP tools, or integrations for FITWAY; which ones are on is the user's choice.

## Startup

Codex loads this file automatically and Claude loads it through `CLAUDE.md`; every other source is an explicit read.

1. A session that starts here runs `git fetch`, then reads `PROJECT_STATE.yaml` for the open milestones. No open milestone means no assigned task; do not infer one. A delegated agent follows its brief's startup and environment instructions instead.
2. Run `pnpm context:show --milestone <milestone-id>`. It prints the milestone's scope, the packet's ordered required sources and conditional triggers, and the milestone's resume file. Read the resume file in full, then the decisions files it names, then the required sources in order. Expand a conditional source only when its recorded trigger is observed, and perform its recorded `READ` or `NEEDS_HUMAN` action. A coordinator resuming without a named milestone does this for every open milestone; an independent verifier reads the resume file only after recording its own assessment.
3. `PROJECT_STATE_HISTORY.yaml`, `docs/archive/**`, and other milestones' handoffs are read only through a named decision, predecessor, incident, or audit pointer.
4. A missing, untracked, stale, or conflicting packet, route, or required source is a stop condition: repair it through the coordinator; never guess or infer authority.
5. Widen the route deliberately for cross-cutting, security-sensitive, visual-authority, historical, or ambiguous work, and record why.

`docs/agent-context/ROUTES.yaml` names the minimum authority roles each task class requires; a packet supplies exact paths and selectors and never becomes authority. `docs/agent-context/README.md` describes the context layer.

## Ownership and records

- The coordinator alone writes `PROJECT_STATE.yaml` and `PROJECT_STATE_HISTORY.yaml`, assigns each milestone's scope, integrates work, and declares the terminal states: `DONE`, `SUPERSEDED`, `BLOCKED`, `NEEDS_HUMAN`, `FAILED_VALIDATION`.
- One writer per worktree. Genuinely independent writers work concurrently only in separate worktrees with disjoint owned paths (the scopes in the ledger), a coordinator lease for any shared file, and isolated runtime resources; the coordinator serializes integration. Stop on overlapping ownership, unleased shared-file work, concurrent canonical or migration updates, or unsafe shared runtime use. Freeze the exact target and outcome before handing mechanical work to a lighter writer.
- A validation failure is repaired until its gate passes. After every two failed repairs of the same failure, the coordinator redoes the root-cause analysis, writes the next attempt from a changed hypothesis or scope, and tells the user in a line. `FAILED_VALIDATION` is declared only when the coordinator or the user judges the approach itself wrong. A successor attempt opens only after its terminal record names the failure mode prior checks did not cover, the changed hypothesis or scope, and why that failure mode will not recur. A milestone whose open work a successor carries closes as `SUPERSEDED`.
- Each milestone resumes from one file, `<milestone-id>-resume.md`, kept current with `pnpm handoff:new`; its decisions in force live in the `DECISIONS.md` that file names.
- Closing a milestone is one commit that moves its terminal record from the ledger to the end of `PROJECT_STATE_HISTORY.yaml`; history is append-only and never rewritten.
- A plan whose result is handed to the user or an external executor ends as a plan delivery, not a milestone.

## Git, CI and verification

- `main` is the trunk. The coordinator pushes working branches, never forces a push, and fast-forwards `main` to a branch whose CI passed. Deploying or provisioning external systems needs the user's authorization.
- CI (`.github/workflows/checks.yml`) runs the fast ladder, `scripts/verify.mjs fast`, on every push; the green CI run on a pushed commit is the verification a record cites. Locally, `pnpm verify:fast`, `pnpm verify:phase --phase <registered-name>`, and `pnpm verify:full` run the same ladder and add the database and browser suites CI does not run.
- A passing run leaves `git status --short` unchanged. Integration tests accept only the explicitly named disposable database and marker.
- `pnpm check:design-context` is the required entry check for any design or UI session; it is not part of the ladder.

## Working agreements

- Use subagents when they materially help with broad reading, narrow investigation, test execution, or bounded fixes; delegation buys context cleanliness and permission narrowing, not speed alone. The main session retains final ownership and reviews every returned result against rendered or executed evidence — a subagent's own claim of success is not evidence.
- Impeccable is FITWAY's single broad design skill, entered through the FITWAY bridge (`pnpm check:design-context`, the active packet's visual authority fields, and the authority register/conflict map); do not stack competing design or taste skills. Reserve structured audit skills for a fresh final review or a deliberately requested polish session, and use brainstorming only when substantial planning or real ambiguity benefits from alternatives.
- Use Browser for interactive visual inspection and repository Playwright for repeatable screenshots, responsive checks, RTL/LTR, keyboard behavior, and functional verification.
- How the user and the agents work together (when to ask, delegation, Codex rounds) is `docs/agent-context/WORKING_AGREEMENTS.md`; the operational procedure (worktrees, runtime isolation, the ladder, design gates, integration) is `docs/WORKFLOW.md`.

## Source-of-truth order

1. `AGENTS.md` governs agent process, safety, ownership, validation, and escalation.
2. `FITWAY_PRODUCT.md` governs product identity, users, content hierarchy, and surface boundaries. `SPEC.md` governs security, privacy, data semantics, interfaces, and acceptance. A conflict between them is `NEEDS_HUMAN`; neither silently overrides the other.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs prove implementation conformance. A mismatch with Product/Spec is a stop condition, not permission to change a locked decision.
4. The approved visual-authority chain governs presentation: Paper where `docs/adr/ADR-007-paper-visual-source-of-truth.md` keeps it active, `DESIGN_GUIDE.md`, `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`, and any named human decision that supersedes them for a surface, subject to Product/Spec and to ADR-007 for composition. `DESIGN_GUIDE.md` and the manifest govern responsive, RTL, interaction, accessibility, token-baseline, and artifact-provenance behavior. `docs/adr/ADR-009-owner-composition-authority-supersession.md` supersedes Paper composition authority for the Owner surfaces and keeps it as reference only; the packet's visual fields resolve the exact current surface status.
5. `PHASES.md` governs durable dependency and acceptance scope, and the packet routes the exact sections a task needs. `PROJECT_STATE.yaml` is the coordinator-owned active ledger; `PROJECT_STATE_HISTORY.yaml` is closed, append-only history — evidence, never authority — and `pnpm check:repository` validates both together.
6. ADRs, `RESEARCH.md`, and phase records preserve rationale and evidence. `docs/archive/`, prototypes, generated reviews, handoffs, Stitch, Claude, G1B, and VDG material are provenance only.

`README.md` is an index, not a normative source. If two sources at the same level disagree, stop and record the conflict in `PROJECT_STATE.yaml` rather than choosing opportunistically.
