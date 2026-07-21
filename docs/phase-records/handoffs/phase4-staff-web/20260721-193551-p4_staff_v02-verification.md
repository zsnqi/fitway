# phase4-staff-web independent verification

- Status: `VERIFIED_READY_FOR_INTEGRATION`
- Verdict: `PASS` — no defect, contract violation, or scope breach found; candidate not modified
- Verifier: fresh independent session (did not implement the candidate); run ID `p4_staff_v02`
  (distinct from worker `p4_staff_b02` and the worker-reported verifier `p4_staff_v01`; no
  prior validation result was relied on)
- Candidate commit: `fb0e88635c37b7fa80fe9cced94ca699f6ede440` (tip of
  `work/phase4-staff-web-b02`, containing implementation commits
  `cf569453fe563f5e4124a3cbe4ed695db82cd685` and
  `ba584b94dace00a29816c6d496b038c376e4522e`)
- Base: integrated baseline `f043611a4bfa9f208b06e51c90aa54affeb87d34` via renewed activation
  `219c2e836256dcf6684fb2ebdd57b0f1df8b6f8e` (verified `HEAD~3` = renewed activation,
  `HEAD~4` = superseded activation `bf06c8842b84a5ed539722acfd16998aabb9e373`,
  `HEAD~5` = integrated baseline — matching both launch handoffs)
- Worktree/branch clean at review start and after every check; lease
  `2026-07-23T18:45:00+03:00` valid at review time (2026-07-21T19:29+03:00)
- Verified: 2026-07-21T19:35:51+03:00
- Not marked `DONE`; not pushed; coordinator integration and `pnpm verify:full` remain pending

## Scope and ownership review

- `git diff 219c2e8..fb0e886` touches exactly 18 files: the owned paths
  (`routes/login.tsx` replaced, new `routes/staff.tsx`, `routes/admin.tsx`,
  `routes/_auth/-session.ts`, new `components/staff/**` with a colocated component test,
  `lib/auth-client.ts` replaced, new `hooks/use-staff-messages.ts` and
  `hooks/use-staff-operational-snapshot.ts`, new
  `tests/browser/phase4-staff-web.browser.spec.ts`, the candidate handoff) plus
  `components/sign-in-form.tsx` deleted, and exactly two exclusive leases used for their
  stated purposes: `i18n/messages/ar.ts`/`en.ts` (staff-web catalog additions only) and
  `index.css` (VIS-001 CSS-only atmosphere softening only).
- No commit in the range touches any forbidden path: server/API/auth/db/env packages, public
  `index.tsx`/`main.tsx`/`utils/orpc.ts`, existing browser specs, canonical
  `tests/browser/__screenshots__/**` (byte-unchanged), `edge/**`, root manifests/lockfiles,
  `scripts/**`, `visual-direction-gate/**`, or `PROJECT_STATE.yaml`. No new dependency. The
  unused leases (`__root.tsx`, `public-atmosphere.tsx`, `packages/ui`) are untouched.
  `routeTree.gen.ts` is git-ignored and untracked.
- Scaffold removal is complete: `sign-in-form.tsx` deleted and zero residual
  Better Auth / `signIn` / `signUp` / token-storage / `document.cookie` references remain in
  `apps/web/src` (the only `localStorage` uses are the pre-existing locale persistence the
  product permits).

## Contract review findings (SPEC.md 384–457 and 528–536, ADR-002, FITWAY_PRODUCT.md, DESIGN_GUIDE.md, approved manifest, polish backlog)

1. **Auth flow** — `auth-client.ts` uses exactly the frozen endpoints
   `POST /api/auth/staff/pin`, `GET /api/auth/session`, `POST /api/auth/logout` with
   `credentials: "include"`; the session is the server's HttpOnly cookie only — no token or
   PIN is stored, logged, or placed in a URL anywhere in the slice. The PIN input accepts
   only Western digits (`normalizeWesternPin` strips everything else, capped at 12;
   `isValidStaffPin` enforces `^[0-9]{6,12}$`), renders as `type="password"` with
   `inputMode="numeric"` and `dir="ltr"`. `401` maps to one non-enumerating localized
   message; `429` honors `Retry-After` (fallback 30 s), disables submission for the
   countdown, and keeps the `role="alert"` announcement stable while a separate internal
   timer ticks — the worker's hardening commit `ba584b9` is verified in code and by the
   browser regression.
