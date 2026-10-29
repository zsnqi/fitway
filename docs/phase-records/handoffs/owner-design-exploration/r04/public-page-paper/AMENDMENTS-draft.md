# The public page's amendments to FITWAY_PRODUCT.md, DESIGN_GUIDE.md and SPEC.md, as proposed

> **Draft for the user's acceptance**, amendment by amendment (owner-design-exploration-r04 DECISIONS items 90 and
> 96 (2)). Drafted by `sonnet-researcher` (2026-10-28) from item 90 and the line sort
> `D:/fitway-temp/owner-r04-public-rules-sort/REPORT.md`; the coordinator reproduced S:357, S:557, G:264, P:20 and
> `packages/api/src/public/payload-builder.ts:126`. Line numbers are at `9db242bb`. P = `FITWAY_PRODUCT.md`,
> G = `DESIGN_GUIDE.md`, S = `SPEC.md`, E = Eclipse `DESIGN-SPEC.md`. Nothing here is applied before the user accepts it.

The pattern is ADR-009's: the shipped page keeps its rules until a redesign is promoted; the Public concept is not
bound by the old look; behavior, privacy and accessibility rules stay.

## P: FITWAY_PRODUCT.md

**P-1 (P:30), the order's fourth item.** Now: "4. What does the continuous crowd signal show?" Proposed: "4. What does
the level mark show?" Rests on item 90, "the level mark that replaces the 28 bars"; the order is unchanged. Weakens: no.

**P-2 (P:40-41), the states.** Now: Fresh "…continuous 28-bar crowd signal…"; Stale "…the band and crowd signal remain
only as visibly qualified last-known context." Proposed: Fresh "…band, approximate count, level mark, and last-updated
time"; Stale "…the band and level mark remain only as visibly qualified last-known context, and the last update shows
as an absolute time with its age." Rests on item 90, "absolute with its age when stale". Weakens: no.

**P-3 (P:58), type and the concept's scope.** Now: "Cairo is self-hosted … These appearance rules do not prescribe
concept-only Owner exploration under the named human decision…". Proposed: keep the Cairo sentence as the shipped rule
and extend the last: "…concept-only Owner exploration, nor the Public redesign under ADR-010 (until promoted, the
shipped page keeps Cairo). The Public redesign sets its type in Readex Pro, self-hosted, at real weights only (E TYP-1:
400 and 500), as the Owner concept does, and stays dark-only." Rests on item 90, "the public page in Eclipse's style,
built from the same sheet". Weakens: for the concept only; guards: self-hosted, no synthetic weights, dark-only, no
theme option, production unchanged.

**P-4 (P:68), the baseline.** Now: "…uses a continuous cumulative 28-bar public crowd signal, makes crowd level dominant
over the approximate count, uses a static blurred oxblood/FITWAY-red atmosphere … The page background and live data do
not animate." Proposed: the sentence stays for the shipped page, and: "The Public redesign keeps crowd level dominant
over the approximate count and the 320–1440 matrix; replaces the 28 bars with a level mark chosen by eye in its design
round and the oxblood atmosphere with Eclipse's static lights; and lets digits roll only when a new live reading
arrives, never on opening, never while stale or closed, never under reduced motion. The lights do not animate." Rests
on item 90's digit-roll rule. Weakens: yes ("live data do not animate"); guards: P:60's reduced motion, the canvas /
WebGL / rAF / video ban, one announcement of the final value (G-8), the static atmosphere kept.

**P-5 (P:64, P:70), the process's scope.** After each "Owner exploration" add "and the Public redesign authorized by
ADR-010 and a named human decision (owner-design-exploration-r04 DECISIONS item 90)". Weakens: no.

**P-6 (P:20), controls.** Now: "It must not expose controls, operational diagnostics, member identity, images, video, or
tracking identifiers." Proposed: "It must not expose operational controls, operational diagnostics, member identity,
images, video, or tracking identifiers. Its only controls are the language switch and, in the error state only, one
retry action." Rests on item 90 P5. Weakens: no; today's line contradicts P:44's retry and S:123's language toggle.

