import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	collectCodeHealth,
	deriveSharedFiles,
	scanScope,
} from "./code-health.mjs";
import * as survey from "./survey.mjs";

const repeated = Array.from(
	{ length: 10 },
	(_, index) => `const repeated${index} = ${index};`,
).join("\n");

function fixtureGit(files: { file: string; text: string }[]) {
	return (args: string[]) => {
		if (args[0] === "ls-tree") return files.map(({ file }) => file).join("\n");
		if (args[0] === "ls-files") return "";
		if (args[0] === "show") {
			const file = files.find(({ file }) => args[1].endsWith(`:${file}`));
			if (file) return file.text;
		}
		throw new Error(`Unexpected git read: ${args.join(" ")}`);
	};
}

function boundaryFixture(total: number, shared = "shared.js") {
	return [
		{
			file: "concept/a.html",
			text: `<main id="only-a"></main><script src="${shared}"></script>`,
		},
		{ file: "concept/b.html", text: `<script src="${shared}"></script>` },
		{
			file: `concept/${shared}`,
			text: Array.from(
				{ length: total },
				() => 'document.getElementById("only-a");',
			).join("\n"),
		},
	];
}

describe("gardener weekly code-health regressions", () => {
	it("round trips weekly Markdown with a rise, a fall, and order-independent baselines", async () => {
		const config = {
			codeHealth: {
				concept: { branch: "owner", folder: "concept" },
				toolingRoots: [],
			},
		};
		const read = (
			total: number,
			previousReportText?: string,
			shared = "shared.js",
		) =>
			collectCodeHealth({
				config,
				git: fixtureGit(boundaryFixture(total, shared).reverse()),
				previousReportText,
			});
		const write = (codeHealth: Awaited<ReturnType<typeof collectCodeHealth>>) =>
			survey.formatReport({ codeHealth });
		const first = await read(1);
		expect(first.scopes[0].measures.boundaryBreaks).toMatchObject({
			total: 1,
			previous: null,
			trend: "starts new baseline",
		});
		const firstText = write(first);
		expect(firstText).toContain("trend starts new baseline");
		const rise = await read(3, firstText);
		expect(rise.scopes[0].measures.boundaryBreaks).toMatchObject({
			total: 3,
			previous: 1,
			trend: 2,
		});
		expect(write(rise)).toContain("- boundaryBreaks: 3 (previous 1; trend +2)");
		const fall = await read(1, write(rise));
		expect(fall.scopes[0].measures.boundaryBreaks).toMatchObject({
			total: 1,
			previous: 3,
			trend: -2,
		});
		expect(write(fall)).toContain("- boundaryBreaks: 1 (previous 3; trend -2)");
		const reordered = {
			...fall,
			scopes: fall.scopes.map((scope) => ({
				...scope,
				sharedFiles: scope.sharedFiles?.toReversed(),
			})),
		};
		expect(
			(await read(2, write(reordered))).scopes[0].measures.boundaryBreaks,
		).toMatchObject({ previous: 1, trend: 1 });
		const changedList = await read(2, write(fall), "other.js");
		expect(changedList.scopes[0].measures.boundaryBreaks).toMatchObject({
			previous: null,
			trend: "starts new baseline",
		});
		const changedMethod = {
			...fall,
			scopes: fall.scopes.map((scope) => ({
				...scope,
				baselineKey: "different-method",
			})),
		};
		expect(
			(await read(2, write(changedMethod))).scopes[0].measures.boundaryBreaks,
		).toMatchObject({ previous: null, trend: "starts new baseline" });
	});

	it("starts a derived baseline against the shipped pre-derivation report and legacy totals", async () => {
		const config = {
			codeHealth: {
				concept: { branch: "owner", folder: "concept" },
				toolingRoots: [],
			},
		};
		for (const previousReportText of [
			readFileSync(new URL("./REPORT.md", import.meta.url), "utf8"),
			"## Code health\n\n### concept (ok)\n- boundaryBreaks: 99 (previous 98; trend +1)\n",
		]) {
			const result = await collectCodeHealth({
				config,
				git: fixtureGit(boundaryFixture(1)),
				previousReportText,
			});
			expect(result.scopes[0].measures.boundaryBreaks).toMatchObject({
				total: 1,
				previous: null,
				trend: "starts new baseline",
			});
		}
	});

	it.each([
		[
			"HTML single-line comment",
			".html",
			'<!-- <script src="ghost.js"></script><link rel="stylesheet" href="ghost.css"> -->',
		],
		[
			"HTML multiline comment",
			".html",
			'<!--\n<script src="ghost.js"></script>\n<link rel="stylesheet" href="ghost.css">\n-->',
		],
		[
			"HTML quoted attribute",
			".html",
			`<div title='<script src="ghost.js"></script>'></div>`,
		],
		[
			"HTML inline script strings",
			".html",
			`<script>const tag = '<script src="ghost.js">'; const css = '<link rel="stylesheet" href="ghost.css">';</script>`,
		],
		["CSS single-line block comment", ".css", '/* @import "ghost.css"; */'],
		[
			"CSS multiline block comment",
			".css",
			'/*\n@import url("ghost.css");\n*/',
		],
		[
			"CSS double-quoted string",
			".css",
			`.x { content: "@import 'ghost.css';"; }`,
		],
		[
			"CSS single-quoted string",
			".css",
			`.x { content: '@import "ghost.css";'; }`,
		],
		[
			"CSS multiline escaped string",
			".css",
			`.x { content: "before\\\n@import 'ghost.css';"; }`,
		],
		[
			"JavaScript line comment",
			".js",
			'// import "ghost.js";\n// import("ghost.js");',
		],
		["JavaScript block comment", ".js", '/* import "ghost.js"; */'],
		[
			"JavaScript multiline block comment",
			".js",
			'/*\nimport "ghost.js";\nexport { ghost } from "ghost.js";\n*/',
		],
		[
			"JavaScript double-quoted string",
			".js",
			`const text = "import 'ghost.js';";`,
		],
		[
			"JavaScript single-quoted string",
			".js",
			`const text = 'import("ghost.js");';`,
		],
		[
			"JavaScript escaped string",
			".js",
			`const text = "escaped \\" import 'ghost.js';";`,
		],
		[
			"JavaScript multiline escaped string",
			".js",
			`const text = "before\\\nimport 'ghost.js';";`,
		],
		["JavaScript template string", ".js", 'const text = `import "ghost.js";`;'],
		[
			"JavaScript multiline template string",
			".js",
			'const text = `\nimport "ghost.js";\n`;',
		],
	])("ignores %s as a load", (_name, extension, text) => {
		const load =
			extension === ".html"
				? text
				: extension === ".css"
					? '<link rel="stylesheet" href="entry.css">'
					: '<script src="entry.js"></script>';
		const files = [
			{ file: "a.html", text: load },
			{ file: "b.html", text: load },
			{ file: `entry${extension}`, text },
			{ file: "ghost.js", text: "document.body;" },
			{ file: "ghost.css", text: ".ghost {}" },
		];
		expect(deriveSharedFiles(files)).toEqual(
			extension === ".html" ? [] : [`entry${extension}`],
		);
	});

	it("follows actual static, dynamic and re-export imports while skipping their quoted surroundings", () => {
		const files = boundaryFixture(0);
		files[2].text =
			'import "side.js"; import { value } from "named.js"; export { value } from "export.js"; import("dynamic.js");';
		files.push(
			...["side.js", "named.js", "export.js", "dynamic.js"].map((file) => ({
				file: `concept/${file}`,
				text: "",
			})),
		);
		expect(deriveSharedFiles(files)).toEqual([
			"concept/dynamic.js",
			"concept/export.js",
			"concept/named.js",
			"concept/shared.js",
			"concept/side.js",
		]);
	});

	it("the shipped weekly code-health step derives exactly the loaded paths using its loaded configuration", async () => {
		const config = JSON.parse(
			readFileSync(new URL("./config.json", import.meta.url), "utf8"),
		);
		expect(config.codeHealth.concept).not.toHaveProperty("sharedFiles");
		const folder = config.codeHealth.concept.folder;
		const files = boundaryFixture(1).map(({ file, text }) => ({
			file: file.replace("concept", folder),
			text,
		}));
		files.push({
			file: `${folder}/unused.js`,
			text: 'document.getElementById("only-a");',
		});
		files.push({
			file: `${folder}/${config.codeHealth.concept.specimenPages[0]}`,
			text: '<script src="unused.js"></script>',
		});
		const result = await survey.collectSurveyCodeHealth({
			readGit: fixtureGit(files),
		});
		expect(result.scopes[0]).toMatchObject({
			status: "ok",
			source: config.codeHealth.concept.branch,
			sharedFiles: [`${folder}/shared.js`],
		});
		expect(result.scopes[0].measures.boundaryBreaks).toMatchObject({
			total: 1,
			hits: [{ file: `${folder}/shared.js` }],
		});
	});
});

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
		expect(report.duplication.total).toBe(2);
		expect(report.duplication.hits[0].places).toEqual([
			{ file: "first.js", line: 1, endLine: 10 },
			{ file: "second.js", line: 1, endLine: 10 },
		]);
		expect(report.boundaryBreaks.total).toBe(1);
		expect(report.boundaryBreaks.hits[0]).toMatchObject({
			file: "app.js",
			line: 1,
		});
	});

	it("H1 counts long functions over methods, nesting and the listed extensions", () => {
		const body = Array.from(
			{ length: 80 },
			(_, index) => `                void ${index};`,
		).join("\n");
		const result = scanScope([
			{
				file: "long.tsx",
				text: [
					"const object = {",
					"        method() {",
					body,
					"        },",
					"};",
				].join("\n"),
			},
			{
				file: "nested.cjs",
				text: [
					"function outer() {",
					"        const inner = () => {",
					body,
					"        };",
					"}",
				].join("\n"),
			},
		]);
		expect(result.longFunctions?.total ?? 0).toBe(3);
	});

	it("H3 counts a copied callback body below the old ten-line window", () => {
		const body = [
			"const f = fixture();",
			"const result = invokeClaim(",
			"  f,",
			"  commandEvent(command, 0, claimOutput) +",
			'    commandEvent("node scripts/verify.mjs fast"),',
			");",
			"expect(result.status, result.output).toBe(0);",
			'expect(f.captured().args).not.toContain("resume");',
			"});",
		].join("\n");
		const result = scanScope([
			{
				file: "codex-round.test.ts",
				text: [
					'it.each([["bash", "one"]])("case one", (_name, command) => {',
					body,
					'it.each([["PowerShell", "two"]])("case two", (_name, command) => {',
					body,
				].join("\n"),
			},
		]);
		expect(result.duplication.total).toBe(2);
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

	it("derives shared files from page loads and page-added files", () => {
		const files = [
			{
				file: "index.html",
				text: '<link rel="stylesheet" href="style.css"><script src="page.js"></script>',
			},
			{
				file: "reports.html",
				text: '<link rel="stylesheet" href="style.css"><script src="page.js"></script>',
			},
			{
				file: "components.html",
				text: '<link rel="stylesheet" href="specimen.css"><script src="specimen.js"></script>',
			},
			{ file: "style.css", text: '@import "tokens.css";' },
			{ file: "tokens.css", text: ".token { color: red; }" },
			{ file: "page.js", text: 'import "shared-module.js";' },
			{ file: "shared-module.js", text: "export const ready = true;" },
			{ file: "specimen.css", text: ".specimen {}" },
			{ file: "specimen.js", text: "document.body;" },
			{ file: "unused.css", text: ".unused {}" },
		];
		expect(
			deriveSharedFiles(files, { specimenPages: ["components.html"] }),
		).toEqual(["page.js", "shared-module.js", "style.css", "tokens.css"]);
	});

	it("follows CSS and JavaScript imports from a shared page load", () => {
		const files = [
			{
				file: "a.html",
				text: '<link rel="stylesheet" href="shared.css"><script src="shared.js"></script>',
			},
			{
				file: "b.html",
				text: '<link rel="stylesheet" href="shared.css"><script src="shared.js"></script>',
			},
			{ file: "shared.css", text: '@import url("nested/tokens.css");' },
			{ file: "nested/tokens.css", text: ".token {}" },
			{ file: "shared.js", text: 'import "nested/module.js";' },
			{ file: "nested/module.js", text: "export const value = 1;" },
		];
		expect(deriveSharedFiles(files)).toEqual([
			"nested/module.js",
			"nested/tokens.css",
			"shared.css",
			"shared.js",
		]);
	});

	it("matches boundary files by exact path rather than basename", () => {
		const report = scanScope(
			[
				{
					file: "root/shared.js",
					text: 'document.querySelector("#only-root");',
				},
				{
					file: "nested/shared.js",
					text: 'document.querySelector("#only-nested");',
				},
				{
					file: "page.html",
					text: '<main id="only-root"></main><main id="only-nested"></main>',
				},
			],
			{ sharedFiles: ["root/shared.js"] },
		);
		expect(report.boundaryBreaks.total).toBe(1);
		expect(report.boundaryBreaks.hits[0].file).toBe("root/shared.js");
	});

	it("marks a changed concept method as a new boundary baseline", async () => {
		const git = (args: string[]) => {
			if (args[0] === "ls-tree") return "concept/a.html\nconcept/shared.js\n";
			if (args[0] === "ls-files") return "scripts/tool.js\0";
			if (args[0] === "show" && args[1] === "owner:concept/a.html")
				return '<script src="shared.js"></script>';
			if (args[0] === "show" && args[1] === "owner:concept/shared.js")
				return "document.body;";
			if (args[0] === "show" && args[1] === "HEAD:scripts/tool.js")
				return "const tool = true;";
			throw new Error("missing object");
		};
		const previous = {
			scopes: [
				{
					name: "concept",
					baselineKey: "hand-list-v0",
					measures: { boundaryBreaks: { total: 9 } },
				},
				{ name: "tooling", measures: {} },
			],
		};
		const result = await collectCodeHealth({
			config: {
				codeHealth: {
					concept: { branch: "owner", folder: "concept" },
					toolingRoots: ["scripts"],
				},
			},
			git,
			previousReportText: [
				"## codeHealth",
				"",
				"```json",
				JSON.stringify(previous),
				"```",
			].join("\n"),
			previousReportSource: "REPORT.md",
		});
		expect(result.scopes[0].measures.boundaryBreaks).toMatchObject({
			previous: null,
			trend: "starts new baseline",
		});
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
