# FITWAY — Research & Decisions (v1 Pilot Foundation)

> **Purpose of this document.** This is the _why_ behind FITWAY, written so a future
> agent (or human) in a fresh session can understand what we are building, who it is
> for, and — most importantly — _why each decision was made_ before writing any code.
> It is the output of a structured discovery interview. It is **not** a spec, plan, or
> implementation. The next steps in our workflow are: **Spec / Definition of Done →
> Plan → Build (vertical slices) → Verify.** This document feeds the Spec.
>
> Status: **Research complete; revised 2026-07-03 after senior review.** Date:
> **2026-07-02.** This document records the pre-spec reasoning; the repository has since
> completed Phases 1–3 and VDG-A.
>
> **2026-07-14 staff-auth clarification.** Shared staff access is PIN-based through the
> signed HttpOnly session model, not email/password. This supersedes any staff-credential
> implication below while preserving server-side roles, authorization, deactivation, rate
> limiting, shared-desk audit attribution, and separately provisioned real owner identity.

---

## 0. TL;DR

FITWAY is a **live gym-occupancy system** for **one real gym** ("Fitway"), built as a
pilot that could later grow into a multi-gym SaaS. Visitors check, from their phone,
**how crowded the gym is right now** before deciding to go. Staff and the owner get a
live operational view plus analytics/history.

The core technical bet: an **on-site edge computer** watches the **existing entrance
turnstile camera**, counts people crossing in/out with a **proven computer-vision
pipeline**, and pushes only an **anonymous number** to the cloud. The public page reads
that number from a **cache**, so cost and scale depend on _time_, not on the number of
visitors. No video, frames, or identities ever leave the gym or get stored.

**Two success metrics dominate:** the crowd **status band is honest most of the time**,
and the system is **operationally reliable** (up during gym hours, self-recovering,
alerting the maintainer on failure).

---

## 1. The Problem & Why Live Data

**The real problem.** People want to know whether the gym is crowded _right now_ before
they travel to it. Fitway is one of the largest and the most respected gym in its area,
so crowding genuinely varies and matters to members deciding when to train.

**Why not just "popular times" / a static weekly heatmap?** That was explicitly
considered and rejected as the _core_ product. Reasoning:

- The user's real question is "_Is now a good time to go?_" — that needs **current**
  data, not a historical average.
- Real-world crowd is **not predictable enough** on any given day (weather, holidays,
  a class starting, etc.).
- Predictions/forecasting require a large clean history to be trustworthy, which does
  not exist yet.

**Decision:** Live occupancy is the core. Predicted "busy times" is a **secondary,
later** analytics feature that becomes possible _because_ we start logging history now
(see §8, §16). It is not a v1 deliverable.

---

## 2. Product Anchor & Business Context

- **Anchored to one real gym first: "Fitway."** Real physical location, in the user's
  area. The user is a member who trains there regularly.
- **Access is real:** the owner is a friend of the user's uncle; the user can speak to
  him directly and physically visit. Cameras (Hikvision) already exist.
- **This gym is the pilot / first customer.** Not hypothetical, not simulated data.
- **Likely business model:** one-time installation/setup fee + monthly
  maintenance/subscription fee.
- **Future (not now):** if the pilot works, expand into a **SaaS for multiple gyms**.
  Multi-tenant architecture, billing, and per-gym dashboards are explicitly **deferred**
  (§16). We only avoid _painting ourselves into a corner_ (e.g., URL shape, §17).

**Naming note (important):** **"FITWAY" is the gym's own name** (sometimes styled in
uppercase). In v1 it is **not** a separate product/SaaS brand. The public page must feel
like _Fitway gym's own occupancy page_, branded as the gym — not a vendor overlay.

---

## 3. Users & Roles

The smallest role model that is still safe. Split now because merging later is easy but
splitting later is painful.

| Role                   | Who                                         | Can do                                                                                                                                         |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visitor**            | Anonymous public                            | View the public occupancy page. No account.                                                                                                    |
| **Staff / Front desk** | Reception staff on a **shared desk device** | View live count/status; **manual count correction**; **reset to 0**; see **offline/stale alerts**.                                             |
| **Owner / Admin**      | Gym owner                                   | Everything Staff can do **plus** analytics/history, capacity, thresholds, gym hours, settings, access management. Full access.                 |
| **Maintainer**         | The user (builder/operator)                 | Admin-level access. **Folded into Owner/Admin for v1** — no separate maintainer portal. Responsible for install, monitoring, updates, support. |

