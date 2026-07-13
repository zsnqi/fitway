# FITWAY VDG-0 Functional Baseline

These screenshots preserve the Phase 3 public page's behavior and information hierarchy before visual-direction exploration. They are evidence, not an approved design, visual reference, or visual north star.

## Capture environment

- Captured: 2026-07-13
- Source: local production build of `apps/web`, served by Vite Preview at `http://127.0.0.1:4173/`; the capture build used `VITE_SERVER_URL=http://127.0.0.1:4173/api` solely to keep the intercepted fixture response same-origin
- Runtime: Node `24.14.0`, pnpm `11.9.0`
- Browser: Headless Chrome `150.0.0.0` on Windows via `agent-browser 0.31.1`
- Screenshot mode: exact viewport, not full page
- Device pixel ratio: 1
- Color scheme: dark
- Locale: explicitly seeded per scenario (`fitway.locale`)
- Clock: frozen per scenario before application code ran
- Data: the public occupancy request was intercepted in the browser and fulfilled with the strict payload below
- Database: not started, read, or modified
- Fonts: capture waited for `document.fonts.ready`, confirmed the computed body family included Cairo, and checked the locale-relevant self-hosted Cairo 400/700 faces used by the evidence text
- Readiness: capture waited for the intended localized state, complete image loading, zero active CSS animations/transitions, and stable layout
- Overflow: `documentElement` and `body` scroll dimensions were checked against their client dimensions before every capture

The production application code was not changed. The capture harness was temporary and external to the built app: a pre-navigation clock/locale init script plus browser-level network interception. It was removed after capture.

## Deterministic fixture set

All timestamps are canonical UTC instants. Displayed times are formatted in `Asia/Riyadh` (`UTC+03:00`). `37/100`, `37%`, and all other values are capture fixtures only—not measurements or claims about Fitway.

### `live`

- Frozen clock: `2026-07-17T12:00:00.000Z` — Friday 3:00 PM Riyadh
- Last update: `2026-07-17T11:59:30.000Z` — 30 seconds earlier
- Fresh until: `2026-07-17T12:01:00.000Z`
- Facts: open, fresh, Moderate, count `37`, percent `37`, source `edge`

```json
{"schemaVersion":1,"freshness":"fresh","timeZone":"Asia/Riyadh","band":"moderate","count":37,"percentFull":37,"lastUpdatedAt":"2026-07-17T11:59:30.000Z","freshUntil":"2026-07-17T12:01:00.000Z","source":"edge","computedAt":"2026-07-17T12:00:00.000Z","trend":null}
```

### `closed`

- Frozen clock: `2026-07-16T23:00:00.000Z` — Friday 2:00 AM Riyadh
- Next opening: `2026-07-17T11:00:00.000Z` — Friday 2:00 PM Riyadh
- Facts: closed; no count, percentage, meter, source, freshness timestamp, or band

```json
{"schemaVersion":1,"freshness":"closed","timeZone":"Asia/Riyadh","nextOpenAt":"2026-07-17T11:00:00.000Z","computedAt":"2026-07-16T23:00:00.000Z","trend":null}
```

### `stale`

- Frozen clock: `2026-07-17T12:05:00.000Z` — Friday 3:05 PM Riyadh
- Last-known update: `2026-07-17T12:00:00.000Z` — five minutes earlier
- Fresh-until boundary: `2026-07-17T12:01:30.000Z`
- Facts: open, visibly stale, Moderate, last-known count `37`, last-known percent `37`, source `edge`

```json
{"schemaVersion":1,"freshness":"stale","timeZone":"Asia/Riyadh","band":"moderate","count":37,"percentFull":37,"lastUpdatedAt":"2026-07-17T12:00:00.000Z","freshUntil":"2026-07-17T12:01:30.000Z","source":"edge","computedAt":"2026-07-17T12:05:00.000Z","trend":null}
```

### `unavailable`

- Frozen clock: `2026-07-17T12:10:00.000Z` — Friday 3:10 PM Riyadh
- Facts: unavailable; no count, percentage, meter, band, source, or fabricated last-update timestamp

`computedAt` is required contract metadata and is never displayed as a last-update claim.

```json
{"schemaVersion":1,"freshness":"unavailable","computedAt":"2026-07-17T12:10:00.000Z","trend":null}
```

## Screenshot matrix

| File | Fixture | Locale / direction | Viewport |
| --- | --- | --- | --- |
| `public-live-desktop.png` | `live` | Arabic / RTL | 1440×900 |
| `public-closed-desktop.png` | `closed` | Arabic / RTL | 1440×900 |
| `public-stale-desktop.png` | `stale` | Arabic / RTL | 1440×900 |
| `public-unavailable-desktop.png` | `unavailable` | Arabic / RTL | 1440×900 |
| `public-live-mobile.png` | `live` | Arabic / RTL | 390×844 |
| `public-closed-mobile.png` | `closed` | Arabic / RTL | 390×844 |
| `english-ltr.png` | `live` | English / LTR | 1440×900 |

## Reproduction procedure

1. Build with a capture-only same-origin API base: in PowerShell set `$env:VITE_SERVER_URL = 'http://127.0.0.1:4173/api'`, run `pnpm --filter web build`, then remove the environment variable. This changes only the disposable build output, not source behavior.
2. Serve the built frontend with `pnpm --filter web serve --host 127.0.0.1 --port 4173`.
3. Launch a clean Chromium context at DPR 1 and set the exact matrix viewport.
4. Before navigation, freeze `Date` at the scenario clock and seed `fitway.locale` to `ar` or `en`.
5. Intercept `**/public/occupancy` and return the exact strict JSON fixture above. Do not use the database.
6. Navigate to `/`, wait for the intended state and `document.fonts.ready`, confirm all images are complete and no loading skeleton remains.
7. Confirm locale/direction, Western digits, expected count/meter presence or absence, and no document or body overflow.
8. Capture the viewport only. Verify the PNG is exactly the expected pixel dimensions and visually inspect it at native size.

## Known non-blocking issue

The self-hosted Cairo files currently cover weights 400, 500, 600, and 700 only. UI roles requesting 800/900 are browser-synthesized. This does not block VDG-0 evidence, but must be resolved or deliberately remapped during VDG-B before visual acceptance.
