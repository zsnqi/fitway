# The Evidence Line / خط الدليل

**Concept only.** This is one unselected Owner composition direction for r02. It changes no production route, copy, data contract, token, canonical, Paper artifact, or visual authority.

## Visual world

A training floor's single, continuous readout: near-black wall, FITWAY red as an active line, warm light on the text, and no repeated boxed dashboard tiles. The page reads like a calm evidence register. A long horizontal boundary separates *what can be said about now* from *what was recorded today*. The chart is an open field within that same surface, not a competing card. Governance moves to quiet disclosure rows after orientation.

The first viewport states the schedule state and the current-reading trust status in words. The bold headline is intentionally factual. Red carries identity and chart emphasis; unavailable, closed, loading, error, and missing history each have distinct text and non-color cues. English and Arabic receive natural word order; the historical curve runs left-to-right in English and right-to-left in Arabic.

## Data boundary and fixtures

The default **Recorded day** fixture models `admin.analytics.daily` as historical business-day buckets. It provides observed minutes, coverage, a historical peak, and a missing interval. It provides **no current snapshot and no freshness**. The default first glance therefore says current crowd unknown, despite a populated trend.

The schedule label comes from a separate, explicit *sample schedule* fixture. It is never inferred from a Daily Analytics bucket. **Separate snapshot** is an optional demonstration of a distinct sample `staff.operationalSnapshot` at fixture clock 21:15, observed 21:14, with approximate count 42 and Moderate band. It is labeled illustrative and is not a real live reading. The chart remains historical in that state.

Other fixture choices are **Closed**, **No readings**, **Loading**, and **Error**. Closed hides count and band; no readings does not become zero; loading shows no claimed state; error does not carry a historical value forward. Every state is available through the preview select in either language and can be linked with `?lang=en|ar&state=...`.

The six chart slots are illustrative hourly samples, not a full minute-level Daily Analytics payload. Coverage (240/300 observed open minutes) is a separate fixture summary, so the sparse plotted points must not be read as its calculation. The table disclosure gives the same slot values and missing/closed labels as the chart.

## Interaction and adaptation

The native state select keeps a wrapper-owned chevron and reserved logical padding in both directions. Locale switch, section links, chart points, and disclosures are keyboard reachable. Hover, focus, and tap can select the same historical point. Motion is limited to short disclosure-chevron feedback and is removed under reduced motion.

Desktop uses an asymmetric state/trust split and a broad time field. The 721–820 range stacks state and trust while keeping the day summary readable. Mobile turns the day summary into a vertical ledger and switches the chart to a 320-unit viewBox so labels remain readable instead of shrinking with a 720-unit desktop SVG. The 320px/200% reflow capture places preview controls on their own row.

## Review and limits

Run `node capture.mjs` from the repository root to refresh `frame-manifest.json` and the `frames/` captures. The manifest records the exact 1440×900 and 390×844 EN/AR populated frames, full mobile frames, alternate-state frames, required width checks, and 320-effective-width/200% zoom checks. The local browser file uses repository Cairo font assets by relative URL.

This preview does not implement Owner routing, real API fetching, server authorization, live polling, export, or production data semantics. It is a visual proposal for explicit human comparison and later perceptual review, not an accepted baseline.
