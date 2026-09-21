# Owner design exploration — exploration-envelope decision (recorded human instruction)

- Recorded: 2026-09-21 18:31 +03:00 (observed local clock; report-name timestamps follow the
  session convention and are not authoritative capture times).
- Status: **recorded human instruction**; authorizes the envelope repair only.
- Affected milestone: `owner-design-exploration-r01` (PLANNED, packet DRAFT).
- Coordinator session: `owner-design-exploration-envelope-repair-r01-coordinator`.
- This record is authority for the exploration-stage envelope. It is not an ADR and changes no
  production, Product, Spec, accessibility, or visual-authority decision.

## Instruction recorded verbatim

> I want you to fix all of the issues behind this dark/red design convergence so the models are
> no longer constrained into the same weak visual outcome and have real freedom to explore
> stronger directions.
>
> […]
>
> The goal is to remove or repair the constraints, context coupling, and workflow issues that are
> forcing the design explorations into the same dark/red look, so future exploration work can
> produce genuinely different and higher-quality visual directions.

## Decision

1. **Exploration-stage envelope widened.** Concept artifacts produced for the Owner exploration
   may explore named visual worlds that deliberately depart the incumbent near-black/graphite,
   oxblood, and FITWAY-red treatment, including non-dark and non-red directions. Each such
   artifact is labeled concept-only and is not a milestone concept until the human selects it.
2. **Production identity unchanged.** The v1 dark-only product decision, the `--fw-*` token
   baseline, Cairo weights, the static-atmosphere contract, accessibility, semantics, and every
   locked Product/Spec decision remain binding for production and are not amended by this record.
   `apps/**` and `packages/**` are untouched.
3. **Promotion rule.** A concept that departs from a locked visual rule reaches production only
   through a separate, explicit human baseline decision (a successor decision record or an
   amended authority) with its own perceptual gate. This envelope, a concept-selection record, or
   a green check never promotes a departure.
4. **Anti-rut requirement.** Exploration must not re-run the incumbent skin. Alternatives must
   derive from distinct named worlds, and the incumbent atmosphere, the frozen
   `owner-governance-layout-recomposition-r02` topology, and the quarantined prior attempts are
   recorded anti-ruts.
5. **Audit gate untouched.** The standing design-environment audit gate remains unresolved. This
   record does not resolve, supersede, or weaken it, and authorizes no concept selection.
6. **Authority to repair context.** This instruction authorizes the coordinator to repair the
   exploration context (packet, template, schema, checker, workflow, router, quarantine, and
   records) without changing production behavior or visual authority.

## Non-claims

This record does not amend ADR-007, ADR-009, `DESIGN_GUIDE.md`, `FITWAY_PRODUCT.md`, `SPEC.md`,
`docs/design/VISUAL_AUTHORITY_STATUS.md`, `docs/design/PAPER_GUIDE_CONFLICT_MAP.md`, any approval
manifest, or any pinned hash. It claims no visual acceptance, no implementation authorization,
and no product change.
