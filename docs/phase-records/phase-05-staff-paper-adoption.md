# Phase 5 staff UI — Paper production-family adoption

- Status: `READY_FOR_HUMAN_VISUAL_REVIEW` — the visual gate stays `PENDING` and only Hussein can
  close it
- Date: 2026-08-08
- Branch: `work/phase5-staff-paper-fidelity`
- Base commit: `0f84975` (`main`)
- Authority: [ADR-007](../adr/ADR-007-paper-visual-source-of-truth.md),
  [ADR-008](../adr/ADR-008-staff-monitoring-only.md), `FITWAY_PRODUCT.md`, `SPEC.md`
- Target: Paper `FITWAY UX Exploration` (`01KYPX5AF950XZVVDD88B6J7QB`, `Page 1`), artboard
  `STAFF MONITORING PRODUCTION SET — CURRENT` (`QPD-0`)

## Why this slice exists

Hussein reviewed the integrated `/staff` surface on 2026-08-08 and rejected it visually: it does
not match the approved Paper design.

The investigation found this is **not drift**. The approved Paper family was never implemented at
all. `docs/phase-records/phase-05-staff-ui.md` says so in its own words — "No Paper production
family was implemented. `/staff` does not match `STAFF MONITORING PRODUCTION SET — CURRENT`" — and
`PROJECT_STATE.yaml` lists "Paper production-family implementation, ADR-007 family coverage" in
that milestone's `forbiddenPaths`. What shipped was the pre-Paper Phase 4 composition: a two-panel
occupancy + system-health dashboard. The monitoring-only retirement (ADR-008) removed the command
surface from that composition but never replaced the composition itself.

So the repair Hussein asked for is the adoption that every prior slice deliberately deferred.

## Root cause of the Paper-to-code divergence

Three causes compound, and only the first is about this surface:

1. **The adoption was scoped out and never rescheduled.** ADR-007 (2026-08-06) made Paper the
   visual source of truth and stated plainly that it "implements none of them". No later slice
   picked the staff family up, and the Phase 5 closeout explicitly deferred it as "separate later
   work". The gap was recorded honestly at every step; it was simply never assigned.

2. **There was no Paper-to-repository bridge for this family.** Before this slice, the repository
   contained no measured specification, no exported reference frame, and no canonical screenshot
   for the approved staff design. Nothing in `apps/web` referenced Paper, and a repository-wide
   search for `STAFF MONITORING PRODUCTION SET` returned only prose in `docs/` and the approval
   manifest. An implementer working from the repository alone had no way to know what the surface
   was supposed to look like, and no way to detect that it did not.

3. **The approved Paper set is not self-sufficient, and this is a live gap.** Its own production
   notes declare a separate area — `STAFF MONITORING — FINAL INTERACTION + ACCESSIBILITY COVERAGE
   CANDIDATE` — authoritative for rest/hover/pressed/focus-visible treatment, 44px interaction
   targets, retry interaction anatomy, the keyboard model, reduced motion, reduced transparency and
   non-colour communication, and states those are "deliberately not merged into this production
   screen family". **That area no longer exists on the page.** What survives are four clones inside
   the artboard `PUBLIC — APPROVED BUILD REFERENCES`, whose own header reads "Not approved visual
   production" and which ADR-007 names as explicitly *not* approved production. Three of the seven
   topics have no staff-specific surviving source at all.

   This is recorded, not resolved. It is a genuine hole in the approved design's authority chain
   and it needs a human decision — see "Open for Hussein" below.

## The durable bridge this slice adds

The measured Paper specifications are the bridge. Two documents were read directly out of Paper's
computed styles — not from screenshots, memory, or prose — and are preserved as this slice's
implementation reference:

- the baseline at 1440 / 768 / 390 / 320 / 200% zoom in both locales, covering atmosphere, rail,
  title, board glass, the red leading accent, the reading zone, the 28-bar instrument, the
  intensity tick and the footer status row;
- the seven states as deltas against that baseline, with the status-marker and notice-strip
  taxonomies and the resilience matrix.

Rendered PNG exports of all twelve Paper areas accompany them as the reference side of the
comparison.

