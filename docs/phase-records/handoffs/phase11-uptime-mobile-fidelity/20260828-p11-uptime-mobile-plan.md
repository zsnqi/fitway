# Phase 11 Uptime mobile fidelity — frozen implementation plan

Status: PLAN_READY; the coordinator adopted the completed read-only discovery/specification at clean frontier `f07f5d9e82c12bc216b10f4360b79dd6c9c32e5a`. The ledger remains `PLANNED` until the current propagation writer releases its one-writer lease. The four planned source/test SHA-256 values were rechecked and remain identical to the original clean `901983b25e8deadaca825c47cd5d426d8998aff5` planning freeze. No repository source, Paper, server, test, or database mutation occurred during planning.

## Objective

At 320–720px, render every offline period and incident as an auto-height vertical record card matching accepted Paper successor 1DZC-0, with every existing field, record, state word, Western digit, and bilingual value preserved. At 721px+, preserve the current table composition exactly. Observable success is no document or record horizontal overflow, no clipping/truncation/removal, accurate visible/total counts, correct RTL/LTR lanes, and unchanged desktop/canonical behavior.

## Authority and locked boundaries

- PROJECT_STATE.yaml says phase11-uptime-paper-successor: DONE and phase11-uptime-mobile-fidelity: PLANNED; dependencies are DONE and owned paths cover only Owner Health UI/tests/phase records.
- Accepted source: Paper file 01KYPX5AF950XZVVDD88B6J7QB, successor 1DZC-0; original 1AUL-0 remains preserved. Token content hash: 3b0faca3.
- Binding handoff: docs/phase-records/handoffs/phase11-uptime-paper-successor/20260825-003100-p11_uptime_paper_c01-coordinator-done.md (SHA-256 73D122C527D109CF34AC5519E0D2AA913A61D1376EAFC5D0E571CA8BAAD9E2D8).
- Locked: API/data semantics, visible copy, existing actions, loading/error/empty/unmonitored behavior, metrics, footnote, shell, tokens, hooks, message catalogs, and desktop composition. A shared desktop rule requires proof and fresh regression evidence; otherwise stop.

## Writable implementation scope

Only these four tracked files may change:

1. apps/web/src/components/owner/health/owner-health-view.tsx
2. apps/web/src/components/owner/health/owner-health.css
3. apps/web/src/components/owner/health/owner-health-section.tsx
4. tests/browser/phase11-health.browser.spec.ts

GLM must not write canonical PNGs, messages.ts, hooks, API/server/schema/router files, tokens, root config/lockfiles, ledger, handoffs, or normative documents. Coordinator-only records and canonical promotion happen after the source writer releases its lease.

## Source implementation

### Stage A — mobile record primitive (GLM-5.3-Flash/high, exact two-file lease)

Files: owner-health-view.tsx, owner-health.css.

- Keep the real table, thead, scopes, row attributes, bdi isolation, region name/tab stop, and desktop DOM path.
- Add localized mobile field-label spans from existing message keys, marked aria-hidden, plus a mobile-only board header capable of receiving visible/total counts. Do not add or rewrite strings.
- Inside existing max-width:720px media, visually hide but retain the semantic header; make tbody a 12px-padded vertical stack with 12px gaps; each tr becomes an auto-height 12px-radius group card with 16px padding and 10px field gaps; each td becomes a logical two-lane field.
- At 390px reproduce 358/356/332/300px board/inner/card/field widths and 124/164px label/value lanes with a 12px gap. Below 390px allow the label lane to contract and values to wrap. Never hardcode card height.
- Mobile type: labels 13px/18px weight 500, values 14px/20px weight 500, unresolved weight 600; use existing tokens. Arabic inherits RTL and logical start/end so label/value lanes reflect without reversing records or fields.
- Mobile scroll hint becomes hidden and the region has no actual horizontal overflow. Existing focus visibility remains. All 721px+ table rules remain byte-for-byte effective.

Rollback: revert the Stage A commit; it touches only the two primitive files.

Parent gate before Stage B: review the complete diff, confirm only the two allowed hashes changed, run git diff --check, the existing Owner Health component test, and web type-check. Any new copy, fixed record height, desktop selector change, lost table semantics, unisolated bidi value, or out-of-scope file is rejection.

### Stage B — accurate counts and executable regression contract (GLM-5.3-Flash/high, exact two-file lease)

Files: owner-health-section.tsx, tests/browser/phase11-health.browser.spec.ts.

- Pass offlinePeriodCount / incidentCount into the record views so the mobile board header renders exact visible/total counts, including bounded/truncated payloads. Reuse existing locale words/numbers; do not invent copy. Preserve the existing shown x of y line behavior.
- Extend the current browser spec, not a new file. At each of 320, 360, 390, 721, 768, 820, 1024, 1200, 1440 in Arabic and English:
  - <=720: offline has 3 cards × 4 labeled fields; incidents has 2 cards × 5 labeled fields; counts are accurate; cards/collections are auto-height; scrollWidth <= clientWidth; all values remain reachable and untruncated.
  - >=721: table header/row display, sticky header, labeled focusable region, column order, and desktop density remain unchanged.
  - Arabic: RTL direction, Western digits, semantic record/field order, correct unresolved/closed-only/delivery wording, and coherent bidi time/duration runs.
