<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

## User Stories

### Visitor (anonymous, public page)

1. As a visitor, I want to see the crowd status band and an explicitly labeled approximate
   count on my phone within seconds of opening the page, so that I can decide
   whether to go now. Approved Arabic public copy uses «داخل الصالة الآن · تقريبًا» as that label
   (English: "Inside now · approx."), the same wording as the Owner pages (Eclipse GLO-2).
2. As a visitor, I want a last-updated time next to the number, so that I can judge how
   fresh the information is.
3. As a visitor, I want the page to say "Closed now — opens 6:00 AM" when the gym is
   closed, so that I am never shown a fake live count outside opening hours.
4. As a visitor, I want the page to clearly flag stale data ("live updates are delayed —
   last known approximate count: 45 at 7:32 PM") when the feed stops, so that I am never
   misled by a frozen number presented as live.
5. As a visitor, I want an explicit "live occupancy unavailable" state when there is no
   usable data at all, so that absence of data is communicated honestly.
6. As a visitor, I want the page in Arabic (RTL) by default with a toggle to English
   (LTR) that persists on my device, so that I can read it in my language.
7. As a visitor, I want the count to refresh automatically (~every 60 s) while the page is
   open and pause when the tab is hidden, so that the number stays current without my
   interaction and without wasting resources.
8. As a visitor with color-vision deficiency or a screen reader, I want every status
   conveyed by label + icon + position, never color alone, and live updates announced
   politely, so that I can read the state (DESIGN_GUIDE §13).
9. As a visitor on a slow connection, I want a lightweight page with skeleton loading
   states, so that the status appears fast even on poor mobile networks.

### Staff (shared front-desk account)

10. As staff, I want to enter the shared desk PIN once and receive a long-lived signed
    HttpOnly session, so that the desk view is always available without daily logins or an
    invented staff email identity.
11. As staff, I want a live operational view (current count, band, last update, edge/camera
    health), so that I can see at a glance whether the system is healthy.
12. **Withdrawn by `docs/adr/ADR-008-staff-monitoring-only.md`.** Stepper correction with an
    explicit Apply action. `/staff` is monitoring-only; the number is corrected at the edge,
    not from a product surface. The story number is retained so existing references stay
    resolvable.
13. **Withdrawn by ADR-008.** Direct count entry.
14. **Withdrawn by ADR-008.** Reset to 0 behind a confirmation dialog.
15. As staff, I want an unmistakable on-screen alert when the edge is offline or data is
    stale, so that I know the displayed number is not current and can escalate to the
    maintainer.
16. As staff, I must NOT be able to reach owner settings, analytics, or account management,
    so that a stray change (e.g., capacity = 5) cannot break the public page.
17. **Withdrawn by ADR-008.** Staff-issued correction appearing on the public page within
    ~2 minutes. There is no staff-issued correction to propagate.

### Owner / Admin

18. As the owner, I want everything staff can do, so that I can operate the desk view too.
19. As the owner, I want today's occupancy curve (gym business day, not calendar midnight),
    so that I can see how the day developed.
20. As the owner, I want a day-of-week × hour-of-day busiest-times heatmap, so that I can
    schedule staff and plan offers around real peaks and quiet hours.
21. As the owner, I want per-day peak occupancy, daily averages, and estimated daily visits
    (named as entries, never as members or unique visitors), so that I understand volume
    honestly.
22. As the owner, I want week-over-week comparison once enough history exists (and an
    honest empty state before that), so that I can see direction.
23. As the owner, I want CSV export of per-minute history for a date range, so that I can
    analyze data outside the product.
24. As the owner, I want to configure capacity, band thresholds, weekly gym hours
    (including Friday's different hours and past-midnight closing), business-day boundary,
    and the post-close reset buffer — without code changes, so that the system matches the
    real gym as measured on site.
25. As the owner, I want to manage access (provision/rotate/deactivate staff PIN credentials
    and manage real owner accounts), so that routine access control does not require invented
    identities or the maintainer.
26. As the owner, I want to see the audit log (who, when, from → to, why) for every
    correction, reset, and settings change, so that manual interventions are accountable.
27. As the owner, I want a health/uptime summary (offline periods, last incidents), so
    that I can see what I am paying maintenance for.

### Maintainer

28. As the maintainer, I want a Telegram alert within minutes when the edge stops pushing
    during open hours (or its health flags report camera/feed failure), so that I discover
    failures before the owner does.
29. As the maintainer, I want closed-hours failures suppressed but re-checked and alerted
    shortly before opening if still unresolved, so that I am not woken at 3 AM for a
    problem that only matters at 6 AM.
30. As the maintainer, I want bounded re-alerts (not one message per minute) and an
    explicit recovery notice, so that the channel stays trustworthy.
31. As the maintainer, I want an alert delivery log, so that alerting itself is verifiable.

### Edge device (system actor — contract only; CV internals are site-gated)

32. As the edge counter, I want to push my current count, per-minute entry/exit deltas, and
    a health snapshot at most once per configured interval (~20 s) over an authenticated
    endpoint, so that the cloud always has a bounded, recent view.
33. As the edge counter, I want every push acknowledged with any pending commands
    (set-count / reset), so that scheduled and internally issued commands reach my local
    counter — the single source of truth — and my next push reflects them.
34. As the edge counter, I want to buffer counts/events/health locally for 24–48 h during
    an outage and backfill on reconnect, so that history and analytics survive network
    loss — without backfill ever changing the live current count.
35. As the edge counter, I want idempotent pushes (sequence-numbered) and idempotent
    backfill (minute-bucket upserts), so that retries never double-count.
36. As the edge counter, I want the daily zero-reset delivered as a schedule-aware command
    (close time + buffer) that I must apply, including on reconnect if I was offline when
    it was due, so that drift is capped to one day.

### System

37. As the system, I want visitor reads served from the CDN cache with the freshness
    decision baked into the cached payload, so that origin compute scales with time, not
    visitors, and traffic spikes from gym announcements are absorbed.
38. As the system, I want the stored and displayed occupancy floored at 0, so that drift
    can never show a negative or absurd public state.
39. As the system, I want per-minute history (count, entries, exits, band, capacity
    snapshot) recorded from day one in UTC with gym-local business-day attribution, so
    that future "popular times" analytics are possible even though v1 shows no forecasts.
40. As the system, I want every state-changing staff/owner action written atomically with
    its audit entry in one database transaction, so that the audit log can never silently
    miss an intervention.

---

