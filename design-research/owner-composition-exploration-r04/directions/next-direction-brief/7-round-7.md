<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Round 7 — after the Round 6 review (agreed 2026-09-25)

The user reviewed Round 6 in the browser.
- **Kept as is:** the digit roll and its motion ("excellent").
- **Disliked:** the "reading sight" marker, which looks like a shooter game's crosshair, and its movement
  between stops, which is too fast and does not feel smooth.
- **Reference clip:** the user supplied `D:\Projects\LLM_HANDOFFS\FITWAY\20260317-1837-34.2222242.mp4` as a
  reference for smooth hover motion. It is feel only; do not copy it.
- **The coordinator's measurement of the clip:**
  - It runs at 30 fps.
  - The tooltip follows the pointer with a fast start and a long, soft landing: about 60% of the distance in
    about 100 ms, and settled in about 350–400 ms.
  - The remaining distance shrinks by about 0.7 per 33 ms frame, which is exponential or critically damped.
  - Text changes at once.
  - The old ring shrinks away, and a new ring appears at the new point.

### Decisions (user-agreed)

1. **The latest-reading stop shows the latest reading** (49 · Busy at 7:42 PM), the same as the Inside now
   card. It no longer shows the line's value (47 · Moderate). The marker stays on the line's end point.
2. **Marker: two candidate forms, and the user chooses.**
   - **A, a lit bead:** a solid FITWAY-red dot with a thin light rim, and a soft red glow that lights the line
     around it.
   - **B, a hollow ring:** a dark centre and a red edge, with a soft glow. It is close to the reference clip.
   - **Common to both:**
     - no level ticks, and nothing above the point: no guide line over the marker;
     - the thin red hairline from the point down to the time axis stays;
     - after now, the marker is a hollow chalk ring on the usual line;
     - with no history, there is no marker after now (confirmed);
     - the peak and missing-span stops get a fitting variant of each form.
   - **Choosing:** a tuner switch changes between A and B on the real page, and an enlarged side-by-side
     comparison is rendered. A third form (a lit segment of the line) was dropped by the user.
   - *Settled in "Decisions after step 1" §1: form B, with A's missing-span variant. Form A is removed.*
3. **Marker motion: a smooth follow.** This replaces the Round 6 glide of 120–150 ms, and the ≤ 150 ms limit in
   Round 6 §8 for the marker, guide, and tooltip.
   - The marker chases its target along the curve itself, with a fast start and a soft landing, settling in
     about 350–400 ms like the reference.
   - It never restarts at each stop: a new target mid-motion is taken up smoothly. A quick pass over several
     stops is one continuous movement.
   - The tooltip moves with the marker, and its text still changes at once.
   - The arrow keys use the same motion. With reduced motion, it jumps.
4. **A first-open intro.** This amends Round 6 §1, "No load motion".
   - **When:** only on the first open in a browser tab. It does not play on F5 or a reload, or when returning in
     the same tab session, and it plays again in a new tab or after the browser restarts.
   - **What is still:** the surfaces are present and still from the first paint: the glass cards, the lights,
     the wash, and the rail. The lights never move.
   - **What moves:** only the content inside the surfaces.
     - The numbers roll into place with the same digit roll.
     - The line draws once, from opening to now, and then the end point and the peak appear.
   - **Length:** short, about 1 s or less in total. The numbers settle first and quickly, because they answer
     the owner's first question. The line takes longer, because it tells the day's story. *The user later
     approved a slower intro, about 1.17 s in total ("Decisions after the step 3 report").*
   - **The end state** is the still page, pixel for pixel. There is no intro with reduced motion or
     `?motion=off`.
   - **Tuner:** an "intro speed" control and a "replay intro" button. The tuner is a tool, not part of the
     design.
5. **Unchanged:**
   - no load motion beyond decision 4;
   - static lights;
   - the digit roll, the level bars, the live tail and the pulse, and the rail;
   - every still frame (the pixel-identity rule of Round 6 §10 still holds, except the frames the marker
     changes by design).