P:60 (reduced motion) needs no change: it already replaces animated number changes with instant ones.

## G: DESIGN_GUIDE.md

**G-1 (G:67), the order.** As P-1. Weakens: no.

**G-2 (G:163-166), the state table.** "signal" becomes "level mark" in the Live, Unavailable and Closed rows; Live adds
"last update as an absolute time"; Delayed reads "Explicit last-known language and timestamp, with the last update's age
beside the absolute time; the value dims but its words and time stay (dimming is never the only channel); never claim
live. Digits do not roll." Rests on item 90's last-update rule. Weakens: no; it adds a channel (E STA-2's amber cue stays).

**G-3 (G:8, G:26-32), the concept's scope.** After the Owner concept scope add: "Public redesign scope: from ADR-010,
the Public page may be redesigned in the style of the Owner concept (Eclipse, `DESIGN-SPEC.md` §1), which supplies
palette, surfaces, radii, spacing, type and lights for it. RTL/LTR, numerals, truthful data, state grammar (§6), loading
behaviour, interaction, accessibility and reduced motion remain binding. The shipped page keeps this guide's tokens
until the redesign is promoted." G:8 reads "…except where superseded (ADR-009, ADR-010)". Weakens: yes, the palette,
token and radius tables (G:93-116, G:316-361) stop binding the concept; guards: the production baseline until
promotion, the semantic colours (live, delayed, offline) and the contrast rules.

**G-4 (G:52-56), authority.** "For the Owner surfaces superseded by ADR-009 and for the Public page superseded by
ADR-010, the prior Paper composition and canonicals are reference only…; for all other surfaces this sentence stands
unchanged." With it, `docs/design/VISUAL_AUTHORITY_STATUS.md`'s `public` row (ADR-010's consequences). Weakens: yes,
Paper composition for Public; guard: the concept-selection and perceptual-promotion gates (G:373-388).

**G-5 (G:41-45), the atmosphere.** Keep "static" and the ban on canvas, WebGL, OGL, `requestAnimationFrame`, video and a
background motion branch. Replace the watermark sentence: "The Public redesign sets its atmosphere with Eclipse's
static lights (E LGT-1…LGT-11) and no watermark; no light, grain or blur moves… Neither atmosphere nor lights may reduce
readability or become part of a data card." Rests on item 90's ban; the watermark's removal is inferred (question 1
below). Weakens: no; open risk: Eclipse's `backdrop-filter` blur and grain are unmeasured on a slow phone (the budget
waits until after the demo, item 90 P4).

**G-6 (G:123-124), type.** Add "Shipped page: Cairo, as above. Public redesign: Readex Pro, self-hosted, real weights
only (E TYP-1), until promoted." G:125 ("Crowd level is the decisive public display") stays. Weakens: concept only.

