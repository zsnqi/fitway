# FITWAY Product Brief

## Product and success truth

FITWAY v1 is an operational live-occupancy product for one pilot gym. Its public promise is narrow: help a visitor decide whether to go now by showing an honest, current estimate of how crowded the gym is. It is not a marketing website, a member-attendance system, or a claim of exact headcount.

The primary truth is the labeled crowd band—Quiet, Moderate, Busy, or Packed—supported by an approximate count, percentage full, open/closed state, and freshness. Success means the displayed state is useful, timely, accessible, and never presents stale or absent data as live. Pilot measurement and implementation acceptance remain defined in [SPEC.md](SPEC.md) and [RESEARCH.md](RESEARCH.md).

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
3. What is the approximate count and percentage full?
4. When was the value updated?
5. If closed, when does the gym open next? If stale or unavailable, what can the visitor safely conclude?

Crowd status and freshness must always use text and iconography in addition to color. Closed and unavailable states show no occupancy count, percentage, or meter. Stale retains the explicitly labeled last-known value rather than erasing it or presenting it as live.

## Operational states

- **Loading:** a lightweight skeleton and accessible loading announcement while the first payload resolves.
- **Fresh:** open gym, usable recent value, labeled live update, band, approximate count, percentage, meter, and last-updated time.
- **Stale:** open gym, visibly delayed update, explicitly labeled last-known count and timestamp; the value and meter remain for context.
- **Closed:** closed label and next opening when known; no count, percentage, meter, or implied live freshness.
- **Unavailable:** honest inability to provide usable occupancy; no count, percentage, meter, or fabricated last-updated time.

The detailed payload, schedule, cache, polling, and transition rules are canonical in [SPEC.md](SPEC.md), [PHASES.md](PHASES.md), and [DESIGN_GUIDE.md](DESIGN_GUIDE.md).

## Devices, language, and content

Public acceptance uses DPR 1 at **1440×900 desktop** and **390×844 mobile portrait**. The public experience remains mobile-first and must not create document-level horizontal overflow. Staff and analytics references use **1366×768 desktop** and **390px mobile** canvases; their application implementation remains Phase 4+ work.

Arabic is the default locale and uses RTL document direction. English uses LTR. The language choice persists locally. Use logical layout properties, natural Arabic wrapping, bidi isolation for Latin fragments and digit runs, and flexible controls that tolerate roughly 30–40% copy expansion.

All user-facing numerals are Western digits `0–9` in both languages. Public Arabic time uses a 12-hour clock with localized `ص/م`; English uses `AM/PM`. Times are formatted in the configured gym timezone, not the viewer's device timezone. Product copy must be realistic, concise, and native to each language—never transliterated placeholders or invented claims. Occupancy values used for design and capture, including `37/100` and `37%`, are deterministic fixtures only and are not measured Fitway truth.

## Visual and inclusive constraints

The v1 product is dark-only; there is no light theme or theme toggle. Cairo is self-hosted for Arabic and Latin subsets. The current baseline provides weights 400–700; missing Cairo 800/900 files are a recorded VDG-B issue and do not block VDG-0.

Fitway must remain keyboard-operable, screen-reader legible, color-independent, and WCAG-conscious. Interactive touch targets, visible focus, concise live-region updates, text alternatives for data, and contrast requirements follow [DESIGN_GUIDE.md](DESIGN_GUIDE.md). `prefers-reduced-motion` must remove non-essential motion and replace animated loading or number changes with static/instant behavior. No essential meaning may depend on motion.

## Visual Direction Gate boundary

The current UI and the screenshots in [`design-baseline/`](design-baseline/) remain behavioral and information baselines only; they are not the visual north star.

**VDG-A is complete as of 2026-07-14.** The locked Public Live Desktop visual anchor is **G1B — Global Header + Parallel Split + Structural Skeleton**. Its canonical PNG and archive remain unchanged in [`visual-direction-gate/approved/public-live-desktop/`](visual-direction-gate/approved/public-live-desktop/). G1B governs that desktop composition and its approved Arabic public copy. The completed Claude Design product family in [`visual-direction-gate/approved/full-product/`](visual-direction-gate/approved/full-product/) is the strong layout and FITWAY visual-direction reference for the full product. Its separate Analytics PNG governs occupancy-chart behavior and motion character only; the final Claude Analytics screens govern page layout.

Binding product, security, privacy, content, accessibility, and data-semantic decisions remain in force. The visual references are authorities, not a blind pixel-by-pixel ceiling: implementation may intelligently improve composition, hierarchy, spacing, typography, responsive/mobile behavior, motion, interaction, charts, tables, accessibility, and real-browser quality. Any material proposal to change a locked decision must be surfaced explicitly rather than made silently.

Design-only annotations, preview labels, demo notices, fixture values, fake owner/email values, arbitrary staff/device identities, email/password mockups, and other mockup-only content must not ship. Preserve the capacity-free public payload and approved Arabic Public Live composition. Compose English LTR naturally rather than mechanically mirroring Arabic. Implementation must correct wrapping, RTL/Bidi isolation, Western-digit number and gym-time formatting, overflow, responsive tables, mobile operational density, keyboard behavior, reduced motion, and honest loading/stale/unavailable/error semantics.

This approval does not itself authorize production implementation or Phase 4 application work. VDG-B—the real-browser visual vertical slice, screenshot comparison, correction loop, and approval—remains the next UI gate.

## Canonical detail

- Product rationale, privacy, architecture, risk, and pilot truth: [RESEARCH.md](RESEARCH.md)
- Implementation contract and Definition of Done: [SPEC.md](SPEC.md)
- Sequenced implementation phases: [PHASES.md](PHASES.md)
- Existing design, RTL, state, typography, motion, and accessibility rules: [DESIGN_GUIDE.md](DESIGN_GUIDE.md)
- Locked Public Live Desktop visual anchor and archive: [`visual-direction-gate/approved/public-live-desktop/`](visual-direction-gate/approved/public-live-desktop/)
- Final full-product Claude Design archive and Analytics chart-behavior reference: [`visual-direction-gate/approved/full-product/`](visual-direction-gate/approved/full-product/)
- Repository and service architecture: [SOL_SCAFFOLD_REVIEW.md](SOL_SCAFFOLD_REVIEW.md)
- Visual-gate rationale and stop conditions: [HANDOFF_CHATGPT_FITWAY_PHASE3_TO_VISUAL_DIRECTION_GATE.md](HANDOFF_CHATGPT_FITWAY_PHASE3_TO_VISUAL_DIRECTION_GATE.md) and [AI_FRONTEND_DESIGN_WORKFLOW.md](AI_FRONTEND_DESIGN_WORKFLOW.md)
