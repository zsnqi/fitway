# Owner Settings Paper successor — independent review failure

- Candidate run: `p11_settings_paper_b01`.
- Independent reviewer: fresh native SOL, read-only.
- Verdict: `FAIL`.
- Mutation during review: none.
- Repair budget before/after verdict: `0 of 2` / `1 of 2`.

## Findings

1. **Blocking:** six of seven weekday rows do not expose an open/closed control. Every day must have a touch-safe editable open/closed control alongside its paired hours; Friday's next-day note may supplement but must not replace it.
2. **Significant:** the real 390px English and Arabic forms keep save at the top while the final weekly control is more than 1500px below it. Dirty save/discard behavior must be reachable in the actual mobile composition, not only in the detached state matrix.
3. **Minor:** `ينتهي هادئ عند` and `استطلاع العام` are imprecise operational labels and need concise native Arabic wording.

The reviewer otherwise confirmed exact editable/read-only boundaries, all locked timing values, clean 1440/390 EN/AR rendering, FITWAY/G3 visual continuity, 44/52px control sizing, 2px focus, Western digits, preserved original dimensions, unchanged token hash `3b0faca3`, bilingual lifecycle states, and absence of forbidden scope.

The rejected candidate remains preserved. Repair 1 is bounded to these three findings; no schema, repository, product, or unrelated Paper change is authorized.
