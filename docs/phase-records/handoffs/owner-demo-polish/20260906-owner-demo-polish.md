# Owner demo polish candidate — 6 September 2026

Status: DONE for the bounded local candidate. Starting commit: `1fc2301a2f351d95f92aedb7ae8d8fe4d10e4941`, verified on `codex/owner-demo-prep`. The commit containing this record is the candidate (`SELF` in the ledger means this branch only), for local human review. No main merge or push occurred.

The human explicitly requested implementation and rendered judgment, excluded `fitway-paper-workflow`, and made Paper reference-only for this task. Paper and canonical baselines were not changed. This record does not supersede historical acceptance or claim new Paper approval.

## Repairs

- Daily uses exact clock-aligned half-hour observations for overview interaction, with sparse shape-preserving curves. Exact run/global peaks, zero boundaries, settings-version boundaries, and missing/closed breaks remain. Secondary half-hour extrema become geometry anchors when their prominence exceeds both bounding observations by at least two people or 5% of the day's peak. This presentation tolerance does not cap, average, or rewrite values; every original minute remains in the detail table. Short isolated recordings retain fallback selection stops. Pointer selection stays inside the observed run.
- Mouse hover clears on leave/cancel. Keyboard and explicit pointer selection persist independently; Escape clears selection. Explicit selection clears stale hover precedence. Tiny interruptions use five-unit endpoint ticks, pointing inward at zero. At 15 minutes, outages gain persistent desktop stems, brackets, and duration; mobile keeps restrained marks and exact details.
- Daily coverage moved out of primary metrics into the detail disclosure. Total entries shows the busiest entry hour from real observations. A daily prior-week comparison is unavailable in the DTO, so none was invented. A live business day continuing after midnight retains its latest-reading treatment.
- Reports, Activity Log, and System Status interiors and headers share translucent Owner materials. Settings uses the same Owner atmosphere. Reports prioritizes its heatmap/readout, keeps compact range controls, and places functional CSV export in a disclosure.
- Removed procedural, owner-only, horizontal-scroll, and implementation-heavy copy while retaining warnings, states, controls, and data tables.
- Public count placement, accent fill, glow removal, and card edge now follow Staff. Public's 28-bar categorical signal and capacity-free content remain. Staff received only six pixels of additional breathing room below the large crowd state.
- Native audit selects sit inside an eight-pixel optical inset at their arrow end. The real select, native chevron, labels, keyboard behavior, and focus treatment remain; no custom combobox was introduced.

## Verification

- Web TypeScript: PASS.
- Eight focused component test files: 98 tests PASS (Daily, reporting, audit, health, settings, Public states, Staff snapshot).
- Five focused repository Playwright tests: PASS. Historical timezone/RTL-LTR parity, half-hour hover/leave/persistent selection, zero-gap marks, 15-minute outage annotation, responsive/axe checks, keyboard order, reduced motion, and 200% reflow.
- Independent read-only review found secondary-peak and zero-gap edge cases; both were fixed and the reviewer found no unresolved correctness issue. Main session reviewed the executed results and rendered screenshots.
- Arabic evidence covers 1920, 1440, 1024, 768, 390, and 320 pixels across the changed Owner and Public/Staff surfaces. Representative English captures cover 1440, 390, and 320 pixels. Main session compared the older supplied video and personally inspected before/after screenshots and the running browser.
- Local evidence: `output/playwright/owner_polish_r01/` (ignored). `before/`, `pass1/`, `pass2/`, and `final/` record iterations; the final Daily refinement and English/live interactions are under `live-check/`. Only final settled captures establish the candidate presentation; earlier/loading captures are diagnostic history. No canonical screenshot baselines were promoted.

The final live walkthrough passed: Settings draft/discard without saving, native-select keyboard selection and audit filter/clear, heatmap arrow navigation and range apply, CSV preparation followed by successful download, and Public/Staff English counterparts. All five Owner pages passed the serious/critical axe threshold; there was no page overflow at the checked English widths. No JavaScript page errors or demo developer overlays were found. Actual headed/maximized browser viewport: 2048×1018 CSS pixels (2048×1104 available screen), no overflow; personally inspected. Arabic desktop screenshots also cover 1920×1000 and 1440×1000; 1024/768 use 1000px height and 390/320 use 844px height.

The browser regression pass corrected an obsolete touch coordinate that targeted a closed minute, then exposed and fixed stale hover taking precedence over explicit selection. The final five-test run passed. Live capture harness corrections selected the visible discard button, the real heatmap buttons, and the separate CSV download action; these were harness assumptions, not changes to product behavior. Earlier transition/loading captures were replaced with settled Reports/Audit captures. Repository-state validation was repeated after releasing the in-progress lease through terminal candidate closure.

Final demo status: Postgres, server, web, and simulator are running; owned processes verified and both endpoints ready. No genuine residual blocker remains before the human's visual review.

## Scope and review

Accounts & Sign-in structure, six Owner destinations, the launcher fix, hidden developer overlays, Staff operational content, raw observations, routes, permissions, schemas, and the FITWAY identity remain protected. No settings were saved; synthetic demo credentials were used only for authorized local authentication, not written into evidence. The existing demo was not reset.

Broader integration suites and canonical visual gates were not reopened: this task is a bounded frontend repair with explicit human instructions for focused verification and no Paper changes. Human review should judge the actual running candidate, especially the deliberately sparse Daily presentation. Demo review URL: `http://localhost:3101/admin`; Public `/`; Staff `/staff`.
