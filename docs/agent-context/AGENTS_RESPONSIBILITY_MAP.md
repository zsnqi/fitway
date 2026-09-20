# AGENTS.md responsibility migration map

- Prepared: 2026-09-20 17:40 +03:00 for migration stage M6.
- Root policy before: commit `8515e84`, 8,926 bytes, SHA-256
  `5b24b0fbbdd2fe302280cb29b89c307377e76e8ac7df64f72865a07c68f63f0d` (M5 closure). Measured on
  the raw committed blob, matching the new-file measurement basis.
- Root policy after: 7,614 bytes, SHA-256
  `970f7c03697ba7f6a3f4b99c913ed070ce97d381c08e38cd54eb15e7b5404dc8`.
- Scope: every responsibility removed or relocated from root `AGENTS.md`, and the inline handoff
  field list moved out of `docs/WORKFLOW.md`. Destinations are canonical files, not copied
  authority. This map itself creates no authority.

## Retained in root `AGENTS.md`

| Responsibility | Location after M6 | Note |
| --- | --- | --- |
| Privacy/security stop, locked-product conflict, unleased shared-file work, material visual change | Locked decisions and safety | Bullets retained verbatim. |
| No visitor identity/image/frame/biometric data; stale/absent/closed/loading never looks live | Locked decisions and safety | Retained verbatim. |
| Lint/provenance versus human visual acceptance; named exact rendered frames | Locked decisions and safety | Retained verbatim. |
| Do not disable globally useful skills/plugins/MCP tools for FITWAY | Locked decisions and safety | Retained verbatim. |
| One writer, read-only parallelism, freeze-before-delegation | Working agreements | Retained verbatim. |
| Subagent delegation boundary; parent reviews returned evidence | Working agreements | Retained verbatim. |
| Impeccable single-design-skill bridge; no competing taste skills | Working agreements | Retained; "active design packet" now reads "active packet's visual authority fields" because M7 retires the old template. |
| Browser for interactive inspection; Playwright for repeatable verification | Working agreements | Retained verbatim. |
| Source-of-truth order and same-level conflict stop rule | Source-of-truth order | Order retained; item 4 condenses per-surface status into the authority chain and the packet's visual fields. |
| Coordinator-only state, leases, integration, terminal states | Process in brief | Retained. |
| Two-repair rule and successor evidence gate | Process in brief | Retained; full procedure in Workflow. |
| Plan delivery is not a milestone | Process in brief | Retained verbatim. |
| Verification boundary summary (convenience versus authoritative, design-context entry, integration DB rule, unchanged status) | Verification boundary | Condensed from the old nine verification-essentials bullets; deep threat-model and provenance text is in Workflow. |
| Startup route and stop conditions | Startup route | New six-step bounded route replacing the old router table, with explicit history exclusion and deliberate-widening rule. |
| Context-layer pointers | Startup route final paragraph | `docs/agent-context/README.md`, `docs/agent-context/ROUTES.yaml`, `docs/WORKFLOW.md`. |

## Relocated responsibilities

