# FITWAY — Design Guide

> **ARCHIVED 2026-07-15 — NON-AUTHORITATIVE.** Retained as pre-BRG design history. It contains
> superseded tokens, font weights, public meters, percentage-era structure, and exploration
> assumptions. Use the repository-root `DESIGN_GUIDE.md` and approval manifest.

> Implementation-ready design system and visual direction for the Fitway live gym-occupancy
> product. This document is the single source of truth for color, type, spacing, components,
> motion, RTL/i18n, and accessibility.
>
> **Scope.** This guide covers the three product surfaces defined in `RESEARCH.md`: the
> public visitor page, the staff operational view, and the owner/admin analytics. It does
> **not** expand the product beyond `RESEARCH.md` (§16 scope fence). It is a design system,
> not a spec, plan, or implementation.
>
> **Locked Public Live Desktop anchor.** At the 1440×900 Arabic desktop reference,
> **G1B — Global Header + Parallel Split + Structural Skeleton** is the approved
> composition. The canonical artifacts live in
> `visual-direction-gate/approved/public-live-desktop/`. G1B supersedes only conflicting
> Public Live Desktop composition and copy examples in this guide; all unrelated research,
> principles, tokens, responsive guidance, accessibility guidance, and state guidance remain
> authoritative.
>
> **Approved full-product family.** VDG-A is complete. The final Claude Design archive and
> separate Analytics chart-behavior reference live in
> `visual-direction-gate/approved/full-product/`. The top-level Claude screens are strong
> layout and FITWAY visual-direction references; the Analytics PNG governs only occupancy-
> curve behavior and motion character. Binding product, security, privacy, content,
> accessibility, and data semantics take precedence. References are not a blind pixel ceiling:
> improve real-browser composition, hierarchy, spacing, type, responsive/mobile behavior,
> motion, interaction, charts, tables, and accessibility without silently changing locked
> decisions. Preview labels, demo data, fake identities/email values, and other mockup-only
> content never ship.
>
> **Grounding.** Reference research was performed on the live inspiration site
> `https://www.fitnesstime.com.sa/ar` using browser inspection (computed styles, runtime
> CSS custom properties, network assets, and before/after interaction screenshots).
> Extracted reference values are explicitly separated from Fitway design decisions. See
> §2 for the full evidence log and tool limitations.
>
> **Arabic-first, RTL-by-default, mobile-first.** These are structural constraints applied
> throughout, not a post-hoc mirror. Phone portrait (design target 390px) is the primary
> canvas.

---

## 1. Design Direction Summary

### Final design thesis

**Fitway is a live status instrument dressed in an athletic brand.** The product's job is to
answer one question in under three seconds — _"How crowded is the gym right now, and is it
open?"_ — and to do it honestly, even when the data is stale, offline, or missing. Every
visual decision serves reading speed and trust first, and athletic personality second. We
inherit Fitness Time's confident, dark, red-accented sports polish, but we spend that
confidence on a **data surface**, not a marketing page. Where the reference shouts to sell
memberships, Fitway states a fact and dates it.

### Voice and feel adjectives

**Bold. Athletic. Energetic. Modern. Trustworthy.** In practice, for a data product that
resolves to: **confident, calm, honest, fast, legible.** Energy comes from the red accent,
heavy display type, and the live occupancy meter — not from motion that delays reading.

### Mood (one paragraph)

A dark, near-black canvas with a single decisive red. A very large, honest occupancy number
sits at the center of the phone screen, paired with a qualitative four-state crowd scale whose
active segment reinforces the labeled band at a glance, with a plain-language label ("مزدحم / Busy")
and a quiet timestamp confirming the data is fresh. The typography is heavy and athletic
(Cairo, Bold to Black), the surfaces are matte and layered, red is used like a stadium
spotlight — concentrated on the one thing that matters — and when the signal drops, the
screen says so plainly instead of pretending. It should feel like the gym's own scoreboard:
built for the sport, built to be believed.

### How Fitness Time influenced the direction

- **Dark-first system.** The reference is built on a near-black canvas (`#0a0a0a`) with
  layered dark surfaces and white type — we adopt this wholesale (`design-research/fitness-time/desktop-hero.png`).
  Fitway v1 ships **dark-only**; the reference's light theme is deliberately not adopted
  (deferred post-pilot, §4.3).
- **Single red accent.** Its entire identity rests on one red (`#e31837`) used sparingly on a
  dark field. This is exactly the discipline a data product needs, and it aligns with
  Fitway's existing red identity.
- **Athletic, heavy Arabic type.** Cairo Bold at large sizes, two-tone headlines (white with
  a red-emphasized fragment), and pill "eyebrow" labels (`content-section.png`).
- **Red glow as elevation.** Cards lift on hover with a red-tinted shadow rather than a
  neutral one — a distinctive, on-brand elevation cue we keep for interactive data cards.
- **Confident RTL layout.** The reference is genuinely RTL — logo on the inline-start
  (top-right), nav flowing right-to-left, CTAs mirrored (`navigation-desktop.png`,
  `mobile-navigation.png`).

### What was intentionally not copied

- **Promotional carousels, sticker illustrations, and marketing hype** (`card-grid.png`) — a
  live-status product must not bury the number under decoration.
- **Photo-dominant heroes.** The reference hero is a full-bleed darkened gym photo with a
  headline (`desktop-hero.png`). Fitway's hero is the **occupancy status itself**; imagery is
  a subordinate backdrop, never a competitor to the data.
- **App-store badges, WhatsApp float, gold/silver accents, "join now" funnels** — all
  marketing furniture with no operational purpose.
- **The reference's page structure, imagery, copy, and components literally.** We take the
  _language_ (dark, red, athletic, RTL) and build a Fitway-owned system on it.

### Surface priorities

The system prioritizes, in strict order (from `RESEARCH.md`): **(1) current crowd status,
(2) occupancy count, (3) data freshness, (4) open/closed status, (5) operational clarity,
(6) trustworthiness, (7) mobile readability, (8) analytics usefulness.**

- **Public (visitor):** glanceability and honesty. Status band, approximate count, open/
  closed, freshness, all readable in seconds on a phone. Stale/offline/closed are first-class
  states, never a frozen fake-live number.
- **Staff (front desk):** operational clarity. Live count, device health, correction/reset
  with confirmation for destructive actions, and unmistakable offline/stale alerts.
  Operational controls are visually distinct from informational data.
- **Owner/admin (analytics):** decision usefulness. KPI cards, daily curve, day×hour heatmap,
  peaks, trends, CSV export, and health/alert summaries — with proper empty, loading, stale,
  and error states.

---

## 2. Reference Research Findings

All values below were captured on 2026-07-11 from `https://www.fitnesstime.com.sa/ar` using
the browser's runtime `getComputedStyle` on `:root` and on live elements, plus network
inspection. The site is a Next.js application styled with Tailwind CSS v4. Because the CSS is
shipped as **minified, generated bundles**, most values are attributed to **runtime CSS
custom properties** and **computed styles** rather than to authored source selectors — this
is stated per value and is the honest provenance.

### Screenshots captured (`design-research/fitness-time/`)

| File                         | What it documents                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `desktop-hero.png`           | Desktop hero: darkened gym photo, huge white Cairo headline, red + ghost CTAs, fixed nav                                               |
| `mobile-hero.png`            | Mobile hero: hamburger + logo, stacked CTAs, headline scale-down                                                                       |
| `navigation-desktop.png`     | Fixed top nav, RTL order, red rounded CTAs (8px radius), theme + language controls                                                     |
| `mobile-navigation.png`      | Full-height dark drawer, right-aligned items, active-red + dot, bottom-pinned CTAs                                                     |
| `card-grid.png`              | Promotional offers carousel (large red rounded card, pagination dots) — a pattern we reject                                            |
| `content-section.png`        | App section: two-tone headline, pill eyebrow, 2×2 red-glow feature cards, app mockup showing a "How busy 4%" occupancy card            |
| `footer.png`                 | Restrained dark footer, muted link columns, social chips, city filter pills, location map                                              |
| `primary-button-default.png` | Red rounded CTA (8px radius) — the nav CTA "انضم الآن", default state                                                                  |
| `primary-button-hover.png`   | Same nav CTA ("انضم الآن"), hover state (darker-red overlay)                                                                           |
| `light-mode-hero.png`        | Theme toggle engaged; hero remains dark-on-media. Light-theme token values were read from computed styles, not visible in this capture |

### CSS bundles inspected

- `/_next/static/chunks/0-r9.cd0yz-ge.css`
- `/_next/static/chunks/0c_q8j~d3dxm8.css`
- `/_next/static/chunks/0c8ie4waiph_r.css`

(All minified/generated; values read from computed `:root` custom properties.)

### Fonts identified

- **Cairo** — the single UI family for **both Arabic and Latin**. Computed `font-family` on
  `h1`, `h2`, `nav`, and CTA all resolved to `Cairo, "Cairo Fallback"`. Loaded weights span
  **200–1000**. Served as woff2 subsets:
  - `/_next/static/media/9ff27b8a0a8f3dc0-s.p.170gfl_1xpie6.woff2`
  - `/_next/static/media/d41831e24743a3c1-s.p.02r-fjhi~6g_a.woff2`
  - `/_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2`
- **Inter** — declared in the font stack but reported `unloaded` (fallback / Latin secondary).
- Mono fallback: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, …` (from `--font-mono`).

### Extracted tokens (from runtime `:root` custom properties)

**Brand / primary (identical in light and dark):**

| Property               | Value                     | Source                  |
| ---------------------- | ------------------------- | ----------------------- |
| `--primary`            | `#e31837` (rgb 227,24,55) | `:root` custom property |
| `--primary-dark`       | `#c41230` (rgb 196,18,48) | `:root` custom property |
| `--primary-light`      | `#ff2d4d` (rgb 255,45,77) | `:root` custom property |
| `--primary-foreground` | `#fff`                    | `:root` custom property |
| `--accent-gold`        | `#d4af37`                 | `:root` custom property |
| `--accent-silver`      | `silver`                  | `:root` custom property |

**Dark theme surfaces / text / borders:**

| Property          | Value               | Property              | Value                    |
| ----------------- | ------------------- | --------------------- | ------------------------ |
| `--background`    | `#0a0a0a`           | `--foreground`        | `#fff`                   |
| `--surface`       | `#111`              | `--foreground-muted`  | `#d4d4d4`                |
| `--surface-2`     | `#1a1a1a`           | `--foreground-subtle` | `#a3a3a3`                |
| `--surface-3`     | `#242424`           | `--foreground-faint`  | `#737373`                |
| `--surface-inset` | `#0d0d0d`           | `--border`            | `#ffffff1a` (white 10%)  |
| `--overlay`       | `#000c` (black 80%) | `--border-subtle`     | `#ffffff0d` (white 5%)   |
| `--glass-bg`      | `#111c`             | `--border-strong`     | `#ffffff2e` (white ~18%) |

**Light theme (captured after toggling the theme control):**

| Property          | Value       | Property              | Value       |
| ----------------- | ----------- | --------------------- | ----------- |
| `--background`    | `#f7f7f8`   | `--foreground`        | `#0f0f12`   |
| `--surface`       | `#fff`      | `--foreground-muted`  | `#3f3f46`   |
| `--surface-2`     | `#f1f1f3`   | `--foreground-subtle` | `#6b6b73`   |
| `--surface-3`     | `#e8e8eb`   | `--foreground-faint`  | `#8a8a93`   |
| `--surface-inset` | `#ededf0`   | `--border`            | `#0f0f121a` |
| `--overlay`       | `#0f0f128c` | `--glass-bg`          | `#ffffffb8` |

**Shadows, radii, spacing, motion (from `:root`):**

| Property                            | Value                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `--card-shadow`                     | `0 20px 60px -15px #00000080, 0 0 0 1px #ffffff0d`                       |
| `--card-shadow-hover`               | `0 30px 80px -20px #e318374d, 0 0 0 1px #e318374d` (red-tinted glow)     |
| `--radius-sm … --radius-3xl`        | `.25rem / .375 / .5 / .75 / 1 / 1.5rem` (4 → 24px)                       |
| `--spacing`                         | `.25rem` (4px base unit)                                                 |
| type scale `--text-xs … --text-7xl` | `.75 / .875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.25 / 3 / 3.75 / 4.5rem` |
| big-heading line-heights            | `--text-5xl…7xl--line-height: 1` (headings ≥3rem set to LH 1)            |
| `--default-transition-duration`     | `.15s` (150ms)                                                           |
| `--ease-in-out` / default timing    | `cubic-bezier(.4, 0, .2, 1)`                                             |
| `--ease-out`                        | `cubic-bezier(0, 0, .2, 1)`                                              |
| `--animate-pulse`                   | `pulse 2s cubic-bezier(.4,0,.6,1) infinite`                              |
| `--animate-ping`                    | `ping 1s cubic-bezier(0,0,.2,1) infinite`                                |
| `--animate-spin`                    | `spin 1s linear infinite`                                                |
| containers `--container-sm … 7xl`   | `24 / 28 / 32 / 36 / 42 / 48 / 56 / 64 / 72 / 80rem`                     |

**Computed element styles (live DOM):**

- `h1` — Cairo 700, `72px` / LH `90px`, white, tracking normal (`text-7xl` at desktop).
- `h2` — Cairo 700, `36px` / LH `45px`, white.
- Nav — `position: fixed`, height `80px`, `z-index: 50`, `bg-gradient-to-b from-black/50 to-transparent`, `transition-all duration-300`.
- Primary CTA (the **hero** CTA `ابدأ رحلتك`; the button captures above show the **nav** CTA
  `انضم الآن`) — `bg #e31837`, white, weight 600, radius `8px`, padding `16px 32px`, `transition-all duration-300`; hover = an absolutely-positioned `#c41230` overlay fading `opacity 0 → 100` + arrow icon `translate-x-1` (4px nudge).
- Ghost CTA (`العروض`) — `border-white/30`, white, `hover:bg-white/10`, `backdrop-blur-sm`, radius `8px`.
- Outline-red CTA (`فت جفت`) — `border-[#e31837] text-[#e31837] hover:bg-[#e31837] hover:text-white`.
- Pill eyebrow — `bg-[#e31837]/20 text-[#e31837] border-[#e31837]/30 rounded-full`, weight 600, `text-xs/sm`.
- Card — `rounded-2xl/3xl` (16–24px), `bg-surface #111`, `border` white 5%, `shadow-xl`.
- Icon button (theme toggle) — `min-h-11 min-w-11` (44px touch target), visual `36px`, `rounded-full`, `border-white/30`.
- `document.documentElement` — `dir="rtl"`, `lang="ar"`.

### Interaction observations

- **Navigation** is fixed and translucent, darkening on scroll (`transition-all duration-300`).
  Mobile collapses to a full-height right-aligned drawer with a red active item + red dot and
  bottom-pinned CTAs (`mobile-navigation.png`).
- **Buttons**: hover swaps to a darker red via an opacity-fading overlay; the forward arrow
  nudges 4px. Ghost buttons wash to `white/10` with a subtle backdrop blur.
- **Cards** carry a subtle red-tinted shadow and red radial glows behind feature icons
  (`content-section.png`).
- **Sticky elements**: fixed nav, floating "scroll" hint, floating back-to-top and chat
  buttons.

### Motion observations

- **Durations** cluster at **150ms** (color/simple transitions, the `:root` default) and
  **300ms** (buttons, nav bar, larger transitions).