**G-7 (G:138-156), §5 "Public crowd instrument".** Lead with: "The shipped page keeps the 28-bar instrument below until
the redesign is promoted. The Public redesign replaces it with a level mark chosen by eye in its design round
(candidates include Eclipse's four-bar badge with its word, E CHP-5). Whichever is chosen: it is derived from the public
`band` only and never reconstructs a hidden ratio; the four labels are Quiet, Moderate, Busy and Packed, localized
naturally, and the current written label is always visible, so neither colour nor position is the only channel (E
LVL-4); any progression or category order follows reading direction; it has one concise localized accessible name; its
decorative parts are hidden from assistive technology; no numeric meter/progress ARIA values are used." The 28-bar
bullets stay as the shipped page's. Rests on item 90's accessibility rules. Weakens: the form only; its rules carry
over word for word (and go into E §6).

**G-8 (G:156, G:262-264), motion.** Both lines stay for the shipped page ("…occupancy readings, signal bars, and charts
at rest do not animate", "Do not animate a number through intermediate values; update it atomically"). Add: "Public
redesign: lights and the level mark at rest do not animate. A digit rolls only when a new live reading arrives; never
on opening, never while Delayed, Closed, Unavailable or loading, and never under reduced motion (instant). Roll by CSS
or WAAPI, never by `requestAnimationFrame` or canvas. Assistive technology gets one announcement of the final value,
not the intermediate digits. Any other motion (an intro, the level mark's own motion) is decided in the design round by
looking at it and recorded in the acceptance record." Weakens: yes, G:264 contradicts the roll outright (the line sort
missed it); guards: reduced motion, G:169-170 and G:310's short announcements, the rAF / canvas ban.

**G-9 (G:193-195, G:197-208, G:373), stale polish, composition, the gate.** G:193-195 adds "For the Public redesign the
dimmed level mark (E LVL-6, STA-2) settles it". G:199-206 is prefixed "Shipped page:" with "The Public redesign's board
is composed in Eclipse's sheet (§6), not here."; G:207-209 stay (mobile order: level, count, mark, freshness; no
marketing, promotions, photos, charts, diagnostics or extra cards). G:373 reads "(Login and Staff; and Public until
ADR-010's redesign is promoted)" and adds "for the superseded Public page, as for Owner, the existing canonicals are
reference-only regression evidence". Weakens: yes, Public's canonical comparison; guards: the two gates and the user's
inspection of named exact frames.

## S: SPEC.md

**S-1 (S:24-25, S:35, S:41-43, S:59-61), the concept's scope.** After each Owner-exploration clause add "…and the Public
redesign under ADR-010 (typography: Readex Pro, dark-only)"; S:25 reads "may vary appearance, including typography other
than Cairo (Public: dark-only); it does not change the shipped contract." Weakens: no.

**S-2 (S:639-647), the shipped visual system.** Add "…nor the Public redesign. When promoted it replaces the 28-bar
signal with the level mark of DESIGN_GUIDE §5 and Cairo with Readex Pro, self-hosted at real weights." Weakens: no.

**S-3 (S:53-55), the fidelity contract.** "Preserve the capacity-free public schema-version-2 contract. The shipped page
keeps the approved Arabic Public Live composition with its 28-bar signal until the Public redesign is promoted; the
redesign's composition is set by its approved concept." Weakens: no; the capacity-free contract is the preserved half.

**S-4 (S:113, S:777-779), the count's label.** "Approved Arabic public copy uses «داخل الصالة الآن · تقريبًا» as that
label (English: "Inside now · approx."), the same wording as the Owner pages (E GLO-2)", and "…uses the explicit
«داخل الصالة الآن · تقريبًا» label instead of `حوالي` or a person unit". Rests on item 90 (P2, «موافق»). Weakens: no;
the production catalog (`apps/web/src/i18n/messages/ar.ts`, `approximateCount`) changes at build, not here.

**S-5 (S:236-238, S:489-491), the 28-bar acceptance.** "The crowd-first level mark (the 28-bar signal on the shipped
page) derives only from `band`, follows reading direction where it has one, and has one concise localized accessible
name with decorative parts hidden and no numeric ARIA." S:489: "The level mark (28-bar signal on the shipped page) is
rendered from `band`…". Weakens: "mirrors by direction" becomes "follows reading direction where it has one", because a
badge may not mirror (question 3).

**S-6 (S:357, S:604), the freshness windows.** Today S:357 says "fresh ≤ 90 s, stale ≥ 180 s", and ages between 90 and
180 s have no state; production makes them stale (`payload-builder.ts:126`, `age <= freshForSeconds*1000 ? "fresh" :
"stale"`, `freshForSeconds` 90; its tests at 90,000 / 90,001 / 180,000 ms), and the 180 s is the operational threshold
for staff health and alerts. Proposed S:357: "freshness windows (push interval; public fresh window 90 s, older is stale;
operational stale threshold 180 s for staff health and alerts; public poll ~60 s)"; S:604: "≥ the operational stale
threshold". Rests on item 90, "the Spec's 90-180 s gap reads as stale, as production does". Weakens: no; it removes an
undefined state.

