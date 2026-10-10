# Spec: the Owner CSS round (owner-design-exploration-r04)

Written 2026-10-10 by the coordinator with `/to-spec`. It covers the CSS fix round (Owner resume point, Next steps 6),
Owner DECISIONS item 41, the `grilling` answers of 2026-10-10 (Q1-Q5) and the user's yes to the test seams. It is the
first question-and-spec trial (agent-environment DECISIONS item 21, step 6). The Codex brief and the designer brief are
written from it. Neither one is this file.

## Problem Statement

The Eclipse concept is the reference that production will copy. On the gym owner's own devices it has these defects:

- **Hover gets stuck.** After the owner taps a button, row, tab, chip, rail item or tab-bar item on a phone or tablet,
  its hover colour stays until something else is tapped, so the control looks selected when it is not. 76 hover rules
  apply on every device.
- **No press feedback.** Nothing shows that a control was pressed. The concept has no pressed state, so the owner on a
  slow action cannot tell the tap landed and taps again.
- **Field zoom on the iPhone.** Tapping a text field or a select zooms the page, because field text is 15 px. The owner
  then has to pinch back.
- **Inert edge spacing.** The spacing meant for the notch and the home indicator never applies, because no page opts
  into the full screen (`viewport-fit=cover`). The bottom tab bar and the dialogs' foot can sit against the home
  indicator. This has not been checked on a device.
- **High contrast mode.** In Windows high contrast (forced colours), 11 places remove the browser's outline and draw
  their own focus ring with colours or shadows that the mode strips, so keyboard focus can disappear. Controls whose
  edge is only a background or a shadow lose their boundary. The concept has no forced-colours rule at all.

## Solution

When the round is done, the concept shows these behaviours on each device:

- **Phone and tablet.** A tap leaves no stuck colour. Every control that does something shows a pressed state at once
  under the finger. Tapping a field never zooms the page. The tab bar and the dialogs' foot clear the home indicator,
  and the page sides clear the notch.
- **Computer with a mouse.** Hover looks exactly as it does today. Every control also shows the pressed state while
  the button is held.
- **Windows high contrast.**
  - Every focus ring stays visible.
  - Every control and field keeps its boundary.
  - Selected and disabled states stay readable, all in the system's colours.
  - The charts keep their own colours.
- **Reduced motion, or the concept's motion switch off.** The pressed state is colour and light only, with no
  movement.
- **Disabled controls.** A disabled control never looks pressed. Where it explains why it is off, the explanation is
  the response.
- **Vibration.** No device vibrates.

## User Stories

1. As a gym owner on a phone, I want a tapped control to lose its hover colour when my finger lifts, so that nothing
   looks selected that is not.
2. As a gym owner on a tablet, I want the same, so that the tablet band behaves like the phone for touch.
3. As a gym owner with a mouse on a computer, I want hover to look exactly as it does today, so that the round changes
   nothing I already use.
4. As a gym owner on an iPad with a trackpad, I accept that hover colours do not show, so that touch-first devices
   never get stuck colours.
5. As a gym owner, I want any information that hover shows to be reachable by touch and keyboard too, so that a phone
   never hides something from me.
6. As a gym owner on a phone, I want to see at once that my tap landed on a button, so that I do not tap twice.
7. As a gym owner, I want the same pressed state on links, tabs, segments, chips, rail items, tab-bar items, rows that
   open something, dialog actions and the date picker's days, so that every control answers the same way.
8. As a gym owner with a mouse, I want the pressed state while I hold the button, so that a click is acknowledged too.
9. As a gym owner, I want the pressed state to appear even on a very fast tap, so that it is not skipped.
10. As a gym owner on an iPhone, I want the pressed state to work in Safari, which applies it on touch only under
    conditions the page must meet, so that my iPhone is not left without it.
11. As a gym owner on Android, I want the same pressed state as on my iPhone, so that the two phones feel the same.
12. As a gym owner, I want the browser's grey tap flash replaced by the designed pressed state, so that there is one
    clean response instead of two.
13. As a gym owner, I want the pressed state never to fade any text, so that labels stay readable (MOT-1).
14. As a gym owner who turned on reduced motion, I want the pressed state without movement, so that the screen does
    not move under me.
15. As a gym owner, I want a disabled control never to look pressed, so that I am not misled into thinking the action
    ran.
16. As a gym owner pressing a disabled control that explains why it is off, I want that explanation to be the response,
    so that I learn what to do.
17. As a gym owner, I want no vibration on any phone, so that my iPhone and my Android phone feel the same.
18. As a keyboard user, I want my focus ring and the action's result to show that Space or Enter worked, so that the
    keyboard needs no extra effect.
19. As a gym owner on an iPhone, I want tapping the Activity log's person filter not to zoom the page, so that I stay
    where I was.