- **Easing** is `cubic-bezier(.4, 0, .2, 1)` (standard ease-in-out) for most transitions and
  `cubic-bezier(0, 0, .2, 1)` (ease-out) for entrances.
- **Transforms** are small and controlled: a 4px arrow nudge, opacity fades, red-glow shadow
  growth, backdrop blur. Looping utilities exist (`pulse` 2s, `ping` 1s, `spin` 1s) for
  status/loaders.
- **Personality: smooth, polished, restrained — with a light athletic snap.** Not bouncy, not
  dramatic. Confident and controlled.

### Tool limitations (stated honestly)

- **No screen-recording tool** was available in this environment. Motion was characterized
  from computed styles, the utility classes actually applied (`transition-*`, `duration-*`,
  `animate-*`, `group-hover:*`), the inline transition/overlay markup, and **before/after
  hover screenshots** — not from frame-by-frame video. Durations/easing are extracted facts;
  the "personality" verdict is an interpretation of those facts.
- **CSS is minified/generated** (Next.js + Tailwind v4). Values are therefore attributed to
  runtime `:root` custom properties and computed element styles rather than to authored,
  named source selectors. Where a value came from browser inspection of a computed style, it
  is labeled as such.
- Some reference custom-property colors are expressed in `lab()`/`oklab()`; the hex/RGB shown
  here are the sRGB equivalents reported by the browser or the literal hex in the token.

### Observed / Adopted / Modified / Rejected

**Observed from the reference**

- Dark-first canvas (`#0a0a0a`) with layered matte surfaces and white type.
- One red accent (`#e31837`, hover `#c41230`, light `#ff2d4d`) used sparingly.
- Cairo as a single Arabic+Latin family, heavy weights, two-tone red headlines, pill eyebrows.
- Radii 8–24px, pill for chips; red-tinted card elevation; 150/300ms motion, standard easing.
- Genuine RTL layout; a semantic light/dark token flip that keeps `--primary` constant.
- Marketing-heavy content: photo heroes, promo carousels, sticker illustration, app badges.

**Adopted for Fitway**

- The dark-first surface system.
- The single-red discipline and Fitway's own red scale seeded from `#e31837`.
- Cairo for Arabic and Latin; heavy display weights; the pill eyebrow/badge pattern.
- Radius language (rounded, not sharp; pill for status chips), red-glow elevation for
  interactive data cards, and the 150/300ms + standard-easing motion base.
- The confident, first-class RTL layout.

**Modified for Fitway**

- **Red is rationed harder.** In a data UI, red is reserved for the primary action, the
  brand mark, and the "Packed"/critical state — not sprinkled across decoration.
- **The hero is the data, not a photo.** Any gym imagery becomes a dimmed, scrimmed backdrop
  behind the occupancy instrument, never a foreground competitor.
- **Motion is snappier and calmer for data.** UI transitions trend to 120–220ms; the 300ms+
  flourishes are reserved for large surfaces. Number updates use a quick, non-distracting
  count/crossfade that never delays reading.
- **A full semantic + crowd-state system** (Quiet/Moderate/Busy/Packed, plus stale/offline/
  loading/empty/error) is added — the reference has no equivalent operational vocabulary.
- **Dark-only in v1.** The reference's semantic light/dark token flip is observed but not
  shipped: Fitway v1 has no light theme (deferred post-pilot, §4.3). The token architecture
  stays semantic and light-theme-capable so one can be added later without renaming.

**Rejected for Fitway**

- Promotional carousels, sticker/cartoon illustration, and marketing hype animation.
- Photo-dominant heroes that outweigh the live number.
- App-store badges, WhatsApp/marketing floats, gold/silver accents, "join now" funnels.
- Any pattern that shows a frozen number as if it were live, or that relies on color alone to
  convey status.

---

## 3. Brand and Logo Usage

The official logo lives at `brand/fitway-logo.png` — a **transparent white PNG, 1024×1024,
32-bit with alpha**. It is a circular emblem: a white ring enclosing a rightward chevron/play
mark with a concentric inner dot, reading as forward motion ("way"). **It is the official gym
logo. Do not redesign, reinterpret, trace, recolor, or replace it.** This guide specifies
_how to place it_, not how to change it.

### Official logo treatment

- Use the supplied white mark as-is on dark and red surfaces.
- Treat it as a **solid white mark**; the soft edge in the raster is acceptable at large
  sizes but is the reason a crisp vector is recommended for small sizes (see below).
- Pair it with the wordmark "FITWAY" (uppercase, Cairo Bold/Black) when a lockup is needed;
  the mark may also stand alone (app icon, favicon, compact nav).

### Clear space

- Minimum clear space on all sides = **25% of the mark's rendered diameter** (`0.25 × width`).
  Nothing — text, UI chrome, image edges — enters this zone.
- In a lockup with the wordmark, set the gap between mark and wordmark to **0.5× the mark's
  diameter**, and apply the 25% clear space around the whole lockup.

### Minimum size

- **Digital UI:** 32px diameter minimum. Favicon 32×32 (avoid 16px for the full mark; use a
  simplified single-glyph favicon at 16px).
- **Compact/nav placement:** 40px recommended.
- **Print:** ~12mm diameter minimum.
- Below 32px the concentric detail muddies — this is the trigger for producing the vector
  asset below.

### Allowed backgrounds

- **Fitway Red** (`--fw-primary #E31837`, or `--fw-primary-hover #C41230`, or the deep red
  `--fw-primary-deep`). Highest-impact placement.
- **Near-black / dark surfaces** (`--fw-bg`, `--fw-surface-1/2/3`). The default home for the
  white mark.
- **Dark photography** only when a scrim/overlay (`--fw-scrim` / `--fw-overlay`) guarantees
  the mark sits on an effectively dark, low-contrast area (contrast of mark vs. local
  background ≥ 3:1).

### White logo usage

- The white PNG is the **primary asset**. Use it on red and dark surfaces (above).
- Do not place the white mark on light or busy backgrounds — it disappears. On light
  surfaces, either (a) drop it into a red or dark circular "badge" container, or (b) use a
  dark/monochrome version once the vector exists.

### Red surface usage

- White mark on `--fw-primary` is a signature Fitway lockup (matches the reference's
  red-on-dark energy while being Fitway-owned). Maintain ≥ 25% clear space and keep the red
  flat (no gradient behind the mark).

### Dark surface usage

- White mark on `--fw-bg`/`--fw-surface-*` is the default. On the darkest surface a faint
  radial red glow _behind_ the mark is permitted as ambient brand lighting, but must not
  reduce mark legibility.

### Incorrect usage (do not)

- Do not recolor the mark to any non-brand color, add drop shadows/bevels/gradients, or
  outline it.
- Do not stretch, squash, rotate, skew, or crop it.
- Do not place the white mark on white, light, low-contrast, or visually busy backgrounds
  without a dark/red container or scrim.
- Do not reconstruct or "clean up" the glyph by tracing; do not swap in a look-alike.
- Do not set it below the minimum size or violate clear space.
- Do not animate the mark in a way that distorts it (subtle opacity/scale entrance is fine).

### Monochrome treatment

- **White** (supplied) — dark/red backgrounds.
- **Solid red** knockout (`--fw-primary`) on white/light — _to be produced from the vector_.
- **Solid black** — light backgrounds where red is inappropriate — _to be produced from the vector_.
- No two-tone or gradient logo treatments.

### Future clean SVG — recommended: **YES (strongly).**

Produce a crisp vector (SVG) of the existing mark **without altering its shape**, to enable:
sharp rendering at small sizes, a proper 16px favicon, and the monochrome white/black/red
variants above. Until it exists, restrict the raster to ≥ 32px on dark/red surfaces only.

---

## 4. Color

Fitway runs a **dark-only, single-red** system in v1 (see §4.3 for the recorded theme
decision). Surface, text, and border tokens are **semantic** (named by role, not by value);
the **red and the status colors are constants** so the brand and the crowd meaning never
shift. Values are seeded from the reference (`--primary #e31837`) and rebuilt into a
coherent Fitway-owned set.

Contrast is quoted as an approximate ratio against the stated background using WCAG relative
luminance. Targets: **≥ 4.5:1** for normal text, **≥ 3:1** for large/bold text (≥ 24px, or
≥ 18.66px bold) and for UI/graphical boundaries.

### 4.1 Fitway core red palette

| Token                                 | Hex       | RGB         | Usage                                                          | Contrast notes                                               |
| ------------------------------------- | --------- | ----------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `--fw-red-50`                         | `#FFF1F3` | 255,241,243 | Lightest red tint                                              | —                                                            |
| `--fw-red-100`                        | `#FFE0E5` | 255,224,229 | Light red tint                                                 | —                                                            |
| `--fw-red-200`                        | `#FFC2CC` | 255,194,204 | Soft tint                                                      | —                                                            |
| `--fw-red-300`                        | `#FF97A8` | 255,151,168 | Red text on very dark surfaces (large)                         | ~9.6:1 on `--fw-bg`                                          |
| `--fw-red-400`                        | `#FF5C74` | 255,92,116  | **Red text/icon on dark** (small OK)                           | ~6.6:1 on `--fw-bg`                                          |
| `--fw-red-500` `--fw-primary`         | `#E31837` | 227,24,55   | **Primary red**: primary buttons, brand, focus accents, Packed | white text on it ~4.7:1 (AA normal); as text on white ~4.7:1 |
| `--fw-red-600` `--fw-primary-hover`   | `#C41230` | 196,18,48   | **Hover red** for primary surfaces                             | white text ~6.0:1                                            |
| `--fw-red-700` `--fw-primary-pressed` | `#A50E28` | 165,14,40   | **Pressed red** (active state)                                 | white text ~7.8:1                                            |
| `--fw-red-800` `--fw-primary-deep`    | `#7A0B1E` | 122,11,30   | **Deep red**: tint fills, red-glow base, heatmap peak-shadow   | white text ~11:1                                             |
| `--fw-red-900`                        | `#4D0713` | 77,7,19     | Deepest red (backgrounds, ambient glow)                        | —                                                            |
| `--fw-primary-light`                  | `#FF2D4D` | 255,45,77   | Highlight/glow accent on dark (borders, sheens)                | ~5.3:1 as large text on `--fw-bg`                            |
| `--fw-on-primary`                     | `#FFFFFF` | 255,255,255 | Text/icon on any red ≥ `--fw-primary`                          | ≥ 4.7:1                                                      |

> **Red on dark warning.** `--fw-primary #E31837` as **small text** on near-black is ~4.2:1 —
> below AA for body text. For red _text/icons_ on dark surfaces use `--fw-red-400 #FF5C74`
> (small) or `--fw-red-300` (large). `#E31837` is reserved for **fills** (buttons, bars, the
> mark) where it carries white text, and for large/bold accents.

### 4.2 Surfaces

| Token                | Hex                   | RGB         | Usage                                        |
| -------------------- | --------------------- | ----------- | -------------------------------------------- |
| `--fw-bg`            | `#0B0C0E`             | 11,12,14    | App background (page canvas)                 |
| `--fw-surface-1`     | `#131417`             | 19,20,23    | Default card / panel                         |
| `--fw-surface-2`     | `#1B1D21`             | 27,29,33    | Raised card, inputs, nested surface          |
| `--fw-surface-3`     | `#24272C`             | 36,39,44    | Hover surface, controls, chips               |
| `--fw-surface-inset` | `#0E0F11`             | 14,15,17    | Inset wells (chart plots, code, meter track) |
| `--fw-scrim`         | `#000000`             | 0,0,0       | Full black for image scrims                  |
| `--fw-overlay`       | `rgba(0,0,0,0.72)`    | —           | Modal/backdrop overlay                       |
| `--fw-glass-bg`      | `rgba(15,16,19,0.72)` | —           | Sticky nav / glass panels (with blur)        |
| `--fw-on-media`      | `#FFFFFF`             | 255,255,255 | Text/icon over scrimmed imagery              |

### 4.3 Theme decision — dark-only (v1)

> **Recorded decision (2026-07-11).** Fitway v1 ships **dark-only**; there is no light
> theme, no theme toggle, and no theme-aware token flipping in the product. A light theme
> is **deliberately deferred post-pilot**. Tokens are named semantically (by role, not by
> value), so a light theme can later be added by overriding token _values_ — no renaming,
> no component rewrites. The reference site's light mode remains documented as evidence in
> §2 only.

### 4.4 Text colors

| Token              | Hex       | Usage                                                | Contrast on `--fw-bg` |
| ------------------ | --------- | ---------------------------------------------------- | --------------------- |
| `--fw-text`        | `#F7F8FA` | High-emphasis body & headings                        | ~18:1                 |
| `--fw-text-muted`  | `#C6C9CF` | Secondary text, labels                               | ~11.8:1               |
| `--fw-text-subtle` | `#969AA3` | Tertiary, captions, timestamps                       | ~6.9:1                |
| `--fw-text-faint`  | `#6B6F78` | Decorative/disabled; **large or non-essential only** | ~3.9:1                |

### 4.5 Muted / border / overlay colors

| Token                | Value                    | Usage                                |
| -------------------- | ------------------------ | ------------------------------------ |
| `--fw-border`        | `rgba(255,255,255,0.12)` | Default separators, card outlines    |
| `--fw-border-subtle` | `rgba(255,255,255,0.06)` | Hairline dividers, quiet outlines    |
| `--fw-border-strong` | `rgba(255,255,255,0.20)` | Emphasized borders, input focus base |
| `--fw-overlay`       | `rgba(0,0,0,0.72)`       | Dialog backdrops                     |

### 4.6 Chart colors

Sequential heatmap uses a **single-hue red luminance ramp** (colorblind-safe because ordering
is by lightness, and on-brand). Categorical series use hue-distinct, colorblind-aware colors.

| Token             | Hex                                       | Usage                                            |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| `--fw-chart-1`    | `#E31837`                                 | Primary series (occupancy) — brand red           |
| `--fw-chart-2`    | `#4C8DFF`                                 | Secondary series (e.g., capacity/reference line) |
| `--fw-chart-3`    | `#2DD4BF`                                 | Third series (teal)                              |
| `--fw-chart-4`    | `#F5A524`                                 | Fourth series (amber)                            |
| `--fw-chart-5`    | `#A78BFA`                                 | Fifth series (purple)                            |
| `--fw-chart-6`    | `#94A3B8`                                 | Muted/reference series (slate)                   |
| `--fw-chart-grid` | `rgba(255,255,255,0.07)`                  | Grid lines                                       |
| `--fw-chart-axis` | `#969AA3`                                 | Axis labels/ticks (= `--fw-text-subtle`)         |
| `--fw-heat-0`     | `#14161A`                                 | Empty / lowest occupancy                         |
| `--fw-heat-1`     | `#3A1620`                                 | Low                                              |
| `--fw-heat-2`     | `#6B1528`                                 | Low-mid                                          |
| `--fw-heat-3`     | `#A11330`                                 | High                                             |
| `--fw-heat-4`     | `#E31837`                                 | Peak occupancy                                   |
| `--fw-heat-empty` | `rgba(255,255,255,0.04)` + diagonal hatch | No data (distinct from "0 people")               |

### 4.7 Semantic colors

Each semantic role provides a **base** (fills/icons/bars), a **-fg** (accessible text/icon on
dark surfaces), and a **-bg** (soft tint for badges/rows). **Status is never conveyed by color
alone** — always pair with a label, icon, or position (§12, §15).

