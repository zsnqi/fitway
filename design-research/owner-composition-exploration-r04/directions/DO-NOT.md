# Eclipse: the user's "do not" list

The user's own rejections, bans and reversals for the concept-only Owner direction Eclipse, collected for designer
briefs from step 4 (Reports) on. 2026-10-01; the user answered its open items the same day.

**Sources.** Each entry ends with its pointers:

- **H** is the r04 activation handoff,
  `docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md`,
  on `codex/owner-redesign-r04` at `76e2a06`. It is cited by section heading.
- **B** is `directions/NEXT-DIRECTION-BRIEF.md`, the copy on the same branch. The copy in the s04 build worktree is
  older (`622cd0b`) and has no sections from 2026-09-27 on.
- **S** is `directions/eclipse/DESIGN-SPEC.md` on `owner-followup-r04-build` at `9a98164`. It is cited by row ID.

**Always applies.** `FITWAY_PRODUCT.md` and `SPEC.md` apply in full and are not repeated here. They cover privacy,
honest states, Western digits, Arabic RTL and English LTR, the naming of entries, and capacity. The loading rules the
user approved into `DESIGN_GUIDE.md` §6 on 2026-09-30 apply too.

**What is listed.** Only things the user rejected, banned or reversed. Where the user's position changed, the entry
gives the current one. Impeccable's craft floor, general practice, things the user accepted, and coordinator or
reviewer views the user did not take up are left out.

## Typography and punctuation

- **Do not use Cairo in the concept.** The user does not want it for this exploration, and Readex Pro is approved.
  *H "Human scope clarification (2026-09-23)"; B "What the user wants", "Round 3" §6; S TYP-1.*
- **Do not write a no-readings span as a range followed by a mark and the words.** Neither a middle dot
  («لا قراءات · 2:14 م - 2:31 م») nor the dotted mark («2:14 م - 2:31 م ···· لا قراءات») is wanted. The span is one
  plain sentence in natural order, the words first: «لا قراءات من 2:14 م إلى 2:31 م» / "No readings from 2:14 PM to
  2:31 PM". The user called the range-first order badly built and the sentence clear. (The dot was chosen on
  2026-09-30 and reversed on 2026-10-01; the dotted mark was chosen on 2026-10-01 and reversed the same day.) The
  rule covers rows with a time range. The header's period line keeps its middle dot, «لا قراءات · 31 يومًا», and the
  dotted mark on a chart's time axis is a data mark, not this phrase. *H "The middle dot replaced by range first, and
  step 3 waits for the user (2026-10-01)", "The user's review of the phone build, one decision at a time
  (2026-10-01)"; S TBL-12, §8 Q11.*

## Numbers, dates, times and ranges

- **Do not set the numbers of a numeric column on the left edge in Arabic** (`text-align: end` in RTL). The user saw
  the units out of line. Numbers and their header share the physical right edge in both languages. *H "The user's
  decisions on the spec draft, and the second pass (2026-09-30)"; S TBL-1.*
- **Do not split a row with no readings into cells, or put its words under a numeric column.** The user called that
  placement bad. The row is one full-width cell. *H "The no-readings row becomes one full-width row (2026-09-30)";
  S TBL-12.*
- **Do not cross-fade a changing number, a crowd-level bar or the level word.** The user disliked the cross-fade,
  including on the small bars. Digits roll, and bars fill or empty. *H "Motion review, Round 6, and new-session resume
  point (2026-09-25)"; B "Round 6" §3-4; S MOT-2, MOT-3.*

## Colour and light

- **Do not let the red drift toward pink, purple, orange or white.** The user rejected all four r03 directions
  chiefly because their colour did not read as FITWAY red. The red light stays deep and fades only toward black.
  *H opening section (2026-09-23); B "What the user wants", "Round 2" §3; S LGT-5.*
