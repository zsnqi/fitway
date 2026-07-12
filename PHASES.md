# Phases: FITWAY v1 — Live Gym Occupancy (Pilot)

> **Source spec:** `SPEC.md` (repo root). Governing docs: `RESEARCH.md` (scope/privacy),
> `DESIGN_GUIDE.md` (visual system), `SOL_SCAFFOLD_REVIEW.md` (stack).
>
> **How to use this plan.** Phases are vertical slices: each cuts through schema → server →
> UI (or edge contract) and is demoable and acceptable on its own. Complete, review, and
> accept one phase before starting the next (except where the dependency notes allow
> parallel tracks). After each phase is implemented, write its tests separately (per
> SPEC.md Testing Decisions) and then run the phase's Manual QA plan.
>
> **Parallelization.** Phases 3 and 4 can proceed in parallel after Phase 2. After
> Phase 5, the operations track (6 → 7 → 8) and the owner track (9 → 10 → 11) are
> independent of each other. Phase 11's audit view needs Phase 5; its health summary
> needs Phase 8. Phase 12 needs the device contract frozen (Phase 6).
>
> **Invariants that apply to every phase** (acceptance-level, from SPEC.md):
>
> - **Honesty**: no state ever presents stale/absent data as live; counts always carry
>   the "around/حوالي" qualifier and a freshness time.
> - **Cost rule**: no visitor-reachable path may invoke a function per request on cache
>   hit; visitor reads never touch history tables.
> - **Privacy**: no image/frame/video/identity data stored or transmitted, ever.
> - **UI system**: dark-only `--fw-*` tokens, Cairo, Arabic RTL default + English toggle,
>   Western digits (`-u-nu-latn`) everywhere, logical CSS properties only, status never
>   by color alone, per DESIGN_GUIDE §4–§15.
> - **Authorization**: every staff/owner operation role-checked server-side; router
>   guards are UX only.
> - **Audit**: every state-changing staff/owner action writes its audit entry in the
>   same database transaction.

---

## Architectural Decisions

Durable decisions carried from SPEC.md that apply across all phases:

- **System shape**: static TanStack Router web app + separate Hono (Node) server, two
  services in one Vercel project on one origin, `/api/*` rewritten to the server. oRPC
  for typed web procedures; OpenAPI 3.1 document is the Python edge contract. Drizzle
  migrations are the single schema history. Browser code never touches the database.
- **Monorepo placement**: domain modules (occupancy engine, schedule/business-day,
  command queue, payload builder, analytics, alerting, audit) live in the shared API
  package; the server app owns HTTP concerns (cache headers, device auth, cron); the DB
  package owns schema/migrations; the Python edge client lives in a top-level `edge/`
  directory that is **not** a pnpm workspace package.
- **Schema (conceptual)**: occupancy minutes (device-minute upserts), single-row current
  state, append-only settings versions, edge devices (hashed tokens), edge commands
  (pending → delivered → applied / superseded / expired), audit log, edge health log,
  alert log, Better Auth tables + roles. Single gym: no `gym_id` anywhere.
- **Routes**: `/` public · `/login` · `/staff` (staff|owner) · `/admin` (owner only,
  nested sections). No sign-up route.
- **Auth**: Better Auth admin plugin with roles `staff` and `owner`; self-registration
  disabled; email verification off; cookies `httpOnly`/`secure`/`sameSite=lax`; ~30-day
  rolling sessions; auth rate limiting on. Edge: static per-device bearer token
  (≥ 32 random bytes) stored hashed, per-device rate limiting.
- **Time model**: UTC storage; one configured IANA gym timezone (default `Asia/Riyadh`);
  configurable business-day boundary (default 04:00 local); per-weekday schedule where
  close ≤ open means past midnight.
- **Freshness defaults (all settings-driven)**: push ~20 s (also the heartbeat), fresh
  ≤ 90 s, stale ≥ 180 s, public poll ~60 s, manual-fallback validity 30 min, reset
  buffer 30 min, public cache `s-maxage` ~20–30 s + `stale-while-revalidate` ~2×.
- **Public payload**: language-neutral; open/closed + next-open, freshness baked in at
  origin refresh, band, count (floor 0), percent (display cap 100%), last-updated,
  source (`edge` | `manual`), computed-at, reserved `trend: null`, schema version.
  Capacity is not exposed publicly.

---

## Phase 1: Foundation reset & honest public shell

