# FITWAY Public Live — Final Refinement Handoff

## Session status

- Worktree: `D:\Projects\fitway-visual-lab`
- Branch: `explore/public-live-visual-directions`
- Worktree commit at audit time: `1711e6e`
- Main worktree: `D:\Projects\fitway` on `main` at `1711e6e`
- Current implementation is an isolated, untracked visual exploration. Production source remains untouched.
- No fixes from the audit have been implemented. No commit or push has occurred.

## Newly approved governing decision

**Cancel Aurora entirely for the final direction.**

The next session must remove Aurora/WebGL from the active master preview and replace it with a static atmospheric background that preserves the same emotional register:

- dark, premium, and athletic;
- deep oxblood and restrained FITWAY-red lighting;
- soft depth behind the board;
- secondary to the interface with stable readability;
- no animation, canvas, WebGL, OGL, requestAnimationFrame loop, or reduced-motion branch;
- the large FITWAY watermark remains at page-background level behind the board, never inside the board.

Update the active preview, documentation, dependency list, tests, and final screenshot matrix so Aurora `on/off`, motion recordings, DPR tests, and reduced-motion complexity are no longer part of the final direction. Existing Aurora artifacts remain historical audit evidence until superseded.

## Locked product and data rules

- Never display public capacity, total capacity, capacity-derived percentages, or percentage-full language.
- Do not display `شخصًا تقريبًا`, “approximately people,” “around people,” or an English equivalent after the number.
- Crowd level is the primary metric; approximate count is secondary.
- Preserve `مستوى الازدحام` / `متوسط` and `العدد التقريبي` / `37` in Arabic, with Western digits and bidi isolation.
- Preserve the continuous cumulative crowd signal: reached lower levels, bright current range and cap, muted higher pending levels.
- Preserve correct progression and category order in both RTL and LTR.
- Preserve the accepted desktop identity, dominant board shell, near-black/graphite palette, FITWAY reds, red edge, restrained green live state, and premium athletic character.
- Do not reopen accepted product decisions or turn this focused refinement into a redesign.

## Relevant source and authority files

### Active exploration

- `visual-exploration/public-live/signal-master.css` — shared master board, responsive, typography, signal, and RTL/LTR styling.
- `visual-exploration/public-live/signal-master.html` — static master reference.
- `visual-exploration/public-live/index.html` — exploration index.
- `visual-exploration/public-live/capture.spec.ts` — current 11-test visual/runtime suite; must be revised after Aurora removal.
- `visual-exploration/public-live/playwright.visual.config.ts` — Chromium visual configuration and preview server.
- `visual-exploration/public-live/aurora-preview/README.md`
- `visual-exploration/public-live/aurora-preview/package.json`
- `visual-exploration/public-live/aurora-preview/pnpm-lock.yaml`
- `visual-exploration/public-live/aurora-preview/vite.config.js`
- `visual-exploration/public-live/aurora-preview/index.html`
- `visual-exploration/public-live/aurora-preview/src/main.jsx`
- `visual-exploration/public-live/aurora-preview/src/Preview.jsx`
- `visual-exploration/public-live/aurora-preview/src/preview.css`
- `visual-exploration/public-live/aurora-preview/src/Aurora.jsx` — remove from the active final preview.
- `visual-exploration/public-live/aurora-preview/src/Aurora.css` — remove from the active final preview.
- `apps/web/public/fonts/cairo-{arabic,latin}-{400,500,600,700}-normal.woff2` — existing font assets; production files must not be modified for this exploration.

### Binding visual/product references

- `AGENTS.md`
- `DESIGN_GUIDE.md`, especially the G1B Public Live composition section.
- `FITWAY_PRODUCT.md`
- `visual-direction-gate/approved/public-live-desktop/README.md`
- `visual-direction-gate/approved/public-live-desktop/FITWAY_PUBLIC_LIVE_APPROVED_G1B.png`
- `visual-direction-gate/approved/full-product/README.md`

### Latest review artifacts

Folder: `visual-exploration/public-live/screenshots/signal-master-aurora/`

- `signal-master-aurora-on-ar-desktop-1440x900.png`
- `signal-master-aurora-on-en-desktop-1440x900.png`
- `signal-master-aurora-on-ar-mobile-390x844.png`
- `signal-master-aurora-on-en-mobile-390x844.png`
- `signal-master-aurora-off-ar-desktop-1440x900.png`
- `signal-master-aurora-off-en-desktop-1440x900.png`
- `signal-master-aurora-off-ar-mobile-390x844.png`
- `signal-master-aurora-off-en-mobile-390x844.png`
- `signal-master-aurora-motion.webm`

These were generated on 2026-07-15. Stills emulate reduced motion. The WebM records full motion. After Aurora cancellation, replace the active approval set with one static AR/EN × desktop/mobile matrix; do not retain `on/off` as final states.

