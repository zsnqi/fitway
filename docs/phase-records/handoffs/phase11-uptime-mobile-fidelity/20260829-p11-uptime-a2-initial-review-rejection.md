# Phase 11 Uptime mobile fidelity — Stage A2 initial review rejection

## Outcome

- The independent native reviewer rejected the initial one-file A2 CSS candidate at SHA-256 `07dd08cbca4ecf81c49e095910ceb5f8076d539c022de48edf92785ced13d391` before mechanical verification.
- The A2 parent gate remains closed. Biome, types, component tests, Browser, screenshots, and canonical work were not run.
- This is a substantive A2 source-review failure and authorizes the frozen plan's focused A2 repair 1/2. It is not an A1 repair; A1 remains accepted at its human-authorized ceiling of 3/3 with no fourth A1 repair.

## Exact findings

1. Mobile values inherited `text-align: start` instead of the native spec's reading-end alignment.
2. `--fw-group` was unresolved and made the card background declaration invalid.
3. The layout-consuming 1px card border reduced the frozen 390px field/value lanes from 300/164px to 298/162px.
4. Mobile board overflow/material/edge did not match the native spec's clipped mobile board.
5. Board-count child values were weight 600 although the whole frozen count is weight 500.

## Frozen repair contract

- Use only local existing-token fallbacks; do not add globals.
- Clip the mobile board and apply the accepted Owner mobile material/edge fallbacks.
- Align mobile values to logical end and labels to logical start.
- Paint the quiet card edge through a non-layout-consuming `tr::before`, preserving the separate LTR/RTL state accent shadows and exact border-box geometry.
- Keep board-count `<bdi>` values chalk at weight 500.
- One CSS file only; no copy, markup, desktop, Stage B, test, Paper, baseline, or unrelated change.

## Transport distinction

- The initial GLM return was 1,318/900 characters. That remains completion-contract/transport noncompliance only and carries no source-quality, review-capability, or permanent routing penalty.
