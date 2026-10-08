# good-css review for FITWAY (2026-10-08)

Source: https://github.com/vojtaholik/good-css at commit `e074e76a011dbadc4f0a7fbd6c661ed79deb6371`, MIT (LICENSE:1-3, "Copyright (c) 2026 Vojta Holik"). Cloned to `D:/fitway-temp/research/good-css-20261008/src`. Nothing was run, installed or interpreted.

Abbreviations: DG = `DESIGN_GUIDE.md` (r04 worktree). DS = `DESIGN-SPEC.md` of the eclipse concept. Concept CSS paths are relative to `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`. Web = `apps/web/src/index.css`.

## 1. Files read in full (bytes)
SKILL.md 4711 | references/foundations.md 9553 | interaction.md 6423 | layout.md 6970 | motion.md 6644 | scroll-and-viewport.md 7171 | show-and-hide.md 5473 | spacing-and-shape.md 4841 | text-and-media.md 6918 | LICENSE 1089 | .claude-plugin/plugin.json 505 | .claude-plugin/marketplace.json 414.
Skill total 58,704 bytes, about 15k tokens if every file is read. SKILL.md alone is about 1.2k tokens, and its description is about 75 tokens.
The repo also holds `harness/`, `deploy/`, `scripts/`, `PRACTICES.md` (95 KB, the source the references are generated from), `README.md` and `AGENTS.md`. I listed these but did not read them, and they are not part of the skill.
Plugin install: `marketplace.json` has `"source": "./"`, so the whole repo is copied. `plugin.json` is metadata only. No hooks, commands, agents or MCP are declared, so the plugin adds only the skill.

## 2. Injection and override scan
- No instruction to fetch remote content or run a script. The only code is CSS and small JS snippets meant to be written into the user's project (interaction.md:193, scroll-and-viewport.md:36).
- No prompt-injection text. The directives below are in scope for the skill but affect FITWAY's process.
  - SKILL.md:3 is a very broad trigger: "whenever you write, edit or review styles in any form ... even if the user never mentions CSS".
  - SKILL.md:50 defers to other skills: "where one disagrees with a value here, use its value". This reads as skill-over-skill precedence. It names Emil Kowalski's skills only.
  - SKILL.md:46 says to "tell the user when something you used is missing" from a target browser.
  - foundations.md:205 is a maintainer note ("Do not add these back"), and SKILL.md:42 says "Never add" three things.
- None of this overrides root policy. CLAUDE.md already says that where a skill disagrees with the root policy, the policy wins.

## 3. Authoring system in FITWAY
- Production `apps/web` is Tailwind v4 (`@import "tailwindcss"` and `@theme inline`, `packages/ui/src/styles/globals.css:1,318`) with shadcn-style components. It also has a 1,346-line hand-written `apps/web/src/index.css` (BEM-like classes, `@media` ladders at :874-:1303, logical properties). Tokens are `--fw-*` hex values with no oklch (grep count 0).
- The concept is static hand-written CSS (`style.css` 80 KB, `components.css`, `reports.css` and others). It uses `:root` hex/rgba tokens and fixed designed sizes.
- So good-css techniques would be written as plain CSS in index.css or Tailwind arbitrary properties. SKILL.md:10 allows both.
- `viewport-fit=cover` is set in neither `index.html` (both viewport metas lack it). The existing `env(safe-area-inset-*)` paddings (concept `style.css:978-980`, Web:90,145) are then inert on phones. The skill states this at scroll-and-viewport.md:218. Not verified on a device.

## 4. Rule-by-rule table
Verdicts: FITS | ALREADY DONE | CONFLICTS | NEEDS ADAPTING | N/A (no use in FITWAY).