- **Do not use a warm, orange-leaning core (recipe B) or a neutral grey-white frost (recipe C).** B was too strong,
  and C did not read as red. *H "Backlight, reference study, and lighting test (2026-09-24)"; B "Round 3" §1.*
- **Do not give an Owner screen a light field.** The user called Iron & Chalk pretty but said it does not suit them
  because it is light. The handoff records this as a steer toward dark rather than a formal rejection. Public stays
  light, as `FITWAY_PRODUCT.md` says. *H "Iron & Chalk and three dark directions (2026-09-23)"; B "What the user
  wants".*
- **Do not draw a light as a round blob or a blurry circle behind the page.** The user named Backlight's round red
  light, and rejected the lighting test's blob that bulged into the card. A light wraps around a large dark disc and is
  clipped to its element. *H "Backlight, reference study, and lighting test (2026-09-24)"; B "Round 3" §3, "Round 5"
  §1; S LGT-2.*
- **Do not end a light abruptly.** There is no hard cut, no faint red tail, and no ring end that stops short. The user
  asked for ring ends that fade to transparent. *B "Round 4" §2, "Round 5" §1 (user note).*
- **Do not wash a card in a broad red haze.** The user prefers light-study A because its light ends in clean black
  sooner. The broad areas are oxblood, red stays near the corners, and the two lower corners are balanced. *B "Round 4"
  §4, "Round 5" §2.*
- **Do not fix a light to the viewport, and do not light most cards.** A light belongs to one element. A page has the
  wash plus at most one summary light and one data light, and may have none. *B "Round 2" §1; S LGT-2, LGT-6.*
- **Do not make the glass from transparency.** The user found Backlight's glass weak. Cards are near-opaque, and the
  glass comes from light, a brighter rim and thin nested borders. *H "Backlight, reference study, and lighting test
  (2026-09-24)"; B "Round 2" §2.*
- **Do not put grain on flat surfaces, or make it strong.** The test's grain was too strong. Keep it fine and faint,
  inside lit areas only. *B "Round 3" §2.*
- **Do not change the user-tuned light values in `:root`.** The user set them with the tuner. *H "Eclipse v3 and the
  draggable tuner (2026-09-24 to 2026-09-25)"; B "Round 6" §10; S LGT-4.*
- **Do not move the lights.** That means no entrance, no fade-in, no pointer-follow and no crowd-dependent strength.
  The user disliked the lights' entrance and saw no value in the crowd light. *H "Motion delivered (2026-09-25)",
  "Motion review, Round 6, and new-session resume point (2026-09-25)"; B "Round 6" §2; S LGT-1, LGT-11.*
- **Do not keep a card lit, even dimly, while its content is not current.** This covers delayed, stale, unavailable,
  empty, closed, loading and error. In Delayed, both lights go out. (This reverses Round 2 §10, "may stay as it is",
  on 2026-09-30 and 2026-10-01.) *H "Step 1 done: the design review and the user's picks, and new-session resume point
  (2026-09-30)" (D1), "The user's decisions on the step-3 review, and the review fixes launched (2026-10-01)" (F2);
  S LGT-7, LGT-8, STA-2.*

## Layout and motion

- **Do not put the creativity into an unusual page structure.** Floodlight, Chronograph and Pit Wall were good but too
  creative and complex. The structure should feel familiar, and the details and finish carry the quality. *H "Discovery
  discussion and next brief (2026-09-24)"; B "What the user wants".*
- **Do not copy the Daily page's arrangement or its lit cards onto another screen.** The visual language carries over,
  but the composition does not. *H "The design-phase plan agreed, and step 1 launched (2026-09-30)"; B "The
  design-phase plan" §1.*
- **Do not merge Reports into Daily, or Daily into Reports.** They answer different questions: now, and patterns. *H
  "User answers and the follow-up round (2026-09-27)"; B "Round 7" §6.*