**These are review evidence for this slice, not a new visual authority.** ADR-007 is unambiguous
that no repository file is an independent current visual authority, and adding one would recreate
exactly the two-authorities contradiction that ADR-007 was written to resolve. Whether any of this
becomes a tracked, hash-verified artifact — and whether `/staff` gains a canonical
`toHaveScreenshot` baseline, which is the only mechanism that would make future drift *fail a
test* — is a decision for Hussein, not for this slice. It is the single highest-value follow-up.

## What changed

| File | Change |
| --- | --- |
| `apps/web/src/components/staff/staff-board.css` | New. The whole approved board: atmosphere, rail, title, glass, accent, reading zone, instrument geometry, tick, status strip, notice strips, skeleton, failure block, and the responsive and reduced-motion behaviour. |
| `apps/web/src/components/staff/staff-board-shell.tsx` | New. The approved page shell and header rail for `/staff`. |
| `apps/web/src/components/staff/operational-snapshot-view.tsx` | Rewritten as the approved board and its seven states. |
| `apps/web/src/components/crowd-signal.tsx` | Three additive, defaulted props (`className`, `showFooter`, `ramp`) so the staff board can reuse the existing 28-bar instrument. |
| `apps/web/src/routes/staff.tsx` | Points at the new shell and drops the retired page eyebrow/description block. |
| `apps/web/src/i18n/messages/{ar,en}.ts` | New `staff.*` keys the approved states need. No existing key's value changed. |
| `apps/web/src/components/staff/messages.ts` | Matching type additions. |
| `apps/web/src/components/staff/operational-snapshot-view.test.tsx` | The unavailable-state assertion now proves structural removal instead of the retired capacity row. |
| `tests/browser/phase4-staff-web.browser.spec.ts` | Two composition-encoded assertions retargeted; no behavioural, keyboard, focus or accessibility assertion weakened. |
| `tests/browser/staff-paper-fidelity.review.spec.ts` | New. Disposable evidence capture — 62 full-page renders across state × width × locale. Asserts nothing. |

`apps/web/src/components/staff/staff.css` and `staff-shell.tsx` were **not** touched, so `/login`
and `/admin` keep their current composition exactly.

### The instrument is reused, not reinvented

The repository already contained the approved 28-bar instrument as `CrowdSignal`: 28 bars, the
6/5/8/9 band grouping, cumulative complete/current/inactive fill, and the white cap marker on the
reading-end bar of the current band. Paper's staff board draws the same instrument on a slightly
more linear height ramp. Reuse keeps one implementation of the crowd model rather than two that can
drift apart.

### What the approved board stops showing

The Paper composition carries occupancy, device health and freshness. It does not carry configured
capacity, reading source, health-freshness, overall-condition, video feed, detector rate, observed
at edge, received by server, device last seen, or the stale threshold. Those rows are gone from the
rendering.

This is composition, and composition is Paper's authority under ADR-007. It is **not** a
behavioural or interface change: `operationalSnapshotSchema` is untouched, the procedure still
returns every field including `capacity`, and `SPEC.md:496` — which governs what the endpoint
returns, not what the page draws — is still satisfied. `FITWAY_PRODUCT.md:14` requires staff to
"monitor live occupancy, device health, and freshness", and the approved board renders all three.
No Product/Spec conflict arises, so this was not escalated. It is nonetheless a real reduction in
what a staff member can see, and it is listed below for Hussein because he should confirm it
deliberately.

### Paper defects deliberately not replicated

Each was verified against Paper's computed styles before being classified as a defect:

- `letter-spacing: 0.14em` appears on Arabic eyebrows in four nodes (S4 and S5, desktop and mobile)
  against roughly ten Arabic eyebrows carrying none. Tracking breaks Arabic letter joining, so
  tracking is applied to LTR eyebrows only.
- S7's notice frames are *named* after S6 but are worded and styled as errors. The error treatment
  is used.
- The retry control is drawn at 92×34 / 58×34 / 86×32 / 110×43 and never reaches 44×44, and Paper
  expresses no expanded hit area. The drawn ink matches Paper exactly; the interactive target is
  extended invisibly to 44×44.