**Guardrail:** Staff must **not** change business/dangerous settings (capacity,
thresholds, analytics config, access management). Those are Owner/Admin-only, to prevent
a stray change (e.g., capacity set to 5) from breaking the public page.

**Shared staff account (v1):** the front desk uses **one shared staff account** on the
shared desk device. Audit-log entries for staff actions are recorded as that shared
front-desk account — **coarse audit granularity is accepted for v1.** Owner/Admin access
remains separate.

**Auth stack:** separately provisioned real owner identities may use **Better Auth** with
**Hono** and **Drizzle**. Shared staff access uses a server-verified PIN and the signed HttpOnly
session model, not an email identity. Principals, sessions/roles, and audit-log actor references
live in the same **Supabase Postgres** database. Authentication and role-based authorization are
enforced server-side; the public page stays anonymous and account-free.

**Deferred alternative:** **Clerk** is not selected for v1. The pilot's small account set
does not justify a separate hosted identity system or cross-system identity mapping;
revisit it only if later SaaS needs make managed auth more compelling.

---

## 4. The Public Page (Core Product Surface)

**The visitor's question it must answer:** _"Is the gym crowded right now, and is now a
good time to go?"_

**Display (combination, honest-by-design):**

- **Headline status band / color** — Quiet / Moderate / Busy / Packed (the primary
  signal; the thing we most care about being _right_).
- **Approximate count** — explicitly labeled as an estimate, e.g., _"Estimated
  occupancy: 45"_ / _"العدد التقريبي: 45"_. The number is shown (people care) but never
  presented as exact truth.
- **% full.**
- **Last-updated timestamp** — so freshness is visible.
- **Open/Closed state** — when closed, show e.g. _"Closed now — opens 6:00 AM"_ and do
  **not** pretend there is live occupancy.
- **Trend** (getting busier / emptying out / stable) — **secondary**; include only if it
  can be made reliable enough for v1, otherwise defer.

**Honesty principle:** the count is "good enough, not perfect." The UI must communicate
approximation explicitly—through an approved label such as `العدد التقريبي` / “estimated”
rather than implying turnstile precision. A confidently _wrong_ page is worse than no page.

**Mobile-first (core value pillar, not polish):** most visitors open this on a phone
before leaving home. The public page must be **excellent on mobile, fast to load, clear
at a glance, visually trustworthy, and branded as Fitway gym.** Responsive web — **not**
a native app.

**Localization:** **Arabic (RTL) by default** (the real audience), with **English
planned from the start**. Bilingual foundation designed in early, not retrofitted.

**Discovery:** the gym announces the page through its own channels — Instagram / social,
WhatsApp sharing, a QR code at reception/door. The exact channel is not a constraint.
**Traffic spikes are expected** (an owner post can send hundreds at once) and are handled
by the cache-first read path (§10, §12).

**Thresholds/capacity:** real Fitway numbers are **unknown** — to be **measured on-site**
and made **admin-configurable** without code changes.

**Accessibility:** the status band must **never rely on color alone** — every status
carries a **text label**, with a **color-blind-safe palette**.

---

## 5. Staff & Owner/Admin Experience

### Staff (front desk) — minimal operational view

Live count, status, **manual correction / reset**, **offline/stale alert**. Nothing more
in v1. Correction is **not** hourly babysitting — staff correct/reset only when the
number is **obviously wrong**, when there is a known issue, or after a restart/failure.
Daily auto-reset (§8) + occasional manual correction is the intended workload.

### Owner/Admin — the paying customer's value

The owner pays setup + monthly, so the admin side must deliver operational/business value
he cannot easily see himself.

**Owner use cases (the "why" behind analytics):**

1. **Operations/staffing** — understand peak hours/days to schedule reception/trainers.
2. **Marketing/offers** — identify quiet hours/days (later: weeks/months) to run
   campaigns.
3. **Visit & occupancy understanding** — approximate daily entries/visits, peak
   concurrent occupancy/day, busiest hours, busiest days, today's curve, daily averages.
4. **Comparisons/trends** — today vs prior days, week-over-week (later: month-over-month,
   increasing/decreasing over time).
5. **Reports/export** — CSV export in v1; richer reports later.

**v1 analytics (all cheaply derived from the per-minute history we store):**

- Today's occupancy curve
- Busiest-times heatmap: **day-of-week × hour-of-day** (this is the seed of future
  "popular times")