20. As a gym owner on an iPhone, I want tapping the Activity log's reason search not to zoom the page.
21. As a gym owner on an iPhone, I want tapping any of Access's fields (the PIN, the password, the front desk code and
    the reason) not to zoom the page.
22. As a gym owner on an iPhone, I want tapping Reports' sort list not to zoom the page.
23. As a gym owner, I want field text at 16 px in both languages, with long Arabic and English values still fitting,
    so that the larger text breaks nothing.
24. As a gym owner, I want fields to keep their 44 px height, so that the layout around them does not move.
25. As a gym owner on an iPhone, I want the bottom tab bar to clear the home indicator, so that I can tap it without
    triggering the system gesture.
26. As a gym owner on an iPhone, I want a dialog's buttons to clear the home indicator.
27. As a gym owner turning a phone sideways, I want no content under the notch, so that this view is never worse than
    today, even though it has no designed layout yet (K-36).
28. As a gym owner on an Android phone with a cutout, I want the same edge behaviour as on the iPhone.
29. As a high-contrast user on Windows, I want every focus ring visible in system colours, so that I always know where
    the keyboard is.
30. As a high-contrast user, I want every button, field and control to keep a visible boundary.
31. As a high-contrast user, I want selected tabs, segments, rail items and days, and disabled controls, to stay
    distinguishable.
32. As a high-contrast user, I want the charts to keep their own drawn colours, so that the data stays readable without
    a redraw.
33. As an Arabic reader, I want every change to behave the same right to left, so that nothing is fixed to the left
    side.
34. As the founder reviewing the concept, I want hover and press changes to leave every frame at rest unchanged except
    the field text, so that the round is a fix, not a redesign.
35. As the founder, I want to try the pressed state on my iPhone and my Android phone right after its first build
    (item 7), so that a finger judges it, not an emulator.
36. As the founder, I want to see the round only when it is finished, every review finding fixed (item 11).
37. As the developer who later moves the concept into production, I want hover gating, pressed states, the forced-colours
    rules and the 16 px field text written as reusable patterns, so that production copies one clear way.
38. As the coordinator, I want the concept CSS check at zero findings, so that it can block regressions later.
39. As a verifier, I want the verification tool to render forced colours and to capture a held press, so that I prove
    both from rendered frames instead of reading CSS.
40. As a future designer, I want the pressed state, the field size and the forced-colours behaviour recorded in the
    concept's design spec, so that the next screen follows them without asking.

## Implementation Decisions

**Order and writers.**
- **Codex** takes the mechanical part first: hover gating, focus rings, forced colours, `viewport-fit` and field text.
  These items have no taste in them (Owner DECISIONS rounds item 9).
- **The designer** (Claude) then designs and builds the pressed state on top of Codex's commit, so that its pressed rules
  sit next to the hover rules once they are already gated.
- **An independent verifier** checks the whole round after that.
- **The user** gets the pressed state on both phones through the LAN preview after its first build, and the finished
  round only after every finding is fixed.

**Hover gating.**
- Every hover rule in the concept goes inside a hover media query. This covers the four Owner screens, the components
  sheet, the date picker and the light tuner. The query tests `hover: hover` alone, not `pointer: fine`, because a
  tablet with a mouse would lose hover under `pointer: fine` and the concept designs a tablet band.
- With a mouse, the result is identical.
- Hover never carries information that touch and keyboard lack (DESIGN_GUIDE: hover is never the only path).

**Focus rings.**
- Each of the 11 outline removals keeps a transparent outline, which high contrast mode then draws, or moves its ring to
  an element whose ring survives that mode.
- In normal mode the rings keep their current look (FOC-1, FOC-2, FOC-3).

**Forced colours, minimum level.**
- In high contrast mode, focus rings, the boundaries of controls and fields, and selected and disabled states use system
  colours.
- The charts' plot opts out of colour adjustment and keeps its drawn colours.
- Text follows the system's text colour.
- Normal mode does not change.

**Full screen and edges.**
- Every concept page (Daily, Reports, Activity log, Access and the components sheet) opts into the full screen with
  `viewport-fit=cover`.
- The insets that already exist then apply. The page's sides also respect the side insets, so that a phone turned
  sideways is no worse than today.
