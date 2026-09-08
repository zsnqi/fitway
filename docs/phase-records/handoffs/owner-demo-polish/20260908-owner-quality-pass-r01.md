# Owner quality pass r01 — post-release UI/product repair (coordinator record)

- Date: 2026-09-08
- Branch/worktree: `codex/owner-demo-prep` / `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`
- Base: working tree at HEAD `601d219` (r07 completion record), repair applied as uncommitted changes on top.
- Authorization: the human owner instructed this repair directly ("take ownership of the full repair… the standard I care about is the live product"), after reviewing the consolidated audit of the same date. This record carries that authorization for the test-expectation updates and the scoped canonical reconciliation below.

## Scope and slices (serialized, single writer each)

1. **S1 CSS foundations** — defined previously-undefined tokens (`--fw-edge-quiet`, `--fw-lift`) in `owner-shell.css`; replaced undefined `--fw-accent` with `--fw-red-bright`; unified the Owner control background on `--owner-control: rgb(10 10 12 / 72%)` and control radius on `--fw-radius-control`; extracted the duplicated oklab board recipe into shared `--owner-board-*` tokens; removed grep-verified dead legacy CSS (old Daily card blocks, dead reporting selectors).
2. **S2 control primitives** — Daily minute-page selector migrated from a bare native `<select>` to the Base UI `Select` family (same popup material as Reports/Audit dates; chevron in a fixed slot; 320px capped scrolling popup; RTL-safe logical CSS). Audit native selects harmonized onto the same control tokens with the background moved onto the element and logical padding.
3. **S3 Reports composition** — range card recomposed as a vertical grid (heading + hint adjacent, controls at true 236–288px size, actions in-group); the 190px field cap that made triggers overflow into the neighboring field is gone; `owner-reporting__problem` now conditional (no permanent 38px band); heatmap reading panel converted to logical padding (18px clearance from the red bar in both directions); figure list single-column; Weekly Comparison heading size unified; `heatmapDescription` copy simplified (ar/en).
4. **S4 navigation, deep link, Daily, Settings** — new scroll contract: a section heading rests at the same viewport offset it has at scrollY=0 in every section; no more first-visit pin-to-top jump; URL now carries `?section=<id>` (router `navigate` with `replace: true, resetScroll: false` — an earlier raw `history.replaceState` triggered a TanStack scroll reset and was corrected during S6a); popstate syncs; deep link and refresh restore the section. Daily coverage copy → "تغطية القراءات" / "Readings coverage"; disclosure sentence inset to the shared 32px grid. Settings gained a real Access-family loading skeleton and its boards regained backgrounds via token fixes.
5. **S5 Access, audit rhythm, health context** — PIN reveal re-materialed to the standard board recipe (neutral icon tile; red reserved for the warning sentence; content-sized dismiss); provisioning form single 420px column; audit filter row unified on a 16px rhythm with date fields filling their tracks; System Status heading switched to the Daily subtitle pattern (range under the title).
6. **S6a tests + baselines** — Owner browser suites green (81 passed / 3 pre-existing skips); 7 Owner canonicals re-rendered and the visual-authority registry/manifest updated with an honest acceptance record (`20260908-owner-quality-pass-visual-acceptance.md`); one real regression found and fixed (see S4). Public/Staff specs and canonicals byte-untouched.
7. **S6b systemic guards** — `scripts/check-owner-tokens.mjs` (fails on used-but-undefined owner tokens; wired into the fast ladder) and `tests/browser/owner-cross-surface.review.spec.ts` (six-section evidence captures + computed-style tripwires: one popup material across the three popup families, one control fill/radius family, 2px focus rings, heading-at-rest contract, URL contract), registered in the browser ladder.
8. **S7 workflow** — `docs/WORKFLOW.md` gained "Perceptual and cross-surface review": design-judgment gate on baseline promotions, mandatory cross-surface consistency sweep for shared control families, and an exploratory-walkthrough duty for the final gate of user-facing work.

## Verification evidence

- `pnpm verify:fast` (with demo runtime env loaded): PASS, zero repository mutation — repository invariants (75 milestones, 424 authority cases), Biome (2 pre-existing non-fatal specificity warnings), Owner token fidelity (583 usages / 203 tokens), all types, 617 unit tests, 120 simulator tests.
- Owner browser suites: 81 passed / 0 failed / 3 intentional skips (S6a final run).
- Coordinator live walkthrough (1440×900 and 390×844, AR RTL + EN LTR): navigation rest contract holds in both directions and both locales; EN mirrored clearance from the heatmap red bar = 19px (was 5px in RTL pre-repair); keyboard-only operation of tabs, disclosure, pagination popup (arrow/Enter, 2px focus rings); invalid-range error appears conditionally and self-clears; mobile shows no horizontal overflow on any section; pagination popup stays in-viewport at 390px; language round-trip preserves `?section=`; PIN reveal, provisioning form, and health heading verified live after S5.

## Known remaining (accepted, low priority)

- The three near-identical board drop-shadow blacks (`#0000002e/35/3d`) and a handful of one-off hexes remain as literal values (token-guard informational report lists them).
- 19 fallback-masked `--fw-material-*`/`--fw-edge*` usages are intentional optional-override hooks (warning-level in the token guard).
- Late Reports height growth after cold data arrival (~+64px below the fold) was left to the existing reservation machinery; the heading-rest contract is unaffected.
- The date-popup skin is duplicated between `owner-date-field.css` and the Daily pagination block (identical token values); consolidating into shared classes requires touching `owner-date-field.tsx` and is deferred.
- Settings locked-band fill uses the 17% open-board value; if Paper authority prefers flatter, it is a one-line change.

## Ledger note

`PROJECT_STATE.yaml` was updated with a `owner-quality-pass-r01` milestone by the coordinator as part of this record.
