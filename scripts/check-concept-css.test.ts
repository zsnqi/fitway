import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { inspectFolder, lintSources } from "./check-concept-css.mjs";

const roots: string[] = [];
const script = fileURLToPath(
	new URL("./check-concept-css.mjs", import.meta.url),
);

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function fixture(files: Record<string, string> = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-concept-css-"));
	roots.push(root);
	for (const [name, content] of Object.entries(files)) {
		const target = path.join(root, name);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(target, content, "utf8");
	}
	return root;
}

function lint(css: string) {
	return lintSources([{ file: "fixture.css", css }]);
}

function run(root: string, separator = false) {
	return spawnSync(
		process.execPath,
		[script, ...(separator ? ["--"] : []), root],
		{
			cwd: tmpdir(),
			encoding: "utf8",
			windowsHide: true,
		},
	);
}

function snapshot(root: string): unknown[] {
	return readdirSync(root, { withFileTypes: true }).map((entry) => {
		const target = path.join(root, entry.name);
		return entry.isDirectory()
			? [entry.name, snapshot(target)]
			: [
					entry.name,
					createHash("sha256").update(readFileSync(target)).digest("hex"),
					statSync(target).mtimeMs,
				];
	});
}

describe("concept CSS planted findings", () => {
	it.each([
		"outline: 0 none",
		"outline: none 0",
		"outline: solid 0px red",
		"outline: red hidden 2px",
		"outline: hidden",
		"outline-style: none",
		"outline-style: hidden",
		"outline-width: 0em",
		"outline-width: .0rem",
		"outline-width: +0.00pt",
		"outline-width: -0px",
	])("R1 detects outline removal %s", (declaration) => {
		expect(lint(`.button { ${declaration}; }`).map((f) => f.rule)).toEqual([
			"outline-without-ring",
		]);
		expect(
			lint(
				`.button { ${declaration}; } .button:focus-visible { outline: 2px solid red; }`,
			),
		).toEqual([]);
	});
	it.each([
		"not all and (hover: hover)",
		"not screen and (hover: hover)",
		"(hover: none)",
		"(any-hover: none)",
		"(hover: hover), (hover: none)",
		"(hover: hover) or (width: 800px)",
		"not ((hover: hover) and (pointer: fine))",
	])("R2 rejects a touch-matching hover gate %s", (query) => {
		expect(
			lint(`@media ${query} { .button:hover { color: red; } }`).map(
				(f) => f.rule,
			),
		).toEqual(["ungated-hover"]);
	});
	it("R3 distinguishes an absent ring from a named ring that draws none", () => {
		expect(lint(".button { outline: none; }")[0].detail).toContain(
			"no focus ring",
		);
		for (const replacement of ["", ".ring:focus-visible { color: red; }"]) {
			expect(
				lint(
					`.button { outline: none; /* focus-ring: .ring:focus-visible */ } ${replacement}`,
				)[0].detail,
			).toContain(
				"declared focus-ring: .ring:focus-visible draws no visible ring",
			);
		}
	});
	it.each([
		"border: 1px solid #ccc",
		"box-shadow: 0 2px 8px #0003",
		"border: 1px solid #ccc; box-shadow: 0 2px 8px #0003",
	])("R4 rejects permanent decoration %s", (decoration) => {
		expect(
			lint(`.fw-pop { outline: none; ${decoration}; }`).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
		expect(
			lint(
				`.fw-pop { outline: none; } .fw-pop:focus-visible { ${decoration}; }`,
			),
		).toEqual([]);
		expect(
			lint(
				`.fw-pop { outline: none; ${decoration}; } .fw-pop:focus-visible { ${decoration}; }`,
			).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
		expect(
			lint(
				`.fw-pop { outline: none; } .fw-pop, .fw-pop:focus-visible { ${decoration}; }`,
			).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
		expect(
			lint(
				`.fw-pop { outline: none; } .wrapper { ${decoration}; } .wrapper:has(.fw-pop:focus-visible) { ${decoration}; }`,
			).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
	});
	it("recognizes a focused border colour change with inherited geometry", () => {
		expect(
			lint(
				".button { outline: none; border: 2px solid #ccc; } .button:focus-visible { border-color: red; }",
			),
		).toEqual([]);
	});
	it.each([
		":focus-visible",
		":focus",
	])("R5 recognizes an ancestor ring for %s", (focus) => {
		for (const relation of [" ", " > "]) {
			expect(
				lint(
					`.wrapper${relation}.button { outline: none; } .wrapper:has(${relation.trim()} .button${focus}) { outline: 2px solid red; }`,
				),
			).toEqual([]);
		}
		expect(
			lint(
				`.button { outline: none; } .wrapper:has(.button${focus}) { box-shadow: 0 0 0 2px red; }`,
			),
		).toEqual([]);
	});
	it.each([
		'.button[tabindex="-1"]',
		".button[tabindex='-1']:focus-visible",
		".button[tabindex=-1]:focus",
		'.wrapper .button[tabindex="-1"]',
	])("R5 exempts a programmatic subject %s", (selector) => {
		expect(lint(`${selector} { outline: none; }`)).toEqual([]);
	});
	it.each([
		'.wrapper[tabindex="-1"] .button',
		'.button:not([tabindex="-1"])',
		'.wrapper:has([tabindex="-1"]) .button',
		'.button[tabindex="0"]',
		'.button:is([tabindex="-1"], .keyboard)',
		".button[data-label='[tabindex=\"-1\"]']",
	])("keeps keyboard subjects covered %s", (selector) => {
		expect(lint(`${selector} { outline: none; }`).map((f) => f.rule)).toEqual([
			"outline-without-ring",
		]);
	});
	it.each([
		".wrapper:has(.other:focus-visible)",
		".wrapper:has(.button:not(:focus))",
		".wrapper:has(.button:focus-visible) .decoration",
		".wrapper:has(+ .button:focus-visible)",
		".wrapper:has(.button:focus-visible, .other)",
	])("rejects an unrelated or non-focus ancestor %s", (selector) => {
		expect(
			lint(
				`.button { outline: none; } ${selector} { outline: 2px solid red; }`,
			).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
	});
	it.each([
		"(any-hover: hover)",
		"((hover: hover) and (pointer: fine))",
		"(hover: hover), screen and (hover: hover)",
		"(hover: hover) or (any-hover: hover)",
	])("accepts hover-only query %s", (query) => {
		expect(lint(`@media ${query} { .button:hover { color: red; } }`)).toEqual(
			[],
		);
	});
	it.each([
		".a { outline:none; border:solid .0px red; }",
		".a { outline:none; border:solid 2px #f000; }",
		".a { outline:none; box-shadow:0 0 0 2px #ffffff00; }",
		".a { outline:none; } .a:focus-visible { outline-style:solid; outline-width:0.0px; }",
		".a { outline-style:solid; outline-width:2px; outline-color:red; outline:0; }",
		".a:focus-visible { outline:2px solid red; } .a:focus-visible { outline:none; }",
		":focus-visible { outline:2px solid red; } .a:focus-visible { outline:none; }",
		".a:focus-visible { outline:none; } :focus-visible { outline:2px solid red; }",
		":focus-visible { outline:2px solid red; } .a { outline:none; }",
		".a { outline:none!important; } :focus-visible { outline:2px solid red; }",
		".a { outline:none; border:solid 0 red; }",
		".a { outline:none; outline:solid 0 red; }",
		".a { outline:none; box-shadow:0 0 0 -2px red; }",
		".a { outline:none; /* focus-ring: .ring:not(:focus) */ } .ring:not(:focus) { outline:2px solid red; }",
		".a { outline:none; } .a:not(:focus) { outline:2px solid red; }",
		".a { outline:none; border:2px solid red; border-color:transparent; }",
		".button { outline: none; box-shadow: 0 0 0 2px red; }",
		".button { outline: none; border: 2px solid red; }",
	])("rejects invisible or negated replacements %s", (css) => {
		// More outline-removal spellings can produce additional diagnostics, but
		// every earlier fixture must still have exactly this finding class.
		expect([...new Set(lint(css).map((f) => f.rule))]).toEqual([
			"outline-without-ring",
		]);
	});
	it.each([
		".a { outline:none; } :focus-visible { outline:2px solid red; }",
		":focus-visible { outline:2px solid red; } button { outline:none; }",
		".a { outline:none; } .a:focus-visible { border-style:solid; border-width:2px; border-color:red; }",
		".a { outline:none; } .a:not(.disabled):focus-visible { outline:2px solid red; }",
		".a:not(.disabled) { outline:none; } .a:not(.disabled):focus-visible { outline:2px solid red; }",
	])("recognizes explicit focus replacements %s", (css) => {
		// The extra state in a focus selector must match the suppressed selector.
		const expected = css.includes(".a { outline:none; } .a:not")
			? ["outline-without-ring"]
			: [];
		expect(lint(css).map((f) => f.rule)).toEqual(expected);
	});
	it("keeps each diagnostic on one line even for multiline declarations", () => {
		expect(
			lint(".a { transition:\n all\n 1s\n ease-in; }").map((f) => f.detail),
		).toEqual(["transition: all 1s ease-in", "transition: all 1s ease-in"]);
	});
	it.each([
		["ungated-hover", ".button:hover { color: red; }"],
		["ungated-hover", "@media (hover: none) { .button:hover { color: red; } }"],
		["transition-all", ".button { transition: all 120ms ease; }"],
		["transition-all", ".button { transition-property: opacity, all; }"],
		["ease-in", ".button { transition: opacity 120ms ease-in; }"],
		["ease-in", ".button { transition-timing-function: ease-in; }"],
		["ease-in", ".button { animation: pulse 120ms ease-in; }"],
		[
			"ease-in",
			".button { animation-timing-function: cubic-bezier(.420, 0.0, 1, 1.0); }",
		],
		[
			"ease-in",
			".button { transition: opacity 120ms cubic-bezier(0.42,0,1,1); }",
		],
		["outline-without-ring", ".button { outline: none; }"],
		["outline-without-ring", ".button { outline: 0 !important; }"],
		["outline-without-ring", ".button { outline: 0px; }"],
		[
			"outline-without-ring",
			".button:focus-visible { outline: none; } .button:focus-visible .tile { outline: 2px solid red; }",
		],
		[
			"outline-without-ring",
			".button { outline: none; /* focus-ring: .missing:focus-visible */ } .other:focus-visible { outline: 2px solid red; }",
		],
		[
			"outline-without-ring",
			".button { outline: none; /* focus-ring: .ring:focus-visible */ } .ring:focus-visible { color: red; }",
		],
		[
			"outline-without-ring",
			".button { outline: none; /* focus-ring: .ring */ } .ring { outline: 2px solid red; }",
		],
		[
			"outline-without-ring",
			".button { outline: none; border: 0 solid red; box-shadow: 0 0 0 0 red; }",
		],
		[
			"outline-without-ring",
			".button { outline: none; } .button:focus { border: 2px solid transparent; box-shadow: 0 0 0 2px rgba(0,0,0,0); }",
		],
		[
			"outline-without-ring",
			"/* focus-ring: .ring:focus */ .button { outline: none; } .ring:focus { outline: 2px solid red; }",
		],
	])("finds %s in %s", (rule, css) => {
		expect(lint(css).map((f) => f.rule)).toEqual([rule]);
	});

	it.each([
		"@media (hover:hover) { .button:hover { color: red; } }",
		"@media screen and (hover: hover) { @supports (display: grid) { .button:hover { color: red; } } }",
		".button { transition: opacity 120ms ease-in-out, color 100ms ease-out; animation: pulse 1s ease-in-out; }",
		".button { animation-timing-function: cubic-bezier(.42,0,.58,1); }",
		".button { outline: none; outline: 2px solid red; }",
		".button { outline: none; } .button:focus { outline: 2px solid red; }",
		".button { outline: none; } .button:focus-visible { box-shadow: 0 0 0 2px red; }",
		".button { outline: none; } .button:focus-within { border: 2px solid red; }",
		".a, .b { outline: none; } .a:focus, .b:focus-visible { outline: 2px solid red; }",
		".button:focus-visible { outline: none; /* focus-ring: .button:focus-visible .tile */ } .button:focus-visible .tile { outline: 2px solid red; }",
		".button { outline: none /* focus-ring: .wrapper:has(.button:focus-visible) */; } .wrapper:has(.button:focus-visible) { outline: 2px solid red; }",
		".button { outline: none; /* focus-ring: .wrapper:focus-within > .ring */ } .wrapper:focus-within>.ring { border: 2px solid red; }",
		"/* :hover { transition: all 1s ease-in; outline:none; } */ .button[data-label=':hover'] { content: 'ease-in; { all }'; }",
		".button { transition: --all 1s ease-in-out; --unused: ease-in; }",
	])("accepts the exception %s", (css) => {
		expect(lint(css)).toEqual([]);
	});

	it("expands nested selectors and preserves the hover occurrence location", () => {
		expect(
			lint(
				".button {\n &:hover { color: red; }\n outline: none;\n &:focus-visible { outline: 2px solid red; }\n}",
			),
		).toEqual([
			{
				file: "fixture.css",
				line: 2,
				rule: "ungated-hover",
				detail: "&:hover",
			},
		]);
	});

	it("reports every selector occurrence and declaration with exact CRLF lines", () => {
		const findings = lint(
			"/* header */\r\n.a:hover,\r\n.b:hover {\r\n transition: all 1s ease-in;\r\n outline: none;\r\n}",
		);
		expect(findings.map(({ line, rule }) => [line, rule])).toEqual([
			[2, "ungated-hover"],
			[3, "ungated-hover"],
			[4, "transition-all"],
			[4, "ease-in"],
			[5, "outline-without-ring"],
		]);
	});

	it("checks token uses across files without linting unused tokens", () => {
		expect(
			lintSources([
				{
					file: "tokens.css",
					css: ":root { --bad: ease-in; --alias: var(--bad); --properties: all; --cycle: var(--cycle); }",
				},
				{
					file: "use.css",
					css: ".a { transition: var(--properties) 1s var(--alias); animation: pulse 1s var(--missing, ease-in); }",
				},
			]).map((f) => f.rule),
		).toEqual(["transition-all", "ease-in", "ease-in"]);
	});

	it("finds a replacement or named moved ring in another CSS file", () => {
		expect(
			lintSources([
				{
					file: "base.css",
					css: ".a { outline: none; } .b { outline: none; /* focus-ring: .b:focus-visible .ring */ }",
				},
				{
					file: "focus.css",
					css: ".a:focus { outline: 2px solid red; } .b:focus-visible .ring { outline: 2px solid red; }",
				},
			]),
		).toEqual([]);
	});

	it("does not let a comment on one declaration exempt a different one", () => {
		expect(
			lint(
				".a { color: red; /* focus-ring: .ring:focus */ outline: none; } .ring:focus { outline: 2px solid red; }",
			).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
	});

	it("does not accept a ring on an unrelated element", () => {
		expect(
			lint(
				".a { outline: none; } .b:focus-visible { outline: 2px solid red; }",
			).map((f) => f.rule),
		).toEqual(["outline-without-ring"]);
	});

	it("H6 keeps the concept focus ring only in style.css", () => {
		const sources = [
			{
				file: "style.css",
				css: ":focus-visible { outline: 2px solid var(--ink); }",
			},
			{
				file: "components.css",
				css: [
					".cx .is-focus { outline: 2px solid var(--ink); }",
					".cx .field.is-spec-focus { outline: 1px solid red; }",
					".selected { outline: 2px solid var(--ink); }",
				].join("\n"),
			},
		];
		expect(
			lintSources(sources)
				.filter((finding) => finding.rule === "focus-ring")
				.map(({ file, line }) => [file, line]),
		).toEqual([
			["components.css", 1],
			["components.css", 2],
		]);
	});

	it("H6 requires exactly one focus ring in style.css", () => {
		expect(
			lintSources([
				{
					file: "style.css",
					css: ":focus-visible { outline: 2px solid red; }\n:focus { outline: 1px solid red; }",
				},
			]).filter((finding) => finding.rule === "focus-ring"),
		).toEqual([
			{
				file: "style.css",
				line: 1,
				rule: "focus-ring",
				detail: "expected one focus-ring declaration in style.css; found 2",
			},
		]);

		expect(
			lintSources([
				{
					file: "style.css",
					css: ":root { color: red; }",
				},
			]).filter((finding) => finding.rule === "focus-ring"),
		).toEqual([
			{
				file: "style.css",
				line: 1,
				rule: "focus-ring",
				detail: "expected one focus-ring declaration in style.css; found 0",
			},
		]);
	});

	it("K1 finds focus rings drawn by longhands across rules", () => {
		const root = fixture({
			"style.css": ":focus-visible { outline: 2px solid red; }\n",
			"components.css": [
				".button.is-focus { outline-width: 2px; }",
				".button.is-focus { outline-style: solid; }",
			].join("\n"),
		});
		const result = run(root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("components.css:1: focus-ring");
		expect(result.stdout).toContain("COUNT focus-ring: 1");
	});

	it("N4 counts a multi-selector style ring once", () => {
		const root = fixture({
			"style.css": [
				":focus-visible,",
				"#brand:focus-visible,",
				".cx .is-focus {",
				"  outline: 2px solid red;",
				"  outline-offset: 3px;",
				"}",
			].join("\n"),
		});
		const result = run(root);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("PASS: 1 CSS files, 0 findings");
	});

	it("N4 counts ten copies in components.css once each", () => {
		const root = fixture({
			"style.css": ":focus-visible { outline: 2px solid red; }\n",
			"components.css": Array.from(
				{ length: 10 },
				(_, index) =>
					`.copy-${index}.is-focus { outline: 2px solid red; outline-offset: 3px; }`,
			).join("\n"),
		});
		const result = run(root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("COUNT focus-ring: 10");
	});

	it("N4 separates the same selector by file and media", () => {
		const root = fixture({
			"style.css": ".shared:focus-visible { outline: 2px solid red; }\n",
			"components.css": [
				".shared:focus-visible { outline: 2px solid red; }",
				"@media (min-width: 1px) {",
				"  .shared:focus-visible { outline: 2px solid blue; }",
				"}",
			].join("\n"),
		});
		const result = run(root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("COUNT focus-ring: 2");
	});

	it.each([
		[
			"a suffix-only file",
			{ "otherstyle.css": ".button.is-focus { outline: 2px solid red; }\n" },
			"otherstyle.css:1",
		],
		[
			"a nested file",
			{ "nested/style.css": ".button.is-focus { outline: 2px solid red; }\n" },
			"nested/style.css:1",
		],
	])("K2 requires the concept's exact style.css rather than %s", (_name, files, outside) => {
		const result = run(fixture(files));
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"style.css:1: focus-ring: expected one focus-ring declaration in style.css; found 0",
		);
		expect(result.stdout).toContain(`${outside}: focus-ring`);
	});
});

describe("concept CSS CLI and read-only folder contract", () => {
	it("recurses outside the repo, prints locations/counts, and leaves all bytes and mtimes unchanged", async () => {
		const root = fixture({
			"nested folder/hover.css": ".a:hover { color: red; }\n",
			"motion.CSS": ".a { transition: all 1s ease-in; outline: none; }",
			"style.css": ":focus-visible { outline: 2px solid red; }\n",
			"ignored.txt": ":hover",
		});
		const before = snapshot(root);
		const result = run(root, true);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"nested folder/hover.css:1: ungated-hover: .a:hover",
		);
		for (const rule of [
			"ungated-hover",
			"transition-all",
			"ease-in",
			"outline-without-ring",
		])
			expect(result.stdout).toContain(`COUNT ${rule}: 1`);
		expect(result.stdout).toContain("FAIL: 3 CSS files, 4 findings");
		expect((await inspectFolder(root)).files).toBe(3);
		expect(snapshot(root)).toEqual(before);
	});

	it("returns a real pass only when CSS exists and has no findings", () => {
		const result = run(
			fixture({
				"clean.css": "@media (hover:hover) { .a:hover { color:red; } }",
				"style.css": ":focus-visible { outline: 2px solid red; }\n",
			}),
		);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("PASS: 2 CSS files, 0 findings");
	});

	it("reports no CSS as incomplete, with a distinct nonzero exit", () => {
		const root = fixture({ "readme.txt": "No CSS here" });
		const before = snapshot(root);
		const result = run(root);
		expect(result.status, result.stderr).toBe(2);
		expect(result.stdout).toContain("NO_CSS:");
		expect(result.stdout).toContain("no CSS files; not a pass");
		expect(result.stdout).not.toContain("PASS:");
		expect(snapshot(root)).toEqual(before);
	});

	it("fails clearly for a missing directory, a file path, and malformed CSS", () => {
		const root = fixture({
			"broken.css": ".a { outline: none;",
			"text.txt": "plain",
		});
		for (const target of [
			path.join(root, "absent"),
			path.join(root, "text.txt"),
			root,
		]) {
			const result = run(target);
			expect(result.status).toBe(2);
			expect(result.stderr).toContain("check:concept-css: FAIL:");
			expect(result.stderr).not.toContain("ERROR:");
		}
	});

	it("prints usage and the moved-ring syntax when no folder is supplied", () => {
		const result = spawnSync(process.execPath, [script], {
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status).toBe(2);
		expect(result.stderr).toContain(
			"Usage: pnpm check:concept-css -- <folder>",
		);
		expect(result.stderr).toContain("focus-ring:");
	});
});