- Peak occupancy per day
- Daily averages
- Week-over-week trend (once enough data exists)
- **CSV export**

**Honest framing (must appear in the product):** _"daily visits" = estimated entrance
crossings, not unique members._ FITWAY is an **estimated occupancy** system, not a
membership-attendance system.

**Alerts:** capacity / approaching-capacity owner alerts are **deferred — not in v1**
(§16) unless explicitly chosen later. (Maintainer _health_ alerting is separate and
required in v1 — §12.)

---

## 6. Live Occupancy — Counting Approach

### The physical setup (why entrance counting is viable here)

- **One main entrance/exit** with a **tripod turnstile / access gate**. People pass
  **one by one** — a natural choke point. There is a fingerprint/access system for
  **entry only** (no checkout), and staff can **manually open the gate** for walk-ins, so
  the access system is **not** a reliable ground-truth count.
- **Entry and exit use the same main gate path** (current understanding — verified as a
  first-class site-check gate, §18). Emergency/secondary doors exist but are not part of
  normal member flow; they are **not part of v1 counting** unless real usage proves
  otherwise.
- A **clear, good-quality camera** faces the gate/door area. The user is not worried
  about it being casually bumped/moved.
- **The turnstile is the single biggest de-risking fact:** it enforces near single-file
  passage, which is the ideal condition for a directional line counter (kills most
  tailgating/group-entry error that plagues open-doorway counting).

### Architecture choice: Entrance line-counting (Option A)

Count crossings at the gate: **entering = +1, exiting = −1.** Chosen over whole-floor
headcount because it is realistic for v1 with the existing single-door camera. Floor/
multi-camera headcount is explicitly **deferred** (§16). The design must **not block**
adding floor analytics later.

### The known weakness: drift, and how we bound it

Line-counting errors are cumulative (a missed exit is +1 forever). Controls:

- **Daily zero-reset** — the gym closes each night, so occupancy is provably ~0. Reset is
  **schedule-aware + buffer** (closing can drift a little) and **manually overridable**.
  This caps drift to "within one day."
- **Manual correction/reset** by staff when obviously wrong.
- **Admin-tunable knobs** (no code changes): manual current-count adjustment, reset to 0,
  capacity, thresholds, and later ROI/line/sensitivity.

**Gym hours (from Google, to verify on-site):**
Thu 6:00 AM–2:00 AM · Fri 2:00 PM–12:00 AM · Sat–Wed 6:00 AM–2:00 AM. Note Friday's
different hours — reset logic must be **per-day schedule-aware**. Closing falls **after
midnight**, so reset timing and "today" follow the **gym-local business day** (§8), not
calendar midnight.

### The CV pipeline (proven libraries, no invention)

Accepted v1 approach, **all configurable/tunable after real site testing**:

- Capture the **gate/turnstile ROI** from the Hikvision **RTSP** stream (e.g., OpenCV),
  at **low FPS** (a few frames/sec on the cropped region is enough).
- **Small pretrained person/body detector** (YOLO-family "nano"-class). No custom
  training.
- **Lightweight temporary motion/IoU tracker** (e.g., ByteTrack-style) to follow a body
  across a few frames. **Deliberately not appearance/re-ID based** — motion tracking
  only, so no facial/appearance signature is ever built.
- **Directional crossing line** with **hysteresis/cooldown/dwell** rules to reject
  phantom re-crossings and doorway loitering.
- Emit +1/−1 → aggregate to occupancy → push to cloud.
- **Evaluate an existing proven line-counting solution** (e.g., Ultralytics counting,
  Roboflow `supervision` line-zone) before hand-rolling crossing logic.

**Explicitly no:** face detection, face recognition, identity tracking, long-term
appearance profiles, biometrics. Person/body detection only.

**Configurable without rewrite:** ROI, counting line, thresholds, FPS, model/settings.

### v1 count-error stance (given turnstile + fixed good camera)

