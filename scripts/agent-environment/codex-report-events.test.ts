import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { outputLines } from "./codex-report.mjs";
import {
	afterEachReportFixture,
	autoResumes,
	brief,
	commandRecord,
	commitChange,
	eventsText,
	fileChange,
	harness,
	measurementCommand,
	measurementOutput,
	measurementTurn,
	oneCharacterDifferent,
	realTestSummary,
	reportChecks,
	reportEventCases,
	reportMessage,
	row,
} from "./codex-report-fields-fixture.ts";

afterEach(afterEachReportFixture);
const cases = reportEventCases();
describe("R3 structured report rows match run events", () => {
	it.each(
		cases,
	)("matches $name and refuses a one-character difference", (item) => {
		if (item.wide)
			expect(
				(item.event.item as { aggregated_output: string }).aggregated_output
					.length,
			).toBeGreaterThanOrEqual(813357);

		const accepted = harness();
		accepted.setTurns([
			{
				message: reportMessage([row("O1", item.command, item.output)]),
				events: eventsText([item.event]),
			},
		]);
		const acceptedResult = accepted.invoke();
		expect(reportChecks(accepted)[0]).toMatchObject({
			accepted: true,
			rows: [
				{
					id: "O1",
					status: "PASS",
					events: "events-resume.jsonl",
					line: 1,
				},
			],
		});
		expect(acceptedResult.status, acceptedResult.output).toBe(0);

		for (const changed of [
			row("O1", oneCharacterDifferent(item.command), item.output),
			row("O1", item.command, oneCharacterDifferent(item.output)),
			...(item.raw ? [row("O1", item.raw, item.output)] : []),
		]) {
			const refused = harness();
			refused.setTurns([
				{
					message: reportMessage([changed]),
					events: eventsText([item.event]),
				},
				{ message: "STOPPED: stop after refusal\n" },
			]);
			const refusedResult = refused.invoke();
			expect(refusedResult.status, refusedResult.output).toBe(0);
			expect(autoResumes(refused)[0].claimFailures.join("\n")).toContain(
				"PASS row O1 has no matching record",
			);
		}
	});
});