6. **Merge proposals from "After the Daily page":**
   - **Contextual history is agreed.** The full Activity Log page stays, and each screen also shows a small
     "Latest changes" list of its own last 3–5 changes, for example PIN changes in Access and value changes
     in Settings.
   - **Operations becomes a header status** for data freshness and sensor health. It opens a detail page and
     has no primary rail slot. This is agreed.
   - **Daily and Reports stay separate.** This is agreed.

### Work plan (user-agreed)

- **Order:** fresh, bounded designer agents, one after another, all confined to `eclipse/`:
  1. the marker forms A and B with a tuner switch, then the user chooses;
  2. the smooth follow on the chosen form, the latest-stop fix, and removing the other form;
  3. the first-open intro.
- **Verification:** after each designer, a fresh, independent verifier agent (`xhigh`) checks the work from the
  brief, the code, and rendered and executed evidence. It does not use the designer's reasoning. The
  coordinator reviews the verifier's evidence (its frames and numbers), not only its claims, before showing
  the user.
- **Later, a separate task:** define this independent-verifier role in `docs/WORKFLOW.md`, with the user's
  approval.

### Decisions after step 1 (user-agreed 2026-09-25)

Step 1 delivered forms A and B with a tuner switch, and an independent verifier passed all ten checks. The user
tried both.

1. **Form B, the hollow ring, is chosen.** Form A is removed, with one exception: **the missing-span stop uses
   A's variant**, the dotted mark on the time axis lit in chalk with its soft light. B's capsule outline is
   dropped.
2. **The live pulse stays as it is,** including when B sits on the latest reading. The verifier's F1, the pulse
   drawing a ring inside B every 5 s, was put to the user, and they chose to keep it.
3. **Marker motion (decision 3), now specified from the reference clip.** The coordinator tracked the clip's
   tooltip frame by frame, at 30 fps.
   - **Text:** it changes at once when the stop changes, and then the tooltip travels.
   - **Easing:** fast start, long soft landing. About 20% of the distance is covered in the first 33 ms, about
     60% by 100 ms, and about 90% by 230 ms. It is settled at about 400 ms. The remaining distance shrinks by
     about 0.7 per 33 ms, which is exponential or critically damped.
   - **Path:** it moves in x and y together, following the line's height.
   - **Appearing:** on first hover the tooltip appears quickly, in about 60–100 ms.
   - **In the clip, the ring does not travel:** the old ring shrinks away and the new one appears. **The user
     chose instead that B glides along the curve itself, together with the tooltip, on the same easing.** A
     new target mid-motion is taken up smoothly, with no restart at each stop. The arrow keys use the same
     motion. With reduced motion, it jumps.
   - **Tuner:** a "hover speed" control, so the user can tune the feel.
   - **Step size (the user's note):** the clip's stops are hourly (11:00, 12:00). Every one-hour jump in the
     clip, about 140 video px, settles in about 12 frames (400 ms). Once, the pointer moved two hours quickly,
     and the motion took up the new target without restarting. **The user confirmed that the stops stay
     half-hourly** (Round 6 §5). The follow is time-based, so the same feel applies to the shorter half-hour
     steps.
4. **Carried into step 2 from the verifier:**
   - **F2:** when a live update arrives with the latest stop selected, the end halo flashes for 50–75 ms. Fix it.
   - **F5:** the first move into the future blocks the main thread for about 180 ms, because the usual line's
     sampling table is built lazily. Build it ahead of time, or make it cheap, so the follow is never janky.
   - **F3 (A's glow at the peak)** no longer applies, because A is removed.
5. **Step 2 therefore covers:**
   - form B only, with A's missing-span variant;
   - the clip-derived follow and its speed control;
   - the latest stop showing the latest reading (decision 1: 49 · Busy);
   - F2 and F5.
   Step 3, the first-open intro, stays as decision 4.

