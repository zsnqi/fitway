import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import {
	beginToolCommand,
	renderToolHelp,
	toolEntry,
} from "./tool-contract.mjs";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

type ToolValue = {
	name: string;
	sample: string | null;
	pathKind?: string | null;
	pathLabel?: string;
	absolute?: boolean;
};
type ToolOption = ToolValue & {
	key?: string;
	takesValue: boolean;
	freeText: boolean;
};
type ToolPosition = ToolValue & {
	required: boolean;
};
type ToolCommand = {
	name: string;
	options: ToolOption[];
	requiredOptions: string[];
	positionals?: ToolPosition[];
};
type ToolEntry = {
	name: string;
	invocation: string;
	kind: "package" | "node";
	usage: string;
	options: ToolOption[];
	commands?: ToolCommand[];
	positionals?: ToolPosition[];
	requiredOptions?: string[];
	failureName?: string;
	failureExitCode?: number;
	deferPositionalFailures?: boolean;
	failureCases?: Array<{ args: string[]; fix: string }>;
	invalidValues?: Array<{ args: string[]; fix: string }>;
};
type Probe = { label: string; run: () => Promise<void> };

const repository = fileURLToPath(new URL("../../", import.meta.url));
const observer = path.join(
	repository,
	"scripts/agent-environment/tool-contract-observer.cjs",
);
const runRoot = fs.mkdtempSync(path.join(tmpdir(), "fitway-tool-contract-"));
const unknown = "--__contract_unknown";

afterAll(() => fs.rmSync(runRoot, { recursive: true, force: true }));

function agentScript(name: string, script: string) {
	return (
		!/^(?:dev|build|check-types|db:|edge:|deploy|env:|demo:|owner:review|test|check$|format$)/.test(
			name,
		) && Boolean(script)
	);
}

function optionArguments(option: ToolOption) {
	return option.takesValue
		? [option.name, option.sample ?? "contract-value"]
		: [option.name];
}

function commandPrefix(command: ToolCommand | null) {
	return command ? [command.name] : [];
}

function contractValue(option?: ToolValue) {
	if (!option) return "contract-value";
	if (option.absolute) return repository;
	if (option.pathKind === "file") return path.join(repository, "package.json");
	if (option.pathKind) return repository;
	return option.sample ?? "contract-value";
}

function requiredArguments(
	entry: ToolEntry,
	command: ToolCommand | null = null,
	overrides: Record<string, string | null> = {},
) {
	const args = commandPrefix(command);
	const options = command?.options ?? entry.options ?? [];
	for (const name of command?.requiredOptions ?? entry.requiredOptions ?? []) {
		const option = options.find((candidate) => candidate.name === name);
		const value =
			overrides[name] === null
				? undefined
				: (overrides[name] ?? contractValue(option));
		if (option?.takesValue && value !== undefined) args.push(name, value);
		else if (!option?.takesValue) args.push(name);
	}
	const positions = command?.positionals ?? entry.positionals ?? [];
	for (let index = 0; index < positions.length; index += 1) {
		if (!positions[index].required) continue;
		const value =
			overrides[`#${index}`] === null
				? undefined
				: (overrides[`#${index}`] ??
					(positions[index].pathKind
						? contractValue(positions[index])
						: positions[index].sample));
		if (value !== undefined) args.push(value);
	}
	return args;
}

