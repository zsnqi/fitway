// code-health-exception: testCases; until=2026-11-30; reason=per-file map removes the obsolete callable coverage suite
// code-health-exception: expectCalls; until=2026-11-30; reason=per-file map removes the obsolete callable coverage suite
import { execFileSync, spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parseFastSteps } from "../../.agents/skills/gardener/facts.mjs";
import {
	buildToolingMap,
	checkToolingMap,
	writeToolingMap,
} from "./tooling-map-document.mjs";
import { listMappedSourceFiles } from "./tooling-map-parser.mjs";

const generator = fileURLToPath(
	new URL("./generate-tooling-map.mjs", import.meta.url),
);
const verification = fileURLToPath(
	new URL("../../scripts/verify.mjs", import.meta.url),
);
const repository = fileURLToPath(new URL("../../", import.meta.url));
const sourcePath = "scripts/agent-environment/tooling-source.mjs";
const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function git(root: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		windowsHide: true,
	}).trim();
}

function write(root: string, file: string, text: string) {
	const absolute = path.join(root, file);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, text);
}

function fixture({
	source = "// Holds the fixture.\nexport const anchor = 1;\n",
	files = {},
}: {
	source?: string;
	files?: Record<string, string>;
} = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-tooling-map-test-"));
	roots.push(root);
	write(root, sourcePath, source);
	for (const [file, text] of Object.entries(files)) write(root, file, text);
	git(root, "init", "--quiet");
	git(root, "config", "user.name", "Map fixture");
	git(root, "config", "user.email", "map@example.invalid");
	git(root, "config", "commit.gpgsign", "false");
	git(root, "add", ".");
	return root;
}

function expectDriftFailure(
	result: Awaited<ReturnType<typeof checkToolingMap>>,
	file: string,
) {
	expect(result.ok).toBe(false);
	expect(result.errors.join("\n")).toContain(file);
}

