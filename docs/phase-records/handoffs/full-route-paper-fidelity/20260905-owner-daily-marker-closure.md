# Owner Daily marker closure — 2026-09-05 (bounded fidelity slice)

Human-approved scope: CLOSE OPEN-A (paint-level marker/curve junction) and OPEN-B
(stale mixed-generation evidence) only. Navigation, header, chart behavior, wider
composition, and all other Owner surfaces are CLOSED and untouched by this slice.
No canonical promotion. REJECTED_R05 not used as authority anywhere.

Scope note: this worktree stacks several prior uncommitted slices (chart repair,
annotation/nav, marker geometry, shell/reporting/access repairs with their own
handoffs). This slice's own source delta is ONLY the four items below plus the
fresh evidence package; every other working-tree modification predates it (all
were already present in `git status` before this slice began) and is outside its
authority. `PROJECT_STATE.yaml` and `AUTHORITY_MANIFEST.yaml` were already
modified before this slice and are not touched by it.

Paper authority: `FITWAY UX Exploration / Page 1 /
OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT` (area `I89-0`).
Accepted treatment: the red curve meets the highlighted marker at the OUTER ring
boundary; no paint continues toward the inner core.

## Root cause (why the 09-07 trim still rendered the defect)

The 09-07 repair trimmed the line's geometric centerline to the marker ellipse,
but not its paint:

- `.owner-chart__line` uses `stroke-linecap: round`: a path ending exactly on the
  edge paints ~1.25px past the endpoint along the path — into the ring.
- Trimmed sides were re-run through the full smoother, so the synthetic exit
  segment could bow sideways off its radial ray, dipping further inside.
- The active stem (`stroke-linecap: round`) likewise capped ~0.75px into the ring.
- Tests asserted centerline clearance only, so they passed while pixels intruded.
  Global `box-sizing: border-box` was verified present — the radius math was
  never the cause.

## Fix (this slice's own delta — four files only)

- `apps/web/src/components/owner/owner-analytics-view.tsx`
  - `smoothPath` gains `straightTip: "none" | "start" | "end"` (default `"none"`,
    all existing callers unchanged): the tip segment of a trimmed side is drawn
    as a straight radial `L`, all other segments keep the accepted bounded
    smoothing. No observation moves; the bounded truthful-curve deviation holds.
  - Trimmed sides render `smoothPath(left, "end")` / `smoothPath(right, "start")`
    with new class `owner-chart__line--trimmed`. With a straight radial approach
    and a butt cap, the flat paint edge abuts the outer boundary exactly —
    end-segment corners fall outside the ellipse, so no inset gap was needed.
- `apps/web/src/components/owner/owner-analytics.css`
  - `.owner-chart__line--trimmed { stroke-linecap: butt; }` (untrimmed runs keep
    round caps); `.owner-chart__stem` round cap changed to butt (gap stems keep
    round caps; only the active stem uses this class).
- `apps/web/src/components/owner/owner-analytics-view.test.tsx`: 13/13 pass —
  new straight-tip unit test plus rendered assertions (butt-cap class, left ends
  with `L`, right opens `M..L`).
- `tests/browser/phase9-owner-ui.browser.spec.ts`: first (governing) test gains
  paint-level assertions — computed `stroke-linecap: butt` on both trimmed sides
  and stem, straight-tip `d` shapes — alongside the existing clearance checks.

## Verification (this slice)

| Check | Result |
| --- | --- |
| Unit `owner-analytics-view.test.tsx` | 13/13 pass |
| `pnpm --filter web check-types` (build + tsc) | pass |
| Biome on 4 touched files | clean |
| `phase9-owner-ui` browser (`marker_closure_verify`) | 6 passed; 1 failed = intentional frozen-REJECTED_R05 canonical mismatch (unchanged posture, no promotion authorized) |
| `phase11-shell` browser (`marker_closure_shell`) | 6 passed; 1 failed = approved Variant B `.owner-rail` delta awaiting promotion (unchanged posture) |
| Evidence run (`marker_closure_evidence`, temp spec removed after pass) | 1/1 pass, incl. in-run junction guard (butt caps + centerline clearance) |
| Live paint-tip probe (`marker_closure_probe`, temp spec removed after pass) | 1/1 pass: trimmed tip endpoints abut the MEASURED outer ring edge within ±0.4px (AR left +0.40 / right −0.39, EN left +0.38 / right −0.39 vs 10px radius; tip-segment midpoints ~76px outside); butt caps confirmed, so no paint extends past the edge toward the core |

## Attribution of pre-existing worktree state (not this slice)

- `AUTHORITY_MANIFEST.yaml` routed-daily bytes/sha were refreshed by the prior
  09-07 marker-geometry slice; this slice required no further manifest edit
  because regenerated `routed-daily-*` bytes/sha256 are identical to the
  registered entries (verified in `review-20260905-marker-closure/FILES.json`:
  en-1440 `b1f8a0e2…`, ar-1440 `93606488…`, en-390 `03c4293b…`, ar-390
  `720e5328…`). The completed pristine peak is a lone reading with no trimmed
  sides, so full-page bytes are unaffected by a paint-level trim fix.
- `PROJECT_STATE.yaml` modification predates this slice (coordinator-owned;
  untouched here).
- All other modified/untracked files in `git status` belong to the stacked
  prior slices and their handoffs, not to this slice.

## Fresh evidence (OPEN-B closed)

One internally consistent package, all from run `marker_closure_evidence` on HEAD
`e20453d` + this slice (source hashes in the index header):

- `visual-direction-gate/approved/paper-route-authority-20260902/evidence/owner-daily/review-20260905-marker-closure/`
  - `index.html` (contact sheet, 24 routed captures + Paper frame pairings)
  - `FILES.json` (bytes + sha256 for all 24 review files + the 4 refreshed routed files)
  - `completed/latest/selected × {ar,en} × {1440,390}` full pages + `*-closeup-*`
    ring close-ups (12 + 12)
- `evidence/owner-daily/routed-daily-{ar,en}-{1440,390}.png` refreshed in place;
  bytes/sha256 are identical to the already-registered manifest entries
  (completed pristine peak is a lone reading with no trimmed sides, so full-page
  bytes are unchanged by a paint-level trim fix) — no further manifest edit by
  this slice (see attribution section).
- All earlier `owner-analytics-*`, `chart-repair-*`, `chart-marker-*`,
  `chart-annotations-*`, `marker-geometry-*` captures are superseded for
  judgment purposes (left in place; deletion is a separate cleanup concern).

## Open: human visual approval of the review package

Open `visual-direction-gate/approved/paper-route-authority-20260902/evidence/owner-daily/review-20260905-marker-closure/index.html`
and judge the 12 close-ups against Paper `I89-0` (`ID9-0/IOF-0`, `IB4-0/IMA-0`,
`IGK-0/IRQ-0`, `J5M-0/JE1-0`, `J3Q-0/JC5-0`, `J87-0/JGM-0`).
After approval, the standing sequence resumes: serialized canonical promotion +
accepted-case mapping, clean `verify:full`, final independent verification, DONE.