function runNode({
	invocation,
	nodeArgs,
	args,
	commandName,
	cwd = repository,
	clearPhase = false,
}: {
	invocation?: string;
	nodeArgs?: string[];
	args: string[];
	commandName: string;
	cwd?: string;
	clearPhase?: boolean;
}) {
	const parts = invocation
		? invocation.split(" ")
		: ["node", ...(nodeArgs ?? [])];
	if (parts[0] !== "node") throw new Error(`Unsupported probe: ${invocation}`);
	const logPath = path.join(runRoot, `${randomUUID()}.jsonl`);
	const observerOption = `--require=${observer}`;
	const env: NodeJS.ProcessEnv = {
		...process.env,
		FITWAY_TOOL_CONTRACT_LOG: logPath,
		NODE_OPTIONS: [process.env.NODE_OPTIONS, observerOption]
			.filter(Boolean)
			.join(" "),
	};
	for (const key of Object.keys(env))
		if (key.toLowerCase() === "npm_lifecycle_event") delete env[key];
	env.npm_lifecycle_event = commandName;
	if (clearPhase) delete env.FITWAY_PHASE;
	return new Promise<{
		status: number | null;
		stdout: string;
		stderr: string;
		events: Array<Record<string, unknown>>;
	}>((resolve, reject) => {
		const child = spawn(
			process.execPath,
			["--require", observer, ...parts.slice(1), ...args],
			{ cwd, env, windowsHide: true },
		);
		let stdout = "";
		let stderr = "";
		let timedOut = false;
		child.stdout?.setEncoding("utf8");
		child.stderr?.setEncoding("utf8");
		child.stdout?.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr?.on("data", (chunk) => {
			stderr += chunk;
		});
		const timer = setTimeout(() => {
			timedOut = true;
			child.kill();
		}, 15_000);
		child.once("error", reject);
		child.once("close", (status) => {
			clearTimeout(timer);
			const events = fs.existsSync(logPath)
				? fs
						.readFileSync(logPath, "utf8")
						.split(/\r?\n/)
						.filter(Boolean)
						.map((line) => JSON.parse(line))
				: [];
			fs.rmSync(logPath, { force: true });
			if (timedOut) {
				reject(
					new Error(`Probe timed out: ${invocation ?? nodeArgs?.join(" ")}`),
				);
				return;
			}
			resolve({ status, stdout, stderr, events });
		});
	});
}

function noSideEffects(events: Array<Record<string, unknown>>) {
	expect(events, `command side effects: ${JSON.stringify(events)}`).toEqual([]);
}

function runEntry(entry: ToolEntry, args: string[], clearPhase = false) {
	return runNode({
		invocation: entry.invocation,
		args,
		commandName: entry.name,
		clearPhase,
	});
}

function helpProbe(
	entry: ToolEntry,
	args: string[],
	command: string | null = null,
) {
	return async () => {
		const result = await runEntry(entry, args);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stderr).toBe("");
		expect(result.stdout).toBe(renderToolHelp(entry.name, command));
		noSideEffects(result.events);
	};
}

function unknownProbe(entry: ToolEntry, args: string[]) {
	return async () => {
		const result = await runEntry(entry, args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr).toBe(
			`${entry.name}: FAIL: unknown option ${unknown} (run ${entry.name} --help)\n`,
		);
		noSideEffects(result.events);
	};
}

