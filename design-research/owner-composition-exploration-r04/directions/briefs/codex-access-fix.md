<!-- brief-format: v1 role: codex -->
# Codex brief: Access's fix round, the rest after the designer (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `a0c6c76`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 8, 11, 12, 32, 33 and 34 (where they differ, the later bullet wins), and "How this milestone's rounds run"
  item 9. That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); the designer's report `D:/fitway-temp/owner-r04-access-fix/REPORT.md` and the first build's review
  `D:/fitway-temp/owner-r04-access-review/REPORT.md` (findings F1-F5 and V15); in the folder below, `ACCESS-SPEC.md`
  in full and `DESIGN-SPEC.md` §4 (its §4.3, Activity log, is the form §4.4 follows). Navigate code with
  `INDEX.md`. "The folder" below is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- Your temp folder is `D:/fitway-temp/owner-r04-access-codex/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output
  (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it: request escalation for them from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `access.html` (Access), `activity.html` (Activity log),
  `index.html` (Daily) and `reports.html` (Reports), each from `file://` and over HTTP, at 1440, 1024, 768, 721, 720,
  390 and 320 px, AR (`?lang=ar`, the default) and EN, with and without reduced motion. Phone checks run in a touch
  context (`hasTouch`, `isMobile`) at 390 × 844 and 320 × 568. Access's states and refusals sit behind its query
  switches (`access.js` header comment). Use port 3176 only.
- Render every baseline from your own `git archive a0c6c76` of the folder in your temp folder.

## Goal

DECISIONS items 33-34 and the first build's review, for everything in Access that has no taste in it: wording,
behaviour, links, focus, and the specification. The designer built the visual part at `a0c6c76`; its look and
arrangement stay as they are.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Where a cause names a file and line, it is the coordinator's reading at `a0c6c76`: confirm it before you act.

- **A1. The reason is optional** (DECISIONS 34). Cause: both deactivations refuse an empty reason (`access.js:1380`,
  `:1495`, the `reason_required` refusals at `:181`, `:331`, `:1146`, `:1148`). Intent: the owner may deactivate
  without writing why, and may still write up to 240 characters. Outcome: the field's label reads «السبب (اختياري)» /
  "Reason (optional)"; an empty or blank reason deactivates as a filled one does, and its record carries no reason;
  the 240 cap and the remaining-characters line stay as they are; no `reason_required` sentence or switch remains.
- **A2. «دخول» means visitors' entries here** (DECISIONS 34, review F4). Cause: «ينتهي دخول …» at `access.js:117`,
  `:146`, `:150`, `:155`, and any other Access sentence saying a person's or the desk's «دخول» ends. Intent: the owner
  reads that the person or the desk is signed out, in the wording the designer's new sentence already uses
  («يُسجَّل خروج …»). Outcome: no Access sentence uses «دخول» for a session; each says who is signed out and when, in
  the same form; the English sentences say the same thing in plain English (review F4: "Your password is changed."
  and "this can't be applied to it" read stiff).
- **A3. Reactivating asks first** (DECISIONS 34). Outcome: as built, verify only: «إعادة التفعيل» opens a
  confirmation that says the account works again at once with its old password, and nothing changes until it is
  confirmed. If it does not, make it so.
- **A4. A password is emptied when its dialog closes** (review F2). Cause: `closeDialog` (`access.js:888`) never
  empties fields; only the openers do. Intent: no password stays in the page after its dialog closes, by any way
  out. Outcome: after a refused submit, closing by Cancel, the close control, Escape or a tap outside leaves every
  password field in that dialog empty and masked; a refusal with the dialog still open keeps what was typed (DECISIONS
  33: the form is kept).
- **A5. The done link opens the exact record** (DECISIONS 34, AMD-C2, review F3). Cause: the done sentence links to
  `LOG_HREF` (`access.js:455`, `:690`), the access filter; Activity log ignores `record=`. The records card already
  links `activity.html?kind=access&record=<id>` (`access.js:772`). Intent: the owner who follows a link from Access
  lands on that one record. Outcome: the done sentence links to the record its action wrote; Activity log, opened with
  `record=<id>`, shows that record in view and marked as the one arrived at, with focus on it for keyboard and screen
  reader, at every size; an id the log does not hold (a record written on Access in this session, ids from 57, since
  each page keeps its own synthetic data) shows Activity log's access records with one plain sentence that the
  record is not in this sample. Nothing else about Activity log's arrival without `record=` changes.
