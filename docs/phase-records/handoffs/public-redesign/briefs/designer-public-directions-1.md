<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, first directions (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010 for the public page, ADR-009 for the
Owner pages it sits beside): the superseded Public Paper frames and canonicals are reference only. This round shows the
user options and stops; the next round builds the pick.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `adabebff`
- **Milestone:** `public-redesign-r01`. Decisions: `docs/phase-records/handoffs/public-redesign/DECISIONS.md` items 1-2;
  `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 84, 90, 98, 99.
- **Read first, only these:**
  - `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 90: the user's answers for this page.
  - `FITWAY_PRODUCT.md` §"Information hierarchy" and §"Operational states": what the page answers, in order, and its six states.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", §"6. Public state grammar" and §"10. Interaction and motion": the level mark's rules, the states, the digit roll.
  - `SPEC.md` §"Interfaces & Contracts", the public payload's fields only: what the page may show.
  - `docs/adr/ADR-010-public-composition-authority-supersession.md` §"What remains binding".
  - The family's sheet, `DESIGN-SPEC.md` §1 and §2, in its parts: `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-02-foundations-1-9.md` §"1. Shared foundations (Owner, Staff and Public)", `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-03-foundations-10-11.md` (1.10 and 1.11) and `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md` §"2. Content rules".
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`, in full.

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

- `<run>` is `public-redesign-r01-directions-1`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. (AGENTS.md)

## The open question

What the public crowd page looks like as a member of the Eclipse family. The old page's design is set aside (r04 item
90: the user called it bad; ADR-010), and its 28-bar signal and oxblood atmosphere are not carried over. Its order is
fixed by `FITWAY_PRODUCT.md` §"Information hierarchy" and its states by `DESIGN_GUIDE.md` §6; what is open is the
composition within that order, the form of the level mark that replaces the 28 bars, where the lights fall, and how
the page reads at a glance on a phone. The user picks by eye (r04 item 99: no grey skeleton first).

## Constraints

- r04 item 90 and the amended lines its item 98 applied, in full; the points most easily missed: dark; Readex Pro;
  the count's label «داخل الصالة الآن · تقريبًا» / "Inside now · approx." (GLO-2); Packed «شديد الازدحام»; no verdict
  line; no typical-day chart; the frame is the brand, the language switch, the gym's name as fixed text, and
  «إعادة المحاولة» in the error state only (no Owner rail, bar or header); the last update absolute while live and
  absolute with its age when stale.
- The level mark: `DESIGN_GUIDE.md` §5's rules for whichever form (from `band` only, the written label always visible,
  reading direction, one accessible name, decorative parts hidden, no numeric ARIA, no green, yellow or orange
  categorical meter). Each option carries its own form; Eclipse's four-bar badge with its word (CHP-5) is one
  candidate among them, not the default.
- Motion: no canvas, WebGL, `requestAnimationFrame` loops or video; digits roll only when a new live reading arrives
  (`DESIGN_GUIDE.md` §10), never on opening; `DO-NOT.md`'s cross-fade rule holds. An option whose idea depends on its
  motion records one short real-time clip of it; the rest is decided after the pick.
- The capacity-free contract: no capacity, percentage, history, member data or diagnostics (`SPEC.md` §"Interfaces &
  Contracts"). Synthetic data only: the count `37` (`FITWAY_PRODUCT.md` §"Devices, language, and content" names it a
  fixture), a band, a last update in gym time; the gym's name the same synthetic name the Owner concept uses if it
  shows one, otherwise a placeholder marked synthetic in the report.
- Eclipse's shared sheet (`DESIGN-SPEC.md` §1, §2) is reused as it is: no new tokens, no edit to any Owner file.
- The demo's state switch stays hidden (a query parameter, as the Owner pages' review switches are), concept only.

## Deliverable

Two or three genuinely different options, each rendered as a real page, `public.html` with `?option=a|b|c` (one
set of files: `public.html`, `public.css`, `public.js`), at 390 x 844 first and then 1440 x 900, Arabic and English, in
three states: fresh, stale and closed. Number every crop the same way across options so the user can compare them.
No recommendation is needed; say where an option breaks. Also check each option at 320 px and at 200% zoom for
sideways scroll and clipped text, and say what broke.

Write options only under `design-research/owner-composition-exploration-r04/directions/eclipse/` in those three files;
commit when done. Render the frames with verify-fitway's `run`
(`.agents/skills/verify-fitway/SKILL.md` §"Run one check"), which owns the preview, the browser and a fresh context
per frame: one script in `D:/fitway-temp/<run>/`,
run with `--concept` set to this worktree's Eclipse folder and `--out` inside the run folder, opening `public.html`
through `url("build", ...)` with `newPage` at the sizes `phone` (390 x 844), `desktop` (1440 x 900), `narrow`
(320 px) and `zoom` (200%). No capture script goes in the repository (agent-tooling DECISIONS item 17, finding 1). The
320 px and 200% zoom check is `page.evaluate(overflowProbe)` from
`design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/lib.mjs`, with
`PROBE_OUT` set to the run folder. It reports the sideways scroll as `hScroll` and every clipped or spilled text;
none is expected. (agent-tooling DECISIONS item 16)

## Report

Per option: one line on the idea, its frame paths, and where it breaks. Any rule or decision that makes an option
read wrong, named (WORKING_AGREEMENTS "Rules and findings"). The files you changed; the commit SHA. At
most 40 lines.
