# Code-quality review of a round's diff

Every implementing round's diff gets this review before it merges (agent-tooling-r01 DECISIONS item 6, the user's
approval of 2026-10-16). Grading asks whether the result does what the brief says; this review asks whether the code
is code we want copied. The reviewer is a fresh GPT-6.1 Sol at `xhigh`, or Opus (`owner-direction-verifier`) for a
round the coordinator judges important; it sees the diff, the brief and the files the diff touches, never the
implementer's report or reasoning. Adapted from Matt Pocock's `code-review` (a Spec axis and a Standards axis with
Fowler's smells as the baseline) and pstack's `principle-subtract-before-you-add`.

## What the reviewer gets

A folder outside every Git tree with `diff.patch` (`git diff <base>..<result>`), `brief.md`, this file as
`rubric.md`, and under `files/` each file the diff touches as it stands at the result, plus `prompt.md` below.

## The two axes

**Spec.** The diff does what the brief's outcomes ask and nothing they do not: no option, mode, fallback, guard,
parameter or file that no outcome or limit needs.

**Standards.** Each of these is a finding, with the file and line:

- **D1 Duplicated code.** Logic that already exists in the repository (or twice in the diff) written again instead
  of reused or shared.
- **D2 Speculative generality.** An abstraction, extension point, configuration, validator or guard for a case no
  outcome names and no caller reaches.
- **D3 Dead code.** A function, branch, export, flag or fixture nothing reaches, including code left behind by the
  change it replaced.
- **D4 A comment that defends a workaround.** A comment explaining why odd code is acceptable, where the code could be
  made plain instead; or a policy kept only in a comment that a check or a type could hold.
- **D5 Growth out of proportion.** Lines added far beyond what the outcomes need, a function that grew past what one
  reader can hold, or a file that was already large and grew without being split where the change made a seam.
- **D6 Tests not named by behaviour.** A test or test file named after a round, a finding ID alone or an internal
  detail rather than the behaviour it proves; a test that asserts on implementation rather than behaviour.
- **D7 A second path.** A new way to do something the repository already has one paved way to do (a second parser,
  a second runner, a second place a list is kept).
- **D8 Type and lint escapes.** A new `any`, `@ts-ignore`, `@ts-expect-error`, `biome-ignore`, `eslint-disable`, or a
  cast that silences a type instead of fixing it.

## Blocking

A finding is **blocking** when it would be copied as a pattern or makes the next change harder: D1, D3, D7 and D8
always; D2, D4, D5 and D6 when the reviewer can name the plain version in a sentence. Blocking findings go to a fix
round on the same branch before the merge; the others become rows in
`docs/phase-records/handoffs/agent-environment/findings.tsv` with `seen_by` `maintainer`.

## prompt.md

```text
Review the diff in diff.patch against brief.md, using rubric.md. Read files/ for context. You review code quality,
not whether the outcomes pass. List at most ten findings, most important first, each as:

N. <D1-D8 or Spec> | <file>:<line> | blocking or not
   - What: one sentence.
   - Plain version: one sentence saying what the code should be instead.

If you find nothing, say "No findings." Do not suggest tests or features the brief does not ask for.
```

## Running it

```bash
codex exec -s read-only --skip-git-repo-check -C "<folder>" -m gpt-6.1-sol -c model_reasoning_effort=xhigh -c web_search=disabled -c features.hooks=false -o "<folder>/last.md" - < "<folder>/prompt.md"
```

Run it from Git Bash, since PowerShell 5.1 pipes the prompt as ASCII. The coordinator writes `dispositions.md` in
the folder (`Finding N: blocking`, `Finding N: finding F<id>`, or `Finding N: dismissed: <why>`) and records the
round's counts in `codex-rounds.md`.
