import { describe, expect, it } from "vitest";
import { collectCodeHealth, scanScope } from "./code-health.mjs";

const repeated = Array.from(
	{ length: 10 },
	(_, index) => `const repeated${index} = ${index};`,
).join("\n");

describe("gardener code-health fixtures", () => {
	it("finds every planted measure with file and line evidence", () => {
		const giant = `${Array.from({ length: 801 }, (_, index) => `const line${index} = ${index};`).join("\n")}\n`;
		const files = [
			{ file: "giant.js", text: giant },
			{
				file: "types.ts",
				text: "const value: any = source as unknown as Target;\n// @ts-ignore\n// @ts-expect-error\n",
			},
			{
				file: "suppressed.js",
				text: "// biome-ignore lint\n/* eslint-disable no-alert */\n",
			},
			{ file: "workaround.css", text: ".x { color: red !important; }\n" },
			{
				file: "workaround.js",
				text: "requestAnimationFrame(() => requestAnimationFrame(run));\nsetTimeout(run, 0);\nsetTimeout(run);\n// TODO: remove workaround\n",
			},
			{ file: "first.js", text: `${repeated}\n` },
			{ file: "second.js", text: `${repeated}\n` },
			{ file: "app.js", text: 'document.querySelector("#only-page");\n' },
			{ file: "index.html", text: '<main id="only-page"></main>\n' },
			{ file: "reports.html", text: "<main></main>\n" },
		];
		const report = scanScope(files, { sharedFiles: ["app.js"] });
		expect(report.giantFiles.total).toBe(1);
		expect(report.giantFiles.hits[0]).toMatchObject({
			file: "giant.js",
			line: 1,
		});
		expect(report.typeEscapes.total).toBe(4);
		expect(report.suppressions.total).toBe(2);
		expect(report.repeatedWorkarounds.total).toBe(6);
		expect(report.duplication.total).toBe(1);
		expect(report.duplication.hits[0].places).toEqual([
			{ file: "first.js", line: 1 },
			{ file: "second.js", line: 1 },
		]);
		expect(report.boundaryBreaks.total).toBe(1);
		expect(report.boundaryBreaks.hits[0]).toMatchObject({
			file: "app.js",
			line: 1,
		});
	});

	it("reports a clean fixture with zero totals", () => {
		const report = scanScope(
			[
				{ file: "clean.ts", text: "export const answer: number = 42;\n" },
				{ file: "index.html", text: "<main></main>\n" },
				{ file: "app.js", text: "document.body;\n" },
			],
			{ sharedFiles: ["app.js"] },
		);
		for (const value of Object.values(report)) expect(value.total).toBe(0);
	});

	it("adds previous totals and leaves an unreadable branch unknown", async () => {
		const calls: string[] = [];
		const git = (args: string[]) => {
			calls.push(args.join(" "));
			if (args[0] === "ls-tree") return "concept/app.js\n";
			if (args[0] === "ls-files") return "scripts/tool.js\0";
			if (args[0] === "show" && args[1] === "owner:concept/app.js")
				return "document.body;\n";
			if (args[0] === "show" && args[1] === "HEAD:scripts/tool.js")
				return "// TODO\n";
			throw new Error("missing object");
		};
		const previous = {
			comparedWith: "old-report",
			scopes: [
				{
					name: "concept",
					measures: Object.fromEntries(
						[
							"giantFiles",
							"typeEscapes",
							"suppressions",
							"repeatedWorkarounds",
							"duplication",
							"boundaryBreaks",
						].map((name) => [name, { total: 4 }]),
					),
				},
				{
					name: "tooling",
					measures: Object.fromEntries(
						[
							"giantFiles",
							"typeEscapes",
							"suppressions",
							"repeatedWorkarounds",
							"duplication",
							"boundaryBreaks",
						].map((name) => [name, { total: 0 }]),
					),
				},
			],
		};
		const result = await collectCodeHealth({
			config: {
				codeHealth: {
					concept: { branch: "owner", folder: "concept", sharedFiles: [] },
					toolingRoots: ["scripts"],
				},
			},
			git,
			previousReportText: `## codeHealth\n\n\`\`\`json\n${JSON.stringify(previous)}\n\`\`\``,
			previousReportSource: "REPORT.md",
		});
		expect(result.comparedWith).toBe("REPORT.md");
		expect(result.scopes[0].measures.giantFiles).toMatchObject({
			total: 0,
			previous: 4,
			trend: -4,
		});
		expect(result.scopes[1].measures.repeatedWorkarounds).toMatchObject({
			total: 1,
			previous: 0,
			trend: 1,
		});
		expect(
			calls.some((call) => call.startsWith("ls-tree -r --name-only owner")),
		).toBe(true);

		const unknown = await collectCodeHealth({
			config: {
				codeHealth: {
					concept: { branch: "missing", folder: "concept", sharedFiles: [] },
					toolingRoots: ["scripts"],
				},
			},
			git: (args: string[]) => {
				if (args[0] === "ls-tree") throw new Error("fatal: bad object missing");
				if (args[0] === "ls-files") return "";
				throw new Error("unexpected object");
			},
		});
		expect(unknown.scopes[0]).toMatchObject({
			status: "unknown",
			reason: "fatal: bad object missing",
		});
		expect(unknown.scopes[0].measures.giantFiles.total).toBeNull();
	});
});
