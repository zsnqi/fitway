# Working agreements

How the user and the agents work together on FITWAY, across milestones. This file holds only the
agreements in force. Edit an entry in place when the user revises it, and keep the date of the
latest wording; never copy an entry into a resume point.

## Starting a task

- Before a big task or a new phase, the coordinator states in two or three lines what it will do
  and why, then starts at once; the user interrupts when it is not what they want. Small tasks
  and edits get no announcement. (user, 2026-10-02)
- The coordinator waits for an answer only on taste or direction (anything that changes how a page
  looks or behaves, a choice between options, visual acceptance), irreversible actions, the user's
  settings and security, product decisions, or a request that is itself unclear. It asks all open
  questions together in one message. Everything else it decides, does, and reports in a line.
  (user, 2026-09-29, 2026-10-01 and 2026-10-02)
- Inside an announced task, process, tooling and ordering are the coordinator's decisions; it
  reports them at the end. (user, 2026-10-02)
- The user sees a round only when it is finished: every finding the coordinator would fix anyway,
  and every fix that applies an existing rule or decision, is made and checked first; only real
  choices go to the user. The user prefers the running site and frame strips to file paths. (user,
  2026-10-04 and 2026-10-05)
- Housekeeping is the coordinator's to do and report, not to ask: pushing working branches (never
  forcing), fast-forwarding `main` when CI passes, deleting merged branches, pruning dead worktree
  registrations, and opening a successor milestone once its terminal record meets the successor gate
  in `AGENTS.md`. (user, 2026-09-29 and 2026-10-07)

## Talking with the user

- Questions and reports for the user are in plain words: what the user will see on the page, and what each answer
  changes. A question names the thing itself ("Should Daily get its own layout for the phone?"), never the process
  ("Does the design round stay?"). Leave out pixel values and other measurements unless the user asks for them;
  name a screen by the device (on the phone, on a tablet, on a computer). The measurements stay in the records and in
  the agents' reports. (user, 2026-10-03, after a decision page that was hard to read)

## Sessions and resuming

- The coordinator's own context stays small: fresh agents do the reading and building, and the
  coordinator reads their reports and the key frames. (user, 2026-10-02)
- When the coordinator's context grows, the user asks it to bring the milestone's resume file up to
  date (`pnpm handoff:new`, `docs/WORKFLOW.md` "Handoff format"). The next session starts from the
  user's "كمّل" alone. (user, 2026-10-02)
- Reply in Saudi-dialect Arabic when the user writes Arabic; code, paths, commit messages and
  repository documents stay in English. (user)

## Delegation

- Visual design and taste judgments stay with Claude on the Opus definitions. Exact renders of
  every option go to the user for picks. (user, 2026-10-02)
- The coordinator's questions to the user and its designer briefs carry what the owner must see and
  be able to do, and why; the composition, forms and colours are the designer's, and the coordinator
  recommends none of them. (user, 2026-10-04)
- Codex takes frozen fixes and edits. Its reasoning level follows the task (user, 2026-10-03):
  `xhigh` when the cause is unknown or the change spans many files with tests and Windows or CI
  behaviour; `high` for a known defect in a known place with a measurable outcome; `medium` for
  mechanical edits from an exact list (documents, a regenerated index, text replacements). The first
  round of each kind at its lower level is graded like any other; a failure traced to the code moves
  that kind up a level. Each round's record names its level.
- Usage limits do not shape rounds: when an account reaches its limit the user switches to another,
  and a stopped run resumes on its thread. (user, 2026-10-05)
- The coordinator launches Codex from a tracked brief that passes `pnpm brief:check`, in Codex's
  sandbox with automatic approval review (`docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  item 7), in a harness background shell (Git Bash, which has `<`):
  `{ printf 'Launch note: HEAD <sha> only adds this brief over the named HEAD.\n\n'; cat <brief>; } | codex exec --approve-for-me -C <worktree> -m gpt-6.1-sol -c model_reasoning_effort="<level>" --json -o <run>/last-message.md - > <run>/events.jsonl`.
  The note is needed because the brief's own commit sits on the HEAD it names, and Codex rightly stops
  on a HEAD it was not told about. Claude Code's auto mode refuses this command unless the launching
  worktree's `.claude/settings.local.json` allows `Bash(codex exec:*)`; that is the user's setting to
  add. The harness reports the exit; nothing polls.
- A run that stopped mid-change (the app exited, or a limit was reached) resumes on the same thread
  instead of being reset: the same pipeline with
  `--json -o <run>/last-message.md resume <thread_id> - > <run>/events-resume.jsonl`, where
  `thread_id` is on the first line of `events.jsonl` and every exec flag comes before `resume`.
- After a round, the coordinator checks the diff, `git status` in every worktree involved, and the
  remote branch.
- Each Codex round is judged as an evaluation: brief rows, held-out rows, and the failure cause,
  recorded in `docs/phase-records/handoffs/agent-environment/codex-rounds.md`. Held-out suites live
  in `D:/fitway-grader/`, carry planted-defect controls, and never appear in a brief. The numbers come
  from executed checks, not from the implementer's report. A stop caused by the brief becomes a brief
  rule (the checklist of `docs/agent-context/briefs/codex.md`). Models or levels are compared only
  when a decision depends on it, by replaying one closed round on each with the same suite. Records
  never bias the reader against the model and never record run time. (user, 2026-09-30 and
  2026-10-02)
- Every subagent is launched from a definition with a fixed effort; `CLAUDE.md` gives the choice
  between the Opus and Sonnet definitions. (user, 2026-10-02)
- The Claude subscription is the scarce budget; Codex capacity is not (user, 2026-10-04). A round
  of small fixes gets one Claude review, the verifier at `high`, which also reads the changed
  elements in both directions; the separate reading-direction review is kept for a whole screen or
  a wide copy or table round. A build whose target is already drawn, and the fixes a review
  returns, go to Codex; design and taste stay with Claude.

## Rules and findings

- A rule is a hypothesis, not a verdict. When a reviewer, designer or builder finds a problem or an observation, it
  reports it even when the work meets every rule, decision and check: meeting a rule is never a reason to let it
  pass, because a rule can be fragile or wrong. It names the rule that produced the finding as the suspect; when
  that rule is the user's decision, it goes back to the user. (user, 2026-10-03, after English tables built to
  decision 9 passed every check while reading wrong)
- A review looks at every element the round changed as a whole on the page (its order, alignment, sizes and
  spacing), not only at whether the requested change happened: a change can be done and still read badly. (user,
  2026-10-03, after the busiest-time card on the phone passed every check while reading badly)
