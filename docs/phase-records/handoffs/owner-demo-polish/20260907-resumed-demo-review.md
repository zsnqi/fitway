# Resumed FITWAY demo - final visual review

- Status: NEEDS_HUMAN for final visual acceptance and subsequent canonical screenshot reconciliation. Runtime candidate is ready for the requested human review; this is not a DONE/integrated or green verify:full claim.
- Base: d35fbd3107d6bba4e94f2715a9ae37b81ce02203, codex/owner-demo-prep, existing f2a7 worktree. All incoming uncommitted work preserved. Coordinator sole writer; no commit, reset, deployment, Paper mutation or canonical baseline promotion.
- Previous r02 terminal record and r03 initial handoff remain preserved. r03 repair count is now 2; do not reset its repair budget.

## Recovered and verified work

The interrupted session had completed more than its initial handoff recorded: invariant smooth Daily curve geometry and marker mask, synchronized selection motion, high-contrast metric spacing, concise bilingual copy, Owner material/table treatment and loading sections, request-local schedule evaluation caching, and bounded demo-only simulator flow. This continuation preserved those changes, restarted the saved environment and inspected Public, Staff and all six Owner sections using real supplied credentials.

The restart first acknowledged a saved backfill minute, then resumed fresh live updates on the normal 20-second cadence. No simulator correction or data reset was needed. Current-day Daily observations reflect actual simulator runtime since restart; the saved 28-day synthetic history remains available in Reports.

Two source changes in this continuation are test harness maintenance: format the interrupted Audit focus assertion; freeze the existing Latest-caption test clock to its July21 fixture. The latter previously compared New York's real civil date with the mock current London timezone, failing overnight when those dates differed. Independent review confirmed this defect exists in HEAD. Product timezone logic was untouched. Biome normalized the edited test's line endings.

## Executed evidence

- Full run `node output/playwright/demo_ready_r03/run-gates.mjs full demo_resume_r03_full2`: repository invariants, formatting, types, 614 unit/component tests, 120 simulator tests, build, and all 133 integration tests passed. The exact disposable database `fitway_integration_demo_resume_r03_full2` was provisioned on the demo Postgres instance; the `fitway_desktop_demo` database was not reset or modified by integration tests.
- Full browser run: 138 passed, 3 intentional live-demo skips, 7 failures. Six were canonical screenshot mismatches (Audit, Health, Settings error, Settings full route, Daily, Staff); the seventh was the existing overnight Latest-caption test issue above. Approved screenshots were kept unchanged. Therefore verify:full remains red and visual gate is FAIL pending human acceptance, not silently waived.
- Supplemental `FITWAY_RUN_ID=demo_resume_r03_functional pnpm exec playwright test --ignore-snapshots`: 144 passed, 3 intentional skips, one Windows `ERR_NO_BUFFER_SPACE` during navigation. Single-worker exact remount rerun `demo_resume_r03_remount` passed. This suite verifies behavior beyond screenshot assertions only; it is not visual-baseline acceptance.
- Deterministic Latest-caption focused run `demo_resume_r03_caption` passed. Final Biome check of both corrected test files and `git diff --check` passed.
- Actual repository demo verifier through scripts/demo/cli.ts verify: 3/3 passed, including real Public, Staff PIN, Owner password, 401/403 boundaries and all populated Owner sections. Credentials entered via non-echoing standard input; not persisted in scripts, logs, URLs or command lines.
- Live Owner responsive walkthrough: six routes, Arabic/English, widths320,360,390,721,768,820,1024,1440; no document overflow, no page errors, no axe violations; Settings draft survives section switching and Discard restores saved value. Evidence: output/playwright/demo_ready_r03/final-live/results.json and sibling captures.
- Settled Reports timings in final live run: heatmap746/727/1129ms; all content1275/1263/1200ms. Prior initial handoff measured heatmap16806ms. CSV downloaded successfully:10082 lines,1015530 bytes in the final run. Evidence: output/playwright/demo_resume_r03_live/results.json and export.csv.
- Daily metric labels are readable in both locales at640px forced colors and200% zoom. Fresh independent source review found no actionable correctness/security/data-semantic regressions.
- Fresh independent rendered review accepted the candidate for human final visual review. Initial below-fold full-page captures contained compositor artifacts: blank Audit region and Reports headers. Actual scroll-into-view screenshots resolve them in both languages at320/390px; main and independent reviewer viewed the images. No source workaround was added for capture artifacts.

## Evidence and runtime

Primary fresh captures: output/playwright/demo_resume_r03_live/ including daily-{en|ar}-{forced|zoom}.png, reports-settled-2.png, ActivityLog-{en|ar}-scrolled.png and reports-{comparison|detail}-{en|ar}-{320|390}-scrolled.png. Full canonical differences and functional results are under output/playwright/demo_resume_r03_full2/ and output/playwright/demo_resume_r03_functional/.

Some earlier temporary probe runs failed on stale selectors, an unused response listener, or pointer targets outside this morning's sparse observed interval. They are not passing evidence. Their successful replacement results are listed above. Initial restricted-shell startup and absent disposable database errors were environment setup failures; no production settings or environment file was rewritten. A usage-limit auto-review rejection temporarily interrupted inspection; the same authorized command succeeded after the user continued.

Demo remains running at http://localhost:3101, backend3100, all owned services verified. An ephemeral authenticated Owner window is opened via the existing owner command for human review. Closing that window discards its session.

Next: human visual review of this concrete candidate. Only after explicit acceptance, reconcile authorized canonical screenshots and authority metadata, rerun the full visual gate and integrate. Do not overwrite canonical baselines merely to make the test green, and do not claim this uncommitted candidate is DONE.
