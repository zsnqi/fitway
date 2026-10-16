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
	validateToolingMap,
	writeToolingMap,
} from "./tooling-map-document.mjs";

const generator = fileURLToPath(
	new URL("./generate-tooling-map.mjs", import.meta.url),
);
const verification = fileURLToPath(
	new URL("../../scripts/verify.mjs", import.meta.url),
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
			"export const wrappedFunction = (function wrapped() {});",
			"export const ParenthesizedClass = (class { method() {} });",
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
			(await import("./tooling-map-parser.mjs")).parseCallables?.(
				builtFile.path,
				source,
			) ?? [];
		const expected = [
			["declared", "function"],
			["arrowExport", "arrow"],
			["functionExport", "function-expression"],
			["wrappedFunction", "function-expression"],
			["ParenthesizedClass", "class"],
			["ParenthesizedClass.method", "method"],
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

	it("K2: maps parenthesized default function and class expressions", async () => {
		const { parseCallables } = await import("./tooling-map-parser.mjs");
		const functionEntries =
			parseCallables?.(
				"scripts/agent-environment/tooling-source.mjs",
				"export default (function wrappedDefault() {});\n",
			) ?? [];
		const classEntries =
			parseCallables?.(
				"scripts/agent-environment/tooling-source.mjs",
				"export default (class WrappedDefault {});\n",
			) ?? [];
		expect(functionEntries.map((entry) => [entry.name, entry.kind])).toEqual([
			["default", "default-function-expression"],
		]);
		expect(classEntries.map((entry) => [entry.name, entry.kind])).toEqual([
			["WrappedDefault", "default-class"],
		]);
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

	it("K2: resolves process.cwd() in command arguments", async () => {
		const root = fixture({
			commandSource: "export function commandOnly() {}\n",
			commandTest: [
				'import { spawnSync } from "node:child_process";',
				'import path from "node:path";',
				'const script = path.join(process.cwd(), "scripts/agent-environment/tooling-command.mjs");',
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
	});

	it("K2: separates getter reads from setter writes", async () => {
		const root = fixture({
			source: [
				"export class Counter {",
				"  get value() { return 1; }",
				"  set value(next) { void next; }",
				"}",
				"",
			].join("\n"),
			test: [
				'import { Counter } from "./tooling-source.mjs";',
				"const counter = new Counter();",
				"void counter.value;",
				"",
			].join("\n"),
		});
		write(
			root,
			"scripts/agent-environment/tooling-write.test.mjs",
			[
				'import { Counter } from "./tooling-source.mjs";',
				"const counter = new Counter();",
				"counter.value = 2;",
				"counter.value += 1;",
				"counter.value++;",
				"",
			].join("\n"),
		);
		git(root, "add", ".");
		const built = await buildToolingMap({ root });
		expect(callable(built, "Counter.value", "getter")?.tests).toEqual([
			"scripts/agent-environment/tooling-source.test.mjs",
		]);
		expect(callable(built, "Counter.value", "setter")?.tests).toEqual([
			"scripts/agent-environment/tooling-write.test.mjs",
		]);
	});

	it("K2: resolves dynamic imports, bindings, and re-exports to their defining callable", async () => {
		const root = fixture({
			source: [
				"export function named() {}",
				"export function destructured() {}",
				"export default function defaultExport() {}",
				"export function directMember() {}",
				"export function namespaceExport() {}",
				"",
			].join("\n"),
			test: [
				'const namespaceModule = await import("./tooling-reexport.mjs");',
				"namespaceModule.named();",
				'const { destructured } = await import("./tooling-source.mjs");',
				"destructured();",
				'const { default: defaultBinding } = await import("./tooling-source.mjs");',
				"defaultBinding();",
				'const directMember = (await import("./tooling-source.mjs")).directMember;',
				"directMember();",
				'const namespaceExport = (await import("./tooling-source.mjs")).namespaceExport;',
				"namespaceExport();",
				"",
			].join("\n"),
		});
		write(
			root,
			"scripts/agent-environment/tooling-reexport.mjs",
			'export { named } from "./tooling-source.mjs";\n',
		);
		git(root, "add", ".");
		const built = await buildToolingMap({ root });
		const testPath = "scripts/agent-environment/tooling-source.test.mjs";
		for (const name of [
			"named",
			"destructured",
			"defaultExport",
			"directMember",
			"namespaceExport",
		]) {
			expect(
				callable(
					built,
					name,
					name === "defaultExport" ? "default-function" : "function",
				)?.tests,
			).toEqual([testPath]);
		}
	});

	it("K2: lists command-run verify-fitway entry modules at module level", async () => {
		const built = await buildToolingMap({ root: repository });
		const commandTests = new Map(
			built.files.map((file) => [file.path, file.commandTests]),
		);
		expect(commandTests.get(".agents/skills/verify-fitway/cli.mjs")).toEqual([
			".agents/skills/verify-fitway/cli.test.mjs",
		]);
		expect(
			commandTests.get(".agents/skills/verify-fitway/port-observer.cjs"),
		).toEqual([".agents/skills/verify-fitway/cli.test.mjs"]);
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

	it("K3: validates module-level command test coverage as a set", async () => {
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
		const withoutCommands = built.text.replace(/^- Command run by:.*\n/m, "");
		const missing = await validateToolingMap({ root, text: withoutCommands });
		expect(missing.ok).toBe(false);
		expect(missing.errors.join("\n")).toContain(
			"command test coverage differs for scripts/agent-environment/tooling-command.mjs",
		);
	});

	it("K3: check mode names an untracked source file in a mapped folder", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		const added = "scripts/agent-environment/tooling-added.mjs";
		write(root, added, "export function added() {}\n");
		const checked = await checkToolingMap({ root });
		expect(checked.ok).toBe(false);
		expect(checked.errors.join("\n")).toContain(added);
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
		git(root, "add", ".");
		git(root, "commit", "-m", "fixture");
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
	it("K1: the ladder fails when the map drifts", async () => {
		const root = fixture();
		await writeToolingMap({ root });
		git(root, "add", ".");
		git(root, "commit", "-m", "fixture");
		write(
			root,
			"scripts/agent-environment/tooling-source.mjs",
			"export function changed() {}\n",
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
