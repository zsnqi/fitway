# Presentation-ready validation r07

Status: DONE. The exact preserved `d35fbd3` dirty candidate and its accepted r06
canonical reconciliation pass the full executable ladder, independent review,
and the final authenticated live presentation rehearsal.

## Changed hypothesis and frozen scope

r06 proved the remaining visual failure is neither product geometry nor a stale
baseline. The byte-untouched Owner shell canonical passed in isolated and
registered runs, while the corrected eight-worker full ladder reproduced the
same historical 126-pixel delta solely around the 24px downscaled official PNG
logo. Font readiness and locator stability do not prove image decode and final
paint settlement.

r07 therefore owns only a red-capable repeated concurrent reproduction and, if
confirmed, the minimum shell-test wait for the existing logo image to be decoded
and painted before capture. It may not alter application source, the logo asset,
Paper, canonical bytes, visual mappings, product behavior, privacy/security/data
semantics, authentication, deployment, credentials, or demo data.

## Entry evidence

- r06 registered route gate: 632 unit/component, 120 simulator, and 142 routed
  browser/accessibility/visual tests passed with a clean mutation guard.
- r06 corrected full gate: invariants, Biome, types, 632 unit tests, 120 simulator
  tests, both builds, and 133 integration tests passed. Browser result was 147
  passed, 3 intentionally live-only skipped, and the one concurrent shell
  screenshot failure described above.
- Exact expected/actual/diff/trace evidence is retained under
  `output/playwright/presentation_r06_full2/test-results/phase11-shell.browser-cano-6cd37-sh-shell-compositions-match-chromium/`.
- Fresh repair budget: 0/2.

## Repair 1 and focused evidence

`presentation_r07_shell_concurrency_red` ran the exact shell canonical 16 times
with eight workers. Fifteen passed and one reproduced the identical 126-pixel
Arabic desktop logo-edge delta, establishing a red-capable concurrency loop.

Repair 1 adds one test-only `settleOwnerBrand` helper. It awaits the existing
official image's `decode()` promise and two animation frames before each shell
capture. It changes no DOM, CSS, asset, product behavior, baseline, tolerance,
or screenshot options. Focused Biome passed and the unchanged 16-run/eight-worker
loop `presentation_r07_shell_concurrency_green` passed 16/16 under normal
snapshot assertions. Repair budget is now 1/2.

## Fresh full gate

`presentation_r07_full` used the explicitly named disposable database
`fitway_integration_presentation_r07_full` and passed the complete ladder:

- repository invariants and Biome passed; Biome retained only the two inherited,
  non-fatal reporting specificity warnings;
- types passed;
- 632 unit/component tests and 120 simulator tests passed;
- both production builds passed;
- 133 disposable-Postgres integration tests passed;
- 148 browser, accessibility, and visual tests passed, with the three intentional
  credential-gated live-demo tests skipped; and
- the final repository mutation guard passed.

The passing run covered the exact candidate after Repair 1. No product source,
canonical PNG, tolerance, mapping, or asset changed in r07.

## Independent final review

A fresh read-only reviewer inspected the complete working-tree candidate across
Owner and Staff behavior, reporting, schedules, Settings conflict handling, demo
seed/simulator/API paths, privacy and stale-data semantics, bilingual RTL/LTR and
accessibility behavior, the test-only shell settlement, and the promoted
canonical evidence. Verdict: PASS, with no actionable findings. The reviewer
explicitly resolved its only suspected Settings discard/refetch edge: a failed
refetch leaves the section in its error state and does not present stale draft as
resolved.

The reviewer's own targeted Vitest/type reruns could not spawn under its Windows
read-only sandbox. That is a reviewer-environment limitation, not a candidate
failure: the frozen candidate's fresh full gate above supplies the executed test,
type, integration, browser, accessibility, and visual evidence.

## Repair 2 and authenticated live rehearsal

The already-running loopback demo remains reachable. Its Public English surface
was rechecked at 06:26 +03 as open, fresh, and changing with a synthetic count of
31. This final runtime had also been rehearsed in Arabic and English, and
anonymous `/staff` and `/admin` navigation correctly redirected to `/login`.

The human operator then supplied the temporary synthetic credentials for direct
use through the existing secure PowerShell prompts. The first authenticated
`pnpm demo:verify` run passed Public and Staff authentication/authorization, then
found a genuine stale Owner Activity Log test oracle: the rendered accessibility
tree contained the populated table inside a region named `Activity records`, but
the test searched for a table carrying that name. The UI was English, the table
and all eight seeded rows were present, and the name correctly belonged to the
scroll region, so this was neither locale drift, delayed rendering, nor a product
accessibility failure.

Repair 2 changes only `tests/browser/desktop-demo.browser.spec.ts` to locate the
named `Activity records` region and then its nested table. It changes no product,
authentication, fixture, visual baseline, or accessibility semantics. Focused
Biome passed. The repeated secure `pnpm demo:verify` then passed all three tests
in 7.3 seconds and printed `Demo API, authentication, authorization, and live
browser proof passed.` The rehearsal exercised:

- fresh anonymous Public and the protected Staff redirect;
- real Staff PIN authentication, populated monitoring, absence of Management
  navigation, and server-enforced denial of Owner access;
- real Owner password authentication;
- populated Daily and Reports, including the weekday/hour view;
- Accounts & Sign-in with the synthetic Owner identity and Staff PIN model;
- Activity Log with bootstrap, correction, reset, settings, and Arabic fixture
  records;
- System Status; and
- Settings.

The same independent reviewer inspected this exact final delta against the
rendered accessibility structure and returned PASS with no findings: scoping the
table through its named region fixes the nonexistent-name assumption without
weakening the content assertions. Repair budget is terminal at 2/2. No credential
was written to a command, file, URL, trace, or report.

All r07 gates are now complete and the milestone is DONE. Any future candidate
write requires affected verification and review to be reconsidered.
