# Concept-phase lifecycle amendment — recorded human authorization

- Recorded: 2026-09-21 20:22 +03:00 (observed local clock; report-name timestamps follow the
  session convention and are not authoritative capture times).
- Status: **recorded human authorization**; authorizes this bounded lifecycle amendment repair only.
- Coordinator session: `exploration-concept-phase-lifecycle-r01-coordinator`.
- Predecessor: fresh independent audit of the repaired design-agent environment on 2026-09-21 at
  `cbf4c5d` returned **FAILED_VALIDATION** with one critical finding — honest activation of
  `owner-design-exploration-r01` is impossible because
  `scripts/check-agent-context.mjs:1009-1048` requires a READY UI packet to have
  `accessibilityGate` and `visual.perceptualGate` `PASS`, while the concept-first workflow defines
  both as post-concept gates. The audit observed: "no legitimate path exists under current rules;
  the rule blocks a pre-implementation concept phase."

## Authorization recorded verbatim

- Question: "How should I resolve the activation blocker so owner-design-exploration-r01 can
  begin?"
- Answer: "Authorize the lifecycle amendment repair (Recommended)."
- Option scope recorded to the human: "Open a bounded repository-infrastructure repair: allow
  READY/IN_PROGRESS VACANT exploration packets to keep accessibility/perceptual gates PENDING
  (design-context PASS required), enforce both PASS before VALIDATING/DONE/promotion; update
  checker + tests + WORKFLOW note, independent review, commit/archive, then fresh audit PASS, then
  activate the milestone."

## Scope of this authorization

1. Amend the task-packet lifecycle validator so a `visual-authority-change` packet with
   `visual.authorityStatus: VACANT` may be `READY` while its milestone is `READY` or `IN_PROGRESS`
   with `accessibilityGate` and `visual.perceptualGate` still `PENDING`, provided
   `designContextCheck.status` is `PASS`.
2. Both gates must be `PASS` once the milestone reaches `VALIDATING` or later, and before any
   `CLOSED`/`DONE` terminal record or promotion.
3. Record the concept-phase semantics in `docs/WORKFLOW.md` and the packet template comment block.
4. No production, visual-authority, register, manifest, ADR, canonical, or hash change; the
   standing audit gate is resolved only by a subsequent fresh independent audit PASS, not by this
   authorization.

## Non-claims

This record does not itself resolve the design-environment audit gate, does not authorize concept
work, and does not amend ADR-007, ADR-009, `DESIGN_GUIDE.md`, `FITWAY_PRODUCT.md`, or `SPEC.md`.
