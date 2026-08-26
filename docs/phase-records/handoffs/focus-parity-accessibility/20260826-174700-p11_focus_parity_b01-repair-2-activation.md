# Focus-parity accessibility — repair 2 activation

- Run: `p11_focus_parity_b01`.
- Existing worker branch/worktree: `work/phase11-focus-parity-b01` at activation base `c04e7a9`,
  with the uncommitted bounded candidate and two escalation handoffs.
- Repair budget: activating final focused repair `2 of 2`.

## Parent gate finding

Repair 1 passed 23 of 24 focused Chromium tests. The staff first-Tab proof is green after replacing
its blur-only reset with a fresh `page.goto("/login")`. The sole remaining failure is public first-Tab
focus. Its target block was not repaired: it still uses `page.reload()` after programmatically
focusing the skip link, and Chromium retains that link as the sequential-focus origin across reload.

The final repair is therefore fixed before writing: in the public skip-navigation test, replace that
specific post-proof reload with fresh navigation to `/`, wait for the existing skip-link locator to
attach again, then preserve the original blur, Tab, focus, visibility, Enter, and main-focus
assertions unchanged. No other test or CSS edit is authorized.

## Gate consequence

A fresh native worker gets exactly one post-repair run of the complete three-spec Chromium command.
If it is red, this milestone is terminal `FAILED_VALIDATION`; no repair 3 or alternate assertion is
permitted. If green, the same worker completes fast/repository/format/type/freeze checks, writes the
candidate handoff, commits the complete candidate once, and stops for independent read-only review.

No product, visual, content, security, privacy, schema, or migration decision is open. Canonical
screenshots remain immutable and any diff in them is an immediate stop.

## Route

Fresh native `gpt-5.6-terra` at `high`, role `worker`, no-history fork. The operational-capacity
filters from registry revision `2026-08-25.10` remain unchanged; the final repair stays native and
fresh because it follows a failed worker gate and must preserve the coordinator's independent parent
judgment.
