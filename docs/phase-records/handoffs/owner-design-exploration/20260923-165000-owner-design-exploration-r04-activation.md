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