**User stories**: #5, #6, #8, #9
**Depends on**: — (none)

### What to build

Remove everything demo-shaped from the scaffold and establish the visual/i18n foundation,
ending with a real (DB-less) public read path. Delete the ASCII home page, the sign-up
form/route, the theme toggle and light-theme plumbing, the demo private procedure, and
unused chat-style UI components. Replace the default palette with the `--fw-*` token set
(DESIGN_GUIDE §17) mapped into Tailwind as the only theme; self-host Cairo with the §5
loading strategy; make the document Arabic/RTL by default with localized title/meta and
the Fitway favicon (§3). Build the ar/en message catalogs and a persistent language
toggle that swaps `dir`/`lang` and all copy. Implement the public occupancy GET endpoint
in a v0 form that returns an honest `unavailable` payload (schema version, freshness
`unavailable`, `trend: null`) with the specified CDN cache headers, and make `/` render
that state per §8.16 with skeleton loading (§8.31). `/login` keeps working with no
sign-up path.

### Acceptance criteria

- [ ] No scaffold demo surface remains: no ASCII home, no sign-up UI or route, no theme
      toggle or light theme, no demo procedures, no unused chat-style components.
- [ ] `/` renders the branded, dark-only, Arabic-RTL "live occupancy unavailable" state;
      the language toggle flips to English/LTR and the choice survives reload.
- [ ] All user-facing copy comes from the ar/en catalogs; digits are Western in both
      locales; no hard-coded strings in components.
- [ ] The public payload endpoint returns the unavailable payload with
      `Cache-Control: public, s-maxage=…, stale-while-revalidate=…`.
- [ ] Biome and TypeScript checks pass.

### Manual QA plan

1. **Public shell (mobile)**: Run `pnpm dev`, open `/` at a 390px viewport. **Expected**:
   near-black canvas, Cairo type, RTL layout, an honest "التحديث المباشر غير متاح الآن"
   state with icon + label (not color-only), no count or meter shown anywhere.
2. **Language toggle**: Switch to English. **Expected**: layout flips LTR, all copy is
   English, digits unchanged (Western); reload and open a new tab — preference persists.
3. **Dark-only**: Set the OS to light mode and look for any theme control. **Expected**:
   page stays dark; no toggle exists.
4. **Cache headers**: `curl -i` the public payload endpoint. **Expected**: `public,
   s-maxage` + `stale-while-revalidate` headers; JSON body with freshness `unavailable`
   and `trend: null`.
5. **Login intact, sign-up gone**: Visit `/login`. **Expected**: localized sign-in form
   renders; there is no sign-up link, tab, or route anywhere.
6. **Slow network**: Throttle to Slow 3G and reload `/`. **Expected**: skeleton state
   appears first, then the unavailable state; no layout shift from font loading.

---

## Phase 2: Tracer bullet — simulated edge to live public page

**User stories**: #1, #2, #4, #5, #7, #8, #9, #32, #35, #37, #38, #39
**Depends on**: Phase 1

### What to build

The end-to-end counting path with a simulated edge. First migration: edge devices
(hashed token, enabled, last-seen, last sequence), settings versions (seeded defaults:
capacity, band thresholds, timezone, business-day boundary, freshness windows), the
single-row current state, and occupancy minutes. Implement the device-token push
endpoint per the SPEC contract: sequence idempotency, live per-minute entry/exit
buckets, health snapshot, and the ack response (highest sequence, empty commands array
for now, settings version, server time); per-device rate limiting; 401 without a valid
token. Implement the occupancy engine as the only writer: dedup, floor at 0, band from
thresholds, minute upserts with capacity/settings snapshot and business-day attribution
(timezone + boundary). Upgrade the payload builder to read current state + settings and
bake in `fresh`/`stale`/`unavailable` by push age. Build the full public live
experience: hero number with qualifier, capped meter, band badge, freshness indicator,
stale banner (§8.9–§8.15), 60 s polling with jitter, Page Visibility pause and
refetch-on-focus, polite live-update announcements (§15). Deliver the edge simulator
v1 (push cadence, sequences, plausible entry/exit patterns, health flags, clean
stop/start). The OpenAPI document accurately describes the push endpoint; the
interactive reference stays development-only.

### Acceptance criteria

- [ ] With the simulator running, `/` shows the live count/band/percent and updates
      within one poll + cache window of a push.
