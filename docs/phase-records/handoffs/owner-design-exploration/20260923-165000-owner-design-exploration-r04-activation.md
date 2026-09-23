# owner-design-exploration-r04 — early concept activation

- User request on 2026-09-23: start a new Owner design task from the root policy, the current project state, and the latest r03 rejection handoff, and create and activate a fresh task packet under repository policy.
- The user asked the coordinating session to design the concept itself and not to delegate the design to subagents. The concept should focus on the overall visual direction and impression. Minor issues are deliberately left for after the user's choice.
- Color and chart direction: use FITWAY red, and represent the data with a smooth, continuous curve. The supplied image `design-research/owner-visual-preferences/20260923-smooth-red-line-reference.png` is a reference for the feel of the line only, not a chart to copy.
- Show the concept early; keep it exploratory; change no production state.
- Predecessor: `owner-design-exploration-r03` closed `NEEDS_HUMAN` after the user rejected all four r03 directions, chiefly because their color did not read as the desired FITWAY red. Its terminal record and rejection handoff name the changed scope for this attempt: one self-designed direction, FITWAY red, a smooth continuous line, and an early check. No r03 composition, palette, direction count, or model assignment carries forward.
- This activation authorizes a concept artifact only, on `codex/owner-redesign-r04` from base `e5d5027ab67966c38612dd973f2f4bcb85f3441b`. Production, Paper, canonicals, tokens, and Owner composition authority are unchanged, and no direction is selected.

## Design context and rendering route

`pnpm check:design-context` passed on 2026-09-23 using installed Impeccable 4.0.0. It resolved the FITWAY `PRODUCT.md` and `DESIGN.md` routers from the repo root and `apps/web`. Doctor reported one intended workspace-inheritance mention. This is routing evidence, not visual acceptance.

The concept is a self-contained static artifact under `design-research/owner-composition-exploration-r04/` with synthetic data. Repository Playwright renders exact EN/AR frames at 1440×900 and 390×844 for personal inspection. The artifact opens no authenticated demo, and no credentials are used or recorded.

## Activation validation

`node scripts/show-agent-context.mjs --milestone owner-design-exploration-r04` reported milestone and packet status `READY`, the expected base commit and handoff, and packet SHA-256 `8eb394aac6f6e2378fede50928d1fd87b692050f279760e5d5fbe367667bd05b`. A first draft listed the r03 rejection handoff as a required source; `check-agent-context` rejected it as a provenance path, so it is now reached only through the named predecessor pointer. `node scripts/check-agent-context.mjs` then passed in active routing mode with Git tracking checks; its warnings were the existing historical pointer exceptions. The host-direct `C:/Program Files/nodejs/node.exe scripts/verify-repository.mjs` passed with one active and 110 archived milestones. `git diff --cached --check` passed.

## Next transition

Read the routed sources in order, design and render the concept, inspect the exact frames personally, and present it to the user for choose, revise, or reject. Exact resume: `pnpm context:show -- --milestone owner-design-exploration-r04`.

## Early concept delivery (2026-09-23 17:42 +03:00)

The coordinating session designed one direction itself, without design delegation: **Redline**, at `design-research/owner-composition-exploration-r04/`. Its README names the world and thesis. The day is one smooth, continuous FITWAY-red curve on an open dark stage, and the peak, latest reading, and still-ahead time are labeled on the line itself. The curve is a shape-preserving cubic through every observation with no overshoot. Missing, delayed, and not-yet-reached time stay visibly distinct from zero. The slice covers the shared navigation (a glass rail on desktop and a sticky bar with a scroll-snapped strip on mobile), Daily with live, missing-stretch, and delayed previews, and the Activity Log. The other four sections are named placeholders. All data is synthetic, and the artifact is labeled exploration only.

`node design-research/owner-composition-exploration-r04/concept/capture.mjs` rendered the exact frames under `concept/evidence/` over a loopback server. Every frame loaded Cairo and reported zero horizontal page overflow and no page or console errors. The coordinator personally inspected `daily-{en,ar}-1440x900`, `daily-{en,ar}-390x844`, `activity-en-1440x900`, `activity-ar-1440x900`, `activity-en-390x844`, `activity-ar-390x844`, `daily-en-1440x900-gap`, `daily-ar-390x844-delayed`, and `daily-en-1440x900-selected`. One repair round followed the first inspection. It moved the latest figure into the chart's empty upper region on wide screens and strengthened the red fill. It also resolved mobile label collisions, aligned Activity Log columns across day groups, and put mobile Activity Log records ahead of a filter toggle. The keyboard-selected frame confirmed slider value text and the inspection readout. A browser motion probe confirmed the one-time line draw, the section cross-fade with the sliding indicator, and immediate final rendering under reduced motion. The page also opens directly from disk with Cairo loaded. Biome check passed after formatting.

The user explicitly deferred minor polish until after a direction choice. Known minor items are listed in the README. The 320px/200% reflow, tablet, accessibility, and independent perceptual gates have not run, so this is no gate PASS. The milestone is `IN_PROGRESS` with the human decision pending: choose, revise, or reject. Exact resume: `pnpm context:show -- --milestone owner-design-exploration-r04`.


## Human scope clarification (2026-09-23)

The user likes the Redline concept but is not choosing it now and wants to continue discovering visual
directions. Redline remains intact and unselected. Red and black are the broad FITWAY identity
anchor, and Cairo is not wanted for this exploration. The user did not ask the coordinating session
to define a new visual shape. No exact shades, proportions, background, typography, materials,
atmosphere, composition, chart form, or number of directions is prescribed. The user will direct
whether and how exploration continues. This human decision supersedes the appearance-only
restrictions in ADR-009 for concept-only Owner exploration and removes the fixed two-or-three
direction requirement from WORKFLOW. It does not change the production baseline, product semantics,
data contracts, or Owner composition authority; no concept is selected or promoted.

Only the concept is exploratory. Product/Spec behavior, honest data, privacy, security,
accessibility, Western digits, and Arabic RTL / English LTR remain binding. Production styling,
tokens, canonicals, and authority are unchanged unless the user makes a separate promotion
decision. RESEARCH.md is the product context for FITWAY's gym and Owner use cases; it does not
prescribe a visual style or Arabic typeface.

## Design-context check clarification

The sandboxed pnpm check:design-context invocation failed because Node could not spawn child
processes (EPERM). The installed Impeccable 4.0.0 helper and FITWAY routes remain available; the
same check passed when run in the authorized host context. The earlier recorded PASS and the
sandbox failure reflect different process-launch permissions, not a missing or changed Impeccable
installation. The required check already reran successfully in the authorized host context.

## Scoped concept authority confirmation (2026-09-23)

The user explicitly approved a Product/Spec text change that separates the shipped dark-only,
Cairo-based v1 product from concept-only Owner exploration. Owner concepts may try light or dark
treatments and typography other than Cairo. This changes no production style, behavior, data,
privacy, security, accessibility, canonical, Paper, manifest, or visual-authority state. The
earlier "Next transition" instruction to render Redline is historical: Redline was delivered and
remains unselected. The policy-only packet governs until a further activation is recorded.