function missingValueProbe(entry: ToolEntry, args: string[], option: string) {
	return async () => {
		const result = await runEntry(entry, args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
		expect(result.stderr).toMatch(
			new RegExp(
				`^${escapeRegExp(entry.name)}: FAIL: ${escapeRegExp(option)} requires a value \\(.+\\)\\n$`,
			),
		);
		noSideEffects(result.events);
	};
}

function failureProbe(
	entry: ToolEntry,
	args: string[],
	{
		fix,
		name = entry.failureName ?? entry.name,
		exitCode = entry.failureExitCode ?? 1,
		clearPhase = false,
	}: {
		fix: string;
		name?: string;
		exitCode?: number;
		clearPhase?: boolean;
	},
) {
	return async () => {
		const result = await runEntry(entry, args, clearPhase);
		expect(result.status).toBe(exitCode);
		expect(result.stdout).toBe("");
		expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
		expect(result.stderr).toMatch(
			new RegExp(`^${escapeRegExp(name)}: FAIL: .+ \\(.+\\)\\n$`),
		);
		expect(result.stderr).toContain(fix);
		noSideEffects(result.events);
	};
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function optionCases(entry: ToolEntry) {
	if (!entry.commands?.length)
		return (entry.options ?? []).map((option) => ({
			command: null as ToolCommand | null,
			option,
		}));
	return entry.commands.flatMap((command) =>
		command.options.map((option) => ({ command, option })),
	);
}

function optionKey(option: ToolOption) {
	return option.key ?? option.name.slice(2);
}

function optionContractArguments(option: ToolOption) {
	return option.takesValue
		? [option.name, contractValue(option)]
		: [option.name];
}

function valueArguments(
	entry: ToolEntry,
	command: ToolCommand | null,
	option: ToolOption,
) {
	const args = requiredArguments(entry, command);
	const required = command?.requiredOptions ?? entry.requiredOptions ?? [];
	if (!required.includes(option.name))
		args.push(...optionContractArguments(option));
	return args;
}

function equalsProbeCases() {
	return TOOL_REGISTRY.flatMap((entry) =>
		optionCases(entry)
			.filter(({ option }) => option.takesValue)
			.map(({ command, option }) => ({
				entry,
				option,
				args: valueArguments(entry, command, option),
			})),
	);
}

function equalsArguments(args: string[], option: ToolOption) {
	const index = args.indexOf(option.name);
	if (index === -1) throw new Error(`Missing probe option ${option.name}`);
	return [
		...args.slice(0, index),
		`${option.name}=${args[index + 1]}`,
		...args.slice(index + 2),
	];
}

function helpProbes(entry: ToolEntry) {
	const probes: Probe[] = [];
	const commands = (entry.commands ?? []).filter(
		(command) => !command.internal,
	);
	const positional = entry.positionals?.[0];

	for (const help of ["--help", "-h"]) {
		probes.push({
			label: `${entry.name} ${help}`,
			run: helpProbe(entry, [help]),
		});
		if (positional)
			probes.push({
				label: `${entry.name} after positional ${help}`,
				run: helpProbe(entry, [positional.sample, help]),
			});
	}

	const between =
		commands
			.map((command) => ({ command, options: command.options }))
			.find(({ options }) => options.length >= 2) ??
		((entry.options?.length ?? 0) >= 2
			? { command: null, options: entry.options }
			: null);
	if (between) {
		const prefix = commandPrefix(between.command);
		for (const help of ["--help", "-h"])
			probes.push({
				label: `${entry.name} between options ${help}`,
				run: helpProbe(
					entry,
					[
						...prefix,
						...optionArguments(between.options[0]),
						help,
						...optionArguments(between.options[1]),
					],
					between.command?.name ?? null,
				),
			});
	}

	for (const command of commands)
		for (const help of ["--help", "-h"])
			probes.push({
				label: `${entry.name} ${command.name} ${help}`,
				run: helpProbe(entry, [command.name, help], command.name),
			});
	return probes;
}

function optionProbes(entry: ToolEntry) {
	const probes: Probe[] = [];
	probes.push({
		label: `${entry.name} unknown first`,
		run: unknownProbe(entry, [unknown]),
	});
	const cases = optionCases(entry);
	if (cases[0])
		probes.push({
			label: `${entry.name} unknown after known`,
			run: unknownProbe(entry, [
				...commandPrefix(cases[0].command),
				...optionArguments(cases[0].option),
				unknown,
			]),
		});

	for (const { command, option } of cases) {
		probes.push({
			label: `${entry.name} accepts ${option.name}`,
			run: unknownProbe(entry, [
				...commandPrefix(command),
				...optionArguments(option),
				unknown,
			]),
		});
		if (option.takesValue)
			probes.push({
				label: `${entry.name} ${option.name} missing value`,
				run: missingValueProbe(
					entry,
					[...commandPrefix(command), option.name],
					option.name,
				),
			});
	}
	return probes;
}

function optionFailureProbes(entry: ToolEntry) {
	const probes: Probe[] = [];
	const commands = (entry.commands ?? []).filter(
		(command) => !command.internal,
	);
	for (const command of commands.length ? commands : [null]) {
		const options = command?.options ?? entry.options ?? [];
		const required = command?.requiredOptions ?? entry.requiredOptions ?? [];
		for (const optionName of required) {
			const option = options.find((candidate) => candidate.name === optionName);
			if (!option) continue;
			probes.push({
				label:
					`${entry.name} ${command?.name ?? ""} missing ${optionName}`.trim(),
				run: failureProbe(
					entry,
					requiredArguments(entry, command, { [optionName]: null }),
					{ fix: entry.usage },
				),
			});
		}
		for (const option of options) {
			if (!option.pathKind) continue;
			const missingPath = option.absolute
				? path.join(tmpdir(), "fitway-contract-missing-path")
				: "contract-missing-path";
			const args = requiredArguments(entry, command, {
				[option.name]: missingPath,
			});
			if (!required.includes(option.name)) args.push(option.name, missingPath);
			probes.push({
				label:
					`${entry.name} ${command?.name ?? ""} missing path ${option.name}`.trim(),
				run: failureProbe(entry, args, { fix: "existing" }),
			});
		}
		for (const option of options) {
			if (!option.absolute) continue;
			const args = requiredArguments(entry, command, {
				[option.name]: "relative-contract-path",
			});
			if (!required.includes(option.name))
				args.push(option.name, "relative-contract-path");
			probes.push({
				label:
					`${entry.name} ${command?.name ?? ""} relative ${option.name}`.trim(),
				run: failureProbe(entry, args, { fix: "absolute" }),
			});
		}
	}
	return probes;
}

function remainingFailureProbes(entry: ToolEntry) {
	const probes: Probe[] = [];
	if (!entry.deferPositionalFailures) {
		const requiredPositions = (entry.positionals ?? [])
			.map((position, index) => ({ position, index }))
			.filter(({ position }) => position.required);
		for (const { position, index } of requiredPositions) {
			probes.push({
				label: `${entry.name} missing ${position.name}`,
				run: failureProbe(
					entry,
					requiredArguments(entry, null, { [`#${index}`]: null }),
					{ fix: entry.usage },
				),
			});
			if (position.pathKind)
				probes.push({
					label: `${entry.name} missing path ${position.name}`,
					run: failureProbe(
						entry,
						requiredArguments(entry, null, {
							[`#${index}`]: "contract-missing-path",
						}),
						{ fix: "existing", name: entry.failureName ?? entry.name },
					),
				});
		}
	}
	for (const invalid of entry.invalidValues ?? [])
		probes.push({
			label: `${entry.name} invalid value`,
			run: failureProbe(entry, invalid.args, { fix: invalid.fix }),
		});
	for (const failure of entry.failureCases ?? [])
		probes.push({
			label: `${entry.name} failure ${failure.args.join(" ") || "(none)"}`,
			run: failureProbe(entry, failure.args, {
				fix: failure.fix,
				exitCode: entry.failureExitCode,
			}),
		});
	return probes;
}

function contractProbes(entry: ToolEntry) {
	return [
		...helpProbes(entry),
		...optionProbes(entry),
		...optionFailureProbes(entry),
		...remainingFailureProbes(entry),
	];
}

async function runPool<T, R>(
	items: T[],
	worker: (item: T) => Promise<R>,
	limit = 10,
) {
	const results = new Array<R>(items.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (next < items.length) {
				const index = next++;
				results[index] = await worker(items[index]);
			}
		}),
	);
	return results;
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
		expect(spaced.options[optionKey(probe.option)]).toBeDefined();
		const equals = beginToolCommand(
			probe.entry.name,
			equalsArguments(probe.args, probe.option),
		);
		expect(
			equals.options[optionKey(probe.option)],
			`${probe.entry.name} ${probe.option.name}=value`,
		).toEqual(spaced.options[optionKey(probe.option)]);
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
	expect(result.options.message).toBe("--help");
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
	const probes = TOOL_REGISTRY.flatMap(contractProbes);
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
});