| Error source                                                               | v1 stance                   | Mechanism                                                                         |
| -------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| Wrong-direction (in vs out)                                                | **Mitigate**                | Directional line on gate ROI; confirmed outside→inside (+1) / inside→outside (−1) |
| Doorway loitering / phantom re-crossings                                   | **Mitigate**                | Dwell + hysteresis + per-track cooldown; require full traversal                   |
| Double-counting same person                                                | **Mitigate**                | Tracked ID, one count per traversal                                               |
| Tailgating / groups                                                        | **Reduced by hardware**     | Turnstile enforces single-file; residual accepted                                 |
| Simultaneous opposite crossings                                            | **Reduced by hardware**     | One-by-one passage; directional per-track logic; residual accepted                |
| Stale / offline camera or edge box                                         | **Mitigate**                | Heartbeat; >3 min → public "unavailable"; staff alert; manual fallback            |
| ROI / counting-line calibration                                            | **Mitigate**                | Fixed ROI; adjustable line/ROI config without code                                |
| Camera bumped / re-aimed                                                   | **Low risk, monitor**       | Health flag if detection degrades                                                 |
| Non-members counted (staff, trainers, cleaners, delivery, walk-in inquiry) | **Accept & correct**        | Manual correction; "bodies inside, not members training"                          |
| Kids / companions                                                          | **Accept**                  | Same framing                                                                      |
| Small intraday drift                                                       | **Accept, bounded**         | Daily zero-reset + manual correction                                              |
| Night / low-light / glass glare                                            | **Monitor**                 | Health flag if it degrades; accept residual                                       |
| Gross accumulation over a day                                              | **Mitigate (hard ceiling)** | Daily zero-reset at close + buffer; manual reset                                  |

**Accuracy bar:** the **status band** (Quiet/Moderate/Busy/Packed) must be right _most of
the time_; exact number need not be mathematically perfect.

---

## 7. Privacy & Data Protection (the section that protects us)

Hard v1 boundaries:

- **Edge-only processing.** Video is processed on the on-site computer; **only anonymous
  numbers/events/timestamps/health leave the building.**
- **No video leaves the gym. No stored video. No stored frames/images.**
- **No face recognition, no identity, no biometric, no member identification.**
- Only **anonymous occupancy counts, status, events, timestamps, and heartbeat** are
  transmitted/stored.
- **Debug snapshots are off by default** — any future snapshot capability is a separate,
  **owner-approved** feature with explicit retention/access rules.

**Remote-maintenance exception (documented, not a loophole):** remote access to the gym
PC is used for maintenance, updates, debugging, and calibration (§12). During
calibration, **live viewing of the camera feed may be necessary** (e.g., via a remote
session). Even then: **no image/video/frame storage, no face/identity recognition, no
screenshots or clips saved by default.** Owner sign-off before go-live must acknowledge
remote maintenance & calibration access (§18).

**Privacy stance:** the gym already runs CCTV; FITWAY only _derives an anonymous crowd
count_ from the existing entrance camera — it is **not** identity surveillance. A simple
**transparency notice** should be discussed with the owner, e.g.:

> _"Cameras may be used to estimate gym occupancy. No facial recognition or image storage
> is used."_

---

## 8. Data Model & Retention

**What we store (v1):**

- **Occupancy time-series** — sampled ~once/minute: `timestamp, count, entries, exits,
status/band, capacity_at_time`. **Per-minute `entries` and `exits` are required, not
  optional** — "daily visits" (§5) cannot be derived from occupancy snapshots alone
  (10 in + 10 out in a minute nets to 0). Daily visits/entries remain **estimated
  entrance crossings, not unique members** (§20). ~1,440 rows/day — trivially small.
- **Occupancy floors at 0.** Drift/exits can never push the stored count negative, and
  the **public page never shows a negative number.**
- **Settings** — capacity, thresholds, gym hours; **versioned** so historical analytics
  know the values _at the time_.
- **Principals, credentials & roles** — real owner identities, shared staff PIN credential
  metadata, signed sessions, and staff/admin roles stored with the application data in
  Supabase Postgres. The PIN itself is never stored.
- **Audit log** — every manual correction/reset: **who, when, from what, to what, why (if
  available).** `who` is a same-database authenticated-principal reference; for staff actions,
  it is the shared front-desk principal (§3). Non-negotiable for trust/debugging in
  a system where staff touch the count.
- **Edge health log** — heartbeat, offline/stale events, camera/feed/device health.

**We do NOT store:** raw video, images, frames, biometric/identity data. Raw per-crossing
events are **not** kept for v1 (per-minute aggregation is enough); revisit only if needed
for debugging.

**Start logging from day one.** History cannot be back-filled; the future predictions/
"popular times" feature only becomes possible if v1 collects clean history now, even
though v1 does not _show_ forecasts.

**Where it lives:** **Supabase (managed Postgres).** Edge box → backend write → DB;
public page reads a **cached** view.

