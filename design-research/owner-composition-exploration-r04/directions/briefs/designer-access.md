<!-- brief-format: v1 role: designer -->
# Designer brief: Access, the whole screen in one pass (owner-design-exploration-r04)

For a fresh `owner-direction-designer-max` (Opus, max), the second screen after Activity log's successful trial (r04
DECISIONS item 32, "How this milestone's rounds run" item 6). Concept-only (ADR-009): superseded Owner Paper frames
are reference only. This round designs and builds one version of the screen; a review follows, then the user sees
it. No options round: decide the composition yourself and say why.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-access`, branch `owner-r04-access`, HEAD `e72e5fe`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 16, 23, 32 and 33 (33 is this screen), and "How this milestone's rounds run" items 6 and 7;
  `docs/agent-context/WORKING_AGREEMENTS.md` §"Rules and findings". Both files are newer on another branch: read
  them with `git -C D:/Projects/fitway-worktrees/owner-r04-access show codex/owner-redesign-r04:<path>`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - `D:/fitway-temp/owner-r04-access-questions/REPORT.md`: the research digest (contract, refusals, conflicts, file
    pointers). Its section 6 recommendations are a researcher's, not decisions: DECISIONS item 33 holds what the user
    decided, and everything else in it is yours to judge. Where it says Arabic ranges take a hyphen, DECISIONS item 12
    (the en dash) wins.
  - The real contract, so the synthetic data and the refusals are true to it: `packages/api/src/access/contracts.ts`,
    `packages/api/src/access/procedures.ts`, `packages/auth/src/access.ts`, and the refusal sentences the digest
    cites; `SPEC.md` story 25 and the access and secret lines the digest cites.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §1, §2, §3 and §4.3
    (Activity log, the nearest sibling). Navigate code with
    `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; `activity.html`, `activity.css`
    and `activity.js` are the closest working example of the frame, the dialogs and the states.

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
- A local server uses port 3177 only (3176 is another writer's). Frames and scratch go under
  `D:/fitway-temp/owner-r04-access/`.

## The question

Access is a dead rail item. Design and build the owner's Access screen as one finished screen in Eclipse's language:
the owner opens it to see who can get in and to change that safely — the one shared front-desk PIN and the owner
accounts — and trusts that nothing secret is exposed and nothing irreversible happens by accident.

The user's answers are DECISIONS item 33: the one-time PIN and how its view closes; a confirmation before changing
the PIN; a confirmation with a required reason before either deactivation; the create and reset fields; the owner's
own row; "Change my password", added beyond the contract; deactivated owners in the same list with "Reactivate"; the
done sentence with its link to Activity log and the kept form on a refusal. Everything else is yours: the page's
composition, what each person shows, where actions sit, the form of every dialog, what if anything is lit, and the
destructive actions' look. Access is Eclipse's first screen with destructive actions and secrets; any new component
it needs (a confirmation with a reason, a secret's one-time view, a password field) is designed here for every later
screen.

## Hard limits

- Privacy and security: never shown anywhere, in any state or screen-reader text: a PIN after its one view, any
  password once submitted, a hash, a session token or session list, a staff email (`SPEC.md` lines the digest
  cites). No visitor or per-visitor data. The PIN is generated by the system, never typed.
- Truthful data: synthetic data generated from the contract. Owners «فهد» (the signed-in owner) and «نورة», one stored
  name each, shown the same in Arabic and English (DECISIONS item 32), plus a deactivated owner; Latin emails. The
  front desk writes no record (ADR-008), so nothing links to a front-desk history. A reason runs to 240 characters
  (item 33). Each refusal the contract can return has its own sentence.
- "Change my password" and any other addition beyond the contract: list each in the report and in the spec fragment
  as a Product/Spec amendment, with what it needs from the contract (for example the current password).
- The page never looks live (item 8, D1); the frame's status stays as the frame has it (item 7).
- Eclipse's look (item 1), the frame (item 7), the wording and range rules (items 11, 12), DO-NOT in full. Every
  target 44 px. No sideways scroll at any width. Motion (item 4): complete at first paint, no intro, no digit roll;
  a dialog's own open and close only.
- Copy: Arabic first, then English, both written for the reader, not translated (`ux-araby` may be loaded for copy;
  it is not a design skill). Propose a wording you think a decision gets wrong in the report; don't build it.

## The whole range (rounds item 7)

Draw every element against its whole range before you settle it: the PIN never set, active and deactivated; its
one-time view at every size; one active owner (the last), several, and deactivated ones; the longest and shortest
names and emails, Arabic and Latin names; every action's confirmation, working, done and each refusal; a long reason
at 240 characters; the states Loading and Error (first load); AR and EN; and touch on the phone (every dialog as the
phone shows it). Put the states behind switches (for example `?state=loading`).

## Frames

Render with the worktree's `@playwright/test` at 1440 × 900, 768 × 1024 and 390 × 844 (designed), and check 320 × 568,
1024 × 768 and 200% zoom, AR and EN, over HTTP on 3177 and from `file://`. In `D:/fitway-temp/owner-r04-access/crops/`,
numbered the same way in both languages: `1-` the page at rest at each designed size; `2-` each state; `3-` the range
cases above, cropped to the element with a strip of its neighbours; `4-` the phone's flows step by step (every
dialog); `5-` the checked sizes. Inspect every frame yourself and judge each element as a whole composition and as
one part of the page; a passing check is not a looked-at frame. (AGENTS.md; DECISIONS item 25 lesson)

## Files

Another writer is editing the shared files on another branch at the same time, so write only new files under
`design-research/owner-composition-exploration-r04/directions/eclipse/`: `access.html`, `access.css`, `access.js`,
`access-capture.mjs`, and `ACCESS-SPEC.md`, the spec fragment the coordinator merges as DESIGN-SPEC §4.4 (rows in
DESIGN-SPEC's form, with new component rows marked for §3). New shared components live in `access.css` for now; say
which belong in `style.css` and the component sheet. Do not edit `style.css`, `DESIGN-SPEC.md`, `INDEX.md`,
`tuner.js`, or any other page; the coordinator wires the rail and bar links at integration. Commit there.

## Report

The composition in a few plain lines and why it answers the owner's question; each new component and why; what is
lit and why; each state and action in one line; the amendments beyond the contract; anything that reads wrong at any
width, state or language, said plainly; any decision or rule that made something read wrong, named (WORKING_AGREEMENTS
"Rules and findings"); questions you would have asked the user. The crop folder, the files you changed, the commit
SHA. At most 60 lines.
