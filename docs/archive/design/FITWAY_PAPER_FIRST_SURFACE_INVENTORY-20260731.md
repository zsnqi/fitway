# FITWAY — Paper-First Product Surface Inventory

> **Archived 2026-08-06 — historical evidence, not current authority.** This file sat untracked
> at the repository root and called itself an "authoritative coverage inventory". It is not, and
> it never entered the source-of-truth order in `AGENTS.md`. Three specific claims are void:
>
> 1. **Its coverage inventory is out of date.** It records the public board and the whole
>    `/admin` surface as MISSING from Paper, and names the login and staff sets with the old
>    `— RESPONSIVE + STATES` suffix. Five days later the Paper design phase closed with four
>    approved `— CURRENT` families, including `PUBLIC CROWD BOARD` and
>    `OWNER DAILY ANALYTICS`. See [ADR-007](../../adr/ADR-007-paper-visual-source-of-truth.md).
> 2. **Its section 9 implementation gate has no force.** Delivery scope and gating are governed
>    by `PHASES.md` and `PROJECT_STATE.yaml`; a document cannot grant itself a gate over them.
> 3. **Its section 6 "Never to be built: commands panel · reset confirmation dialog", and the
>    matching sentence in R12, contradict locked Product/Spec.** `SPEC.md` story 14 requires a
>    reset behind a confirmation dialog; `SPEC.md` also locks manual correction, direct count
>    entry, and audited reset-to-zero. `PHASES.md` Phase 5 is "Commands, corrections, resets, and
>    audit", `DESIGN_GUIDE.md` §11 requires the confirmation dialog, and `phase5-command-domain`
>    is already integrated. Spec wins. Whether the approved Paper Staff family actually omits
>    command controls is a separate, unresolved product question recorded in
>    [the closeout phase record](../../phase-records/paper-design-phase-closeout.md); it is
>    `NEEDS_HUMAN`, not settled by this file.
>
> R12 also misattributes a 15-item visual reject list to `docs/adr/ADR-006-visual-authority.md`,
> which contains no such list. Retained for its surface/state matrix and atomic-design
> decomposition, which remain useful research input. The body is preserved unedited.

**Date:** 2026-07-31 · **Branch:** `work/phase5-staff-ui-b03-retry` @ `6cc6d6a`
**Paper file:** `FITWAY UX Exploration` (16 artboards, 2934 nodes, single page, 0 comment threads)
**Status of this document:** authoritative coverage inventory. Read-only audit. No Paper, code, test, or spec was modified.

---

## 1. Executive conclusion

FITWAY has **four routes and roughly fourteen designable product surfaces**. Paper currently holds a complete foundation specification (9 sheets), two approved directions, and **two production sets** — login and staff monitoring. Those two sets are genuinely production-grade in Arabic/English and desktop/mobile.

Everything else is missing:

- **The public crowd board `/` — the product's primary audience and its entire reason to exist — has zero Paper representation**, despite being fully implemented and locked by visual regression tests. This is the single largest gap.
- **The whole owner area `/admin` has zero Paper representation**, including the one section (analytics) that is already built.
- **The tablet band (721–820px) is a real, CSS-encoded, test-verified third composition and is undesigned in every Paper set**, including the two "complete" ones.
- Owner sign-in, 404/unknown route, global error boundary, and offline all have no design and, mostly, no implementation.

Approved direction ≠ production set. `A3.1` and `02F.5` are canonical *sources of truth*; only the two Zone 03 sets are production coverage, and both need a tablet addendum to close.

### Standing product decision — the staff experience is monitoring-only

**Authoritative and settled. Not a blocking decision, not an open question, not a contradiction.**

The counting system is the **sole authority** over the reading. The staff experience observes it and never overrides it. The following are **out of scope for the product** and must never be designed in Paper:

- manual count adjustment
- correction submission
- reset-to-zero
- empty-gym actions
- correction history
- count-command states (`pending` / `applied` / `superseded`) and their error surfaces

The corresponding repository surfaces — `apps/web/src/components/staff/commands/**`, `packages/api/src/commands/**`, `staff.issueCorrection`, `staff.issueReset`, `staff.recentCommands`, and their coverage in `tests/browser/phase5-staff-ui.browser.spec.ts` — are **legacy implementation scheduled for removal during the later implementation phase**. They are not evidence of a required surface. Paper 02F.5 was already correct: *"Monitoring is read-only. The counting device is the sole authority — the page offers no manual adjustment, no exact-count entry, no correction and no reset."*

**Do not extend Paper to cover them. Do not reopen this.**

---

## 2. Repository-derived product surface

