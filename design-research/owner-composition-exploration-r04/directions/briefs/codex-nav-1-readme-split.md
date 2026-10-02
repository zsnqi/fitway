# Codex brief: split Eclipse's README into a contract and a history (owner-design-exploration-r04)

Work only in `D:/Projects/fitway-worktrees/owner-followup-r04-s04` on branch `owner-followup-r04-build`, HEAD as
given to you. Folder: `design-research/owner-composition-exploration-r04/directions/eclipse/` ("the folder").

## Environment

- You run without a sandbox. Write only inside this worktree and the system temp folder. Do not push, fetch, switch
  branches, or touch other worktrees, `D:/Projects/fitway` or any global configuration.
- Use absolute paths. Write files as UTF-8 without a BOM; keep each file's existing line endings.
- If anything this brief names is missing or contradicts the files, stop and report it instead of guessing.

## Goal and cause

An agent opening Eclipse reads what is true of the build today in a few hundred lines. Today `README.md` has 1,932
lines: the current rules sit between round logs, evidence and superseded values, and agents read all of it.

## The cut (decided)

- **`README.md` becomes the contract**, in this order: a new opening of at most 12 lines (concept only, synthetic
  data; the pages `index.html`, `reports.html`, `components.html`; Arabic RTL by default and English; `DESIGN-SPEC.md`
  holds the rules; `HISTORY.md` holds how they came about), then Thesis, Colours, Light model, Light tuner,
  Measurements, Line cards and states, Motion, Open and capture, and from Reports: What it answers, The data, States
  and how to open it, The table form and dialog system, Capture.
- **Motion keeps** its principle, "What moves, and when" and rules 1-11, each reduced to the paragraphs that state
  current behaviour. Paragraphs about rejected options, earlier rounds, replaced values, and "Deviations from the
  brief" go to the history.
- **`HISTORY.md` (new)** takes everything else, verbatim and in the original order, under the original headings: the
  preamble's round entries (README lines 3-55 and 67-102), Motion's moved paragraphs, Evidence, Checks not run,
  Known limits (single-fetch), Lane fix round, Checks, Reports' early phone check and its Known limits, and every
  "Step 3" and "Step 4" section.

## Required outcomes

- **N1.** Text moves verbatim; nothing is lost. Every non-blank line of the old `README.md` appears in the new
  `README.md` or `HISTORY.md`, except where N2 restates it. New text is limited to the opening, headings and short
  pointers.
- **N2.** The contract is true of the current build. Where a kept paragraph states a value a later entry superseded
  (for example the intro's length), the contract states the current value as `DESIGN-SPEC.md` and the code have it,
  and the old wording stays in `HISTORY.md`. List every such restatement in your report with its old line number.
- **N3.** References still resolve: every mention of a README section in `DESIGN-SPEC.md`, `NEXT-DIRECTION-BRIEF.md`
  (one folder up), and in comments of the folder's `.js`, `.mjs` and `.css` files names the file and heading where that
  text now lives. Leave `../briefs/**` and `../_tools/**` as they are; they are history.
- **N4.** The artifact does not change: in `.html`, `.js`, `.mjs` and `.css` files only comment text may differ.
- **N5.** One commit on `owner-followup-r04-build`, message ending in your own attribution line. Not pushed.

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

End with: each outcome N1-N5 as PASS or FAIL with the command or count that proves it; the new line counts of
`README.md` and `HISTORY.md`; the N2 restatements; the files changed; the commit SHA; anything you could not do.
