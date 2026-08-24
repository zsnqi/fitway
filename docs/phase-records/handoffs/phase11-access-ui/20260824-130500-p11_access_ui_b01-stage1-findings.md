# Slice B stage 1 — surface investigation: findings and parent gate

Milestone `phase11-access-ui`, run `p11_access_ui_b01`, stage 1 (read-only surface investigation).
Branch `work/phase11-access-ui-b01`, base `abb371a`, tree clean before and after.

## Route and execution

Route decision: `docs/phase-records/route-decisions/p11_access_ui_b01-investigation.json`.
Selected `deepseek-v4-pro` on `opencode-go/deepseek-v4-pro`, control `high`, transport `opencode-cli`,
registry `2026-08-23.9`. Session `ses_fccccf1d3ffeC39J93QR8ZK5Y7`, exit 0, 86 events (43 tool_use,
one final text event of 18,895 characters carrying the `END-OF-MAP` sentinel, so no truncation).
Raw event capture stayed outside the orchestrator transcript.

The route was resolved by `scripts/resolve-opencode-worker.mjs` from a stage input recorded before
any target-file reading, with zero delegation-lifecycle violations. `ox-alpha` — which the active
availability_economic temporary preference would otherwise promote — was filtered by its own
conditional hard constraint because this stage declared `long_structured_return_is_material`.
**That judgement was vindicated by the outcome:** the return needed 18,895 characters, more than
double the 9,161 of the `p11_browser_debt_b01` stage-1 return that declined the same flag, and the
recorded `ox-alpha` failure mode is finalization truncation on exactly this shape.

`deepseek-v4-pro` and `glm-5.3` both survived every filter with no material evidence advantage in
either direction. The winner was chosen by a neutral deterministic rule (lexicographic ascending
`candidate_id`) under the human routing instruction of 2026-08-24, which forbids falling back to a
native subagent merely because qualified external candidates tie. It is not a preference claim.

## Parent gate: PASS

Read-only boundary held: `git status --porcelain` is byte-identical before and after
(`d9e0bff01ca21ad57d677a393409d200`), HEAD unchanged at `abb371a`, and the only untracked path is
this slice's own route-decision record. The worker wrote nothing and ran no command.

Return contract held: no file contents, no directory listings, no search narration; every structural
claim carries a `file:line` pointer; the completeness statement topic 3 required is present and
explicit; two items are self-flagged `UNCONFIRMED` rather than asserted.

Load-bearing claims checked against the repository, not against the report:

| Claim | Verdict |
|---|---|
| `AccessRuleCode` union is a single definition site at `packages/auth/src/access.ts:35-45` with exactly 10 members | **CONFIRMED** verbatim |
| No second definition site repo-wide | **CONFIRMED** — the only non-test hits outside the union are throw sites in `apps/server/src/access-repository.ts` |
| `staff_pin_shape` is converted to a server fault at the generator seam and is not owner-provokable | **CONFIRMED** — `apps/server/src/access-service.ts:74-100`, whose comment independently says "correct for the nine refusals an owner can actually provoke, and wrong for this one" |
| `admin.tsx` mounts the three daily sections unconditionally as a bare fragment | **CONFIRMED** — `apps/web/src/routes/admin.tsx:70-76` |
| No existing browser spec stubs `**/rpc/admin/access/**` | **CONFIRMED** — zero hits for `admin/access` across `tests/browser/` |
| Canonical baselines are exactly two per section, `<section>-<locale>-<viewport>-<WxH>.png` | **CONFIRMED** — the audit subtree holds exactly `owner-audit-ar-desktop-1440x900.png` and `owner-audit-en-mobile-390x844.png` |

No correction reverses a finding.

## Coordinator finding: a durable record is wrong, and it is one I wrote

The worker refused a premise in its own brief, and it was right to. The brief carried, from the
activation record `20260823-234500-p11_access_ui_b01-activation.md` and the `abb371a` commit message,
the claim that `page.clock.install()/pauseAt/fastForward` has **three worked examples** in
`phase2.browser.spec.ts`, `phase3.browser.spec.ts` and `phase10-ui-csv.browser.spec.ts`.