describe("agent tooling code map", () => {
	const commentForms = [
		{
			form: "line comments",
			source:
				"// Holds the fixture. Later detail.\n// Another line.\nexport const anchor = 1;\n",
			expected: "Holds the fixture.",
		},
		{
			form: "block comments",
			source:
				"/* Holds the fixture! Later detail. */\nexport const anchor = 1;\n",
			expected: "Holds the fixture!",
		},
		{
			form: "JSDoc comments",
			source:
				"#!/usr/bin/env node\n/**\n * Holds the fixture?\n * Later detail.\n */\nexport const anchor = 1;\n",
			expected: "Holds the fixture?",
		},
		{
			form: "no comment",
			source: "export const anchor = 1;\n",
			expected: "(no leading comment)",
		},
	];

	for (const sample of commentForms) {
		it(`uses the first sentence of ${sample.form}`, async () => {
			const root = fixture({ source: sample.source });
			const built = await buildToolingMap({ root });
			expect(built.files[0]?.leadingComment).toBe(sample.expected);
		});
	}

	it("prints how many files have no leading comment", () => {
		const root = fixture({ source: "export const anchor = 1;\n" });
		const result = spawnSync(process.execPath, [generator], {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("1 files, 1 without a leading comment.");
	});

	it("lists declarations, bindings, aliases, types and default exports", async () => {
		const root = fixture({
			source: [
				"/** Exports every declared form. */",
				"export function declared() {}",
				"export const value = 1;",
				"const local = 2;",
				"export { local as alias };",
				"export type shape = { value: number };",
				"export default declared;",
				"",
			].join("\n"),
		});
		const built = await buildToolingMap({ root });
		expect(built.files[0]?.exports).toEqual([
			"alias",
			"declared",
			"default",
			"shape",
			"value",
		]);
	});

	it("shows the source path for aliased and starred re-exports", async () => {
		const root = fixture({
			source: "/** Defines the source export. */\nexport function named() {}\n",
			files: {
				"scripts/agent-environment/tooling-extra.mjs":
					"/** Defines extra exports. */\nexport const extra = 1;\nexport type extraType = string;\nexport default 1;\n",
				"scripts/agent-environment/tooling-forward.mjs": [
					"/** Forwards exports. */",
					'export { named as renamed } from "./tooling-source.mjs";',
					'export * from "./tooling-extra.mjs";',
					"",
				].join("\n"),
			},
		});
		const built = await buildToolingMap({ root });
		const forward = built.files.find(
			(file) => file.path === "scripts/agent-environment/tooling-forward.mjs",
		);
		expect(forward?.exports).toEqual([
			"extra (from scripts/agent-environment/tooling-extra.mjs)",
			"extraType (from scripts/agent-environment/tooling-extra.mjs)",
			"renamed (from scripts/agent-environment/tooling-source.mjs)",
		]);
	});

	it("lists keys assigned to module.exports and exports", async () => {
		const root = fixture({
			source: [
				"/** Exposes CommonJS keys. */",
				"const alpha = 1;",
				"module.exports = { alpha, beta: 2 };",
				"exports.gamma = 3;",
				'exports["delta"] = 4;',
				"",
			].join("\n"),
		});
		const built = await buildToolingMap({ root });
		expect(built.files[0]?.exports).toEqual([
			"alpha",
			"beta",
			"delta",
			"gamma",
		]);
	});

	it("has one entry for each mapped file under its folder", async () => {
		const root = fixture({
			files: {
				"scripts/verify.mjs":
					"// Verifies repository facts.\nexport const verify = 1;\n",
			},
		});
		const built = await buildToolingMap({ root });
		expect(built.files.map((file) => file.path)).toEqual(
			listMappedSourceFiles(root),
		);
		expect(built.text).toContain("## `scripts/agent-environment`");
		expect(built.text).toContain("## `scripts`");
		expect(built.text.match(/^- `/gm)).toHaveLength(2);
	});
});

describe("agent tooling map drift check", () => {
	it("passes unchanged", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		const checked = await checkToolingMap({ root });
		expect(checked.ok, checked.errors.join("\n")).toBe(true);
	});

	it("passes when an edit only moves lines", async () => {
		const source = "// Holds the fixture.\nexport const anchor = 1;\n";
		const root = fixture({ source });
		await writeToolingMap({ root });
		write(
			root,
			sourcePath,
			"// Holds the fixture.\n\n// Lines below the leading comment move.\n\nexport const anchor = 1;\n",
		);
		git(root, "add", ".");
		const checked = await checkToolingMap({ root });
		expect(checked.ok, checked.errors.join("\n")).toBe(true);
	});

	it("fails when the leading sentence changes", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		write(
			root,
			sourcePath,
			"// Renames the fixture.\nexport const anchor = 1;\n",
		);
		git(root, "add", ".");
		expectDriftFailure(await checkToolingMap({ root }), sourcePath);
	});

	it("fails when an export is added", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		write(
			root,
			sourcePath,
			"// Holds the fixture.\nexport const anchor = 1;\nexport const planted = 2;\n",
		);
		git(root, "add", ".");
		expectDriftFailure(await checkToolingMap({ root }), sourcePath);
	});

	it("fails when an export is removed", async () => {
		const root = fixture({
			source:
				"// Holds the fixture.\nexport const anchor = 1;\nexport const planted = 2;\n",
		});
		await writeToolingMap({ root });
		write(
			root,
			sourcePath,
			"// Holds the fixture.\nexport const anchor = 1;\n",
		);
		git(root, "add", ".");
		expectDriftFailure(await checkToolingMap({ root }), sourcePath);
	});

	it("fails when an export is renamed", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		write(
			root,
			sourcePath,
			"// Holds the fixture.\nexport const renamed = 1;\n",
		);
		git(root, "add", ".");
		expectDriftFailure(await checkToolingMap({ root }), sourcePath);
	});

	it("fails and names a mapped file that is added", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		git(root, "add", ".");
		const added = "scripts/agent-environment/tooling-added.mjs";
		write(root, added, "// Adds a mapped file.\nexport const added = 1;\n");
		git(root, "add", ".");
		expectDriftFailure(await checkToolingMap({ root }), added);
	});

	it("fails and names a mapped file that is removed", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		git(root, "add", ".");
		rmSync(path.join(root, sourcePath));
		git(root, "add", "-A");
		expectDriftFailure(await checkToolingMap({ root }), sourcePath);
	});

	it("fails and names an untracked mapped file", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		const added = "scripts/agent-environment/tooling-added.mjs";
		write(root, added, "// Adds a mapped file.\nexport const added = 1;\n");
		expectDriftFailure(await checkToolingMap({ root }), added);
	});

	it("returns byte-identical output for LF and CRLF checkouts", async () => {
		const root = fixture();
		const lf = await buildToolingMap({ root });
		const source = readFileSync(path.join(root, sourcePath), "utf8");
		write(root, sourcePath, source.replaceAll("\n", "\r\n"));
		const crlf = await buildToolingMap({ root });
		expect(lf.text).toContain("# Agent tooling code map");
		expect(crlf.text).toBe(lf.text);
	});

	it("prints the changed file and regeneration command", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		write(
			root,
			sourcePath,
			"// Holds the fixture.\nexport const changed = 1;\n",
		);
		git(root, "add", ".");
		const result = spawnSync(process.execPath, [generator, "--check"], {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
		const output = `${result.stdout}${result.stderr}`;
		expect(result.status).toBe(1);
		expect(output).toContain("pnpm check:tooling-map: FAIL:");
		expect(output).toContain(sourcePath);
		expect(output).toContain("(run pnpm map:tooling)");
	});
});

describe("agent tooling map ladder integration", () => {
	it("fails the verification step when the map drifts", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		git(root, "add", ".");
		git(root, "commit", "-m", "fixture");
		write(
			root,
			sourcePath,
			"// Holds the fixture.\nexport const changed = 1;\n",
		);
		git(root, "add", ".");
		write(
			root,
			"verify-map-step.mjs",
			[
				`import { runVerification } from ${JSON.stringify(pathToFileURL(verification).href)};`,
				"await runVerification({",
				'  mode: "fast",',
				"  steps: [{",
				'    label: "Agent tooling map drift",',
				"    command: process.execPath,",
				`    args: [${JSON.stringify(generator)}, "--check"],`,
				"  }],",
				"});",
				"",
			].join("\n"),
		);
		const result = spawnSync(process.execPath, ["verify-map-step.mjs"], {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status).not.toBe(0);
		expect(`${result.stdout}${result.stderr}`).toContain(
			"pnpm check:tooling-map: FAIL:",
		);
	});

	it("keeps the commands and ladder step names stable", () => {
		const packageJson = JSON.parse(
			readFileSync(path.join(repository, "package.json"), "utf8"),
		);
		expect(packageJson.scripts["map:tooling"]).toBe(
			"node scripts/agent-environment/generate-tooling-map.mjs",
		);
		expect(packageJson.scripts["check:tooling-map"]).toBe(
			"node scripts/agent-environment/generate-tooling-map.mjs --check",
		);

		const steps = parseFastSteps(
			readFileSync(path.join(repository, "scripts/verify.mjs"), "utf8"),
		);
		expect(steps).toEqual([
			["Repository invariants", ["check:repository"]],
			["Verification map drift", ["check:verification-map"]],
			["Agent tooling map drift", ["check:tooling-map"]],
			["Code health ratchet", ["check:code-health"]],
			["Verification CLI contracts", ["test:verification"]],
			["Biome check", ["check"]],
			[
				"Owner token fidelity",
				["exec", "node", "scripts/check-owner-tokens.mjs"],
			],
			["Type checks", ["check-types"]],
			["Unit tests", ["test"]],
			["Python simulator tests", ["test:simulator"]],
		]);
	});
});
