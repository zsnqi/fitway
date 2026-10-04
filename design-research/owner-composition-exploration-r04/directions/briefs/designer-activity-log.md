<!-- brief-format: v1 role: designer -->
# Designer brief: Activity log, the whole screen in one pass (owner-design-exploration-r04)

For a fresh `owner-direction-designer-max` (Opus, max): the user's trial of one whole Owner screen in one pass
(r04 DECISIONS "How this milestone's rounds run" item 6). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. This round designs and builds one version of the screen; a review follows, then the user sees it.
No options round: decide the composition yourself and say why.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-activity`, HEAD `7bb5845`
  plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 16, 23 and 31, and "How this milestone's rounds run" items 6 and 7;
  `docs/agent-context/WORKING_AGREEMENTS.md` §"Rules and findings".
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - `D:/fitway-temp/owner-r04-activity-questions/REPORT.md`: the research digest (data, conflicts, file pointers).
  - The log's real contract, so the synthetic data is true to it: `packages/api/src/audit/types.ts` and
    `packages/api/src/audit/list.ts` (actions, actors, reasons, paging, filters); `SPEC.md` story 26 and the
    retention and export lines the digest cites.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §1 (foundations), §2
    (content rules), §3 (components; §3.4 table, §3.5 buttons, §3.6 segmented, §3.8 date field, §3.9 dialog and
    sheet, §3.10 chips, §3.11 rail and header incl. HDR-7, §3.12 empty and alert, §3.14 states), §4.2 Reports as the
    nearest sibling. Navigate code with
    `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; `reports.html` / `reports.css` / `reports.js` are the
    closest working example of the frame and the states.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Run `pnpm check:design-context` and `pnpm context:show --milestone owner-design-exploration-r04` first. Impeccable
  is the one design skill; load no other design or taste skill. (AGENTS.md)
- A local server uses port 3176 only. Frames and scratch go under `D:/fitway-temp/owner-r04-activity/`.

## The question

Eclipse has Daily and Reports; Activity log is a dead rail item. Design and build the owner's Activity log as one
finished screen in Eclipse's language: the owner opens it to answer "who changed what, when, and why" — a count
correction or reset, an access change, a settings update — and trusts that it is complete and not live.

The user has answered the product questions (item 31): one newest-first stream with kind shortcuts above it; kind,
person and date range in view, "reason contains" under "More"; «عرض الأقدم» / "Show older" 25 at a time with the end
line; a refresh button beside the last-load time and no automatic refresh; no export; a settings record says only
that the settings were updated. Everything else is yours: what sits above the list, the record's form at each size
(a table, rows, cards, or something better), how the filters behave on the phone, what if anything is lit, and how
Access and Settings would link into a filtered log (those screens are not drawn yet; show the arrival state, e.g.
the log opened on one kind or one person, and say what the link would be).

Wire the rail's and the phone bar's Activity log item in Daily and Reports to the new page; change nothing else in
them.

## Hard limits

- Product and privacy: no visitor, image or per-visitor data anywhere; the actors are only the shared staff desk, the
  owner and the automatic system, with the contract's own labels. The page never looks live (no live dot, no
  auto-update; item 8, D1). No "of N" total: the contract has none.
- Truthful data: a missing prior value reads as not recorded, never as 0; a reason is optional except for the two
  deactivations; reasons run to 240 characters; times are gym-local.
- Eclipse's look (item 1), the frame (item 7), the wording and range rules (items 11, 12), table alignment if you use a
  table (items 9, 16, 23), DO-NOT in full. Every target 44 px. No sideways scroll of the page or the records at any
  width.
- Motion (item 4): complete at first paint; like Reports, no intro and no digit roll.
- Copy: Arabic first, then English, both written for the reader, not translated (`ux-araby` may be loaded for copy;
  it is not a design skill). Propose a wording you think a decision gets wrong in the report; don't build it.

## The whole range (rounds item 7)

Draw every element against its whole range before you settle it: all eleven actions, each actor, a correction with
and without a prior value, a reset, the longest and the shortest reason and none, the widest count figures the
contract allows, dates in the current and the previous year, today and yesterday; the states Loading, Error (first
load), filtered-empty, log-empty, "Show older" working, "Show older" failed, and the end line; AR and EN; and touch on
the phone (filters, "More", the date range as a bottom sheet if it becomes one). Use synthetic data generated from the
contract, about 60 records over several weeks, behind switches for the states (for example `?state=loading`).

## Frames

Render with the worktree's `@playwright/test` at 1440 × 900, 768 × 1024 and 390 × 844 (designed), and check 320 × 568,
1024 × 768 and 200% zoom, AR and EN, over HTTP on 3176 and from `file://`. In `D:/fitway-temp/owner-r04-activity/crops/`,
numbered the same way in both languages: `1-` the page at rest at each designed size; `2-` each state; `3-` the
range cases above, cropped to the element with a strip of its neighbours; `4-` the phone's touch flows step by step;
`5-` the checked sizes. Inspect every frame yourself and judge each element as a whole composition and as one part of
the page; a passing check is not a looked-at frame. (AGENTS.md; DECISIONS item 25 lesson)

Write only under `design-research/owner-composition-exploration-r04/directions/eclipse/` (new `activity.*` files, a
capture script, the rail and bar link in Daily and Reports, a new DESIGN-SPEC §4.3 and INDEX entries for what you
add) and commit there. Do not edit `tuner.js`.

## Report

The composition in a few plain lines and why it answers the owner's question; the record's form at each size and
why; what is lit and why; the Access/Settings arrival; each state in one line; anything that reads wrong at any
width, state or language, said plainly; any decision or rule that made something read wrong, named (WORKING_AGREEMENTS
"Rules and findings"); questions you would have asked the user. The crop folder, the files you changed, the commit
SHA. At most 60 lines.
