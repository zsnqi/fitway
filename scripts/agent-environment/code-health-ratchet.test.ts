import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const baselineScript = path.join(
	repository,
	"scripts/agent-environment/code-health-baseline.mjs",
);
const checkScript = path.join(
	repository,
	"scripts/agent-environment/check-code-health.mjs",
);
const baselinePath = "docs/agent-context/CODE_HEALTH_BASELINE.json";
const cleanHealthFile = {
	file: "scripts/clean.ts",
	text: "export const clean = 1;\n",
};
const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function git(root: string, ...args: string[]) {
	const result = spawnSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	});
	expect(result.status, result.stderr).toBe(0);
	return result.stdout.trim();
}

function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-code-health-"));
	roots.push(root);
	git(root, "init", "--quiet");
	git(root, "config", "user.email", "code-health@example.invalid");
	git(root, "config", "user.name", "Code Health Fixture");
	return root;
}

function write(root: string, file: string, text: string) {
	const target = path.join(root, file);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, text, "utf8");
}

function run(script: string, root: string, ...args: string[]) {
	return spawnSync(process.execPath, [script, ...args], {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	});
}

function writeBaseline(root: string) {
	const result = run(baselineScript, root);
	expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
	return JSON.parse(readFileSync(path.join(root, baselinePath), "utf8"));
}

function day(offset: number) {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() + offset);
	return date.toISOString().slice(0, 10);
}

describe("code-health ratchet commands", () => {
	it("H1 writes a deterministic committed baseline", () => {
		const root = fixture();
		write(
			root,
			"scripts/sample.ts",
			"const value: any = source as unknown as Target;\n",
		);
		const first = writeBaseline(root);
		const bytes = readFileSync(path.join(root, baselinePath));
		const second = writeBaseline(root);
		expect(second).toEqual(first);
		expect(readFileSync(path.join(root, baselinePath))).toEqual(bytes);
		expect(first.files["scripts/sample.ts"]).toMatchObject({
			typeEscapes: 2,
		});

		const crlfRoot = fixture();
		write(
			crlfRoot,
			"scripts/sample.ts",
			"const value: any = source as unknown as Target;\r\n",
		);
		writeBaseline(crlfRoot);
		expect(readFileSync(path.join(crlfRoot, baselinePath))).toEqual(bytes);
	});

	it.each([
		[
			"duplication",
			"scripts/plant.ts",
			`${Array.from(
				{ length: 8 },
				(_, index) => `const copied${index} = ${index};`,
			).join("\n")}\n${Array.from(
				{ length: 8 },
				(_, index) => `const copied${index} = ${index};`,
			).join("\n")}\n`,
		],
		["typeEscapes", "scripts/plant.ts", "const value: any = 1;\n"],
		["suppressions", "scripts/plant.ts", "// biome-ignore lint\n"],
		["repeatedWorkarounds", "scripts/plant.ts", "setTimeout(run, 0);\n"],
		[
			"longFunctions",
			"scripts/plant.ts",
			[
				"function long() {",
				...Array.from({ length: 80 }, (_, index) => `  void ${index};`),
				"}",
			].join("\n"),
		],
	])("H2 rejects a rise in %s", (measure, plantedFile, planted) => {
		const root = fixture();
		write(root, cleanHealthFile.file, cleanHealthFile.text);
		writeBaseline(root);
		write(root, plantedFile, planted);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(plantedFile);
		expect(result.stdout).toContain(measure);
		expect(result.stdout).toContain("baseline=0 current=1");
		expect(result.stdout).toContain("run pnpm code-health:baseline");
	});

	it("H2 rejects a new file and giant-file line growth", () => {
		const root = fixture();
		const giant = `${Array.from(
			{ length: 801 },
			(_, index) => `const giant${index} = ${index};`,
		).join("\n")}`;
		write(root, "scripts/giant.ts", giant);
		writeBaseline(root);
		write(root, "scripts/giant.ts", `${giant}\nconst extra = true;`);
		write(root, "scripts/new.ts", "const value: any = 1;\n");
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"scripts/giant.ts: giantFiles baseline=801 current=802",
		);
		expect(result.stdout).toContain(
			"scripts/new.ts: typeEscapes baseline=0 current=1",
		);
	});

	it("H2 rejects a count below its baseline", () => {
		const root = fixture();
		write(
			root,
			"scripts/sample.ts",
			"// biome-ignore lint\n// eslint-disable no-alert\n",
		);
		writeBaseline(root);
		write(root, "scripts/sample.ts", "// biome-ignore lint\n");
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"scripts/sample.ts: suppressions baseline=2 current=1",
		);
		expect(result.stdout).toContain("run pnpm code-health:baseline");
	});

	it("H5 excludes a live exception and lists it", () => {
		const root = fixture();
		write(
			root,
			"scripts/sample.ts",
			`const value: any = 1; // code-health-exception: typeEscapes; until=${day(10)}; reason=upstream type\n`,
		);
		writeBaseline(root);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("PASS: code health");

		const listed = run(checkScript, root, "--exceptions");
		expect(listed.status, listed.stderr).toBe(0);
		expect(listed.stdout).toContain(
			`scripts/sample.ts:1 typeEscapes until=${day(10)} reason=upstream type`,
		);
	});

	it.each([
		["expired", "2000-01-01"],
		["beyond ninety days", day(91)],
	])("H5 rejects an %s exception", (_name, until) => {
		const root = fixture();
		write(
			root,
			"scripts/sample.ts",
			`const value: any = 1; // code-health-exception: typeEscapes; until=${until}; reason=temporary\n`,
		);
		writeBaseline(root);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("scripts/sample.ts:1");
		expect(result.stdout).toContain("typeEscapes");
		expect(result.stdout).toContain(until);
	});

	it.each([
		["an impossible date", "2026-02-30", "; reason=temporary"],
		["an unpadded date", "2026-2-3", "; reason=temporary"],
		["an empty reason", day(10), "; reason="],
		["a missing reason", day(10), ""],
	])("K3 rejects %s in an exception", (_name, until, tail) => {
		const root = fixture();
		write(
			root,
			"scripts/sample.ts",
			`const value: any = 1; // code-health-exception: typeEscapes; until=${until}${tail}\n`,
		);
		writeBaseline(root);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("scripts/sample.ts:1");
		expect(result.stdout).toContain("invalid code-health exception");
	});

	it("K4 counts a long function inside a template substitution", () => {
		const root = fixture();
		write(root, "scripts/sample.ts", "export const clean = 1;\n");
		writeBaseline(root);
		const body = Array.from(
			{ length: 80 },
			(_, index) => `    void ${index};`,
		).join("\n");
		write(
			root,
			"scripts/sample.ts",
			["const value = `${", "  function long() {", body, "  }", "}`;"].join(
				"\n",
			),
		);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("scripts/sample.ts: longFunctions");
	});

	it("K4 counts a suppression marker inside a template substitution", () => {
		const root = fixture();
		write(root, "scripts/sample.ts", "export const clean = 1;\n");
		writeBaseline(root);
		write(
			root,
			"scripts/sample.ts",
			"const value = `$" + "{/* biome-ignore lint */ source}`;\n",
		);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain("scripts/sample.ts: suppressions");
	});
});