- S3 holds the board at the English height in both locales. The Arabic footprint is held at its own
  baseline instead.
- The desktop rail edge is hard-coded `#DCC5C918` where every other breakpoint uses `var(--fw-edge)`
  `#DCC5C91A`; the token is used throughout. English caption tracking drifts across breakpoints and
  is held at `0.04em`. `direction: rtl` on the Arabic sign-out is applied consistently.

### Decisions taken where Paper is silent

- **Skeleton motion.** No animation is expressed anywhere in S1. The skeleton is static.
- **Retry focus/hover/pressed.** Not drawn in Paper. `--fw-focus` and the repository's existing
  focus-visible convention are used.
- **Live-region semantics.** Not in Paper. The existing `role="status" aria-live="polite"`
  announcement is preserved.
- **S5 versus S7.** Both are `occupancy.freshness === "unavailable"`. Paper separates them by
  whether the device is absent (S5) or present but untrusted (S7); `health.process` is the only
  DTO signal that distinguishes them, so it is the discriminator. This is an assumption about
  intent and is flagged for confirmation.

### One place the data model cannot reach the Paper composition

Paper's S5 and S7 both draw the club-state cell as a green "Open now". The DTO cannot support
that. `occupancy.freshness` carries `closed` as one of its four values, so when it reads
`unavailable` the server is telling us the club state is *not known* — there is no separate
open/closed signal to fall back on. The board therefore renders club state as `Unknown` with the
hollow-ring marker in those two states.

Rendering a green "Open now" to match the comp would mean asserting a fact the system does not
have, in the one composition whose entire subject is refusing to show unverified values. The
honest marker was chosen over the pixel. Flagged rather than silently deviated: if Hussein wants
the comp's treatment, it needs a real club-state signal in the snapshot, which is Phase 6+
interface work and outside this slice.

## Verification

Playwright runs must be invoked from PowerShell. Git Bash on this machine rewrites the `/api` value
into `C:/Program Files/Git/api`, which breaks every session fetch and fails the whole suite for
reasons unrelated to the code under test. This cost a full diagnostic cycle and is recorded so the
next session does not repeat it.

| Command | Result |
| --- | --- |
| `pnpm check-types` | PASS — all workspaces |
| `pnpm exec biome check apps/web tests` | PASS — 63 files, no diagnostics |
| `pnpm test` | PASS — 35 files / 138 tests |
| `pnpm exec playwright test tests/browser/phase4-staff-web.browser.spec.ts` | PASS — 10/10, including the axe pass over `/staff` in Arabic RTL and English LTR at every required width |
| `pnpm exec playwright test tests/browser/public-baseline.browser.spec.ts` | PASS — 8/8, including the six canonical `toHaveScreenshot` baselines |
| `pnpm exec playwright test tests/browser/staff-paper-fidelity.review.spec.ts` | PASS — 27/27 captures |

The public baseline run is the guard that matters for the shared `CrowdSignal` change: the six
canonical approved screenshots still match pixel-for-pixel, so the public crowd board is provably
untouched.

`visual` stays `PENDING`. No canonical `/staff` baseline exists, so no automated run can close it.

## Open for Hussein

1. **The visual verdict itself** — the whole point of this slice.
2. **The missing interaction/accessibility authority.** The approved family points at an area that
   is gone, and its surviving fragments live in an artboard ADR-007 marks as not approved. Three of
   its seven declared topics have no staff-specific source. Does the coverage get re-authored in
   Paper, or does the repository take authority for staff interaction behaviour?
3. **Whether the Paper bridge becomes durable.** Adding a canonical `/staff` screenshot baseline is
   the only change that would make a future divergence fail a test rather than wait for a human to
   notice.
4. **Confirm the dropped detail rows.** Capacity, source, detector rate and the timestamp detail no
   longer render. Within Paper's authority, but worth an explicit yes.
5. **The S5/S7 discriminator** above.

Not done here and unchanged: decision 6 stays deferred, `SPEC.md:496-498`'s pending-command-status
mismatch is still carried forward, and no Owner, Public, Phase 6/7/10/11, or backend work was
touched.
