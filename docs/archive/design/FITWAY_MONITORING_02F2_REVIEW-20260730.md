# FITWAY — Monitoring Direction Review

> **Archived 2026-08-06 — historical evidence, not current authority.** This file sat untracked
> at the repository root. It reviews Paper artboard `DIRECTION 02F.2`, two revisions behind the
> direction that reached production, and its instructions were revoked by name: "Paper 02F.5
> supersedes the repo's `FITWAY_MONITORING_02F2_REVIEW.md` — do not re-derive the board from that
> file." Its imperative section 4 ("Implementation guidance") carries no authority. The approved
> Staff visual is `STAFF MONITORING PRODUCTION SET — CURRENT` in Paper, per
> [ADR-007](../../adr/ADR-007-paper-visual-source-of-truth.md). Retained for the diagnosis of the
> orphaned vertical void, which is why the board changed. The body is preserved unedited.

**Subject:** STAFF MONITORING — DIRECTION STUDY → **DIRECTION 02F.2 — FINAL CROWD READING**
**Scope:** spatial balance inside the main board only. Direction, visual system, copy and component inventory are not under review.
**Source:** Paper file *FITWAY UX Exploration*, artboard *STAFF MONITORING — DIRECTION STUDY* (read-only inspection).

---

## 1. Executive verdict

**Refine.** Small, mechanical, one-property-class change.

The direction is correct and the content hierarchy is correct. The concern raised is **real but misattributed**: the problem is not that the content was lifted too far, and not that the board needs a redesign. The problem is that the primary reading band still carries **fixed heights inherited from 02F.1**, which was built on a `space-between` distribution. 02F.2 repacked that content to the top without shrinking the container it lives in.

The emptiness is a leftover, not a design decision.

---

## 2. Diagnosis

### 2.1 Measured facts

Board = `Integrated monitoring board`, 1342 × 521.
Three stacked bands: `Board primary reading` (310) → `Board fact rail` (149) → `Camera notice` (61).

| Element | Declared size | Real ink height | Dead space below ink |
|---|---|---|---|
| `Board primary reading` | `min-height: 310px`, `padding-block: 34px` | 142 | — |
| `Unified crowd reading` | `height: 242px`, `padding-top: 34px` | 142 (22 + 4 + 88 + 4 + 24) | **66px** |
| `Integrated approximate count` | `height: 242px`, `padding-top: 34px` | 98 (22 + 4 + 64 + 4 + 4) | **110px** |
| Vertical divider | stretched to `1 × 242` | — | overruns crowd content by 66px, count content by 110px |

Derived, band-relative:

- Top inset above the crowd label: **68px** (34 band padding + 34 column padding — the padding is applied twice).
- Gap from the bottom of the freshness row to the fact-rail border: **100px**.
- Gap from the bottom of the count meter to the fact-rail border: **144px**.

### 2.2 Root cause

02F.1 used `justify-content: space-between` on the crowd column and `justify-content: center` on the count column, with **no fixed heights**. The 310px band was legitimate there because the content was distributed across it.

02F.2 changed both columns to `justify-content: flex-start` and **added** `height: 242px` and `padding-top: 34px`, while the band kept `min-height: 310px`. The distribution was collapsed to the top; the container that the distribution had justified was left behind.

So the void is exactly the space-between gap, orphaned.

### 2.3 Answering the specific questions

- **Where is the emptiness?** In the lower half of `Board primary reading`, between the freshness row / count meter and the fact-rail border. Nowhere else. The fact rail, notice strip, header and states row are all correctly proportioned.
- **Height, placement, spacing, grouping or hierarchy?** **Height.** Grouping and hierarchy are right; internal spacing is right; placement is right. Only the container is wrong.
- **Does the crowd-reading group sit too high?** Marginally. 68px above / 100px below is mildly bottom-open — noticeable but not the offender on its own.
- **Does the count group sit too high?** **Yes, genuinely.** 68px above / 144px below puts the `37` at roughly one-third of the band height. This is the group that reads as floating.
- **Is the divider too far from the lower status row?** The divider is not too far from anything — it is **too long**. Being stretched to 242px it runs 66–110px past all adjacent content and acts as a ruler that measures the void. It is the single element making the emptiness legible.
- **Is the lower status row too far away?** No. It sits immediately after the band; it is being pushed down by the band's stale height, not mispositioned.
- **Should the board be shorter, denser, or rebalanced?** **Shorter.** Not denser — do not tighten the internal 4px grouping gaps, and do not add anything.
- **Should the concern be rejected?** No. Partially reframed, then acted on.

### 2.4 Review criteria

