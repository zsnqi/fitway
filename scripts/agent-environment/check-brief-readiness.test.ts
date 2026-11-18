import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { codexScopeProblem } from "./brief-markdown.mjs";
import {
	checkBrief,
	formatBriefResult,
	parseBriefArgs,
} from "./check-brief.mjs";
import {
	createReviewSourceRoot,
	environment,
	fixture,
	removeBriefFixtures,
	repository,
	script,
} from "./check-brief-fixture";

afterEach(removeBriefFixtures);
beforeAll(createReviewSourceRoot);

describe("brief-format: shared environment and brief role", () => {
	it.each([
		"codex",
		"builder",
		"designer",
		"verifier",
	])("accepts role %s and ignores line-ending differences", async (role) => {
		const f = fixture();
		const text = f.valid
			.replace(
				"role: codex delivers: report",
				role === "codex" ? "role: codex delivers: report" : `role: ${role}`,
			)
			.replace(/\r?\n/g, "\r\n");
		expect((await f.check(text)).ok).toBe(true);
	});

	it("rejects missing, unknown, misplaced and BOM-prefixed format headers", async () => {
		const f = fixture();
		for (const text of [
			f.valid.replace(/^.*\n/, ""),
			f.valid.replace("role: codex", "role: other"),
			`\n${f.valid}`,
			`\uFEFF${f.valid}`,
		])
			expect(formatBriefResult(await f.check(text))).toMatch(
				/:1: FAIL brief-format: must start/,
			);
	});

	it("rejects missing, duplicate, reversed markers and shared-rule drift", async () => {
		const f = fixture();
		for (const text of [
			f.valid.replace("<!-- environment:end -->", ""),
			`${f.valid}\n${environment}`,
			f.valid
				.replace("<!-- environment:start v1 -->", "<!-- environment:end -->")
				.replace(
					/<!-- environment:end -->\n\n- Work/,
					"<!-- environment:start v1 -->\n\n- Work",
				),
			f.valid.replace("Never push, fetch, switch", "Push when ready"),
		])
			expect(
				(await f.check(text)).problems.some(
					(problem: { rule: string }) => problem.rule === "brief-format",
				),
			).toBe(true);
	});

	it.each([
		"\n",
		"\r\n",
	])("fills only empty markers and preserves all other bytes with %j endings", async (eol) => {
		const f = fixture();
		const empty = f.valid
			.replace(
				environment,
				"<!-- environment:start v1 -->\n\n<!-- environment:end -->\n",
			)
			.replace(/\r?\n/g, eol);
		const expected = f.valid.replace(/\r?\n/g, eol);
		expect((await f.check(empty, true)).filled).toBe(true);
		expect(readFileSync(f.briefPath, "utf8")).toBe(expected);
		expect(readFileSync(f.briefPath)[0]).not.toBe(0xef);
		const before = readFileSync(f.briefPath);
		expect(
			(
				await checkBrief({
					repositoryRoot: f.commandRepository,
					briefPath: f.briefPath,
					fillEnvironment: true,
				})
			).filled,
		).toBe(false);
		expect(readFileSync(f.briefPath)).toEqual(before);
	});

	it("leaves nonempty drift and briefs with missing markers byte-for-byte untouched", async () => {
		const f = fixture();
		for (const text of [
			f.valid.replace("Never push", "Please push"),
			f.valid.replace(environment, ""),
		]) {
			const result = await f.check(text, true);
			expect(result.ok).toBe(false);
			expect(result.filled).toBe(false);
			expect(readFileSync(f.briefPath, "utf8")).toBe(text);
		}
	});
});