Router: TanStack Router file-based, `apps/web/src/routes/`. `apps/web/src/routeTree.gen.ts` confirms **exactly four routes**: `/`, `/login`, `/staff`, `/admin`. No middleware; Vercel rewrites `/(.*) → /index.html` (`vercel.json`).

### Roles
`authRole = ["staff","owner"]`, `authPrincipalKind = ["shared_staff","owner"]` — `packages/db/src/schema/auth.ts:15-21`, mirrored `packages/auth/src/contracts.ts:1-8`.

| Role | Reaches |
|---|---|
| anonymous | `/`, `/login` |
| staff (shared PIN, 6–12 Western digits) | `/`, `/login`, `/staff`; `/admin` → localized **403 panel**, not a redirect |
| owner (email + password, 12–128 chars) | everything |

Guards: `requireStaffOrOwner` → 401, `requireOwner` → 403 (`packages/api/src/auth/authorization.ts`); route `beforeLoad` + `apps/web/src/routes/_auth/-session.ts`. Nav visibility (`StaffShell showAdminLink`) is cosmetic, not authority.

### Product invariants that constrain every design
From `SPEC.md`, `PHASES.md` Invariants, `FITWAY_PRODUCT.md`:
1. **No public capacity, denominator, percentage, or "% full".** Schema v2 is `.strict()`. Staff/owner-only, always.
2. No public health, diagnostics, device identity, or history on `/`.
3. No video, frame, image, biometric, or per-visitor data anywhere.
4. **`trend` is permanently `null` in v1** (`z.null()`). Never design a trend indicator.
5. Stale, absent, closed, loading, and error must never look live.
6. Arabic RTL is default; English LTR first-class. Dark-only. Cairo 400/500/600/700 only.

### State vocabulary (exact identifiers)

| Domain | Values | Source |
|---|---|---|
| Public freshness | `unavailable · fresh · stale · closed` | `packages/api/src/public-occupancy.ts:20-47`; client re-derive `apps/web/src/lib/public-occupancy.ts:53` |
| Crowd band | `quiet · moderate · busy · packed` | `packages/api/src/occupancy/bands.ts` |
| Reading source | `edge · manual` | `public-occupancy.ts` |
| Health freshness | `current · stale · unavailable` | `packages/api/src/health/snapshot.ts:22-35` |
| Health condition | `healthy · degraded · failed · unknown` | same |
| Device/camera/feed | `ok · degraded · failed · unknown` (nullable) | `packages/api/src/edge-push.ts:23` |
| UI health tone | `live · stale · offline · danger` | `apps/web/src/components/staff/operational-snapshot-view.tsx:44-51` |
| ~~Command status~~ **LEGACY — out of scope** | `pending · applied · superseded` | `packages/api/src/commands/schemas.ts:33-34` — to be removed |
| ~~Command type~~ **LEGACY — out of scope** | `set_count · reset_zero` | same — to be removed |
| Login error | `invalid-pin · invalid-credentials · rate-limited · service · null` | `apps/web/src/routes/login.tsx:30-35` |
| ~~Command error~~ **LEGACY — out of scope** | `badRequest · forbidden · sessionExpired · serviceError · deltaUnavailable` | `apps/web/src/components/staff/commands/messages.ts:55-60` — to be removed |
| Analytics bucket | `value · closed · missing`; source `live · backfill · manual` | `packages/api/src/analytics/time-context.ts:89-109` |
| Admin access | `allowed · forbidden` | `apps/web/src/routes/admin.tsx:15-21` |
| Canonical design grammar | Loading · Live · Delayed · Unavailable · Closed · Error | `DESIGN_GUIDE.md` §6 |

### Responsive facts
Canonical review widths (9): **320 · 360 · 390 · 721 · 768 · 820 · 1024 · 1200 · 1440** — `DESIGN_GUIDE.md` §8, iterated verbatim in all four browser specs.

Actual CSS compositions (these are what must be *designed*, not the nine widths):

| Composition | Query | Applies to |
|---|---|---|
| Narrow mobile | `max-width: 370px` (`max-width: 360px` for commands) | public, staff, owner, commands |
| **Mobile** | `max-width: 720px` | `index.css:859`, `staff.css:38,734`, `commands.css:409`, `owner-analytics.css:456` |
| **Tablet recomposition** | `721–820px` | `index.css:795`, `staff.css:706`, `owner-analytics.css:441` |
| Intermediate desktop | `821–1199px` (public), `≤1023` (staff), `≤1199` (owner) | `index.css:753`, `staff.css:673`, `owner-analytics.css:435` |
| **Desktop** | ≥1200 / 1440 anchor | all |

Screenshot anchors: 1440×900, 768×1024, 390×844. 200% zoom reflow tested at 640×900 → maps onto the **mobile** composition, not a separate design.
Rules: no document horizontal overflow at any width (`index.css:1-9`); `100vh → 100svh → 100dvh`; mobile **recomposes** (crowd level → count → signal → freshness), never scales down; 44×44px minimum targets; safe-area insets use physical properties so RTL never swaps device cutouts.

