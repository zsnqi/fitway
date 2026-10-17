import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import { renderToolHelp } from "./tool-contract.mjs";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

// The contract test's probe machinery (C5): commands run under tool-contract-observer.cjs,
// which records every child process and file write or deletion, and the probes generated
// from each registry entry. tool-contract.test.ts runs them.
type ToolValue = {
	name: string;
	sample: string | null;
	pathKind?: string | null;
	pathLabel?: string;
	absolute?: boolean;
};
export type ToolOption = ToolValue & {
	key?: string;
	takesValue: boolean;
	freeText: boolean;
	integer?: [number, number] | null;
	choices?: string[] | null;
	once?: boolean;
};
type ToolPosition = ToolValue & {
	required: boolean;
};
export type ToolCommand = {
	name: string;
	usage?: string;
	internal?: boolean;
	options: ToolOption[];
	requiredOptions: string[];
	positionals?: ToolPosition[];
};
export type ToolEntry = {
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
export type Probe = { label: string; run: () => Promise<void> };

export const repository = fileURLToPath(new URL("../../", import.meta.url));
const observer = path.join(
	repository,
	"scripts/agent-environment/tool-contract-observer.cjs",
);
export const runRoot = fs.mkdtempSync(
	path.join(tmpdir(), "fitway-tool-contract-"),
);
export const unknown = "--__contract_unknown";

export function optionArguments(option: ToolOption) {
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

export function requiredArguments(
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

// The observed child's environment: the observer preloaded, npm's lifecycle name set to the
// command, FITWAY_PHASE removed when asked, then any variables a case sets.
function probeEnvironment(
	logPath: string,
	commandName: string,
	clearPhase: boolean,
	extraEnv: Record<string, string>,
) {
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
	return Object.assign(env, extraEnv);
}

export function runNode({
	invocation,
	nodeArgs,
	args,
	commandName,
	cwd = repository,
	clearPhase = false,
	extraEnv = {},
}: {
	invocation?: string;
	nodeArgs?: string[];
	args: string[];
	commandName: string;
	cwd?: string;
	clearPhase?: boolean;
	extraEnv?: Record<string, string>;
}) {
	const parts = invocation
		? invocation.split(" ")
		: ["node", ...(nodeArgs ?? [])];
	if (parts[0] !== "node") throw new Error(`Unsupported probe: ${invocation}`);
	const logPath = path.join(runRoot, `${randomUUID()}.jsonl`);
	const env = probeEnvironment(logPath, commandName, clearPhase, extraEnv);
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

export function noSideEffects(events: Array<Record<string, unknown>>) {
	expect(events, `command side effects: ${JSON.stringify(events)}`).toEqual([]);
}

export function runEntry(
	entry: ToolEntry,
	args: string[],
	clearPhase = false,
	extraEnv: Record<string, string> = {},
) {
	return runNode({
		invocation: entry.invocation,
		args,
		commandName: entry.name,
		clearPhase,
		extraEnv,
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

export function unknownProbe(entry: ToolEntry, args: string[]) {
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

export function failureProbe(
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

export function escapeRegExp(value: string) {
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

export function optionKey(option: ToolOption) {
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

export function equalsProbeCases() {
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

export function equalsArguments(args: string[], option: ToolOption) {
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

	// C3 after a positional: an unknown option after the first positional, and after every
	// positional, is still refused by name, never read as a value or dropped.
	const positions = entry.positionals ?? [];
	for (const count of new Set([1, positions.length]))
		if (count > 0 && count <= positions.length)
			probes.push({
				label: `${entry.name} unknown after ${count} positional(s)`,
				run: unknownProbe(entry, [
					...positions.slice(0, count).map((item) => item.sample ?? "x"),
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
					{ fix: command?.usage ?? entry.usage },
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
		probes.push(...valueConstraintProbes(entry, command, options, required));
	}
	return probes;
}

// C4 for a declared value the command cannot use: outside an integer range, not one of the
// choices, or an option given more than once.
function valueConstraintProbes(
	entry: ToolEntry,
	command: ToolCommand | null,
	options: ToolOption[],
	required: string[],
) {
	const probes: Probe[] = [];
	const label = (text: string) =>
		[entry.name, command?.name, text].filter(Boolean).join(" ");
	const withValue = (option: ToolOption, value: string) => {
		const args = requiredArguments(entry, command, { [option.name]: value });
		if (!required.includes(option.name)) args.push(option.name, value);
		return args;
	};
	for (const option of options) {
		const fix = `pass ${option.name}`;
		if (option.integer)
			for (const value of [option.integer[0] - 1, option.integer[1] + 1])
				probes.push({
					label: label(`${option.name} out of range ${value}`),
					run: failureProbe(entry, withValue(option, String(value)), { fix }),
				});
		if (option.choices)
			probes.push({
				label: label(`${option.name} not a choice`),
				run: failureProbe(entry, withValue(option, "contract-not-a-choice"), {
					fix,
				}),
			});
		if (option.once)
			probes.push({
				label: label(`${option.name} repeated`),
				run: failureProbe(
					entry,
					[
						...requiredArguments(entry, command),
						...optionContractArguments(option),
						...optionContractArguments(option),
					],
					{ fix: `${fix} once` },
				),
			});
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

export function contractProbes(entry: ToolEntry) {
	return [
		...helpProbes(entry),
		...optionProbes(entry),
		...optionFailureProbes(entry),
		...remainingFailureProbes(entry),
	];
}

export async function runPool<T, R>(
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