- **A6. One set of words for the same records on both pages** (DECISIONS 34: Deactivate / Reactivate, and the code may
  hold letters; designer's report, "What reads wrong"). Cause: Activity log still says "PIN" and "turned off"
  (`activity.js:162-166`, `:256`, `:280`), and its reset record reads «إعادة تعيين بيانات دخول …» (`activity.js:85`)
  while Access says «أُعيد تعيين كلمة مرور …» and links that record from its card. Intent: an owner moving between the
  two pages reads one name for each action. Outcome: Activity log's English uses "code" and Deactivate / Reactivate
  as Access does, the synthetic reasons' English included; the reset record reads «إعادة تعيين كلمة مرور …» on both
  pages; every access record's words in Access's card equal Activity log's for the same id.
- **A7. The deactivated owner has records** (designer's report). Cause: Omar Alharbi is deactivated on Access
  (`access.js:372`) but no record in Activity log adds or deactivates him. Intent: the synthetic data stays
  truthful: what the page shows happened is in the log. Outcome: Activity log holds his account's creation and its
  deactivation by an owner, older than the card's eighth record so the card's eight stay the same; every id Access
  links (`RECORDS0`, `access.js:408-412`, and `nextRecordId`) is still the id Activity log gives the same record.
- **A8. The review's remaining lows.** F1: the card alert takes focus with no visible ring (`access.css:174` beats
  `:169`); outcome: every element that takes focus programmatically shows the ring. F5: a 401 mid-action (one's own
  session ended elsewhere) has its own sentence that says the owner is signed out and how to sign in again, instead
  of the generic failure; add a query switch for it beside the other refusals. The 700 ms silence: after «حفظتُ الرمز»
  and every other submit, the owner sees within one frame that it is working; verify only, fix if not.
- **A9. Access is reachable** (DECISIONS 34). Cause: the rail and bar items for Access are inert on Daily, Reports and
  Activity log (`index.html:75`, `:265`; `reports.html:77`, `:280`; `activity.html:75`, `:223`). Outcome: each opens
  `access.html`, keeping the language as those pages' other links do.
- **A10. The specification follows.** Outcome: `ACCESS-SPEC.md`'s rows are merged into `DESIGN-SPEC.md` as §4.4 in
  §4.3's form, new component rows placed in §3 as ACCESS-SPEC marks them, and `ACCESS-SPEC.md` removed; every
  Product/Spec amendment the concept makes (AMD rows, the optional reason, the typed code, the two-step change, the
  records card, the copy control, Change my password) is listed once in one place §4.4 names; rows describe what is
  built after A1-A9. INDEX.md is regenerated with the command written at its top and lists `access.js`.

## Limits the result keeps

- **L1.** Access's frames equal `a0c6c76` at every size, AR and EN, apart from the words A1, A2 and A6 change, the
  focus ring A8 adds, and the states A5 and A8 add. Its arrangement, spacing and components are unchanged.
- **L2.** Daily's and Reports' frames equal `a0c6c76` apart from the Access link's target.
- **L3.** Activity log's frames equal `a0c6c76` without `record=`, apart from A6's words and A7's two records.
- **L4.** Privacy (DECISIONS 33): no code after its one view, no password once submitted, no hash, session or staff
  email appears anywhere, screen-reader text and URLs included.
- **L5.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs` and `node tools/build-index.mjs --check` pass as at
  `a0c6c76` or better (a check that fails at `a0c6c76` is reported, not fixed); `node --check` passes on every `.js`
  and `.mjs` in the folder; `access-capture.mjs`, `activity-capture.mjs` and `states-capture.mjs` report no failures
  that `a0c6c76` does not.
- **L6.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

You may change, in the folder: `access.html`, `access.css`, `access.js`, `access-capture.mjs`, `activity.html`,
`activity.css`, `activity.js`, `activity-capture.mjs`, `index.html`, `reports.html`, `DESIGN-SPEC.md`, `INDEX.md`,
and remove `ACCESS-SPEC.md`; commit once when done. Everything else is read-only (`style.css` and `tuner.js`
included). Add no dependencies. Do not redesign: anything visual these outcomes need beyond words, a focus ring and
one sentence's place (a new layout, a component, a colour) is reported, not decided. If an outcome cannot be met, do
not work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome (A1-A10, L1-L6) as PASS or FAIL with the command and the output line that proves it; crops in
`D:/fitway-temp/owner-r04-access-codex/crops/`, numbered the same in both languages: each changed sentence in place at
1440 and 390; the deactivate dialog empty and confirmed; Activity log arrived at a record by id and at an unknown id,
at 1440, 768 and 390; the 401 sentence; the focus ring on the card alert; every frame that differs from `a0c6c76` and
why; the files you changed; the commit SHA; anything you could not do; anything an outcome or decision produces that
reads wrong, with the decision named.