- [ ] Stopping the simulator ≥ 3 min flips the payload to `stale` at the next origin
      recompute; the page dims the number and labels it last-known with its time;
      `unavailable` renders when no device data exists.
- [ ] Replayed or out-of-order sequences are acknowledged without changing state; minute
      rows are upserted idempotently.
- [ ] Count is floored at 0 end-to-end; meter display caps at 100%; band follows the
      seeded thresholds.
- [ ] Minute rows carry entries, exits, band, capacity snapshot, settings version, and
      the correct business day (04:00-boundary attribution); source `live`.
- [ ] The public endpoint reads only current state + settings (never history) and keeps
      the Phase 1 cache headers.
- [ ] Push without a valid device token → 401; per-device rate limit enforced.
- [ ] The OpenAPI document describes the push endpoint accurately; reference UI is not
      exposed in production builds.

### Manual QA plan

1. **Live flow**: Start the stack and the simulator; open `/`. **Expected**: a dominant
   count with the "around/حوالي" qualifier, meter fill and band badge matching the
   thresholds, "last updated" ticking; the number changes as the simulator pushes.
2. **No width jitter**: Watch the number change at 390px. **Expected**: tabular digits —
   the layout does not shift as digits change.
3. **Stale honesty**: Stop the simulator and keep the page open. **Expected**: within
   ~5 minutes the stale banner appears with the last-known value and time; the number is
   visibly dimmed; restarting the simulator returns the page to fresh.
4. **Visibility pause**: Hide the tab ≥ 2 min with DevTools network open. **Expected**:
   no polling requests while hidden; an immediate refetch on refocus.
5. **Device auth**: `curl` the push endpoint with a wrong token. **Expected**: 401.
   Replay a previously used sequence number with a valid token. **Expected**: acked, but
   counts unchanged (verify via `pnpm db:studio`).
6. **Floor at zero**: Configure the simulator to push more exits than entries.
   **Expected**: stored and displayed count never goes below 0.
7. **Business-day attribution**: Push data at a simulated 01:30 local time. **Expected**:
   the minute rows' business day is the *previous* local date (04:00 boundary).
8. **Contract doc**: Open the OpenAPI reference in dev. **Expected**: push
   request/response schemas match what the simulator actually sends/receives.
9. **Screen reader**: Inspect the accessibility tree / use a screen reader on `/`.
   **Expected**: band announced as text; count updates announced politely (no
   interruption spam).

---

## Phase 3: Open/closed schedule on the public page

**User stories**: #3
**Depends on**: Phase 2 (parallel with Phase 4)

### What to build

Add the weekly schedule to settings (per-weekday open/close, close-past-midnight
supported; seeded with the Google hours including Friday 2 PM–12 AM) and implement the
schedule module: open/closed at an instant and next-open computation in gym-local time.
The payload gains the `closed` state that overrides everything (no count, next-open
time); the public page renders the closed state per §8.13.

### Acceptance criteria

- [ ] When the schedule says closed, the payload reports `closed` with the correct
      next-open time and carries no live count, even while pushes continue.
- [ ] Past-midnight closing works: at a simulated 01:00 on a Sat–Wed schedule
      (6 AM–2 AM), the gym is open; at 03:00 it is closed with next-open 06:00.
- [ ] Friday's different hours produce the correct next-open when closed on Thursday
      night into Friday.
- [ ] The public page shows the closed state per DESIGN_GUIDE §8.13 in both languages,
      12-hour clock, Western digits, ص/م in Arabic.

### Manual QA plan

1. **Closed override**: With the simulator pushing, set today's close time (via the
   seeded settings row in `pnpm db:studio`) to one minute from now. **Expected**: within
   one cache window + poll, `/` flips to "Closed now — opens …" with no count or meter,
   despite active pushes.
2. **Past-midnight open**: Set the schedule to 6 AM–2 AM and check the page during a
   simulated 1 AM. **Expected**: page is open and live.
3. **Friday hours**: Verify the next-open shown late Thursday night is Friday 2:00 PM,
   not 6:00 AM. **Expected**: correct per seeded Friday row.
4. **Localized times**: Toggle language on the closed page. **Expected**: Arabic shows
   e.g. "٦:٠٠" never — digits stay Western ("6:00 ص"); English shows "6:00 AM".

---

## Phase 4: Staff access & live operational view

**User stories**: #10, #11, #15, #16, #18
**Depends on**: Phase 2 (parallel with Phase 3)

### What to build

