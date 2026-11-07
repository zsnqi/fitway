<!-- brief-format: v1 role: verifier -->
# Verifier brief: Access, first build (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md) This review
covers reading direction too; there is no separate reading-direction review for this round.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-access`, branch `owner-r04-access`, HEAD `2fa0792`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 32 and 33, and "How this milestone's rounds run" item 7; read them with
  `git -C D:/Projects/fitway-worktrees/owner-r04-access show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - `design-research/owner-composition-exploration-r04/directions/briefs/designer-access.md`: the brief the build
    answered (its hard limits are your baseline).
  - `packages/api/src/access/contracts.ts`, `packages/api/src/access/procedures.ts`, `packages/auth/src/access.ts`:
    the real contract and its refusals.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §1, §2, §3.5, §3.9, §3.10,
    §3.11, §3.12 and §3.14 by row ID. Navigate code with
    `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/ACCESS-SPEC.md` (the implementer's spec
    fragment) only after your own result is recorded, to check for a constraint you missed.

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

- Write only in `D:/fitway-temp/owner-r04-access-review/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5) A local server uses port 3178 only. Render with the worktree's `@playwright/test`; do not
  reuse the implementer's crops as evidence, take your own.

## What was delivered

`e460e2d..2fa0792`: a new Access page (`access.html`, `access.css`, `access.js`, `access-capture.mjs`,
`ACCESS-SPEC.md` in `design-research/owner-composition-exploration-r04/directions/eclipse/`). Its states are
reachable by URL switches in `access.js`. The rail and bar links from the other pages are wired at integration, not
here.

**Already known; do not report as findings:** Daily, Reports and Activity log do not link to Access yet; INDEX.md does
not list `access.js`; the Impeccable detector's halo and stripe flags come from the shared sheets; Activity log at
`e72e5fe` shows English owner names (fixed on another branch).

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | Never shown in any state, DOM, URL, storage or screen-reader text: a PIN after its one view, a password after submit, a hash, a session token or list, a staff email; no visitor data | code, DOM and storage after each flow |
| V2 | DECISIONS 33 in full: the one-time view (no copy control; closes only by its explicit action, not Escape or a tap outside), the confirmation before changing the PIN, a required reason (at most 240) before either deactivation, the create and reset fields, the own row, "Change my password", deactivated owners with Reactivate, the done sentence with its log link, a refusal keeping the form | frames and code per item |
| V3 | True to the contract: every refusal it can return has its own sentence; the actions and fields match it; anything beyond it is named as an amendment | code against the contract files, frames |
| V4 | The page never looks live and lights nothing a non-live state should not (item 8) | frames, code |
| V5 | Every state (loading, first-load error, PIN never set, active, deactivated, one owner, several, deactivated owners, each action's confirmation, working, done and refusal) keeps the layout and follows the STA/EMP rows | one frame per state, 1440 and 390, AR and EN |
| V6 | No sideways scroll at 1440, 1024, 768, 390, 360, 320 and 200% zoom, AR and EN, with the longest name and email | `scrollWidth` measurements |
| V7 | Every interactive target is at least 44 x 44 at every size | measured boxes |
| V8 | Keyboard: Tab order, FOC-1 focus everywhere, initial focus in each dialog, focus after done and after a refusal, Escape where it is allowed | key-by-key log |
| V9 | Touch at 390 and 320 with touch emulation: every dialog as a sheet works and nothing ends up under the bottom bar unreachable | frames per step |
| V10 | Reading direction: Arabic reads natively right to left and English left to right; Latin emails, the PIN's digits and names in the other script each read right | frames, measured edges |
| V11 | Wording: natural Arabic and English, DO-NOT and items 11-12 kept | rendered text |
| V12 | Motion (item 4): complete at first paint, no intro, no digit roll; only a dialog's own open and close move | first-paint frame, code |
| V13 | No file outside the five new ones changed | `git diff --stat e460e2d 2fa0792` |
| V14 | The page works from `file://` and over HTTP | frames from both |
| V15 | Each element read as a whole composition and as part of the page, not only against its rule, at 1440 as much as on the phone (item 25 lesson) | frames, your judgement |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity (high, medium, low); what you could not run and why; anything that reads or behaves wrong though it passes
its check or meets its rule, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"); the
evidence folder. At most 50 lines.