| Role               | Base                   | -fg (text on dark) | -bg (tint)               | Usage                                 |
| ------------------ | ---------------------- | ------------------ | ------------------------ | ------------------------------------- |
| **Success**        | `--fw-success #16A34A` | `#4ADE80`          | `rgba(22,163,74,0.14)`   | Saved, healthy, action succeeded      |
| **Warning**        | `--fw-warning #F59E0B` | `#FBBF24`          | `rgba(245,158,11,0.14)`  | Caution, needs attention              |
| **Error / Danger** | `--fw-error #E31837`   | `#FF5C74`          | `rgba(227,24,55,0.14)`   | Failed action, destructive, critical  |
| **Info**           | `--fw-info #2E7DF6`    | `#7FB0FF`          | `rgba(46,125,246,0.14)`  | Neutral system info, tips             |
| **Stale**          | `--fw-stale #D9A400`   | `#F1C34D`          | `rgba(217,164,0,0.14)`   | Data is old but system not dead       |
| **Offline**        | `--fw-offline #8A8F99` | `#B4B8C0`          | `rgba(138,143,153,0.16)` | No signal / device down / unavailable |

> **Red-overload strategy.** Fitway red is deliberately used for three intensity-aligned
> meanings: **primary action**, **Packed** (peak crowd), and **Error/destructive**. These are
> never distinguished by hue alone — they are separated by **context, icon, label, and
> confirmation flow**. This keeps one confident red instead of five competing reds.

### 4.8 Crowd-state colors (the product's core signal)

Ordered green → yellow → orange → red. Order is also encoded by a **four-state qualitative
scale and a required text label**, so deuteranopic/protanopic users read the state without hue. Each has a
distinct icon (§11).

| State                        | Base (fill) | -fg (text on dark) | -bg (tint)              | Meaning          | Contrast (fill vs `--fw-bg`)       |
| ---------------------------- | ----------- | ------------------ | ----------------------- | ---------------- | ---------------------------------- |
| **Quiet** `--fw-quiet`       | `#22C55E`   | `#4ADE80`          | `rgba(34,197,94,0.16)`  | Plenty of space  | ~8.6:1 (large/graphical ✔)         |
| **Moderate** `--fw-moderate` | `#EAB308`   | `#FCD34D`          | `rgba(234,179,8,0.16)`  | Comfortably busy | ~10.2:1                            |
| **Busy** `--fw-busy`         | `#F97316`   | `#FB923C`          | `rgba(249,115,22,0.16)` | Crowded          | ~7.0:1                             |
| **Packed** `--fw-packed`     | `#E31837`   | `#FF5C74`          | `rgba(227,24,55,0.18)`  | At/near capacity | ~4.2:1 (bar ✔; use `-fg` for text) |

Thresholds (which % maps to which band) are **admin-configurable** per `RESEARCH.md §4` — the
design never hard-codes them. Staff/owner surfaces may use capacity internally; under the
current/default public contract, Public Live reads only band + count and receives neither
capacity nor a derived percentage.

---

## 5. Typography

### Families

- **Arabic display & body: Cairo.** A modern, geometric, athletic Arabic sans with excellent
  legibility and a wide weight range (200–1000). SIL OFL licensed (free for product use),
  available via self-host or Google Fonts. This is the reference site's Arabic font and is an
  ideal Arabic-first choice. **Adopted.**
- **Latin display & body: Cairo.** Cairo covers Latin with matching proportions, so the
  bilingual UI stays visually unified across a language switch — a real advantage for a
  product that flips between Arabic and English constantly. Use Cairo for Latin too.
- **Optional secondary Latin display** (labeled _secondary reference_, not required): a
  geometric like **Archivo** or **Poppins** may be used for very large Latin-only marketing
  moments if Cairo's Latin display ever feels too plain. Not needed for the product UI; do not
  introduce it into data screens.
- **Numeric/tabular: Cairo with `tabular-nums`.** For aligned data (counts, tables, axes) use
  Cairo with `font-variant-numeric: tabular-nums`. A monospace fallback stack is defined for
  code-like contexts only.

### Fallback stacks

```css
--fw-font-ar: "Cairo", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif;
--fw-font-latin: "Cairo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--fw-font-display: "Cairo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--fw-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
```

Because Cairo serves both scripts, a single `--fw-font-latin`/`--fw-font-ar` applied at the
root works for both directions; the Arabic stack simply names an Arabic-specific fallback
first for the (rare) no-Cairo case.

### Font loading recommendations

- **Self-host** Cairo woff2 subsets (Arabic + Latin) under the app; do not block on a third
  party. Preload the two most-used weights (700 display, 400/500 body).
- Use `font-display: swap` and provide a **size-adjusted fallback** (`Cairo Fallback`
  metrics) to minimize layout shift — mirrors the reference's `"Cairo Fallback"` approach.
- Ship only the weights used (see scale): 400, 500, 600, 700, 800, and 900 (Black) for the big
  occupancy number. Subset to Arabic + Latin + digits to keep files small (mobile-first).
- Do not rely on variable-font-only features for critical weights; name explicit weights.

### Type scale

Base = 16px (1rem). Sizes align to the reference's Tailwind-derived scale; large display
line-heights collapse toward 1.0 for athletic tightness, and Arabic body line-heights are set
a little looser than Latin to respect Arabic's taller glyphs and diacritics.

| Token               | Size             | Weight  | Line height                            | Tracking | Family   | Usage                                       |
| ------------------- | ---------------- | ------- | -------------------------------------- | -------- | -------- | ------------------------------------------- |
| `--fw-text-display` | clamp 56–88px    | 800–900 | 1.0                                    | -0.02em  | display  | Public occupancy number (see §5 numerals)   |
| `--fw-text-7xl`     | 4.5rem / 72px    | 800     | 1.0                                    | -0.02em  | display  | Hero headline (desktop)                     |
| `--fw-text-6xl`     | 3.75rem / 60px   | 800     | 1.02                                   | -0.02em  | display  | Large headline                              |
| `--fw-text-5xl`     | 3rem / 48px      | 700     | 1.05                                   | -0.01em  | display  | Section hero, big KPI value                 |
| `--fw-text-4xl`     | 2.25rem / 36px   | 700     | 1.12                                   | -0.01em  | display  | H1 (dashboard), KPI value                   |
| `--fw-text-3xl`     | 1.875rem / 30px  | 700     | 1.2                                    | 0        | display  | H2                                          |
| `--fw-text-2xl`     | 1.5rem / 24px    | 700     | 1.3                                    | 0        | display  | H3, card titles                             |
| `--fw-text-xl`      | 1.25rem / 20px   | 600     | 1.4                                    | 0        | latin/ar | H4, prominent labels                        |
| `--fw-text-lg`      | 1.125rem / 18px  | 500     | 1.55                                   | 0        | latin/ar | Lead paragraph, large body                  |
| `--fw-text-base`    | 1rem / 16px      | 400     | 1.65 (Ar, `--fw-lh-arabic`) / 1.5 (La) | 0        | latin/ar | Body default                                |
| `--fw-text-sm`      | 0.875rem / 14px  | 400–500 | 1.5                                    | 0        | latin/ar | Secondary text, controls, table cells       |
| `--fw-text-xs`      | 0.75rem / 12px   | 500–600 | 1.4                                    | 0.01em   | latin/ar | Badges, captions, timestamps                |
| `--fw-text-2xs`     | 0.6875rem / 11px | 600     | 1.3                                    | 0.02em   | latin/ar | Micro-labels, chart tick labels (sparingly) |

> Do not use `--fw-text-2xs` for anything a visitor must read to understand status.

### Numeral treatment

- **Use Western/English digits 0–9 exclusively** (45) across the entire product — occupancy
  counts, percentages, charts, dates, times, analytics, and CSV exports — in both the Arabic
  and English interfaces. Western digits are universally legible, reliably tabular, and common
  in Saudi digital products. There is no Eastern-Arabic-numeral option in v1 (decision recorded
  in `RESEARCH.md §18`).
- Use `Intl.NumberFormat`/`Intl.DateTimeFormat` for locale formatting, and force Latin digits
  in Arabic with the `-u-nu-latn` extension so numeral style never depends on the locale
  default: `new Intl.NumberFormat('ar-SA-u-nu-latn')`,
  `new Intl.DateTimeFormat('ar-SA-u-nu-latn')`.
- **Always** use tabular figures for any number that updates or aligns in a column:
  `font-variant-numeric: tabular-nums;` — prevents width jitter when the live count changes.

### Large occupancy-number styling

The public count is the single most important glyph in the product.

```css
.fw-occupancy-number {
  font-family: var(--fw-font-display);
  font-size: var(
    --fw-text-display
  ); /* clamp(3.5rem, 18vw, 5.5rem) — dominant on phone, capped on desktop */
  font-weight: 900; /* Cairo Black */
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--fw-text);
  text-align: center;
}
/* The count is an estimate: pair it with the explicit approximate-count label from §8.10.
   On approved Arabic public surfaces the label is "العدد التقريبي"; do not add "حوالي"
   or a person unit to the visible Public Live Desktop count. */
```

### Arabic ↔ English pairing rules

- One family (Cairo) for both keeps weight and rhythm consistent across the language toggle.
- Arabic runs **heavier and slightly looser**: prefer 700 for Arabic headings vs a possible
  600–700 for Latin, and give Arabic body `line-height: 1.6–1.7` vs Latin `1.5` (Arabic has
  no lowercase x-height but taller ascenders/diacritics).
- **Never italicize Arabic** (Arabic has no true italic). Use weight/color for emphasis. Avoid
  `letter-spacing` on Arabic (it breaks cursive joining) — only apply tracking to Latin/caps.
- Mixed strings (Arabic label + Latin number/brand) are common; keep them in one run and let
  the bidi algorithm order them (see §14).

### Mobile type behavior

- Scale display sizes down with `clamp()`; the hero headline should not exceed ~2 lines on a
  360px screen. The **occupancy number stays dominant** at all sizes.
- Body minimum on mobile is 16px (`--fw-text-base`) to avoid iOS zoom-on-focus and preserve
  legibility. Never drop essential status text below 14px.
- Keep line length in check: body text column max ~68ch (§6).

### Weight usage rules

- **900 (Black):** the public occupancy number only.
- **800:** hero/display headlines.
- **700:** section headings, card titles, KPI values, primary button label, status labels.
- **600:** buttons, badges, tabs, emphasized inline labels.
- **500:** secondary text, table headers, controls.
- **400:** body copy.
- Do not use weights below 400 in the UI; thin Arabic weights lose legibility on dark screens.

---

## 6. Spacing and Layout

### Base spacing unit

**4px** (`--fw-space-1 = 0.25rem`), matching the reference's `--spacing: .25rem`. All spacing
is a multiple of 4; most layout uses the 8px rhythm.

### Spacing scale

| Token           | px  | Typical use                               |
| --------------- | --- | ----------------------------------------- |
| `--fw-space-0`  | 0   | reset                                     |
| `--fw-space-1`  | 4   | icon/text gap, hairline insets            |
| `--fw-space-2`  | 8   | tight control padding, chip gap           |
| `--fw-space-3`  | 12  | compact card padding, input padding-block |
| `--fw-space-4`  | 16  | default gutter, card padding (mobile)     |
| `--fw-space-5`  | 20  | control padding-inline                    |
| `--fw-space-6`  | 24  | card padding (desktop), grid gap          |
| `--fw-space-8`  | 32  | block spacing, card group gap             |
| `--fw-space-10` | 40  | small section padding                     |
| `--fw-space-12` | 48  | section padding (mobile)                  |
| `--fw-space-16` | 64  | section padding (tablet)                  |
| `--fw-space-20` | 80  | section padding (desktop)                 |
| `--fw-space-24` | 96  | large section padding                     |
| `--fw-space-32` | 128 | hero vertical rhythm (desktop)            |

### Container widths

| Token                      | Value          | Usage                                                                              |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| `--fw-container-public`    | 34rem / 544px  | Narrow/mobile public states; G1B desktop uses the page gutters and one wide dominant card |
| `--fw-container-content`   | 48rem / 768px  | Long-form/legal/transparency text                                                  |
| `--fw-container-dashboard` | 80rem / 1280px | Staff/owner dashboards (matches reference `--container-7xl`)                       |
| `--fw-measure`             | 68ch           | Max readable text width for paragraphs                                             |

### Grid system

- **12-column** fluid grid for dashboards; `gap: var(--fw-space-6)` (24px) desktop,
  `var(--fw-space-4)` (16px) mobile.
- Public pages use one dominant surface. G1B desktop contains an internal parallel metric
  split; it does not create competing outer columns or additional cards.
- Use CSS Grid with logical alignment (`justify-items`, `align-items`), never left/right
  floats, so RTL is automatic.

### Section padding

- Mobile: `padding-block: var(--fw-space-12)` (48px).
- Tablet: `var(--fw-space-16)` (64px).
- Desktop: `var(--fw-space-20)` (80px), hero up to `--fw-space-32`.

### Gutters (page inline padding)

- **Mobile gutter:** `var(--fw-space-4)` (16px). Phone portrait is the primary target.
- **Tablet gutter:** `var(--fw-space-6)` (24px).
- **Desktop gutter:** `var(--fw-space-8)` (32px), content capped by container width.

### Maximum readable text width

`--fw-measure: 68ch`. Paragraph containers set `max-inline-size: var(--fw-measure)`.

### Card-grid behavior

- KPI/analytics cards: `repeat(auto-fit, minmax(240px, 1fr))` with `gap: var(--fw-space-4/6)`.
- 1 column < 480px, 2 up to ~768px, 3–4 on desktop. Cards never shrink below 240px inline.
- Public occupancy sub-cards (open/closed, freshness, trend) stack vertically on phone.

### Dashboard layout

- Optional collapsible side nav on the **inline-start** (right in RTL, left in LTR) at ≥ lg;
  a bottom tab bar or drawer on phone.
- Content region uses the 12-col grid; charts span full width on phone, 6–8 cols on desktop.
- Sticky dashboard header (KPI summary / date-range) with `--fw-z-sticky`.

### RTL alignment rules

- Default text alignment is `start` (never hard `left/right`). Numbers/charts keep their own
  internal direction (see §9, §14).
- All spacing uses **logical properties** (`padding-inline`, `margin-inline-start`,
  `inset-inline-*`) so mirroring is automatic. No physical `left/right` in layout CSS.

### Density verdict and reasoning

**Airy on the public page, moderately compact on dashboards.** The visitor page must breathe
so the number and band dominate at a glance — generous padding, one thing at a time. The
owner dashboard packs more per screen (KPI grids, tables, heatmap) but stays on the 8px rhythm
with clear grouping. This mirrors the reference's airy marketing spacing for the public
surface while acknowledging that operational density is a feature, not clutter, for the owner.

---

## 7. Radii, Shadows, Borders, and Surfaces

### Radius scale

| Token              | Value | Usage                                                         |
| ------------------ | ----- | ------------------------------------------------------------- |
| `--fw-radius-xs`   | 4px   | Tiny chips, heatmap cells                                     |
| `--fw-radius-sm`   | 6px   | Inputs (compact), tags                                        |
| `--fw-radius-md`   | 8px   | **Buttons, inputs, selects** (matches reference `rounded-lg`) |
| `--fw-radius-lg`   | 12px  | Small cards, toasts, menus                                    |
| `--fw-radius-xl`   | 16px  | Cards, KPI cards (reference `rounded-2xl`)                    |
| `--fw-radius-2xl`  | 24px  | Feature/hero cards, modals (reference `rounded-3xl`)          |
| `--fw-radius-3xl`  | 32px  | Large hero occupancy card                                     |
| `--fw-radius-pill` | 999px | Status badges, filter pills, meter ends, avatars              |