describe("brief-readiness, Scope, and ID counts: launch readiness and diagnostics", () => {
	it.each([
		"coordinator checklist",
		"COORDINATOR CHECKLIST",
		"CoOrDiNaToR ChEcKlIsT",
	])("rejects the %s heading in any case", async (heading) => {
		const f = fixture();
		const text = `${f.valid}\n## ${heading} (delete before launch)\n`;
		const result = await f.check(text);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(1);
		expect(result.problems[0].rule).toBe("brief-readiness");
		expect(text.split("\n")[result.problems[0].line - 1]).toBe(
			`## ${heading} (delete before launch)`,
		);
	});

	it("reports placeholders and Coordinator checklist on their exact lines", async () => {
		const f = fixture();
		const text = `${f.valid}\n<Fill goal>\n## Coordinator checklist (delete before launch)\n`;
		const result = await f.check(text);
		expect(result.problems).toHaveLength(2);
		const sourceLines = text.split("\n");
		for (const problem of result.problems)
			expect(sourceLines[problem.line - 1]).toMatch(
				/<Fill goal>|## Coordinator checklist/,
			);
		expect(
			(
				await f.check(
					`${f.valid}\n<!-- <comment placeholder> -->\n\`<code placeholder>\`\n\`\`<two-backtick placeholder>\`\`\n`,
				)
			).ok,
		).toBe(true);
	});

	it("rejects forbidden codex text in any case and allows it in other roles", async () => {
		const f = fixture();
		const text = `${f.valid}\n\`FITWAY-GRADER\` <!-- HeLd-OuT -->\n`;
		expect(
			(await f.check(text)).problems.filter(
				(problem: { rule: string }) => problem.rule === "brief-readiness",
			),
		).toHaveLength(2);
		for (const role of ["builder", "designer", "verifier"])
			expect(
				(
					await f.check(
						text.replace("role: codex delivers: report", `role: ${role}`),
					)
				).ok,
			).toBe(true);
	});

	it("prints outcome and limit ID counts without a length warning", async () => {
		const f = fixture();
		const result = await f.check(
			`${f.valid}\n## Causes and required outcomes\n\n- **C1.** First.\n- **C2.** Second.\n\n## Limits\n\n- **L1.** Keep it.\n\n${"Detail.\n".repeat(81)}`,
		);
		expect(result.ok).toBe(true);
		expect(result.outcomeIds).toBe(2);
		expect(result.limitIds).toBe(1);
		expect(formatBriefResult(result)).toContain(
			"INFO brief-ids: 2 outcome IDs, 1 limit IDs",
		);
		expect(formatBriefResult(result)).not.toContain("brief-length");
	});

	it("fails a Codex Scope with the wrong final visible sentence", async () => {
		const f = fixture();
		const sentence =
			"If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.";
		expect(codexScopeProblem(`## Scope\n\nOnly this.\n${sentence}`)).toBeNull();
		expect(
			codexScopeProblem(
				"## Scope\n\nOnly this.\nIf an outcome cannot be met, do not work around it:\nfinish and measure the others, then stop and report.",
			),
		).toBeNull();
		expect(codexScopeProblem("## Goal\n\nNo scope.\n")).toMatchObject({
			line: 1,
		});
		expect(
			codexScopeProblem(`## Scope\n\n${sentence}\n\n## Scope\n\n${sentence}\n`),
		).toMatchObject({ line: 1 });
		expect(
			codexScopeProblem("## Scope\n\nWrong final sentence.\n"),
		).toMatchObject({ line: 1 });
		expect(
			codexScopeProblem(
				`## Scope\n\nUnmet outcomes are reported. ${sentence}\n<!-- ${sentence} -->\n\`${sentence}\`\n`,
			),
		).toBeNull();

		const missing = await f.check(
			f.valid.replace(/\n## Scope\n[\s\S]*?(?=\n## Report)/, "\n"),
		);
		expect(
			missing.problems.some(
				(problem: { rule: string }) => problem.rule === "brief-scope",
			),
		).toBe(true);
	});

	it("fails brief:check when a Codex brief has no Scope or its sentence is indented code", async () => {
		const f = fixture();
		const sentence =
			"If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.";
		const cases = [
			["no Scope and no Report", f.valid.slice(0, f.valid.indexOf("## Scope"))],
			[
				"Scope sentence in indented code",
				f.valid.replace(
					`## Scope\n\nWrite only in the fixture. ${sentence}`,
					`## Scope\n\n    ${sentence}`,
				),
			],
		] as const;

		for (const [name, text] of cases) {
			const result = await f.check(text);
			expect(
				result.problems.some(
					(problem: { rule: string }) => problem.rule === "brief-scope",
				),
				name,
			).toBe(true);

			writeFileSync(f.briefPath, text);
			const cli = spawnSync(process.execPath, [script, f.briefPath], {
				cwd: f.commandRepository,
				encoding: "utf8",
				windowsHide: true,
			});
			expect(cli.status, name).toBe(1);
			expect(cli.stdout, name).toContain("FAIL brief-scope:");
		}
	});

	it("rejects the five historical briefs and accepts the frozen r04 briefs", () => {
		const historicalDirectory = path.join(
			repository,
			"scripts/agent-environment/fixtures/historical-briefs",
		);
		const historical = [
			"codex-motion-lows.md",
			"codex-three-rounds-fix.md",
			"codex-one-clock.md",
			"codex-narrow-sheet.md",
			"codex-variants-removal.md",
		];
		for (const name of historical) {
			const text = readFileSync(path.join(historicalDirectory, name), "utf8");
			expect(codexScopeProblem(text), name).toMatchObject({
				message: expect.stringContaining("Codex Scope must end with"),
			});
		}

		const currentDirectory = path.join(
			repository,
			"scripts/agent-environment/fixtures/brief-outcomes",
		);
		for (const entry of readdirSync(currentDirectory)) {
			if (!entry.endsWith(".md")) continue;
			const text = readFileSync(path.join(currentDirectory, entry), "utf8");
			expect(codexScopeProblem(text), entry).toBeNull();
		}
	});

	it.each([
		"codex",
		"builder",
		"designer",
		"verifier",
	])("fails the real %s template and names the broken rules", async (role) => {
		const result = await checkBrief({
			repositoryRoot: repository,
			briefPath: `docs/agent-context/briefs/${role}.md`,
		});
		expect(result.ok).toBe(false);
		expect(
			result.problems.some(
				(problem: { rule: string }) => problem.rule === "brief-references",
			),
		).toBe(true);
		expect(
			result.problems.some(
				(problem: { rule: string }) => problem.rule === "brief-readiness",
			),
		).toBe(true);
		for (const line of formatBriefResult(result).split("\n"))
			expect(line).toMatch(
				/:\d+: (?:FAIL brief-(?:references|format|readiness|scope):|INFO brief-ids:)/,
			);
	});

	it("CLI returns only 0 or 1 with one numbered line per problem, including read errors", () => {
		const f = fixture();
		writeFileSync(f.briefPath, `${f.valid}\n${"detail\n".repeat(81)}`);
		const run = (args: string[]) =>
			spawnSync(process.execPath, [script, ...args], {
				cwd: f.commandRepository,
				encoding: "utf8",
				windowsHide: true,
			});
		const pass = run(["brief.md"]);
		expect(pass.status).toBe(0);
		expect(pass.stdout).toContain("INFO brief-ids:");
		expect(pass.stdout).not.toContain("brief-length");
		writeFileSync(f.briefPath, `${f.valid}\n<unfilled>\n`);
		const fail = run(["brief.md"]);
		expect(fail.status).toBe(1);
		expect(fail.stdout.trim().split("\n")).toHaveLength(2);
		expect(fail.stdout).toMatch(/:\d+: FAIL brief-readiness:/);
		const missing = run(["missing.md"]);
		expect(missing.status).toBe(1);
		expect(missing.stderr.trim().split("\n")).toHaveLength(1);
		expect(missing.stderr).toContain("brief:check:1: FAIL:");
		expect(run([]).status).toBe(1);
		expect(
			execFileSync(process.execPath, [script, "--help"], {
				cwd: f.commandRepository,
				encoding: "utf8",
				windowsHide: true,
			}),
		).toContain("Usage: pnpm brief:check");
	});

	it("accepts the pnpm separator and flag in either position; rejects ambiguous arguments", () => {
		expect(parseBriefArgs(["--", "brief.md", "--fill-environment"])).toEqual({
			briefPath: "brief.md",
			fillEnvironment: true,
		});
		expect(parseBriefArgs(["--fill-environment", "brief.md"]).briefPath).toBe(
			"brief.md",
		);
		for (const args of [
			[],
			["--unknown"],
			["one.md", "two.md"],
			["--fill-environment", "--fill-environment", "brief.md"],
		])
			expect(() => parseBriefArgs(args)).toThrow();
	});
});
