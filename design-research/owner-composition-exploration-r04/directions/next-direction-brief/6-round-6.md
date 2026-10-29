<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Round 6 — motion reset and chart hover (agreed 2026-09-25)

The user reviewed the Round 5 §4 motion (see `eclipse/HISTORY.md`, "Motion") and judged it cliché and
below the visual quality of the page. They disliked the number cross-fade (including on the small
crowd-level bars) and the lights' entrance. The coordinator's diagnosis, which the user agreed with:

- **Frequency:** the Daily page is opened many times a day. Motion that plays on every open soon feels
  slow and tiresome.
- **Generic vocabulary:** fade, rise, and stagger is every template's default, and it clashes with a
  distinctive static design.
- **Wrong subject:** animating the decorative lights pulls attention from the data.
- **Cross-fading numbers:** two glyph sets overlapping at partial opacity ghost and look muddy.
- **Uniform motion:** one easing and long durations (1.1–1.7 s) give expressive motion in a working tool.
- **Line draw on load:** redrawing the line on every load is a decorative reveal, not a transition between
  two real states.

**Principle:** motion carries information and decoration never moves. The page is an instrument. It is
complete at first paint, and something moves only when data really changes or the user acts.

The coordinator's research sources include:
- Emil Kowalski, "You don't need animations" and "Great animations";
- Rauno Freiberg, "Invisible details of interaction design";
- the Vercel Web Interface Guidelines;
- IBM Carbon's productive and expressive motion;
- Apple HIG Motion and SwiftUI `numericText`;
- NumberFlow;
- Jake Archibald on cross-fading DOM elements;
- Heer & Robertson (2007) on animated transitions;
- Highcharts and Observable Plot on pointer snapping.

### Decisions (user-agreed)

1. **No load motion.**
   - The page appears complete: no card stagger or rise, no line draw, no light entrance, no wash drift, no
     end-point or peak entrance.
   - Content is never hidden while fonts load.
   - *Amended by Round 7 §4 (a first-open intro) and by "Decisions on the step 3 intro" §1 (on a
     first open, the numbers are hidden for at most 200 ms while fonts load). Further amended by the user's decisions
     of 2026-09-29 and 2026-09-30, recorded in the r04 activation handoff: a font that arrives late shows the fallback
     at the first paint and swaps to Readex Pro before the intro starts, and the intro never moves. When the font files
     are slow, Chromium's first-paint hold of about 100 ms (measured 108-124 ms) is accepted.*
2. **Lights are static, always.**
   - Remove the lights' entrance, the pointer-follow light, and the crowd-dependent light option.
   - The user sees no value in the crowd-dependent light, and it is not visible anyway.
3. **Numbers roll by digit** (option A, odometer style) wherever a number changes live. This includes
   "Inside now" and "Entries".
   - Only the digits that change move: up when the value rises, down when it falls. Each roll takes about
     250–300 ms with ease-out.
   - Use tabular figures, so the width never jumps. Never cross-fade.
   - Screen readers hear the new total once, through a polite live region on the number, not per digit.
   - With reduced motion, the value swaps instantly.
4. **The crowd-level indicator never cross-fades.**
   - The small bars change individually, for example a bar filling or emptying with a short `scaleY`, or
     instantly.
   - The level word swaps without ghosting.
5. **Chart hover snaps to half-hour stops.**
   - The stops are aligned with the drawn line, from opening to 1:00 AM.
   - The tooltip shows the time, the line's own value at that stop (the centred average, never the raw
     minute), the crowd level, and the usual value. *Except at the latest-reading stop, which shows the
     latest reading (Round 7 §1).*
   - **Extra stops:** the true peak (62 at 6:29 PM) and now (the latest reading).
   - **The marker always sits on what it describes:** on the line, or on the peak marker.
   - **Missing span:** it has no normal stop. It is either skipped or shown as one clearly labelled
     "no reading" stop, and the line is never bridged.
   - **After now:** stops show "still ahead" with the usual value, as today.
   - **Keyboard:** the arrow keys step one stop.
   - **Detail:** minute-level detail stays in "View details".
6. **A new hover marker.**
   - *Superseded by Round 7 §2–§3 and "Decisions after step 1": the marker is form B, the hollow ring,
     and it follows with the clip-derived easing, settling in about 400 ms.*
   - The user wants a better marker than the current ring in the chart, with pleasing motion as it moves.
   - The designer proposes its form. It must feel precise and premium in FITWAY red and chalk, not a
     generic ring.
   - **Coordinator's suggestion:** between stops, the marker glides *along the curve itself*, not in a
     straight hop, in about 120–160 ms. The guide line and the tooltip follow.
   - Tooltip text and numbers change without a cross-fade.
