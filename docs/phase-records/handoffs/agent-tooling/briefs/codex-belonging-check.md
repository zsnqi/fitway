<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: one belonging check for every Owner concept page (agent-tooling-r01, belonging-check)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-belonging`, branch `tooling-belonging`, HEAD `2e4f01e9`
- **Milestone:** `agent-tooling-r01`. Decisions: items 92 (2) and 93 (with its "Scope, narrowed 2026-10-28" paragraph)
  of `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (what the check is for and what it must
  leave alone), and items 6 and 10 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (no second path; room
  is made by moving code out).
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive" and §"Evidence and advanced tools": the commands, the
    port rules and the output rules this check joins;
  - `.agents/skills/verify-fitway/cli.mjs`, the command dispatch (from line 500);
  - `.agents/skills/verify-fitway/runner.mjs` lines 176-194: how drive opens an item's context (touch and mobile
    emulation at 720 px and below, reduced motion, dark scheme, locale);
  - `.agents/skills/verify-fitway/concept-source.json`: the concept is read from that ref, not from this worktree's
    own copy of the concept, which is older;
  - the recipes at that ref (`fedbdb6d`), exported read only to
    `D:/fitway-temp/tooling-belonging/concept-ref/design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json`:
    the `details` feature of the Daily page (opens its minutes table) and the `expand-days` feature of the Reports
    page (shows every day of its phone list);
  - the reference frames K2 names, each by its absolute path.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, no Playwright Chromium and no network: every test you add passes there. A proof that needs a
  real browser is a script in your temp folder, run and reported, not a ladder test.
- **Your temp folder** is `D:/fitway-temp/tooling-belonging/codex/`. Start no Codex process and never run
  `codex:round` or `main:advance`. Link no `node_modules` between folders; this worktree has its own install.
- **Commit once, plainly, after everything else**, then run the fast ladder (`pnpm verify:fast`) after that commit.
  Never reset, amend or rewrite commits. Name the SHA `git rev-parse HEAD` printed after your commit.
- **A port** comes from verify-fitway's allocation only; never stop or reuse a listener another process holds.
- The unmerged branch `tooling-loading-check` holds another page-matrix command; do not read it, copy from it or
  depend on it. Reuse what this worktree's verify-fitway already has.

## Goal

verify-fitway gains one command that tells, for every Owner concept page, both languages and every width, whether any
item or row with columns side by side has a line that runs under another of its own columns (decision 93), so the
kind of defect decision 92 (2) fixed by hand is found by a repeatable check, not by a reader noticing it.

## Causes and required outcomes

