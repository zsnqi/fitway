import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { snapshotCodeHealth } from "../../../scripts/agent-environment/code-health-baseline.mjs";
import { collectCodeHealth, scanScope } from "./code-health.mjs";
import { formatReport } from "./survey.mjs";

describe("round 24 repair controls", () => {
	it.each([
		["typeEscapes", "value: any; value as unknown as Target;"],
		[
			"repeatedWorkarounds",
			"requestAnimationFrame(() => requestAnimationFrame(run));",
		],
		["repeatedWorkarounds", "setTimeout(run, 0); setTimeout(run);"],
	])("excludes %s patterns from non-code: %s", (measure, pattern) => {
		const text = [
			`const quoted = ${JSON.stringify(pattern)};`,
			`const template = \`${pattern}\`;`,
			`// ${pattern}`,
			`/* ${pattern} */`,
		].join("\n");
		expect(scanScope([{ file: "negative.ts", text }])[measure].total).toBe(0);
	});
	it("ignores code patterns in TypeScript strings, templates, regexes and comments", () => {
		const text = [
			'const quoted = "value: any; value as unknown as Target; @ts-ignore; requestAnimationFrame(() => requestAnimationFrame(run)); setTimeout(run, 0); TODO FIXME HACK workaround !important // biome-ignore eslint-disable";',
			"const template = `value: any; value as unknown as Target; @ts-expect-error; requestAnimationFrame(() => requestAnimationFrame(run)); setTimeout(run, 0); TODO FIXME HACK workaround !important`;",
			"// value: any; value as unknown as Target; requestAnimationFrame(() => requestAnimationFrame(run)); setTimeout(run, 0); !important",
			"/* value: any; requestAnimationFrame(() => requestAnimationFrame(run)); setTimeout(run); */",
			"const pattern = /any|setTimeout(run, 0)|TODO/;",
		].join("\n");
		const result = scanScope([{ file: "text-only.ts", text }]);
		for (const measure of Object.values(result)) expect(measure.total).toBe(0);
	});

	it("counts real TypeScript type nodes and comment directives with exact lines", () => {
		const result = scanScope([
			{
				file: "types.ts",
				text: [
					"const any = 1;",
					"const values: Array<any> = [];",
					"const cast = source as unknown as Target;",
					"// @ts-ignore",
					"// @ts-expect-error",
				].join("\n"),
			},
		]);
		expect(result.typeEscapes.hits).toEqual([
			{ file: "types.ts", line: 2, detail: "any used as a type" },
			{ file: "types.ts", line: 3, detail: "cast through unknown" },
			{ file: "types.ts", line: 4, detail: "@ts-ignore" },
			{ file: "types.ts", line: 5, detail: "@ts-expect-error" },
		]);
	});

	it("counts direct animation-frame nesting without nearby unrelated calls", () => {
		const result = scanScope([
			{
				file: "calls.js",
				text: [
					"requestAnimationFrame(() => {",
					"  requestAnimationFrame(run);",
					"});",
					"requestAnimationFrame(run); requestAnimationFrame(other);",
					"requestAnimationFrame(() => { setTimeout(() => requestAnimationFrame(run), 5); });",
				].join("\n"),
			},
		]);
		expect(result.repeatedWorkarounds.hits).toEqual([
			{ file: "calls.js", line: 1, detail: "nested requestAnimationFrame" },
		]);
	});

	it("counts zero and omitted timeout delays with multiline callbacks", () => {
		const result = scanScope([
			{
				file: "timeouts.ts",
				text: [
					"setTimeout(() => {",
					"  run();",
					"}, 0);",
					"setTimeout(() => run());",
					"setTimeout(run, 12);",
				].join("\n"),
			},
		]);
		expect(result.repeatedWorkarounds.hits).toEqual([
			{
				file: "timeouts.ts",
				line: 1,
				detail: "zero or omitted setTimeout delay",
			},
			{
				file: "timeouts.ts",
				line: 4,
				detail: "zero or omitted setTimeout delay",
			},
		]);
	});

	it("counts markers and suppressions only in actual comments", () => {
		const result = scanScope([
			{
				file: "comments.ts",
				text: [
					'const fake = "// TODO FIXME HACK workaround biome-ignore eslint-disable";',
					"const template = `/* TODO biome-ignore */`;",
					"// TODO FIXME HACK workaround",
					"/* biome-ignore lint */ // eslint-disable no-alert",
				].join("\n"),
			},
		]);
		expect(result.repeatedWorkarounds.total).toBe(4);
		expect(
			result.repeatedWorkarounds.hits.every(
				(hit: { line: number }) => hit.line === 3,
			),
		).toBe(true);
		expect(result.suppressions.total).toBe(2);
		expect(
			result.suppressions.hits.every((hit: { line: number }) => hit.line === 4),
		).toBe(true);
	});

	it("counts important only in CSS and HTML styles, excluding comments and quoted CSS", () => {
		const result = scanScope([
			{
				file: "styles.css",
				text: '/* !important */\n.x { content: "!important"; color: red !important; }',
			},
			{
				file: "page.html",
				text: [
					"<!-- <style>.fake {color:red !important}</style> -->",
					'<p title="!important" style="color: red !important">!important</p>',
					"<style>.real { color: blue !important; }</style>",
					'<script>const fake = "<style>!important</style>";</script>',
				].join("\n"),
			},
		]);
		expect(result.repeatedWorkarounds.hits).toEqual([
			{ file: "styles.css", line: 2, detail: "!important" },
			{ file: "page.html", line: 2, detail: "!important" },
			{ file: "page.html", line: 3, detail: "!important" },
		]);
	});

	it("reports one extended duplicate block with all three places", () => {
		const block = Array.from({ length: 12 }, (_, i) => `line ${i}`).join("\n");
		const result = scanScope([
			{ file: "a.js", text: `\n${block}` },
			{
				file: "b.js",
				text: block
					.split("\n")
					.map((line) => `  ${line} `)
					.join("\n"),
			},
			{ file: "c.js", text: `heading\n\n${block}` },
		]);
		expect(result.duplication.total).toBe(3);
		expect(result.duplication.hits[0]).toMatchObject({
			lineCount: 12,
			places: [
				{ file: "a.js", line: 2 },
				{ file: "b.js", line: 1 },
				{ file: "c.js", line: 3 },
			],
		});
	});

	it("N2 exempts only the copy carrying the exception", () => {
		const block = Array.from(
			{ length: 8 },
			(_, index) => `const marked${index} = ${index};`,
		);
		const marked = [
			`${block[0]} // code-health-exception: duplication; until=2026-11-17; reason=test`,
			...block.slice(1),
		].join("\n");
		const result = snapshotCodeHealth(
			[{ file: "marked.ts", text: `${marked}\n${block.join("\n")}\n` }],
			{ today: "2026-10-17" },
		);
		expect(result.counts["marked.ts"]?.duplication).toBe(1);
	});

	it("does not count the test fixtures' source text as code defects", () => {
		const result = scanScope([
			{
				file: "fixtures.ts",
				text: readFileSync(
					new URL("./code-health.test.ts", import.meta.url),
					"utf8",
				),
			},
		]);
		expect(result.typeEscapes.total).toBe(0);
		expect(result.suppressions.total).toBe(0);
		expect(result.repeatedWorkarounds.total).toBe(0);
	});

	it("prints all duplicate places and reads trend totals back from its report", async () => {
		const text = Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n");
		const scopes = [
			{
				name: "concept",
				status: "ok",
				measures: scanScope([
					{ file: "a.js", text },
					{ file: "b.js", text },
					{ file: "c.js", text },
				]),
			},
		];
		const printed = formatReport({
			checks: [],
			codeHealth: { comparedWith: "older", scopes },
		});
		for (const file of ["a.js", "b.js", "c.js"])
			expect(printed).toContain(`${file}:1`);
		const next = await collectCodeHealth({
			config: {
				codeHealth: {
					concept: { branch: "owner", folder: "concept" },
					toolingRoots: ["scripts"],
				},
			},
			git: (args: string[]) =>
				args[0] === "ls-tree"
					? "concept/clean.js"
					: args[0] === "show"
						? "const clean = 1;"
						: "",
			previousReportText: printed,
			previousReportSource: "rolling/REPORT.md",
		});
		expect(next.scopes[0].measures.duplication).toMatchObject({
			total: 0,
			previous: 3,
			trend: -3,
		});
	});
});