7. **Live update.**
   - Keep "extend, never redraw", with the tail morph that the centred average needs. Make it short, about
     250–300 ms.
   - The live pulse stays, because it carries "live", but it becomes calmer and subtler. There is none when
     delayed.
8. **Other motion.**
   - Tooltip and guide motion stays short (≤ 150 ms). *Replaced by Round 7 §3 for the marker, the
     guide, and the tooltip.*
   - The rail keeps its transform-only open and may be quicker.
   - Nothing else animates.
9. **Tuner.**
   - Remove the "replay load", "follow the pointer", "switch on at load", and crowd-light toggles.
   - Keep "simulate a new reading" and "motion on/off". Add a way to simulate a crowd-level change, so the
     bars can be judged.
10. **Acceptance.**
    - With reduced motion and with `?motion=off`, every static frame must stay pixel-identical to
      `eclipse/evidence/pre-motion-hashes.json`.
    - The only exceptions are the tuner-open frame and the hover frame, which change by design because of
      the new marker and the tooltip value.
    - The user's tuned light values in `:root` do not change.

### After the Daily page (user-agreed plan)

- **Screen order:**
  1. Reports: weekday/hour pattern, week-over-week comparison, date range, CSV export.
  2. Activity Log.
  3. Access: staff PINs, with provision, rotate, and deactivate.
  4. Settings: capacity, thresholds, hours, time zone, feed geometry, and transparency wording.
  5. Operations: sensor and feed health.
  6. Mobile: 390 px, 320 px, and 200% reflow. *Replaced by "The design-phase plan" (2026-09-30): each screen is
     designed at every size in its own round, and Staff and Public follow the Owner screens.*

  The table, form, and dialog system is designed early, on the first screen that needs it, because it
  shapes the rest. The user welcomes proposals to merge screens.
- **Merge proposals from the coordinator** (*agreed in Round 7 §6 and confirmed on 2026-09-27*):
  - **Contextual history:** keep the full Activity Log page, but also show each screen's own recent
    history in place. For example, Access shows its latest PIN changes and Settings its latest changes.
  - **Operations as a header status:** make Operations a persistent status in the header, for data
    freshness and sensor health, that opens a detail page. It would then need no primary rail slot, since
    the owner needs it mainly when something is wrong.
  - **Daily and Reports:** keep them separate. They answer different questions: now against patterns.
- **Style (user, 2026-09-28):**
  - The remaining screens follow the Daily page's current Eclipse style. Their content may change, as the next point
    says, but their look does not.
  - The direction becomes the reference only after the user approves all of it, including its motion, having seen
    it.
  - *Clarified on 2026-09-30 ("The design-phase plan", §2): the visual language carries over, not the Daily page's
    composition. Each screen decides its own arrangement and where the red light goes, if anywhere.*
- **Content freedom:**
  - The remaining screens need not copy the production screens' current content or structure. The
    designer proposes what is most useful to the owner and what should change.
  - Some changes may touch a locked Product/Spec decision, such as data semantics, privacy, security,
    roles, or audit truth. Such a change is surfaced explicitly and recorded as an amendment before
    anything relies on it, as with the 2026-09-24 `SPEC.md` entries amendment.
- **Authority intent:**
  - Once this direction is finished and polished, the user intends it to become the primary reference
    for the interfaces. Paper and the older designs would then be withdrawn as references, because the
    user has had many problems with them.
  - This needs a formal, human-approved authority record later. That record also confirms the exact
    scope: Owner only, or Staff and Public too. It supersedes ADR-007 and ADR-009 where it applies, and
    updates the register and the manifest.
    *Scope decided on 2026-09-30: Staff and Public are redesigned too, and the record covers all three surfaces
    ("The design-phase plan").*
  - Nothing is withdrawn yet.
- **Production:**
  - The user will use Codex to implement production.
  - The coordinator will later prepare the plan and the environment for Codex: the authority record,
    task packets, reference frames and specifications, and verification routes.
  - *Refined on 2026-09-30: Codex starts with one bounded part as a pilot, which measures how faithfully it carries
    the reference into production, before the rest ("The design-phase plan", step 11).*