### i18n facts
Hand-rolled typed catalogs — no library. `apps/web/src/i18n/{catalog,locale,provider,format}.ts`, `messages/{ar,en}.ts`, plus scoped catalogs in `components/staff/messages.ts`, `components/staff/commands/messages.ts`, `components/owner/messages.ts`.
Default `ar` / `dir="rtl"`. **Locale is client state in `localStorage` (`fitway.locale`), not in the URL** — no locale routing, no shareable AR/EN link. Numerals are **Western `0-9` in both languages** (`ar-SA-u-nu-latn`). Times render in the **configured gym timezone**, never the viewer's; Arabic `ص/م`, English `AM/PM`. Bidi isolation via U+2068/U+2069 and `<bdi>`. English is composed for English, not mechanically mirrored (`Paper sheet 04`).

### Existing shells and shared components
`packages/ui/src/components/`: `button`, `input`, `label`, `skeleton` only. Icons `lucide-react`.
`apps/web/src/components/`: `PublicAtmosphere` (reused by all three shells), `BrandHeader`, `SkipLink`, `PublicLiveCardShell`, `OccupancyStatus`, `CrowdSignal` (28-bar cumulative instrument, grouped 6/5/8/9), `ClosedState`, `UnavailableState`, `PublicErrorState`, `PublicStatusSkeleton`, `staff/StaffShell` (used by **both** `/staff` and `/admin`), `staff/OperationalSnapshotView` + Skeleton + Error, `owner/OwnerAnalyticsPage`/`View`. (`staff/commands/StaffCommandsPanel` also exists but is **legacy, out of scope, and scheduled for removal** — it is not a shared component of this product.)
Tokens: `packages/ui/src/styles/globals.css:114-200` — the `--fw-*` set matches the Paper token set, extended in code with `--fw-band-*` (red-only ramp), `--fw-chart-1…6`, `--fw-chart-grid`, `--fw-surface-1/2/3`, `--fw-glass-bg`.

### Owner-controlled settings (no flag system exists)
Append-only `settings_versions` — `packages/db/src/schema/application.ts:106-192`. No editing UI yet (phase11, PLANNED). Fields that change what users see: `capacity` (staff/owner only, never public), `quiet/moderate/busy_max_percent` (which crowd word shows), `timezone`, `business_day_boundary`, `push_interval_seconds`, `fresh_for_seconds` (fresh→stale), `operational_stale_after_seconds`, `public_poll_seconds`, `schedule_{sun..sat}_{open,close}` (closed state + next-open time).

---

## 3. Current Paper coverage

### Zone 01 — Foundation (specification only)
Nine 1440-wide sheets, `00`–`08`. These are **specifications, not screens**. Do not count them as coverage for any surface.

| Sheet | Contains |
|---|---|
| 00 Direction | Masthead, product character, ground rules, index |
| 01 Colour, surface, elevation | Surface ladder, colour roles, edges/depth |
| 02 Typography and numerals | Cairo ×4 weights, 7 type roles (Reading, Metric, Route title, Panel title, Body, Label+value, Eyebrow), numerals/bidi |
| 03 Space, size, reach, reflow | 8-step 4px scale, 3 control heights, four width behaviours, access non-negotiables |
| 04 Direction, header, navigation | 72px rail (one per page), 3 zones, EN/AR/variant specimens, mirror rules, **"navigation is earned"** |
| 05 Actions, inputs, touchable | 3 action ranks + states, **language control (not a rank)**, field specimens, auth & retry, ornament test, background mark |
| 06 Containers, state, feedback | Panel anatomy, 6-state grammar, health & notices |
| 07 Login and staff monitoring blocks | Route rail, 3 sign-in blocks, 9 monitoring blocks |
| 08 Product language | 5 copy rules, ~9 rewrites, 12-term AR/EN lexicon with explicit "NOT" column |

### Zone 02 — Approved directions (canonical sources of truth, **not** production sets)
| Artifact | Scope |
|---|---|
| `A3.1 FINAL — SURFACE INTEGRATION` | Desktop login, Arabic, integrated header + login stage. Single composition. |
| `STAFF MONITORING — APPROVED DIRECTION` (Direction 02F.5) | Desktop Arabic monitoring board: fixed header, page heading, integrated board (primary reading + fact rail + camera notice), 3 focused states. Single composition. |

