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
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parseFastSteps } from "../../.agents/skills/gardener/facts.mjs";
import {
	buildToolingMap,
	checkToolingMap,
	MAP_RELATIVE_PATH,
	validateToolingMap,
	writeToolingMap,
} from "./generate-tooling-map.mjs";

const generator = fileURLToPath(
	new URL("./generate-tooling-map.mjs", import.meta.url),
);
const repository = fileURLToPath(new URL("../../", import.meta.url));
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
	source = "export function covered() {}\nexport function uncovered() {}\n",
	test = 'import { covered } from "./tooling-source.mjs";\ncovered();\n',
	commandSource,
	commandTest,
}: {
	source?: string;
	test?: string;
	commandSource?: string;
	commandTest?: string;
} = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-tooling-map-test-"));
	roots.push(root);
	write(root, "scripts/agent-environment/tooling-source.mjs", source);
	write(root, "scripts/agent-environment/tooling-source.test.mjs", test);
	if (commandSource !== undefined)
		write(root, "scripts/agent-environment/tooling-command.mjs", commandSource);
	if (commandTest !== undefined)
		write(
			root,
			"scripts/agent-environment/tooling-command.test.mjs",
			commandTest,
		);
	git(root, "init", "--quiet");
	git(root, "config", "user.name", "Map fixture");
	git(root, "config", "user.email", "map@example.invalid");
	git(root, "config", "commit.gpgsign", "false");
	git(root, "add", ".");
	return root;
}

function callable(
	built: Awaited<ReturnType<typeof buildToolingMap>>,
	name: string,
	kind: string,
) {
	return built.callables.find(
		(entry) => entry.name === name && entry.kind === kind,
	);
}

function sourceLineRange(source: string, start: number, end: number) {
	return source
		.split("\n")
		.slice(start - 1, end)
		.join("\n");
}

function expectDriftFailure(
	result: Awaited<ReturnType<typeof checkToolingMap>>,
	fragment: string,
) {
	expect(result.ok).toBe(false);
	expect(result.errors.join("\n")).toContain(fragment);
}

describe("M1: generated agent-tooling code map", () => {
	it("finds every callable form with a declaration-enclosing line range", async () => {
		const source = [
			"export function declared() {}",
			"export const arrowExport = () => {};",
			"export let functionExport = function namedFunction() {};",
			"export default function defaultExport() {}",
			"export class Example {",
			"  method() {}",
			"  get value() { return 1; }",
			"  set value(next) { void next; }",
			"  static staticMethod() {}",
			"  static staticArrow = () => {};",
			"}",
			"",
		].join("\n");
		const builtFile = {
			path: "scripts/agent-environment/tooling-source.mjs",
			source,
		};
		const entries =
			(await import("./generate-tooling-map.mjs")).parseCallables?.(
				builtFile.path,
				source,
			) ?? [];
		const expected = [
			["declared", "function"],
			["arrowExport", "arrow"],
			["functionExport", "function-expression"],
			["defaultExport", "default-function"],
			["Example", "class"],
			["Example.method", "method"],
			["Example.value", "getter"],
			["Example.value", "setter"],
			["Example.staticMethod", "static-method"],
			["Example.staticArrow", "static-property"],
		] as const;
		for (const [name, kind] of expected) {
			const entry = entries.find(
				(candidate) => candidate.name === name && candidate.kind === kind,
			);
			expect(entry, `${name} ${kind}`).toBeDefined();
			expect(
				sourceLineRange(source, entry?.lineStart ?? 0, entry?.lineEnd ?? 0),
			).toContain(String(name).split(".").at(-1));
		}
	});

	it("compares the mapped file list with git ls-files and records uncovered callables", async () => {
		const root = fixture();
		const built = await buildToolingMap({ root });
		expect(built.files.map((file) => file.path)).toEqual([
			"scripts/agent-environment/tooling-source.mjs",
		]);
		expect(callable(built, "covered", "function")?.tests).toEqual([
			"scripts/agent-environment/tooling-source.test.mjs",
		]);
		expect(callable(built, "uncovered", "function")?.tests).toEqual([]);
		expect(built.uncovered.map((entry) => entry.name)).toEqual(["uncovered"]);
	});

	it("lists a command-run module once at module level without claiming its functions", async () => {
		const root = fixture({
			commandSource: "export function commandOnly() {}\n",
			commandTest: [
				'import { spawnSync } from "node:child_process";',
				'import { fileURLToPath } from "node:url";',
				'const script = fileURLToPath(new URL("./tooling-command.mjs", import.meta.url));',
				"spawnSync(process.execPath, [script]);",
				"",
			].join("\n"),
		});
		const built = await buildToolingMap({ root });
		const commandFile = built.files.find(
			(file) => file.path === "scripts/agent-environment/tooling-command.mjs",
		);
		expect(commandFile?.commandTests).toEqual([
			"scripts/agent-environment/tooling-command.test.mjs",
		]);
		expect(callable(built, "commandOnly", "function")?.tests).toEqual([]);
	});

	it("validates file membership, line ranges, existing test files and call evidence", async () => {
		const root = fixture();
		const built = await buildToolingMap({ root });
		const valid = await validateToolingMap({ root, text: built.text });
		expect(valid.ok, valid.errors.join("\n")).toBe(true);

		const extra = built.text.replace(
			"## `scripts/agent-environment/tooling-source.mjs`",
			"## `scripts/agent-environment/extra.mjs`\n## `scripts/agent-environment/tooling-source.mjs`",
		);
		expect((await validateToolingMap({ root, text: extra })).ok).toBe(false);

		const badRange = built.text.replace(/L\d+-L\d+/, "L999-L999");
		expect((await validateToolingMap({ root, text: badRange })).ok).toBe(false);

		const missingTest = built.text.replace(
			"scripts/agent-environment/tooling-source.test.mjs",
			"scripts/agent-environment/missing.test.mjs",
		);
		expect((await validateToolingMap({ root, text: missingTest })).ok).toBe(
			false,
		);
	});
});