Introduce roles and the staff surface. Configure the Better Auth admin plugin with
`staff` and `owner` roles; disable self-registration server-side; set cookies to
`sameSite=lax`/`secure`/`httpOnly` with ~30-day rolling sessions; enable auth rate
limiting; add a seed script that provisions the owner account and the shared front-desk
staff account. Build `/staff` (staff or owner) with server-side role enforcement on a
new operational-snapshot procedure (public payload fields + capacity, device last-seen,
health flags, source detail), polling every ~15–20 s. Compose the staff view per §8.28b
with an unmistakable stale/offline alert. Stub the `/admin` route as owner-only from day
one so enforcement exists before the owner area is built.

### Acceptance criteria

- [ ] Staff and owner accounts exist via the seed script; sign-in works; the session
      survives a browser restart (rolling ~30 days).
- [ ] `/staff` shows live count, band, last update, capacity, and device health,
      refreshing every ~15–20 s.
- [ ] When the edge is silent past the stale threshold, the staff view shows a prominent
      offline/stale alert distinct from the public presentation.
- [ ] A staff session calling any owner-only procedure is rejected by the server, not
      just hidden in the UI; unauthenticated visits to `/staff` redirect to `/login`.
- [ ] Direct calls to the sign-up endpoint are rejected server-side.
- [ ] Repeated failed logins hit the rate limit.

### Manual QA plan

1. **Staff sign-in**: Log in at `/login` with the seeded staff account. **Expected**:
   redirected/navigable to `/staff`; live count and health visible; Arabic RTL layout.
2. **Offline alert**: Kill the simulator and wait ~3 min. **Expected**: the staff view
   shows an unmistakable alert (icon + label + tint, not color alone) that live data is
   stale/offline.
3. **Role wall**: As staff, navigate to `/admin` directly. **Expected**: blocked (owner
   only). Then, from DevTools, invoke an owner-only procedure with the staff session.
   **Expected**: server rejects with an authorization error.
4. **No self-registration**: POST to the Better Auth sign-up endpoint directly.
   **Expected**: rejected.
5. **Session longevity**: Close the browser entirely, reopen the next day (or adjust the
   clock). **Expected**: still signed in.
6. **Login rate limit**: Enter a wrong password ~10 times rapidly. **Expected**: rate
   limiting kicks in with an honest, localized error.

---

## Phase 5: Corrections, resets & audit through the command queue

**User stories**: #12, #13, #14, #17, #33, #40
**Depends on**: Phase 4

### What to build

Make the count correctable, edge-authoritatively. Implement the command queue module
(issue / deliver / ack / supersede: `set_count`, `reset_zero`; newer pending set/reset
supersedes older) and the audit module (append in the same transaction as the mutation).
Staff UI per §8.29–§8.30: +/− steppers with an explicit Apply and optional reason;
direct count entry (non-negative integers, Western digits); reset behind a destructive
confirmation dialog that states the consequence. Extend the push exchange: requests
carry the highest applied command id; responses deliver pending commands oldest-first.
The simulator applies commands in order and reflects them in its next push. The staff
view shows pending → applied progression; the public page reflects the corrected value
once the corrected push lands.

### Acceptance criteria

- [ ] A staff correction reaches the public page within ~90 s while the simulator is
      online, and the corrected value survives subsequent pushes (never silently undone).
- [ ] Every correction, direct entry, and reset writes an audit entry
      (who/when/from → to/optional reason) atomically with the command.
- [ ] Reset is impossible without passing the confirmation dialog.
- [ ] Direct entry rejects negatives and non-integers on both client and server.
- [ ] Stacked pending set/reset commands: only the latest is delivered; earlier ones are
      marked superseded (with audit trail).
- [ ] A command issued while the simulator is down stays pending and is applied on
      reconnect before live counting resumes.

### Manual QA plan

1. **Stepper correction**: On `/staff`, step +3, add reason "spot check", Apply.
   **Expected**: pending indicator, then applied within ~40 s; `/` shows the corrected
   count within ~90 s; an audit row exists in `pnpm db:studio` with actor = staff
   account, from → to, and the reason.
2. **Direct entry validation**: Enter `25` → works identically. Enter `-5`, `2.5`, and
   Arabic-Indic digits. **Expected**: rejected with a localized message; nothing
   committed.
3. **Reset flow**: Click reset, read the dialog. **Expected**: consequence stated
   ("سيتم ضبط العدد إلى 0"); Cancel does nothing; Confirm → count reaches 0 publicly;
   audit row records the reset.
