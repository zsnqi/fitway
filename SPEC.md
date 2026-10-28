# Spec: FITWAY v1 — Live Gym Occupancy (Pilot)

> **Status.** Implemented v1 pilot specification / Definition of Done. Written 2026-07-12;
> repository implementation closed 2026-08-31. All aggregate phases 1–12 and the
> `repository-closeout` milestone are `DONE` and archived in `PROJECT_STATE_HISTORY.yaml`,
> with the active ledger holding only open-status work. The accepted canonical
> project-wide verification is recorded in `docs/phase-records/repository-closeout.md`.
> This document turns the agreed product and design into implementable, verifiable
> requirements. It participates in the repository hierarchy defined by `AGENTS.md`:
>
> - `FITWAY_PRODUCT.md` co-governs product identity, users, content hierarchy, and surface
>   boundaries.
> - This Spec governs security, privacy, data semantics, interfaces, and acceptance.
> - `DESIGN_GUIDE.md` governs visual, responsive, RTL, interaction, and accessibility detail,
>   subject to Product and Spec.
> - `RESEARCH.md` and `docs/adr/` retain rationale and provenance; archived planning material
>   is not implementation authority.
>
> Where those documents left something genuinely open, this spec resolves it and marks the
> resolution **[Resolved here]**. Everything else preserves the recorded decisions:
> the two-path cache-first architecture, edge-authoritative counting, Hono + Drizzle +
> Supabase Postgres, signed server-side sessions and authorization, Arabic-first RTL,
> **dark-only for the shipped v1 product**, and **Western digits 0–9 exclusively**.
> The named human decision for concept-only Owner exploration and the Public redesign under
> ADR-010 may vary appearance, including light/dark treatment and typography other than Cairo
> (the Public redesign: Readex Pro, dark-only); it does not change the shipped contract.
>
> This spec deliberately does **not** split work into phases and does not cover
> deployment/provisioning execution (Supabase project creation, Vercel spend caps, domain).
> Those remain pre-deploy gates listed in RESEARCH.md §11/§17/§18.

---

## Parts

This specification is this file and the parts below, in order. Each part has the authority of the sections it
holds; edit a section in its part. Open the part a task needs: routes and packets name it by path and heading.

- `docs/spec/01-authority.md`: Implementation authority and fidelity contract
- `docs/spec/02-problem-and-solution.md`: Problem Statement; Solution
- `docs/spec/03-user-stories.md`: User Stories; Visitor (anonymous, public page); Staff (shared front-desk account); Owner / Admin; Maintainer; Edge device (system actor — contract only; CV internals are site-gated); System
- `docs/spec/04-acceptance-criteria.md`: Acceptance Criteria; Functional; Pilot targets (provisional — confirm with owner at pilot kickoff; measurement method is part of the target)
- `docs/spec/05-architecture-and-schema.md`: Implementation Decisions; Architecture & Schema
- `docs/spec/06-interfaces-and-contracts.md`: Interfaces & Contracts
- `docs/spec/07-behavior-and-interactions.md`: Behavior & Interactions
- `docs/spec/08-module-and-testing.md`: Module Design; Testing Decisions
- `docs/spec/09-scope-questions-notes.md`: Out of Scope; Open Questions; Further Notes
