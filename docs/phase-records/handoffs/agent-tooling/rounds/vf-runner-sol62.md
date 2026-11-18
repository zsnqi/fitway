# r04 vf-runner on GPT-6.2 Sol: a replay of the Sol arm (2026-11-18), `../../owner-design-exploration/r04/briefs/codex-vf-runner-62.md`, result `45e488de` on `owner-r04-vf-runner-62` (from `c699d3fb`), GPT-6.2 Sol `xhigh`

- **Why:** the user moves Codex rounds from GPT-6.1 Sol to GPT-6.2 Sol and asked how it performs on our earlier evals;
  the 6.1 arm and DeepSeek were not rerun (their October records stand).
- **Set-up:** the Sol arm's brief from `c699d3fb` with only its worktree, branch and temp folder changed and today's
  brief-format header (`0b3ffd7c`, `4e8dc09a`); the launcher gained the model in `60167c77`. The brief review's five
  readings were left open, as on the 6.1 arm. Graded by GPT-6.1 Sol `xhigh` with
  `../../owner-design-exploration/r04/briefs/codex-vf-runner-grade-62.md` (`743e3b8d`), the Sol arm's grading brief
  with only its worktree, HEAD and temp paths changed and today's header.
- **Run (measured from `D:/fitway-temp/codex-round-606795dc-0f9e-4007-b7c7-43ab309ce7d9`):** about 27 minutes to the
  commit, about 37 in all with the launcher's report-check resumes (the old brief asks for a prose report; the commit
  sat in a compound shell command the claim check did not read); 12.3M input tokens (12.0M cached) and 45k output in
  the first turn, against the 6.1 arm's 62.1M and 61k over about 3 h; no intervention. It did not amend the commit to
  satisfy the check: it stopped, naming the commit and the clean tree. Its report claimed every row PASS.
- **Sol 6.1's grade** (`D:/fitway-temp/codex-round-1d403653-839a-4f9c-ab4d-9ba9bace14ad`): G1-G7 and L1 PASS; G4 828
  items, 738 EQUAL and 90 NOT-REACHABLE on both CLIs, 0 mismatches.
- **The coordinator's checks:** G3 reproduced on a fresh archive of `45e488de` with the three repeated static proofs
  disabled: `cli.test.mjs` 79 pass, 1 fail (`D:/fitway-temp/replay-62-plants/g3-run.log`); G3 holds, where both 0910
  arms and the 1017 replay failed it. The guide plants of the 1017 record, rerun on the base, the 6.1 arm and this
  result (`D:/fitway-temp/replay-62-plants/plants.mjs`): before "## Compare" the base catches 6/6, the 6.1 arm 5/6
  (the `measure ... --no-such-flag` line passes), this result 5/6 (`pnpm verify:owner drive --no-such-flag` passes);
  after the Evidence heading the base 0/6, both 5/6; the passthrough control passes on both. By the method that
  decided 0910 and 1017, G6 fails and G7 fails (an existing guard narrowed); the grader's G6 plant was a prose line.
- **Rows, the same method:** G1 P, G2 P, G3 P, G4 P, G5 P, G6 F, G7 F = 5/7 (6.1 arm 4/7, DeepSeek 0910 4/7, DeepSeek
  1017 5/7). Brief rows V1 and V2 met, V3 and L1 not; one overclaim (V3 reported PASS).
- **CI on `45e488de`** failed in `check-brief.test.ts` and `codex-round.test.ts`, files outside the diff, on
  `mkdtemp 'D:\fitway-temp\...'` ENOENT on the runner. The October arms passed CI, so it is read as the runner's
  changed environment, not the result; not proven by a rerun on the base.
- **Code quality, blind** (`D:/fitway-temp/code-quality-vf-runner-3/REPORT.md`,
  `docs/agent-context/briefs/CODE_REVIEW.md`, a fresh GPT-6.1 Sol per arm, labels only): 6.2 three blocking findings
  (D7, D6, D5), none in `runner.mjs`, and the only arm to share the cache-root seam (`compare-test-cache.mjs`); the
  6.1 arm four (two D7 in `runner.mjs`, D6, D1); DeepSeek 0910 three (one against the spec, D6, D1).
- **The 17-task model eval** (`D:/fitway-temp/model-eval-sol62/REPORT.md` and its 17 rows, one run per task, scored by the
  coordinator knowing the model): real-history code review 11/24 in one run (DeepSeek 3.7 and GLM 3 per run);
  planted-frame design review 15/18 with 5 false findings (DeepSeek 9.7 and 3.7 per run); the other families at the
  ceiling, as before.
- **Reading:** on this brief GPT-6.2 Sol reached the best row count yet with about a fifth of the tokens and a fifth
  of the time of the 6.1 arm, kept the static proof the others lost, wrote the cleanest diff, and still narrowed the
  guide guard and claimed a row it missed. One run each.