### Zone 03 — Production sets
**`LOGIN PRODUCTION SET — RESPONSIVE + STATES`** — 15 compositions
- Desktop idle: AR, EN (1440×936)
- Mobile idle: AR, EN (390×880)
- Arabic states ×5: keyboard focus · incorrect access code · too many attempts · sign-in unavailable · signing in
- English states ×4: incorrect access code · too many attempts · sign-in unavailable · signing in
- Production note: the 28-second retry duration is server-provided

**`STAFF MONITORING PRODUCTION SET — RESPONSIVE + STATES`** — 18 compositions + 9 focused examples
- Desktop live: AR, EN (1440×816) · Mobile live: AR, EN (390×880)
- Arabic desktop states ×7: loading · delayed/last-known · load failure + retry · club closed · counting device offline · camera unstable (reading trusted) · combined trust failure
- English desktop states ×3: delayed/last-known · load failure + retry · counting device offline
- Mobile states ×4: AR reading unavailable · AR delayed · EN load failure · EN club closed
- Focused examples A–I: freshness attached to its reading · operational status cells · loading region · retry region · removal-not-dimming · AR notice strip variants · EN notice strip · two ways a reading disappears (AR, EN)
- Production note: **"Monitoring is read-only… no manual adjustment, no exact-count entry, no correction and no reset."**

### Classification summary

| Classification | Artifacts |
|---|---|
| Specification only | Sheets 00–08 |
| Visual exploration | *(none remaining on canvas)* |
| Approved direction | A3.1, 02F.5 |
| Complete responsive + state production set | *(none — both Zone 03 sets lack the tablet composition)* |
| **Incomplete production coverage** | Login set, Staff monitoring set |
| **Missing surface** | Public `/`, all of `/admin`, owner sign-in, shared auth shell/nav, 404, global error, offline |
| **Out of scope — never to be designed** | Staff count commands: manual adjustment, correction submission, reset-to-zero, empty-gym actions, correction history, command states |

No duplicated, outdated, or rejected artifacts remain on the canvas. Zone labels are consistent with content.

---

## 4. Complete surface and state matrix

Coverage legend — **Langs:** AR+EN required unless noted. **Views:** M = mobile ≤720 (verify 320/360), T = tablet 721–820, D = desktop ≥1200 (verify 1024/1200).
Include a state or breakpoint only where it changes content, trust, interaction, hierarchy, or composition.

### Public

| # | Surface | Route | Purpose | Langs | Views | Meaningful states | Deps | Shell | Paper status | Authoritative? | Remaining design work |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **P1** | Crowd board | `/` (anonymous) | "Should I go now?" — band, approximate count, open/closed, freshness | AR+EN | M·T·D | `loading` · `fresh` ×4 bands (quiet/moderate/busy/packed change the 28-bar instrument) · `stale` (retains count + explicit last-known warning) · `closed` (removes reading, shows next opening; **must not invent one** when all days closed) · `unavailable` (no count, no meter) · `error` (**removes retained readings**, keyboard retry) | `GET /public/occupancy` v2, `X-Fitway-Poll-Seconds` | `.public-page-shell` = `PublicAtmosphere` + `SkipLink` + `BrandHeader` | **MISSING** | — | **Full production set.** 6 states × 2 langs × 3 views, plus the 4 band variants of `CrowdSignal`. Evidence: `apps/web/src/routes/index.tsx`, `components/crowd-signal.tsx`, `components/public-states.test.tsx`, `tests/browser/public-baseline.browser.spec.ts` |

### Authentication

| # | Surface | Route | Purpose | Langs | Views | Meaningful states | Deps | Shell | Paper status | Authoritative? | Remaining design work |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **A1** | Staff PIN sign-in | `/login` (anonymous) | Shared-PIN entry, 6–12 Western digits | AR+EN | M·T·D | `idle` · `keyboard focus` · `invalid-pin` (client format) · `invalid-credentials` (server, non-enumerating) · `rate-limited` (server countdown, honors `Retry-After`) · `service` · `submitting` | `POST /api/auth/staff/pin`, `GET /api/auth/session` | `.login-shell` (own shell, reuses `PublicAtmosphere` + `BrandHeader`) | **PRODUCTION SET — INCOMPLETE** | **Yes**, do not reopen | Add **tablet (721–820)**; add **mobile state reflow** (only idle exists at 390); resolve whether `invalid-pin` and `invalid-credentials` are one visual state or two (§8 R4) |
| **A2** | Owner sign-in | *no route* (owner) | Owner email + password entry | AR+EN | M·T·D | idle · invalid · rate-limited · service · submitting | `POST /api/auth/owner/password`, `GET /api/auth/owner/session` | undecided | **MISSING** | — | **Product decision first (§8 R5)**, then full set. `SPEC.md:531` calls it "a separately provisioned real account path" — it has no route and no design |

### Staff