### Corner-language verdict

**Rounded, confident, never sharp; pill for status.** Buttons/inputs at 8px, cards at 16–24px,
status chips fully pilled. This matches the observed reference range (8→24px + pill) and reads
as modern-athletic without being toy-like. No 0px sharp corners anywhere in the product.

### Shadow scale

Elevation is expressed with **soft, large, low-opacity shadows** plus a 1px inset hairline —
and a signature **red-glow** for interactive/hover states, adapted from the reference's
`--card-shadow-hover`.

| Token                  | Value                                                                    | Usage                                                                   |
| ---------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `--fw-shadow-sm`       | `0 1px 2px rgba(0,0,0,0.30), 0 0 0 1px var(--fw-border-subtle)`          | Inputs, small controls                                                  |
| `--fw-shadow-md`       | `0 8px 24px -8px rgba(0,0,0,0.45), 0 0 0 1px var(--fw-border-subtle)`    | Cards, menus                                                            |
| `--fw-shadow-lg`       | `0 20px 60px -15px rgba(0,0,0,0.55), 0 0 0 1px var(--fw-border-subtle)`  | Modals, popovers (reference `--card-shadow`)                            |
| `--fw-shadow-xl`       | `0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px var(--fw-border-subtle)`   | Hero occupancy card                                                     |
| `--fw-shadow-red-glow` | `0 20px 60px -18px rgba(227,24,55,0.35), 0 0 0 1px rgba(227,24,55,0.30)` | Interactive card hover, live/emphasis (reference `--card-shadow-hover`) |
| `--fw-shadow-focus`    | `0 0 0 3px var(--fw-focus-ring)`                                         | Keyboard focus ring                                                     |

### Border conventions

- Default separators/outlines: `1px solid var(--fw-border)`.
- Hairlines/dividers: `1px solid var(--fw-border-subtle)`.
- Emphasis/active outlines: `1px solid var(--fw-border-strong)`.
- Status outlines use the role color at reduced alpha (`rgba(...,0.30)`), matching the pill
  eyebrow pattern (`border-[#e31837]/30`).

### Cards

`background: var(--fw-surface-1); border: 1px solid var(--fw-border-subtle); box-shadow:
var(--fw-shadow-md); border-radius: var(--fw-radius-xl);` — the default matte card.

### Elevated surfaces

Use `--fw-surface-2` (raised) or `--fw-surface-3` (top layer / hover). Increase shadow one
step per elevation level; never stack more than three visible elevation levels.

### Interactive surfaces

Cards/rows that are clickable get a hover transition to `--fw-surface-3` and, when they carry
live data, may adopt `--fw-shadow-red-glow` on hover. Always also expose a focus ring; hover
alone is not an affordance.

### Modal and dialog treatment

`background: var(--fw-surface-1); border: 1px solid var(--fw-border); border-radius:
var(--fw-radius-2xl); box-shadow: var(--fw-shadow-lg);` over a `--fw-overlay` backdrop.
Destructive dialogs add a `--fw-error` accent bar/icon (§8).

### Chart-card treatment

Chart containers sit on `--fw-surface-1` with an **inset plot well** (`--fw-surface-inset`),
`--fw-radius-xl`, `--fw-shadow-md`, and a title/legend row above the plot. Grid lines and axes
use `--fw-chart-grid`/`--fw-chart-axis`.

### Focus-ring treatment

A single, consistent, high-contrast ring: `--fw-shadow-focus` using `--fw-focus-ring`
(`rgba(255,45,77,0.70)`) via `:focus-visible`. On red surfaces the ring switches to white
(`rgba(255,255,255,0.9)`) for contrast (see §8 button CSS).

---

## 8. Component Specifications

All CSS uses the documented custom properties, **logical properties** for RTL/LTR safety, and
includes hover / active / `:focus-visible` / disabled / loading / error states where
applicable. No framework dependencies. Assume the token block from §17 is present.

### 8.1 Buttons — shared base

```css
.fw-btn {
  --_bg: transparent;
  --_fg: var(--fw-text);
  --_bd: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--fw-space-2);
  min-block-size: 44px; /* touch target */
  padding-block: var(--fw-space-3);
  padding-inline: var(--fw-space-5);
  font-family: var(--fw-font-latin);
  font-size: var(--fw-text-base);
  font-weight: 600;
  line-height: 1;
  color: var(--_fg);
  background: var(--_bg);
  border: 1px solid var(--_bd);
  border-radius: var(--fw-radius-md);
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  transition:
    background-color var(--fw-dur-fast) var(--fw-ease-standard),
    color var(--fw-dur-fast) var(--fw-ease-standard),
    border-color var(--fw-dur-fast) var(--fw-ease-standard),
    box-shadow var(--fw-dur-fast) var(--fw-ease-standard),
    transform var(--fw-dur-fast) var(--fw-ease-standard);
}
.fw-btn:focus-visible {
  outline: none;
  box-shadow: var(--fw-shadow-focus);
}
.fw-btn:active {
  transform: translateY(1px);
}
.fw-btn:disabled,
.fw-btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
/* Loading: hide label, show spinner, keep width */
.fw-btn[data-loading="true"] {
  color: transparent;
  pointer-events: none;
  position: relative;
}
.fw-btn[data-loading="true"]::after {
  content: "";
  position: absolute;
  inline-size: 1.1em;
  block-size: 1.1em;
  border: 2px solid currentColor;
  border-block-start-color: transparent;
  border-radius: var(--fw-radius-pill);
  animation: fw-spin var(--fw-dur-slower) linear infinite;
  color: var(--_fg);
}
/* Reduced motion: the global rule (§10, §17) freezes the spinner to a static ring — that is
   the intended treatment. Loading stays perceivable without motion: the button keeps
   aria-busy="true" plus a text/sr-only "جارٍ التحميل" (loading) indication. */
@media (prefers-reduced-motion: reduce) {
  .fw-btn,
  .fw-btn:active {
    transition-duration: 1ms;
  }
}
```

### 8.2 Primary button

```css
.fw-btn--primary {
  --_bg: var(--fw-primary);
  --_fg: var(--fw-on-primary);
  --_bd: transparent;
}
.fw-btn--primary:hover {
  --_bg: var(--fw-primary-hover);
}
.fw-btn--primary:active {
  --_bg: var(--fw-primary-pressed);
}
/* Focus ring switches to white on the red fill for contrast */
.fw-btn--primary:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
}
/* Optional athletic arrow nudge (reference pattern) — motion-safe */
.fw-btn--primary .fw-btn__icon {
  transition: transform var(--fw-dur-base) var(--fw-ease-standard);
}
.fw-btn--primary:hover .fw-btn__icon {
  transform: translateX(-2px);
} /* toward inline-end (forward) in RTL */
[dir="ltr"] .fw-btn--primary:hover .fw-btn__icon {
  transform: translateX(2px);
}
```

### 8.3 Secondary button

```css
.fw-btn--secondary {
  --_bg: var(--fw-surface-2);
  --_fg: var(--fw-text);
  --_bd: var(--fw-border);
}
.fw-btn--secondary:hover {
  --_bg: var(--fw-surface-3);
  --_bd: var(--fw-border-strong);
}
.fw-btn--secondary:active {
  --_bg: var(--fw-surface-3);
}
```

### 8.4 Ghost button

```css
.fw-btn--ghost {
  --_bg: transparent;
  --_fg: var(--fw-text);
  --_bd: var(--fw-border-strong);
  backdrop-filter: blur(6px); /* reference ghost pattern */
}
.fw-btn--ghost:hover {
  --_bg: rgba(255, 255, 255, 0.08);
}
.fw-btn--ghost:active {
  --_bg: rgba(255, 255, 255, 0.12);
}
```

### 8.5 Destructive button

```css
.fw-btn--destructive {
  --_bg: transparent;
  --_fg: var(--fw-error-fg); /* readable red on dark */
  --_bd: rgba(227, 24, 55, 0.45);
}
.fw-btn--destructive:hover {
  --_bg: var(--fw-error);
  --_fg: var(--fw-on-primary);
  --_bd: transparent;
}
.fw-btn--destructive:active {
  --_bg: var(--fw-primary-pressed);
}
.fw-btn--destructive:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 92, 116, 0.7);
}
/* Reset is the most dangerous action: solid red requires an explicit confirm step (§8.30) */
.fw-btn--destructive-solid {
  --_bg: var(--fw-error);
  --_fg: var(--fw-on-primary);
  --_bd: transparent;
}
.fw-btn--destructive-solid:hover {
  --_bg: var(--fw-primary-hover);
}
```

### 8.6 Icon button

```css
.fw-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 44px;
  min-block-size: 44px; /* touch target */
  inline-size: 44px;
  block-size: 44px;
  color: var(--fw-text-muted);
  background: transparent;
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius-pill);
  cursor: pointer;
  transition:
    color var(--fw-dur-fast) var(--fw-ease-standard),
    background-color var(--fw-dur-fast) var(--fw-ease-standard),
    border-color var(--fw-dur-fast) var(--fw-ease-standard);
}
.fw-icon-btn:hover {
  color: var(--fw-text);
  background: var(--fw-surface-3);
  border-color: var(--fw-border-strong);
}
.fw-icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--fw-shadow-focus);
}
.fw-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 8.6b Small button

```css
.fw-btn--sm {
  min-block-size: 36px; /* still ≥ 32; use only on dense dashboard rows */
  padding-block: var(--fw-space-2);
  padding-inline: var(--fw-space-4);
  font-size: var(--fw-text-sm);
  border-radius: var(--fw-radius-sm);
}
```

### 8.7 Navigation (desktop)

```css
.fw-nav {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: var(--fw-z-sticky);
  block-size: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--fw-space-8);
  background: var(--fw-glass-bg);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-block-end: 1px solid var(--fw-border-subtle);
  transition:
    background-color var(--fw-dur-slow) var(--fw-ease-standard),
    border-color var(--fw-dur-slow) var(--fw-ease-standard);
}
.fw-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-3);
}
.fw-nav__logo {
  block-size: 40px;
  inline-size: auto;
} /* white mark on the dark bar */
.fw-nav__links {
  display: flex;
  align-items: center;
  gap: var(--fw-space-6);
}
.fw-nav__link {
  color: var(--fw-text-muted);
  font-weight: 500;
  font-size: var(--fw-text-sm);
  text-decoration: none;
  padding-block: var(--fw-space-2);
  transition: color var(--fw-dur-fast) var(--fw-ease-standard);
}
.fw-nav__link:hover {
  color: var(--fw-text);
}
.fw-nav__link[aria-current="page"] {
  color: var(--fw-primary-light);
}
.fw-nav__link:focus-visible {
  outline: none;
  box-shadow: var(--fw-shadow-focus);
  border-radius: var(--fw-radius-sm);
}
/* RTL: flex + logical padding mirror automatically; brand-first DOM + space-between puts
   the logo at inline-start (right in RTL, matching the reference screenshots) */
```

### 8.8 Mobile navigation (drawer)

```css
.fw-mnav {
  position: fixed;
  inset: 0;
  z-index: var(--fw-z-modal);
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--fw-bg);
  padding: var(--fw-space-4);
  transform: translateX(-100%); /* off-canvas toward inline-end — the left in RTL (default) */
  transition: transform var(--fw-dur-slow) var(--fw-ease-standard);
}
[dir="ltr"] .fw-mnav {
  transform: translateX(100%);
}
.fw-mnav[data-open="true"] {
  transform: translateX(0);
}
.fw-mnav__item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--fw-space-3);
  min-block-size: 48px;
  padding-inline: var(--fw-space-3);
  color: var(--fw-text);
  font-size: var(--fw-text-xl);
  font-weight: 600;
  text-align: start;
  text-decoration: none;
  border-block-end: 1px solid var(--fw-border-subtle);
}
.fw-mnav__item[aria-current="page"] {
  color: var(--fw-primary-light);
}
.fw-mnav__item[aria-current="page"]::before {
  content: "";
  inline-size: 8px;
  block-size: 8px;
  border-radius: var(--fw-radius-pill);
  background: var(--fw-primary); /* red active dot (reference pattern) */
}
.fw-mnav__cta {
  display: grid;
  gap: var(--fw-space-2);
} /* bottom-pinned actions */
@media (prefers-reduced-motion: reduce) {
  .fw-mnav {
    transition-duration: 1ms;
  }
}
```

### 8.9 Public occupancy hero

The centerpiece composes the count (§8.10), crowd state (§8.11), qualitative crowd scale
(§8.12), open/closed state (§8.13), and freshness (§8.14).

At the locked 1440×900 Arabic desktop reference, use **G1B — Global Header + Parallel
Split + Structural Skeleton**:

1. a minimal global header containing the unchanged FITWAY logo and `English` action;
2. one dominant card;
3. an inline global open-state row above the metrics;
4. a parallel split between crowd level and approximate count;
5. exactly one subtle structural vertical divider between those metrics;
6. a non-numeric four-state crowd rail and compact freshness line below.

The approved artifact's percentage is historical visual provenance, not current/default
shipping product content. While the server-controlled percentage disclosure is disabled,
preserve the rail's structural rhythm by rendering the active qualitative band, never by
reconstructing a hidden ratio. Any future percentage line requires the optional server field
and owner-controlled contract frozen in `SPEC.md`.

Do not add horizontal section dividers, extra cards, charts, widgets, staff information,
diagnostics, or marketing content. This desktop rule replaces the earlier centered
single-column Public Live Desktop composition. Smaller viewports still follow the responsive,
overflow, and content-preservation rules elsewhere in this guide; G1B does not invent a new
mobile composition.

```css
.fw-public-live-card {
  inline-size: 100%;
  background: var(--fw-surface-1);
  border: 1px solid var(--fw-border-subtle);
  border-radius: var(--fw-radius-2xl);
}
.fw-public-live__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.fw-public-live__metric + .fw-public-live__metric {
  border-inline-start: 1px solid var(--fw-border-subtle);
}
```

### 8.10 Approximate count display

```css
.fw-count {
  display: grid;
  align-content: start;
  gap: var(--fw-space-2);
  color: var(--fw-text);
}
.fw-count__label {
  font-size: var(--fw-text-sm);
  font-weight: 600;
  color: var(--fw-text-subtle);
}
.fw-count__value {
  font-family: var(--fw-font-display);
  font-size: var(--fw-text-display);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
/* Screen-reader phrasing uses the same meaning, e.g. "العدد التقريبي: 37". */
```

Approved Arabic Public Live Desktop markup: `العدد التقريبي` (label) + `37` (isolated
Western-digit value). The label carries the approximation semantics; do not append `حوالي`
or `شخصًا` to this visible composition.

### 8.11 Crowd-state badge

The reusable badge below remains valid for non-G1B surfaces and component/state samples. On
the approved Public Live Desktop, do not wrap the crowd state in a filled or bordered pill.
Render the visible label `مستوى الازدحام`, the value `متوسط`, and its structural status glyph
as one side of the parallel metric split. Text and the progress-rail position preserve meaning
without relying on color.

```css
.fw-crowd {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-2);
  padding-block: var(--fw-space-2);
  padding-inline: var(--fw-space-4);
  border-radius: var(--fw-radius-pill);
  font-weight: 700;
  font-size: var(--fw-text-sm);
  border: 1px solid transparent;
}
.fw-crowd__dot {
  inline-size: 10px;
  block-size: 10px;
  border-radius: var(--fw-radius-pill);
  background: currentColor;
}
.fw-crowd__icon {
  inline-size: 1.1em;
  block-size: 1.1em;
} /* distinct glyph per state */
.fw-crowd--quiet {
  color: var(--fw-quiet-fg);
  background: var(--fw-quiet-bg);
  border-color: rgba(34, 197, 94, 0.3);
}
.fw-crowd--moderate {
  color: var(--fw-moderate-fg);
  background: var(--fw-moderate-bg);
  border-color: rgba(234, 179, 8, 0.3);
}
.fw-crowd--busy {
  color: var(--fw-busy-fg);
  background: var(--fw-busy-bg);
  border-color: rgba(249, 115, 22, 0.3);
}
.fw-crowd--packed {
  color: var(--fw-packed-fg);
  background: var(--fw-packed-bg);
  border-color: rgba(227, 24, 55, 0.35);
}
/* Label text is ALWAYS present next to the dot: مزدحم / Busy — never dot-only */
```

### 8.12 Qualitative crowd scale

The shipping public surface uses four equal categorical segments: Quiet, Moderate, Busy, and
Packed. Exactly one segment is active. Its position, the adjacent written band, and the band
icon reinforce the state without exposing capacity, a denominator, or a derived percentage.
It is not a progress meter and never receives numeric ARIA range attributes.

```css
.fw-crowd-scale {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: var(--fw-space-2);
  inline-size: 100%;
}
.fw-crowd-scale__segment {
  block-size: 9px;
  border: 1px solid var(--fw-border-subtle);
  border-radius: var(--fw-radius-pill);
  background: var(--fw-surface-3);
}
.fw-crowd-scale__segment[aria-current="true"] {
  transform: scaleY(1.5);
  background: var(--_band-color);
}
.fw-crowd-scale--stale .fw-crowd-scale__segment[aria-current="true"] {
  opacity: 0.6;
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 6px,
    rgba(255, 255, 255, 0.14) 6px 10px
  );
}
@media (prefers-reduced-motion: reduce) {
  .fw-crowd-scale__segment {
    transition: none;
  }
}
```

Expose the group as an image/text equivalent such as `role="img"` with localized label
`"مستوى الازدحام: متوسط"` / `"Crowd level: Moderate"`. The segment spans themselves are
decorative. The visible band label remains mandatory, so neither color nor rail position is
the sole channel.

### 8.13 Open / closed badge

On the approved Public Live Desktop, the open state is a global inline status row above the
metric split. Its exact Arabic text is `النادي مفتوح الآن`. It uses a small green dot and
white status text with no filled background, border, rounded container, or button-like
treatment. Closed-state composition remains governed by the separate closed-state rules.

```css
.fw-status-open {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-2);
  font-weight: 600;
  font-size: var(--fw-text-base);
  color: var(--fw-text);
  background: transparent;
  border: 0;
}
.fw-status-closed {
  padding-block: var(--fw-space-1);
  padding-inline: var(--fw-space-3);
  border-radius: var(--fw-radius-pill);
  color: var(--fw-text-subtle);
  background: var(--fw-surface-2);
}
.fw-status-open__dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: var(--fw-radius-pill);
  background: var(--fw-success);
}
/* Closed shows next-open text: "مغلق الآن — يفتح 6:00 ص" — never a live count while closed */
```

### 8.14 Freshness indicator

```css
.fw-fresh {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-2);
  font-size: var(--fw-text-xs);
  color: var(--fw-text-subtle);
  font-variant-numeric: tabular-nums;
}
.fw-fresh__dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: var(--fw-radius-pill);
  background: var(--fw-success);
}
.fw-fresh--fresh .fw-fresh__dot {
  background: var(--fw-success);
  animation: fw-pulse 2s var(--fw-ease-standard) infinite;
}
.fw-fresh--stale {
  color: var(--fw-stale-fg);
}
.fw-fresh--stale .fw-fresh__dot {
  background: var(--fw-stale);
  animation: none;
}
.fw-fresh--offline {
  color: var(--fw-offline-fg);
}
.fw-fresh--offline .fw-fresh__dot {
  background: var(--fw-offline);
}
@media (prefers-reduced-motion: reduce) {
  .fw-fresh--fresh .fw-fresh__dot {
    animation: none;
  }
}
/* Approved fresh Arabic composition:
   "تحديث مباشر · آخر تحديث 2:59 م · قبل 30 ثانية".
   Isolate the 2:59 and 30 digit runs independently for stable RTL/Bidi order. */
