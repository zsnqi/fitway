# Design

> **Router, not authority.** This file is a machine-readable pointer for the Impeccable skill to FITWAY's actual design authorities: `DESIGN_GUIDE.md`, `docs/adr/ADR-007-paper-visual-source-of-truth.md`, `docs/adr/ADR-009-owner-composition-authority-supersession.md`, and `docs/design/VISUAL_AUTHORITY_STATUS.md`. It is a router, not independent design authority, duplicates no value, and restates no locked visual decision. The guide, ADR-007 as superseded in part by ADR-009 for the seven Owner surfaces, and the authority register govern.

## Colors

The shared palette baseline is the custom-property token layer under `packages/ui` (`packages/ui/src/styles/globals.css`). Roles, families, and surface treatment rules are governed by `DESIGN_GUIDE.md`, ADR-007, and the per-surface authority register, not by this router.

## Typography

Shared type tokens and font stacks live in the `packages/ui` token layer. Scale, families, Arabic/Latin pairing, and RTL/LTR typographic behavior are governed by `DESIGN_GUIDE.md` and ADR-007.

## Components

Shared control families are exported from `packages/ui`; Owner, Staff, and Public reuse those primitives and tokens. Cross-surface control rules and the one-family-per-control-role requirement live in `docs/WORKFLOW.md` and are enforced by the repository review specs.

## Layout

Composition and per-surface layout authority is recorded in `docs/design/VISUAL_AUTHORITY_STATUS.md` under ADR-007 and ADR-009. Paper is the visual source of truth only where that register records it; this router derives no layout.

## Exploration mode

When the active task packet records an exploration envelope while Owner composition authority is vacant, follow that packet and the latest named human decision. This router's palette, type, and component pointers describe production references; they do not prescribe a concept's visual form. For the current Owner exploration, red and black are the broad identity anchor and Cairo is not wanted. No exact shades, proportions, light/dark treatment, typography, materials, atmosphere, composition, chart form, glow, or number of directions is prescribed. The user directs whether and how exploration continues. Preserve Product/Spec behavior, truthful data, privacy, security, accessibility, RTL/LTR, Western digits, and other non-visual contracts. Label concepts as exploratory and do not promote them without a separate human decision. When no envelope is recorded, this router resolves the current visual authority as before. Production rules, tokens, and authority remain unchanged.

## Motion

Motion and interaction behavior follow `DESIGN_GUIDE.md` and the shared tokens under `packages/ui`; this router states no motion values.
