import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkBrief } from "./check-brief.mjs";
import {
	afterEachReportFixture,
	autoResumes,
	brief,
	checkBriefFixture,
	commitChange,
	createFixtureTemp,
	eventsText,
	harness,
	reportChecks,
	reportMessage,
	repository,
	row,
} from "./codex-report-fields-fixture.ts";

afterEach(afterEachReportFixture);
describe("R1 brief delivery field", () => {
	it("validates the exact Codex delivery values and rejects the field on other roles", async () => {
		const root = createFixtureTemp();
		const briefPath = path.join(root, "brief.md");
		const check = async (text: string) => {
			writeFileSync(briefPath, text);
			return checkBrief({ repositoryRoot: repository, briefPath });
		};

		for (const delivery of ["commit", "report"]) {
			const result = await check(
				checkBriefFixture(
					`<!-- brief-format: v1 role: codex delivers: ${delivery} -->`,
				),
			);
			expect(result.ok, `${delivery}: ${JSON.stringify(result.problems)}`).toBe(
				true,
			);
		}
		for (const format of [
			"<!-- brief-format: v1 role: codex -->",
			"<!-- brief-format: v1 role: codex delivers: other -->",
			"<!-- brief-format: v1 role: builder delivers: report -->",
		]) {
			const result = await check(checkBriefFixture(format));
			expect(
				result.problems.some(
					(problem: { rule: string }) => problem.rule === "brief-format",
				),
				format,
			).toBe(true);
		}
		const builder = await check(
			checkBriefFixture("<!-- brief-format: v1 role: builder -->"),
		);
		expect(builder.ok, JSON.stringify(builder.problems)).toBe(true);
	});
});

describe("R1 launcher delivery authority", () => {
	it("refuses a recorded brief without the field before the child starts", () => {
		const f = harness({
			input: brief({ ids: ["O1"] }).replace("delivers: report", ""),
		});
		f.setTurns([{ message: "STOPPED: should not start\n" }]);
		const result = f.invoke();
		expect(result.status).toBe(1);
		expect(result.output).toContain("delivers");
		expect(existsSync(f.counter)).toBe(false);
	});

	it("takes commit checks from the field and not the Scope prose", () => {
		const reportOnly = harness({
			delivers: "report",
			scope: "Commit once when done.",
		});
		reportOnly.setTurns([
			{
				message: reportMessage([row("O1", "not run", "not run", "FAIL")]),
			},
		]);
		const reportResult = reportOnly.invoke();
		expect(reportResult.status, reportResult.output).toBe(0);
		expect(readFileSync(reportOnly.counter, "utf8")).toBe("1");

		const commitRequired = harness({
			delivers: "commit",
			scope: "Finish and report.",
		});
		commitRequired.setTurns([
			{
				message: reportMessage([row("O1", "not run", "not run", "FAIL")]),
			},
			{ message: "STOPPED: stop after refusal\n" },
		]);
		const commitResult = commitRequired.invoke();
		expect(commitResult.status, commitResult.output).toBe(0);
		expect(autoResumes(commitRequired)[0].claimFailures).toEqual(
			expect.arrayContaining([expect.stringContaining("no commit line")]),
		);
	});

	it("documents the delivery choice and exact report form", () => {
		const template = readFileSync(
			path.join(repository, "docs/agent-context/briefs/codex.md"),
			"utf8",
		);
		expect(
			template.startsWith(
				"<!-- brief-format: v1 role: codex delivers: commit -->\n",
			),
		).toBe(true);
		expect(template).toContain("```report");
		expect(template).toContain('{"commit":"<SHA>"}');
		expect(template).toMatch(/delivers: report/i);
		expect(template).toMatch(
			/started after the last edit inside the\s+worktree/i,
		);
	});
});

describe("R1 the field is read from the recorded brief's first line only", () => {
	const header = "<!-- brief-format: v1 role: codex delivers: report -->";
	it.each([
		["on a later line", `# Grade fixture\n\n${header}`],
		[
			"in a fenced example",
			`# Grade fixture\n\n\`\`\`markdown\n${header}\n\`\`\``,
		],
	])("refuses a field %s before the child starts", (_name, start) => {
		const f = harness({ input: brief().replace(header, start) });
		f.setTurns([{ message: "STOPPED: should not start\n" }]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(1);
		expect(result.output).toContain("delivers");
		expect(existsSync(f.counter)).toBe(false);
	});

	it("reads the field from the first line after the launch note only", () => {
		const note =
			"Launch note: HEAD 0123456789abcdef0123456789abcdef01234567 only adds this brief over the named HEAD.\n\n";
		const late = harness({ input: `${note}# Grade fixture\n\n${brief()}` });
		late.setTurns([{ message: "STOPPED: should not start\n" }]);
		const lateResult = late.invoke();
		expect(lateResult.status, lateResult.output).toBe(1);
		expect(lateResult.output).toContain("delivers");
		expect(existsSync(late.counter)).toBe(false);

		const first = harness({ input: `${note}${brief()}` });
		first.setTurns([
			{ message: reportMessage([row("O1", "not run", "not run", "FAIL")]) },
		]);
		const firstResult = first.invoke();
		expect(firstResult.status, firstResult.output).toBe(0);
		expect(readFileSync(first.counter, "utf8")).toBe("1");
	});
});

describe("R2 report commit field", () => {
	it("accepts one commit line and ignores other hashes", () => {
		const f = harness({ delivers: "commit", scope: "Finish and report." });
		const commit = commitChange(f);
		f.setTurns([
			{
				message: `Base commit: ${f.head}\n${reportMessage(
					[row("O1", "not run", "not run", "FAIL")],
					[commit.head.slice(0, 7)],
				)}`,
				events: eventsText(commit.event),
			},
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(f.counter && readFileSync(f.counter, "utf8")).toBe("1");
		expect(reportChecks(f)[0]).toMatchObject({
			accepted: true,
			delivers: "commit",
			commitSha: commit.head.slice(0, 7),
			commitResolved: commit.head,
		});
	});

	it("refuses a wrong commit line even when the real HEAD is cited elsewhere", () => {
		const f = harness({ delivers: "commit", scope: "Finish and report." });
		const commit = commitChange(f);
		f.setTurns([
			{
				message: `The real HEAD is ${commit.head}.\n${reportMessage(
					[row("O1", "not run", "not run", "FAIL")],
					["68e863793e6f"],
				)}`,
				events: eventsText(commit.event),
			},
			{ message: "STOPPED: stop after refusal\n" },
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		const [refused] = reportChecks(f);
		expect(refused).toMatchObject({
			accepted: false,
			commitSha: "68e863793e6f",
			commitResolved: null,
		});
		expect(autoResumes(f)[0].claimFailures.join("\n")).toContain(
			"no such commit object",
		);
	});
});

describe("R2 report commit lines that are refused", () => {
	it.each([
		["no commit line", [], "no commit line"],
		[
			"more than one commit line",
			["1111111", "2222222"],
			"more than one commit line",
		],
		[
			"a commit that names no object",
			["68e863793e6f"],
			"no such commit object",
		],
	])("refuses %s", (_name, commits, message) => {
		const f = harness({ delivers: "commit", scope: "Finish and report." });
		const commit = commitChange(f);
		f.setTurns([
			{
				message: reportMessage(
					[row("O1", "not run", "not run", "FAIL")],
					commits,
				),
				events: eventsText(commit.event),
			},
			{ message: "STOPPED: stop after refusal\n" },
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(reportChecks(f)[0]).toMatchObject({ accepted: false });
		expect(autoResumes(f)[0].claimFailures.join("\n")).toContain(message);
	});
});