## Visually approved — keep locked

- The 1440×900 desktop composition and 1296×625 panoramic board proportions.
- Disciplined page gutters, header/board alignment, strong negative space, and asymmetric metric hierarchy.
- Board shell: radius, subtle border, restrained internal gradient/depth, red edge, and premium shadow character.
- Near-black field, graphite surfaces, oxblood/FITWAY-red accents, subdued watermark, and restrained green live indicator.
- Desktop typography scale: micro-label → decisive crowd state → secondary tabular count.
- Signal semantics: dark-red completed range, bright current range, white current cap, charcoal future range, category labels, and current-reading legend.
- Correct mirrored signal direction and grouping in Arabic and English.
- Approved header placement and Arabic FITWAY lockup behavior from G1B.
- Native controls, visible focus styles, skip link visibility, semantic landmarks, `<bdi>` around `37`, and consolidated accessible signal description.
- No horizontal overflow at tested widths down to 320px.

## Complete audit findings

| Severity | Issue and likely cause | Affected | Required correction strategy |
|---|---|---|---|
| **Critical** | **Breakpoint cliff / content collision.** Only one structural breakpoint exists at 720px. Above it, 90–92px title type, a fixed 220px count column, and a 64px gap remain. English overlaps the count at 722 and 768px; Arabic overlaps near 721px. | Narrow desktop/tablet; AR + EN, worse EN | Add an intermediate, content-driven recomposition. Fluidly reduce or restack the split before collision. Validate every width across 721–820px, not only endpoint screenshots. |
| **Important** | **Broken mobile metric grouping / hierarchy inversion / scan-path discontinuity.** Crowd state is 60/62px while secondary `37` is 66px. Crowd uses label-over-value but count uses label-beside-value with weak baseline grouping. | Mobile; AR + EN | Author two explicit mobile metric groups with one consistent label/value grammar. Keep crowd level dominant and establish deliberate shared logical edges or baselines. |
| **Important** | **Vestigial separator / ambiguous affordance.** The desktop count divider becomes a tiny isolated red tick below the mobile headline and resembles a cursor/error marker. | Mobile; AR + EN | Remove it in the stacked layout or integrate it into an unmistakable divider/count-group boundary. |
| **Important** | **Uneven vertical rhythm / local density imbalance.** Metrics, rule, chart, and freshness compress in the middle while other card areas retain space. The mobile shell itself is sound. | Mobile; AR + EN | Redistribute existing height toward metric separation and chart/freshness transitions. Do not solve by shrinking type further or merely making the card taller. |
| **Important** | **Microtype legibility and contrast.** Signal captions are 11px desktop, 9px at 390px, and 8px below 370px. `#777376` is approximately 4.07–4.21:1 against card surfaces, below the 4.5:1 normal-text threshold. | All; worst on mobile; AR + EN | Raise contrast and maintain a credible type floor. Simplify persistent mobile category labels if necessary rather than forcing four labels into 8px type. |
| **Important** | **Freshness is semantically under-emphasized.** Mobile freshness facts read as decorative microcopy and are crowded into one quiet line, especially in Arabic. | Mobile; AR + EN, slightly worse AR | Re-group into a clearer one- or two-line unit with improved spacing and emphasis while remaining subordinate to the primary data. |
| **Important** | **Arabic optical alignment / glyph-sidebearing mismatch.** CSS edges for `مستوى الازدحام` and `متوسط` are mathematically identical; visible ink edges differ because of sidebearings, display scale/weight, and negative Arabic tracking. | Arabic desktop + mobile | Preserve the logical grid. Calibrate Arabic display tracking and apply a small ink-level compensation to the display value only; do not move the entire hero column. |
| **Important** | **Aurora renderer lifecycle instability.** A new `colorStops` array causes WebGL teardown/recreation on language or motion changes; confirmed live by canvas replacement. | Current Aurora preview; all variants | **Superseded by the approved Aurora cancellation:** remove Aurora/WebGL/OGL and the renderer lifecycle entirely. |
| **Important** | **DPR-space mismatch.** WebGL drawing-buffer DPR and shader CSS resolution differ, producing device-dependent Aurora composition. | Current Aurora preview; high-DPR devices | **Superseded by Aurora cancellation:** no canvas or shader remains in the final preview. |
| **Important** | **Continuous GPU/battery cost.** Full-viewport RAF, `preserveDrawingBuffer`, and no visibility pause are inappropriate for the final static direction. | Current Aurora preview; mobile most affected | **Superseded by Aurora cancellation:** use CSS-only static atmospheric lighting with no renderer, animation, or reduced-motion state. |
| **Important** | **RTL safe-area mapping error.** Physical left/right safe-area values are passed into logical `padding-inline`, swapping asymmetric insets in RTL. | Arabic mobile, especially landscape/notched devices | Use physical safe-area padding or direction-aware logical mapping; test asymmetric insets. |
| **Minor** | **Missing exact 500 font face registration.** UI requests weight 500 but CSS registers only 400/600/700 despite an existing 500 asset. | All; AR + EN | Register the real 500 face/subsets and verify metrics before applying optical offsets. |
| **Minor** | **Directional rail-lighting mismatch.** Rail position mirrors correctly, but a fixed positive-x shadow points outward and is clipped in RTL, making Arabic slightly flatter. | Arabic desktop | Use direction-aware or symmetric/inset illumination while preserving the approved rail position. |
| **Minor** | **Skip-link focus transfer and live announcements.** Activating the skip link changes the hash but leaves Chromium focus on `<body>`. Dynamic status/freshness updates have no restrained live region. | All; accessibility | Give the main target programmatic focus behavior. Announce only concise changed status/current reading with a polite live region; do not announce the entire chart each poll. |
| **Minor** | **Interaction motion lacks temporal continuity.** Brand hover and locale-control visual changes snap even though active deformation exists. | All; AR + EN | Add a short, property-specific ease-out transition. The final background remains fully static; do not reintroduce motion complexity. |
| **Minor** | **Legacy viewport unit.** Root uses `100vh`, which can react poorly to mobile browser chrome. | Mobile; AR + EN | Use a modern dynamic viewport strategy with a compatible fallback. |

