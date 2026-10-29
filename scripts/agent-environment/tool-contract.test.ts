import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { beginToolCommand, toolEntry } from "./tool-contract.mjs";
import { sourceScanTest, startupProbes } from "./tool-contract-cases";
import {
	contractProbes,
	equalsArguments,
	equalsProbeCases,
	noSideEffects,
	optionKey,
	repository,
	runEntry,
	runNode,
	runPool,
	runRoot,
	unknown,
	unknownProbe,
} from "./tool-contract-probes";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

afterAll(() => fs.rmSync(runRoot, { recursive: true, force: true }));

// C1's product scripts: exact names, and the families written with a star (dev*, db:*, ...).
const PRODUCT_SCRIPT =
	/^(?:dev.*|build|check-types|db:.*|edge:.*|deploy.*|env:.*|demo:.*|owner:review|test.*|check|format)$/;

function agentScript(name: string, script: string) {
	return !PRODUCT_SCRIPT.test(name) && Boolean(script);
}

function productListTest() {
	for (const name of ["build", "check", "format", "check-types", "dev:web"])
		expect(agentScript(name, "node x.mjs"), name).toBe(false);
	for (const name of ["db:push", "deploy:edge", "test:unit", "owner:review"])
		expect(agentScript(name, "node x.mjs"), name).toBe(false);
	for (const name of ["build:heldout", "check:heldout", "format:heldout"])
		expect(agentScript(name, "node x.mjs"), name).toBe(true);
}

async function packageContractTest() {
	expect(agentScript("wrapped:tool", "node --flag scripts/example.mjs")).toBe(
		true,
	);
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(repository, "package.json"), "utf8"),
	);
	const packageScripts = Object.entries(packageJson.scripts)
		.filter(([name, script]) => agentScript(name, String(script)))
		.map(([name, script]) => ({ name, invocation: String(script) }));
	const packageEntries = TOOL_REGISTRY.filter(
		(entry) => entry.kind === "package",
	);
	expect(
		packageEntries
			.map(({ name, invocation }) => ({ name, invocation }))
			.sort((left, right) => left.name.localeCompare(right.name)),
	).toEqual(
		packageScripts.sort((left, right) => left.name.localeCompare(right.name)),
	);

	const tools = toolEntry("tools");
	const result = await runNode({
		invocation: tools.invocation,
		args: [],
		commandName: tools.name,
	});
	expect(result.status, result.stderr).toBe(0);
	noSideEffects(result.events);
	for (const entry of TOOL_REGISTRY) {
		expect(result.stdout).toContain(entry.name);
		expect(result.stdout).toContain(entry.invocation);
	}
}

function equalsValueProbe() {
	const cases = equalsProbeCases();
	expect(cases.length).toBeGreaterThan(0);
	for (const probe of cases) {
		const spaced = beginToolCommand(probe.entry.name, probe.args);
		expect(spaced.options?.[optionKey(probe.option)]).toBeDefined();
		const equals = beginToolCommand(
			probe.entry.name,
			equalsArguments(probe.args, probe.option),
		);
		expect(
			equals.options?.[optionKey(probe.option)],
			`${probe.entry.name} ${probe.option.name}=value`,
		).toEqual(spaced.options?.[optionKey(probe.option)]);
	}
}

function crossSubcommandProbe() {
	return async () => {
		const result = await runEntry(toolEntry("verify:owner"), [
			"list",
			"--lan",
			"--concept",
			"contract-missing-folder",
		]);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr).toBe(
			"verify:owner: FAIL: unknown option --lan (run verify:owner --help)\n",
		);
		noSideEffects(result.events);
	};
}

function freeTextValueProbe() {
	const result = beginToolCommand("codex:round", [
		"resume",
		"AGENTS.md",
		"--message",
		"--help",
	]);
	expect(result.options?.message).toBe("--help");
}

function passthroughHelpProbe() {
	const result = beginToolCommand("verify:owner", [
		"measure",
		"--tool",
		"focus",
		"--out",
		path.join(runRoot, "measure"),
		"--",
		"--help",
	]);
	expect(result.passthrough).toEqual(["--help"]);
}