| # | Surface | Route | Purpose | Langs | Views | Meaningful states | Deps | Shell | Paper status | Authoritative? | Remaining design work |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **S1** | Monitoring board | `/staff` (staff+owner) | Current reading + device health, **read-only — the counting system is the sole authority** | AR+EN | M·T·D | `loading` · `live/current` · `delayed / last-known` · `unavailable` (removes occupancy, **retains authorized capacity**) · `club closed` · `counting device offline` · `camera unstable, reading trusted` · `combined trust failure` · `load failure + retry` · `401 → redirect` | `staff.operationalSnapshot` (30s poll) | `StaffShell` | **PRODUCTION SET — INCOMPLETE** | **Yes** (02F.5 supersedes the repo's 02F.2 review) | Add **tablet (721–820)**; add remaining **EN desktop states** (4 of 7 missing — apply the copy-sensitivity rule deliberately rather than mirroring all 7). Note: removing the legacy command panel frees the desktop actions column the human verdict flagged as over-long — this is a **removal** at implementation time, not a Paper change |
| ~~**S2**~~ | ~~Count commands~~ | `/staff` | — | — | — | — | — | — | **OUT OF SCOPE — settled product decision** | n/a | **None. Never design this.** Manual adjustment, correction submission, reset-to-zero, empty-gym actions, correction history, and command states are not part of the product. `apps/web/src/components/staff/commands/**`, `packages/api/src/commands/**`, and their coverage in `tests/browser/phase5-staff-ui.browser.spec.ts` are **legacy implementation to be removed in the later implementation phase** |

### Owner

| # | Surface | Route | Purpose | Langs | Views | Meaningful states | Deps | Shell | Paper status | Authoritative? | Remaining design work |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **O1** | Daily analytics | `/admin` (owner) | KPI metrics, occupancy curve, disclosure data table | AR+EN | M·T·D | `loading` · `error + retry` · `noObserved` (no observation) · `closedDay` (scheduled closed) — these two must stay **visually distinct** · `populated` · `legendZero` (genuine zero) · bucket `value`/`closed`/`missing` · source `live`/`backfill`/`manual` · chart **hover** (pointer) and **touch** readout parity in RTL and LTR | `admin.session`, `admin.analytics.daily`, `admin.analytics.timeContext` | `StaffShell` (`active="admin"`) | **MISSING** | — | **Full production set.** Chart is hand-rolled SVG (`components/owner/owner-analytics-view.tsx`); library still an open question (§8 R10) |
| **O2** | Forbidden panel | `/admin` (staff) | Localized 403 with "back to operations" — a real rendered surface, not a redirect | AR+EN | M·T·D | single state | `adminAccess: "forbidden"` | `StaffShell` | **MISSING** | — | One composition per lang; can reuse the panel + notice organisms |
| **O3** | Owner area layout | `/admin/*` (owner) | Nested-section layout for the 5 planned owner sections | AR+EN | M·T·D | section-nav active/inactive; deep-link entry | — | `StaffShell` + section nav | **MISSING** | — | `SPEC.md:534` requires "nested sections under one layout"; no route, no layout, no design |
| **O4–O7** | Settings · Accounts/PIN provisioning · Audit history · Health | `/admin/*` (owner) | phase11 sections | AR+EN | M·T·D | per-section (settings versioning + effective-from; PIN provision/rotate/deactivate; audit filters) | `settings_versions`, auth tables | O3 layout | **MISSING** | — | Design when each phase opens; do **not** design speculatively ahead of the phase (§7 step 8) |

### Cross-cutting

| # | Surface | Scope | Purpose | Langs | Views | Meaningful states | Paper status | Remaining design work |
|---|---|---|---|---|---|---|---|---|
| **X1** | Shared auth shell + navigation | `StaffShell` — `/staff` **and** `/admin` | Skip link, fixed 72px rail, brand, destinations, locale toggle, sign-out | AR+EN | M·T·D | **one destination (staff) vs two destinations (owner)** — sheet 04 says destinations appear only when there is more than one, so the two-destination rail is now *required*; active/inactive; mobile rail collapse | Partial — only the single-page fixed header inside 02F.5 | **Design the shell as its own artifact**, including the two-destination owner rail and the mobile/tablet rail. Blocks S1, S2, O1, O2, O3 |
| **X2** | Unknown route / 404 | any path | — | AR+EN | M·T·D | single state | **MISSING** | No `notFoundComponent`, no catch-all; Vercel rewrites everything to `index.html`, so behaviour is currently undefined |
| **X3** | Global error boundary | app-wide | Unrecoverable client error | AR+EN | M·T·D | single state | **MISSING** | No `errorComponent` exists |
| **X4** | Offline / disconnected | app-wide | Network loss distinct from transport error | AR+EN | M·T·D | offline · reconnecting · recovered | **MISSING** | No service worker, no `navigator.onLine`. Currently collapses into generic `error`. Phase 6 owns the manual-fallback + reconnect story |

