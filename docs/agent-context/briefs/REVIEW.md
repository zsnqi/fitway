# Pre-launch brief review

Before a Codex brief launches, Codex at `max` reads the brief alone and lists the literal readings that would meet every
outcome while the goal fails. The coordinator closes each real reading in the brief, or records in the round's notes
why it leaves one open, then launches. Adopted on 2026-10-11 from a blind trial on the day's two brief-caused failures
and a brief that held: only `max` caught both failures, in two runs of two, with no false alarm on the control
(`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "Evaluation: a blind review of the brief
before launch").

Run it from an empty folder outside every git tree, with a copy of the brief as `brief.md` and the prompt below as
`prompt.md`:

```bash
codex exec -s read-only --skip-git-repo-check -C "<folder>" -m gpt-6.1-sol -c model_reasoning_effort=max -o "<folder>/last.md" - < "<folder>/prompt.md"
```

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
