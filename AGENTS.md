# FITWAY Agent Policy

## Locked decisions and safety

- Binding product, security, privacy, content, accessibility, and data-semantic decisions remain in force. Do not silently change locked product or content decisions or FITWAY's core identity; surface any material proposal explicitly.
- Privacy/security ambiguity, a locked-product conflict, unleased shared-file work, or a material visual-direction change is immediately `NEEDS_HUMAN`.
- No visitor identity, image, video, frame, biometric, or per-visitor data is stored or transmitted, and stale, absent, closed, or loading data never looks live.
- Automated checks, detector cleanliness, canonical identity, and hash stability are lint and provenance, never evidence of design quality; visual acceptance requires explicit inspection of named exact rendered frames, and broad authorization to proceed is never visual acceptance.
- Do not disable or uninstall globally useful skills, plugins, MCP tools, or integrations merely for FITWAY.

## Working agreements

- One writer at a time. Never run concurrent writers; parallelism is for genuinely independent read-only work. Freeze the exact target and outcome before handing mechanical work to a lighter writer.
- Use subagents when they materially help with broad reading, narrow investigation, test execution, or bounded fixes; delegation buys context cleanliness and permission narrowing, not speed alone. The main session retains final ownership and reviews every returned result against rendered or executed evidence — a subagent's own claim of success is not evidence.
- Impeccable is FITWAY's single broad design skill, entered through the FITWAY bridge (`pnpm check:design-context`, the active design packet, and the authority register/conflict map); do not stack competing design or taste skills. Reserve structured audit skills for a fresh final review or a deliberately requested polish session, and use brainstorming only when substantial planning or real ambiguity benefits from alternatives.
- Use Browser for interactive visual inspection and repository Playwright for repeatable screenshots, responsive checks, RTL/LTR, keyboard behavior, and functional verification.

## Verification essentials

- `pnpm verify:fast` — repository invariants, lint, types, unit/component tests.
- `pnpm verify:phase --phase <registered-name>` — fast ladder plus phase-selected checks.
- `pnpm verify:full` — full disposable-Postgres, build, browser, accessibility, and visual ladder.
- `pnpm check:design-context` — the required entry check for any design or UI session; it is not part of `verify:fast`.
- Authoritative verification begins only when the host directly invokes an absolute Node path on `scripts/check-test-runtime.mjs`, `scripts/run-vitest.mjs run ...`, `scripts/verify.mjs fast`, `scripts/verify.mjs phase --phase <registered-name>`, or `scripts/verify.mjs full`, from a worktree prepared with `pnpm install --frozen-lockfile`. A fresh frozen install and a clean host-selected process start are setup preconditions, not defenses against hostile local code, malicious same-user processes, compromised dependencies, or a compromised host/OS; those are explicitly outside the current threat model.
- The direct focused runner (`scripts/run-vitest.mjs run ...`) is evidence only for the exact printed config path, SHA-256, and byte length with the requested focus/filter arguments, for repository-local Node/Vitest selection and the bounded integrity set, for bounded pre/post-launch integrity, and for unchanged repository content during that invocation. It does not prove the fast, phase, or full ladder, does not authenticate dependencies, and does not confine test code. Package aliases remain developer conveniences whose own bootstrap is not authoritative.
- `pnpm check:test-runtime`, `pnpm test`, `pnpm test:integration`, and `pnpm verify:*` are developer conveniences and corroboration only — never trusted normative evidence, and never reusable authority for a later process. A green convenience route is not acceptance evidence.
- One direct invocation owns exactly one Vitest runtime session, acquired before the first Vitest launch and revalidated immediately before and after every launch. The claim covers only that session's recorded Vitest provenance, lockfile resolution, path containment, and bounded integrity set; it is not authentication, attestation, or a sandbox, it says nothing about bytes outside the bounded set, and native addons, forks/Workers, subprocesses, and external executables remain permitted runtime behavior.
- Integration tests accept only the explicitly named disposable database and marker.
- A passing run must leave `git status --short` unchanged from its pre-run state.

## Source-of-truth order

1. `AGENTS.md` governs agent process, safety, ownership, validation, and escalation.
2. `FITWAY_PRODUCT.md` governs product identity, users, content hierarchy, and surface boundaries. `SPEC.md` governs security, privacy, data semantics, interfaces, and acceptance. A conflict between them is `NEEDS_HUMAN`; neither silently overrides the other.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs prove implementation conformance. A mismatch with Product/Spec is a stop condition, not permission to change a locked decision.
4. Paper is the visual source of truth except where a named human decision supersedes it for a surface; ADR-009 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`) supersedes Paper composition authority for the Owner surfaces and keeps it as reference only. `docs/adr/ADR-007-paper-visual-source-of-truth.md` records the authority split and approved families. `DESIGN_GUIDE.md` and `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` govern responsive, RTL, interaction, and accessibility behavior, the token baseline, and artifact provenance, subject to Product/Spec and to ADR-007 for composition.
5. `PHASES.md` governs durable dependency and acceptance scope. `PROJECT_STATE.yaml` is the coordinator-owned active frontier ledger; `PROJECT_STATE_HISTORY.yaml` is closed, append-only terminal history — evidence, never authority — and `pnpm check:repository` validates the active frontier and the closed history together.
6. ADRs, `RESEARCH.md`, and phase records preserve rationale and evidence. `docs/archive/`, prototypes, generated reviews, handoffs, Stitch, Claude, G1B, and VDG material are provenance only.

`README.md` is an index, not a normative source. If two sources at the same level disagree, stop and record the conflict in `PROJECT_STATE.yaml` rather than choosing opportunistically.

## Reading order and router

`AGENTS.md` is loaded automatically; every other authority below is an explicit read.

| Document | Read when |
| --- | --- |
| `FITWAY_PRODUCT.md` and the relevant `SPEC.md` sections | before any implementation, verification, or review |
| `docs/WORKFLOW.md` | before any execution — roles, state machine, worktrees, leases, repair budget, verification ladder |
| `PROJECT_STATE.yaml` and `PHASES.md` | at startup, for live status and durable scope |
| `DESIGN_GUIDE.md`, ADR-007, and the approval manifest | for UI, visual, RTL, or accessibility work |
| `docs/design/VISUAL_AUTHORITY_STATUS.md`, `docs/design/PAPER_GUIDE_CONFLICT_MAP.md`, and the active design packet template (`docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md`) | before any UI, composition, or visual-authority work |
| The relevant ADR, phase record, and latest ledger handoff | before continuing or judging prior work |

## Process in brief

- The coordinator alone updates `PROJECT_STATE.yaml`, owns shared-file leases, integrates work, and declares terminal states: `DONE`, `BLOCKED`, `NEEDS_HUMAN`, `FAILED_VALIDATION`.
- Worker sessions use isolated worktrees and one bounded phase or phase slice inside owned paths; coordinator-owned shared surfaces require an explicit lease.
- Validation failure permits at most two focused repair attempts; the third recurrence is `FAILED_VALIDATION`. A successor attempt may open only after its terminal record names the failure mode prior checks did not cover, the changed hypothesis or scope, and why that failure mode will not recur.
- A plan whose result is handed to the user or an external executor ends as a plan delivery, not a `PROJECT_STATE.yaml` milestone.
- The full operational procedure, including worktree preparation, resource isolation, verification, independent review, and integration, is `docs/WORKFLOW.md`.
