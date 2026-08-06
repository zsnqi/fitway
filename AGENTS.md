# FITWAY Agent Policy

- Binding product, security, privacy, content, accessibility, and data-semantic decisions remain in force.
- Paper is the visual source of truth; `docs/adr/ADR-007-paper-visual-source-of-truth.md` records the authority split and the four approved production families. The approved FITWAY theme snapshot and its manifest under `visual-direction-gate/approved/fitway-theme-20260715/` remain the hash-verified provenance and token baseline. Claude Design and G1B remain historical provenance where the manifest says they still apply; they are not independent current authorities.
- Apply visual and implementation judgment to improve composition, hierarchy, spacing, typography, responsive/mobile behavior, motion, interaction, charts, tables, accessibility, and overall quality.
- Do not silently change locked product or content decisions or FITWAY's core identity. Surface any material proposal explicitly.
- Use at most one broad design or taste skill for the same design problem. Do not stack competing design skills.
- Use Browser for interactive visual inspection and repository Playwright for repeatable screenshots, responsive checks, RTL/LTR, keyboard behavior, and functional verification.
- Reserve structured audit skills for a fresh final review or a deliberately requested polish session. Report issues without unnecessarily reopening accepted product decisions.
- Use brainstorming when substantial feature planning, interaction architecture, or real ambiguity benefits from alternatives; skip it for direct fixes and settled work.
- Use subagents when they materially help with broad reading, narrow investigation, test execution, or bounded fixes. The main session retains final ownership and review.
- Do not disable or uninstall globally useful skills, plugins, MCP tools, or integrations merely for FITWAY.

## Source-of-truth order

1. `AGENTS.md` governs agent process, safety, ownership, validation, and escalation.
2. `FITWAY_PRODUCT.md` governs product identity, users, content hierarchy, and surface boundaries. `SPEC.md` governs security, privacy, data semantics, interfaces, and acceptance. A conflict between them is `NEEDS_HUMAN`; neither silently overrides the other.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs prove implementation conformance. A mismatch with Product/Spec is a stop condition, not permission to change a locked decision.
4. `docs/adr/ADR-007-paper-visual-source-of-truth.md` places visual composition in Paper and behavior in the repository. `DESIGN_GUIDE.md` and `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` govern responsive, RTL, interaction, and accessibility behavior, the token baseline, and artifact provenance, subject to Product/Spec and to ADR-007 for composition.
5. `PHASES.md` governs dependency and acceptance scope. `PROJECT_STATE.yaml` is the coordinator-owned live execution ledger.
6. ADRs, `RESEARCH.md`, and phase records preserve rationale and evidence. `docs/archive/`, prototypes, generated reviews, handoffs, Stitch, Claude, G1B, and VDG material are provenance only.

`README.md` is an index, not a normative source. If two sources at the same level disagree, stop and record the conflict in `PROJECT_STATE.yaml` rather than choosing opportunistically.

## Execution policy

- Broad product-wide visual exploration is complete. Each UI-producing phase ends with its own focused Browser and screenshot polish loop; do not open another global redesign gate.
- Follow `docs/WORKFLOW.md`. The coordinator alone updates `PROJECT_STATE.yaml`, owns shared-file leases, integrates work, and declares `DONE`.
- Worker sessions use isolated worktrees and one bounded phase or phase slice. They may not edit coordinator-owned schema/migration ordering, root package/lock/config files, shared router aggregation, shared catalogs, global tokens, or test-resource configuration without an explicit lease.
- Required durable terminal states are `DONE`, `BLOCKED`, `NEEDS_HUMAN`, and `FAILED_VALIDATION`. Validation failure permits at most two focused repair attempts; the third recurrence is `FAILED_VALIDATION`.
- Privacy/security ambiguity, a locked-product conflict, unleased shared-file work, or a material visual-direction change is immediately `NEEDS_HUMAN`.
- Do not start Phase 4 worktrees until the Baseline Reconciliation Gate in `PROJECT_STATE.yaml` is `DONE` and its integrated commit is the branch point.