- Keep state, timezone, request-count, sibling-route, forced-colors, reduced-motion, 200% reflow, axe, keyboard and existing canonical assertions. Do not update snapshots.

Rollback: revert the Stage B commit; Stage A remains an isolated card primitive, and the branch is not eligible for integration until Stage B is restored and green.

## GLM route and controls

Delegation trigger is economy: deterministic low-consequence presentation code from a frozen native spec, with exact file and command allowlists and native parent gates. GLM-5.3-Flash/high is the preferred external source writer. Its missing Paper/Browser qualification is irrelevant to writing because it receives this frozen text spec and performs no Paper, image, Browser, server, test, or database work.

The current registry formally qualifies supervised low-consequence single-file implementation; a fresh synthetic exact two-file producer/consumer write passed but did not promote the registry. Therefore each two-file stage is a prospective bounded capability expansion, not assumed authority. Activation must run live preflight/resolver against baseline 2026-08-28.2, cite docs/phase-records/handoffs/coordinator/20260828-glm-5.3-flash-authorization.md, enforce exact read/write/command allowlists, one writer, no commit, compact sentinel/fingerprint validation, and native diff review. If the resolver refuses the two-file shape, split A and B into sequential one-file GLM invocations with a native gate after each; do not exclude GLM merely because native keeps visual verification. DeepSeek V4 Pro has no material advantage for this deterministic low-consequence write. Terra/Luna require fresh one-shot approval; Sol remains native visual/verifier authority.

Escalate rather than improvise on product copy, breakpoint, semantic-table loss, desktop changes, fixed heights, new dependencies, or any fifth source file.

## Native verification and acceptance

Native owns every executable and visual gate after the GLM writer releases its lease.

1. Freeze checks: git diff --check, repository check, format/lint, web type-check, focused component test. Confirm diff is exactly the four paths and baseline source hashes matched before writing.
2. Browser functional pass with a unique FITWAY_RUN_ID: the complete existing tests/browser/phase11-health.browser.spec.ts, including all nine widths, both locales, states, keyboard/focus, forced colors, reduced motion, 200% reflow, axe, timezone and no page overflow. Inspect computed card/field widths at 390 and contraction/wrapping at 320/360.
3. Paper fidelity: compare live 390 English and Arabic mobile renders to accepted successor; compare 1440 English and Arabic to the preserved desktop source. Required membership: vertical fit-content collections, 3×4 offline and 2×5 incident completeness, 13/18 labels, 14/20 values, 332px cards at 390, coherent Arabic bidi, no scroll/clipping/removal.
4. Canonicals: before promotion, the existing Arabic 1440 canonical must still match exactly; the English 390 assertion is expected to report the intentional mobile delta. Generate candidate/review images only in the run-specific output. After explicit human/coordinator approval, update only owner-health-en-mobile-390x844.png; reject if the Arabic desktop PNG or any unrelated baseline changes. Rerun canonical assertions without update.
5. Run pnpm verify:fast, then FITWAY_PHASE=phase11-health pnpm verify:phase, then pnpm verify:full using unique run IDs/disposable resources. Confirm tracked status is unchanged except the approved source/test files, coordinator records, and one approved mobile canonical.
6. Fresh independent native review is read-only and repeats source, Browser, a11y, RTL/LTR, Paper, desktop and canonical gates. Reviewer never repairs.

Coverage matrix required in the final record: 320/360/390 mobile, 721/768/820 tablet boundary, 1024/1200/1440 desktop; Arabic RTL; English LTR; 200% zoom/reflow; keyboard/focus; screen-reader table/header/field names; reduced motion; forced colors; no document/record overflow. Gaps are failures, not implicit passes.

## Repair budget, risk, and stop rules

Prospective validation repairs: 0/2. One focused correction per rejected native gate; the third recurrence is FAILED_VALIDATION. A material Paper departure, locked copy/action/data change, unleased shared path, privacy/security ambiguity, or need for a fifth source file is NEEDS_HUMAN.

Primary risks: CSS table-to-card semantics in assistive technology; Arabic bdi alignment/order; inaccurate counts when API totals exceed returned rows; a mobile rule leaking into 721px+; canonical promotion masking desktop drift. Mitigations are retained semantic headers/scopes, decorative mobile labels, real totals from the section, max-width:720px, all-nine-width bilingual checks, and coordinator-only one-file baseline promotion.

## Out of scope

No Paper edit, redesign, new state/action/copy, server/API/schema/data work, global tokens, unrelated UI, deployment, push, or database change. This plan does not mark the milestone DONE; only integrated, independently verified evidence can do that.