```

### 8.15 Stale-data warning

```css
.fw-stale-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--fw-space-3);
  padding: var(--fw-space-4);
  background: var(--fw-stale-bg);
  border: 1px solid rgba(217, 164, 0, 0.3);
  border-radius: var(--fw-radius-lg);
  color: var(--fw-stale-fg);
}
.fw-stale-banner__icon {
  flex: none;
  inline-size: 20px;
  block-size: 20px;
}
.fw-stale-banner__body {
  font-size: var(--fw-text-sm);
}
/* Copy pattern: "التحديثات المباشرة متأخرة — آخر عدد تقريبي معروف 45 عند 7:32 م" */
/* The live number is visually dimmed and labeled last-known; NEVER shown as current. */
```

### 8.16 Offline state

```css
.fw-offline-banner {
  display: flex;
  align-items: center;
  gap: var(--fw-space-3);
  padding: var(--fw-space-4);
  background: var(--fw-offline-bg);
  border: 1px solid rgba(138, 143, 153, 0.3);
  border-radius: var(--fw-radius-lg);
  color: var(--fw-text-muted);
}
.fw-offline-banner__icon {
  color: var(--fw-offline);
  inline-size: 20px;
  block-size: 20px;
}
/* Public copy: "التحديث المباشر غير متاح الآن". Staff copy adds device/counter health +
   a direct count-entry CTA (§8.29b) so the public page keeps showing something real. */
```

### 8.17 Trend indicator

Vertical arrows only (↑ busier, ↓ emptying, → stable) to avoid RTL horizontal-arrow ambiguity,
always with a text label. Shown only when reliable (`RESEARCH.md §4`); otherwise omitted.

```css
.fw-trend {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-1);
  font-size: var(--fw-text-sm);
  font-weight: 600;
}
.fw-trend--up {
  color: var(--fw-busy-fg);
} /* getting busier */
.fw-trend--down {
  color: var(--fw-quiet-fg);
} /* emptying out */
.fw-trend--flat {
  color: var(--fw-text-subtle);
}
.fw-trend__icon {
  inline-size: 1em;
  block-size: 1em;
} /* up/down chevron, not left/right */
/* Text label required: "يزداد ازدحامًا" / "يخف" / "مستقر" */
```

### 8.18 Cards (base)

```css
.fw-card {
  background: var(--fw-surface-1);
  border: 1px solid var(--fw-border-subtle);
  border-radius: var(--fw-radius-xl);
  box-shadow: var(--fw-shadow-md);
  padding: var(--fw-space-6);
}
.fw-card--interactive {
  cursor: pointer;
  transition:
    box-shadow var(--fw-dur-base) var(--fw-ease-standard),
    border-color var(--fw-dur-base) var(--fw-ease-standard),
    transform var(--fw-dur-base) var(--fw-ease-standard);
}
.fw-card--interactive:hover {
  box-shadow: var(--fw-shadow-red-glow);
  border-color: rgba(227, 24, 55, 0.25);
}
.fw-card--interactive:focus-within {
  box-shadow: var(--fw-shadow-focus);
}
@media (prefers-reduced-motion: reduce) {
  .fw-card--interactive {
    transition: none;
  }
}
```

### 8.19 KPI cards

```css
.fw-kpi {
  display: grid;
  gap: var(--fw-space-2);
  background: var(--fw-surface-1);
  border: 1px solid var(--fw-border-subtle);
  border-radius: var(--fw-radius-xl);
  padding: var(--fw-space-5);
}
.fw-kpi__label {
  font-size: var(--fw-text-sm);
  color: var(--fw-text-subtle);
  font-weight: 500;
  text-align: start;
}
.fw-kpi__value {
  font-family: var(--fw-font-display);
  font-size: var(--fw-text-4xl);
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--fw-text);
}
.fw-kpi__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-1);
  font-size: var(--fw-text-sm);
  font-weight: 600;
}
/* Direction and valence are DECOUPLED. The arrow (↑ / ↓ / →) states which way the metric
   moved; the modifier states whether that movement is good, bad, or neutral for THIS metric.
   Assign valence per metric meaning — never automatically by direction. */
.fw-kpi__delta--positive {
  color: var(--fw-success-fg);
}
.fw-kpi__delta--negative {
  color: var(--fw-error-fg);
}
.fw-kpi__delta--neutral {
  color: var(--fw-text-subtle);
}
/* Honesty sublabel for visits/entries KPIs (RESEARCH §5) */
.fw-kpi__note {
  font-size: var(--fw-text-xs);
  color: var(--fw-text-subtle);
  text-align: start;
}
/* Delta pairs an arrow + sign + text so it never depends on color alone */
```

For occupancy-related KPIs, "higher" does not mean "better" — valence is context-dependent
and assigned per metric: week-over-week **visits up** is `--positive` for the owner and
**visits down** is `--negative`; **peak occupancy nearing capacity** is `--neutral`
(attention), never presented as "good". The trend indicator (§8.17) already follows this
direction/valence decoupling. Every visits/entries KPI must carry the honesty sublabel
(`.fw-kpi__note`, per `RESEARCH.md §5`): "تقدير عبور المدخل — ليس أعضاء فريدين" /
"Estimated entrance crossings — not unique members".

### 8.20 Analytics chart container

```css
.fw-chart {
  background: var(--fw-surface-1);
  border: 1px solid var(--fw-border-subtle);
  border-radius: var(--fw-radius-xl);
  box-shadow: var(--fw-shadow-md);
  padding: var(--fw-space-5);
  display: grid;
  gap: var(--fw-space-4);
}
.fw-chart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fw-space-3);
}
.fw-chart__title {
  font-size: var(--fw-text-lg);
  font-weight: 700;
  color: var(--fw-text);
  text-align: start;
}
.fw-chart__plot {
  background: var(--fw-surface-inset);
  border-radius: var(--fw-radius-lg);
  padding: var(--fw-space-4);
  min-block-size: 220px;
}
```

### 8.21 Heatmap cells

```css
.fw-heat {
  display: grid;
  gap: 3px;
} /* grid-template set by data: 7 rows (days) × 24 cols (hours) or transposed */
.fw-heat__cell {
  aspect-ratio: 1;
  border-radius: var(--fw-radius-xs);
  background: var(--_c, var(--fw-heat-0));
  transition: transform var(--fw-dur-fast) var(--fw-ease-standard);
}
.fw-heat__cell:hover,
.fw-heat__cell:focus-visible {
  transform: scale(1.08);
  outline: none;
  box-shadow: var(--fw-shadow-focus);
  z-index: 1;
}
.fw-heat__cell--empty {
  background: var(--fw-heat-empty);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.06) 3px,
    rgba(255, 255, 255, 0.06) 6px
  );
}
/* Each cell has aria-label with day, hour, value (§9, §15). Column/row headers are localized. */
@media (prefers-reduced-motion: reduce) {
  .fw-heat__cell {
    transition: none;
  }
}
```

### 8.22 Date-range control

```css
.fw-daterange {
  display: inline-flex;
  align-items: center;
  gap: var(--fw-space-1);
  background: var(--fw-surface-2);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius-md);
  padding: var(--fw-space-1);
}
.fw-daterange__preset {
  min-block-size: 36px;
  padding-inline: var(--fw-space-3);
  border-radius: var(--fw-radius-sm);
  background: transparent;
  color: var(--fw-text-muted);
  font-size: var(--fw-text-sm);
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.fw-daterange__preset[aria-pressed="true"] {
  background: var(--fw-primary);
  color: var(--fw-on-primary);
}
.fw-daterange__preset:hover {
  color: var(--fw-text);
}
.fw-daterange__preset:focus-visible {
  outline: none;
  box-shadow: var(--fw-shadow-focus);
}
/* Presets localized: اليوم / 7 أيام / 30 يومًا / مخصص. Custom opens a calendar (RTL month grid). */
```

### 8.23 Inputs

```css
.fw-input {
  inline-size: 100%;
  min-block-size: 44px;
  padding-block: var(--fw-space-3);
  padding-inline: var(--fw-space-4);
  font-family: var(--fw-font-latin);
  font-size: var(--fw-text-base);
  color: var(--fw-text);
  background: var(--fw-surface-2);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius-md);
  text-align: start; /* RTL-safe */
  transition:
    border-color var(--fw-dur-fast) var(--fw-ease-standard),
    box-shadow var(--fw-dur-fast) var(--fw-ease-standard);
}
.fw-input::placeholder {
  color: var(--fw-text-faint);
}
.fw-input:hover {
  border-color: var(--fw-border-strong);
}
.fw-input:focus-visible {
  outline: none;
  border-color: var(--fw-primary);
  box-shadow: var(--fw-shadow-focus);
}
.fw-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fw-input[aria-invalid="true"] {
  border-color: var(--fw-error);
  box-shadow: 0 0 0 3px rgba(227, 24, 55, 0.25);
}
.fw-field__error {
  color: var(--fw-error-fg);
  font-size: var(--fw-text-sm);
  margin-block-start: var(--fw-space-1);
}
.fw-field__label {
  display: block;
  font-size: var(--fw-text-sm);
  font-weight: 500;
  color: var(--fw-text-muted);
  margin-block-end: var(--fw-space-1);
  text-align: start;
}
```

### 8.24 Selects

```css
.fw-select {
  position: relative;
  display: inline-block;
  inline-size: 100%;
}
.fw-select__control {
  /* inherits .fw-input styling */
  padding-inline-end: var(--fw-space-8); /* room for the chevron on the inline-end */
  appearance: none;
  cursor: pointer;
}
.fw-select__chevron {
  position: absolute;
  inset-inline-end: var(--fw-space-3);
  inset-block-start: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--fw-text-subtle);
}
/* Native <select> option list follows OS direction; for custom listboxes align text: start */
```

### 8.25 Tabs

```css
.fw-tabs {
  display: flex;
  gap: var(--fw-space-1);
  border-block-end: 1px solid var(--fw-border-subtle);
}
.fw-tab {
  min-block-size: 44px;
  padding-inline: var(--fw-space-4);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--fw-text-subtle);
  font-weight: 600;
  font-size: var(--fw-text-sm);
  border-block-end: 2px solid transparent;
  margin-block-end: -1px;
  transition:
    color var(--fw-dur-fast) var(--fw-ease-standard),
    border-color var(--fw-dur-fast) var(--fw-ease-standard);
}
.fw-tab:hover {
  color: var(--fw-text);
}
.fw-tab[aria-selected="true"] {
  color: var(--fw-text);
  border-block-end-color: var(--fw-primary);
}
.fw-tab:focus-visible {
  outline: none;
  box-shadow: var(--fw-shadow-focus);
  border-radius: var(--fw-radius-sm);
}
/* Tabs are keyboard-navigable (roving tabindex); order follows reading direction (RTL). */
```

### 8.26 Alerts (inline)

```css
.fw-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--fw-space-3);
  padding: var(--fw-space-4);
  border-radius: var(--fw-radius-lg);
  border: 1px solid transparent;
  font-size: var(--fw-text-sm);
}
.fw-alert__icon {
  flex: none;
  inline-size: 20px;
  block-size: 20px;
  margin-block-start: 2px;
}
.fw-alert__title {
  font-weight: 700;
  margin-block-end: var(--fw-space-1);
}
.fw-alert--success {
  background: var(--fw-success-bg);
  border-color: rgba(22, 163, 74, 0.3);
  color: var(--fw-success-fg);
}
.fw-alert--warning {
  background: var(--fw-warning-bg);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--fw-warning-fg);
}
.fw-alert--error {
  background: var(--fw-error-bg);
  border-color: rgba(227, 24, 55, 0.35);
  color: var(--fw-error-fg);
}
.fw-alert--info {
  background: var(--fw-info-bg);
  border-color: rgba(46, 125, 246, 0.3);
  color: var(--fw-info-fg);
}
.fw-alert--stale {
  background: var(--fw-stale-bg);
  border-color: rgba(217, 164, 0, 0.3);
  color: var(--fw-stale-fg);
}
.fw-alert--offline {
  background: var(--fw-offline-bg);
  border-color: rgba(138, 143, 153, 0.3);
  color: var(--fw-text-muted);
}
/* Title text carries the meaning; the icon reinforces it. Never color-only. */
```

### 8.27 Toasts

```css
.fw-toast-region {
  position: fixed;
  inset-block-end: var(--fw-space-4);
  inset-inline: var(--fw-space-4);
  z-index: var(--fw-z-toast);
  display: grid;
  gap: var(--fw-space-2);
  justify-items: stretch;
  pointer-events: none;
}
.fw-toast {
  pointer-events: auto;
  max-inline-size: 24rem;
  margin-inline-start: auto; /* anchors to inline-end */
  display: flex;
  align-items: center;
  gap: var(--fw-space-3);
  padding: var(--fw-space-3) var(--fw-space-4);
  background: var(--fw-surface-2);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius-lg);
  box-shadow: var(--fw-shadow-lg);
  color: var(--fw-text);
  font-size: var(--fw-text-sm);
  animation: fw-toast-in var(--fw-dur-slow) var(--fw-ease-out);
}
.fw-toast--success {
  border-inline-start: 3px solid var(--fw-success);
}
.fw-toast--error {
  border-inline-start: 3px solid var(--fw-error);
}
.fw-toast--warning {
  border-inline-start: 3px solid var(--fw-warning);
}
@keyframes fw-toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fw-toast {
    animation-duration: 1ms;
  }
}
/* role="status" for success/info; role="alert" for errors (§15). */
```

### 8.28 Confirmation dialog (destructive)

```css
.fw-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--fw-z-modal);
  background: var(--fw-overlay);
  display: grid;
  place-items: center;
  padding: var(--fw-space-4);
}
.fw-dialog {
  inline-size: min(100%, 28rem);
  background: var(--fw-surface-1);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius-2xl);
  box-shadow: var(--fw-shadow-lg);
  padding: var(--fw-space-6);
  display: grid;
  gap: var(--fw-space-4);
  text-align: start;
  animation: fw-dialog-in var(--fw-dur-slow) var(--fw-ease-out);
}
.fw-dialog--danger {
  border-block-start: 3px solid var(--fw-error);
}
.fw-dialog__title {
  font-size: var(--fw-text-xl);
  font-weight: 700;
  color: var(--fw-text);
}
.fw-dialog__body {
  font-size: var(--fw-text-sm);
  color: var(--fw-text-muted);
}
.fw-dialog__actions {
  display: flex;
  gap: var(--fw-space-3);
  justify-content: flex-end;
} /* actions at inline-end */
@keyframes fw-dialog-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fw-dialog {
    animation-duration: 1ms;
  }
}
/* role="alertdialog", focus trapped, Esc cancels, primary action = destructive button (§8.5). */
```

### 8.28b Staff-view composition

The staff view runs on the **shared front-desk device** (typically landscape/desktop) and is
deliberately minimal — no analytics (`RESEARCH.md §5`). Composition hierarchy:

1. **Live count + crowd band** — dominant and glanceable from a distance; same honesty rules
   as the public hero (approximation, freshness, never a frozen fake-live number).
2. **Device/data health + freshness** — always visible (§8.14); never hidden behind a tab.
3. **Operations panel** — correction (§8.29), direct count entry (§8.29b), and reset (§8.30),
   visually separated below/beside the informational data per the ops-panel rule.
4. **Stale/offline alerts** — escalate assertively per §15 (`role="alert"`), unmissable at
   the front desk.

### 8.29 Correction control (staff)

An operational (not informational) control: visually distinct — a bordered "operations" panel,
never styled like a public data card.

```css
.fw-ops-panel {
  background: var(--fw-surface-2);
  border: 1px dashed var(--fw-border-strong);
  border-radius: var(--fw-radius-lg);
  padding: var(--fw-space-4);
  display: grid;
  gap: var(--fw-space-3);
}
.fw-ops-panel__label {
  font-size: var(--fw-text-sm);
  font-weight: 600;
  color: var(--fw-text-muted);
  text-align: start;
}
.fw-correct {
  display: flex;
  align-items: center;
  gap: var(--fw-space-2);
}
.fw-correct__step {
  /* uses .fw-icon-btn */
}
.fw-correct__value {
  min-inline-size: 4ch;
  text-align: center;
  font-family: var(--fw-font-display);
  font-size: var(--fw-text-3xl);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--fw-text);
}
/* +/- steppers adjust the count; a primary "تطبيق التصحيح" (Apply) button commits.
   Steppers are logical: the "increase" control sits at the inline-end regardless of dir.
   Corrections record who/when/from→to plus an optional short reason — the same audit
   capture as reset (§8.30; RESEARCH §8). */
