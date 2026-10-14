<!-- handoff-format: resume-point-v1 -->
# access-reason-cap-r01: resume point

- **As of:** claude/busy-bartik-858366 at `55780c02`, 2026-10-14 13:20 +03:00 (complete; independent review PASS; integrated by the coordinator into `codex/owner-redesign-r04`)
- **Previous resume point:** this file at `c7cd8cb9` (the 2026-10-04 activation and its evidence receipt `20261004-221500-access-reason-cap-r01-evidence-receipt.md`)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 33 (the reason's length); the packet's 2026-10-14 criterion that each deactivation form starts empty

## State

Complete. Restarted by the coordinator on 2026-10-14 (the user left its restart to the coordinator on 2026-10-10):

- `0ee0f618` merges main (`9c46065d`); the frontier check that blocked it on 2026-10-04 was removed in `eb87d094`.
- The 2026-10-04 fix stands: the access contract caps both deactivation reasons at `AUDIT_REASON_MAX_LENGTH` (240),
  the two form fields refuse a longer reason with their own message in Arabic and English, SPEC.md line 369 records it.
- The independent review of `0ee0f618` (PASS) found that the new too-long message, and an older carried reason,
  reached the next owner's form; the coordinator widened the packet by one criterion (`b62594d3`):
  - `a71748bc`: Cancel and opening the form for another owner clear the reason, the too-long message and the refusal.
  - `8a446b89`: tests that a refusal is cleared.
  - `55780c02`: while a deactivation is pending, its Cancel and the other owners' deactivate links are disabled, so a
    pending result is never dropped and no second deactivation starts.
- Evidence, all on `55780c02` or its predecessors named above: unit 5 files, 82 tests, exit 0
  (`D:/fitway-temp/access-reason-cap-r01/rerun-20261014/unit-55780c02.txt`); integration on the disposable
  `fitway_integration_arc_r01_20261014`, 26 of 26
  (`D:/fitway-temp/access-reason-cap-r01/rerun-20261014/integration.txt`); each new test shown failing on the code
  before its fix; CI green on `0ee0f618` (run 38541967359), `a71748bc` (38543937564) and `55780c02` (38546139307).
  Independent review, PASS at each step: `D:/fitway-temp/access-reason-cap-r01/review-20261014/` (the first review),
  `D:/fitway-temp/access-reason-cap-r01/review-20261014/fix/` and `D:/fitway-temp/access-reason-cap-r01/review-20261014/final/`.

## Running now

Nothing.

## Next steps

None in this milestone. Follow-ups for the move to production (outside this packet):
1. The password-reset form has the same pending pattern: its Cancel and "Reset sign-in details" link stay enabled
   while a reset is pending and `clearReset` resets the mutation (`owner-access-view.tsx:383`, `:967`, `:979`; since
   `f1e38d69`).
2. A form hidden by a list refresh, not by Cancel, keeps its draft for that owner if the form reappears.
3. The submit handlers rely on the disabled Confirm for an empty reason (the server refuses it as `reason_required`).
4. The contract counts UTF-16 units and the database counts characters: 121 emoji are refused as 242.

## Waiting on the user

Nothing.

## Known risks

- An older page that still allows 500 characters gets the generic "check the connection" message on a refusal.
- The integration suite needs `.env.integration.local` (loopback test values) and the run's named database.

## Pointers

- Packet: `docs/phase-records/task-packets/access-reason-cap-r01.yaml`.
- Research digest: `D:/fitway-temp/owner-r04-access-questions/REPORT.md` section 5.
