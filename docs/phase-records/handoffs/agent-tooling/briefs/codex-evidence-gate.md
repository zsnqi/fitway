<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: a commit cannot cite a folder that is gone or made by hand, and a designer brief cannot ask for hand-built capture scripts (agent-tooling-r01, round evidence-gate)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-evidence-gate`, branch `tooling-evidence-gate`, HEAD `b7487053`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16,
  20 and 23.
- **Read first, only these:**
  - `lefthook.yml:8-16`: the pre-commit hook, today Biome and the giant-file check only.
  - `scripts/agent-environment/check-staged-giant-files.mjs:17-56`: how a hook job reads what the commit will hold
    from the index (`readIndexFiles`, `readStagedCodeHealthFiles`), never from the working tree.
  - `scripts/verify-repository.mjs:307-344` and `:413`: the citation check inside `pnpm check:repository`, and its
    two messages.
  - `.agents/skills/gardener/cited-evidence.mjs:139-289`: the tracked records, the dead citations, the integration
    base, the changed lines and `auditTempCitations`, with the lost-evidence list (`:14-137`).
  - `.agents/skills/gardener/facts.mjs:153-178`: `pathCitations`, which reads a citation in every form a record
    writes one.
  - `.agents/skills/gardener/cited-evidence.test.ts:1-101` and `.agents/skills/gardener/checkout-test-fixture.mjs`:
    the citation tests and the Git fixture with its temp root.
  - `scripts/agent-environment/run-folder.mjs:33-84`, `scripts/agent-environment/codex-session.mjs:150-160` and
    `scripts/agent-environment/codex-review-launch.mjs:118-130`: the three records a repository tool writes when it
    makes a folder under the temp root (a manifest, a run record, a review record).
  - `scripts/agent-environment/check-brief.mjs:86-127` and `scripts/agent-environment/brief-format.mjs:1-33`: how
    `brief:check` reads a brief's role and masks the shared environment block before reading its prose.
  - `scripts/agent-environment/check-brief.test.ts:1205-1221`: the per-role cases.
  - `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-25.md:114-128`: the real designer
    brief this round's brief rule must refuse.
  - `docs/agent-context/RULE_ENFORCERS.md:1-12` and `docs/agent-context/WORKING_AGREEMENTS.md:131-134`: the table of
    rules and their checks, and the run-folder rule, which has no row yet.
  - `docs/agent-context/briefs/CODE_REVIEW.md`: D1-D8, which the diff is reviewed against.

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

- `<run>` is `codex-round-evidence-gate`, made for you with `pnpm run-folder:new`. Never delete or change anything
  under `D:/fitway-temp` outside the run folder; a test makes its own temp root, as the Git fixture does.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

On 2026-10-31 a commit citing a `D:/fitway-temp` folder that did not exist yet was pushed before anyone ran
`pnpm check:repository`, the folder was then made by hand with no record of who made it or from which brief, and
every public designer brief told the designer to write its own render scripts, so each round wrote about ten. After
this round the commit itself is refused when a line it adds cites a gone folder or a folder made by hand from now on,
the message names `pnpm run-folder:new`, and `pnpm brief:check` refuses a designer brief that asks for hand-built
capture scripts or asks for frames without naming `pnpm verify:owner` (DECISIONS item 23).

## Causes and required outcomes

- **G1.** The pre-commit hook (`lefthook.yml:8-16`) never reads citations, and `pnpm check:repository`, which does, runs
  only when someone runs it; CI cannot run it, since the temp root exists only on this machine
  (`verify-repository.mjs:316-320`). Outcome: a pre-commit job in `lefthook.yml` refuses the commit when a line the
  commit adds (the index against `HEAD`, read from the index as `check-staged-giant-files.mjs` reads it) cites a
  path under the temp root that does not exist, unless the line marks it `(gone: <why>)` or the lost-evidence list
  in the index names it for that record, exactly as `pnpm check:repository` accepts it; and refuses it under G2's
  rule. Unstaged edits never change its verdict. A commit that adds no line to a tracked record (the extensions in
  `TRACKED_RECORD_EXTENSIONS`) passes without reading any. When the temp root does not exist the job prints that
  nothing was checked and passes, as `check:repository` does. A repository with no `HEAD` yet (the first commit)
  is checked against the empty tree. The citation forms are `pathCitations`' own: `D:/fitway-temp/...`,
  `D:\fitway-temp\...`, `d:/FITWAY-TEMP/...`, a bare fitway-temp/ prefix with no drive letter, a folder with or without its trailing slash,
  and a file inside a folder; reuse that reader, the lost-evidence parser and the changed-line reader, so the hook
  and `check:repository` cannot disagree on a line. Check: a new test file under `.agents/skills/gardener/` with the
  Git fixture: one case per form above, each staged on an added line and failing with its record, line and path;
  the same line unstaged passes; a gone path on a staged line marked `(gone: x)` passes; a listed path passes; a
  staged line that only moves an existing gone citation without changing it is still an added line and fails
  unless listed or marked; a commit touching only a `.mjs` file passes without reading records. And
  `lefthook run pre-commit` in a fixture repository whose `lefthook.yml` is this one refuses a staged gone citation
  (or, if Lefthook cannot run in the fixture, a test that runs the job's exact `run` line from `lefthook.yml` there).
  Intent: a gone or hand-made citation is stopped at the commit that writes it, on the only machine that can see
  the temp root.
- **G2.** A folder under the temp root can be made by hand and cited, so a record cannot say who made the folder or
  from which brief (`WORKING_AGREEMENTS.md:131-134` asks for `pnpm run-folder:new`; nothing checks it). Outcome:
  `pnpm check:repository` (on its changed lines, `cited-evidence.mjs:198-217`) and the G1 job (on added lines) fail a
  citation whose path exists inside a folder under the temp root when no folder from the temp root's child down to
  the cited path itself holds a provenance record, and at least one of those folders was created at or after
  2026-11-01T00:00:00+03:00 (the folder's creation time, `birthtime`). A provenance record is one of three files,
  each tied to the folder that holds it: a `manifest.json` shaped as `createRunFolder` writes it (`version` 1, a
  non-empty `for`, a 64-hex `briefSha256`, a 40-hex `commit` this repository holds, a `report` path inside that
  folder) beside a `BRIEF.md` whose SHA-256 is its `briefSha256`; a `run.json` shaped as the launcher writes it
  (`version` 1, a 64-hex `briefSha256`, a 40-hex `head` this repository holds, a `report` path inside that folder);
  or a `review.json` shaped as the brief review writes it (a 64-hex `sha256` and a `status`) beside a `brief.md`
  whose SHA-256 is its `sha256`. A file of that name that is not valid JSON, lacks a field, or fails its tie (a
  record copied from another folder, a brief edited after the record) is not a record; a `manifest.json` written by
  `pnpm verify:owner` (it has `command` and `checkout`) is not one. The rule stops the habit of making folders by
  hand; a record forged on purpose to pass it is outside what a check can see. A file directly under the temp root (such as
  `D:/fitway-temp/codex-accounts.mjs`) is not inside a run folder and is not judged by this rule. A gone citation is
  judged by G1's rules only. Folders whose every level was created before the cutoff are accepted, and the check
  prints how many citations it accepted that way. The failure names the record, line, path and the folder that
  lacks a record, says it was made after the cutoff with no provenance record, and names the fix for an existing
  folder: make a new run folder with `pnpm run-folder:new <name> --brief <file> --for <who>`, move the evidence
  into it and cite the new folder (`createRunFolder` refuses a folder that exists). Check: in the G1 test file and in
  `.agents/skills/gardener/cited-evidence.test.ts`, with folders made in the fixture's temp root and their creation
  time read through an injectable stat so the cutoff can be tested on either side: a folder made after the cutoff
  with no record fails; the same folder with each of the three records passes; with each record malformed
  (missing field, wrong length, not JSON) fails; each record copied into a second folder fails there; a
  `manifest.json` whose `BRIEF.md` was edited after it fails; a `commit` or `head` the repository does not hold
  fails; a `pnpm verify:owner` `manifest.json` fails; a nested folder made
  after the cutoff inside a container made before it (as a review folder named x-sol inside brief-review) with no
  record fails, and inside one with a record passes; a folder whose levels all predate the cutoff passes and is counted; a cited file directly
  under the temp root passes. Intent: from the rule's first day a folder a record cites says who made it, from
  which brief and commit, while the evidence already on disk stays citable.
- **G3.** The two failure messages (`verify-repository.mjs:330-341`) do not name the tool that prevents the commonest
  case: a run folder cited before it was made. Outcome: the gone-citation message of `check:repository` and of the
  G1 job names `pnpm run-folder:new <name> --brief <file> --for <who>` as the fix for a run folder not made yet,
  beside the three fixes it names today, with `<name>` filled in as the cited folder's name when the citation lies
  inside a folder directly under the temp root (the brief and the owner stay placeholders: no check can know them),
  and G2's message names its fix as G2 says. Check: the G1 and G2 tests assert, for a citation of
  `<temp root>/new-run/REPORT.md`, the text `pnpm run-folder:new new-run --brief <file> --for <who>` in the gone
  message, and the G2 fix text in G2's. Intent: the agent who reads the failure is told the command that fixes it.
- **D1.** `brief:check` reads a designer brief's format and references, never what it asks the designer to do, so
  `designer-public-sketch-25.md:114` ("Render with node scripts in the run folder in the style of ...") passed.
  Outcome: `pnpm brief:check` fails a brief whose format role is `designer` when its text, outside the shared
  environment block, holds any of these, in any case: `node script` or `node scripts`; `capture script`,
  `render script`, `rendering script`, `screenshot script`, `sheet script` or `frame script`, each also plural;
  `your own script` or `your own scripts`; `write a script`, `that you write` or `you write yourself`;
  `in the style of` followed on the same line by a `D:/fitway-temp/` or
  `D:\fitway-temp\` path; `playwright` (which also catches `@playwright/test` and `Playwright's`). It also fails such
  a brief when its text outside that block holds `render`, `renders`, `rendered`, `rendering`, `capture`,
  `captures`, `captured`, `screenshot`, `screenshots`, `frame`, `frames`, `sheet` or `sheets` as a word and does not
  hold `pnpm verify:owner` followed by the name of one of its registered commands (`frames`, `sheet`, `drive`,
  `compare`, `measure`, `run` and the rest the tool registry lists). The text includes fenced code and inline code. Each failure names its line, the phrase,
  and the fix: render with the `pnpm verify:owner` commands that `.agents/skills/verify-fitway/SKILL.md` names. A
  brief with another role is not judged by D1. Check: in `scripts/agent-environment/check-brief.test.ts` or a new
  test file beside it: the real `designer-public-sketch-25.md` text as a fixture role `designer` fails naming line
  114's phrase; one case per phrase above fails and the same text with role `builder` passes; a designer brief that
  says "Render the frames with `pnpm verify:owner frames`" and names no other phrase passes, and one naming only
  `pnpm verify:owner` with no command fails; a designer brief whose
  only mention of Playwright is inside the shared environment block passes; a designer brief that asks for no
  frames and names no command passes. Intent: the coordinator cannot launch a designer who is told to build its own
  capture tools out of habit; a brief worded on purpose to evade a phrase list is left to the brief's reviews.