### SKILL.md general rules (SKILL.md:16-23)
| Technique | Verdict | Reason |
| --- | --- | --- |
| Logical properties, never `mt-/pr-/top-` | ALREADY DONE, with one exception | DG:249 requires logical; the concept has 309 logical hits. Exception: DG:243 says safe-area insets use physical left/right so RTL does not swap cutouts. SKILL.md:16 "never write left/right" would break that. Concept `style.css:978-980,1033` is correct. |
| `oklch()` with `none` hue and `color-mix(in oklch)` | CONFLICTS (as a token format), FITS (for derived tints) | DG:321-357 is a hex token baseline, and DG:360 says names and values are preserved verbatim. DS:106-130 (COL-1..23) are hex and rgba, and COL-23 maps to `--fw-*`. Changing the format needs an approved phase record. Derived mixes are ok if they resolve to baseline values. The concept already uses `color-mix(in srgb)` (`components.css:444`, `reports.css:214`). The skill's `none`-hue gray point is correct but only matters once oklch is adopted. |
| One `clamp()` token for sizes that grow with the screen | CONFLICTS | DG:228-244 sets required review widths (320-1440) and bands. DG:225-226: "mobile removes or recomposes space instead of shrinking everything uniformly". DS:167-182 (TYP-3) fixes six type roles, DS:198 (SPC-1) a 4 px scale, and DS:265 (BRK-1) the designed sizes. Allowed only as a bounded value inside one band. Web:887 `clamp(68px,7vw,82px)` in the 821-1199 band is that case. |
| Every `:hover` inside `@media (hover:hover) and (pointer:fine)` | NEEDS ADAPTING | The concept has 77 `:hover` rules and gates 4 (`style.css:844`, `activity.css:139`, `picker.css:56,66`), with no `pointer:fine`. The gating idea fits, since DG:269 says hover is never the only path. `pointer:fine` tests the primary pointer, so a touch-primary tablet with a mouse loses hover. FITWAY designs a tablet band (DS:267, BRK-3). Use `(hover:hover)` only, which is what the skill says Tailwind v4 does (interaction.md:33). |
| `:focus-visible` + `outline`, never `outline:none` | ALREADY DONE (values differ) | The concept has one ring (`style.css:86`, FOC-1 DS:229, 2px chalk, 3px offset; FOC-2 inset -4px for packed controls). The skill's `max(2px,.08em)` / `.25em` / `currentColor` ring differs from FOC-1 and FOC-3 (4px clearance). The concept still has 12 `outline:none` (e.g. `style.css:217`, `components.css:460`). Each moves the ring to a child, but none is a transparent ring, and the concept has no `forced-colors` rule. Web:1340-1344 has one. |
| `:active` on everything pressable | NEEDS ADAPTING | The concept has 0 `:active` rules. DG:259 names press feedback. Add a color or background `:active`. A `scale()` press adds motion, which DS:241 (MOT-1) limits to motion that carries information. Needs a user decision. |
| Motion transitions inside `prefers-reduced-motion: no-preference`; name properties; no `ease-in` | NEEDS ADAPTING | Matches DG:260 (property-specific, no `transition:all`; grep shows 0 `transition:all` in the concept and Web). The concept instead kills motion with `animation/transition:none !important` under `reduce` and `data-motion=off` (`style.css:1327-1330`), the very pattern motion.md:19 forbids. The result is the same and the frames are verified, so there is no reason to refactor the concept. Use opt-in in new production CSS. `--fw-ease-in` is defined (`globals.css:306`) and unused. |
| `overflow:clip` instead of `hidden` | NEEDS ADAPTING | The concept has 22 `hidden` and 0 `clip`. Web:4-8 puts `overflow-x:clip` on `html` and `overflow-x:hidden` on `body`, against layout.md:195 ("not on html or body"). I did not test whether the body rule is needed. Change only per element where nothing scrolls it. Roll slots and masks (MOT-2) may rely on `hidden`. |