Checked directly: `tests/browser/phase10-ui-csv.browser.spec.ts` contains **zero** occurrences of
`page.clock`. The worker caught that. Completing what it did not find: the only other
`page.clock` user in the repository is `tests/browser/public-baseline.browser.spec.ts:39`, and it
uses `setFixedTime`, a different and simpler API than the install/pauseAt/fastForward idiom.

**Corrected fact: there are two worked examples of the install/pauseAt/fastForward pattern, not
three — `phase2.browser.spec.ts` and `phase3.browser.spec.ts`.** This matters to stage 5, which the
activation record points at those examples for the deterministic-wait technique that replaces the
falsified timeout repair. The activation record is preserved unedited as the record of what was
believed at activation; this document is the correction, and stage 5's brief must carry it.

## Verified surface map

Everything below is the worker's return, retained as the stage deliverable. It has passed the gate
above. The `page.clock` grouping inside topic 4 is superseded by the coordinator finding above.

---

# p11_access_ui_b01 — surface investigation map

## 1. Owner-section mount

`apps/web/src/routes/admin.tsx` is a TanStack file-route (`createFileRoute("/admin")`). `beforeLoad` calls `client.admin.session()` (`admin.tsx:16-26`); a 401 redirects to `/login` (`admin.tsx:22`), a 403 returns `adminAccess: "forbidden"` (`admin.tsx:23`). The body renders `<OwnerShell>` wrapping `<main id="operations-main" tabIndex={-1}>` (`admin.tsx:36-41`), with a `forbidden` branch and an allowed branch (`admin.tsx:42-81`).

Allowed branch is `OwnerAnalyticsModeSwitch` with two tabs (`admin.tsx:62-80`): the `daily` fragment mounts the three always-on sections in order — `<OwnerAnalyticsPage />`, `<OwnerAuditSection />`, `<OwnerHealthSection />` (`admin.tsx:72-74`); `history` renders `<OwnerReportingSection prerequisite={prerequisite} />` (`admin.tsx:77-79`).

`OwnerShell` (`components/owner/owner-shell.tsx`) contributes chrome only, no section registration: the skip link to `#operations-main` (`owner-shell.tsx:29-31`), the fixed rail header with logout + locale toggle (`owner-shell.tsx:35-57`), a two-link nav to `/staff` and `/admin` (`owner-shell.tsx:59-74`), and the brand (`owner-shell.tsx:76-86`). There is no per-section anchor/id convention; the only anchor is `main#operations-main`.

**Minimal mount edit shape:** add one import next to `OwnerAuditSection`/`OwnerHealthSection` (`admin.tsx:5-6`) and add one JSX element, e.g. `<OwnerAccessSection />`, inside the `daily` fragment (`admin.tsx:71-75`). No nav, no registration, no shell change.

**Section conventions a new section must supply:** it renders its own `<section className="owner-…" aria-labelledby={headingId}>` with an `<h2 id={headingId}>` from `useId()` (`owner-audit-section.tsx:67-69`, `owner-health-section.tsx:51-53`), and it "stands down" (returns `null`) while the shared analytics query is unresolved — audit at `owner-audit-section.tsx:64` (`unavailable || !timeZone`), health at `owner-health-section.tsx:40` (`unavailable`).

## 2. Copy and hook composition

**Audit subtree inventory** (`components/owner/audit/`): `messages.ts` (bilingual copy), `use-owner-audit-messages.ts` (locale selector), `owner-audit-section.tsx` (form + state orchestration), `owner-audit-view.tsx` (presentational: table/loading/error/empty), `owner-audit-view.test.tsx` (component test), `owner-audit.css`. Health mirrors this exactly (`health/messages.ts`, `use-owner-health-messages.ts`, `owner-health-section.tsx`, `owner-health-view.tsx`, `owner-health-view.test.tsx`, `owner-health.css`).