**Deliberately excluded from the matrix** (not surfaces): the removed `/dashboard` demo, sign-up route (stubbed to reject at `apps/server/src/auth/routes.ts:41`), theme/light toggle (dark-only v1), and the orphaned `emailLabel`/`passwordLabel` keys in `apps/web/src/i18n/catalog.ts:52+` and `messages/en.ts:160-172` — dead scaffold, **not** an intended surface (§8 R9).

---

## 5. Missing or incomplete Paper production sets

**Missing entirely (7 families)**
1. **Public crowd board `/`** — 6 states × 4 band variants × 2 langs × 3 views. *Highest priority.*
2. **Shared auth shell + navigation (X1)** — blocks four surfaces.
3. **Owner analytics `/admin` (O1)** — implemented, undesigned.
4. **Owner forbidden panel (O2).**
5. **Owner area nested layout (O3)** and its four planned sections (O4–O7).
6. **Owner sign-in (A2)** — decision-blocked.
7. **System surfaces:** 404 (X2), global error (X3), offline (X4).

**Incomplete (2 sets)**
8. **Login set (A1)** — missing tablet; missing mobile state reflow; `invalid-pin` vs `invalid-credentials` unresolved.
9. **Staff monitoring set (S1)** — missing tablet; 4 of 7 English desktop states absent.

**Out of scope — not a gap, and not to be produced (1)**
10. **Staff count commands (S2)** — removed from the inventory by settled product decision (§1). Paper 02F.5's monitoring-only scope is correct and complete on this point. Any future session that finds command code in the repository should read it as legacy pending removal, **not** as a missing Paper set.

**Cross-cutting gap:** the **tablet composition (721–820px)** is absent from *every* Paper artifact while being a distinct CSS composition in three stylesheets and verified at 721/768/820 in all four browser specs.

---

## 6. Reusable Atomic Design architecture

Derived from the surfaces above, the approved FITWAY visual system, sheets 00–08, and the Zone 03 focused examples. This states **what must be shared, what is a variant, and what is genuinely surface-specific** — construction decisions belong to whoever executes each Paper task.

### Atoms — shared, already specified
Colour/space/radius tokens (`--fw-*`, present in the Paper token set; code additionally defines `--fw-band-*`, `--fw-chart-*`, `--fw-surface-1/2/3` — **reconcile into Paper before O1**) · 7 type roles from sheet 02 · 3 action ranks + states (sheet 05) · locale toggle (explicitly *not* a rank) · field + hint + error (sheet 05) · status dot / tone (`live`/`delayed`/`offline`/`danger`) · 20px icon on 1.5px stroke, never the sole carrier · focus ring · skip link · brand mark, wordmark, background mark (two directions) · skeleton placeholder · Western-numeral and gym-timezone time presentation.

**Atoms still to define:** chart grid line · chart series stroke · legend swatch · disclosure chevron.

### Molecules
*Shared and already in Paper (Zone 03 focused examples A–I, sheet 07 blocks):* freshness line attached to its reading · operational status cell · notice strip (AR variants + EN) · loading region · retry region · removal-not-dimming treatment · genuine-empty block · label+value pair · header brand group.

*Shared, to design:* nav destination item (active/inactive) · sign-out control · KPI tile · chart hover/touch readout · legend item · data-table row · disclosure toggle · day/date selector.

*Explicitly not in the hierarchy:* stepper · direct-set field · reason field · confirm-dialog action pair · command history row. These belong to the out-of-scope command surface and must not enter the design system, even as "available" molecules.

### Organisms
*Shared:* 72px header rail (sheet 04 — three zones, brand at the far right in RTL, holds position, never mirrored mechanically) · panel (sheet 06 anatomy, grows to content, no fixed height).

*Approved, surface-specific:* login stage (A3.1) · integrated monitoring board = primary reading + fact rail + camera notice (02F.5).

*To design:* public live card + **28-bar cumulative crowd instrument** (`CrowdSignal`, grouped 6/5/8/9, heights 12%→100% — this is genuinely public-only and must **not** be reused shrunken on operational surfaces, per the reject list) · owner KPI row · occupancy curve chart · disclosure data table · forbidden/403 panel · analytics no-observation vs scheduled-closed panels.

*Never to be built:* commands panel · reset confirmation dialog. The product has **no modal dialog surface at all** as a result — if a future surface needs one, it must be justified from scratch rather than inherited from the legacy command panel.

### Templates
*Existing:* public shell (`PublicAtmosphere` + `SkipLink` + `BrandHeader`) · login shell · **auth shell (`StaffShell`)** — the only template shared across two routes, and the one that most needs to become an explicit Paper artifact.
*To design:* owner nested-section layout (O3).

