# agent-tooling-r01: leading-comments: `../briefs/codex-leading-comments.md`, result `eca3739c` on `tooling-leading-comments` (from `ac337544`), DeepSeek V4.1 Flash, level `max`; fixer `84cd8d85`; merged `2e6318b2`

- **Scope (agent-tooling DECISIONS item 17, finding 4):** 86 of the tooling map's 122 files showed
  `(no leading comment)`, so the map named their exports but not what they were for. Each gains a one-sentence
  comment the map shows (L1), the change adds comment lines only (L2), nothing is loosened (K1-K3).
- **Brief review** (`D:/fitway-temp/brief-review/codex-leading-comments-1` and `-1-sol`): DeepSeek four readings, all
  closed; Sol, run after switching Codex accounts on a usage limit, two: three commented files whose comment did not
  say what the file is for (`concept-css-parse.mjs`, `worker-pool.mjs`, `shell-words.mjs`, read from the map) and a
  `!` or `?` inside the sentence cutting the map's line; both closed (`7c564947`).
- **Run** (`D:/fitway-temp/codex-round-6933ecc9-8094-4f89-a4d3-ee592dbd9625`, start load 323,286): four turns. The
  first ended without a report and the second failed the claim check (automatic resumes); the third stopped with
  `STOPPED: K2 is unsatisfiable`: the brief put `compare.mjs`'s purpose line above its `code-health-exception:`
  marker, but a giant-file exception counts only on line 1 (`code-health-ratchet.mjs:233`). The cause is the brief's
  wording: its claim that the ratchet finds the marker anywhere was true of the marker, not of the giant-file
  exception, and was not checked against the code (B14); neither review could see it, since the ratchet was not among
  their sources. The brief was corrected (`6b6717ca`) and the fourth turn, resumed with
  `resume-message-1.md` there, left `compare.mjs` unchanged and committed `eca3739c`; `pnpm verify:fast` passed in
  891 s before the report.
- **Diff review** (`D:/fitway-temp/code-review/leading-comments-1/`): Sol `xhigh`, two blocking findings, both
  confirmed: `survey-output.mjs`'s comment put the output outside the temp root (the code requires it inside) and
  `path-reference.mjs`'s said existence is checked against Git (it is checked on disk). An `owner-direction-fixer`
  applied the frozen text (`D:/fitway-temp/tooling-leading-comments/fix-1/BRIEF.md`): `84cd8d85`.
- **The coordinator's grade on `eca3739c`** (`GRADE.md` there): G1 one comment line added per file and no other
  change, G2 every sentence within the rules and whole in the map, G3 no repeats or history, G4 the L2 script refuses
  a planted code change; G5 failed on the two sentences above, fixed by `84cd8d85`.
- **Left:** `compare.mjs` gets its purpose line when its giant-file exception (until 2026-11-15) is retired.
- **Rows:** L1-L2 and K2-K3 met at `84cd8d85`; K1 is the CI run on the push that carries the merge.