2. **Session/guard semantics** — `routes/_auth/-session.ts` treats only `401` as
   "no session"; other failures propagate as errors. `/login` redirects an authenticated
   session to `/staff`; `/staff` requires a session (`401` → `/login` replace) and also
   redirects when the snapshot poll returns `401`. `/admin` consumes the typed
   `admin.session` owner leaf: `401` → `/login`, `403` → localized staff denial with a
   back-to-operations action, owner → shell placeholder. Guards are redirect-only UX; the
   server remains the authority (auth packages consumed read-only, per ADR-002).
3. **Snapshot integration** — `/staff` consumes the typed `staff.operationalSnapshot` oRPC
   leaf through `useQuery` (30 s poll, no retry). The UI renders the server-evaluated
   freshness/condition verbatim and computes nothing itself. The error branch is checked
   **before** cached data, so a failed background refresh replaces previously live values
   with the distinct transport-error state (`role="alert"`, one retry action) and never
   renders the domain `unavailable` state — verified in code and by the dedicated browser
   test (success followed by `503` removes the count).
4. **State truth** — fresh/stale render band + count + gym-timezone update time; stale adds
   an amber last-known badge and warning and never claims live; closed removes count/band
   and shows the next opening; unavailable removes count/band with an honest explanation;
   loading is a static skeleton with `aria-busy` and a polite announcement. Occupancy count
   and band are omitted for closed/unavailable snapshots. Capacity and the exact ten-field
   frozen health block (`freshness`, `condition`, `process`, `camera`, `feed`,
   `detectorFps`, `edgeObservedAt`, `receivedAt`, `lastSeenAt`, `staleAt`) appear only on
   this authenticated surface; no public file changed.
5. **Fixture conformance** — the browser spec mocks only at the HTTP boundary
   (`/api/auth/*`, `/rpc/*`). All four snapshot fixtures conform field-for-field to the
   strict `operationalSnapshotSchema` and the strict discriminated public occupancy union
   (fresh/stale usable shape, closed shape with `nextOpenAt`, bare unavailable shape),
   with canonical ISO timestamps; the session envelope matches the canonical auth context.
   No invented field, no scaffold shape. No `toHaveScreenshot` canonical baseline was added;
   curated evidence goes only to the run review directory.
6. **i18n/RTL** — all copy lives in the leased ar/en catalogs (`staffWeb` export typed by
   the owned `StaffWebMessages` contract); no hard-coded UI string. Both catalogs wrap every
   dynamic numeric/time interpolation in FSI/PDI bidi isolates, and the view additionally
   uses `<bdi>` for values. Western digits come from the pre-existing
   `ar-SA-u-nu-latn`/`en-SA-u-nu-latn` locale config; Arabic time renders `ص/م`, English
   `AM/PM`, in the payload's gym timezone. English copy is naturally composed, not mirrored.