- **Do not copy the FINANCIA reference's layout, assets or styling, and do not reuse the rejected r02 and r03
  concepts.** Take the reference's feel and quality bar only. *B "Reference (feel only — do not copy)", "Round 2"; H
  "Fresh-direction activation (2026-09-23)".*
- **Do not animate the page on load.** That means no card stagger or rise, no fade, no line draw on every open and no
  wash drift. The user judged the load motion cliché and the plain fade dull. The page is complete at first paint. The
  one exception is Daily's first-open intro, in the next entry. *H "Motion delivered (2026-09-25)", "Motion review,
  Round 6, and new-session resume point (2026-09-25)"; B "Round 6" §1; S MOT-1.*
- **Do not play the intro on a reload, play it fast, or move a surface in it.** It plays once per tab, never on F5,
  and only content moves. The user found 820 ms "very fast" and set it to about 1171 ms. *B "Round 7" §4, "Decisions
  after the step 3 report"; S MOT-10.*
- **Do not hide text, or add a loading screen or skeleton, to cover font loading.** The user turned both down. A late
  font shows the fallback and swaps before the intro. The only accepted wait is Chromium's hold of about 100 ms when the
  fonts are slow. *H "The user accepts the late-font swap, and the successor opens (2026-09-29)", "The user accepts the
  paint hold, and the second resume goes to Codex (2026-09-30)", "Note for the data-wiring phase: the loading state
  (2026-09-30)".*

## Charts

- **Do not clutter the chart.** That means no band ruler, no capacity line, no dotted "still ahead" texture and no
  heavy legend row. The user found Backlight's chart busy. *H "Backlight, reference study, and lighting test
  (2026-09-24)"; B "Round 2" §5.*
- **Do not draw the missing span as a full-height hatched column, or fill it with vertical lines.** The user named the
  tall hatched column. The line ends with round caps, and a short dotted mark sits on the time axis. *H "Backlight,
  reference study, and lighting test (2026-09-24)"; B "Round 2" §7, "Round 3"; S STA-4.*
- **Do not draw the line as a trailing average.** Its crest lagged the true peak by about 15 minutes. The average is
  centred. *H "Eclipse delivered (2026-09-24)"; B "Round 4" §1.*
- **Do not make the marker look like a crosshair or a sight.** It has no level ticks and nothing above the point. The
  user said Round 6's marker looked like a shooter game's crosshair. The lane's connector is the one exception. *H "User
  review of Round 6 and Round 7 decisions (2026-09-25)"; B "Round 7" §2, "The tooltip moves to a top lane"; S CHT-9.*
- **Do not bring back marker form A (the lit bead) or a lit line segment.** The user chose form B, the hollow ring, and
  dropped the segment. Only A's lit axis dots remain, for the missing span. *H "User choice after step 1, agent effort
  set, and new-session resume point (2026-09-25)"; B "Round 7" §2, "Decisions after step 1" §1.*
- **Do not hop the marker quickly between stops, restart it at each stop, or replace the ring at each stop.** The user
  found the 120-150 ms glide too fast and not smooth, and chose a glide along the curve over the reference clip's
  shrink-and-reappear. The marker settles in about 400 ms. *H "User review of Round 6 and Round 7 decisions
  (2026-09-25)"; B "Decisions after step 1" §3; S MOT-5.*
- **Do not show the line's average at the latest-reading stop.** It contradicted Inside now: 47 · Moderate against
  49 · Busy. The stop shows the reading. *B "Round 7" §1; S TRU-4.*
- **Do not lay tooltip text out on two edges, split the number from its crowd word, or let the number jump ends
  between stops.** The user did not like the arrangement at `04984e9`. The tooltip is one start-aligned column. *H
  "Local user review and tooltip layout request (2026-09-26)", "Coordinator moves to a local Claude Code session
  (2026-09-26)"; B "Step 2 and the tooltip (user-agreed)"; S CHT-12.*
