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

function committedFixtureWithEscape() {
	const root = fixture();
	write(root, "scripts/sample.ts", "export const clean = 1;\n");
	writeBaseline(root);
	git(root, "add", "--all");
	git(root, "commit", "-qm", "baseline");
	write(root, "scripts/sample.ts", "const value: any = 1;\n");
	return root;
}

function inflateWorkingBaseline(root: string) {
	const baseline = JSON.parse(
		readFileSync(path.join(root, baselinePath), "utf8"),
	);
	baseline.files["scripts/sample.ts"] = { typeEscapes: 1 };
	write(root, baselinePath, `${JSON.stringify(baseline, null, "\t")}\n`);
}

function day(offset: number) {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() + offset);
	return date.toISOString().slice(0, 10);
}

function sourceLines(count: number, prefix: string) {
	return Array.from(
		{ length: count },
		(_, index) => `const ${prefix}${index} = ${index};`,
	).join("\n");
}

function committedConceptFixture() {
	const root = fixture();
	const concept = "design-research/concept";
	const page = `${concept}/page.js`;
	const script = "scripts/sample.ts";
	write(
		root,
		".agents/skills/verify-fitway/concept-source.json",
		`${JSON.stringify({ concept })}\n`,
	);
	write(root, page, sourceLines(801, "page"));
	write(root, script, sourceLines(801, "script"));
	writeBaseline(root);
	git(root, "add", "--all");
	git(root, "commit", "-qm", "baseline");
	return { concept, page, root, script };
}

