# FITWAY Product Brief

## Product and success truth

FITWAY v1 is an operational live-occupancy product for one pilot gym. Its public promise is narrow: help a visitor decide whether to go now by showing an honest, current estimate of how crowded the gym is. It is not a marketing website, a member-attendance system, or a claim of exact headcount.

The primary truth is the labeled crowd band—Quiet, Moderate, Busy, or Packed—supported by an approximate count, open/closed state, and freshness. The anonymous public contract is capacity-free: it exposes neither capacity nor a derived percentage/denominator. No v1 owner toggle or client-side presentation may weaken that boundary. `SPEC.md` retains a post-v1 safety reservation only to constrain any future proposal; it authorizes no current feature and still requires an explicit versioned Product/Spec approval. Success means the displayed state is useful, timely, accessible, and never presents stale or absent data as live. Pilot measurement and implementation acceptance remain defined in [SPEC.md](SPEC.md) and [RESEARCH.md](RESEARCH.md).

## People and jobs

| User | Job |
| --- | --- |
| Visitor | Check crowd level, approximate occupancy, opening state, and freshness quickly before traveling. No sign-in. |
| Staff | Monitor live occupancy and device health; correct, directly set, or reset the count when needed. Every mutation is attributable and audited. |
| Owner/admin | Use staff operations plus analytics, exports, settings, account management, audit history, and health summaries to run the gym. |
| Maintainer | Detect edge or camera failure before the owner, receive bounded alerts and recovery notices, and verify operational health. |

## Surface boundaries

The public surface is anonymous, mobile-first, read-only, lightweight, and limited to current occupancy truth. It must not expose controls, operational diagnostics, member identity, images, video, or tracking identifiers.

Staff and owner surfaces are authenticated operational tools. Staff can operate the live count and see health but cannot access owner settings, analytics, or account management. Owners receive those additional governance and reporting capabilities. Server-side authorization—not navigation visibility—is authoritative. Shared staff access is PIN-based through the signed HttpOnly session model, not email/password. The current scaffold email/password form and the design archive's fake login values are not the target staff contract.

## Information hierarchy

The public page should answer, in order:

1. Is the gym open, and is the information live?
2. What is the labeled crowd band?
3. What is the approximate count?
4. What does the continuous crowd signal show?
5. When was the value updated?
6. If closed, when does the gym open next? If stale or unavailable, what can the visitor safely conclude?

Crowd status and freshness must always use text and iconography in addition to color. Closed and unavailable states show no occupancy count or crowd band. Stale retains the explicitly labeled last-known value rather than erasing it or presenting it as live.

## Operational states

- **Loading:** a lightweight skeleton and accessible loading announcement while the first payload resolves.
- **Fresh:** open gym, usable recent value, labeled live update, band, approximate count, continuous 28-bar crowd signal, and last-updated time.
- **Stale:** open gym, visibly delayed update, explicitly labeled last-known count and timestamp; the band and crowd signal remain only as visibly qualified last-known context.
- **Closed:** closed label and next opening when known; no count, crowd band, or implied live freshness.
- **Unavailable:** honest inability to provide usable occupancy; no count, crowd band, or fabricated last-updated time.
- **Error:** honest request failure, no retained reading, and one focused retry action.

The detailed payload, schedule, cache, polling, and transition rules are canonical in [SPEC.md](SPEC.md), [PHASES.md](PHASES.md), and [DESIGN_GUIDE.md](DESIGN_GUIDE.md).

## Devices, language, and content

Responsive acceptance covers widths **320, 360, 390, 721, 768, 820, 1024, 1200, and 1440px**, with canonical screenshot anchors at **1440×900 desktop**, **768×1024 tablet**, and **390×844 mobile portrait** where applicable. The public experience remains mobile-first and no route may create document-level horizontal overflow. Staff and owner route implementation remains Phase 4+ work.

Arabic is the default locale and uses RTL document direction. English uses LTR. The language choice persists locally. Use logical layout properties, natural Arabic wrapping, bidi isolation for Latin fragments and digit runs, and flexible controls that tolerate roughly 30–40% copy expansion.

All user-facing numerals are Western digits `0–9` in both languages. Public Arabic time uses a 12-hour clock with localized `ص/م`; English uses `AM/PM`. Times are formatted in the configured gym timezone, not the viewer's device timezone. Product copy must be realistic, concise, and native to each language—never transliterated placeholders or invented claims. Occupancy values used for design and capture, including `37`, are deterministic fixtures only and are not measured Fitway truth. Capacity and percentages may appear in historical design artifacts but are intentionally absent from the current public contract.

## Visual and inclusive constraints

The v1 product is dark-only; there is no light theme or theme toggle. Cairo is self-hosted for Arabic and Latin subsets at the actual weights 400, 500, 600, and 700. Do not depend on synthetic 800/900 faces.

Fitway must remain keyboard-operable, screen-reader legible, color-independent, and WCAG-conscious. Interactive touch targets, visible focus, concise live-region updates, text alternatives for data, and contrast requirements follow [DESIGN_GUIDE.md](DESIGN_GUIDE.md). `prefers-reduced-motion` must remove non-essential motion and replace animated loading or number changes with static/instant behavior. No essential meaning may depend on motion.

## Approved visual baseline

Broad visual exploration is complete. The one-time Baseline Reconciliation Gate promotes the current approved FITWAY theme, provenance, canonical screenshots, and supersession rules indexed by [`visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`](visual-direction-gate/approved/APPROVAL_MANIFEST.yaml). Its live completion state is recorded in [PROJECT_STATE.yaml](PROJECT_STATE.yaml). The durable implementation rules live in [DESIGN_GUIDE.md](DESIGN_GUIDE.md).

The theme retains the strongest lineage from G1B and the approved Claude Design family—global header discipline, panoramic public board, asymmetric metrics, near-black/graphite surfaces, FITWAY red, and purpose-built operational/data routes—but those artifacts are now historical provenance. Their percentage copy, fake identities, email/password mockups, fixture labels, demo notices, unavailable font weights, and preview-only annotations are explicitly superseded.

The production baseline uses a continuous cumulative 28-bar public crowd signal, makes crowd level dominant over the approximate count, uses a static blurred oxblood/FITWAY-red atmosphere behind the interface, and supports the canonical 320–1440 responsive matrix. The page background and live data do not animate. English LTR is composed naturally rather than mechanically mirrored from Arabic.

Further visual improvement happens in the focused polish loop at the end of the relevant implementation phase. It may improve composition, spacing, typography, mobile behavior, interaction, charts, tables, and accessibility while retaining FITWAY's identity and locked semantics. A material product or visual-direction change must be surfaced explicitly.

## Canonical detail

- Product rationale, privacy, architecture, risk, and pilot truth: [RESEARCH.md](RESEARCH.md)
- Implementation contract and Definition of Done: [SPEC.md](SPEC.md)
- Sequenced implementation phases: [PHASES.md](PHASES.md)
- Current visual, RTL, state, typography, motion, and accessibility rules: [DESIGN_GUIDE.md](DESIGN_GUIDE.md)
- Approved visual provenance and canonical references: [`visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`](visual-direction-gate/approved/APPROVAL_MANIFEST.yaml)
- Repository and service architecture decisions: [`docs/adr/`](docs/adr/)
- Live execution state and workflow: [PROJECT_STATE.yaml](PROJECT_STATE.yaml) and [`docs/WORKFLOW.md`](docs/WORKFLOW.md)
- Historical plans, visual exploration, handoffs, and superseded design material: [`docs/archive/`](docs/archive/)