```

### 8.29b Direct count entry (staff — offline / hard-failure fallback)

When ± stepping is impractical or the edge is down, staff type the count directly. This is
the **offline / hard-failure fallback path** required by `RESEARCH.md §10` (see §8.16): the
entered value flows through the write path as a cloud-side fallback and the edge reconciles
on reconnect.

```css
.fw-count-entry {
  display: flex;
  align-items: center;
  gap: var(--fw-space-2);
}
.fw-count-entry__input {
  /* reuses .fw-input styling (§8.23) */
  max-inline-size: 8ch;
  text-align: center;
  font-family: var(--fw-font-display);
  font-size: var(--fw-text-2xl);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
/* <input inputmode="numeric" pattern="[0-9]*" min="0" step="1"> — non-negative integers
   only, Western digits. Nothing commits until the primary "تطبيق التصحيح" (Apply) action
   confirms; entries are audited like corrections (§8.29). */
```

### 8.30 Reset control (staff, most destructive)

```css
.fw-reset {
  display: grid;
  gap: var(--fw-space-2);
}
.fw-reset__btn {
  /* uses .fw-btn .fw-btn--destructive */
}
/* Reset ALWAYS routes through the confirmation dialog (§8.28) with a danger accent,
   states the consequence ("سيتم ضبط العدد إلى 0"), and records who/when/why (audit, RESEARCH §8). */
.fw-reset__hint {
  font-size: var(--fw-text-xs);
  color: var(--fw-text-subtle);
}
```

### 8.31 Loading skeletons

```css
.fw-skeleton {
  background: linear-gradient(
    90deg,
    var(--fw-surface-2) 25%,
    var(--fw-surface-3) 37%,
    var(--fw-surface-2) 63%
  );
  background-size: 400% 100%;
  border-radius: var(--fw-radius-sm);
  animation: fw-shimmer 1.4s ease-in-out infinite;
}
.fw-skeleton--text {
  block-size: 0.8em;
  margin-block: 0.25em;
}
.fw-skeleton--title {
  block-size: 1.4em;
  inline-size: 60%;
}
.fw-skeleton--number {
  block-size: 3.5rem;
  inline-size: 8rem;
  border-radius: var(--fw-radius-lg);
}
@keyframes fw-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}
/* RTL: shimmer direction is cosmetic; flip start/end positions if a directional sweep is desired. */
@media (prefers-reduced-motion: reduce) {
  .fw-skeleton {
    animation: none;
    background: var(--fw-surface-2);
  }
}
```

### 8.32 Empty states

```css
.fw-empty {
  display: grid;
  justify-items: center;
  gap: var(--fw-space-3);
  padding: var(--fw-space-12) var(--fw-space-4);
  text-align: center;
  color: var(--fw-text-subtle);
}
.fw-empty__icon {
  inline-size: 40px;
  block-size: 40px;
  color: var(--fw-text-faint);
}
.fw-empty__title {
  font-size: var(--fw-text-lg);
  font-weight: 700;
  color: var(--fw-text-muted);
}
.fw-empty__body {
  font-size: var(--fw-text-sm);
  max-inline-size: 34ch;
}
/* Distinguish "no data yet" (new gym, still logging) from "no results for this range". */
```

### 8.33 Error states

```css
.fw-error-state {
  display: grid;
  justify-items: center;
  gap: var(--fw-space-3);
  padding: var(--fw-space-12) var(--fw-space-4);
  text-align: center;
}
.fw-error-state__icon {
  inline-size: 40px;
  block-size: 40px;
  color: var(--fw-error-fg);
}
.fw-error-state__title {
  font-size: var(--fw-text-lg);
  font-weight: 700;
  color: var(--fw-text);
}
.fw-error-state__body {
  font-size: var(--fw-text-sm);
  color: var(--fw-text-muted);
  max-inline-size: 40ch;
}
.fw-error-state__retry {
  /* .fw-btn .fw-btn--secondary */
}
/* Always offer a recovery action (retry/reload) and never blame the user. */
```

### 8.34 CSV export action

```css
.fw-export {
  /* .fw-btn .fw-btn--secondary */
  display: inline-flex;
  gap: var(--fw-space-2);
}
.fw-export__icon {
  inline-size: 1.1em;
  block-size: 1.1em;
} /* download glyph — does NOT flip in RTL */
.fw-export[data-loading="true"] {
  /* reuse .fw-btn loading spinner */
}
/* On success, a toast (§8.27) confirms "تم تصدير الملف". Label: "تصدير CSV". */
```

---

## 9. Data Visualization

The final Claude Analytics screens govern page layout and FITWAY visual direction. The
separate `FITWAY_ANALYTICS_CHART_BEHAVIOR_REFERENCE.png` governs only the occupancy curve's
shape, restrained fill/glow, active-point treatment, and motion character. Its crop, literal
labels, sample data, English `AM` ticks, and axis order are not implementation requirements.

### Chart palette

- Primary occupancy series: `--fw-chart-1` (brand red). Capacity/reference line: `--fw-chart-6`
  (slate) or a dashed `--fw-chart-2`. Additional series draw from `--fw-chart-2…5` in order.
- Keep no more than 4 active series on a phone chart; beyond that, split or use small multiples.

### Line-chart treatment (daily occupancy curve)

- 2px stroke, round line caps/joins, `--fw-chart-1`. Use a smooth, natural curve with
  meaningful rises, falls, and plateaus, but never smooth away analytically meaningful peaks
  or imply values that the underlying series does not contain (`RESEARCH.md §5`).
- Keep the active/latest point visibly marked. A thin `--fw-primary` current-time rule may
  accompany it when that improves reading without clutter.
- On desktop, hovering or keyboard-focusing a point opens the same tooltip. On mobile, tapping
  selects a point and keeps its tooltip available until another selection or dismissal.
  Selection must not depend on a precisely targeted tiny marker.

### Area fills

- Under-line area = a vertical gradient from `rgba(227,24,55,0.28)` to `rgba(227,24,55,0)`.
  Subtle; the line, not the fill, carries the value.

### Grid lines

- Horizontal only, `--fw-chart-grid` (1px). Drop vertical grid lines on phones. No grid inside
  the legend or axis label zones.

### Axis styling

- Labels/ticks in `--fw-chart-axis` (= `--fw-text-subtle`), `--fw-text-xs`, tabular numerals.
- Y axis = occupancy (people or %). X axis = time (gym-local business day, `RESEARCH.md §8`).
- **Axis placement mirrors in RTL:** the Y axis sits on the **inline-start** (right in RTL);
  time on the X axis flows **right → left** in RTL (see chart direction below).

### Tooltips

```css
.fw-tooltip {
  background: var(--fw-surface-3);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius-md);
  box-shadow: var(--fw-shadow-md);
  padding: var(--fw-space-2) var(--fw-space-3);
  font-size: var(--fw-text-xs);
  color: var(--fw-text);
  text-align: start;
  font-variant-numeric: tabular-nums;
}
```

Tooltip content is never the _only_ way to read a value — pair with an accessible data table.
Tooltip placement must remain inside the usable plot/card bounds, avoid covering the active
point when practical, and preserve correct focus as the chart changes.

### Legends

- Chip = a color swatch + label; place above the plot (wraps on phone). Legend items are
  keyboard-focusable and toggle series. Swatch shape differs per series where feasible (line vs
  dashed vs dotted) so legends don't rely on color alone.

### Heatmap scale (day × hour)

- Single-hue red luminance ramp `--fw-heat-0 → --fw-heat-4` (§4.6). Provide a visible legend
  ("أقل ← → أكثر") mapping steps to occupancy ranges.
- Cell tooltip/`aria-label`: day, hour, and value (e.g., "الأحد، 6 م، متوسط 62%").

### Empty periods (gym closed)

- Cells/segments for closed hours render as `--fw-surface-inset` with reduced opacity and are
  labeled "مغلق" — visually distinct from "0 people while open".

### Missing data (gap in history)

- `--fw-heat-empty` diagonal hatch for heatmap cells; line charts **break the line** across
  gaps (no interpolation) and mark the gap. Never fabricate a value.

### Stale data

- If the latest point is stale, dim the trailing segment to 50% and annotate "قديم" near the
  current-time marker; the curve up to the last fresh point stays full-strength.

### Mobile chart behavior

- Render the complete underlying timeline at every breakpoint. A useful full timeline and
  normal tick density are expected on desktop; mobile reduces tick-label density responsively
  without dropping data points merely to reduce labels. Use a small fixed set of legible ticks
  chosen from the full domain; do not overlap, clip, or rotate Arabic labels. Horizontal plot
  scrolling is a last resort when the task genuinely requires inspecting every point.

### Arabic labels

- Localize day/month names per the active locale (§5). All numeric values use Western/English
  digits for consistency and tabular alignment.

### RTL considerations

- **Time progresses in the reading direction.** In RTL the day starts at the inline-start
  (right) and time advances toward the inline-end (left); "now"/the most-recent point and
  the current-value marker sit at the inline-end (left). Category order (days of week)
  follows RTL. Bar charts grow from the inline-start baseline. Verify the charting library
  supports a reversed X axis; if not, transform the axis and tooltips accordingly.
- Arabic charts use Western digits and gym-local time formatting. Bidi-isolate every numeric
  and time run; do not inherit the chart reference PNG's English `AM` labels.

### Accessibility alternatives (color/hover-independent)

- Every chart ships a **visually-hidden data table** (`.fw-sr-only`) with the same numbers,
  referenced via `aria-describedby`. Heatmap cells expose values in `aria-label`. Series are
  distinguishable without color (line style/markers). No information lives only in a hover
  tooltip. Provide a "view as table" toggle for the owner where practical.

---

## 10. Motion

### Final motion-personality verdict

**Smooth, polished, and restrained — with a light athletic snap. Calibrated calmer and
snappier for live data.** Fitway inherits the reference's controlled 150/300ms + standard-ease
feel, but data screens trend faster (120–220ms) and never animate in a way that delays reading
the number or status. Motion is confident, not decorative.

### Evidence from the reference

150ms default transition and 300ms button/nav transitions; `cubic-bezier(.4,0,.2,1)` standard
easing and `cubic-bezier(0,0,.2,1)` ease-out; a 4px arrow nudge + opacity-fade overlay on the
primary button; red-glow shadow growth on cards; `pulse 2s`, `ping 1s`, `spin 1s` loops. All
extracted from `:root` custom properties and applied utility classes (§2).

### Duration scale

| Token              | Value | Usage                                                      |
| ------------------ | ----- | ---------------------------------------------------------- |
| `--fw-dur-instant` | 80ms  | Micro-feedback (press)                                     |
| `--fw-dur-fast`    | 150ms | Hover, color, focus, small transitions (reference default) |
| `--fw-dur-base`    | 220ms | Card/badge transitions, arrow nudge                        |
| `--fw-dur-slow`    | 320ms | Nav, drawer, modal, crowd-scale transition                 |
| `--fw-dur-slower`  | 480ms | Scroll reveals, large surfaces, spinner cycle              |

### Easing curves

| Token                  | Value                            | Usage                                                 |
| ---------------------- | -------------------------------- | ----------------------------------------------------- |
| `--fw-ease-standard`   | `cubic-bezier(0.4, 0, 0.2, 1)`   | Default in/out (reference)                            |
| `--fw-ease-out`        | `cubic-bezier(0, 0, 0.2, 1)`     | Entrances, incoming elements (reference)              |
| `--fw-ease-in`         | `cubic-bezier(0.4, 0, 1, 1)`     | Exits                                                 |
| `--fw-ease-emphasized` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Athletic snap for CTAs/hero accents (Fitway addition) |

### Hover transitions

Color/border/shadow only, `--fw-dur-fast` `--fw-ease-standard`. Interactive data cards may
grow the red-glow shadow at `--fw-dur-base`. No layout-shifting hover on data.

### Press transitions

`transform: translateY(1px)` at `--fw-dur-instant`; buttons darken one red step on `:active`.

### Navigation transitions

Nav bar background/border cross-fade on scroll at `--fw-dur-slow`. Mobile drawer slides on the
inline axis at `--fw-dur-slow` `--fw-ease-standard`.

### Card transitions

Elevation/border at `--fw-dur-base`; entrance (if any) is an 8px rise + fade at `--fw-dur-slow`
`--fw-ease-out`.

### Modal transitions

Backdrop fades; dialog scales `0.97 → 1` + fades at `--fw-dur-slow` `--fw-ease-out`.

### Scroll-triggered defaults

Content sections fade + rise 12–16px once, at `--fw-dur-slower` `--fw-ease-out`, triggered by
IntersectionObserver, **run once**. **Never** apply scroll reveals to live operational data on
the public hero or staff view — status must be visible instantly on load, not on scroll.

### Number-update behavior

When the live count changes, cross-fade or count-up over ≤ `--fw-dur-slow`, using tabular
figures so width never jumps. The band color transitions at `--fw-dur-base`. Announce via
`aria-live="polite"` (§15). If the change is a stale→fresh recovery, briefly pulse the freshness
dot once, then settle.

```css
.fw-count__value {
  transition: color var(--fw-dur-base) var(--fw-ease-standard);
}
@keyframes fw-count-flip {
  from {
    opacity: 0;
    transform: translateY(-0.15em);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.fw-count__value[data-updated="true"] {
  animation: fw-count-flip var(--fw-dur-slow) var(--fw-ease-out);
}
```

### Chart animation behavior

Use one restrained initial line draw / bar grow on first render, normally no longer than
`--fw-dur-slower`; it must not delay chart comprehension or replay on routine refresh. Subsequent
data refreshes may tween at `--fw-dur-slow`. No infinite chart animation.

### Loading animation behavior

Skeleton shimmer 1.4s; spinner uses `--fw-dur-slower` linear loop; freshness dot pulse 2s. All
loops pause/disable under reduced motion.

### Reduced-motion alternatives

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

Under reduced motion: number updates **set instantly**, scroll reveals show content in place,
spinners freeze to a static ring while the control exposes a text/`aria-busy` "loading"
indication (§8.1), skeletons become a flat surface, and the crowd-scale state changes instantly. No
information is lost — motion is purely additive. Charts render the complete final line, fill,
active point, labels, and selected/focused state immediately with no draw animation.

---

## 11. Imagery and Iconography

### Photography style

- Dark, high-contrast gym interiors and athletic action, **always heavily dimmed** behind a
  scrim (`.fw-hero__scrim`) so the occupancy instrument dominates. Reference-observed
  treatment (`desktop-hero.png`, `content-section.png`) — adopted but demoted to backdrop.
- Prefer moody, low-key images with a subtle red rim/spotlight over bright, busy shots.
- Imagery is **decorative context only**; never the carrier of live data.

### Image crops

- Full-bleed cover crops for hero backdrops; `object-fit: cover` with a focal point that keeps
  faces/equipment out of the center where the number sits.
- `max-inline-size: 100%` on all images; wide media scrolls inside its own container, never the
  page.

### Image overlays

- Standard scrim: `linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.85))` plus an optional
  faint red radial. Ensure text over media meets ≥ 4.5:1 against the local pixels.

### Red and dark treatments

- A single red spotlight/rim is the signature; avoid full red photo washes (they fight the UI
  red and hurt legibility). Keep photos essentially monochrome-dark with red accents.

### Public-page imagery rules

- At most one hero backdrop image. No photo carousels, no promotional banners, no stock
  "fitness" collages. The approximate count + qualitative crowd scale + label is the visual.

### Dashboard imagery restrictions

- **No decorative photography in staff/owner dashboards.** Data, icons, and charts only.
  Imagery there is noise that competes with operational reading.

### Icon library recommendation

- **Lucide** (or Phosphor) — open-source, consistent 24px grid, outlined, MIT/ISC licensed,
  RTL-friendly. Consistent stroke and geometry across the whole product.

### Stroke width

- 1.75–2px stroke on a 24px grid. Match icon stroke weight to adjacent text weight; do not mix
  stroke widths within one screen.

### Filled vs outlined usage

- **Outlined by default** (navigation, actions, informational). **Filled/solid** reserved for
  active states, status dots, and the crowd/status icons where a solid glyph reads faster at a
  glance. Never mix fill/outline for the same icon across states without intent.

### RTL-sensitive icons (must mirror)

- Directional chevrons/arrows for navigation, "back/forward", carousel controls, breadcrumb
  separators, list-disclosure carets, and progress direction. Mirror via
  `[dir="rtl"] .icon-directional { transform: scaleX(-1); }`.

### Icons that must NOT mirror

- Numbers, clock/time, media play, checkmarks, the download/export glyph, logos/brand marks,
  magnifier, and any icon whose meaning is orientation-independent. Trend arrows use
  **up/down**, not left/right, so they never mirror.

### Status icons

- Quiet = leaf/space glyph; Moderate = half-filled gauge; Busy = people/flame; Packed = filled
  alert/max glyph; Open = check-dot; Closed = moon/lock; Fresh = live dot; Stale = clock;
  Offline = no-signal/slash. Each status pairs its icon with its label and color (never color
  alone).

### Avoided icon styles

- No 3D, skeuomorphic, gradient-filled, emoji, multicolor, or hand-drawn icons. No mixing icon
  families. Keep one coherent outlined set.

---

## 12. Contrast Philosophy

**The system is punchy where it matters and quiet everywhere else — deliberately mixed.**

- **Where contrast peaks:** the live occupancy number, the crowd band, and its active scale segment. These get
  the brightest text, the strongest color, and the most size. On the public hero the number is
  near-max contrast (`--fw-text` on `--fw-bg`, ~18:1) and the band color is fully saturated.
- **Where contrast stays quiet:** chrome, secondary labels, timestamps, borders, backgrounds.
  These use muted/subtle text and hairline borders so they recede behind the data.
- **How red stays under control:** red is a spotlight, not wallpaper. It appears on the primary
  action, the brand mark, the Packed/critical state, and thin accents (focus ring, active tab,
  current-time marker). Large surfaces stay dark/neutral. This is the single-red discipline
  observed in the reference, applied more strictly.
- **How live data gets priority:** size, weight (900), position (center/top), and the only
  full-saturation color on the screen all converge on the current status. Nothing else competes
  for that visual weight.
- **How surfaces alternate:** elevation reads through surface steps
  (`--fw-bg → surface-1 → surface-2 → surface-3`) and soft shadows, not through high-contrast
  slabs. Sections don't ping-pong between black and white; they layer.
- **How semantic states stay distinguishable:** each status carries color **plus** icon
  **plus** label **plus** (for crowd) a labeled scale position. States are distinguished by hue
  separation plus those mandatory redundant channels; grayscale ordering is carried by the
  label + icon + scale position, not by lightness. Text uses the accessible `-fg` variants
  on dark. No state is ever distinguishable by hue alone (§15).

---

## 13. Responsive Breakpoints

Phone portrait (≈390px) is the **primary design target**; everything scales up from there.

| Token               | Min width | Target devices                | Layout                        | Navigation                  | Typography                           | Cards   | Charts                              | Public hero                                        | Dashboard                        |
| ------------------- | --------- | ----------------------------- | ----------------------------- | --------------------------- | ------------------------------------ | ------- | ----------------------------------- | -------------------------------------------------- | -------------------------------- |
| `--fw-bp-xs` (base) | 0–479     | Phone portrait                | Single column, 16px gutter    | Hamburger → full drawer     | Display via `clamp()` min; body 16px | 1 col   | Full-bleed, ≤220px h, minimal ticks | Count dominant + labeled qualitative scale, sub-cards stack | Stacked cards, bottom tabs       |
| `--fw-bp-sm`        | 480       | Large phone / phone landscape | Single column, roomier        | Hamburger drawer            | Slightly larger display              | 1–2 col | Slightly taller                     | Same, more breathing room                          | 1–2 KPI cols                     |
| `--fw-bp-md`        | 768       | Tablet portrait               | 2-col content, 24px gutter    | Condensed top nav or drawer | Mid display sizes                    | 2 col   | Standard height, more ticks         | Number + side info allowed                         | 2–3 KPI cols, side panels appear |
| `--fw-bp-lg`        | 1024      | Tablet landscape / laptop     | 12-col grid, 32px gutter      | Full top nav                | Full headings                        | 3 col   | Full detail                         | Transition toward the G1B parallel metric split    | Optional side nav + 3–4 KPI cols |
| `--fw-bp-xl`        | 1280      | Desktop                       | 12-col, container 80rem       | Full top nav                | Max display sizes                    | 3–4 col | Full detail + legends               | G1B wide dominant card + parallel metric split     | Full multi-panel dashboard       |
| `--fw-bp-2xl`       | 1536      | Large desktop                 | Centered, capped at container | Full top nav                | No further growth                    | 4 col   | Full detail                         | G1B unchanged; do not over-scale the metrics       | Max grid, no wasted width        |

Rules: use `min-width` (mobile-first) media queries; never hide essential status behind a
breakpoint; the occupancy number is capped by `clamp()` so it stays dominant but not absurd on
desktop; touch targets remain ≥ 44px through `md`, may relax to ≥ 36px for dense pointer-only
dashboards at `lg`+.

---

## 14. Internationalization and RTL Rules

RTL is structural, designed-in from the start — not a mirror bolted on later.

### Direction switching

- Set `dir` and `lang` on `<html>` (`dir="rtl" lang="ar"` default; `dir="ltr" lang="en"` for
  English). All layout responds to `dir` via logical properties — no per-component rewrites.
- The language toggle swaps `lang`/`dir` and content; layout, spacing, and alignment follow
  automatically.
- English LTR is composed naturally for English reading order and content rhythm. Logical
  properties provide the structural foundation, but implementation must not mechanically
  mirror an Arabic screenshot when hierarchy, wrapping, or control grouping needs an LTR-
  specific composition.

### Logical spacing

- **Only** logical properties in layout CSS: `margin-inline`, `padding-inline`,
  `inset-inline-start/end`, `border-start-start-radius`, `text-align: start/end`. No physical
  `left/right`/`margin-left` etc. in component styles.

### Mirrored elements

- Overall page flow, nav order, sidebars, drawers (slide from inline-end in RTL), progress
  direction, breadcrumb/caret/back-forward icons, list bullets, and the qualitative crowd-scale
  order. Charts: category and time axes mirror (§9).

### Non-mirrored elements

- The logo/brand mark, numbers and the occupancy count, clocks/time glyphs, media controls,
  checkmarks, the download/export icon, and any orientation-neutral icon. Latin brand names and
  code stay LTR within an RTL line (bidi isolation).

### Chart direction

- **Time progresses in the reading direction.** In RTL the day starts at the inline-start
  (right) and time advances toward the inline-end (left); "now"/the most-recent point and
  the current-value marker sit at the inline-end (left). Bars grow from the inline-start
  baseline; legends and axis labels align to reading direction (§9).

### Arabic line breaking

- Allow natural Arabic wrapping; do not force `word-break`. Avoid `letter-spacing` on Arabic
  (breaks cursive joins). Keep headings to ≤ 2 lines on phone via size, not truncation.

### English text inside Arabic interfaces

- Wrap Latin snippets (brand names, units, model IDs) with bidi isolation
  (`unicode-bidi: isolate` / `<bdi>`) so numbers and Latin words keep correct order inside
  Arabic sentences. In the approved public composition, isolate `37`, `2:59`, and `30`
  independently while the surrounding labels remain Arabic RTL.

### Number and date formatting

- Use `Intl` with the active locale (§5), always with Western/English digits
  (`ar-SA-u-nu-latn`). Dates/times display in the **gym-local timezone** for "today", curves,
  peaks, resets, and reports (`RESEARCH.md §8`), even though storage is UTC. 12-hour clock with
  localized AM/PM ("ص/م") for public times; owner reports may use 24-hour.

### Truncation rules

- Prefer wrapping over truncation for Arabic. Where truncation is unavoidable (table cells,
  chips), use `text-overflow: ellipsis` with `overflow: hidden` on a logical `max-inline-size`,
  and expose the full value via `title`/tooltip. Never truncate the occupancy number, status
  label, or freshness time.

### Content expansion allowances

- Assume **±30–40% length variance** between Arabic and English. Buttons, badges, nav items,
  and KPI labels must flex (no fixed pixel widths); use `min-inline-size` + wrapping, not fixed
  widths. Test both languages at every breakpoint. Icons + numbers stay put; only text reflows.

---

## 15. Accessibility Rules

WCAG-conscious throughout; the honesty and color-independence requirements from `RESEARCH.md`
(§4, §15) are hard constraints.

### Contrast requirements

- Normal text ≥ 4.5:1; large/bold text and UI/graphical boundaries ≥ 3:1. Body uses `--fw-text`
  / `--fw-text-muted`; `--fw-text-faint` is for large or non-essential text only. Status text
  on dark uses the `-fg` variants. Red text on dark uses `--fw-red-400/300`, never `#E31837`
  for small text.