describe("R3 a command that exits non-zero is still a record", () => {
	const ladder = "node scripts/verify.mjs fast";
	const commitBrief = brief({
		delivers: "commit",
		scope: "Finish and report.",
	});
	it.each([
		{
			name: "git commit",
			input: commitBrief,
			command: 'git commit -m "fixture change"',
			output: (head: string) => `[fixture ${head.slice(0, 7)}] fixture change`,
			refusal: "no successful git commit command with exit code 0",
		},
		{
			name: "fast ladder",
			input: commitBrief.replace(
				"- **O1.** Fixture outcome.",
				`- **O1.** \`${ladder}\` passes.`,
			),
			command: ladder,
			output: () => "VERIFY FAIL: unit",
			refusal: "without a successful fast-ladder command",
		},
	])("matches a failed $name row, and its check still requires exit code 0", (item) => {
		const f = harness({ input: item.input });
		const commit = commitChange(f);
		const failed = commandRecord(
			item.command,
			`${item.output(commit.head)}\n`,
			"item-failed",
			1,
		);
		f.setTurns([
			{
				message: reportMessage(
					[row("O1", item.command, item.output(commit.head))],
					[commit.head.slice(0, 7)],
				),
				events: eventsText(
					item.name === "git commit" ? failed : [...commit.event, ...failed],
				),
			},
			{ message: "STOPPED: stop after refusal\n" },
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		const failures = autoResumes(f)[0].claimFailures.join("\n");
		expect(failures).not.toContain("PASS row O1 has no matching record");
		expect(failures).toContain(item.refusal);
	});
});

describe("R3 runs of blanks inside a displayed line compare as one space", () => {
	const recorded = JSON.parse(readFileSync(realTestSummary, "utf8"));
	const command =
		"pnpm exec vitest run scripts/agent-environment/codex-report-fields.test.ts scripts/agent-environment/codex-report-events.test.ts";
	it("matches the round's quote of a doubled-space line and still needs the whole line", () => {
		expect(outputLines(recorded.item.aggregated_output)).toContain(
			"Tests  19 passed (19)",
		);
		for (const quote of ["Tests 19 passed (19)", "Tests\t19  passed (19)"]) {
			const accepted = harness();
			accepted.setTurns([
				{
					message: reportMessage([row("O1", command, quote)]),
					events: eventsText([recorded]),
				},
			]);
			const result = accepted.invoke();
			expect(reportChecks(accepted)[0], quote).toMatchObject({
				accepted: true,
				rows: [{ id: "O1", events: "events-resume.jsonl", line: 1 }],
			});
			expect(result.status, result.output).toBe(0);
		}
		const refused = harness();
		refused.setTurns([
			{
				message: reportMessage([row("O1", command, "19 passed")]),
				events: eventsText([recorded]),
			},
			{ message: "STOPPED: stop after refusal\n" },
		]);
		const result = refused.invoke();
		expect(result.status, result.output).toBe(0);
		expect(autoResumes(refused)[0].claimFailures.join("\n")).toContain(
			"PASS row O1 has no matching record",
		);
	});
});

describe("R3 prose status is not a report row", () => {
	it("does not treat prose status words as report rows", () => {
		const f = harness();
		f.setTurns([
			{ message: "O1: PASS\nThis prose is not the report block.\n" },
			{ message: "STOPPED: stop after no report\n" },
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(autoResumes(f)[0].firstLine).toContain("O1: PASS");
		expect(f.lastInput()).toContain(
			"A report needs the `report` block or a `STOPPED:` line",
		);
	});
});

describe("R4 and R5 evidence freshness and records", () => {
	it("refuses F265 stale evidence and accepts a post-edit repeat", () => {
		for (const repeated of [false, true]) {
			const f = harness({
				delivers: "commit",
				scope: "Finish and report.",
			});
			const commit = commitChange(f);
			const first = commandRecord(
				measurementCommand,
				measurementOutput,
				"item-measure-1",
			);
			const edit = fileChange(path.join(f.worktree, "file.txt"), "item-edit");
			const second = repeated
				? commandRecord(measurementCommand, measurementOutput, "item-measure-2")
				: [];
			f.setTurns([
				{
					message: reportMessage(
						[row("O1", measurementCommand, measurementOutput.trim())],
						[commit.head.slice(0, 7)],
					),
					events: eventsText([...first, edit, ...second, ...commit.event]),
				},
				...(repeated ? [] : [{ message: "STOPPED: stop after refusal\n" }]),
			]);
			const result = f.invoke();
			expect(result.status, result.output).toBe(0);
			if (repeated) {
				expect(reportChecks(f)[0]).toMatchObject({
					accepted: true,
					rows: [
						{
							id: "O1",
							events: "events-resume.jsonl",
							line: 4,
						},
					],
				});
			} else {
				const failure = autoResumes(f)[0].claimFailures.join("\n");
				expect(failure).toContain("PASS row O1");
				expect(failure).toContain(path.join(f.worktree, "file.txt"));
				expect(failure).toContain("events-resume.jsonl:3");
			}
		}
	});
});

describe("R4 command start and restored edits", () => {
	it("uses the command start, so a command spanning an edit is stale", () => {
		const f = harness({ delivers: "commit", scope: "Finish and report." });
		const commit = commitChange(f);
		const [started] = commandRecord(
			measurementCommand,
			measurementOutput,
			"item-measure",
		);
		const completed = commandRecord(
			measurementCommand,
			measurementOutput,
			"item-measure",
		)[1];
		f.setTurns([
			{
				message: reportMessage(
					[row("O1", measurementCommand, measurementOutput.trim())],
					[commit.head.slice(0, 7)],
				),
				events: eventsText([
					started,
					fileChange(path.join(f.worktree, "file.txt")),
					completed,
					...commit.event,
				]),
			},
			{ message: "STOPPED: stop after refusal\n" },
		]);
		expect(f.invoke().status).toBe(0);
		expect(autoResumes(f)[0].claimFailures.join("\n")).toContain(
			"events-resume.jsonl:2",
		);
	});

	it("still refuses when the edited worktree file is restored", () => {
		const f = harness({ delivers: "commit", scope: "Finish and report." });
		const commit = commitChange(f);
		const file = path.join(f.worktree, "file.txt");
		f.setTurns([
			measurementTurn(commit, [
				fileChange(file, "item-edit"),
				fileChange(file, "item-restore"),
			]),
			{ message: "STOPPED: stop after refusal\n" },
		]);
		expect(f.invoke().status).toBe(0);
		expect(autoResumes(f)[0].claimFailures.join("\n")).toContain(
			"events-resume.jsonl:4",
		);
	});
});

describe("R4 ignores edits outside the worktree", () => {
	it("ignores a later edit outside the worktree", () => {
		const f = harness({ delivers: "commit", scope: "Finish and report." });
		const commit = commitChange(f);
		f.setTurns([
			measurementTurn(commit, [
				fileChange(path.join(f.root, "temp.txt"), "item-temp"),
			]),
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(reportChecks(f)[0]).toMatchObject({
			accepted: true,
			rows: [{ id: "O1", events: "events-resume.jsonl", line: 1 }],
		});
	});
});

describe("R3 a console-wrapped line joins at the cursor column", () => {
	it("keeps a repeated pattern before the column the cursor moves to", () => {
		const esc = String.fromCharCode(27);
		const previous = `${"x".repeat(76)}abab`;
		// Columns 1 to 79 of the previous line, then the segment written from column 80.
		const kept = `${"x".repeat(76)}aba`;
		expect(previous).toHaveLength(80);
		expect(outputLines(`${previous}\r\n${esc}[23;80Hbab tail\r\nnext`)).toEqual(
			[`${kept}bab tail`, "next"],
		);
	});

	it("counts the column on the last row of a line the console already wrapped", () => {
		const esc = String.fromCharCode(27);
		// Row 1 is 80 "y"; the first move rewrites column 80 and fills row 2 with "z"; the second
		// move rewrites column 80 of row 2 (the 160th character) and adds "end".
		const output = `${"y".repeat(80)}\r\n${esc}[23;80Hy${"z".repeat(80)}\r\n${esc}[23;80Hzend`;
		expect(outputLines(output)).toEqual([
			`${"y".repeat(80)}${"z".repeat(80)}end`,
		]);
	});
});