**Edge durability:** the on-site box keeps a **24–48h local buffer** of anonymous
counts/events/health during a network outage, then **backfills** on reconnect.
**Backfill fills history/analytics only — it does not retroactively change the live
current count.** Current count = the edge counter's most recent valid push
(corrections/resets are applied **on the edge**, §9).

**Retention:**

- Anonymous occupancy history — **kept indefinitely** (long-term product value).
- Audit & health logs — **~12 months.**
- Images/video/frames — **none, ever.**

**Time zone:** store timestamps in **UTC**; compute/display "today", curves, heatmaps,
closing/reset timing, and reports in the **gym's fixed local timezone.**

**Business day (gym-local):** the gym closes after midnight, so a **configurable
gym-local business-day boundary** (likely around **4:00 AM** local; to be confirmed) —
not naive calendar midnight — governs "today's" curve, daily peaks, daily averages,
heatmaps, reset timing, and reports.

---

## 9. Architecture & Data Flow

Two independent paths — this split is the heart of the design:

**Write path (edge → cloud):** the edge box counts crossings **locally and immediately**,
but pushes to the cloud **at most once per configured interval (~20s)** via a single
**authenticated, rate-limited** write endpoint; crossings during the interval are
**batched into the next push.** This keeps invocations at ~2–4/minute — **bounded
regardless of visitor count or crossing bursts.**

**Source of truth for the current count: the edge counter.** Staff/admin corrections and
resets are **commands delivered to the edge box**; the edge applies them to its local
counter and **re-pushes the corrected state.** (They must not merely overwrite the cloud
value — the next edge push would silently undo them.) If the edge is offline when a
reset/closing-time command is due, the cloud may mark the day **closed/stale**, and the
edge **must reconcile on reconnect.**

**Read path (visitors → cloud):** visitors **never touch the counting logic.** They read
a **cached** occupancy payload (edge/CDN cache, short TTL ~30s, or ISR
`stale-while-revalidate`). Cache **hits** are served by the CDN with **no function
invocation**. The staleness decision is **baked into the cached payload**, so freshness
detection costs nothing per visitor.

> **The governing rule (write this on the wall):**
> **Serverless/compute usage scales with _time / cache windows_, not with the _number of
> visitors_.** Visitor count only affects (cacheable, cheap) bandwidth — never compute.

---

## 10. Real-time vs Cached, Freshness & Failure Behavior

Accepted defaults:

- **Edge push:** at most ~every **20s**; crossings are counted locally immediately and
  **batched into the next push** (§9).
- **Fresh:** public payload considered current if **≤ ~90s** old.
- **Stale:** no edge update for **~3 min** → payload flips to `stale`; public page shows
  e.g. _"Live updates are delayed — last known approximate count: 45 at 7:32 PM."_ Never
  a frozen number pretending to be live.
- **Public auto-refresh:** ~every **60s**, hitting the **cached** endpoint, **paused when
  the browser tab is hidden** (Page Visibility API) to prevent background-tab loops.
- **Hard failure** (edge crash / camera down / gym internet down): staff device shows an
  **offline alert**; staff can **manually enter the count**, which flows through the write
  path so the public page still shows something real (with the edge offline this is a
  **cloud-side fallback value**; the edge reconciles on reconnect, §9). With no source at
  all, public goes to the stale/unavailable state.
- **No WebSockets/SSE in v1** — poor fit for serverless and a cost risk; cached polling
  instead.

**Scaling:** traffic spikes from gym announcements are **expected**. They are absorbed by
the cache-first read path; the origin refreshes at most ~once per cache window regardless
of how many people are watching.

---

## 11. Deployment & Stack

- **Web app / hosting:** **Vercel.**
- **Application API:** **Hono.**
- **Data layer:** **Drizzle** over **Supabase (managed Postgres).**
- **Auth:** server-verified staff PIN with a signed HttpOnly session; separately provisioned
  real owner identity may use Better Auth. Both share the application/audit Postgres boundary.
  Public page anonymous.
- **Edge:** a **Windows all-in-one PC (screen + computer) the gym provides for FITWAY**
  — a separate machine, **not** the front-desk/reception device — _if capable_
  (see site-check gate §18). Runs the CV pipeline locally.

**Authorization boundary:** Hono validates signed sessions and performs role checks server-side
for every staff/owner action. Drizzle writes auth-linked application and audit
records in the same database, avoiding a cross-provider identity/JWT mapping. Database
constraints and any Supabase RLS used remain defense in depth, not a substitute for
server-side authorization.