### Focus visibility

- Every interactive element shows a visible `:focus-visible` ring (`--fw-shadow-focus`, white on
  red surfaces). Never remove outlines without a replacement. Focus order follows reading order
  (RTL). Focus is trapped in modals and returns to the trigger on close.

### Keyboard interaction

- Full keyboard operability: Tab/Shift-Tab, Enter/Space to activate, Esc to dismiss, arrow keys
  for tabs/menus/steppers (roving tabindex). Steppers (correction control) are operable by
  keyboard. No hover-only or pointer-only functionality.

### Touch-target sizes

- Minimum 44×44px for all interactive targets on touch (matches the reference's `min-h-11`).
  Dense pointer-only dashboard controls may drop to 36px at `lg`+ but never below on touch.
  Maintain ≥ 8px spacing between adjacent targets.

### Screen-reader labeling

- Icon-only buttons get `aria-label`. The occupancy hero exposes a concise spoken summary via
  an `.fw-sr-only` element, e.g. _"النادي مفتوح الآن. مستوى الازدحام: متوسط. العدد
  التقريبي: 37. تحديث مباشر. آخر تحديث 2:59 م، قبل 30 ثانية."_ The approximate-count
  label preserves estimation semantics without restoring `حوالي` or `شخصًا`. The qualitative
  scale uses `role="img"` with a localized label and no numeric range attributes. Crowd/open/
  fresh states expose their label text, not just color.

### Reduced motion

- Honor `prefers-reduced-motion` globally (§10): instant number sets, no scroll reveals, static
  loaders, no pulse/shimmer. No essential information is conveyed by motion alone.

### Status communication beyond color

- Every status = **color + icon + text label** (and, for crowd, **labeled scale position**). The system
  must be fully usable in grayscale. This is non-negotiable per `RESEARCH.md §4` (color-blind-
  safe, always-labeled band).

### Error-message behavior

- Errors are specific, adjacent to their field, `aria-describedby`-linked, `aria-invalid` set,
  and announced (`role="alert"`). Never color-only, never a generic "invalid". Offer recovery.

### Form labeling

- Every control has a visible, programmatically-associated `<label>` (`for`/`id`). Placeholders
  are not labels. Group related fields with `fieldset`/`legend`. Required fields are marked in
  text, not color alone.

### Accessible charts

- Each chart has a text alternative and an `.fw-sr-only` data table with the same values
  (`aria-describedby`). Heatmap cells expose day/hour/value via `aria-label`. Series are
  distinguishable without color (§9). A "view as table" option is provided for the owner where
  practical.
- Desktop point inspection works with both pointer hover and keyboard focus; mobile point
  inspection works with tap selection. Focus indicators, tooltip content, and the active point
  expose the same selected datum, and no interaction is hover-only.

### Loading announcements

- Loading regions use `aria-busy="true"`; skeletons are `aria-hidden` with an
  `.fw-sr-only` "جارٍ التحميل" (loading) live message. Completion is announced politely.

### Live-data update announcements

- The public count/status live region is `aria-live="polite"` (routine refreshes shouldn't
  interrupt). **Stale and offline transitions escalate to `role="alert"` / `aria-live="assertive"`**
  on the staff view so operators are told immediately. Announcements are throttled to avoid
  chatter on the 60s public refresh.

---

## 16. Do and Don't

### Do

1. Make the occupancy number the largest, highest-contrast, most saturated thing on the public
   screen — everything else supports it.
2. Always frame the count as an estimate. Approved Arabic public surfaces use the explicit
   `العدد التقريبي` label rather than `حوالي` or a person unit — honesty over false precision
   (`RESEARCH.md §4`).
3. Always show freshness (last-updated + fresh/stale/offline) next to the number; when stale,
   dim and label the last-known value — never present it as live.
4. Show open/closed honestly; when closed, display the next opening time and suppress a live
   count instead of faking one.
5. Convey every status with color + icon + label (+ labeled scale position for crowd) so it survives
   grayscale and color blindness.
6. Reserve `--fw-primary #E31837` fills for the primary action, the brand mark, and the Packed/
   critical state; keep large areas dark and neutral.
7. Visually separate operational controls (correction/reset) from informational data, and route
   reset through a danger-styled confirmation with audit capture.
8. Design stale, offline, loading, empty, and error as first-class states with real CSS and
   copy — not afterthoughts.
9. Build every layout RTL-first with logical properties; verify Arabic and English at each
   breakpoint with ±40% text expansion.
10. Keep motion fast and calm on data; honor `prefers-reduced-motion` so the product is fully
    usable with animation off.

### Don't

1. Don't let a hero photo, promo banner, or animation compete with or delay the live status.
2. Don't show a frozen number as if it were live, or hide the fact that data is stale/offline.
3. Don't paint the UI red — no red backgrounds, red-on-red, or red used as decoration away from
   action/brand/Packed.
4. Don't use `#E31837` for small text on dark surfaces (fails AA) — use `--fw-red-400/300`.
5. Don't rely on color alone for any status, KPI delta, or chart series.
6. Don't put marketing furniture (app-store badges, WhatsApp float, "join now" funnels, sticker
   art, gold/silver accents) into this product — it is a data instrument, not a sales page.
