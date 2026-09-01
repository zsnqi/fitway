# FITWAY fidelity/integration closure r04 repair-1 candidate

## Completed

- Preserved implementation candidate `8b7c4172da02439cc1d1f5855abbc953fae629be` and every accepted Public, Staff, Login, and Owner repair already committed there.
- Repaired only the first r04 full-browser findings: deterministic Daily loading/error transition, the History matrix timeout, and official-logo raster nondeterminism in the seven new r04 non-live canonicals.
- Recovered the declined proposal from Codex task history. Global `maxDiffPixels` and `--disable-gpu` changes remain rejected; no accepted predecessor canonical was refreshed.

## Exact current state

- Branch/worktree/run lineage: `codex/fidelity-integration-closure`, `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`, `fidelity_r04_repair1_*`.
- Base `b1bc91c4028eb02083ea59dc73a3c8c03614c767`; implementation parent `8b7c4172da02439cc1d1f5855abbc953fae629be`; repair-1 candidate commit `SELF` after the freeze below.
- `main` remains `8f5ff99a9e48722a9cb44b6124833099f3704f42`. Nothing is pushed, deployed, tagged, released, or externally provisioned.
- r01/r02/r03 remain immutable `FAILED_VALIDATION`. r04 is `VALIDATING` with repair count `1/2`.

## Decisions

- Human authority on 2026-09-01 explicitly renewed the r04 coordinator lease for `tests/browser/**`, `PROJECT_STATE.yaml`, closure handoffs/evidence, and isolated verification runtimes through completion.
- The official mark is proved by the live DOM path, decoded intrinsic `1024x1024` dimensions, visibility, absence of a nested SVG, and the existing byte-equality foundation contract between `apps/web/public/fitway-logo.png` and `brand/fitway-logo.png`.
- Exact analysis of three concurrent Login renders located every unstable pixel inside the 16x16 rasterized mark. The seven new r04 non-live full-route canonicals mask only the live image element; their unmasked review captures remain the rendered-review evidence, and every pixel outside the mark remains exact.

## Remaining

1. Freeze and commit this exact repair candidate.
2. Run fresh `pnpm verify:full` with an exact disposable database and isolated browser resources.
3. Run fresh independent source and rendered Paper/accessibility reviews on the exact commit.
4. Fast-forward the accepted candidate into canonical `main`, revalidate the desktop synthetic demo, record durable r04 closure, and leave `main` clean.

## Blockers

- None. Missing shell environment values caused two pre-gate unit stops; the complete documented synthetic set resolved them without source changes.

## Verification

- `fidelity_r04_repair1_stress`: the four formerly red focused tests, repeated three times with eight workers, passed `12/12` in `18.9s`; this includes the two-locale/nine-width History reflow, focus, keyboard, live-name, reduced-motion, and axe matrix under its `60s` ceiling.
- Exact pixel analysis: expected-to-live differences were confined to `x=286..301`, `y=18..33`; live-to-live differences were confined to `x=290..297`, `y=18..19`.
- `fidelity_r04_repair1_fast4`: repository invariants PASS, Biome `504` files PASS, all workspace type checks PASS, unit `572/572` PASS, simulator `117/117` PASS, mutation guard PASS.
- Not yet verified on `SELF`: full disposable-database/integration/build/browser gate, independent source review, independent rendered Paper/accessibility review, integration, and desktop-demo proof.

## Recommended next session

Continue in `verify` mode on the exact r04 repair-1 candidate. Do not edit unless a fresh gate returns a verified finding. Run the required isolated full gate, independent source and rendered reviews, then integrate the accepted candidate, verify the desktop demo, and close the ledger without reopening accepted fidelity work.