4. **Supersession**: Apply two different corrections within a few seconds. **Expected**:
   only the second value lands; the first command shows superseded in the DB.
5. **Offline command**: Stop the simulator, issue a correction, restart it.
   **Expected**: the command applies on reconnect before the count moves again.

---

## Phase 6: Offline resilience — manual fallback & backfill

**User stories**: #13 (offline path), #34, #35
**Depends on**: Phase 5

### What to build

Handle the edge being down without lying to visitors. Manual fallback: while the system
is `stale`/`unavailable`, a staff direct entry both creates the pending command and
immediately sets the current-state row (source `manual`), so the public page shows the
staff value with its own timestamp and a "manual estimate" presentation; manual values
use the 30-minute validity window instead of the 3-minute edge window. Backfill: pushes
flagged as backfill upsert history minutes only and never advance current state; the
simulator gains an outage mode (buffer while "offline", backfill on reconnect, apply
pending commands first). Reconnect reconciliation: the fallback's set-count command is
applied before the edge's live pushes retake authority.

### Acceptance criteria

- [ ] With the edge silent, a staff direct entry immediately shows on `/` as a manual
      estimate with an honest timestamp, and on `/staff` with source detail.
- [ ] The manual value stays presented as current for the configured validity window
      (default 30 min), then degrades to stale — staff never need to re-enter every
      3 minutes.
- [ ] After the simulator reconnects with buffered data: gap minutes appear in history
      marked `backfill`, current state returns to source `edge`, and the count continues
      from the applied fallback command.
- [ ] Re-sending the same backfill batch changes nothing (idempotent upserts).
- [ ] Backfill alone never flips the payload back to `fresh`; only live pushes do.

### Manual QA plan

1. **Fallback entry**: Stop the simulator, wait for stale, direct-enter `40` as staff.
   **Expected**: `/` shows ~40 with the manual-estimate presentation and its entry time;
   the freshness indicator reflects the manual source, not a fake "live".
2. **Validity window**: Lower the manual validity to 2 min in settings and wait.
   **Expected**: the manual value degrades to stale after the window, honestly labeled.
3. **Backfill on reconnect**: Restart the simulator in outage/backfill mode after a
   ~15-min gap. **Expected**: in `pnpm db:studio`, gap minutes exist flagged backfill;
   current source is `edge` again; the live count continued from the fallback value via
   the applied command.
4. **Idempotent replay**: Trigger the simulator to resend the same backfill batch.
   **Expected**: row count and values unchanged.
5. **History untouched by fallback**: Verify the fallback did not overwrite historical
   minutes from before the outage. **Expected**: pre-outage rows intact, source `live`.

---

## Phase 7: Cron & scheduled daily zero-reset

**User stories**: #36
**Depends on**: Phases 3 and 5

### What to build

Introduce the internal cron entry point and its first consumer. A minutely cron endpoint
authenticated with a bearer `CRON_SECRET` (Vercel Cron config added; invoked manually in
local dev). Consumer: scheduled-reset evaluation — at close + buffer in gym-local time,
issue a system `reset_zero` command exactly once per business day and mark the business
day closed; the audit entry's actor is `system`. If the edge is offline when due, the
command stays pending and applies on reconnect before live counting resumes (Phase 5/6
machinery). The evaluation must respect the per-weekday schedule, including Friday and
past-midnight closes.

### Acceptance criteria

- [ ] Invoking the cron endpoint after close + buffer issues exactly one system reset
      per business day; repeated invocations do not duplicate it.
- [ ] The simulator applies the reset; the stored count reaches 0; the audit entry shows
      actor `system` with the schedule context.
- [ ] Past-midnight closes reset on the correct business day (e.g., a 2 AM close + 30 min
      buffer resets at 2:30 AM attributed to the prior business day).
- [ ] Requests without the correct `CRON_SECRET` are rejected.
- [ ] Edge offline at reset time: the reset applies on reconnect before pushes advance
      the count.

### Manual QA plan

1. **Reset fires**: Set today's close to 31 minutes ago (buffer 30) via settings; invoke
   the cron endpoint with the secret. **Expected**: a system `reset_zero` command
   appears; the simulator applies it; `/` shows closed and the underlying count is 0.
2. **Exactly once**: Invoke the cron endpoint five more times. **Expected**: no
   additional reset commands for the same business day.
