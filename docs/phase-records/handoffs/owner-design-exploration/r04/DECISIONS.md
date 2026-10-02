# owner-design-exploration-r04: decisions in force

The decisions in force for the Owner concept work, compiled on 2026-10-02 from the activation log
(`docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md`,
"log" below), `design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md`
("brief") and `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`. Edit an entry in place when
a decision changes. An entry here overrides older text in the log and the brief. Decisions are the user's unless
marked "coordinator". Agreements on how the user and agents work are in `docs/agent-context/WORKING_AGREEMENTS.md`.

## The direction: Eclipse

1. **Look.** Dark, glass cards, a static FITWAY-red light, Readex Pro (Cairo excluded). Calm and premium, not busy.
   The visual language carries to every screen; a composition does not. Brief lines 18-36 and 835-837.
2. **Plan.** Eclipse becomes the single design reference for Owner, then Staff, then Public, through a later ADR.
   Each screen is designed at 1440, 768 and 390; 320, 1024 and 200% zoom are checked only. Tests come once, at the
   end. (2026-09-30; brief "The design-phase plan", from line 821.)
3. **The user's bans.** `DO-NOT.md`, read in full before any design or copy work.
4. **Motion.** Lights are static and the page is complete at first paint. Digits roll only on a live change. The
   intro plays on first open only, about 1.17 s, with the font wait capped at 200 ms. Reports has no intro and no
   digit roll.
5. **Chart and tooltip.** Marker B, a hollow ring, follows smoothly; the latest stop shows the latest reading. The
   tooltip sits in one fixed 107 px top lane in every state and moves sideways only (CHT-18), about 130 px wide
   (CHT-12). The legend's ring key reads "Peak reading" (CHT-20).
6. **Fonts** are self-hosted; no request leaves the origin. Chromium's first-paint hold of about 100 ms on slow fonts
   is accepted.
7. **Frame** (2026-10-01). 1024 and up: the slim icon rail. 721-1023: the rail as a modal layer opened from the
   logo. 720 and below: a glass bottom bar and a compact header. Order: Today, Reports, Activity log, Access, then
   the rest; Monitoring sits under "More" on the phone; the bar's label is «النشاط» / "Activity". Operations has no
   rail slot: the header status opens its details at every size, a 44 px control from 721 up. Rail names show on
   keyboard focus only. Every target is at least 44 px.
8. **Truthful states.** The brightest thing on a page is never stale, unavailable or empty (D1). Closed,
   Unavailable, Error and Loading keep the live layout with no lit card. Unavailable reads «غير متصل» / "Offline",
   draws the real line plain to the last reading, then a dotted mark «بانتظار القراءات»; its cards read
   «قيد الانتظار» (coordinator wording). Delayed also turns off the chart card's light.
9. **Tables** (2026-09-30). Numbers and their headers align on the physical right edge. A row with no readings is one
   full-width cell, except the single-day case (decision 10). Reports shows one day at a time (option B) below 1280;
   1280 and up keep the week grid.
10. **Reports phone review** (2026-10-01, decisions 1-8, log lines 4415-4451): one bar per day, no bar edge, no
    dated headers; an empty period shows its sentence once; "Show all days" stays; the header «لا قراءات · 31 يومًا»
    keeps its dot. No baseline on the "Last 7 days" card (Q17). Only the pattern is lit (Q13). «آخر 28 يومًا» (Q14).
11. **Wording** (2026-10-02).
    - Decision 8: a no-readings span is one sentence, words first: «لا قراءات من 10:00 ص إلى 2:00 م».
    - Decision 9: one size and colour for the whole sentence.
    - Decisions 10-11: a day without readings shows its date with «لا قراءات» or «لا قراءات بعد» under it.
    - Decision 12: Daily's waiting tooltip is «بانتظار القراءات» / «منذ 3:00 م».
    - Decisions 14 and 16: a coverage range takes a dash, no «من … إلى …», no brackets:
      «2:14 م – 2:31 م · 18 دقيقة», with the range and «· 18 دقيقة» unbreakable.
    - Decision 15: at 721-1023 the peak time sits beside the number on one baseline.
    - Decision 17: no «الأعلى» flag at any width; the peak row keeps its tint.
12. **Ranges.** Arabic ranges take the en dash (2026-10-01). This overrides the brief's "plain hyphen" and any older
    note. `DO-NOT.md` adds: no dash inside a sentence, and no «من … إلى …» in a range that stands alone as a value.
13. **Accepted as built** (2026-10-02): «· 13 دقيقة» on a second line at 320 AR; the peak column 18 px narrower at
    1024 EN; the three-line wrap of the peak row's note at 721 and 768 AR, for now; the quiet hour bars.

## How this milestone's rounds run

1. **A design round:** a fresh designer, then a fresh reviewer, then the coordinator inspects the frames, then the
   user decides. The user sees exact rendered crops, numbered for comparison; the coordinator starts any preview
   itself.
2. **Agents** follow the table in `CLAUDE.md`; a long-context designer is never resumed.
3. **Codex** is GPT-6.1 Sol at `xhigh`, run by the coordinator with `codex exec --approve-for-me`
   (`docs/phase-records/handoffs/agent-environment/DECISIONS.md` item 7), and is not used in cloud sessions. Its
   briefs follow these rules:
   - B1. Name every supported way to open and run the artifact (HTTP, `file://`, sizes, reduced motion) and which
     ones the harness checks.
   - B2. Before requiring equality to a baseline, check the baseline does not carry the defect being removed.
   - B3. When an outcome is unmet, do not work around it: measure the rest, then stop and report.
   - B4. State the goal, the cause and the outcomes; leave the approach open.
   - B5. Never put the verifier's probes, thresholds or held-out checks in a brief.
   - B6. One change per round, aimed at a cause.
   - B7. Before requiring an outcome under any condition, check the baseline meets it there; a condition where it
     fails is pre-existing and out of scope, required "unchanged from the baseline".
4. **Verifiers** follow these rules:
   - G1. Keep cap checks at least 30 ms from the cap (50, 150, 250 and 600 ms).
   - G2. Detect a removed pre-intro frame by holding fonts until first paint + 50 ms and + 100 ms.
   - G3. Run load checks under `no-store` and under no cache header.
   - G4. Every movement check runs until at least 500 ms after `endedAt`.
   - G5. A verifier writes only in its own temp folder; afterwards the coordinator checks `git status` in every
     worktree involved.
5. **Claude Design** is paused (2026-10-02). It stays available for open visual questions; its output is reference
   until built in Eclipse's files.