**Copy location/keying:** bilingual copy lives component-side in `audit/messages.ts` as `ownerAuditMessages = { en: {...}, ar: {...} } as const` (`audit/messages.ts:8-171`), with the exported type `OwnerAuditMessages` (`audit/messages.ts:173-174`). Resolution is one line — `useOwnerAuditMessages` returns `ownerAuditMessages[locale]` where `locale` comes from `useI18n()` (`use-owner-audit-messages.ts:5-8`). `useI18n` exposes `{ locale, toggleLocale }` (`i18n/provider.tsx:68-74`) and persists locale to `localStorage` under `LOCALE_STORAGE_KEY` (`provider.tsx:35`, value `fitway.locale` per browser specs). Note the audit `messages.ts` already contains access-related *action* labels (`staff_pin_provisioned` … `owner_reactivated` at `audit/messages.ts:36-43`), but these are audit-row labels, distinct from any refusal/action copy a new access section would need.

**Hook wrapping:** `hooks/use-owner-audit.ts` wraps the transport with TanStack `useInfiniteQuery` (`use-owner-audit.ts:198`), `queryKey: ["owner","audit","list", filters ?? null]` (`:199`), `queryFn` calls `client.admin.audit.list(...)` and validates the result with `auditListOutputSchema.parse(...)` (`:202-209`), `getNextPageParam: lastPage.nextCursor` (`:210`), `retry:false`, `refetchOnWindowFocus:false` (`:211-212`). It reads the gym timezone from the *shared* `useOwnerDailyAnalytics()` query rather than issuing its own time-context call (`:195-196`). Health hook is the `useQuery` analogue: `queryKey ["owner","health","summary"]`, `healthIncidentSummarySchema.parse(await client.admin.health.summary())`, `retry:false` (`use-owner-health.ts:44-51`), also gated on `useOwnerDailyAnalytics` settlement (`:43-44`). Both return a discriminated `status: "unavailable" | "pending" | "error" | "success"` and expose `retry` / (`fetchNextPage`) (`use-owner-audit.ts:165-174`, `use-owner-health.ts:9-14`).

**Hook test shape:** `use-owner-audit.test.tsx` mocks the transport with `vi.mock("@/utils/orpc", ...)` returning `client.admin = { audit: { list }, analytics: { daily, timeContext } }` (`use-owner-audit.test.tsx:13-17`), renders a `Probe` under a fresh `QueryClientProvider`, and asserts: gym-day boundary math (`:61-86`), selection→filter mapping (`:88-186`), that the timezone is read from the analytics query with exactly one `timeContext` call carrying `{ settingsVersions: [11] }` and no extra call (`:300-314`), `unavailable` until the shared zone resolves (`:316-336`), no duplicate failure (`:338-345`), bounded first page / keyset append / applied filters (`:347-393`), and that a transport failure or a schema-invalid page surfaces as `error` rather than rendering (`:395-413`).

## 3. The `admin.access` transport surface

Procedures are defined in `packages/api/src/access/procedures.ts` (`adminAccessProcedures` at `:164-177`) and mounted at `admin.access` in `packages/api/src/routers/index.ts:135`. Context wiring is `apps/server/src/index.ts:231-238` → `access-service.ts` → `access-repository.ts`.

| Procedure | Input (`contracts.ts`) | Output |
|---|---|---|
| `admin.access.list` | — | `accessListOutputSchema` `{ principals: PrincipalGovernance[] }` (`:42-45`) |
| `admin.access.staffPin.provision` | `{}` (`:79`) | `staffPinRevealOutputSchema` |
| `admin.access.staffPin.rotate` | `{}` (`:80`) | `staffPinRevealOutputSchema` |
| `admin.access.staffPin.deactivate` | `{ reason }` (`:82-84`) | `accessMutationOutputSchema` |
| `admin.access.owner.provision` | `{ email, displayName, password }` (`:89-97`) | `accessMutationOutputSchema` |
| `admin.access.owner.deactivate` | `{ targetPrincipalId, reason }` (`:100-104`) | `accessMutationOutputSchema` |
| `admin.access.owner.reactivate` | `{ targetPrincipalId }` (`:106-109`) | `accessMutationOutputSchema` |
| `admin.access.owner.resetCredential` | `{ targetPrincipalId, password }` (`:111-116`) | `accessMutationOutputSchema` |

Key shapes: `principalGovernanceSchema` (`contracts.ts:28-39`) `{ principalId:uuid, principalKind:"shared_staff"|"owner", role:"staff"|"owner", displayName, ownerEmail:nullable, active, credentialVersion:int>0|null, credentialActive:bool|null }`; `accessMutationOutputSchema` (`:54-58`) `{ auditId:int>0, principal, revokedSessions:int>=0 }`.