3. **Auth**: Invoke without / with a wrong secret. **Expected**: rejected; nothing runs.
4. **Offline reconciliation**: Stop the simulator, trigger the due reset, restart the
   simulator with buffered counts. **Expected**: reset applies first; only then do live
   pushes move the count.
5. **Friday schedule**: Seed Friday hours and simulate its close. **Expected**: the reset
   uses Friday's close + buffer, not the weekday one.

---

## Phase 8: Telegram health alerting & logs

**User stories**: #28, #29, #30, #31
**Depends on**: Phase 7

### What to build

Make failures reach the maintainer. Health log (offline/online transitions from cron
detection plus device-reported camera/feed/process flags) and alert log (condition
started, sent at, outcome, recovery linkage). Alerting module implementing the SPEC
policy: alert on push silence past the stale threshold during open hours or the
30-minute pre-open window; alert on device-reported failure flags; at most one re-alert
per condition every 30 min; closed-hours suppression with pre-open re-check; recovery
notice when the condition clears. Telegram delivery isolated behind a one-function
notifier; bot token + chat id validated in the env package. Daily retention cleanup
(~12 months for audit/health/alert logs; occupancy history untouched). Simulator gains
failure injection (silence and health flags).

### Acceptance criteria

- [ ] Killing the simulator during (configured) open hours produces one Telegram alert
      within ≤ 5 min of heartbeat loss, and a recovery notice within ≤ 5 min of the
      first post-recovery push — both recorded in the alert log.
- [ ] An unresolved condition re-alerts at most every 30 min.
- [ ] A failure starting during closed hours sends nothing until the pre-open window,
      then alerts if still unresolved.
- [ ] A device-reported camera/feed failure alerts distinctly from silence.
- [ ] Health log records offline/online transitions matching reality.
- [ ] Retention cleanup removes audit/health/alert rows older than ~12 months and
      touches nothing else.

### Manual QA plan

1. **Real delivery**: Configure a real Telegram bot + chat id in local env; kill the
   simulator during open hours and invoke the cron each minute. **Expected**: a
   correctly worded alert arrives in Telegram within ≤ 5 min; the alert log rows match.
2. **Bounded re-alerts**: Keep it down ~65 min. **Expected**: roughly two re-alerts
   (30-min cap), not one per minute.
3. **Recovery**: Restart the simulator. **Expected**: a recovery notice within ≤ 5 min,
   linked to the original condition in the alert log.
4. **Closed-hours suppression**: Set the schedule to closed, kill the simulator, run the
   cron. **Expected**: no message. Move the pre-open window to now. **Expected**: the
   pre-open alert fires.
5. **Camera flag**: Have the simulator push a camera-failure health flag. **Expected**: a
   distinct alert naming the camera/feed condition.
6. **Retention**: Insert an audit row dated 13 months back and one 11 months back; run
   the daily cleanup. **Expected**: the 13-month row is gone, the 11-month row and all
   occupancy minutes remain.

---

## Phase 9: Owner admin shell & core analytics

**User stories**: #18, #19, #21
**Depends on**: Phase 4 (uses history accumulated since Phase 2; parallel with 6–8)

### What to build

The owner area and its first analytics. `/admin` as an owner-only layout with nested
sections and navigation between `/staff` and `/admin` for the owner. Select the chart
library (DESIGN_GUIDE §9 constraints: RTL mirroring, token colors, accessible
non-color/hover alternatives). Build today's occupancy curve (business-day and
gym-timezone aware; closed periods and missing data rendered distinctly) and the KPI
cards per §8.19: today's/per-day peak, daily average, and estimated daily visits — the
visits figure always carrying the "estimated entrance crossings, not unique members"
framing. Analytics read band/capacity snapshots from the minute rows, not current
settings. Extend the simulator to generate multi-day history so this phase is reviewable
without waiting weeks.

### Acceptance criteria

- [ ] The owner reaches `/admin` and sees today's curve and the KPI cards; staff cannot
      (server-enforced).
- [ ] The curve respects the business-day boundary: post-midnight activity belongs to
      the prior business day.
- [ ] Daily visits = sum of entries per business day, displayed with the honest framing
      in both locales.
- [ ] Charts follow reading direction (time flows right-to-left in Arabic), use the
      `--fw-*` chart tokens, and render closed vs no-data distinctly from zero.
