# Gardener model choice: Opus 5.5 high vs Sonnet 5.5 high (researched 2026-10-08)

Official = anthropic.com / platform.claude.com / code.claude.com / support.claude.com. Pages were read through a summarising fetcher; re-open a URL before quoting it.

## 1. Comparable numbers

| Metric | Opus 5.5 | Sonnet 5.5 | Setting / source / date |
|---|---|---|---|
| Terminal-Bench 4.0 (Anthropic) | 66.4% | 70.6% | Opus xhigh; Sonnet effort not labelled. https://www.anthropic.com/claude-opus-5-5 (2026-09-22); https://www.anthropic.com/claude-sonnet-5-5 (2026-09-28) |
| Terminal-Bench 4.0 (Artificial Analysis) | 60% | 64% | AA harness. https://artificialanalysis.ai/articles/claude-sonnet-5-5 (2026-09-28); comparison page https://artificialanalysis.ai/models/comparisons/claude-opus-5-5-vs-claude-sonnet-5-5 |
| Terminal-Bench 4.0 (Vals) | 65.15% table / 61.62% update text | 64.14% table / 53.03% update text | Vals "max" effort; page contradicts itself. https://vals.ai/models/anthropic_claude-opus-5-5 ; https://vals.ai/models/anthropic_claude-sonnet-5-5 |
| CursorBench 4.0 | 57.8% (52.5% at medium) | 55.5% | Anthropic launch pages |
| FrontierCode 1.1 Main | 54.4% | 52.1% xhigh, 46.2% max | Anthropic; Sonnet scores lower at max because it ran code-review subagents (timeouts, out-of-scope edits in 2 cases) |
| OSWorld 2.1 (partial) | 81.8% | 80.1% | Anthropic |
| GDPval-AA v2.1 Elo | 1846 | 1844 | Anthropic; AA agrees |
| AA-Briefcase Elo | 1822 | 1811 | Anthropic Sonnet page; AA article |
| Humanity's Last Exam (tools) | 67.7% | 64.5% | Anthropic |
| Vals Index | 69.69% | 69.22% | Vals pages; cost per test $32.77 vs $20.80 |
| AA Intelligence Index | 58 (derived) | 56 | both max effort (AA, 2026-09-28) |
| Output tokens per AA task, max | ~119-120k | ~193-197k (AA's highest recorded) | AA comparison page and article: Sonnet uses ~60% more tokens than Opus at max |
| AA cost per task, max | $5.98 | $5.46 (page) / $7.60-7.67 (article, press) | AA figures differ between pages; unresolved |
| AA hallucination rate (lower is better) | 59% | 47% | AA-Omniscience, AA article |
| API price in/out per MTok | $4 / $20 | $2 / $10 | https://platform.claude.com/docs/en/models/sonnet-5-5/overview |
| Default effort | medium (API and Claude Code) | high on API, medium in Claude Code | https://code.claude.com/docs/en/model-config ; https://platform.claude.com/docs/en/build-with-claude/effort |

Not published on pages I read, for either model: SWE-bench Verified/Pro (a press reproduction, MetricNexus, lists Opus 5.5 SWE-bench Pro 89.9%; unverified, no Sonnet figure), tau-bench or a successor, an MCP/tool-use benchmark, and any Sonnet 5.5 vs Opus 5.5 comparison specifically at high effort. Press says AA scored Sonnet 5.5 at 47/41/36 for high/medium/low; that is in an image on AA and I could not verify it. No independent head-to-head at high effort was found.

Anthropic effort statements (official):
- Opus 5.5 at medium matches or exceeds Opus 5 at high on coding and knowledge work, with fewer tokens (Opus launch post; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5).
- Sonnet 5.5 at low/medium beats Sonnet 5's best on several benchmarks at about a tenth of the cost. "Sonnet 5.5 complements Opus 5.5 best at lower effort. At higher settings, it can perform comparably at a similar cost." Opus 5.5 "remains clearly stronger at complex, open-ended work", and "for the hardest long-horizon work, an Opus model is the better choice" (Sonnet launch post; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5).
- For Sonnet agentic coding, start at medium for well-specified tasks and move to high for harder or longer ones (effort page). Claude Code docs: medium "fits day-to-day engineering work with a clear scope"; high is for "work where verification matters" (model-config page).
- No official exact "Sonnet at X matches Opus at Y" pairing found beyond the above.

## 2. Subscription-usage facts

- Pro/Max: a 5-hour session limit plus, on Max, a weekly limit "that applies across all models". https://support.claude.com/en/articles/11049741-what-is-the-max-plan (undated, "Updated today").
- Claude Code help: "Opus costs several times more per turn than Sonnet, and Sonnet more than Haiku... It uses meaningfully more of your quota, so consider switching to Sonnet for routine work"; "Sonnet is the right choice for the large majority of coding work"; Haiku suits "high-volume scripted runs". https://support.claude.com/en/articles/14552983-models-usage-and-limits-in-claude-code (undated, "updated over 2 weeks ago", so it may predate the 5.5 models).
- Model-family limits exist ("You've hit your Opus limit" / "Sonnet limit" apply to that family; session and weekly limits are shared across models). https://code.claude.com/docs/en/costs
- No published per-model multiplier. Not found: any figure for Opus 5.5 vs Sonnet 5.5 quota weight, or whether `claude -p` is weighed differently from interactive use. Opus 5.5 is the Claude Code default for Pro/Max/Team/Enterprise (model-config page).
- Opus 5.5 "tends to think more per turn than Claude Opus 5, especially at xhigh and max" (Opus prompting guide).
- Headless control: `claude -p --model <m> --effort <level>` or env `CLAUDE_CODE_EFFORT_LEVEL`; with `--output-format json` read the real model from `modelUsage` (model-config page).
- API prices are exactly 2:1 per token, but per-task token use differs (AA rows above), so price alone does not predict subscription draw.

## 3. Reliability and instruction following in long tool loops

No benchmark found for either. Official behavioural notes:
- Opus 5.5: in unattended loops it may end a turn with a text progress report (stop_reason end_turn); a loop that treats that as done stops early. Anthropic recommends a checklist plus a continuation message, or a system-prompt addition. Follows user writing rules; much less likely to take hard-to-reverse or out-of-boundary actions (Opus launch post and prompting guide).
- Sonnet 5.5: at low/medium it sometimes checks in before finishing a long agentic task; at low it may skip real verification; at high this is described as rarer. It adds unrequested tests/docs at every effort level, more at higher effort; at xhigh/max it launches review subagents (a prompt paragraph cut session cost about a third). It occasionally calls a tool with the wrong letter case or a renamed parameter. Customer quote (vendor-selected): Base44, "fewest failed tool calls of any model we compared".
- Both run cyber classifiers that can refuse benign work; Sonnet falls back to Sonnet 5 (AA: about 0.1% of tasks).
- A search summary says the Sonnet system card (https://www.anthropic.com/claude-sonnet-5-5-system-card) calls it "broadly less capable than Opus 5.5 across domains"; the PDF was too large for me to open, so unverified.

## 4. What the evidence says for the gardener (judgement, not official)

- On shared agentic evals Sonnet 5.5 is within about 0-3 points of Opus 5.5, or ahead on Terminal-Bench. Anthropic positions Sonnet for "well-scoped everyday tasks" and Claude Code help says it fits most coding; a checklist-driven pass ending in one small doc/script edit is that class of work.
- Quota: Opus draws "meaningfully more" per turn (official, no number). But Sonnet's token use rises sharply with effort (AA: ~60% more than Opus at max; Anthropic: "similar cost" at higher settings), so its saving is clearest at medium and shrinks at high. Sonnet 5.5 at medium, or at high with a stop-early guard, looks the cheaper fit; Opus 5.5 at high is the safer-capability, costlier option.
- Failure modes differ: Sonnet may check in or stop early at medium and add unasked extras; Opus may end a turn on a progress note. In -p mode both end the run, so the skill file should say: keep working until the checklist is done, add nothing unasked, run the project's real checks. Anthropic publishes wording for both.
- Uncertainties: no independent test at high for either model; AA and Vals numbers move between pages and harnesses; the quota weighting is unpublished and the Claude Code help page may predate 5.5. Cheapest resolution: run the pass once on each and compare the `/usage` plan-bar change and `modelUsage` tokens for the same skill.