**S-7 (S:557-559), the state machine.** "Payload age ≤ 90 s → `fresh`; older than 90 s → `stale` (the public page; the
180 s operational threshold of S:357 drives staff health and alerts only): the public page dims the number, labels it
last-known with its absolute time and that time's age, and shows the stale treatment (DESIGN_GUIDE §6). While `fresh`
it shows the last update as an absolute time." Weakens: no; S:561's bake-at-origin stays.

**S-8 (S:293-294), the public freshness target.** "(90 s stale threshold + one cache window + one poll interval)"; the
≤ 5 minutes ceiling stays (question 7). Weakens: no; the worst case under stale-while-revalidate is unverified.

**S-9 (S:546), the frame.** "…(no auth chrome and no header/nav from the scaffold demo; no Owner rail, bar or header;
the page carries the brand, the language switch, the gym's name as fixed text, and in the error state only
«إعادة المحاولة»)." Rests on item 90 P5. Weakens: no.

**S-10 (S:48-49), the demo switch.** Add "…demo notices, a demo state switch (hidden or not),…". Rests on item 90 P6.
Strengthens.

**S-11 (S:718-722), the screen-reader test.** Add "Before the Public redesign is promoted to production, the Public page
is tested with a real screen reader in Arabic and English (names, the one announcement of a new reading, the state
announcements). The concept ships the markup that costs nothing and defers this test." Item 90 says the Spec's
acceptance "still requires" it, but no line of the three files names a real screen-reader test today, so without S-11
the deferral has nothing to defer. Adds a requirement.

## Points of item 90 that need no amendment

- Packed «شديد الازدحام»: none of the three files carries the word; the production Public catalog has «ممتلئ جدًا»
  (`apps/web/src/i18n/messages/ar.ts`), a catalog change at the build, recorded in the milestone.
- No verdict line, no typical-day chart: no line requires either; G:209 and S:490 protect their absence.
- The demo's states on one page: concept only; S-10 covers the switch.

## For the user to decide (item 90 does not settle them), with the coordinator's recommendation

1. The atmosphere: Eclipse's lights and no watermark (G-5). Recommended.
2. The level still outranks the count (G:70, G:125, P:68). Recommended: yes; the band is the primary truth (P:7).
3. "Follows reading direction where it has one" for a badge that may not mirror (S-5). Recommended: yes.
4. The stale age is computed from the payload's server time, not the phone's clock (a skewed clock would show a wrong
   age). Recommended.
5. Keep "no green / yellow / orange categorical meter" (G:145-146) as a guard on the level mark's candidates.
   Recommended.
6. The weight and speed budget for blur and grain after the demo, with one smoothness check on the demo phone (item 90
   P4). Recommended.
7. S-8's ceiling stays at 5 minutes. Recommended.

## What must not change

The capacity-free contract (P:7, P:20, G:70-73, S:236-237, S:487-501); privacy (P:20, S:50-52, S:270-272); closed and
unavailable show no count or band and stale never looks live (P:35, P:42-43, G:165-166, S:233-235); Western digits, the
12-hour clock, gym time (P:54, G:127-128, S:633-634); Arabic RTL by default and English composed for its reader (P:52,
P:68); the order of what the page answers (P:26-33, G:62-68, item 4 reworded only); status as text plus a non-colour cue
and the live-region rules (P:35, G:169-170, G:307-311); dark-only (P:58, S:242); loading (G:172-191); 320-1440 (P:50,
G:230-232); reduced motion (P:60, G:262-268); polling, baked freshness and the cache (S:481-484, S:561-567); 44 px
targets (G:274-275); ADR-008 (S:244-248).