**Generated PIN material:** only `staffPin.provision` and `staffPin.rotate` return it, in the `revealedPin` field of `staffPinRevealOutputSchema` (`contracts.ts:69-76`), produced by `createStaffPin()` in `access-service.ts:107-129`. No read path returns a PIN (`contracts.ts:61-68` comment; `access-service.ts:29-32`).

**Typed refusals — the single definition site is the `AccessRuleCode` union at `packages/auth/src/access.ts:35-45`.** All ten members:

1. `staff_pin_shape`
2. `staff_pin_already_active`
3. `staff_pin_not_active`
4. `owner_self_deactivation`
5. `owner_last_active`
6. `owner_already_inactive`
7. `owner_already_active`
8. `owner_email_taken`
9. `not_an_owner`
10. `reason_required`

Transport mapping is unconditional: `rethrowAsTransportError` turns any `AccessRuleError` into `ORPCError("BAD_REQUEST", { data: { code } })` (`procedures.ts:34-47`), wrapped around every mutating handler by `run()` (`:49-55`). The `ownerProcedure` guard yields 401/403 for missing/staff auth (`procedures.ts:15-26`), not domain refusals.

**Named confirmations (all present):** `staff_pin_already_active` (`access.ts:37`; thrown `access-repository.ts:269,428`); `staff_pin_not_active` (`access.ts:38`; `access-repository.ts:488,535`); `owner_already_inactive` (`access.ts:41`; `access.ts:158`, and reused by the credential-reset rule at `:213` per the comment `:200-201`); duplicate-email refusal = `owner_email_taken` (`access.ts:43`; `access-repository.ts:308`); self-deactivation refusal = `owner_self_deactivation` (`access.ts:39`; `access.ts:152`); last-active-owner refusal = `owner_last_active` (`access.ts:40`; `access.ts:164`).

**Refusals beyond the named list (the valuable finding):** `staff_pin_shape`, `owner_already_active`, `not_an_owner`, and `reason_required` exist in addition to the six named above. Notably `not_an_owner` doubles as "missing principal / no credential to reset" (`access-repository.ts:627,687,744,754`), and `owner_already_active` is the reactivation refusal (`access.ts:183`). `reason_required` is belt-and-suspenders behind the input schemas (`requiredReason` at `contracts.ts:19-24`; `assertReasonPresent` at `access.ts:224-231`).

**Subtlety on `staff_pin_shape`:** it is declared but is deliberately *not* delivered to an owner as a 400. The generator seam `generateStaffPin` in `apps/server/src/access-service.ts:86-100` catches the `assertStaffPinShape` `AccessRuleError` and rethrows as a plain `Error` (server fault → 500), because "a failure is a server defect, not a caller's" (`access-service.ts:74-84`). So the refusals an owner can actually provoke are the other nine.

**Completeness statement:** 10 refusal discriminant strings, enumerated from the single definition site `packages/auth/src/access.ts:35-45`, and cross-checked against every `AccessRuleError` throw site in `packages/auth/src/access.ts` (`:77,102,146,152,158,164,177,183,207,213,226`) and `apps/server/src/access-repository.ts` (`:269,308,428,488,535,627,687,744,754`). Confident the enumeration is exhaustive — repo-wide search for the code literals finds no second definition site (only this union, its unit test, the throw sites, and the integration test assertions at `apps/server/src/phase11-access.integration.test.ts`). The one adjacent non-`AccessRuleCode` refusal class is oRPC input-schema validation from the Zod schemas in `contracts.ts`, which produces framework-generated 400 validation errors without an `AccessRuleCode`; the exact validation-error code string is framework-generated and I did not confirm it (`UNCONFIRMED`), but it is confirmed not to be an `AccessRuleCode`.

## 4. Browser-spec conventions

