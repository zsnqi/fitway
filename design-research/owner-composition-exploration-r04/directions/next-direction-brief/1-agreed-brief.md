<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Scope

- One direction, **Daily page only**, **desktop 1440×900**. Arabic RTL and English LTR frames.
  *Widened by "The design-phase plan" (2026-09-30): every Owner screen at 1440, 768 and 390, then Staff and Public.*
- One writer subagent at a time, each followed by a fresh independent verifier (Round 7, "Work
  plan"). `CLAUDE.md` lists the Owner-direction agent definitions and their effort levels. The
  coordinator personally inspects the frames before showing the user.
- Folder: `design-research/owner-composition-exploration-r04/directions/<name>/`.

## What the user wants

- **Clarity:** clear, beautiful, calm, and premium. **Not complex.** Put the creativity in details
  and finish, not in an unusual page structure; the structure should feel familiar at first
  glance. The previous dark directions (Floodlight, Chronograph, Pit Wall) were good but too
  creative and complex in overall form.
- **Plain language:** not technical, because the gym owner is not technical. Keep text minimal;
  the interface should explain itself.
- **Low cognitive load:** essentials first. Show details only on request (hover, click, or
  "View details").
- **First questions to answer:** how is today going right now; is today busier or quieter than
  usual; and when are the peak times.
- **Feel:** calm, premium, and clear. A touch of sporty liveliness is fine. No dense analytics.
  Large numbers are welcome where they help.
- **Treatment:** **dark**, with **glass cards** (frosted, soft rounded corners) and a **soft, dim
  FITWAY-red light behind the glass**. The identity is black and FITWAY red. The red must read as
  FITWAY red, never pink or purple. Cairo is excluded.

## Reference (feel only — do not copy)

The reference is Behance, "FINANCIA – Finance CRM & SaaS UI/UX Dashboard Design":
https://www.behance.net/gallery/248793029/FINANCIA-Finance-CRM-SaaS-UIUX-Dashboard-Design

What the user likes:

- the calm glass UI
- the **chart card**: a smooth line, a dashed comparison line, fine vertical lines under the
  curve, and a hover guide with a value tooltip
- the slim icon sidebar with tooltips, which can expand to show labels

It is another designer's work. Take its spirit and quality bar, not its layout, assets, or
styling.

## Agreed layout ideas

- **Navigation:**
  - A slim side rail on the inline-start: the **right in Arabic**, the left in English.
  - **Icons only.** Hover shows only a clear hover state on the icon itself. The user explicitly
    does **not** want a name tooltip on hover.
  - Section names appear only when the rail is expanded.
  - Each icon still needs a localized accessible name (`aria-label`).
  - `DESIGN_GUIDE.md` §11 asks for tooltips where an icon's purpose is not obvious. Propose a
    quiet way to meet that, for example showing the name on keyboard focus only. Surface it to
    the user rather than silently adding hover tooltips.
  - The **FITWAY logo** (`brand/fitway-logo.png`: a circular emblem with a chevron) sits at the
    top of the rail. **Clicking it expands the rail** to show the section names, and clicking it
    again collapses the rail.
  - The user allows redrawing the logo cleanly and refining it while keeping its basic shape.
  - Sections: Daily, Reports, Access, Activity Log, Operations, and Settings, plus
    Monitoring/Management, the language switch, and sign out.
  - The overall structure need not copy the reference.
- **Main card:**
  - Today's occupancy as a **smooth red line**. It stays honest: shape-preserving, passes through
    the observations, and never invents peaks or dips.
  - A **dashed "usual for this weekday" line**, for example the average of the last 4
    Wednesdays.
  - Hover, focus, or tap shows the time, the count, and the crowd level.
  - **Open:** what to show when there isn't enough history for the "usual" line. Design an honest
    state for it. The comparison idea itself is tentative until the user sees it.
- **3–4 small cards:**
  - now: approximate count, live status, and crowd level
  - today's peak
  - today's entries (estimated entrance crossings)
  - possibly the busiest times this week

  The design settles the final set.
- **Details hidden until asked:** the minute table, the weekly heatmap, and data coverage, behind
  "View details".

## Binding (unchanged)

Product/Spec truth still holds:

- **Distinct states:** live, delayed, missing, genuine zero, closed, and still ahead are distinct,
  and nothing stale looks live.
- **Language:** Western digits; Arabic RTL and English LTR; `<bdi>` isolation, and a plain hyphen
  in Arabic ranges.
- **Accessibility:** a text equivalent for the chart, keyboard inspection, visible focus, and
  reduced motion.
- **Labeling:** a visible "Exploration concept · synthetic data" label.
- **Protected work:** no production, canonical, Paper, or authority change, and no edits to
  Redline or the other directions.

## Shared synthetic data

- **The day:** business day Wednesday 23 September 2026, gym time Riyadh. Open 6:00 AM–1:00 AM
  next day. Now is 7:42 PM, and the latest reading is 7:42 PM.
- **Minute series:** simulate a whole-person count process. Each minute, entries follow a Poisson
  distribution and exits follow Binomial(occupancy, 1/64), with a seeded PRNG. Shape: a morning
  bump of ~30 around 7:20 AM, a small midday bump of ~15, and an evening peak of ~60–64 around
  6:30 PM, then ~50 at 7:42 PM. Entries come from the same simulation.
- **Special spans:** a genuine zero from 6:00–6:09 AM, and a missing observation from 2:14–2:31 PM.
  Everything after now is still ahead.
- **Crowd levels:** Quiet ≤ 24, Moderate ≤ 48, Busy ≤ 68, Packed above. Capacity 80, owner-private.
- **"Usual Wednesday":** a synthetic average of the last 4 Wednesdays, labeled as such.