### Pages
The fourteen surfaces in §4. `PublicAtmosphere` is the one visual constant across all three shells and is already CSS-only and motion-free — keep it that way.

### Reuse rules that fall out of the product
- **Variant, not new component:** language (AR/EN) and viewport (M/T/D) are variants of every surface. Never a fork.
- **Shared:** anything appearing on two or more surfaces — rail, panel, notice strip, freshness line, status cell, loading/retry/removal regions.
- **Genuinely surface-specific:** the 28-bar public instrument, the login stage, the occupancy curve.
- **Never shared:** capacity. It exists on staff/owner surfaces and must never cross to `/`.

---

## 7. Recommended sequence for producing the remaining Paper screens

One path, ordered by unblocking value and product risk. Each step is one Paper production task ending in explicit user approval. **No step is decision-blocked except step 7.**

| # | Task | Why here |
|---|---|---|
| **1** | **Public `/` production set** — 6 states × 2 langs × 3 views + 4 band variants | Largest audience, biggest gap, zero dependencies on any other task, and the product's core promise |
| **2** | **Shared auth shell + navigation (X1)** — one- and two-destination rails, AR/EN, M/T/D | Unblocks S1 tablet, O1, O2, O3 |
| **3** | **Tablet addendum (721–820) for the login and monitoring sets** | Closes the two existing sets to "complete" without reopening approved compositions |
| **4** | **Login gaps:** mobile state reflow + the `invalid-pin`/`invalid-credentials` decision | Small, finishes A1 |
| **5** | **Monitoring gaps:** remaining copy-sensitive EN desktop states | Small, finishes S1 |
| **6** | **Owner analytics (O1) + forbidden panel (O2)** | Both already implemented; O2 is cheap once the shell exists |
| **7** | **Owner sign-in (A2)** — after §8 R5 is decided | The only decision-blocked step |
| **8** | **Owner area layout (O3)**, then O4–O7 **as each phase opens** | Do not design phase11 sections speculatively |
| **9** | **System surfaces: 404 (X2), global error (X3), offline (X4)** | Small, but genuinely undefined today |

The staff command surface has no step in this sequence and never will — it is out of scope (§1). Its removal is an **implementation-phase** task, not a Paper task, and it does not gate any step above.

**Recommended next Paper production task: step 1 — the public `/` crowd board production set.**

---

## 8. Risks, contradictions, and unresolved product decisions

**R1 — RESOLVED. Staff commands are out of scope.** *(Was a blocking contradiction; settled by product decision, recorded in §1.)*
The staff experience is monitoring-only and the counting system is the sole authority. Manual count adjustment, correction submission, reset-to-zero, empty-gym actions, correction history, and count-command states are **not part of the product**. Paper 02F.5 was already correct; **Paper is not to be extended to cover them**.
The repository surfaces that implement them — `apps/web/src/components/staff/commands/**`, `packages/api/src/commands/**`, `staff.issueCorrection`, `staff.issueReset`, `staff.recentCommands`, and their coverage in `tests/browser/phase5-staff-ui.browser.spec.ts` — are **legacy implementation to be removed during the later implementation phase**.
*Residual risk, not a decision:* the removal is a code/test change of real size, and it will alter `/staff`'s composition by vacating the desktop actions column. That change is anticipated by S1's approved 02F.5 board, which never contained an actions column — so it closes part of the R6 human verdict rather than reopening S1.

**R2 — Retroactive gate violation on `/`.** The public board is fully built and visual-regression-locked (`tests/browser/public-baseline.browser.spec.ts` captures baselines at 1440×900, 390×844, 768×1024) with **no Paper representation at all**. Decide whether the Paper set ratifies the implementation as-built or is designed fresh with the implementation expected to follow.

**R3 — Tablet band undesigned everywhere.** 721–820px is a distinct composition in `index.css:795`, `staff.css:706`, `owner-analytics.css:441`, tested at three widths, and absent from every Paper artifact. Neither existing set is "complete" until this is closed.

**R4 — Login error granularity.** Code distinguishes `invalid-pin` (client-side format) from `invalid-credentials` (server, non-enumerating). Paper has a single "incorrect access code" state. Confirm whether these are one visual state or two.

**R5 — Owner sign-in path undefined.** `POST /api/auth/owner/password` and `GET /api/auth/owner/session` exist; `/login` renders only the PIN form. `SPEC.md:531` says "a separately provisioned real account path." No route, no design, no decision.