- **D2.** `brief:check` runs only when someone runs it, and a designer is launched by the coordinator, not by the
  launcher that runs it for Codex. Outcome: the G1 pre-commit job (or a second job in `lefthook.yml`) reads each
  staged file whose staged first line is `<!-- brief-format: v1 role: designer -->` and refuses the commit with
  D1's message when the file is new to the commit (`--diff-filter=A`) and fails D1, or when the commit modifies it
  and a line it adds holds one of D1's refused phrases. It applies none of `brief:check`'s other rules, and a
  modified brief is not judged on lines the commit leaves alone or on the command it names. Check: in the G1 test
  file: a staged new designer brief holding `node scripts` fails; the same brief already committed and then
  modified on another line passes; a committed clean designer brief modified to add `node scripts` fails; a staged
  new `role: builder` brief holding it passes. Intent: no commit adds an instruction to hand-build capture scripts
  to a designer brief, without failing the frozen records of past rounds on an unrelated edit.
- **R1.** The run-folder rule has no row in `docs/agent-context/RULE_ENFORCERS.md`. Outcome: the table gains a row for
  `WORKING_AGREEMENTS.md`'s run-folder rule, naming the G1 job and `pnpm check:repository` with what they check and
  what they do not (the cutoff; files directly under the temp root), and the rule rows the header asks to change
  are changed. Check: `pnpm check:agent-context` passes. Intent: the next coordinator finds the check beside the rule.
