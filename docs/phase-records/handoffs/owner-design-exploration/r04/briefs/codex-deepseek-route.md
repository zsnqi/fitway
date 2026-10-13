<!-- brief-format: v1 role: codex -->
# Codex brief: rounds on DeepSeek V4.1 Flash through Open Design (owner-design-exploration-r04, deepseek-route)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-deepseek-route`, branch `owner-r04-deepseek-route`, HEAD `4a151786`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` item 7.
- **Read first, only these:**
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation" (the entries dated 2026-10-13);
  - `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md` §"Evaluation: DeepSeek for the brief review (2026-10-13, the user asked for the trials)";
  - `scripts/agent-environment/codex-round.mjs` lines 25-45, 198-230, 359-460, 503-591, 675-743 and 759-886;
  - `scripts/agent-environment/codex-round.test.ts` lines 449-745 and 1021-1233 (the review, launch and resume tests);
  - `docs/agent-context/briefs/REVIEW.md`, whole;
  - `D:/fitway-temp/opendesign-smoke/route-args.txt` and `D:/fitway-temp/opendesign-smoke/catalog.json` (read-only).

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- You yourself run on DeepSeek V4.1 Flash through Open Design, launched by hand with the argument set D2 names.

## Goal

`pnpm codex:round` launches, resumes and reviews rounds on DeepSeek V4.1 Flash through Open Design at `max` when no
model or level is given, and on GPT-6.1 Sol when asked, and every run folder records the model and level that ran.

## Causes and required outcomes

- **D1. The model is fixed.** `codex-round.mjs:25` names only `gpt-6.1-sol`, `:26` allows `medium`, `high` and
  `xhigh`, and resume refuses any other recorded model (`:675-715`). Outcome: a launch takes the model as an option
  whose accepted values are `deepseek-v4.1-flash` (the default when none is given) and `gpt-6.1-sol`; GPT accepts
  `medium`, `high`, `xhigh` and `max`, DeepSeek `high` and `max`, and a DeepSeek launch with no level runs at `max`; any other model, or a level its model does not
  accept, stops before Codex starts and names the accepted values; the run folder records the model and level, and
  `resume` uses the recorded ones without being told. Intent: the user moved Codex's rounds to DeepSeek at max; going
  back to GPT is one argument, and a resumed run never changes model.
- **D2. DeepSeek needs its route on every call.** The coordinator's runs on 2026-10-13 showed that Open Design refuses
  a request carrying Codex's web search tool ("unsupported Responses tool type web_search"), that with no catalog
  entry Codex gives DeepSeek no patch tool, so it rewrote whole files through PowerShell, and (in the first run of
  this round) that a hook message Codex places between a tool call and its result makes Open Design refuse the request
  ("must be followed by tool messages"); hooks stay on in GPT runs and in the user's own configuration. The arguments that worked are
  `D:/fitway-temp/opendesign-smoke/route-args.txt` (read-only). Outcome: every `codex exec` the launcher starts for
  DeepSeek (launch, resume and review) carries those arguments, its `model_catalog_json` naming the catalog D3 wrote
  into that run's folder for that call; a GPT run carries none of the set, and its arguments are otherwise exactly
  today's. Intent: a DeepSeek round edits with Codex's patch tool and is never refused for a tool Open Design lacks;
  GPT runs do not change.
- **D3. The catalog.** Codex 0.162.1 has no metadata for this model. `model_catalog_json` needs a full entry, and the
  fields Codex requires (`model_messages.instructions_template`, `available_access_programs.cyber`;
  `apply_patch_tool_type` accepts only `freeform`) exist in Codex's own cache, `<CODEX_HOME>/models_cache.json`
  (default `~/.codex`). Outcome: before each DeepSeek launch, resume or review the launcher writes the catalog into
  that run's folder from the cache's `gpt-5.5` entry, and from today's cache its model entry deep-equals the one in
  `D:/fitway-temp/opendesign-smoke/catalog.json` (read-only: the values the coordinator proved); the run records the
  catalog's SHA-256. With the cache or its `gpt-5.5` entry missing it stops before Codex starts, naming the file and
  the entry. Intent: the catalog follows the installed Codex, no OpenAI instruction text enters this public
  repository, and a changed cache fails loudly instead of silently dropping the patch tool.
- **D4. The key.** Outcome: a DeepSeek launch, resume or review with `OPENDESIGN_API_KEY` unset or empty stops before
  Codex starts, naming the variable; the key's value appears in no run folder, review folder, event stream, message
  or test fixture. Intent: no half-started run, and the key stays out of every record.
- **D5. The review reads the named files.** `REVIEW.md` names `-m gpt-6.1-sol`, its prompt reads the brief alone, and
  the launcher runs it as written (`codex-round.mjs:198-230`, `:359-396`). The evaluation in `codex-rounds.md` (Read
  first) adopted DeepSeek at max reading the brief together with the files it names, one run per brief. Outcome: the
  launcher's review runs on DeepSeek at max with the D2 arguments, in a folder outside every Git tree that holds `brief.md`,
  `prompt.md` and a `sources` folder with each file path named on the brief's "Read first" and "Decisions" lines, copied
  whole (a repository path as it is at the brief's named HEAD, an absolute path as it is on disk); a named file that
  does not exist, an absolute path outside `D:/fitway-temp/`, or a file that holds credentials (a `.env` file,
  `auth.json`, a key file) stops the review before Codex starts and names it; such a file is never copied. The prompt is the text of
  `D:/fitway-temp/brief-review-trial/v2/prompt.md` (read-only). `REVIEW.md` describes this form, and its §"Running it"
  and §"Prompt" are what the launcher runs. Readings, dispositions, hashes and the launch gate behave as today.
  Intent: each brief gets the review that caught both brief-caused failures in both runs, with no sources gathered by
  hand, and nothing from outside the repository and the temp folder, and no secret, reaches Open Design.
- **D6. Records and guards.** Outcome: `start-load.json` is written for a DeepSeek run as for a GPT one; `--help`
  names both models, their levels and the default; `codex-round.test.ts` covers D1-D5 with the fake Codex, and every
  existing test keeps its assertions (an existing invocation may only gain `--model gpt-6.1-sol`);
  `node scripts/verify.mjs fast` passes, and `git status --short` is unchanged after it; one real `--new-review` of
  this brief on DeepSeek, with `FITWAY_BRIEF_REVIEW_ROOT` inside your run folder, completes and prints its readings. Intent: CI guards the route,
  and nothing already relied on moves.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change), `docs/agent-context/briefs/REVIEW.md` (must change) and files under `scripts/agent-environment/fixtures/`;
commit once when done. Everything else is read-only, including `~/.codex/config.toml`. Add no dependencies. If an
outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.