- **Do not let the tooltip's number move between stops, and do not size the box by the stop that shows no number.**
  A 138 px box left empty space. The width is the widest numbered tooltip among the current stops. *B "Decisions after
  the step 3 report" (2026-09-27); S CHT-12.*
- **Do not let the tooltip float near its point, pin it beside the chart title, ride it just above the lines, or move
  it up and down with the point.** Floating kept failing near "now", and beside the title is too far from the eye. The
  box lives in a fixed lane at the top and moves sideways only. *H "The tooltip moves to a top lane, and round T's
  verification stops (2026-09-28)", "New coordinator session, and the lane shown to the user (2026-09-29)"; B "The
  tooltip moves to a top lane"; S CHT-11, CHT-18.*
- **Do not let anything enter the tooltip lane.** That covers lines, rings, markers, labels and "now". *B "The tooltip
  moves to a top lane"; S CHT-11.*
- **Do not cut the usual line at now.** It runs faintly to closing time, so the owner sees how the evening usually
  goes. *H "Full Daily page start and Spec amendment (2026-09-24)"; B "Round 3" §7.*
- **Do not hide today's earlier real readings when the feed is offline.** The user leaned toward showing them. The line
  runs plain to the last reading, then the dotted mark runs to now. *H "Cloud resume point (2026-10-01)", "Proposal 4
  accepted, and small fixes on Sonnet in the cloud (2026-10-01)"; S STA-12, CHT-21.*

## Navigation and header

- **Do not show a section's name when the mouse hovers over its rail icon.** The user explicitly does not want a hover
  tooltip there. The name shows on keyboard focus only. *B "Agreed layout ideas"; H "Step 1 done: the design review and
  the user's picks, and new-session resume point (2026-09-30)" (D4); S FOC-4.*
- **Do not mark the active section with a side indicator bar or a whole-row highlight.** The user named Backlight's
  rail as a problem. Each item is a tile, and the active one is solid FITWAY red. *H "Backlight, reference study, and
  lighting test (2026-09-24)"; B "Round 2" §8, "Round 3"; S RAI-2.*
- **Do not animate the rail's width or margin when it opens.** *B "Round 2" §8; S MOT-8.*
- **Do not label the language switch with a lone «ع».** Use "EN" / "AR" or a language icon. *B "Round 2" §8.*
- **Do not use a sun for Settings.** A sun reads as a brightness or theme control, so use a gear. *H "Backlight,
  reference study, and lighting test (2026-09-24)"; B "Round 3" §5.*
- **Do not use a hamburger menu on the phone.** It hides the navigation and adds a tap, and five sections fit in the
  bottom bar. *H "The design-phase plan agreed, and step 1 launched (2026-09-30)"; B "The design-phase plan" §3;
  S BRK-4.*
- **Do not put Operations in the phone's bottom bar.** On the phone it is reached through the status badge's details.
  *H "Step 3 phase A delivered: the frame at `d76972c` (2026-10-01)"; S BDG-4.*
- **Do not give Operations a section in the rail.** It is a header status, about data freshness and sensor health,
  that opens its details at every size, as the phone's badge does. The user agreed this on 2026-09-27 and confirmed it
  on 2026-10-01; the step-3 rail, which still lists it (RAI-1), changes in step 4's frame work. *B "Decisions after the
  step 3 report"; H "The do-not list drafted, and the user's answers (2026-10-01)".*

- **Do not fit the phone by compressing the desktop composition.** The user rejected Reports at 390 in phase B
  (`9309382`) as squeezed and very long: the pattern turned into 7 narrow columns (cells 31.6 px, a 1152 px card),
  one-letter day heads, «لا قراءات» breaking and colliding in every column of an empty period, and a cramped day
  table. Design what the phone needs, and show options where the trade-off is real. *H "The user's phone critique of
  phase B, and the new-session resume point (2026-10-01)".*

## Copy and wording

