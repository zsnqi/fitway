import { describe, expect, it } from "vitest";
import { scanScope } from "./code-health.mjs";

function javascriptLines(count: number) {
	return Array.from(
		{ length: count },
		(_, index) => `const code${index} = ${index};`,
	);
}

function cssLines(count: number) {
	return Array.from(
		{ length: count },
		(_, index) => `.item${index} { color: red; }`,
	);
}

function htmlLines(count: number) {
	return Array.from({ length: count }, () => "<div></div>");
}

function expectCodeLines(file: string, text: string, count: number) {
	const giantFiles = scanScope([{ file, text }]).giantFiles;
	if (count > 800) {
		expect(giantFiles).toEqual({
			total: 1,
			hits: [
				{
					file,
					line: 1,
					detail: `${count} code lines`,
					lineCount: count,
				},
			],
		});
		return;
	}
	expect(giantFiles.total).toBe(0);
}

function source(count: number, extra: string[] = []) {
	return [...javascriptLines(count), ...extra].join("\n");
}

const templateExpression = [
	"const message = `head //",
	["$", "{value}"].join(""),
	"middle /* not a comment */",
	["$", "{other}"].join(""),
	"tail`;",
];

const jsxCommentExpression = [
	"const node = (",
	"  <>",
	"    {/* only a comment */}",
	"  </>",
	");",
];

const blockComment = [
	"const before = 1; /*",
	"comment only",
	"*/",
	"const after = 2;",
];

describe("C1 giant files count code lines", () => {
	it.each([
		[
			"C1 keeps a comment marker in a string",
			"string.ts",
			source(800, ['const text = "// not a comment";']),
		],
		[
			"C1 keeps template heads, middles and tails",
			"template.ts",
			source(796, templateExpression),
		],
		[
			"C1 keeps a comment marker in a regular expression",
			"regex.ts",
			source(800, ["const pattern = /\\/\\/|\\/\\*/;"]),
		],
		[
			"C1 keeps code before a trailing comment",
			"trailing.ts",
			source(800, ["const value = 1; // trailing comment"]),
		],
		[
			"C1 keeps code before and after a block comment",
			"block.ts",
			source(799, blockComment),
		],
		[
			"C1 keeps comment markers in JSX text",
			"text.tsx",
			source(800, [
				"const node = <p>// text /* text */ https://example.test</p>;",
			]),
		],
		[
			"C1 keeps JSX comment expression braces",
			"comment.tsx",
			source(796, jsxCommentExpression),
		],
		["C1 ignores whitespace-only lines", "blank.ts", source(800, [" \t "])],
		[
			"C1 ignores line comments",
			"line-comment.ts",
			source(800, ["// comment only"]),
		],
		[
			"C1 ignores a JSDoc comment in an ES module",
			"jsdoc.mjs",
			source(800, ["/** documentation */"]),
		],
		[
			"C1 ignores a line comment in CommonJS",
			"comment.cjs",
			source(800, ["// comment only"]),
		],
		[
			"C1 counts CRLF line endings",
			"crlf.ts",
			[...javascriptLines(801), "// comment"].join("\r\n"),
		],
		[
			"C1 counts CR line endings",
			"cr.ts",
			[...javascriptLines(801), "// comment"].join("\r"),
		],
		[
			"C1 counts LF line endings",
			"lf.ts",
			[...javascriptLines(801), "// comment"].join("\n"),
		],
		[
			"C1 counts an LF file without a final break",
			"final.ts",
			[...javascriptLines(801), "// comment"].join("\n"),
		],
		[
			"C1 counts LF through a final break",
			"final-break.ts",
			`${[...javascriptLines(801), "// comment"].join("\n")}\n`,
		],
		[
			"C1 counts a hashbang as code",
			"hashbang.js",
			["#!/usr/bin/env node", ...javascriptLines(800), "// comment"].join("\n"),
		],
		[
			"C1 keeps a block-comment marker in a CSS string",
			"styles.css",
			[
				...cssLines(800),
				'.item { content: "/* not a comment */"; }',
				"/* comment only */",
			].join("\n"),
		],
		[
			"C1 keeps an HTML-comment marker in a script string",
			"page.html",
			[
				...htmlLines(800),
				'<script>const marker = "<!-- not a comment";</script>',
				"<!-- comment only -->",
			].join("\n"),
		],
		[
			"C1 ignores a comment in a style body",
			"style-body.html",
			[...htmlLines(799), "<style>", "/* comment only */", "</style>"].join(
				"\n",
			),
		],
		[
			"C1 ignores a line comment in a script body",
			"script-body.html",
			[...htmlLines(799), "<script>", "// comment only", "</script>"].join(
				"\n",
			),
		],
		[
			"C1 ignores a comment in a style attribute",
			"style-attribute.html",
			[
				...htmlLines(799),
				'<div style="',
				"  /* comment only */",
				'color: red"></div>',
			].join("\n"),
		],
		[
			"C1 does not treat 780 code lines as giant",
			"mostly-comments.ts",
			[
				...javascriptLines(780),
				...Array.from({ length: 60 }, () => "// comment only"),
				...Array.from({ length: 60 }, () => " \t "),
			].join("\n"),
		],
		[
			"C1 treats 801 code lines as giant",
			"giant.ts",
			javascriptLines(801).join("\n"),
		],
	])("%s", (_name, file, text) => {
		const expected =
			file === "mostly-comments.ts"
				? 780
				: ["blank.ts", "line-comment.ts", "jsdoc.mjs", "comment.cjs"].includes(
							file,
						)
					? 800
					: 801;
		expectCodeLines(file, text, expected);
	});
});

describe("C1 JSX text never opens or holds a comment", () => {
	it("C1 keeps a block-comment marker in JSX text from swallowing the file", () => {
		expectCodeLines(
			"unclosed.tsx",
			[
				"export const B = () => <p>/* not a comment</p>;",
				...javascriptLines(850),
			].join("\n"),
			851,
		);
	});

	it("C1 counts a JSX text line of only a line-comment marker as code", () => {
		expectCodeLines(
			"text-line.tsx",
			source(799, [
				"export const C = () => (",
				"\t<p>",
				"\t\t// not a comment",
				"\t</p>",
				");",
			]),
			804,
		);
	});

	it("C1 still reads a JSX comment after JSX text as a workaround marker", () => {
		const text = [
			"export const D = () => (",
			"\t<p>",
			"\t\tDon't {/* TODO: name the gym */}",
			"\t</p>",
			");",
		].join("\n");
		expect(
			scanScope([{ file: "marker.tsx", text }]).repeatedWorkarounds.hits,
		).toEqual([{ file: "marker.tsx", line: 3, detail: "TODO marker" }]);
	});
});
