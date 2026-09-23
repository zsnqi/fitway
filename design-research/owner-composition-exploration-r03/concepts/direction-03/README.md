# Direction 03 — The Instrument Deck

**Status:** Owner composition exploration only. This static, deterministic design concept is neither accepted visual authority nor production implementation.

## Thesis

The Owner workspace behaves like a compact operational instrument. A broad current-state cockpit leads Daily; observed periods are discrete readings, with gaps drawn as gaps rather than interpolated zeros. Reports is a governance matrix with an immediate day × hour reading rather than a form stack. The six destinations live in one anchored, floating instrument dock. Its active position provides orientation while leaving the working area wide.

This direction keeps FITWAY's dark graphite, oxblood, vivid red, and restrained glass character, but changes hierarchy and materials: the readout has one decisive numerical focal point, secondary metrics sit as telemetry, and the report matrix carries the entire page. Glass is limited to the anchored navigation and top rail, where depth separates persistent controls from scrolling work. The page background is static.

## Interaction and color grammar

- Navigation uses one authored 1.7px stroke icon family. The selected section is solid FITWAY red; inactive routes are neutral and gain a muted rose hover. No semantic state is conveyed by icon color alone.
- The current open state uses a square mint indicator plus text. Amber marks the static sample warning, never an actual live feed. Red carries observed occupancy intensity and active selection. Dashed neutral hatching marks missing data; dim solid bars mark future periods.
- Daily period bands can be selected by pointer, touch, or keyboard. The selected band gets a red edge and a textual explanation. Reports cells expose a localized accessible name, selected outline, and adjacent detail. A semantic values table remains available for assistive technology and can be revealed visually.
- The sample CSV control only shows local feedback; it does not export, mutate settings, or connect to any account.
- Hover, active press, and section changes use short, property-specific transitions. Current data, static atmosphere, and charts at rest never animate. Reduced-motion preference removes transition duration.

## Extension across the remaining Owner destinations

- **Access:** Use the cockpit's two-zone hierarchy for credential status and bounded actions, with routine provision/rotate controls separated from destructive deactivation. A one-time PIN reveal remains its own protected flow.
- **Activity log:** Use a dense event ledger; one mobile record shows time, action, actor role, and target together. Filters are disclosed after the first record rather than occupying the opening screen.
- **Operations:** Present uptime, observation coverage, and alert delivery as three independently labeled instruments. Missing observations never become an inferred outage.
- **Settings:** Group business hours, crowd bands, and technical timing as distinct work trays. Each tray keeps save/discard beside the affected controls and preserves the existing time semantics.

Those four destinations are navigation and composition notes in this slice; their production workflows are not implemented here.

## Data truth and scope

All values and dates are deterministic synthetic examples. The labels on desktop and mobile state that this is a static sample, not a live feed. The 75% coverage figure describes illustrative expected minute readings through 15:07; the period tiles summarize only six selected readings each and are not the coverage denominator. The 59 estimated entries are entrance crossings, not unique members. The Reports matrix has 39 observed and 3 missing cells; missing is not zero. No visitor identity, image, frame, biometric, or per-visitor record is present or transmitted.

For future full-surface work, the readout must switch content by actual state: loading uses a labeled skeleton; fresh uses an explicitly current observation; stale shows last-known value and time; closed or unavailable hides occupancy and crowd band; error drops retained readings and provides focused retry. This concept renders only a static open sample. Real route, export, access, schedule, audit, analytics, and API behavior remains governed by Product and Spec.

## Accessibility and limits

The concept uses Cairo at actual 400/600/700 weights, Arabic RTL and English LTR with Western digits; native buttons, headings, landmarks, a skip link, visible focus, text labels for state, and reduced motion. Matrix cells are at least 44px tall on mobile. The six-item mobile dock remains visible and the document scrolls beneath it with bottom padding; controls lower on Reports are reachable by scrolling. This is an early visual comparison, not a fully verified seven-surface product. It has no live data or authenticated behavior.

## Preview and evidence

From the repository root, run: node design-research/owner-composition-exploration-r03/concepts/direction-03/preview.mjs

Then open: http://127.0.0.1:3113/design-research/owner-composition-exploration-r03/concepts/direction-03/index.html

Query parameters lang=en|ar and section=daily|reports|access|activity|operations|settings select a state. The capture.playwright.txt function snippet captures eight exact viewport frames through the isolated Playwright CLI run-code command; verify.playwright.txt checks interactions, reflow, and reduced motion the same way. These snippets intentionally use a text extension because the repository JavaScript formatter appends a statement terminator that is invalid when the CLI wraps a function expression. The evidence files name Daily and Reports in EN/AR at 1440×900 and 390×844. They are concept review evidence, not canonical screenshots or acceptance authority.