**Auth:** there is no shared helper file under `tests/browser/` — each spec inlines a `const ownerAuth = { principalId, principalKind:"owner", role:"owner", sessionId, expiresAt, active }` and a `mockOwner*` function that stubs `**/rpc/admin/session` with `route.fulfill({ status:200, json:{ json: ownerAuth } })` (e.g. `phase11-audit.browser.spec.ts:6-13,274-276`; identical in `phase11-health`, `phase9-owner-ui`, `phase10-ui-csv`, `phase11-shell`). Navigation is `page.goto("/admin")`. Neighbour RPCs (`analytics/daily`, `analytics/timeContext`, `audit/list`, `health/summary`) are stubbed so the section under test is isolated (see `phase11-health.browser.spec.ts:257-263` comment "The audit section is a neighbour on this route").

**Locators:** state containers use `data-` attributes — `[data-owner-audit-table]`, `[data-owner-audit-state="loading"|"empty"|"error"]` (`phase11-audit:439,538,549,557`), `[data-owner-health-metrics]`, `[data-owner-health-offline-table]` (`phase11-health:329-331`); interactive controls use roles — `getByRole("button", { name })`, `getByRole("form", { name })`, `getByLabel(...)`; section containers use the CSS class (`.owner-audit`, `.owner-health`).

**RTL/LTR:** `setLocale(page, "ar"|"en")` toggles `.owner-rail__language`, then asserts `html[lang]` and `html[dir]` (rtl vs ltr) (`phase11-audit:344-353`); Arabic additionally asserts Western digits only (`not.toMatch(/[٠-٩۰-۹]/u)`), a mirrored arrow (`←` not `→`), and computed `direction === "rtl"` on the section.

**Negative case:** in `phase9-owner-ui.browser.spec.ts:388-412` and `phase11-shell.browser.spec.ts:371-383` — unroute `**/rpc/admin/session`, re-route to 403 (`FORBIDDEN`) → assert the owner-required alert ("يلزم دخول المالك"); 401 → assert redirect to `/login` (`phase9:398-412`). Staff = 403, anonymous = 401, both driven by stubbing the session response, not by navigating differently.