- **Do not use technical language or dense analytics.** The owner is not technical. Keep the text minimal and let the
  interface explain itself. *B "What the user wants".*
- **Do not add explanatory captions.** This includes the entries figure and the usual line, which has no "not a
  forecast" note. The owner explains the page to the gym, so the page carries names and values. *H "Full Daily page
  start and Spec amendment (2026-09-24)"; B "Round 3" §7-8.*
- **Do not add the comparison's baseline dates to the "Last 7 days" card** («مقابل 9 – 15 سبتمبر»). The owner
  understands the comparison without it, and it made the card too full (Q17, rejected 2026-10-01). *H "The user's
  phone critique of phase B, and the new-session resume point (2026-10-01)".*
- **Do not show the comparison chip when today is about usual.** Only a clear difference earns it. *B "Round 4" §5;
  S GLO-10.*

## Process

- **Do not decide taste on the user's behalf.** Any change to a page's look or behaviour, any choice between options,
  and visual acceptance go to the user. *H "The fix delivered, its verification launched, and fewer approvals
  (2026-09-29)".*
- **Do not carry a long-context agent into the next task.** Every task gets a fresh agent. *H "Pause and new-session
  resume point (2026-09-24)", "The design-phase plan agreed, and step 1 launched (2026-09-30)".*
- **Do not brief an agent to read whole large files.** Name the exact sections or lines to read. A designer's context
  grew large from reading files of about 2,000 lines. *H "New coordinator session, and the lane brief (2026-09-28)"
  (entry of 2026-09-29).*
- **Do not open screenshots at full resolution by default.** Downscale them. Keep full resolution for the named
  acceptance frames and fine detail, and measure pixel facts in code. *H "New coordinator session, and the lane brief
  (2026-09-28)" (entry of 2026-09-29).*
- **Do not drop a caveat to keep a report short.** Keep reports concise, with results only, in the final message. *H
  "New coordinator session, and the lane brief (2026-09-28)".*
- **Do not lock files in a brief beyond the evidence rules.** State the goal, the cause and the outcomes, and leave the
  approach open. *H "The Codex loop is measured as an eval (2026-09-30)", rule B4 (user decision 2026-09-29).*
- **Do not keep patching a concept that keeps failing.** The user said the fixes "feel like patches", and did not want
  more time spent patching the floating tooltip. Rethink the cause instead. *H "The tooltip moves to a top lane, and
  round T's verification stops (2026-09-28)", "Codex moves to GPT-6.1 Sol, and the first-load problem is rethought
  (2026-09-29)"; B "The tooltip moves to a top lane".*
- **Do not build the held-out suite or run the full tests before the user has seen and settled a screen.** The user
  may still change it. *H "The user reorders the Reports round: review first, suite later (2026-09-30)"; B "The
  design-phase plan" §1.*
- **Do not hand the user commands to view a screen.** Start the preview for them. *H "Step 1 done: the design review
  and the user's picks, and new-session resume point (2026-09-30)", working agreements.*
- **Do not put temp or scratch files on drive C** (the local machine). *H "Model choices, cleanup, and new-session
  resume point (2026-09-28)".*

Working agreements that bind only the coordinator, such as the reply dialect, push rules, model choice and effort,
stay in H and are not repeated here.

## To confirm

Settled on 2026-10-01:

- Operations has no rail section, which is now in the main list.
- "The delay is shown once" is dropped, because the approved designs show its age in the tooltip and the badge too.
- The en dash is not rejected. The user prefers it in Arabic ranges too (DAT-3).
- The review findings F1-F21 and the answers Q3-Q10 stay in the spec as rules the user endorsed.

Still open:

- **No intro on Reports, and no rolling digits when the period changes.** This was the Reports designer's proposal
  and the user decides it in step 4's review. *H "Reports delivered at `31a40d6`, for the user's review
  (2026-09-30)"; B "The design-phase plan" §6; S MOT-10, OWN-R5.*