- **K1.** Everything else stays: every existing test in the files this round touches passes unchanged, including the
  eight cases of `cited-evidence.test.ts` and the role cases of `check-brief.test.ts`; `pnpm check:repository` passes
  on the result in this worktree, and so does `pnpm brief:check` on
  `docs/phase-records/handoffs/agent-tooling/briefs/codex-lease-ends.md` against its own worktree. The Biome and
  giant-file jobs in `lefthook.yml` stay as they are. `pnpm verify:fast` passes after the commit. CI runs the tests on
  Windows without the temp root, Playwright Chromium or ui-forensics, from a checkout of the pushed commit alone
  (`.github/workflows/checks.yml`), so no test depends on `D:/fitway-temp` or on the date it runs.
- **K2.** No check, ratchet, test floor or limit is loosened, and no file under a dated giant-file exception
  (`check-brief.test.ts` is one) grows; new cases go in new test files beside it. Raised floors and any fall are
  recorded with `pnpm code-health:baseline`, each named in the commit message; `pnpm check:tooling-map` passes
  (regenerate with `pnpm map:tooling`).
- **T1.** The hook runs on every commit on this machine. Outcome: on this worktree, a commit of one changed `.md`
  record that adds one citation line spends at most 10 s in the new job(s), median of three runs with each run's
  time reported (B13); the rest of `lefthook.yml` is not timed. Intent: the gate is cheap enough that nobody is
  tempted to skip it.