| Removed or relocated responsibility | Old location | Destination | Mechanical or reviewable proof |
| --- | --- | --- | --- |
| `pnpm verify:fast/phase/full` are convenience aliases | Verification essentials, bullet 1 | `AGENTS.md` Verification boundary bullet 1; Workflow "Verification ladder" | Workflow defines the ladder; the aliases are marked corroboration in both files. |
| `pnpm check:design-context` is the design/UI entry check | Verification essentials, bullet 2 | `AGENTS.md` Verification boundary bullet 3; Workflow "Design work: authority, concepts, and perceptual gates" step 1 | `scripts/check-design-context.mjs`; UI packets carry `designContextCheck`. |
| Authoritative evidence starts only from a prepared worktree and a direct absolute-Node invocation | Verification essentials, bullet 3 | Workflow "Before creating a phase worktree" item 7; Workflow "Verification ladder" | Workflow text; `scripts/verify.mjs` session provenance. |
| Direct focused runner scope and non-claims | Verification essentials, bullet 4 | Workflow "Verification ladder" paragraph 2 | Workflow text; `scripts/run-vitest.mjs` output. |
| `check:test-runtime`, `test`, `test:integration`, and `verify:*` are corroboration only | Verification essentials, bullet 5 | Workflow "Verification ladder" paragraph 2; Workflow item 7 | Workflow text. |
| One invocation owns one Vitest session; coverage is bounded and not attestation | Verification essentials, bullet 6 | Workflow "Verification ladder" introductory paragraph; Workflow item 7 | `scripts/vitest-runtime.mjs` disclosure printed by every ladder. |
| Integration tests accept only the named disposable database and marker | Verification essentials, bullet 7 | `AGENTS.md` Verification boundary bullet 4; Workflow "Resource isolation" | Integration harness and profiles. |
| A passing run leaves `git status --short` unchanged | Verification essentials, bullet 8 | `AGENTS.md` Verification boundary bullet 5; Workflow "Verification ladder" | Repository mutation guard in the ladder. |
| Product/Spec read before implementation, verification, or review | Reading order table row 1 | `ROUTES.yaml` required roles for the implementation, analysis, and UI classes; packet `authorities.required`; Workflow "Independent verification" item 2 for the verifier's Product/Spec/Design/ADR comparison duty | `check-agent-context` validates required role/selector coverage per class; `context:show` prints it; `verification-independent` intentionally requires workflow, contract, and test while the comparison duty lives in Workflow. |
| Workflow read before execution | Reading order table row 2 | `AGENTS.md` Startup route; Workflow "Clean-session startup" | `context:show` step 3 and packet routing. |
| `PROJECT_STATE.yaml` and `PHASES.md` at startup | Reading order table row 3 | Workflow "Clean-session startup" step 2; `AGENTS.md` source-of-truth item 5 for durable scope; `ROUTES.yaml` `resume-integration` conditional on `PHASES.md` (heading `Dependency DAG`); Workflow "Integration" for the phase order | Active state is a startup step; the unconditional PHASES.md startup read is removed, and a resume task expands the named durable-dependency section only when its dependency scope is unresolved. |
| `DESIGN_GUIDE.md`, ADR-007, approval manifest for UI work | Reading order table row 4 | `ROUTES.yaml` `ui-maintenance` and `visual-authority-change` required sources for the design guide, register, and ADR-007; `AGENTS.md` source-of-truth item 4 names the approval manifest and its responsive/RTL/interaction/accessibility/token/artifact scope; the register and packet visual-status sources resolve the manifest entry | `check-agent-context` required-authority set and selector validation. The manifest is not itself a route entry: adding it to `ui-maintenance` would require an immutable closed pilot packet to change, so it stays named in root policy and selected through the register. |
| Visual register, conflict map, and the old active design packet template before UI work | Reading order table row 5 | `ROUTES.yaml` required and conditional visual sources; the conflict map is conditional in `visual-authority-change` for the Paper-unavailable stop and in `ui-maintenance` through `AGENTS.md` item 4's chain; ADR-009 conditional for Owner surfaces; M7 retires the template to a compatibility pointer | `check-agent-context` visual-packet validation; M7 template test. |
| Relevant ADR, phase record, and latest ledger handoff before continuing or judging prior work | Reading order table row 6 | Packet `continuity.currentHandoff` and `predecessorMilestones`; `resume-integration` and `historical-audit` routes | Checker validates handoff existence, tracking, and packet/history continuity. |
| Router table as an unconditional startup reading list | Reading order and router | `AGENTS.md` Startup route steps 1-6 | `context:show` prints the ordered route without loading sources; fresh-agent scenarios in M8. |
| Per-surface visual status and ADR-specific exceptions in root policy | Source-of-truth order item 4 | Visual-authority chain plus the packet's `visual` fields (surface key, status, authority key, frames, gates) | `check-agent-context` validates UI packet visual fields; register remains canonical. |
| Inline handoff field list | Workflow "Handoff format" | `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md` | Checker requires packets to reference the template; template carries the field contract. |

## Preserved without rewrite

`PHASES.md`, `docs/design/VISUAL_AUTHORITY_STATUS.md`, `docs/design/PAPER_GUIDE_CONFLICT_MAP.md`,
and `PROJECT_STATE_HISTORY.yaml` are unchanged. M6 only removes their unconditional startup read:
they are now reached through a packet selector, a named trigger, or a historical pointer. The
frontier-preservation and repository checks prove the files were not rewritten.

## Review

- Independent reviewer verdict: `PASS` (fresh read-only reviewer session, 2026-09-20). Every old
  `AGENTS.md` responsibility and every old Workflow handoff field is retained or relocated to a
  destination that exists and carries the substance; nothing was found genuinely lost.
- Reviewer findings and coordinator disposition:
  - The first draft's old-policy byte count used a text-normalized measurement. Corrected above to
    the raw committed blob (8,926 bytes, SHA-256 `5b24b0fb...`).
  - The Product/Spec destination was overstated as covering every task class. The row now names the
    implementation/analysis/UI classes and Workflow "Independent verification" item 2 for the
    verifier's comparison duty.
  - The PHASES.md routing claim had no route entry. `resume-integration` now carries a conditional
    `PHASES.md` (heading `Dependency DAG`) read, and the row states the full chain.
  - The approval-manifest and conflict-map destinations were overstated. The rows now state the
    actual chain, including why the manifest stays named in root policy instead of becoming a route
    entry: adding it to `ui-maintenance` would require the immutable closed Login pilot packet to
    change.
  - The Vitest bounded-coverage non-claim prose now also appears in Workflow "Verification ladder",
    not only in runtime disclosures.
- The independent reviewer also read `scripts/check-agent-context.mjs`,
  `docs/agent-context/ROUTES.yaml`, `docs/schemas/task-packet.schema.json`,
  `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md`, `docs/agent-context/README.md`, and the
  runtime-disclosure scripts named in the destinations.
- Coordinator re-verification after these corrections: `check-agent-context` PASS, repository
  invariants PASS, and the focused context suite at 59 tests PASS.