1. **Vertical rhythm** — the screen-level rhythm (32 / 24 / 24 / 24 / 40) is clean and should not be touched. The break is inside the board only.
2. **Visual weight** — top-weighted inside the band. Typographic weight (72px display, 56px numeral) is correct and does the hierarchy work; the container adds no weight, only air.
3. **Hero height vs density** — 310px band for 142px of ink is a 2.2:1 container-to-content ratio. Premium hero bands sit closer to 1.5–1.7:1. This is the number that is out of range.
4. **Relationships** — count ↔ crowd: correct, labels share a top lane, keep it. Crowd ↔ divider: divider overruns. Divider ↔ fact rail: 100px of nothing. Fact rail ↔ notice strip: correct, no change.
5. **Premium and calm** — the design is calm, but currently reads as *unfinished* rather than *restrained*, because the emptiness has no edge or content defining it. Bounded whitespace reads as intent; open-ended trailing whitespace reads as an error.
6. **Whitespace productive or excessive** — the 68px top inset is productive. The 100–144px bottom void is excessive and carries no function.

---

## 3. Recommended action

> **Reduce board height.**

Specifically: remove the stale fixed heights so the primary reading band sizes to its own content, and set one honest padding value. Content placement stays exactly where it is. The divider, fact rail and notice strip move up as a mechanical consequence — they are not to be repositioned independently.

Rejected alternatives, for the record:

- *Move content downward* — would undo the improvement 02F.2 was made for and break the shared label lane.
- *Pull the lower status row up on its own* — treats the symptom, leaves the band and divider oversized.
- *Rebalance multiple internal spacings* — the internal spacings are already correct; touching them would loosen good grouping.

---

## 4. Implementation guidance (for Codex)

Tightly scoped. Four property changes in one band. Nothing else in the screen is touched.

**Frame `Board primary reading`**
- Remove `min-height: 310px`.
- Change `padding-block: 34px` → `padding-block: 44px`.
- Leave `padding-inline: 38px`, `display: flex`, `direction: rtl` unchanged.
- Leave default `align-items: stretch` in place — the divider depends on it.

**Frame `Unified crowd reading`**
- Remove `height: 242px`.
- Remove `padding-top: 34px`.
- Keep `justify-content: flex-start`, `align-items: flex-start`, `flex-grow: 1`, `gap: 4px`.

**Frame `Integrated approximate count`**
- Remove `height: 242px`.
- Remove `padding-top: 34px`.
- Keep `width: 280px`, `padding-right: 36px`, `justify-content: flex-start`, `gap: 4px`.

**Vertical divider between the two columns**
- No change. It has no declared height and will re-stretch to the new cross-axis size automatically, terminating at the freshness row instead of 66px past it.

**Everything else**
- No change to `Board fact rail`, `Camera notice`, `Page heading`, `Fixed FITWAY header`, `Focused states`, the screen frame's `gap: 24px`, or any type, colour or radius token.

### Expected result

| | Before | After |
|---|---|---|
| `Board primary reading` | 310 | **230** (44 + 142 + 44) |
| `Integrated monitoring board` | 521 | **~441** |
| Direction 02F.2 screen | 966 | **~885** |
| Divider length | 242 | **142** |
| Void below freshness row | 100 | **0** |
| Container-to-content ratio | 2.18 : 1 | **1.62 : 1** |

Accept anything in the **220–240px** band range. Below 210 the band is at pure content-fit and will read cramped against a 72px display glyph; above 250 the original complaint returns.

---

## 5. Risk notes

1. **Overcorrection into cramped.** Dropping to pure content-fit (`padding-block: 34px`, band = 210) removes the hero's breathing room. The 72px/88px display line needs vertical inset at least in the range of its own cap height. Do not go below 44px padding.
2. **Do not compensate by tightening internal gaps.** The 4px label→value and value→freshness gaps are deliberate optical grouping — the 88px and 64px line boxes already supply ~12px of visible air. Reducing them further will make the group read as collision, not density.
3. **Hierarchy step vs the fact rail.** The rail cells use `padding-block: 24px`. At 44px the hero keeps a clear ~1.8× step. If the hero padding is pulled toward 32px, the hero and the rail start to read as peers and the board flattens.
4. **Trailing stub under the count column.** After the change the count column's ink (98) is still shorter than the crowd column's (142), so the divider will run ~44px past the count meter. This is normal and acceptable. Do **not** "fix" it by centring the count column — that breaks the shared top label lane, which is one of 02F.2's genuine improvements over 02F.1.
5. **Do not re-apply the removed heights to the sibling directions.** 02F.1 and 02F, which still use `space-between` / `center` distribution, are correct as they stand and must not be swept into this change.
6. **Card height in the comparison row.** The 02F.2 card will become ~80px shorter than its neighbours in the direction study row. The row is already ragged (1063 / 1019 / 1006), so this is expected and is not a defect to correct.
7. **Reflow / state parity.** Re-check the three focused states (loading, error, counting issue) after the change — the error and counting-issue states substitute shorter content into the same band, and with the band now content-sized they will produce a shorter board than the live state. If that variance reads badly, the correct remedy is a `min-height` on the band tuned to the *tallest state*, not a return to 310.

---

## 6. Constraint compliance

No new direction, no added cards, no new graphics, no capacity comeback, no crowd icons, no copy changes, no changes to the approved visual system, no token changes. The recommendation is four property removals/edits inside a single existing frame.