describe("round 31 accessibility override controls", () => {
	it.each([
		"forced-colors: active",
		"prefers-reduced-motion: reduce",
		"prefers-contrast: more",
	])("sets aside positive %s overrides with file and line evidence", (condition) => {
		const result = scanScope([
			{
				file: "accessible.css",
				text: `@media (${condition}) {\n.x { color: red !important; }\n}`,
			},
		]);
		expect(result.repeatedWorkarounds.total).toBe(0);
		expect(result.accessibilityOverrides).toEqual({
			total: 1,
			hits: [
				{
					file: "accessible.css",
					line: 2,
					detail: "!important accessibility override",
				},
			],
		});
	});

	it("sets aside combined conditions and preserves top-level workarounds", () => {
		const result = scanScope([
			{
				file: "combined.css",
				text: [
					".before { color: red !important; }",
					"@MEDIA only screen and (min-width: 40rem) and (PREFERS-CONTRAST: MORE) {",
					"  .x { color: blue ! IMPORTANT; }",
					"}",
					".after { color: green !important; }",
				].join("\n"),
			},
		]);
		expect(result.repeatedWorkarounds.hits).toEqual([
			{ file: "combined.css", line: 1, detail: "!important" },
			{ file: "combined.css", line: 5, detail: "!important" },
		]);
		expect(result.accessibilityOverrides.total).toBe(1);
		expect(result.accessibilityOverrides.hits[0].line).toBe(3);
	});

	it("inherits accessibility context at any block nesting depth", () => {
		const result = scanScope([
			{
				file: "nested.css",
				text: [
					"@supports (display: grid) {",
					"  @media (min-width: 40rem) {",
					"    @media (forced-colors: active) and (prefers-reduced-motion: reduce) {",
					"      @supports (display: flex) {",
					"        .outer { & .inner { color: red !important; } }",
					"      }",
					"      @media not (prefers-contrast: more) { .x { color: blue !important; } }",
					"    }",
					"    .after { color: green !important; }",
					"  }",
					"}",
				].join("\n"),
			},
		]);
		expect(result.repeatedWorkarounds.hits).toEqual([
			{ file: "nested.css", line: 9, detail: "!important" },
		]);
		expect(result.accessibilityOverrides.total).toBe(2);
		expect(result.accessibilityOverrides.hits.map((hit) => hit.line)).toEqual([
			5, 7,
		]);
	});

	it.each([
		"@media not screen and (forced-colors: active)",
		"@media not (prefers-reduced-motion: reduce)",
		"@media screen and not (prefers-contrast: more)",
		"@media (forced-colors: active) or (min-width: 40rem)",
		"@media (prefers-contrast: more), screen",
		"@media (forced-colors: none)",
		"@media (prefers-reduced-motion: no-preference)",
		"@media (prefers-contrast: less)",
		"@supports (forced-colors: active)",
	])("keeps %s declarations as workarounds", (query) => {
		const result = scanScope([
			{
				file: "negative.css",
				text: `${query} { .x { color: red !important; } }`,
			},
		]);
		expect(result.repeatedWorkarounds.total).toBe(1);
		expect(result.accessibilityOverrides?.total ?? 0).toBe(0);
	});

	it("prints the override count and locations from HTML styles", () => {
		const measures = scanScope([
			{
				file: "page.html",
				text: [
					"<style>",
					"/* @media (forced-colors: active) { */",
					'.plain { content: "@media (forced-colors: active) {"; color: red !important; }',
					"@media /* mode */ (prefers-reduced-motion: reduce) {",
					'  .x { content: "} !important"; transition: none !important; }',
					"}",
					"</style>",
					'<p style="color: red !important">Text</p>',
				].join("\n"),
			},
		]);
		expect(measures.repeatedWorkarounds.total).toBe(2);
		expect(measures.accessibilityOverrides.total).toBe(1);
		const printed = formatReport({
			checks: [],
			codeHealth: {
				comparedWith: "older",
				scopes: [{ name: "concept", status: "ok", measures }],
			},
		});
		expect(printed).toContain("- accessibilityOverrides: 1");
		expect(printed).toContain("page.html:5");
		expect(printed).toContain("!important accessibility override");
	});
});