- **K1. No check finds a line running under another column of its own item.** On Reports' phone list at 320 px, a
  day's camera-gap note ran under that day's peak column; it passed every check, because they counted lines and
  looked for intersecting boxes (decision 92 (2)). Outcome: one verify-fitway command reports, for each frame, every
  **finding**, defined on rendered geometry only:
  - an **item** is a visible `li`, `tr`, `[role=row]` or `[role=listitem]` element (nested ones are items too);
  - a **line piece** is a run of the item's visible text on one rendered line: the client rects of its text nodes
    (`Range.getClientRects`), joined when they share a line and stand no further apart than a word space. Text that is
    not rendered (`display: none`, `visibility: hidden`, opacity 0, the `[hidden]` attribute, a visually hidden
    `.sr-only` element, a zero-size rect) is not a piece. A value split by bidi isolation (`<bdi>`, `dir`) into several
    rects on one line is one piece;
  - a **column** of the item exists where two of its pieces stand side by side on one line with a gap between them;
    the column beyond that gap, in the reading direction (to the left in Arabic, to the right in English), is the
    pieces wholly beyond the gap that overlap the far piece across, from its line down. Only a column holding two or
    more stacked lines counts: a one-line piece beside another is part of a head line (decision 93's narrowed scope:
    a record's body under its own head line is not this problem);
  - a **finding** is a line piece of the same item that starts on the near side of that gap, lies at or below the top
    of the column, and reaches into the column's horizontal extent by more than 1 px. Each finding names the page,
    query, language, width, the item (a unique selector), the piece's text, the column's text, and how far in it
    reaches in px.
  Intent: the check reads the page as a reader reads it, by where text stands, not by which element it sits in; the
  1 px bound is for antialiasing, not a design allowance.
- **K2. It must catch what decision 92 (2) forbids and leave alone what decision 93 excludes.** Outcome, each with the
  line the command printed:
  - against the extracted concept at `D:/fitway-temp/tooling-belonging/concept-c774fd77/design-research/owner-composition-exploration-r04/directions/eclipse`
    (the build before the fix; frame `D:/fitway-temp/tooling-belonging/ref/img/thu-320.png`), Reports with every day
    shown reports a finding in Arabic at 320 px for Thursday 17 September's note «لا قراءات من 10:00 ص إلى 2:00 م»
    under its peak column, and one in English at 320 px for "No readings from 10:00 AM to 2:00 PM";
  - against the concept at `concept-source.json`'s ref, these PASS with no finding, each named: Reports' merged row
    "No readings yet from 26 Aug to 12 Sep" in the day table at 768 px, English, `history=short`
    (`D:/fitway-temp/tooling-belonging/ref/img/rep-short-table-en-768.png`); the last item of Reports' phone list at
    320 px, Arabic, `history=short`, every day shown (`D:/fitway-temp/tooling-belonging/ref/img/pair-shortall-320-end.png`);
    Daily's minutes-table row «لا قراءات من 2:14 م إلى 2:31 م» at 390 px, Arabic, after `details`
    (`D:/fitway-temp/tooling-belonging/ref/img/pair-mingap-390.png`); Activity log's records at 390 px, Arabic and
    English, whose body runs under the time in the head line
    (`D:/fitway-temp/tooling-belonging/ref/img/pair-act-live-390-a.png`); Settings' history at 1440 px, Arabic,
    whose quoted reason runs under the change (`D:/fitway-temp/tooling-belonging/ref/img/set-log-ar-1440.png`);
  - planted in a copy of that concept in your temp folder, each reports a finding: Reports' phone-list note placed
    across both columns (`grid-template-areas` giving the note both columns) at 320 px in both languages; and an
    Activity log record whose time is given a second line under it (a two-line column) at 390 px, Arabic.
  Intent: a check that passes the defect, or flags the head lines and own rows the user ruled are not this problem,
  is worse than none.
- **K3. Every page, both languages, every width, and the frames that hold items.** Outcome: by default the command
  runs Daily (`index.html`), Reports, Access, Activity log and Settings; Arabic and English; at every 10 px from 320
  to 720 and at 721, 768, 900, 1024, 1280 and 1440 px (height 844 up to 720 px, 1024 at 768, 900 above); each page as
  it loads with its default data, plus Daily after `details`, Reports after `expand-days`, Reports with
  `history=short` (with and without `expand-days`), Access `case=long`, Activity log `case=wide` and Settings
  `case=wide` and `log=every`. At 720 px and below a frame runs as drive's touch input does (touch and mobile
  emulation, runner.mjs lines 186-187), so the layout width is the stated width with no scroll bar; above 720 px as
  mouse. A feature is reached by its recipe's actions, as drive reaches it. Options select a page, a language, widths
  and a concept folder (`--concept` for an extracted build, as K2's first case needs); with no option the whole matrix
  runs. Intent: the defect showed at one width in one language; a check that samples three sizes would have missed it.
- **K4. Its output is readable and never silently empty.** Outcome: the command prints first the commit the concept's
  ref resolved to (or the `--concept` folder given), then one line per frame: PASS or FAIL, page, query, language,
  width, the number of items, the number of items with a column, and the number of findings; then each finding on its
  own line; then a total with the run time. A frame with no item prints `NO ITEMS` (neither a pass nor a failure),
  and the total counts them. It writes a JSON record of every frame and a PNG crop of each finding's item, with the
  piece and the column outlined, under its `--out` folder (absolute, outside every git tree, as SKILL.md's output rule
  says). It exits 1 when any frame has a finding or a page fails to load or a feature cannot be reached, naming it; it
  refuses to start when the ref cannot be resolved, the concept folder or a named page is missing, or the out folder
  is inside a git tree. Intent: a reader opens the crop and sees the line under the column without rerunning anything.
- **K5. Findings on today's concept.** Outcome: the full K3 matrix is run once against the concept at
  `concept-source.json`'s ref; every finding is listed (page, query, language, width, item, text, px) with its crop
  path; a finding is not a FAIL of this round, and the concept is not changed. Report the matrix's frame count and
  total run time. Intent: the coordinator learns the pages' real state from the tool, not from this brief.
- **K6. The rest of verify-fitway is unchanged.** Outcome: the command follows the CLI's existing contract (usage,
  `--help`, startup errors) and appears in `pnpm tools`; SKILL.md gains one short section with one example command;
  the geometry of K1 is a function with unit tests on synthetic line rects (both reading directions, a split bidi
  value, a one-line head line, a two-line column, a piece 1 px in and 1.5 px in) that run in the ladder without a
  browser; `pnpm map:tooling` is rerun after `git add`; the code-health ratchet and the fast ladder pass after the
  commit; existing commands, their tests and the port allocation are unchanged. New code goes in its own modules,
  `cli.mjs` gains only the wiring (item 10). Intent: one more command, no second path and no growth of a giant file.

## Scope

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before
you start. (agent-tooling DECISIONS item 14)

You may change `.agents/skills/verify-fitway/cli.mjs` (must change), `.agents/skills/verify-fitway/SKILL.md` (must
change), new files in `.agents/skills/verify-fitway/`, `scripts/agent-environment/tool-registry.mjs` (the `pnpm tools`
entry only), `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated only) and
`docs/agent-context/CODE_HEALTH_BASELINE.json` (only as the ratchet's own update writes it); commit once when done.
Everything else is read-only, the concept included. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report.

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line. Add one row for every outcome K1-K6, and for K2 one row for each of its named
cases. A PASS command must match a command started after the last edit inside the worktree, and its output must be one
line the command printed. Outside the block, list K5's findings, the files you changed, and anything you could not do.