7. **Visual boundaries** — the `index.css` diff replaces the sharp `clip-path` atmosphere
   polygon with heavily blurred radial gradients (blur 62–72 px), CSS-only and static: this
   is precisely the VIS-001 acceptance boundary ("softly blurred, naturally positioned
   depth… not a sharp geometric block"). `staff.css` uses the approved tokens, logical
   properties, safe-area insets, `100vh→100svh→100dvh` fallbacks, no `@keyframes`, no
   `transition: all`, no fixed `min-height` slabs (VIS-004 content-adaptive), and a
   `prefers-reduced-motion` damp. Focus visibility is inherited from the pre-existing
   global `packages/ui` rule (`box-shadow: var(--fw-shadow-focus)`) and asserted via
   computed style in the browser spec.

Non-blocking observations (no action required):

- `staff.css` introduces one literal accent `#ff8295` for 12 px uppercase eyebrow captions
  and decorative icons. `--fw-red` at that size on the dark surfaces measures ≈4.0:1
  (below AA for normal text) while `#ff8295` measures ≈7.9:1; this is accessibility-driven
  judgment inside the guide's alias allowance, not an identity change.
- A failed logout re-enables the button silently without an error message; the session
  remains intact server-side and a retry is available, so this is cosmetic.

## Fresh verification run (run-owned resources)

Environment: `FITWAY_RUN_ID=p4_staff_v02`, Playwright port `18416` (verified free before
and released after), run-owned output/report/review directories under
`output/playwright/p4_staff_v02`, `VITE_SERVER_URL=/api`, and the `p4_staff_v02` database
env trio (the phase profile registers no integration files, so the disposable database was
never touched). `pnpm install --frozen-lockfile` — up to date. Pre-run `git status --short`
recorded clean.

- `pnpm verify:phase --phase phase4-staff-web` → **PASS** (exit 0)
  - Repository invariants: PASS (29 milestones, 8 canonical approval screenshots)
  - Biome check: PASS (176 files)
  - Type checks: PASS (all packages, including `apps/web` vite production build + tsc)
  - Unit/component tests: PASS — 26 files, 111 tests
  - Python simulator tests: PASS — 3 tests
  - Phase 4 staff web browser tests: PASS — Chromium 10/10 on port `18416`
  - Repository mutation guard: PASS (`git status --short` and `git diff` empty after the
    run; canonical screenshots byte-unchanged)

## Browser / accessibility / visual evidence (independently produced and inspected)

The fresh run produced 12 review images under `output/playwright/p4_staff_v02/review`; every
image was directly inspected against `DESIGN_GUIDE.md` and the approved staff reference
(`staff-live-ar-desktop-1440x900.png`, future-route-reference-only):

- **AR live 1440/768/390** — approved identity retained: global header discipline,
  red-edged reading panel correctly mirrored to the inline-start in RTL, crowd level
  dominant over the count, capacity/source/schema meta row, green live signals, Western
  digits, `5:59 م` gym time. Tablet and mobile recompose into stacked content-adaptive
  panels with no collision or overflow. The reference's correction/reset tools are Phase 5
  scope and correctly absent; the reference's `37%` capacity copy is superseded provenance
  and correctly not reproduced.
- **EN live 1440** — naturally composed LTR (not a mechanical mirror), `5:59 PM`,
  red edge on the left.
- **Stale** — amber last-known badge, warning banner, amber health marks; cannot be read
  as live. **Unavailable** — neutral badge, count/band removed, health fields honestly
  `غير متاح` with the independently known last-seen time retained. **Closed** — no
  reading, next opening `8:00 م` (correct Riyadh conversion of the fixture).
  **Loading** — static skeleton, no fabricated values. **Transport error** — distinct
  red-edged alert with one retry and no retained reading, visually and semantically
  separate from `unavailable`. **Admin 403** — localized staff denial with return action.
  **Admin owner** — owner shell placeholder.
- Browser tests additionally proved: Western-digit-only PIN filtering (`12a٣34-56` →
  `123456`), non-enumerating failure, `Retry-After` disable, login→staff→logout round trips
  in both locales, document-overflow-free rendering at 320/360/390/721/768/820/1024/1200/
  1440, axe serious+critical = 0 in both directions, skip-link focus transfer, keyboard
  order, computed-style focus visibility, ≥44 px targets, reduced motion, and 200% reflow.
- The interactive in-app Browser had no attached session (same discovery result as the
  worker run); per `AGENTS.md`, repository Playwright plus direct image inspection supplied
  the repeatable functional and visual evidence.

## Gate summary

| Gate | Result |
| --- | --- |
| Unit/component | PASS |
| Biome/types/build | PASS |
| Integration | NOT_REQUIRED (profile registers no integration files) |
| Browser functional (AR RTL + EN LTR) | PASS |
| Accessibility (automated + manual semantics) | PASS |
| Visual review vs approved system | PASS |
| Repository non-mutation | PASS |
| Scope/ownership/lease/privacy review | PASS |
| Independent review | PASS (this record) |

## Next step

Coordinator integration per `docs/WORKFLOW.md`: inspect candidate history, reconcile shared
files, run `pnpm verify:full`, record the integrated commit, release leases, update the
`VIS-001`/`VIS-004` backlog rows with this evidence, and declare `DONE`. This record does
not change any state in `PROJECT_STATE.yaml` and nothing has been pushed.