**R6 — `/staff` visual approval is withheld and the implementation is behind Paper.** `PROJECT_STATE.yaml`: `phase5-staff-ui: READY`, all gates `PENDING`, `integratedCommit: null`. The human verdict at `docs/phase-records/handoffs/phase5-staff-ui/20260727-230622-…-human-visual-verdict.md` lists open feedback: disconnected current-reading metrics, excess empty space and an over-long desktop actions column reading "mobile-like", technical/repetitive operational labels, over-verbose command history, header hierarchy and scroll behaviour, RTL/LTR switching continuity, and **decorative controls that look interactive but have no action**. Three of those items — the over-long desktop actions column, the over-verbose command history, and part of the excess empty space — are **resolved by the R1 removal**, not by redesign. Note the direction lineage: **Paper 02F.5 supersedes the repo's `FITWAY_MONITORING_02F2_REVIEW.md`** — do not re-derive the board from that file.

**R7 — Delayed/stale treatment is provisional.** `VIS-003` in `docs/POLISH_BACKLOG.md` and `DESIGN_GUIDE.md` §6 both explicitly defer stale/delayed colour and pattern treatment to Phase 6, yet the Paper monitoring set already renders delayed states. Treat those compositions as provisional and expect one revision.

**R8 — No 404, no error boundary, no offline.** Four routes, no catch-all, no `errorComponent`, no `navigator.onLine`. Vercel rewrites all unknown paths to the SPA, so today an unknown URL has undefined behaviour.

**R9 — Orphaned email/password i18n keys** (`apps/web/src/i18n/catalog.ts:52+`, `messages/{en,ar}.ts`) will read as an intended surface to any future session. They are dead scaffold; `/login` uses `staffWeb.login` instead. Excluded from this inventory by decision.

**R10 — Chart library open.** `SPEC.md` Open Questions. The owner curve is hand-rolled SVG constrained by `DESIGN_GUIDE.md` §12. Affects how much of O1 is designed versus adopted.

**R11 — Locale is not in the URL.** `localStorage` only, no locale routing, no SSR/SEO story, no shareable Arabic-vs-English link. Undecided — not documented as rejected. Affects whether language is purely a design variant or eventually a route variant.

**R12 — Standing prohibitions that gate every new artifact.** The 15-item visual reject list in `docs/adr/ADR-006-visual-authority.md` and `FITWAY_CROWD_LEVEL_VISUAL_RESEARCH.md` §6 — no mark encoding the band, no segmented four-state meter, no traffic-light ramp, no dots/tiles/rings/gauges/sparklines, no animated or pulsing crowd indicators, no shrunken public instrument on operational surfaces, no synthetic Cairo 800/900, no background motion. Plus the product invariants in §2: no public capacity or percentage, `trend` stays `null`. **Plus the §1 decision:** no manual adjustment, correction, reset-to-zero, empty-gym action, correction history, or command state on any staff surface.

**R13 — Paper file organisation.** All 16 artboards sit on a single page at 2934 nodes. Ten more production sets on one page will become unnavigable; consider a page or zone strategy before step 1.

---

## 9. Paper-first implementation gate

**No remaining user-interface implementation begins until the surface it touches has passed all six conditions:**

1. An **approved Paper representation** — a production set, not a specification sheet and not an approved direction.
2. **Language coverage:** Arabic RTL and English LTR, composed for each language rather than mirrored, with Western numerals in both and times in the configured gym timezone.
3. **Responsive coverage:** mobile (≤720, sanity-checked at 320/360), **tablet (721–820)**, and desktop (≥1200, sanity-checked at 1024/1200). Mobile must recompose, never scale.
4. **Meaningful states represented** — every state in the §4 row for that surface, using the sheet 06 grammar (Loading · Live · Delayed · Unavailable · Closed · Error) and the §2 identifiers.
5. **Explicit reuse relationships** to the §6 hierarchy — what is shared, what is a variant, what is surface-specific.
6. **Explicit user approval**, recorded.

**Existing coverage, not to be reopened:** the login production set (A1) and the staff monitoring production set (S1) are accepted as approved compositions. Only their declared gaps — tablet, login mobile states, remaining EN monitoring states — are open work. **No open contradiction remains against either set.** Reopen one only if a future audit surfaces a concrete product contradiction; none exists today.

**Conversely:** `/` and `/admin` are already implemented ahead of any Paper representation. The gate does not retroactively unbuild them, but no *further* work on those surfaces should proceed until their Paper sets exist and are approved (see R2).

**The one exception the gate explicitly permits:** removing the legacy staff command surface. Deleting an out-of-scope surface is not "beginning user-interface implementation" and requires no Paper representation — a surface that must not exist cannot have one. It is the only UI-affecting change authorised ahead of the remaining Paper sets, and it must be a **removal only**, not a redesign of what remains. `/staff`'s post-removal composition is already specified by approved direction 02F.5.
