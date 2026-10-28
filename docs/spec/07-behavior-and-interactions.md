<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

### Behavior & Interactions

**Freshness state machine (defaults; all config-driven).** Edge pushes every ~20 s.
Payload age ≤ 90 s → `fresh`; older than 90 s → `stale` (the public page; the 180 s
operational threshold of the settings' freshness windows drives staff health and alerts only): the public
page dims the number, labels it last-known with its absolute time and that time's age, the age
measured against the server's time carried in the payload, never the device clock, and shows the
stale treatment (DESIGN_GUIDE §6). While `fresh` it shows the last update as an absolute time.
No usable data at all (or device disabled) → `unavailable` (DESIGN_GUIDE §6).
Closed per schedule → `closed` overrides everything: no count is shown, next-open time is
shown when known (DESIGN_GUIDE §6). The freshness decision is computed at origin refresh and baked into
the cached payload, so it costs nothing per visitor; the worst-case detection lag is one
cache window.

**Public polling.** The page fetches on load, then every ~60 s with small jitter, pauses
via the Page Visibility API when hidden, and refetches immediately on becoming visible.
No WebSockets/SSE (RESEARCH.md §10).

**Corrections and resets (edge-authoritative).** A correction or reset creates a command
that stays "pending" until a subsequent push reflects the applied value (expected ≤ ~40 s
online). Commands are **not** applied by overwriting the cloud value while the edge is
online — the next push would silently undo it (RESEARCH.md §9). Every command, applied or
superseded, has its audit entry. Under ADR-008 the issuers are internal only: the
scheduled daily zero-reset and any later recovery or reconciliation path. No staff or
owner surface issues one, so there is no stepper, no direct entry, and no
destructive-confirmation dialog to specify.

**Offline behavior (edge offline). [Amended by ADR-008]** The staff manual fallback this
section previously specified — a staff direct entry that both created a pending command
and immediately set the current-state row with source `manual` — is withdrawn with the
surface that would have triggered it. When the system is `stale`/`unavailable` the public
page shows the honest stale or unavailable state; nothing substitutes a human-entered
number for it. Automatic offline handling, buffered backfill, reconnect ordering, and
reconciliation were completed in Phase 6, and pending commands still apply before live
authority resumes. The accepted Phase 6 ADR-008 review found no authorized production
`source=manual` producer. Compatibility enum/read surfaces remain without authorizing a fallback,
migration, manual-validity setting, or new command surface.

**Daily zero-reset.** The cron evaluates the per-weekday schedule in gym-local time and,
at close + buffer (default buffer 30 min, configurable), issues a system `reset_zero`
command and marks the business day closed. If the edge is offline at that moment, the
command stays pending and must be applied on reconnect **before** the edge's pushes
advance the live count again (RESEARCH.md §9). Occupancy still floors at 0 independently.

Reset ownership is determined from the settings version effective immediately before the
scheduled close instant. A settings version becoming effective exactly at close does not own that
reset. At close, freeze the owning settings version, its `resetBufferMinutes`, and
`dueAt = scheduledCloseAt + resetBufferMinutes`. Settings changes after close, including during the
buffer, do not recompute, cancel, or transfer that pending reset; they apply prospectively only.
Historical reset evaluation resolves settings at these real instants and never substitutes current
settings.

**Alert policy. [Resolved here — defaults]** Alert conditions: (a) no accepted push for
≥ the operational stale threshold during open hours or within the 30-minute pre-open window; (b) a
push whose health snapshot reports camera/feed/process failure; (c) at most one re-alert
per condition every 30 min while unresolved; (d) failures arising during closed hours are
suppressed but alert at pre-open if still unresolved; (e) a recovery notice when the
condition clears. All sends and outcomes are recorded in the alert log. Channel: Telegram
bot message to the maintainer chat. Owner-facing capacity alerts remain out of scope
(RESEARCH.md §16).

**Analytics semantics.** All aggregation is business-day and gym-timezone aware. "Daily
visits" = sum of entries per business day: estimated entrance crossings, not unique members
(RESEARCH.md §5, §20). The UI names this figure as entries and never as members or unique
visitors. It needs no explanatory caption, because the owner explains the measure directly
(user decision, 2026-09-24). Heatmap averages occupancy
by (weekday, local hour); closed periods render as "closed", and missing history renders
as "no data" — visually distinct from zero (DESIGN_GUIDE §12). Week-over-week shows
an honest empty state until two comparable weeks exist. Analytics read historical band
and capacity from the row snapshots, not from current settings.

For the isolated Phase 9 domain, `dailyAverage` is the arithmetic mean of observed open-minute
counts: include genuine zero rows, exclude closed and missing minutes, and return
`observedOpenMinutes` plus `expectedOpenMinutes` so outage coverage is never hidden. Timeline
DTOs classify every bucket as `value | closed | missing`; `closed` and `missing` carry a null
count. Classification uses the settings version effective at each instant. A gap has no row,
so the query resolves the append-only settings timeline by `effectiveFrom` rather than using
today's settings. These semantics must be unit-tested before the analytics domain can merge.

**Internationalization.** Arabic (`dir="rtl" lang="ar"`) is the default; English is a
first-class toggle persisted client-side. All user-facing copy — including error states,
confirmation dialogs, and toasts — lives in ar/en message catalogs from the first screen;
no hard-coded strings. Numbers, dates, and times use `Intl` with `-u-nu-latn` so Western
digits render in both locales; tabular numerals for anything that updates or aligns.
Layout uses logical properties; charts follow reading direction
(DESIGN_GUIDE §§4, 9, 12). The document default (`index.html`) is Arabic/RTL with localized
title/meta and the approved FITWAY favicon.

**Shipped dark-only visual system.** The scaffold's theme toggle and light theme are removed; the
`--fw-*` token set in DESIGN_GUIDE §14 is the single palette. Cairo is self-hosted at actual
weights 400–700. The crowd level, approximate count, continuous 28-bar signal, badges,
freshness, operational panels, KPI cards, charts, skeletons, and empty/error states follow
DESIGN_GUIDE §§3–13, including reduced motion and accessibility.

This implementation rule does not constrain concept-only Owner visual exploration under the named
human decision. Those artifacts may use a different light/dark treatment and non-Cairo type, but
they cannot change production styling, data semantics, accessibility, or the approval gates. Nor
does this implementation rule constrain the Public redesign. When promoted it replaces the 28-bar signal with the level
mark of DESIGN_GUIDE §5 and Cairo with Readex Pro, self-hosted at real weights.

**Scaffold cleanup (first implementation act, recorded here so nothing demo-shaped
survives).** Remove: the ASCII demo home page, sign-up form/route, theme
toggle/light-theme plumbing, demo `privateData` procedure, unused chat-style UI
components in the UI package, and the default shadcn palette values superseded by
`--fw-*`. The web app's devtools remain development-only.

**Edge application (contract-level requirements; CV specifics are site-gated).** The
Python counter must: read config (RTSP source, ROI, line, thresholds, endpoints, token,
intervals) from a local file without code changes; count directionally with the proven
pipeline approach of RESEARCH.md §6; keep a durable local outbox (e.g., SQLite) sized for
24–48 h; push on the interval with sequence numbers and apply commands in order; persist
its counter and last-applied command across restarts; run as an auto-starting,
watchdog-supervised Windows service that recovers from crash/reboot/power loss without
staff action (RESEARCH.md §12); and never write frames or images to disk or network
(RESEARCH.md §7). Detector/tracker choices, packaging, and hardware acceleration are
deferred to the site-check gates (RESEARCH.md §18).

**Edge simulator.** A simulator that speaks the exact device contract (push cadence,
sequences, backfill, command application, health flags, failure injection) is a required
deliverable — it is the development stand-in until site access exists and the fixture for
integration tests. Preferably implemented in Python so it seeds the real edge client.

---