### foundations.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Reset: `box-sizing`, `* {min-width:0}` | ALREADY DONE / NEEDS ADAPTING | `style.css:69` has box-sizing, and `min-width:0` is used locally (49 hits). Tailwind preflight is already present. The skill itself says not to add `min-width:0` globally to an existing project (foundations.md:5). |
| Reset: `interpolate-size`, `text-wrap: pretty/balance`, `overflow-wrap` | NEEDS ADAPTING | Web:370,831 already use `balance`. `pretty` is ignored by Firefox, and `balance` changes line breaks, so every Arabic and English heading frame needs re-checking (AGENTS.md: visual acceptance is by named exact frames). |
| Reset: `font-synthesis:none` | FITS | Matches DG:123-124 (real weights 400-700, no synthetic 800/900). Every weight used must be loaded. |
| Reset: `-webkit-font-smoothing:antialiased` | NEEDS ADAPTING | It changes the weight of light text on a dark page, and Arabic has thin strokes. It is a visual change, so verify per frame. |
| Reset: `input {font-size:max(16px,1rem)}` | CONFLICTS | DS:180 (TYP-3) sets field text at 15 px. The skill's reason is real (iOS Safari zooms on a focused input below 16px, from my own knowledge, unverified here). Raise it as a decision for the user, not a silent change. |
| Reset: `touch-action:manipulation`, `user-select:none` on controls | FITS | Concept already has `touch-action` on the plot (`style.css:783`). The tap-highlight removal makes `:active` mandatory (see above). |
| Reset: `scrollbar-gutter:stable`, `svh` for documents | ALREADY DONE | `reports.css:11`; DG:242 and Web:22-33 use the `vh`, `svh`, `dvh` fallback chain, which is stronger than the skill's bare `100svh`. |
| Logical properties entry (4-value shorthands stay physical) | ALREADY DONE | This is the right RTL warning. A 4-value `padding` is physical order, so asymmetric inline values do not flip. Web:145 and `access.css:200-201` (`[dir]` selectors with physical `padding-left/right`) are the places where it matters. Safe-area uses are the DG:243 exception. |
| OKLCH color | see SKILL.md row | Same verdict. |
| One token set via `light-dark()` | N/A | DG:323 is `color-scheme: dark`, and the concept is dark-only. |
| Fluid `clamp()` with the 2.5x WCAG 1.4.4 limit | CONFLICTS | Same as the SKILL.md row. The 2.5x check is a sound a11y rule if clamp is ever used for font size (DG:306, 200% zoom). |
| One fluid scale for type and space (`pow()`, derived steps) | CONFLICTS | Generates non-4 px sizes. Contradicts DS:167-182 (six roles), DS:198 (4 px scale) and DG:225-226. |
| Left out on purpose (no `text-box` on `*`, no `optimizeLegibility`, no `display:contents` reset) | FITS | The guidance to avoid them is sound. |

### interaction.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| One focus ring | ALREADY DONE | See above. The `currentColor` caveat and the "transparent, never none" rule fit; FITWAY uses chalk. |
| Hover only where hover exists | NEEDS ADAPTING | See above (`hover:hover` only). |
| Press feedback `scale(.97)` | NEEDS ADAPTING | See above. The transform is motion and needs the user. |
| Hit area larger than visual (`::after`, 44 px) | FITS | DG:274 sets 44x44. The concept uses real 44 px boxes (`style.css:634,700,825`; DS probes). It helps icon-only controls in production. The ring sits on the visual box, so check FOC-3's 4 px clearance. It cannot be combined with the card-link `::after`. |
| Whole card clickable from one link | NEEDS ADAPTING | Not searched for in the concept. Use FOC-1's ring and offset instead of `2px` at `2px`. Text under the overlay cannot be selected (interaction.md:117), which is a poor fit for copyable record rows. |
| `:has()` for parent and page state | ALREADY DONE | Concept `style.css:1010` and `reports.css:26` use `html:has(> body...)`. `html:has(dialog:modal)` scroll lock only if the dialogs are native. The concept's are custom (MOT-9). |
| `:user-invalid` / `:user-valid` | CONFLICTS (valid half), FITS (invalid half) | `:user-valid` with a success color contradicts DG:108-109 (green means verified live only). `:user-invalid` styling with `--err` (COL-18, DS:125) fits. DG:279-280 still requires associated, announced messages. The skill agrees that color alone is not enough. |
| Textarea `field-sizing:content` | ALREADY DONE | `access.css:214`, with min and max height and `resize:none`. The animated wrapper variant is optional and adds motion. |

### layout.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Content grid with breakouts | N/A | A CMS-width technique. FITWAY pages are designed compositions (rail + content frame, DS:261-277). |
| Intrinsic grid `auto-fit minmax()` | CONFLICTS for dashboards, ALREADY DONE for sheets | DS:269 (BRK-5) fixes four cards then two by two below 1200 px, a designed column count. `components.css:64,74,575` use `auto-fill` for the component sheet only. |
| Subgrid rows across cards | FITS | The concept uses 0 subgrid and aligns by fixed `min-height` (`style.css:738`). A candidate to replace such heights in new work. It would change frames, so re-verify. |
| Sidebar that wraps (`flex-grow:999`) | CONFLICTS for the rail, FITS for small pairs | The rail is a designed slim 80 px rail with explicit breakpoints (DS:265-268, 274). A share-based wrap point is not a designed size. Fine for input+button or a media pair. |
| Container queries and `cqi` | ALREADY DONE | Concept `style.css:385`, `components.css:604`, `reports.css:69`, and light sizing in `cqw/cqh` (LGT-2, DS:150). |
| Stack layers with grid | FITS | `place-self: start end` is logical, so it is RTL-safe. The concept uses absolute positioning with physical `left/top` in places (`components.css:389`, `reports.css:222`). |
| Safe alignment `safe center` | FITS | Suits the tab strip that scrolls inside a region (DG:239). Symmetric, so RTL-safe. |
| `overflow:clip` over `hidden` | NEEDS ADAPTING | See above. |