function admittedConceptFixture() {
	const fixture = committedConceptFixture();
	const reason = "Concept pages grew on the long-lived branch";
	write(fixture.root, fixture.page, sourceLines(900, "page"));
	const result = run(
		baselineScript,
		fixture.root,
		"--admit",
		fixture.concept,
		"--reason",
		reason,
	);
	expect(result.status, result.stderr).toBe(0);
	const baseline = JSON.parse(
		readFileSync(path.join(fixture.root, baselinePath), "utf8"),
	);
	git(fixture.root, "add", "--all");
	git(fixture.root, "commit", "-qm", "admit concept pages");
	return { ...fixture, baseline, reason };
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
		expect(result.stdout).toContain(
			measure === "duplication"
				? "baseline=0 current=2"
				: "baseline=0 current=1",
		);
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

	it("H3 baselines giant documents and concept source, then rejects growth", () => {
		const root = fixture();
		const concept = "design-research/concept";
		write(
			root,
			".agents/skills/verify-fitway/concept-source.json",
			`${JSON.stringify({ concept })}\n`,
		);
		write(
			root,
			`${concept}/page.js`,
			[
				...Array.from(
					{ length: 800 },
					(_, index) => `const conceptLine${index} = ${index};`,
				),
				"const conceptOnlyEscape: any = 1;",
			].join("\n"),
		);
		const document = "docs/phase-records/large-document.md";
		write(root, document, "a".repeat(40_001));
		const baseline = writeBaseline(root);
		expect(baseline.files[document]).toEqual({ giantDocuments: 40_001 });
		expect(baseline.files[`${concept}/page.js`]).toEqual({ giantFiles: 801 });

		write(root, document, "a".repeat(40_002));
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			`${document}: giantDocuments baseline=40001 current=40002`,
		);
		expect(result.stdout).toContain(
			"split by section into files a reader opens one at a time",
		);
	});

	it("requires a non-empty reason for an admission", () => {
		const { concept, page, root } = committedConceptFixture();
		write(root, page, sourceLines(900, "page"));
		for (const reason of [null, "   "]) {
			const args =
				reason === null
					? ["--admit", concept]
					: ["--admit", concept, "--reason", reason];
			const result = run(baselineScript, root, ...args);
			expect(result.status, result.stderr).toBe(1);
			expect(result.stderr).toContain(
				`--admit ${concept} requires a non-empty --reason`,
			);
		}
	});

	it("admits an existing giant root once with recorded old and new values", () => {
		const { concept, page, root } = committedConceptFixture();
		write(root, page, sourceLines(900, "page"));
		const refused = run(baselineScript, root);
		expect(refused.status, refused.stderr).toBe(1);
		expect(refused.stderr).toContain(
			`${page}: giantFiles baseline=801 current=900`,
		);
		const reason = "Concept pages grew on the long-lived branch";
		const admitted = run(
			baselineScript,
			root,
			"--admit",
			concept,
			"--reason",
			reason,
		);
		expect(admitted.status, admitted.stderr).toBe(0);
		const baseline = JSON.parse(
			readFileSync(path.join(root, baselinePath), "utf8"),
		);
		expect(baseline.files[page]).toMatchObject({ giantFiles: 900 });
		expect(baseline.admissions).toEqual([
			{
				folder: concept,
				date: new Date().toISOString().slice(0, 10),
				reason,
				files: [{ file: page, measure: "giantFiles", old: 801, new: 900 }],
			},
		]);

		const beforeCommit = run(checkScript, root);
		expect(beforeCommit.status, beforeCommit.stderr).toBe(0);
		git(root, "add", "--all");
		git(root, "commit", "-qm", "admit concept pages");
		const afterCommit = run(checkScript, root);
		expect(afterCommit.status, afterCommit.stderr).toBe(0);

		write(root, page, sourceLines(901, "page"));
		const laterGrowth = run(checkScript, root);
		expect(laterGrowth.status, laterGrowth.stderr).toBe(1);
		expect(laterGrowth.stdout).toContain(
			`${page}: giantFiles baseline=900 current=901`,
		);

		write(root, page, sourceLines(850, "page"));
		expect(writeBaseline(root).admissions).toEqual(baseline.admissions);
		const duplicate = run(
			baselineScript,
			root,
			"--admit",
			concept,
			"--reason",
			"again",
		);
		expect(duplicate.status, duplicate.stderr).toBe(1);
		expect(duplicate.stderr).toContain(
			`already admitted on ${baseline.admissions[0].date}: ${reason}`,
		);
		const wrongFolder = run(
			baselineScript,
			root,
			"--admit",
			"scripts",
			"--reason",
			"not a giant root",
		);
		expect(wrongFolder.status, wrongFolder.stderr).toBe(1);
		expect(wrongFolder.stderr).toContain(
			"--admit scripts is not in the committed baseline giantRoots",
		);
	});

	it("rejects hand inflation in an admitted baseline", () => {
		const { root, script } = admittedConceptFixture();
		const baseline = JSON.parse(
			readFileSync(path.join(root, baselinePath), "utf8"),
		);
		baseline.files[script] = { giantFiles: 802 };
		write(root, baselinePath, `${JSON.stringify(baseline, null, "\t")}\n`);
		const inflation = run(checkScript, root);
		expect(inflation.status, inflation.stderr).toBe(1);
		expect(inflation.stdout).toContain(
			"working baseline inflation: scripts/sample.ts: giantFiles baseline=801 current=802",
		);
	});

	it("does not admit another rise made in the same baseline run", () => {
		const { concept, page, root, script } = committedConceptFixture();
		write(root, page, sourceLines(900, "page"));
		write(root, script, sourceLines(802, "script"));

		const admitted = run(
			baselineScript,
			root,
			"--admit",
			concept,
			"--reason",
			"concept growth",
		);
		expect(admitted.status, admitted.stderr).toBe(1);
		expect(admitted.stderr).toContain(
			"scripts/sample.ts: giantFiles baseline=801 current=802",
		);
	});

	it("C2 counts a giant Markdown document whose extension is upper case", () => {
		const root = fixture();
		write(root, "PLANT.MD", "a".repeat(40_001));
		expect(writeBaseline(root).files["PLANT.MD"]).toEqual({
			giantDocuments: 40_001,
		});
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

	it.each([
		"deleted",
		"inflated",
	])("N1 ignores a %s working baseline when protecting HEAD", (state) => {
		const root = committedFixtureWithEscape();
		if (state === "deleted") {
			rmSync(path.join(root, baselinePath), { force: true });
		} else {
			inflateWorkingBaseline(root);
		}
		const result = run(baselineScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stderr).toContain(
			"scripts/sample.ts: typeEscapes baseline=0 current=1",
		);
	});

	it("N1 check rejects an uncommitted baseline inflation", () => {
		const root = committedFixtureWithEscape();
		inflateWorkingBaseline(root);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"scripts/sample.ts: typeEscapes baseline=0 current=1",
		);
	});

	it("N2 counts a third copy in one file, including inserted blanks", () => {
		const root = fixture();
		const block = sourceLines(8, "copy");
		write(root, "scripts/copy.ts", `${block}\n${block}\n`);
		writeBaseline(root);
		const copyWithBlankLines = block.split("\n").join("\n\n");
		write(
			root,
			"scripts/copy.ts",
			`${block}\n${block}\n${copyWithBlankLines}\n`,
		);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"scripts/copy.ts: duplication baseline=2 current=3",
		);
	});

	it("N2 raises the count of a second file that receives another copy", () => {
		const root = fixture();
		const block = sourceLines(8, "other");
		write(root, "scripts/a.ts", `${block}\n`);
		write(root, "scripts/b.ts", `${block}\n`);
		writeBaseline(root);
		write(root, "scripts/b.ts", `${block}\n${block}\n`);
		const result = run(checkScript, root);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toContain(
			"scripts/b.ts: duplication baseline=1 current=2",
		);
	});

	it("N3 counts trailing line breaks through the command's reader", () => {
		const root = fixture();
		const source = (prefix: string) =>
			Array.from(
				{ length: 801 },
				(_, index) => `const ${prefix}${index} = ${index};`,
			);
		write(root, "scripts/lf.ts", `${source("lf").join("\n")}\n\n`);
		write(root, "scripts/crlf.ts", `${source("crlf").join("\r\n")}\r\n`);
		write(root, "scripts/final.ts", source("final").join("\n"));
		write(
			root,
			baselinePath,
			`${JSON.stringify(
				{
					version: 1,
					files: {
						"scripts/crlf.ts": { giantFiles: 801 },
						"scripts/final.ts": { giantFiles: 801 },
						"scripts/lf.ts": { giantFiles: 801 },
					},
				},
				null,
				"\t",
			)}\n`,
		);
		const result = run(checkScript, root);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stdout).toContain("PASS: code health");
	});

	it("C4 ignores deleted comments and blanks but still rejects code growth", () => {
		const root = fixture();
		const code = Array.from(
			{ length: 801 },
			(_, index) => `const giant${index} = ${index};`,
		);
		const decorated = [
			"// heading",
			"",
			"/* block",
			"comment only",
			"*/",
			...code,
		].join("\n");
		write(root, "scripts/giant.ts", decorated);
		writeBaseline(root);
		git(root, "add", "--all");
		git(root, "commit", "-qm", "code-line baseline");

		write(root, "scripts/giant.ts", code.join("\n"));
		const deletions = run(checkScript, root);
		expect(deletions.status, `${deletions.stdout}\n${deletions.stderr}`).toBe(
			0,
		);
		expect(deletions.stdout).toContain("PASS: code health");
		const baseline = JSON.parse(
			readFileSync(path.join(root, baselinePath), "utf8"),
		);
		expect(baseline.files["scripts/giant.ts"]).toEqual({ giantFiles: 801 });

		write(root, "scripts/giant.ts", `${code.join("\n")}\nconst extra = true;`);
		const growth = run(checkScript, root);
		expect(growth.status, growth.stderr).toBe(1);
		expect(growth.stdout).toContain(
			"scripts/giant.ts: giantFiles baseline=801 current=802",
		);

		write(root, "scripts/giant.ts", code.join("\n"));
		const restored = run(checkScript, root);
		expect(restored.status, `${restored.stdout}\n${restored.stderr}`).toBe(0);
		expect(restored.stdout).toContain("PASS: code health");
	});
});
