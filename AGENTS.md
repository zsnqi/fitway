# FITWAY Agent Policy

## Locked decisions and safety

- Binding product, security, privacy, content, accessibility, and data-semantic decisions remain in force. Do not silently change locked product or content decisions or FITWAY's core identity; surface any material proposal explicitly.
- Privacy/security ambiguity, a locked-product conflict, unleased shared-file work, or a material visual-direction change is immediately `NEEDS_HUMAN`.
- No visitor identity, image, video, frame, biometric, or per-visitor data is stored or transmitted, and stale, absent, closed, or loading data never looks live.
- Do not disable or uninstall globally useful skills, plugins, MCP tools, or integrations merely for FITWAY.

## Working agreements

- One writer at a time. Never run concurrent writers; parallelism is for genuinely independent read-only work. Freeze the exact target and outcome before handing mechanical work to a lighter writer.
- Use subagents when they materially help with broad reading, narrow investigation, test execution, or bounded fixes; delegation buys context cleanliness and permission narrowing, not speed alone. The main session retains final ownership and reviews every returned result against rendered or executed evidence — a subagent's own claim of success is not evidence.
- Use at most one broad design or taste skill for the same design problem; do not stack competing design skills. Reserve structured audit skills for a fresh final review or a deliberately requested polish session, and use brainstorming only when substantial planning or real ambiguity benefits from alternatives.
- Use Browser for interactive visual inspection and repository Playwright for repeatable screenshots, responsive checks, RTL/LTR, keyboard behavior, and functional verification.

## Verification essentials

- `pnpm verify:fast` — repository invariants, lint, types, unit/component tests.
- `pnpm verify:phase --phase <registered-name>` — fast ladder plus phase-selected checks.
- `pnpm verify:full` — full disposable-Postgres, build, browser, accessibility, and visual ladder.
- A fresh worktree needs `pnpm install --frozen-lockfile` and `pnpm exec vitest --version` before any test result from it is trustworthy; integration tests accept only the explicitly named disposable database and marker.
- A passing run must leave `git status --short` unchanged from its pre-run state.

## Source-of-truth order

1. `AGENTS.md` governs agent process, safety, ownership, validation, and escalation.
2. `FITWAY_PRODUCT.md` governs product identity, users, content hierarchy, and surface boundaries. `SPEC.md` governs security, privacy, data semantics, interfaces, and acceptance. A conflict between them is `NEEDS_HUMAN`; neither silently overrides the other.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs prove implementation conformance. A mismatch with Product/Spec is a stop condition, not permission to change a locked decision.
4. Paper is the visual source of truth; `docs/adr/ADR-007-paper-visual-source-of-truth.md` records the authority split and approved families. `DESIGN_GUIDE.md` and `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` govern responsive, RTL, interaction, and accessibility behavior, the token baseline, and artifact provenance, subject to Product/Spec and to ADR-007 for composition.
5. `PHASES.md` governs durable dependency and acceptance scope. `PROJECT_STATE.yaml` is the coordinator-owned live execution ledger.
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
| The relevant ADR, phase record, and latest ledger handoff | before continuing or judging prior work |

## Process in brief

- The coordinator alone updates `PROJECT_STATE.yaml`, owns shared-file leases, integrates work, and declares terminal states: `DONE`, `BLOCKED`, `NEEDS_HUMAN`, `FAILED_VALIDATION`.
- Worker sessions use isolated worktrees and one bounded phase or phase slice inside owned paths; coordinator-owned shared surfaces require an explicit lease.
- Validation failure permits at most two focused repair attempts; the third recurrence is `FAILED_VALIDATION`. A successor attempt may open only after its terminal record names the failure mode prior checks did not cover, the changed hypothesis or scope, and why that failure mode will not recur.
- A plan whose result is handed to the user or an external executor ends as a plan delivery, not a `PROJECT_STATE.yaml` milestone.
- The full operational procedure, including worktree preparation, resource isolation, verification, independent review, and integration, is `docs/WORKFLOW.md`.