### spacing-and-shape.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Section spacing by neighbours (`:has(+ .x)`) | N/A | Targets reorderable CMS sections. FITWAY sections are fixed (DS:202, SPC-5). |
| Space set by the parent (`gap`, `* + *`) | ALREADY DONE | `gap` is used throughout (SPC-5/6, DS:202-203). Fits. |
| Push one item with an auto margin | FITS | `margin-inline-start:auto` is RTL-safe. |
| Concentric nested radius | ALREADY DONE (fixed set) | RAD-1 (DS:210) fixes five radii and already derives the phone bar's inner radius as "24 less the bar's 8 inset". Do not derive free radii. |

### text-and-media.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Long text: wrap, truncate, clamp | NEEDS ADAPTING | DG:255 forbids truncating critical state, action or error copy and requires 30-40% expansion. Truncate only non-critical text. The skill's own rule (text-and-media.md:33) agrees. `overflow:clip` with ellipsis is untested in Firefox (text-and-media.md:34), so keep `hidden` for the clamp. |
| Image box (`aspect-ratio`, `object-fit`) | N/A | The product stores no visitor images (AGENTS.md "Locked decisions and safety"). No uploaded images on Owner screens found. |
| Tabular numbers | ALREADY DONE | DG:127-128; DS:189 (NUM-2). The skill lacks the `<bdi>` isolation FITWAY needs for numbers in Arabic (DG:129; DS:190 NUM-3). |
| `text-box: trim-both cap alphabetic` on labels | CONFLICTS (unverified) | Not tested on Arabic. Cap and alphabetic metrics suit Latin. Arabic tall marks and descenders extend past them (the DS already adds 3 px for them in MOT-14). Controls have fixed 44 px heights (DG:274), so there is nothing to gain. Firefox 154 only. |
| Icon sized by text (`1cap`, `1lh`, never px) | CONFLICTS | ICO-2/3 (DS:219-221) fix icon sizes: 16 px beside labels, 13-22 elsewhere. The `flex:none` and `viewBox` rules do fit. `align-items:baseline` with an Arabic label is unverified. |

### motion.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Opt-in motion | NEEDS ADAPTING | See the SKILL.md row. "Fades are not motion" clashes with DS:241 (MOT-1) "no glyph ever changes opacity". |
| Motion tokens: ease-out `(.23,1,.32,1)`, ease-in-out `(.77,0,.175,1)`; durations 100-500 ms | CONFLICTS | DG:355 locks `--fw-ease-out: cubic-bezier(0,0,.2,1)` (DG:360 "preserved verbatim"), with 120/180 ms durations (DG:353-354). The concept has its own curves and times: DS:242 (280 ms `(.25,1,.5,1)`), DS:248 (rail), DS:249 (dialog 340/220). The 300 ms ceiling is broken by DS:245 (about 400 ms) and DS:250 (1171 ms intro). Keep the skill's rules (two named curves, named properties, no `ease-in`), not its values. |
| Transition a custom property with `@property` | NEEDS ADAPTING | Fine for non-data visuals. It must never drive a displayed number: DG:264 says update a number atomically. |
| Shadow fade with two pseudo-layers | N/A | DS:141 (SRF-6): cards carry no shadow. It also needs `::after`, which clashes with the hit-area and card-link entries. |
| Cross-document view transitions | CONFLICTS | MOT-1 (DS:241): the page is complete at first paint and no glyph changes opacity. A crossfade fades every glyph. Production is an SPA, so it does not apply there anyway. |
| Indicator sliding via anchor positioning | NEEDS ADAPTING | Candidate for the segmented control or tab bar. `inset-inline-start: anchor(start)` is logical, but RTL behaviour is untested. It is new motion, which DS:258 (MOT-18, instant by choice) and MOT-1 make a user decision. Firefox places it without sliding. |

### show-and-hide.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Enter/exit from `display:none` (`@starting-style`) | CONFLICTS (concept), NEEDS ADAPTING (production) | The concept's dialogs and panels have designed choreography (MOT-9 DS:249, MOT-12 DS:252), and MOT-1 forbids glyph opacity changes. The skill's version fades the whole dialog. In Safari 27 native dialogs close at once (show-and-hide.md:60). |
| Popover anchored (`position-area: block-end span-inline-end`) | FITS | Logical, so it flips correctly in RTL. Safari 26, Firefox 147. Concept tooltips and panels are custom (MOT-5, MOT-12). |
| Accordion via `::details-content` | FITS (low priority) | Chrome-only animation. Rules are sound. The status details have their own unroll (MOT-12). |
| Reveal with `clip-path` | ALREADY DONE | MOT-8/MOT-12 (DS:248, 252) already unroll panels with a clip. |

