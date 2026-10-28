<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

## Out of Scope

Everything in RESEARCH.md §16's scope fence, reaffirmed, plus items settled during this
spec:

- **Trend indicator** — deferred; a null slot is reserved in the payload so adding it
  later is non-breaking. A noisy arrow would undermine the honesty principle.
- **Light theme** — dark-only v1 (recorded 2026-07-11); tokens stay semantic so a light
  theme is a value-override later.
- **Multi-gym/SaaS, predictions, floor headcount, snapshots, WebSockets/SSE, face/identity
  anything, native apps, visitor accounts, bookings, payments, push notifications,
  capacity/owner alerts, turnstile-pulse cross-check, managed fleet updates** — per
  RESEARCH.md §16.
- **Deployment execution** — Supabase project provisioning/region/pooling, Vercel spend
  caps and cron plan verification, domain purchase, secrets placement: pre-deploy gates
  (RESEARCH.md §11), deliberately not part of this spec's build scope.
- **CV pipeline internals** — detector/tracker selection, ROI/line calibration, Windows
  packaging specifics: blocked on the site-check gates (RESEARCH.md §18); only the cloud
  contract and lifecycle requirements are specced.
- **Phase/slice planning** — a separate step after this spec.
- **Email delivery** (password reset mail, etc.) — owner/maintainer reset flow avoids the
  dependency in v1.
- **Turborepo** — not justified at current workspace size (ADR-001).

## Open Questions

None block repository completion; all are external gates or deploy-time choices:

- Real capacity and band thresholds — measured on site; admin-configurable regardless.
- Site-check gates (RESEARCH.md §18): camera/RTSP access, exit-path geometry, edge PC
  capability, remote access, actual hours vs. Google (esp. Friday), timezone confirmation.
- Owner sign-off items: transparency notice wording, remote maintenance/calibration
  acknowledgment, maintenance scope.
- Domain / final URL host (paths are fixed by this spec; the host is not).
- Vercel plan's cron cadence and Supabase tier/pausing/backups/pooling — pre-deploy
  verification (RESEARCH.md §11).
- Pilot target values — adopted provisionally above; confirm with the owner at pilot
  kickoff and record any adjustment in this file.

Repository implementation resolved the two formerly open mechanism choices without changing the
product contract: charts are purpose-built accessible React/SVG/semantic-table components, and
localization uses typed in-repository Arabic/English message catalogs.

## Further Notes

- **Honesty is a requirement, not a tone.** Every surface that shows a number must identify
  it as approximate, carry its freshness, and carry its state. Approved Arabic public copy
  uses the explicit «داخل الصالة الآن · تقريبًا» label instead of `حوالي` or a person unit; a
  confidently wrong page is a spec violation, not a style issue (RESEARCH.md §4).
- **The governing cost rule** — compute scales with time/cache windows, never visitor
  count (RESEARCH.md §9) — is an acceptance criterion here, not advice: any
  visitor-reachable path that invokes a function per request on cache hit is a defect.
- The repository hierarchy is defined in `AGENTS.md`. Product and Spec are co-authoritative
  within their named domains. If they overlap and disagree, mark `NEEDS_HUMAN`; do not silently
  choose one. `RESEARCH.md`, ADRs, archived plans, mockups, and prototypes preserve rationale
  and provenance but cannot override Product/Spec.
