<!-- brief-format: v1 role: designer -->
# Designer brief: Access's fix round, the visual part (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. Access's first build is on this branch; the user tried it, left notes, and agreed a skeleton for the
computer. This round builds everything visual those notes ask for. The rest of the fixes (wording, behaviour, links,
spec upkeep) go to a Codex round on top of your commit (DECISIONS rounds item 9), so leave them alone.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `78e0bdf`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 16, 32, 33 and 34 (33 and 34 are this screen; where they differ, the later bullet wins), and
  "How this milestone's rounds run" items 7 and 9; `docs/agent-context/WORKING_AGREEMENTS.md` §"Rules and findings".
  Both files are newer on another branch: read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:<path>`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - The agreed skeleton: `D:/fitway-temp/owner-r04-access-skeleton/REPORT.md`, `skeleton.html` and its PNGs there.
    The user agreed its arrangement ("واضحة ومرتبه"); its "still to decide" list is yours to decide.
  - The first build's review: `D:/fitway-temp/owner-r04-access-review/REPORT.md` (V15 and the row that jumps groups
    are yours; F1-F5 and the 700 ms silence are Codex's).
  - The built page: `design-research/owner-composition-exploration-r04/directions/eclipse/access.html`, `access.css`,
    `access.js`, `access-capture.mjs`, `ACCESS-SPEC.md`; `DESIGN-SPEC.md` §1-§3; navigate with `eclipse/INDEX.md`.
    `activity.js` holds Activity log's synthetic access records.

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
  `ux-araby` may be loaded for copy. A local server uses port 3176 only. Frames and scratch go under
  `D:/fitway-temp/owner-r04-access-fix/`.

## What this round builds, and why

1. **The computer's arrangement, as agreed** (DECISIONS 34, "The skeleton, agreed"): the front desk and the owners
   in one half with each person's actions under the name, and a new «سجل الوصول» card in the other with the latest
   access records and «عرض الكل» to Activity log. Why: at 1440 a row's actions sat about 1000 px from its name and
   half the screen was empty (review V15). Decide what the skeleton left open (the split, the card's count, title and
   states, 721-1023). The card's records are the same records Activity log shows for access (`activity.js`), so the
   owner who follows «عرض الكل» finds what the card promised; an action done on this page appears in it, since the
   log records it. If a record in the card opens its own record, use a URL carrying the record's id and say so:
   Activity log's arrival by id is Codex's, after you.
2. **The owner types the front-desk code** (DECISIONS 34): letters and digits, a minimum length you set and name,
   no generator and no weak-code rule. Its one-time view has a copy control. Why: the user wants a code the desk can
   remember, and a mixed code lowers the risk.
3. **The code changes in two steps, with «إلغاء التغيير»** (DECISIONS 33 and 34): the new code shows while the old
   one keeps working; only «حفظتُ الرمز» makes it take effect and signs the front desk out; «إلغاء التغيير» leaves
   the old code as it was. Why: an accident before saving (a closed browser, a lost connection) must change nothing.
4. **The quiet removal buttons get their box at every size** (DECISIONS 34): «تعطيل الرمز», «تعطيل الحساب». Why: they
   read oddly without one.
5. **A row that is deactivated or reactivated no longer jumps** out of sight among 8 owners with its done sentence
   far from the click (review V15). Why: the owner must see what their action did, where they did it.

Every element you change is drawn against its whole range (rounds item 7) at 1440, 1024, 768 and 390, AR and EN,
and every dialog as the phone shows it. The phone keeps its arrangement; only items 2-5 change it.

## Not yours (Codex's round after you)

The optional reason; the sign-out wording «يُسجَّل خروج» in existing copy; no confirmation on creating a code;
Reactivate's confirmation; emptying passwords on close; the done link to the exact record; Deactivate / Reactivate in
English; one's own password change ending other sessions; F1, F2, F5 and the 700 ms silence; the rail and bar links;
merging `ACCESS-SPEC.md` into DESIGN-SPEC and INDEX. New copy you write for items 1-5 already follows DECISIONS 34
(«يُسجَّل خروج», «السبب (اختياري)»); existing copy you don't touch stays for Codex.

## Hard limits

- Privacy and security: never shown in any state or screen-reader text: a code after its one view, any password once
  submitted, a hash, a session token or list, a staff email. No visitor or per-visitor data. The front desk writes no
  record (ADR-008), so the records card holds owners' access actions only.
- Truthful states: the page never looks live (item 8, D1); the frame's status stays as the frame has it (item 7).
- Eclipse's look (item 1), the frame (item 7), wording and ranges (items 11, 12), DO-NOT in full. Every target 44 px.
  No sideways scroll at any width. Motion (item 4): complete at first paint; a dialog's own open and close only.
- Each change beyond the contract (the typed mixed code, the two-step change, the records card) is named in
  `ACCESS-SPEC.md` as a Product/Spec amendment with what it needs from the contract.

## Files

Write only `access.html`, `access.css`, `access.js`, `access-capture.mjs` and `ACCESS-SPEC.md` under
`design-research/owner-composition-exploration-r04/directions/eclipse/`. Commit there.

## Frames

Render with the worktree's `@playwright/test` at 1440 × 900, 1024 × 768, 768 × 1024 and 390 × 844, and check
320 × 568 and 200% zoom, AR and EN, over HTTP on 3176 and from `file://`. In `D:/fitway-temp/owner-r04-access-fix/crops/`,
numbered the same in both languages: `1-` the page at rest at each size; `2-` each changed element's range cases;
`3-` the code's change step by step (type, one-time view, copy, «حفظتُ الرمز», «إلغاء التغيير») at 1440 and 390;
`4-` deactivate and reactivate among 8 owners, before and after; `5-` the checked sizes. Inspect every frame and judge
each element as a whole on the page; a passing check is not a looked-at frame.

## Report

What you decided from the skeleton's open list and why, in a few lines; each item 1-5 in one or two lines; the
amendments; anything that reads wrong at any width, state or language, said plainly, with the rule that produced it
named; questions you would have asked the user. The crop folder, the files you changed, the commit SHA. At most
50 lines.