async function startFailurePrefixTest() {
	for (const folder of ["contract-missing-folder", "AGENTS.md"]) {
		const result = await runEntry(toolEntry("check:concept-css"), [folder]);
		expect(result.status).toBe(2);
		expect(result.stdout).toBe("");
		expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
		expect(result.stderr).toMatch(
			/^check:concept-css: FAIL: [^\r\n]+ \([^\r\n]+\)\r?\n$/,
		);
		expect(result.stderr).not.toMatch(/ERROR:|\\s+at\\s/);
		noSideEffects(result.events);
	}
}

async function generatedContractTest() {
	await runProbes(TOOL_REGISTRY.flatMap(contractProbes));
}

async function runProbes(
	probes: Array<{ label: string; run: () => Promise<void> }>,
) {
	const failures = (
		await runPool(probes, async (probe) => {
			try {
				await probe.run();
				return null;
			} catch (error) {
				return `${probe.label}: ${error instanceof Error ? error.message : String(error)}`;
			}
		})
	).filter(Boolean);
	expect(failures, failures.join("\n\n")).toEqual([]);
}

async function plantedBreakTest() {
	const fixtureRoot = fs.mkdtempSync(path.join(tmpdir(), "fitway-tool-break-"));
	const outside = path.join(fixtureRoot, "outside.txt");
	const wrong = path.join(fixtureRoot, "wrong.mjs");
	const processBreak = path.join(fixtureRoot, "process.cjs");
	const writeBreak = path.join(fixtureRoot, "write.cjs");
	fs.writeFileSync(
		wrong,
		'process.stderr.write("bad refusal\\n");process.exit(1);\n',
	);
	fs.writeFileSync(
		processBreak,
		'require("node:child_process").spawnSync("git",["--version"],{stdio:"ignore"});process.stdout.write("HELP\\n");\n',
	);
	fs.writeFileSync(
		writeBreak,
		`require("node:fs").writeFileSync(${JSON.stringify(outside)},"outside");process.stdout.write("HELP\\n");\n`,
	);

	const cases = [
		{
			name: "wrong refusal form",
			script: wrong,
			args: [unknown],
			expected: "bad refusal",
		},
		{
			name: "help starts git",
			script: processBreak,
			args: [],
			expected: "command side effects",
		},
		{
			name: "help writes outside repository",
			script: writeBreak,
			args: [],
			expected: "command side effects",
		},
	];
	const reported: string[] = [];
	try {
		for (const item of cases) {
			const entry = {
				...toolEntry("tools"),
				name: item.script,
				invocation: `node ${item.script}`,
			};
			const result = await runNode({
				invocation: entry.invocation,
				args: item.args,
				commandName: entry.name,
			});
			let failure = "";
			try {
				if (item.name === "wrong refusal form")
					await unknownProbe(entry, item.args)();
				else {
					expect(result.stdout).toBe("HELP\n");
					expect(result.stderr).toBe("");
					expect(result.status).toBe(0);
					noSideEffects(result.events);
				}
			} catch (error) {
				failure = error instanceof Error ? error.message : String(error);
			}
			expect(failure).toContain(item.expected);
			reported.push(`${item.name}: ${failure.split(/\r?\n/)[0]}`);
			console.log(`PLANTED BREAK REPORTED: ${reported.at(-1)}`);
		}
	} finally {
		fs.rmSync(fixtureRoot, { recursive: true, force: true });
	}
	expect(reported).toHaveLength(3);
}

describe("agent command contract", () => {
	it("keeps package.json and pnpm tools in the registry", packageContractTest);
	it("E1 accepts --name=value as --name value", equalsValueProbe);
	it(
		"E1 refuses an option declared only by another subcommand",
		crossSubcommandProbe(),
	);
	it("E1 keeps option-shaped free text as a value", freeTextValueProbe);
	it("E1 keeps --help after a passthrough separator", passthroughHelpProbe);
	it("E5 writes one clean start-up line", startFailurePrefixTest);
	it(
		"generates every help, refusal, and start-up case from the registry",
		generatedContractTest,
		60_000,
	);
	it(
		"reports planted refusal, process, and outside-write breaks",
		plantedBreakTest,
	);
	it("C1 classifies product scripts by exact name or family", productListTest);
	it(
		"C4 refuses each value a command finds it cannot use, in one line with its fix",
		() => runProbes(startupProbes()),
		60_000,
	);
	it(
		"C3 entry modules read arguments only through the shared contract",
		sourceScanTest,
	);
});