**Clock pattern (`page.clock`):** `phase2.browser.spec.ts:75-116`, `phase3.browser.spec.ts:57-126`, `phase10-ui-csv.browser.spec.ts` (the task named it but this file's CSV test uses `dailyHold`/delays rather than `page.clock` — see below). Shape: `await page.clock.install(); await page.clock.pauseAt(base);` then advance with `page.clock.fastForward(ms)`, with a `base` set to `Date.now() + 60_000` because "the installed clock keeps ticking in real time until pauseAt lands" (`phase2:81-83`, `phase3:63-64`). The explanatory comment is `phase2:78-80` / `phase3:60-62`: *"The page clock is installed and paused so the 500ms fresh window is anchored to the page's own timeline: hydration cannot consume it, and the local expiry timer is fired by fastForward instead of wall-clock luck."* The load-bearing flush is the `expect.poll` whose body calls `page.clock.fastForward(0)`, with the comment `phase2:102-104` / `phase3:89-91`: *"react-query delivers its cache notifications through setTimeout(0), which the installed clock owns: each poll step flushes the timer queue so the response arrives and renders no matter how slow the machine is."* In other words the `fastForward(0)` flush is not decorative: because the fake clock now owns `setTimeout`, react-query's zero-delay cache notifications would never fire on their own, so each poll must advance the clock to drain the timer queue. (Correction to the task's grouping: I could not find `page.clock` in `phase10-ui-csv.browser.spec.ts` — it uses `dailyHold` promises and `heatmapDelayMs`; the `page.clock` idiom appears in `phase2` and `phase3` only.)

## 5. Canonical screenshot conventions

Baselines live under `tests/browser/__screenshots__/win32/chromium/<spec-name>/<name>.png`, produced by `snapshotPathTemplate: snapshotDirectory/{platform}/{projectName}/{testFilePath}/{arg}{ext}` (`playwright.config.ts:91-97`, snapshot dir `:75-78`). Confirmed files: `phase11-audit.browser.spec.ts/owner-audit-ar-desktop-1440x900.png` + `owner-audit-en-mobile-390x844.png`; same pair for `owner-health-*` and `owner-shell-*`.

**Naming:** `<section>-<locale>-<viewport>-<WxH>.png` — exactly two canonical baselines per slice: Arabic desktop `1440x900` and English mobile `390x844`. The spec-side call is scoped to the section element, not the page: `await expect(page.locator(".owner-audit")).toHaveScreenshot("owner-audit-ar-desktop-1440x900.png")` (`phase11-audit:875-877`, `phase11-health:647-649`); the shell scopes to `.owner-rail` (`phase11-shell:287-289`) with the comment that `/admin` "is designed to host a growing set of owner sections" so a full-page capture would break on every new section (`phase11-shell:281-286`).

**Stabilization/masking before snapshot:** `await page.evaluate(() => document.fonts.ready)` before each snapshot; global `toHaveScreenshot: { animations: "disabled", caret: "hide" }` (`playwright.config.ts:103-105`); device timezone is pinned away from the gym zone via CDP `Emulation.setTimezoneOverride` (`phase11-audit:336-342`); and `hideShellSkipLink` injects `.operations-skip-link { display: none !important; }` rather than a Playwright mask, because a section capture taller than the viewport would otherwise paint the shell's fixed skip link into the image (`phase11-audit:441-452`). No Playwright `mask` option is used.

## Risks

1. **Refusal-copy mapping is greenfield and under-named.** The access section must render copy for ten `AccessRuleCode` values, but the task's own checklist named only six. The four it did not name — `staff_pin_shape`, `owner_already_active`, `not_an_owner`, `reason_required` — must each resolve to bilingual copy or they ship as a bare unhandled error. Evidence: union at `packages/auth/src/access.ts:35-45`; no `access/*` UI copy file exists under `apps/web` (the only access-adjacent copy is audit-row labels at `components/owner/audit/messages.ts:36-43`).

2. **`staff_pin_shape` must not be surfaced as a typed 400.** It is a server-defect code, converted to a 500 at the generator seam (`access-service.ts:86-100`), so a UI error map that treats all ten codes uniformly would be wrong for exactly this one. Evidence: `access-service.ts:74-84` comment.

3. **Mounting the section adds an unmocked `admin.access.list` request to every existing `/admin` browser spec.** The neighbour-fixture convention (`phase11-health:257-263`, `phase10-ui-csv:202-212`) requires every mounted section's transport to be stubbed; none of `phase9`, `phase10`, `phase11-shell/audit/health` currently route `**/rpc/admin/access/list`. If the new section fires that request on mount, those unmocked calls fail and the access section renders its error state inside specs whose full-page axe scans (`phase9:287`, `phase11-shell:456`) and review captures were not written for it. Either the new section must stand down on the shared-query pattern, or every existing spec gains a `access/list` neighbour stub — a cross-spec edit. Evidence: `admin.tsx:72-74` (unconditional daily mount) vs the spec route tables above.

4. **Timezone-prerequisite mismatch.** Audit and health stand down until `useOwnerDailyAnalytics` resolves (`use-owner-audit.ts:196`, `use-owner-health.ts:43-44`), but `admin.access.list` returns principals with no timezone dependency (`access-repository.ts:383-408`). The established "unavailable until the shared analytics query settles" pattern does not cleanly transfer, so the new section will diverge from the one-live-region convention (`use-owner-health.ts:29-36`) or must invent its own stand-down rationale.

5. **Duplicate-email refusal is case-insensitive by index, not by schema.** `owner_email_taken` fires from `auth_principals_owner_email_unique` (a `lower(owner_email)` index) via `isUniqueViolation` constraint matching (`access-repository.ts:288-315,220-248`); the Zod schema (`contracts.ts:90`) does not normalize case, so two different-cased addresses collide at the DB. The UI must present this as "email taken", not a validation error. This is correctness-relevant, not just cosmetic.

6. **Scope boundary appears clean, but unverified at the edges.** All access surface code lives in `packages/auth`, `packages/api`, `apps/server`, `apps/web` (no `packages/db` change was needed — the unique indices predate this slice, `packages/db/src/schema/application.ts:95-97`). I found no requirement to change `packages/**`/`apps/server/**` for the *UI* itself. However I did not run any build/test, so transport-shape claims rest on static reading; mark the oRPC input-validation error code string as `UNCONFIRMED`.

END-OF-MAP