**Deferred alternative:** Clerk is rejected for this v1 deployment because it would add a
separate identity store and mapping path without solving a need Better Auth does not cover
for this small account set.

**Vercel cost controls (hard requirements):**

- Read path is **cache-first**; visitor reads must not hit uncached functions.
- Authenticated, rate-limited **write** endpoint.
- Set a **Vercel spend cap + billing alerts before launch.**
- **Exact current Vercel pricing/limits and Spend-Management config are a pre-deploy
  verification item** (pricing/included-usage changes over time — do not hard-code
  assumptions; also note Hobby tier is non-commercial → assume Pro for a paid product).

**Pre-deploy verification covers the whole stack, not just Vercel:**

- Vercel pricing/limits/spend caps (above).
- **Supabase** tier limits, backups, connection limits, and **inactivity/pausing risk**
  (a paused free-tier project would silently kill the pilot).
- Better Auth session/cookie configuration, secrets, and Hono deployment behavior.

---

## 12. Reliability & Ops / Maintenance Model

**Automated health monitoring & alerting to the maintainer (v1, not later).** The system
must alert the maintainer when: edge box stops sending heartbeat; camera/feed
unavailable; counter stale/offline; local process crashes/stops updating. Failures must
**not** be discovered only via the owner complaining. **Preferred alert channel for v1:
Telegram.** (Alert-policy details — closed-hours suppression, re-alerting, exact trigger
set — are open questions, §17.)

**Unattended recovery (Windows-specific implementation):**

- Counting process **auto-starts on PC boot.**
- **Auto-restarts on crash** (watchdog).
- **Self-recovers after power loss, Windows reboots, and Windows updates** — temporary
  downtime during a reboot is acceptable; recovery must be automatic.
- Staff should **not** need to manually start (or restart) the system.
- Implemented the Windows way (service / Task Scheduler + watchdog), since it's a Windows
  machine.

**Remote support/update path:** for the pilot, **remote access** into the gym PC to
update/restart software. (Note: remote access is a **security surface** to document; the
calibration/live-viewing privacy exception is documented in §7. A managed fleet update
path is **deferred.**)

**What monthly maintenance buys:** health monitoring; heartbeat/offline alerts; support
when down; software updates & bug fixes; occasional camera/count-line recalibration; help
when the count looks wrong; basic reports/improvements; periodic checks. **New major
features are billable / not bundled forever.** The user trains there and can drop by, but
the system must **not require** physical visits.

**Hardware responsibility:** the **gym** owns/replaces the PC/hardware. Maintenance covers
**FITWAY software operation**, not unlimited hardware replacement (unless separately
agreed).

---

## 13. Security (summary)

- Staff uses PIN + signed HttpOnly session; real owner identity is separately provisioned;
  Hono enforces least-privilege roles server-side (§3).
- Supabase database constraints and any RLS are defense in depth; they do not replace
  server-side authorization.
- **Write endpoint authenticated (device token) + rate-limited.**
- Public page anonymous, read-only, cache-served — no per-visitor DB/function exposure.
- No PII / biometrics stored → small privacy-breach blast radius by design.
- Vercel **spend cap** as a denial-of-wallet control.
- Remote-access path to the edge box documented as a managed security surface.

---

## 14. Engineering Principles (how we want the codebase built)

Recorded now, applied during Plan/Build — **not** implemented in this research session.

- **Vertical slices / feature-driven development.** Each feature is completed end-to-end
  (UI + backend + DB + tests) before moving to the next — **not** horizontal layers.
- **Deep modules, simple interfaces.** Small, stable interfaces that hide meaningful
  complexity, rather than many shallow modules with wide interfaces. The counting logic
  in particular should be understandable and adjustable **in one place**, not scattered.
  Goal: low cognitive load, safe for future AI agents to work in.
- **Feedback-loop scaffolding comes after research/planning:** types, tests, lints, hooks
  — set up to support agent-driven development. Recorded, not built yet.
- **Use proven libraries; simple architecture; validate against the real site.** Do not
  invent complex CV from scratch.

---

## 15. Success Criteria (Definition of Pilot Success)

**Top two (dominant):**

1. **Honest-enough count/status.** The public **band** (Quiet/Moderate/Busy/Packed) is
   trustworthy **most of the time**. Exact number need not be perfect.