## Static-background implementation boundaries

- Prefer layered CSS radial/linear gradients and restrained pseudo-elements in `preview.css`/shared background styling.
- Preserve a dark base and soft oxblood/red illumination behind, not over, the data board.
- Avoid bright hotspots behind low-contrast text and avoid turning the board itself red.
- Keep the lighting composition stable in AR and EN unless a direction-aware variation demonstrably improves balance without changing identity.
- Keep the watermark as `.page-watermark` at page/stage level behind `.occupancy-stage`.
- Remove the `aurora` query-state concept, `data-aurora`, `data-motion`, canvas component, OGL dependency, Aurora documentation, animation test, motion recording test, and on/off screenshot loops from the active final workflow.
- Preserve static page readability without relying on `prefers-reduced-motion`; no motion should exist to reduce.

## Current preview and validation

### Current preview (before final refinement)

```powershell
pnpm install --dir visual-exploration/public-live/aurora-preview --ignore-workspace
pnpm --dir visual-exploration/public-live/aurora-preview dev
```

Current base URL: `http://127.0.0.1:4178/visual-exploration/public-live/aurora-preview/index.html`

- English/current Aurora form: `?lang=en&aurora=on`
- Arabic/current Aurora form: `?lang=ar&aurora=on`
- `aurora=off` currently disables the canvas.

After refinement, keep only the locale state (`?lang=en` / `?lang=ar`) or an equivalent simple preview route. Remove Aurora state semantics.

### Existing visual suite

```powershell
pnpm exec playwright test --config=visual-exploration/public-live/playwright.visual.config.ts --list
pnpm exec playwright test --config=visual-exploration/public-live/playwright.visual.config.ts
```

The second command currently overwrites the Aurora screenshot set and motion WebM. Revise `capture.spec.ts` first so the final suite captures only static AR/EN desktop and mobile outputs.

Required final validation matrix:

- AR + EN at 1440×900 and 390×844.
- Intermediate widths at minimum: 721, 768, 820, 1024, and 1200px.
- Narrow mobile: 320 and 360px; confirm no horizontal overflow and acceptable vertical flow.
- RTL/LTR progression, count isolation, keyboard locale switching, focus visibility, skip-link behavior, and accessible signal name.
- Contrast verification for all signal captions and metadata.
- Asymmetric safe-area simulation for RTL and LTR.
- Confirm no `canvas`, WebGL context, OGL import/dependency, RAF loop, Aurora query state, motion recording, or reduced-motion-specific branch remains.
- Confirm the static background and board geometry do not change between locales.

Useful repository checks after implementation:

```powershell
git diff --check
git status --short
pnpm check-types
pnpm -r test
```

## Suggested skills for the next session

- Use at most one broad design/taste skill; `high-end-visual-design` is the best fit for preserving premium static depth without redesigning the interface.
- Use `fixing-accessibility` for contrast, skip-link focus, live-region, and keyboard verification.
- Use `vercel-react-best-practices` when simplifying the preview and removing obsolete renderer state/dependencies.
- Use `playwright` plus the repository visual suite for live inspection and the responsive matrix.
- Use `12-principles-of-animation` only for the small interactive hover/press transition; the approved background must remain static.

## Git and safety handoff

At handoff creation, `git status --short` showed only:

```text
?? visual-exploration/
```

The exploration directory, including this handoff, is untracked. No tracked production file has been modified. Do not commit, push, or alter production files without explicit approval. Preserve unrelated user work and stop after the focused final-refinement implementation and verification for review.
