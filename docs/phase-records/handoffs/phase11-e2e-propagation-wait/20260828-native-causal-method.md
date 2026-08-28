# Native causal method: adopted after read-only lifecycle review

Coordinator adoption at `a6f5a98e810f37da1ff4369497e090250865bce8`, 2026-08-28. Native Sol/high planning invocation `p11_native_causal_plan_sol01` completed without writes or runtime. This record supplements the existing W1 plan; it does not establish H1 or authorize W2.

The unchanged test closes Chromium/Vite/Hono and deletes simulator state in its finally block; afterAll ends the database pool. A completed canonical run cannot retain those resources. Therefore use two separately isolated invocations at the frozen W1 candidate:

1. Canonical focused invocation with unchanged integration configuration: expect the original changed-count DOM timeout. This also withholds any live follow-up and is the negative control.
2. Native causal invocation using only a run-owned temporary Vite pre-transform configuration importing the original integration configuration. Match exactly the leased test and wrap only its original changed-count await in try/catch. Preserve that await and its 5,000ms timeout. On the predicted rejection, run the bounded probe inside the same test's lexical resources, then unconditionally rethrow the original error. Surrounding cleanup and the 60,000ms test ceiling remain intact. Both commands remain red; the causal verdict is a separate experiment, never a product gate.

Freeze the exact insertion after W1 source review. Inspect and retain its generated diff. Require one exact transform match, fixed source/config/lock/adapter hashes before and after, and no source write by the verifier.

Before intervention, require the predicted first-live/second-backfill request and processed-ack correlation, changed local count, unchanged current count, and advanced history/sequence. Record one sanitized DB observation and real public-response/DOM state. Then call the existing `runSimulator(43)` exactly once in that invocation's same API, limiter, DB, browser, device and state file. Correlate persisted lastRequest with the actual processed acknowledgement: sequence 3, live mode, fresh observedAt and currentCount different from the first count. Use the acknowledgement time from W1 instrumentation; public and exact DOM acceptance must occur no later than 5,000ms from that acknowledgement. Start observation immediately and read DB once concurrently; never add time for DB inspection, poll DB, reload the page, or force refetch.

Stop on a different rejection, unexpected earlier live/current write, another rollover/backfill, stale or uncorrelated follow-up, or exhausted original deadline. No extra once invocation. H1 falsification routes to H3; it does not permit speculative W2.

Commands: `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase2.integration.test.ts -t "drives the real browser through unavailable, fresh, changed, stale, and recovery"`, then the same command with the run-owned causal config. Use distinct guarded lowercase run IDs and exact disposable databases, private environment, owned space-free TEMP/TMP, ephemeral services, hidden processes and redacted logs. Reuse the resource-safety pattern from `test-results/login_b03_v01/run-full.mjs`, never its IDs or historical candidate. No external provider or launcher work is involved.

This method is accepted for implementation and native execution after W1 source review. Final runtime evidence, not the planner's conclusion, decides whether W2 becomes executable.