- Safe-area insets stay physical left and right (DESIGN_GUIDE's exception), so right to left does not swap the
  cutouts.

**Field text.**
- Every input, textarea and select uses 16 px text, because each one opens a keyboard or a picker on a phone. That
  includes the front desk code field in JetBrains Mono and the components sheet's field specimens.
- Field height stays 44 px, and the line height follows the type role.
- Body text that is not in a field stays 15 px.
- The concept's type roles record the new field size (TYP-3, TYP-6).

**The pressed state (the designer's form, within limits).**
- **Scope.** Every control that does something on press, across the four screens and the components sheet. The
  designer inventories them.
- **Exclusions.**
  - The charts' plot, because its readout appears under the finger.
  - Disabled controls, which show no press.
  - The light tuner, a review aid that is not an Owner control and gets hover gating only.
- **Limits.**
  - The pressed state appears at pointer down or touch start, with no delay.
  - No text fades (MOT-1).
  - Under reduced motion and with the concept's motion switch off, it is colour and light only.
  - No vibration.
  - No added script for the keyboard. Space gives the pressed state where the browser does it natively.
- **Free choice.** Within those limits the form is free. A small shrink is allowed.
- **iPhone.** Safari has applied the pressed state on touch only when the page listens for touch. This comes from
  general knowledge and is not verified here. The build meets that condition, and the iPhone try proves it.
- **Tap flash.** The browser's tap highlight is removed only where the designed pressed state replaces it.
- **Records.** The form is recorded in the concept's design spec as a motion row and a state row, and the instant-by-
  choice row (MOT-18) is updated if it is affected.

**The concept CSS check.**
- `pnpm check:concept-css` on the build's concept reaches zero findings, down from 87.
- It joins the fast ladder only once a concept with zero findings is on the trunk, because the ladder checks the
  trunk's copy. The build line is not on the trunk yet, so the timing is the coordinator's call at integration.

**The verification tool (a small environment round, before verification; agent-environment-r03).**
- The verify-fitway CLI gains a forced-colours axis and a held-press capture: a named control with the pointer or the
  finger held down.
- Each one ships with a planted-defect control: a removed ring must show as missing, and a control without a pressed
  state must show as unchanged.
- Nothing else in the tool changes.

## Testing Decisions

**What makes a good test.** It proves behaviour from rendered frames and measurements, in the states and on the
devices the owner uses, never from reading the CSS. The static check is lint and provenance, not design evidence
(AGENTS.md). Visual acceptance is the coordinator's inspection of named exact frames, then the user's finger try on
both phones.

**The four seams the user agreed to.**
1. **The static check.** `check:concept-css` reports zero findings across the concept. Its rules already carry
   planted-defect tests.
2. **Compare before and after.** The verify-fitway CLI `compare` runs between the build before the round and the
   round's result, on every page, in Arabic and English, at desktop, tablet and phone, with mouse and touch input.
   - With a mouse at rest, every frame comes out EQUAL, except fields, whose text is now 16 px.
   - With touch, no hover colour remains after a tap.
   - Fields are checked with their widest and shortest values in both languages (rounds item 7).
3. **Held press and forced colours.**
   - Every inventoried control is captured at rest and held. The held frame differs visibly. A disabled control's
     frames are equal. Under reduced motion the held frame has no transform.
   - Every page is rendered in forced colours: every Tab stop's ring is measured visible, and every control boundary
     and selected state is present.
   - Both run through the CLI's new axes.
4. **The user's finger try**, on the iPhone and on the Android phone through the LAN preview:
   - tapping a field does not zoom;
   - the tab bar and a dialog's buttons clear the home indicator;
   - the pressed state shows under the finger;
   - no colour stays after a tap.

**Prior art.**
- The CLI's `compare` runs in earlier Owner verifications (fix-3).
- The concept CSS check's own planted-defect tests.
- ui-forensics' focus-ring measurement at every Tab stop.
- The motion round's frame strips.

**Modules tested.** The concept's pages (Daily, Reports, Activity log, Access) and the components sheet. The verify-fitway
CLI gets tests for its two new axes.

## Out of Scope

- Production code in `apps/**` and `packages/**`, Paper, canonicals, visual authority and DESIGN_GUIDE's tokens.
- A designed layout for a phone turned sideways (K-36, kept until step 8).
- The good-css "do not apply" list: oklch tokens, fluid `clamp` type and space, `pointer: fine`, the skill's motion
  values, `@starting-style` dialogs, view transitions, `text-box` on Arabic, success colouring of valid fields, and
  `overflow: clip` swaps.
- Redrawing the charts in system colours.
- Vibration, and any keyboard press effect beyond what the browser gives.
- Reports' «معدّل الموجودين» card, fix-3's open findings, Access's last round, and Settings, Operations and Monitoring.

## Further Notes

- **Sources.**
  - Owner DECISIONS item 41 (press feedback, 16 px fields) and items 7, 9 and 11 under "How this milestone's rounds
    run".
  - `good-css-review.md`.
  - The grilling answers of 2026-10-10: Q1 both phones; Q2 the designer is free within the limits above; Q3 forced
    colours at minimum; Q4 no vibration; Q5 a disabled control does not react.
- **Risk.** At 16 px a long Arabic reason in Access's textarea may wrap differently. The widest values are checked in
  both languages.
- **Trial measure** (item 21). This round is compared with ordinary rounds on repair attempts and on held-out rows that
  fail because of the brief's wording. One trial is a signal, not a verdict.