7. Don't italicize Arabic, apply letter-spacing to Arabic, or truncate the count/status/time.
8. Don't hard-code capacity/thresholds or timezone assumptions — bands are admin-configurable
   and times are gym-local (`RESEARCH.md §4, §8`).
9. Don't use physical `left/right` in component CSS, or design LTR-first and mirror later.
10. Don't animate live numbers in a way that shifts width or delays reading; don't run infinite
    animations on data.

---

## 17. CSS Custom Properties

Complete token set. Fitway v1 is dark-only (§4.3): `:root` is the single theme, and tokens
are named semantically so a future light theme can override token values without renaming.
All colors, spacing, radii, durations, and z-indices used in the component CSS above map to
tokens here; font weights (600/700/800/900), status-tint border literals, and the white
on-red focus ring are intentionally literal.

```css
:root {
  color-scheme: dark;

  /* ---------- Brand red (constant) ---------- */
  --fw-red-50: #fff1f3;
  --fw-red-100: #ffe0e5;
  --fw-red-200: #ffc2cc;
  --fw-red-300: #ff97a8;
  --fw-red-400: #ff5c74;
  --fw-red-500: #e31837;
  --fw-red-600: #c41230;
  --fw-red-700: #a50e28;
  --fw-red-800: #7a0b1e;
  --fw-red-900: #4d0713;
  --fw-primary: var(--fw-red-500);
  --fw-primary-hover: var(--fw-red-600);
  --fw-primary-pressed: var(--fw-red-700);
  --fw-primary-deep: var(--fw-red-800);
  --fw-primary-light: #ff2d4d;
  --fw-on-primary: #ffffff;

  /* ---------- Surfaces ---------- */
  --fw-bg: #0b0c0e;
  --fw-surface-1: #131417;
  --fw-surface-2: #1b1d21;
  --fw-surface-3: #24272c;
  --fw-surface-inset: #0e0f11;
  --fw-scrim: #000000;
  --fw-overlay: rgba(0, 0, 0, 0.72);
  --fw-glass-bg: rgba(15, 16, 19, 0.72);
  --fw-on-media: #ffffff;

  /* ---------- Text ---------- */
  --fw-text: #f7f8fa;
  --fw-text-muted: #c6c9cf;
  --fw-text-subtle: #969aa3;
  --fw-text-faint: #6b6f78;

  /* ---------- Borders ---------- */
  --fw-border: rgba(255, 255, 255, 0.12);
  --fw-border-subtle: rgba(255, 255, 255, 0.06);
  --fw-border-strong: rgba(255, 255, 255, 0.2);
  --fw-focus-ring: rgba(255, 45, 77, 0.7);

  /* ---------- Semantic (base / -fg on dark / -bg tint) ---------- */
  --fw-success: #16a34a;
  --fw-success-fg: #4ade80;
  --fw-success-bg: rgba(22, 163, 74, 0.14);
  --fw-warning: #f59e0b;
  --fw-warning-fg: #fbbf24;
  --fw-warning-bg: rgba(245, 158, 11, 0.14);
  --fw-error: #e31837;
  --fw-error-fg: #ff5c74;
  --fw-error-bg: rgba(227, 24, 55, 0.14);
  --fw-info: #2e7df6;
  --fw-info-fg: #7fb0ff;
  --fw-info-bg: rgba(46, 125, 246, 0.14);
  --fw-stale: #d9a400;
  --fw-stale-fg: #f1c34d;
  --fw-stale-bg: rgba(217, 164, 0, 0.14);
  --fw-offline: #8a8f99;
  --fw-offline-fg: #b4b8c0;
  --fw-offline-bg: rgba(138, 143, 153, 0.16);

  /* ---------- Crowd states (base / -fg / -bg) ---------- */
  --fw-quiet: #22c55e;
  --fw-quiet-fg: #4ade80;
  --fw-quiet-bg: rgba(34, 197, 94, 0.16);
  --fw-moderate: #eab308;
  --fw-moderate-fg: #fcd34d;
  --fw-moderate-bg: rgba(234, 179, 8, 0.16);
  --fw-busy: #f97316;
  --fw-busy-fg: #fb923c;
  --fw-busy-bg: rgba(249, 115, 22, 0.16);
  --fw-packed: #e31837;
  --fw-packed-fg: #ff5c74;
  --fw-packed-bg: rgba(227, 24, 55, 0.18);

  /* ---------- Charts ---------- */
  --fw-chart-1: #e31837;
  --fw-chart-2: #4c8dff;
  --fw-chart-3: #2dd4bf;
  --fw-chart-4: #f5a524;
  --fw-chart-5: #a78bfa;
  --fw-chart-6: #94a3b8;
  --fw-chart-grid: rgba(255, 255, 255, 0.07);
  --fw-chart-axis: var(--fw-text-subtle);
  --fw-heat-0: #14161a;
  --fw-heat-1: #3a1620;
  --fw-heat-2: #6b1528;
  --fw-heat-3: #a11330;
  --fw-heat-4: #e31837;
  --fw-heat-empty: rgba(255, 255, 255, 0.04);

  /* ---------- Typography ---------- */
  --fw-font-ar: "Cairo", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif;
  --fw-font-latin: "Cairo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --fw-font-display: "Cairo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --fw-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;

  --fw-text-2xs: 0.6875rem; /* 11px */
  --fw-text-xs: 0.75rem; /* 12px */
  --fw-text-sm: 0.875rem; /* 14px */
  --fw-text-base: 1rem; /* 16px */
  --fw-text-lg: 1.125rem; /* 18px */
  --fw-text-xl: 1.25rem; /* 20px */
  --fw-text-2xl: 1.5rem; /* 24px */
  --fw-text-3xl: 1.875rem; /* 30px */
  --fw-text-4xl: 2.25rem; /* 36px */
  --fw-text-5xl: 3rem; /* 48px */
  --fw-text-6xl: 3.75rem; /* 60px */
  --fw-text-7xl: 4.5rem; /* 72px */
  --fw-text-display: clamp(3.5rem, 18vw, 5.5rem); /* public occupancy number, 56–88px */

  --fw-weight-normal: 400;
  --fw-weight-medium: 500;
  --fw-weight-semibold: 600;
  --fw-weight-bold: 700;
  --fw-weight-extra: 800;
  --fw-weight-black: 900;

  --fw-lh-tight: 1.1;
  --fw-lh-snug: 1.3;
  --fw-lh-normal: 1.5;
  --fw-lh-arabic: 1.65; /* body Arabic */
  --fw-lh-relaxed: 1.75;

  --fw-tracking-tight: -0.02em;
  --fw-tracking-normal: 0;
  --fw-tracking-wide: 0.02em; /* Latin caps / micro-labels only */

  /* ---------- Spacing (4px base) ---------- */
  --fw-space-0: 0;
  --fw-space-1: 0.25rem; /* 4  */
  --fw-space-2: 0.5rem; /* 8  */
  --fw-space-3: 0.75rem; /* 12 */
  --fw-space-4: 1rem; /* 16 */
  --fw-space-5: 1.25rem; /* 20 */
  --fw-space-6: 1.5rem; /* 24 */
  --fw-space-8: 2rem; /* 32 */
  --fw-space-10: 2.5rem; /* 40 */
  --fw-space-12: 3rem; /* 48 */
  --fw-space-16: 4rem; /* 64 */
  --fw-space-20: 5rem; /* 80 */
  --fw-space-24: 6rem; /* 96 */
  --fw-space-32: 8rem; /* 128 */

  /* ---------- Radii ---------- */
  --fw-radius-xs: 4px;
  --fw-radius-sm: 6px;
  --fw-radius-md: 8px;
  --fw-radius-lg: 12px;
  --fw-radius-xl: 16px;
  --fw-radius-2xl: 24px;
  --fw-radius-3xl: 32px;
  --fw-radius-pill: 999px;

  /* ---------- Shadows ---------- */
  --fw-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--fw-border-subtle);
  --fw-shadow-md: 0 8px 24px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--fw-border-subtle);
  --fw-shadow-lg: 0 20px 60px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--fw-border-subtle);
  --fw-shadow-xl: 0 30px 80px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--fw-border-subtle);
  --fw-shadow-red-glow: 0 20px 60px -18px rgba(227, 24, 55, 0.35), 0 0 0 1px rgba(227, 24, 55, 0.3);
  --fw-shadow-focus: 0 0 0 3px var(--fw-focus-ring);

  /* ---------- Containers ---------- */
  --fw-container-public: 34rem; /* 544px */
  --fw-container-content: 48rem; /* 768px */
  --fw-container-dashboard: 80rem; /* 1280px */
  --fw-measure: 68ch;

  /* ---------- Breakpoints (reference values; use in media queries) ---------- */
  --fw-bp-xs: 0;
  --fw-bp-sm: 480px;
  --fw-bp-md: 768px;
  --fw-bp-lg: 1024px;
  --fw-bp-xl: 1280px;
  --fw-bp-2xl: 1536px;

  /* ---------- Motion ---------- */
  --fw-dur-instant: 80ms;
  --fw-dur-fast: 150ms;
  --fw-dur-base: 220ms;
  --fw-dur-slow: 320ms;
  --fw-dur-slower: 480ms;
  --fw-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --fw-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --fw-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --fw-ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* ---------- Z-index scale ---------- */
  --fw-z-base: 0;
  --fw-z-raised: 10;
  --fw-z-dropdown: 1000;
  --fw-z-sticky: 1100;
  --fw-z-overlay: 1300;
  --fw-z-modal: 1400;
  --fw-z-toast: 1500;
  --fw-z-tooltip: 1600;
}

/* ---------- Global helpers referenced above ---------- */
.fw-sr-only {
  position: absolute !important;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
@keyframes fw-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes fw-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Appendix: Completion Check

- **`RESEARCH.md` fully considered** — product, roles, public/staff/owner surfaces, honesty
  principle, stale/offline/closed states, Arabic-first RTL, color-independent status, admin-
  configurable thresholds, gym-local time, and the v1 scope fence all drive this guide.
- **Official logo inspected and preserved** — `brand/fitway-logo.png` (1024×1024, alpha)
  documented for placement only; not altered. Vector/monochrome variants recommended.
- **Live reference researched** — `https://www.fitnesstime.com.sa/ar` inspected via browser.
- **CSS evidence collected** — runtime `:root` custom properties, computed element styles,
  bundle and font asset URLs, with provenance and limitations stated (§2).
- **Desktop and mobile captured** — 10 screenshots under `design-research/fitness-time/`.
- **Motion observed, not guessed** — durations/easing/transforms from computed styles, applied
  utility classes, and before/after hover captures; no screen-recording tool available (stated).
- **All three surfaces covered** — public hero + status system, staff operations, owner
  analytics.
- **RTL and English covered** — logical properties, bidi, numerals, expansion, mirroring rules.
- **Accessibility and reduced motion covered** — contrast, focus, keyboard, targets, SR
  labeling, color-independent status, live-region announcements, reduced-motion fallbacks.
- **Consistent tokens** — all colors, spacing, radii, durations, and z-indices in component
  CSS map to the §17 custom-property set; font weights, status-tint border literals, and the
  white on-red focus ring are intentionally literal (§17).
- **Deliverable saved** — `DESIGN_GUIDE.md`.