## Scope

You may change `lefthook.yml` (must change, its pre-commit jobs only), `scripts/verify-repository.mjs` (must
change), `.agents/skills/gardener/cited-evidence.mjs` (must change) and `.agents/skills/gardener/facts.mjs`,
new modules and test files under `scripts/agent-environment/` and `.agents/skills/gardener/`,
`scripts/agent-environment/check-brief.mjs` (must change), `scripts/agent-environment/check-staged-giant-files.mjs`
(to share its index reader), `.agents/skills/gardener/cited-evidence.test.ts`,
`docs/agent-context/RULE_ENFORCERS.md` (must change), and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and
`docs/agent-context/CODE_HEALTH_BASELINE.json` (both regenerated). Commit once when done. Everything else is
read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it: the index reader is `check-staged-giant-files.mjs`'s, the citation reader is `pathCitations`, the
changed lines are `changedLineNumbers`', the lost-evidence list is `parseLostTempEvidence`, the Git fixture is
`checkout-test-fixture.mjs`, and the brief's prose is masked as `checkBrief` masks it. Your diff is reviewed against
`docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of G1, G2, G3, D1, D2, R1, K1, K2 and T1. A PASS command must
match a command started after the last edit inside the worktree, and its output must be one line the command printed.
Outside the block, also list the files you changed and anything you could not do.