- [ ] Empty database → honest empty states (§8.32), no broken or zero-filled charts.
- [ ] Historical KPIs are computed from row snapshots (changing capacity later must not
      rewrite the past — verified fully in Phase 11).

### Manual QA plan

1. **Curve renders**: Generate several days of simulated history; open `/admin` as
   owner. **Expected**: today's curve with localized axes, Western digits, and the
   current moment at the reading-direction end; toggle language and confirm the time
   axis mirrors.
2. **Visits framing**: Check the daily-visits KPI card in Arabic and English.
   **Expected**: the "estimated entrance crossings, not unique members" qualifier is
   present in both.
3. **Business-day attribution**: Generate activity at a simulated 01:00. **Expected**:
   it appears in the previous business day's curve, not today's.
4. **Empty state**: Point at a fresh database. **Expected**: friendly localized empty
   states per §8.32, not zeros or errors.
5. **Role wall**: As staff, request `/admin` and its procedures directly. **Expected**:
   blocked server-side.
6. **Mobile**: View `/admin` at 390px. **Expected**: charts full-width, ≤ ~220px tall,
   readable ticks per §13; no horizontal page scroll.

---

## Phase 10: Heatmap, week-over-week & CSV export

**User stories**: #20, #22, #23
**Depends on**: Phase 9

### What to build

Complete the analytics set. Day-of-week × hour-of-day heatmap of average occupancy using
the single-hue red ramp with closed and no-data cells visually distinct from zero
(§8.21, §4.6). Week-over-week comparison with an honest empty state until two comparable
weeks exist. Owner-only CSV export: per-minute rows for a selected date range, streamed,
with UTC and gym-local time columns, Western digits, spreadsheet-safe UTF-8. Date-range
control per §8.22.

### Acceptance criteria

- [ ] Heatmap distinguishes closed, no-data, and genuinely-zero cells; values match the
      minutes table.
- [ ] Week-over-week shows the empty state with < 2 comparable weeks and a real
      comparison with ≥ 2.
- [ ] CSV export downloads for a date range, contains UTC + local timestamps, count,
      entries, exits, band, and capacity columns, Western digits, and opens cleanly in a
      spreadsheet (row count = minutes in range).
- [ ] Export is owner-only, enforced server-side.

### Manual QA plan

1. **Heatmap**: With ≥ 2 weeks of simulated history, open the heatmap. **Expected**: a
   plausible weekly pattern; tapping/hovering a cell reveals its value; closed hours are
   hatched/distinct from low-occupancy cells; RTL orientation follows the locale.
2. **WoW gate**: With 1 week of data. **Expected**: honest empty state. With 2+ weeks.
   **Expected**: a comparison with direction indicated by more than color alone.
3. **CSV correctness**: Export a 2-day range and open it in Excel/LibreOffice.
   **Expected**: UTF-8 intact (Arabic-safe), both time columns present, digits Western,
   row count equals the covered minutes; spot-check three rows against `pnpm db:studio`.
4. **Role wall**: Call the export with a staff session. **Expected**: rejected.
5. **Empty range**: Export a range with no data. **Expected**: a valid headers-only CSV
   or an honest localized message — no crash.

---

## Phase 11: Owner governance — settings, accounts, audit view, health summary

**User stories**: #24, #25, #26, #27
**Depends on**: Phase 9 (audit view needs Phase 5; health summary needs Phase 8)

### What to build

The owner's control surface. Settings UI covering capacity, band thresholds, weekly
hours (including past-midnight input), business-day boundary, and reset buffer — each
save appends a new settings version and an audit entry; validation rejects incoherent
values (overlapping/incomplete thresholds, zero capacity, malformed hours). Account
management via the Better Auth admin plugin: list, create staff (or owner), deactivate,
reset password — no email dependency. Audit log view: filterable list of who/when/
action/from → to/reason across corrections, resets, system resets, and settings changes.
Health & uptime summary: offline periods and incidents derived from the health and alert
logs.

### Acceptance criteria

- [ ] Settings changes take effect without redeploy: bands recompute on the next payload
      build; schedule changes move the open/closed boundary.
- [ ] Every settings change creates a new version row and an audit entry; prior versions
      remain; analytics for past days are unchanged after a capacity change (snapshots).
- [ ] Invalid settings are rejected with localized messages; nothing partial is saved.
- [ ] A created staff account can sign in; a deactivated one cannot (existing session
      invalidated or rejected on next use); password reset works without email.
- [ ] The audit view shows entries from Phases 5, 7, and this phase, in order, with
      actor, from → to, and reason.
