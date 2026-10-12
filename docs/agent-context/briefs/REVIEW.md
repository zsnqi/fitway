# Pre-launch brief review

Before a Codex brief launches, Codex at `max` reads the brief alone and lists the literal readings that would meet every
outcome while the goal fails. The coordinator closes each real reading in the brief, or records in the round's notes
why it leaves one open, then launches. Adopted on 2026-10-11 from a blind trial on the day's two brief-caused failures
and a brief that held: only `max` caught both failures, in two runs of two, with no false alarm on the control
(`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "Evaluation: a blind review of the brief
before launch").

The coordinator records each reading's disposition (closed, or left open and why) in the round's record in
`codex-rounds.md`, and at grading notes whether a brief-caused failure was a reading the review returned. A reading
is closed by sharpening the outcome it exploits, not by adding rows or an approach (B4, B6); a brief that needs many
new rows is split. Readings that keep coming back go under "Recurring readings" below (checklist B12), so briefs
start closed. The launch command runs
the review itself when absent (or with `--new-review`), then stops; it launches only after the newest review's readings
have coordinator dispositions naming the current brief's SHA-256. The review runs at `max`; the round itself keeps the level its task calls for
(`docs/agent-context/WORKING_AGREEMENTS.md`, "Delegation").

## Recurring readings

Close these in a brief before the review runs (the user, 2026-10-11; from the trial's runs):

- a new check is run by a command that always runs (the fast ladder or the launch), not only by hand;
- a list the result is measured over (recipes, features, tests) cannot shrink: its base count is an outcome;
- a movement checked at fixed times states what happens between them, or the times' spacing bound;
- a behaviour on touch is not proved by mouse frames: name what proves it (a device, or a stated limit).

## Running it

Run it from an empty folder outside every git tree, with a copy of the brief as `brief.md` and the prompt below as
`prompt.md`:

```bash
codex exec -s read-only --skip-git-repo-check -C "<folder>" -m gpt-6.1-sol -c model_reasoning_effort=max -o "<folder>/last.md" - < "<folder>/prompt.md"
```

The launcher uses `D:/fitway-temp/brief-review/<brief file name without extension>-<n>/`, with `n` one above the
highest existing folder, prints the readings and current brief hash, and stops without launching. Tests use an isolated
folder via `FITWAY_BRIEF_REVIEW_ROOT`. A failed or unreadable review leaves its folder and blocks launch.
The coordinator alone writes `dispositions.md` in that review folder, with these lines (reading numbers are in the
launcher's printed order):

```text
Brief SHA-256: <current hash printed by the launcher>
Reading 1: closed
Reading 2: left open: <why>
```

Write one disposition per reading, including a reason for each left open; with no readings, write just the hash line.
After editing the brief to close a reading, write its new hash. The launcher refuses a missing answer or a different
hash, never writes dispositions, and copies `last.md` and `dispositions.md` into the run as `review-readings.md` and
`review-dispositions.md` when it launches. `--new-review` always reviews the current brief and stops; `resume` never
runs or checks a review.

## Prompt

```text
You review one task brief, written for an implementing agent that follows instructions to the letter. The brief is
`brief.md` in this folder.

Read only `brief.md`. Do not open any other file, path or URL it mentions, do not search the disk or the web, and do
not run anything else: the question is about the brief's wording alone.

Answer one question: how could an implementer meet every required outcome and limit exactly as written, and still
leave the brief's goal or a stated intent unmet? List at most five such readings, the most damaging first. For each
give:

1. the outcome or limit it exploits (its ID);
2. the literal reading;
3. what would go wrong in the delivered work;
4. a one-line change to the brief that closes it.

If the brief has no such reading, say so. Do not comment on style, length, tone or anything else. Return your answer
as your final message, as plain Markdown.
```