describe("M2: fast-ladder drift check", () => {
	it("passes unchanged", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		const checked = await checkToolingMap({ root });
		expect(checked.ok, checked.errors.join("\n")).toBe(true);
	});

	it("fails when a mapped source file is added or removed", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		write(
			root,
			"scripts/agent-environment/added.mjs",
			"export const added = 1;\n",
		);
		git(root, "add", ".");
		expectDriftFailure(await checkToolingMap({ root }), "file list differs");

		await writeToolingMap({ root });
		rmSync(path.join(root, "scripts/agent-environment/tooling-source.mjs"));
		git(root, "add", "-A");
		expectDriftFailure(await checkToolingMap({ root }), "file list differs");
	});

	const forms = [
		{
			form: "function declaration",
			empty: "export function anchor() {}\n",
			present: "export function anchor() {}\nexport function planted() {}\n",
		},
		{
			form: "const arrow binding",
			empty: "export const anchor = () => {};\n",
			present:
				"export const anchor = () => {};\nexport const planted = () => {};\n",
		},
		{
			form: "let function-expression binding",
			empty: "export let anchor = function () {};\n",
			present:
				"export let anchor = function () {};\nexport let planted = function () {};\n",
		},
		{
			form: "default export",
			empty: "export function anchor() {}\n",
			present:
				"export function anchor() {}\nexport default function planted() {}\n",
		},
		{
			form: "class",
			empty: "export function anchor() {}\n",
			present: "export function anchor() {}\nexport class Planted {}\n",
		},
		{
			form: "method",
			empty: "export class Holder {}\n",
			present: "export class Holder {\n  planted() {}\n}\n",
		},
		{
			form: "getter",
			empty: "export class Holder {}\n",
			present: "export class Holder {\n  get planted() { return 1; }\n}\n",
		},
		{
			form: "setter",
			empty: "export class Holder {}\n",
			present: "export class Holder {\n  set planted(next) { void next; }\n}\n",
		},
		{
			form: "static member",
			empty: "export class Holder {}\n",
			present: "export class Holder {\n  static planted() {}\n}\n",
		},
	];

	for (const sample of forms) {
		it(`fails when a ${sample.form} is added`, async () => {
			const root = fixture({ source: sample.empty });
			await writeToolingMap({ root });
			write(
				root,
				"scripts/agent-environment/tooling-source.mjs",
				sample.present,
			);
			git(root, "add", ".");
			expectDriftFailure(
				await checkToolingMap({ root }),
				"generated map differs",
			);
		});

		it(`fails when a ${sample.form} is removed`, async () => {
			const root = fixture({ source: sample.present });
			await writeToolingMap({ root });
			write(root, "scripts/agent-environment/tooling-source.mjs", sample.empty);
			git(root, "add", ".");
			expectDriftFailure(
				await checkToolingMap({ root }),
				"generated map differs",
			);
		});
	}

	it("fails when a callable moves or a test call is removed", async () => {
		const source = "export function moved() {}\n";
		const root = fixture({ source });
		await writeToolingMap({ root });
		write(
			root,
			"scripts/agent-environment/tooling-source.mjs",
			`// move\n// move\n${source}`,
		);
		git(root, "add", ".");
		expectDriftFailure(
			await checkToolingMap({ root }),
			"generated map differs",
		);

		const coverageRoot = fixture();
		await writeToolingMap({ root: coverageRoot });
		write(
			coverageRoot,
			"scripts/agent-environment/tooling-source.test.mjs",
			'import { covered } from "./tooling-source.mjs";\n',
		);
		git(coverageRoot, "add", ".");
		expectDriftFailure(
			await checkToolingMap({ root: coverageRoot }),
			"generated map differs",
		);
	});

	it("returns byte-identical output for LF and CRLF checkouts", async () => {
		const root = fixture();
		const lf = await buildToolingMap({ root });
		const source = readFileSync(
			path.join(root, "scripts/agent-environment/tooling-source.mjs"),
			"utf8",
		);
		write(
			root,
			"scripts/agent-environment/tooling-source.mjs",
			source.replaceAll("\n", "\r\n"),
		);
		const crlf = await buildToolingMap({ root });
		expect(lf.text).toContain("# Agent tooling code map");
		expect(crlf.text).toBe(lf.text);
	});

	it("prints the required failure and regeneration command", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		write(
			root,
			"scripts/agent-environment/tooling-source.mjs",
			"export function changed() {}\n",
		);
		git(root, "add", ".");
		const result = spawnSync(process.execPath, [generator, "--check"], {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
		expect(result.status).toBe(1);
		expect(`${result.stdout}${result.stderr}`).toContain(
			"pnpm check:tooling-map: FAIL:",
		);
		expect(`${result.stdout}${result.stderr}`).toContain(
			"(run pnpm map:tooling)",
		);
	});
});

describe("L1: ladder integration", () => {
	it("registers the generator and exposes the existing eight steps plus map drift", () => {
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

void MAP_RELATIVE_PATH;
