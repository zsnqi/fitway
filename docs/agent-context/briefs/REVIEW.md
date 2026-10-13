# Pre-launch brief review

Before a Codex brief launches, DeepSeek V4.1 Flash at `max` reads the brief together with the files it names and lists
the literal readings that would meet every outcome while the goal fails. The coordinator closes each real reading in
the brief, or records in the round's notes why it leaves one open, then launches. Adopted on 2026-10-13 from the
Open Design trial: with the brief and its named files together, DeepSeek caught both brief-caused failures in both
runs of each brief, with no false alarm in ten control readings
(`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "Evaluation: DeepSeek for the brief
review").

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

Run it from an empty folder outside every Git tree, with a copy of the brief as `brief.md`, the prompt below as
`prompt.md`, and the files named on the brief's "Read first" and "Decisions" lines under `sources/`. Each source comes
from one of three places: a repository file copied whole from the brief's named HEAD, an absolute file whose real path
is under `D:/fitway-temp/`, or an absolute file committed in the Git checkout the launcher runs from and matching that
checkout's `HEAD`. A missing file, a file that holds credentials, a repository symbolic link, an untracked or modified
checkout file, or an absolute file whose real path leaves those places stops the review before Codex starts. The
launcher writes the generated `model-catalog.json` and passes its path as `<catalog>`:

```bash
codex exec -s read-only --skip-git-repo-check -C "<folder>" -m deepseek-v4.1-flash -c model_provider=opendesign -c 'model_providers.opendesign={name="OpenDesign",base_url="https://amr-link.open-design.ai/v1",env_key="OPENDESIGN_API_KEY",wire_api="responses"}' -c 'model_catalog_json="<catalog>"' -c model_reasoning_effort=max -c web_search=disabled -c features.hooks=false -o "<folder>/last.md" - < "<folder>/prompt.md"
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
`brief.md` in this folder. The folder `sources/` holds the files the brief tells the implementer to read, as they were
when the brief was written (a file the brief names by section or rows may be given whole or as the named part).

Read only `brief.md` and the files under `sources/`. Do not open any other file or path, do not search the disk or the
web, and do not run anything else.

Answer one question: how could an implementer meet every required outcome and limit exactly as written, and still
leave the brief's goal or a stated intent unmet? Use the sources to judge what the brief's checks can and cannot see.
List at most five such readings, the most damaging first. For each give:

1. the outcome or limit it exploits (its ID);
2. the literal reading;
3. what would go wrong in the delivered work;
4. a one-line change to the brief that closes it.

If the brief has no such reading, say so. Do not comment on style, length, tone or anything else. Return your answer
as your final message, as plain Markdown.
```
