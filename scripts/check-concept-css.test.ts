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
	])("rejects invisible or negated replacements %s", (css) => {
		expect(lint(css).map((f) => f.rule)).toEqual(["outline-without-ring"]);
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
		".button { outline: none; box-shadow: 0 0 0 2px red; }",
		".button { outline: none; border: 2px solid red; }",
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
});

describe("concept CSS CLI and read-only folder contract", () => {
	it("recurses outside the repo, prints locations/counts, and leaves all bytes and mtimes unchanged", async () => {
		const root = fixture({
			"nested folder/hover.css": ".a:hover { color: red; }\n",
			"motion.CSS": ".a { transition: all 1s ease-in; outline: none; }",
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
		expect(result.stdout).toContain("FAIL: 2 CSS files, 4 findings");
		expect((await inspectFolder(root)).files).toBe(2);
		expect(snapshot(root)).toEqual(before);
	});

	it("returns a real pass only when CSS exists and has no findings", () => {
		const result = run(
			fixture({
				"clean.css": "@media (hover:hover) { .a:hover { color:red; } }",
			}),
		);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("PASS: 1 CSS files, 0 findings");
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
			expect(result.stderr).toContain("ERROR:");
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