2. **Operational reliability.** Edge box up during **most gym open hours**, with
   heartbeat/offline alerts and automatic recovery. Repeated downtime = failed pilot,
   even if the UI looks great.

**Supporting signals:**

- Owner sees real business value from the dashboard/analytics.
- Owner is willing to **keep paying** after the trial (real business signal, but not the
  _only_ measure).
- Members actually **use** the public page (no strict threshold defined yet).
- Staff handle correction/reset **without constantly babysitting** the system.

**Confirmed success signals (direction decided; thresholds not):** counting/status
trustworthy enough for real use · no obvious UI/UX problems on the public page · mobile
Arabic RTL as core, not polish · stale data **never shown confidently as live** ·
staff/admin correction & reset work **without confusion** · owner sees business value ·
members actually use the page.

**Measurable targets — required before Definition of Done (placeholders only; final
numbers are a Spec/DoD decision, §17 — do not invent them earlier):**

- Count/status **band-accuracy target** + a **manual spot-check protocol** (no automatic
  ground truth exists; band correctness must be measured against periodic manual counts).
- **Edge uptime target** during gym open hours.
- **Public page / mobile UI quality bar.**
- **Member/public usage signal** (what "members actually use it" means).
- **Owner value / willingness-to-pay signal.**
- **Staff correction/reset usability** (no confusion, no babysitting).

**Timeline:** open-ended / learning-paced, but intended to become a **real income
source**. Move carefully through research → spec → planning, then build vertical slices.

**Builder context:** solo, AI-assisted, comfortable on both web/backend and CV/Python
sides; wants a realistic plan built on proven libraries and real site validation.

---

## 16. Explicitly NOT in v1 (Scope Fence)

Do not build these without a deliberate scope change:

- Multi-gym / multi-tenant SaaS, billing, per-gym dashboards
- Predictions / forecasting / automated recommendations
- Floor / whole-room / multi-camera headcount
- Stored snapshots / frames / clips (off by default; owner-approved future feature only)
- WebSockets / SSE real-time push (cached polling instead)
- Face / identity / biometric anything
- Turnstile-pulse cross-check (future validation idea)
- Native mobile apps (responsive web only)
- Heavy month-over-month / seasonal analytics; polished recurring reports
- Capacity / approaching-capacity owner alerts, and all other advanced alerting
  (maintainer _health_ alerts, §12, **are** in v1)
- Managed fleet update path (remote access is enough for the pilot)
- **Visitor/member accounts**
- **Member identity / membership-system integration**
- **Booking / classes / scheduling features**
- **Payments / invoices inside the product**
- **Visitor push notifications**

_Design so these remain possible later (esp. URL shape for multi-gym) without
over-building now._

---

## 17. Open Questions & Decisions TBD

- **Domain / URL shape** — undecided. Must stay SaaS-friendly (future per-gym paths or
  subdomains) without building multi-tenancy now.
- **Real capacity & band thresholds** — unknown; measure on-site; keep admin-configurable.
- **Stack pricing/tiers/limits (Vercel, Supabase) + Vercel Spend-Management
  setup** — verify before deploy (§11), incl. Supabase inactivity/pausing, backups,
  connection limits.
- **Auth deployment configuration** — verify staff PIN hashing/rate limiting, signed cookie
  behavior, owner-auth configuration, secrets, migrations, and Hono authorization during
  implementation.
- **Trend feature reliability** — include in v1 only if it can be made reliable; else
  defer.
- **Transparency signage wording** — confirm with owner.
- **Alert policy (Telegram, §12)** — suppress or downgrade alerts while the gym is
  closed? Re-alert unresolved closed-hours failures before opening? Exact trigger set:
  missed heartbeat, camera/feed offline, stale counter, process crash?
- **Turnstile pulse/rotation output** — does the gate expose an electrical counter signal
  usable later as an independent cross-check? (Future, not v1.)
- **Reset buffer specifics** — exact post-close buffer before auto-reset (closing drifts).
- **Pilot success thresholds (§15)** — final numeric targets (band accuracy, uptime,
  usage) and the manual spot-check protocol — decide in Spec / Definition of Done.

---

## 18. Required Site-Check Gates (before implementation / go-live)

**Camera / feed:**

- Exact Hikvision camera + NVR model.
- **RTSP / ONVIF** access confirmed; can we pull the stream?
- Counting-line/ROI placement on the gate; blind-spot assessment (less critical for
  entrance-only).
