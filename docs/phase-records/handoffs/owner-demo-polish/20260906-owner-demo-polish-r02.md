# Owner demo final polish r02

Status: FAILED_VALIDATION. Base d35fbd3107d6bba4e94f2715a9ae37b81ce02203 on codex/owner-demo-prep, current worktree. Primary coordinator is sole writer.

Human authorization: final product polish judged in the running application, preserve FITWAY identity and data/permission semantics; no Paper workflow, mutation, or canonical baseline promotion. Scope includes Owner presentation, Public category/cap alignment, and a bounded timezone formatter cache measured on Reports' hot path. No demo data or credentials reset.

Initial checks: clean candidate, installed Vitest 4.1.10, existing Postgres/server/web/simulator owned and ready. Constrained-shell tool lookup/status failures disappear under authorized execution; no dependency repair needed.

Current decisions: keep full curve geometry invariant during selection using an elliptical SVG mask; short gaps stay unconnected without extra pale ticks, sustained gaps retain annotation; report headers opaque at the scrolling seam; concise bilingual copy; scoped Owner materials and Actions inset.

Evidence so far: 61 focused tests pass. 45000 date conversions measured 2294ms before / 152ms after formatter caching. These are local microbenchmarks, not full network latency. Validation repair 1 corrects obsolete trim/count test assertions and incomplete new ledger metadata; no data-semantic failure found.

Authentication prerequisite: existing demo uses secure interactive prompts and does not persist the Owner password. Process/User/Machine environments contain no demo credentials. The connected browser is unauthenticated. User asked to use available local credentials; no credential reset or authentication bypass is authorized or performed. Isolated browser checks proceed; live authenticated end-to-end remains pending local credential entry.

## Final decisions and verification

Implemented selection-invariant smooth Daily geometry with elliptical marker mask, quieter short-gap treatment, lighter tooltip positioned below high points, zoom-correct cutout sizing, and memoized/cached time formatting. Reports now uses opaque sticky headers and section-shaped static skeletons in their final positions with one announcement. Accounts Actions has logical inset alignment; access states use Owner materials. Public category distribution and cap were refined on desktop/mobile. Arabic/English copy removes implementation mechanics and unsupported reassurance. Raw data, timezone meanings, permissions and gaps remain preserved.

- verify:fast PASS: 74 unit files / 601 tests, 117 simulator tests, type checks, web build, Biome512 files, repository invariants. Synthetic test-only required environment values used, including a non-connectable database URL; no real environment file changed.
- Daily browser: 8 PASS, owner_polish_r02_browser. Arabic/English, widths320-1440, keyboard, reduced motion, 200% zoom, axe and data/permission states.
- Reports browser: 6 PASS, owner_polish_r02_reports_final. CSV behavior, section loading, both-axis scrolling, opaque/sticky header assertions, Arabic/English captures.
- Access/Public browser: 6 PASS, owner_polish_r02_access_public. Responsive/locale, keyboard, targets, reduced motion, zoom and axe checks.
- Rich Daily replay under output/playwright/owner_polish_r02_review uses a prior synthetic Sept5 payload in an isolated mocked-response context. Eight locale/width captures, selection path invariance, zoom cutout measurements and distinct forced-color mask fills pass. This is not live authenticated evidence.
- Coordinator inspected ordinary-mode Daily, selected tooltip, mobile, zoom, Reports scroll/loading, Access RTL and actual Public runtime. Independent source review found no correctness regression; ordinary-mode rendered review was acceptable.
- Final pnpm demo:status: Postgres/server/web/simulator running; owned processes verified; server/web endpoints ready. Restart loaded backend formatter change without resetting data volume. Demo remains available at http://localhost:3101.

## Unresolved acceptance failure

Fresh independent rendered review found partly obscured Peak level, Average level and Total entries labels in forced-colors mode at640px. Coordinator reproduced after allowing layout to settle: output/playwright/owner_polish_r02_review/replayed-daily-forced-colors-settled.png. Automated accessibility and mask assertions did not detect the visible issue. Root cause and whether this predates the diff are unestablished. Do not claim accessibility acceptance or demo readiness.

Two focused repair attempts were already recorded: obsolete chart assertions/ledger metadata, then stale Reports disclosure fixture/locator expectations. Executable/environment setup failures were harness issues, not demonstrated data-semantic regressions. docs/WORKFLOW.md defines fresh verifier rejection as terminal FAILED_VALIDATION. No third source repair or budget reset was performed. Authorized continuation should isolate and minimally fix metric text overlap, then check forced-colors in both locales plus normal/zoom layouts.

Actual authenticated Owner end-to-end review, Settings draft/discard and real Reports loading timings remain unverified due to the authentication prerequisite described above. The genuine interactive step is local secure credential entry; never request secrets in chat. No reset, bypass or real session fabrication occurred.

No Paper mutation, canonical baseline promotion, deployment, commit or push occurred. Candidate remains uncommitted in the worktree, preserved for review and bounded continuation rather than accepted/integrated.