- [ ] The health summary reflects the incidents injected in Phase 8 with correct
      durations.

### Manual QA plan

1. **Capacity change**: As owner, change capacity 100 → 50. **Expected**: `/` band and
   percent shift on the next refresh; yesterday's analytics figures do not change; a new
   settings version and an audit row exist.
2. **Validation**: Enter overlapping band thresholds and capacity 0. **Expected**:
   localized validation errors; the previous settings remain active.
3. **Hours change**: Change today's close to five minutes from now. **Expected**: the
   public page flips to closed on schedule without redeploy.
4. **Account lifecycle**: Create a staff account; sign in with it in a private window;
   deactivate it from the owner session. **Expected**: the deactivated account cannot
   act (next request or login rejected). Reset its password and confirm the new one
   works.
5. **Audit trail**: Open the audit view. **Expected**: the Phase 5 correction, the
   Phase 7 system reset (actor "system"), and today's settings change all appear with
   from → to values, localized, newest first.
6. **Health summary**: Compare the summary against the Phase 8 injected outage.
   **Expected**: the offline period and alert appear with plausible duration.

---

## Phase 12: Python edge client & Windows lifecycle

**User stories**: #32–#36 (production client; CV internals remain site-gated)
**Depends on**: Phase 6 (device contract frozen)

### What to build

The real edge application, minus the site-gated CV internals. A Python client in the
top-level `edge/` directory (not a pnpm workspace package) implementing the full device
contract: local config file (RTSP source, ROI, line, thresholds, endpoints, device
token, intervals) with no code changes needed to reconfigure; sequence-numbered push
loop; durable SQLite outbox sized for 24–48 h; in-order command application; counter and
last-applied-command persistence across restarts; the counting source behind a small
interface with a synthetic implementation (the real detector/tracker source lands after
the RESEARCH §18 site checks). Windows lifecycle: auto-start on boot, watchdog
auto-restart on crash, automatic recovery after reboot/update/power loss — no staff
action ever required. No code path may write frames or images to disk or network. The
Phase 2 simulator's behaviors (outage, backfill, failure injection) converge into this
client's synthetic mode so one codebase serves dev, test, and production.

### Acceptance criteria

- [ ] Running the client with the synthetic source against the local stack is
      indistinguishable from the simulator: live pushes, command application, backfill
      after an induced outage.
- [ ] Killing the process hard → the watchdog restarts it; sequences and the counter
      survive (no double-count in the minutes table).
- [ ] A machine reboot brings the client back without login or manual action.
- [ ] A ≥ 10-minute network outage buffers to the outbox and backfills correctly on
      reconnect, including applying commands issued meanwhile before live authority
      resumes.
- [ ] Config changes (interval, endpoint, token) are picked up from the file without
      code edits; no secrets are committed to git.
- [ ] Code inspection confirms no frame/image write path exists.

### Manual QA plan

1. **Contract parity**: Start the client (synthetic source) against `pnpm dev`.
   **Expected**: `/` shows its counts exactly as with the simulator; OpenAPI-described
   fields all populated.
2. **Crash recovery**: `taskkill /F` the client process. **Expected**: the watchdog
   restarts it within its interval; the count continues (verify no duplicate minutes in
   `pnpm db:studio`).
3. **Reboot**: Reboot the Windows machine. **Expected**: the client is running again
   after boot with no login or manual start; pushes resume.
4. **Outage + commands**: Disconnect the network ~10 min, issue a staff reset meanwhile,
   reconnect. **Expected**: outbox drains, gap minutes appear as backfill, the reset is
   applied before live counting resumes.
5. **Config reload**: Change the push interval in the config file and restart the
   service. **Expected**: the new cadence is observable server-side; no code was edited.
6. **Privacy check**: Review the client for image-writing calls and run it while
   watching its working directory. **Expected**: no image/frame files are ever created.

---

## Deferred Stories

None. All 40 user stories from SPEC.md are covered by Phases 1–12. Items SPEC.md fences
out (trend indicator, light theme, multi-gym, predictions, deployment execution, CV
pipeline internals, email delivery, Turborepo) remain out of scope for every phase; the
real CV counting source is the one piece of Phase 12 explicitly gated on the RESEARCH.md
§18 site checks. On-site pilot-target protocols (spot checks, reboot/power tests, alert
injection against production) run after Phase 12, per SPEC.md's pilot targets.