### scroll-and-viewport.md
| Technique | Verdict | Reason |
| --- | --- | --- |
| Carousel on native scroll | N/A (and RTL-broken as written) | No carousel in FITWAY. The snippet (scroll-and-viewport.md:34-55) uses `scrollLeft <= 1` and hardcoded arrow glyphs. In RTL `scrollLeft` is zero or negative, and DG:250 says directional arrows mirror. Adapt if ever used. |
| Scroll area between header and footer | ALREADY DONE | `reports.css:324`, `components.css:535`, and `reports.css:496` (`100dvh`). |
| Styles only when a scroller overflows (`animation-timeline: scroll()`) | NEEDS ADAPTING | Fits DG:239 (visible affordance on a scrolling strip). The mask uses `to right`, which is physical. In RTL the start edge is on the right, so the two-sided variant fades the wrong end. Needs a `:dir(rtl)` flip. No Firefox support. |
| Anchor targets (`scroll-padding-block-start`) | ALREADY DONE | `style.css:1010`, `reports.css:26`; DS:235 (FOC-7). |
| No rubber-band (`overscroll-behavior-y:none` on html) | FITS | Suits a dashboard with fixed rail and bar. The skill keeps `auto` for coarse pointers. |
| Content clear of the notch (`env(safe-area-inset-*)`) | ALREADY DONE (inert) | Only block insets in the skill's examples, so they do not conflict with DG:243. `viewport-fit=cover` is missing in both `index.html` files (see section 3). |

## 5. Questions asked
- **Does the description trigger on every CSS edit?** Yes, by design (SKILL.md:3): "write, edit or review styles in any form, including plain CSS, Tailwind classes, StyleX, CSS-in-JS and inline styles", and "even if the user never mentions CSS". That is about 75 tokens always in context if installed, then about 1.2k for SKILL.md and up to 13k for the references. It cuts against AGENTS.md "Working agreements" (one broad design skill, Impeccable; do not stack competing design skills). good-css is a technique list, not a taste skill, but it still pushes defaults (oklch, clamp, scale presses) that conflict with FITWAY's locked tokens. If adopted, keep it manual/slash-only, in line with the existing practice (MEMORY: 14 design skills slash-only). Do not put it in tracked `.claude/skills/` without the coordinator, since CLAUDE.md lists only Impeccable and ux-araby there.
- **Does the motion deference to Emil Kowalski's skills matter?** Only slightly. SKILL.md:50 names `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities` and `mobile-native`. On this machine I found only `improve-animations` and `review-animations` (in `~/.claude/skills` and `~/.agents/skills`). "Where one disagrees with a value here, use its value" would let `improve-animations` override good-css, but FITWAY's DG section 10 and DS section 1.10 override both (CLAUDE.md: root policy wins). `improve-animations` is an audit and roadmap skill that does not implement, so the deference is mostly moot. Without the others installed the fallback is "add no motion beyond what an entry or the task calls for". That fits MOT-1.

## 6. Bottom line
- Safe to use as reference for new production CSS: `:focus-visible` rules (already in the concept), `:user-invalid` (invalid half only), subgrid, hit areas, `safe center`, overflow-fade (with RTL flip), anchored popovers, `field-sizing`.
- Do not apply: global oklch tokens, fluid type and space scale, `pointer:fine` gating, skill motion tokens, `@starting-style` dialogs, view transitions, `text-box` on Arabic labels, `max(16px)` input font without a user decision, `:user-valid` green.
- Findings independent of adoption: neither `index.html` sets `viewport-fit=cover`, so safe-area paddings are inert; 73 of 77 concept `:hover` lines are ungated; the concept has 0 `:active` rules.

## 7. Gaps
- Did not render anything; verdicts are from reading rules against files. Arabic behaviour of `text-box`, `1cap` icons, anchor-positioned indicators and the scroll-fade mask is a hypothesis, not tested.
- iOS 16px-zoom claim and body `overflow-x:hidden` sticky side effects come from general knowledge, not from files read.
- Did not read the skill repo's `AGENTS.md`, `README.md` or `PRACTICES.md`.
- Did not search the concept for a clickable-card pattern.