- **Exit-path geometry (first-class gate):** verify entry **and** exit cross the **same
  camera-visible counting line**, and that exit passage is **single-file and in view**
  (current understanding says yes — §6; verify, don't assume).
- **Inventory secondary/emergency/staff exits** and whether they are actually used.
  Unused emergency exits are **not part of v1 counting** unless real usage proves
  otherwise.

**Edge PC (a separate Windows all-in-one the gym provides for FITWAY — not the
front-desk/reception device; specs unknown):**

- CPU model, RAM, **GPU present?**, Windows version.
- Can it stay powered on?
- On the **same network** as the NVR/cameras?
- Can it access the RTSP stream?
- Can we install + **auto-start on boot** the counting software?
- **Auto-restart on crash** (watchdog) installable?
- **Automatic recovery after Windows reboot / update / power loss** — normal reboots,
  Windows updates, or process crashes must **not** require staff to manually restart
  FITWAY; temporary downtime during a reboot is acceptable, recovery must be automatic
  (§12).
- Is **remote access** allowed?
- **Decision rule:** capable → use it; too weak → **gym provides** a modest dedicated box
  / mini-PC (or approved accelerator). **Hardware purchase/replacement is the gym's
  responsibility** unless separately agreed.

**Measurements:**

- Real occupancy numbers → set capacity & Quiet/Moderate/Busy/Packed thresholds.
- Confirm actual open/close behavior vs. Google hours (esp. Friday).

**Brand/design inputs to collect (feeds DESIGN_GUIDE.md; does not block other work):**

- Logo, gym colors, any existing Fitway visual identity.
- Arabic typography preference.
- Numeral convention: **resolved — Western/English digits 0–9 exclusively** across both the
  Arabic and English interfaces (occupancy counts, percentages, charts, dates, times,
  analytics, and exports). No Eastern-Arabic-numeral option in v1.
- Theme: **resolved — v1 is dark-only**; a light theme is explicitly **deferred
  (post-pilot)**. Decided 2026-07-11.

**Owner sign-off gate (before install/go-live)** — a direct conversation/handshake is
enough for the pilot (no heavy contract), but get clear owner agreement on:

- using the existing camera/feed,
- installing/running the edge box/software,
- publishing the public occupancy page,
- what data is stored,
- remote maintenance & calibration access, incl. live feed viewing during calibration
  (§7),
- what monthly maintenance includes.

---

## 19. Risks & Mitigations (summary)

| Risk                                                             | Mitigation                                                                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Count drifts and public page becomes confidently wrong           | Turnstile choke point; directional counting + hysteresis; daily zero-reset; manual correction; coarse **band** as primary signal |
| Edge box is a single point of failure in someone else's building | Auto-start/auto-restart/self-recovery; heartbeat + offline alerts to maintainer; manual-count fallback; 24–48h local buffer      |
| Runaway Vercel/serverless bill                                   | Cache-first read path; time-not-visitor invocation rule; rate-limited write; spend cap + alerts; no WebSockets                   |
| Privacy/consent exposure (cameras on members)                    | Edge-only; zero image/video/identity storage; anonymous counts only; owner transparency notice                                   |
| Gym PC too weak for CV                                           | Site-check gate; gym provides hardware if needed                                                                                 |
| RTSP/network access not actually available                       | Site-check gate before committing                                                                                                |
| Session/authorization misconfiguration                            | Hono validates signed sessions and enforces roles server-side; PIN/auth and audit references share Postgres; verify configuration before launch   |
| Scope creep into SaaS/predictions/floor-count                    | Explicit scope fence (§16)                                                                                                       |
| Non-members inflate "occupancy"                                  | Accepted + framed honestly ("bodies inside, not members"); manual correction                                                     |

---

## 20. Glossary / Honest Framings

- **Occupancy** = _estimated bodies currently inside_, derived from entrance crossings —
  **not** a membership/attendance metric and **not** unique people.
- **"Daily visits"** = estimated entrance **crossings**, not unique members.
- **Status band** = Quiet / Moderate / Busy / Packed — the primary, most-trusted signal.
- **Edge box** = the dedicated on-site Windows PC (separate from the front-desk device)
  running the CV counting locally.
- **Fresh / Stale** = payload ≤ ~90s old is fresh; no update for ~3 min → stale/unavailable.
- **FITWAY** = the gym's own name (uppercase styling), **not** a separate SaaS brand in v1.

---

_End of research. Next step: turn this into a Spec / Definition of Done, then a Plan, then
build vertical slices._
