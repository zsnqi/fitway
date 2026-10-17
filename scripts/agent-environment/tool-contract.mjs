import { existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

export function toolEntry(name) {
	const entry = TOOL_REGISTRY.find((candidate) => candidate.name === name);
	if (!entry) throw new Error(`Unregistered agent command: ${name}`);
	return entry;
}

function optionName(token) {
	const equals = token.indexOf("=");
	return equals === -1 ? token : token.slice(0, equals);
}

function optionValue(token) {
	const equals = token.indexOf("=");
	return equals === -1 ? undefined : token.slice(equals + 1);
}

function optionKey(option) {
	return option.key ?? option.name.slice(2);
}

function commandOptions(entry, command) {
	if (!entry.commands?.length) return entry.options ?? [];
	if (!command) return entry.options ?? [];
	return [...(entry.globalOptions ?? []), ...(command.options ?? [])];
}

function acceptedOptions(entry, command) {
	if (!entry.commands?.length) return entry.options ?? [];
	return [...(entry.globalOptions ?? []), ...(command?.options ?? [])];
}

function visibleCommands(entry) {
	return (entry.commands ?? []).filter((command) => !command.internal);
}

function selectCommand(entry, args) {
	if (!entry.commands?.length) return null;
	const first = args.find((argument) => !argument.startsWith("-"));
	return entry.commands.find((command) => command.name === first) ?? null;
}

function selectedPassthrough(_entry, command) {
	return command?.passthrough ?? false;
}

function helpText(entry, command = null) {
	const subject = command ?? entry;
	const lines = [`Usage: ${subject.usage}`, `Purpose: ${subject.purpose}`];
	if (!command && visibleCommands(entry).length) {
		lines.push("", "Commands:");
		for (const item of visibleCommands(entry)) lines.push(`  ${item.usage}`);
	}
	const options = commandOptions(entry, command);
	lines.push("", "Options:");
	if (options.length === 0) lines.push("  (none)");
	for (const option of options) {
		const shape = option.takesValue
			? `${option.name} <${option.freeText ? "text" : "value"}> (takes a value; ${option.freeText ? "free text" : "not free text"})`
			: `${option.name} (no value)`;
		lines.push(`  ${shape} ${option.description}`.trimEnd());
	}
	lines.push("  --help, -h (no value) Show this help.");
	if (!command && entry.extraHelp?.length) lines.push("", ...entry.extraHelp);
	lines.push("", "Exit codes:");
	for (const { code, meaning } of subject.exitCodes ?? entry.exitCodes)
		lines.push(`  ${code}  ${meaning}`);
	return `${lines.join("\n")}\n`;
}

export function renderToolHelp(name, commandName = null) {
	const entry = toolEntry(name);
	const command = commandName
		? entry.commands?.find((candidate) => candidate.name === commandName)
		: null;
	if (commandName && !command)
		throw new Error(`Unknown subcommand: ${commandName}`);
	return helpText(entry, command);
}

export function renderToolTable(entries = TOOL_REGISTRY) {
	const rows = entries.map((entry) => [
		entry.name,
		entry.invocation,
		entry.purpose,
	]);
	const widths = [0, 1].map((column) =>
		Math.max(
			["Command", "Invocation"][column].length,
			...rows.map((row) => row[column].length),
		),
	);
	const format = (row) =>
		`${row[0].padEnd(widths[0])}  ${row[1].padEnd(widths[1])}  ${row[2]}`;
	return [
		format(["Command", "Invocation", "Purpose"]),
		...rows.map(format),
	].join("\n");
}

class ToolArgumentError extends Error {
	constructor(message, exitCode = 1) {
		super(message);
		this.exitCode = exitCode;
	}
}

function reject(name, what, fix, exitCode = 1) {
	throw new ToolArgumentError(toolFailure(name, what, fix), exitCode);
}

function scanForHelp(entry, command, args) {
	const options = acceptedOptions(entry, command);
	const byName = new Map(options.map((option) => [option.name, option]));
	const passthrough = selectedPassthrough(entry, command);
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--") {
			if (passthrough) return false;
			continue;
		}
		if (argument === "--help" || argument === "-h") return { command };
		const option = byName.get(optionName(argument));
		if (
			option?.takesValue &&
			option.freeText &&
			optionValue(argument) === undefined &&
			index + 1 < args.length
		)
			index += 1;
	}
	return false;
}

function findOption(entry, command, token) {
	const name = optionName(token);
	return acceptedOptions(entry, command).find((option) => option.name === name);
}

function validateOption(entry, option, token, next, state) {
	if (!option)
		reject(
			entry.name,
			`unknown option ${optionName(token)}`,
			`run ${entry.name} --help`,
		);
	if (!option.takesValue) {
		if (optionValue(token) !== undefined && optionValue(token) !== "")
			reject(
				entry.name,
				`${option.name} does not take a value`,
				`pass ${option.name} without a value; run ${entry.name} --help`,
			);
		return { option };
	}
	if (optionValue(token) !== undefined) {
		if (optionValue(token) === "")
			reject(
				entry.name,
				`${option.name} requires a value`,
				option.missingFix ?? `run ${entry.usage}`,
			);
		return { value: optionValue(token), option };
	}
	if (next === undefined || (!option.freeText && next.startsWith("-")))
		reject(
			entry.name,
			`${option.name} requires a value`,
			option.missingFix ?? `run ${entry.usage}`,
		);
	state.skip = true;
	return { value: next, option };
}

function existingPath(value, kind) {
	if (!existsSync(value)) return false;
	if (kind === "directory") return statSync(value).isDirectory();
	if (kind === "file") return statSync(value).isFile();
	return true;
}

function validateOptionPaths(
	entry,
	command,
	parsed,
	available,
	failureName,
	exitCode,
) {
	const usage = (command ?? entry).usage;
	for (const option of available) {
		if (!Object.hasOwn(parsed.options, optionKey(option))) continue;
		const value = parsed.options[optionKey(option)];
		if (option.absolute && !path.isAbsolute(value))
			reject(
				failureName,
				`${option.name} requires an absolute path: ${value}`,
				`pass an absolute path; run ${usage}`,
				exitCode,
			);
		if (!option.pathKind) continue;
		const candidate = path.resolve(process.cwd(), value);
		if (!existingPath(candidate, option.pathKind))
			reject(
				entry.name,
				option.pathLabel
					? `${option.pathLabel} not found: ${value}`
					: `${option.name} path not found: ${value}`,
				`pass an existing ${option.pathKind}; run ${usage}`,
			);
	}
}

// C4 for a value the command cannot use, declared on the option: an integer range (read with
// Number(), as the commands read it), a fixed set of choices, or an option given at most once.
function validateOptionValues(parsed, available, failureName, exitCode) {
	for (const option of available) {
		const key = optionKey(option);
		if (!Object.hasOwn(parsed.options, key)) continue;
		const value = parsed.options[key];
		if (option.once && parsed.counts[key] > 1)
			reject(
				failureName,
				`${option.name} given ${parsed.counts[key]} times`,
				`pass ${option.name} once`,
				exitCode,
			);
		if (option.integer) {
			const [min, max] = option.integer;
			const number = Number(value);
			if (!Number.isInteger(number) || number < min || number > max)
				reject(
					failureName,
					`${option.name} must be an integer from ${min} to ${max}: ${value}`,
					[`pass ${option.name} <${min}-${max}>`, option.valueNote]
						.filter(Boolean)
						.join("; "),
					exitCode,
				);
		}
		if (option.choices && !option.choices.includes(value))
			reject(
				failureName,
				`${option.name} must be one of ${option.choices.join(", ")}: ${value}`,
				`pass ${option.name} ${option.choices.join("|")}`,
				exitCode,
			);
	}
}

function validateParsed(entry, command, parsed) {
	const subject = command ?? entry;
	const failureName = entry.failureName ?? entry.name;
	const exitCode = entry.failureExitCode ?? 1;
	const available = acceptedOptions(entry, command);
	for (const option of subject.requiredOptions ?? entry.requiredOptions ?? []) {
		const declared = available.find((candidate) => candidate.name === option);
		if (!declared || !Object.hasOwn(parsed.options, optionKey(declared)))
			reject(
				failureName,
				`missing required option ${option}`,
				`run ${subject.usage}`,
				exitCode,
			);
	}
	for (const requirement of entry.requiredOptionsWhen ?? []) {
		const declared = (entry.options ?? []).find(
			(candidate) => candidate.name === requirement.option,
		);
		if (
			(!declared || !Object.hasOwn(parsed.options, optionKey(declared))) &&
			!process.env[requirement.env]
		)
			reject(
				failureName,
				`missing required option ${requirement.option}`,
				`run ${entry.usage}`,
				exitCode,
			);
	}
	const positions = subject.positionals ?? entry.positionals ?? [];
	if (!entry.deferPositionalFailures) {
		const requiredCount = positions.filter((item) => item.required).length;
		if (parsed.positionals.length < requiredCount)
			reject(
				failureName,
				`missing required ${positions[0]?.name ?? "argument"}`,
				`run ${entry.usage}`,
				exitCode,
			);
		if (parsed.positionals.length > positions.length)
			reject(
				failureName,
				`unexpected argument ${parsed.positionals[positions.length]}`,
				`run ${entry.usage}`,
				exitCode,
			);
	}
	if (!entry.skipPositionalPaths && !entry.deferPositionalFailures) {
		for (let index = 0; index < parsed.positionals.length; index += 1) {
			const position = positions[index];
			if (!position?.pathKind) continue;
			const raw = parsed.positionals[index];
			const candidate = path.resolve(process.cwd(), raw);
			if (!existingPath(candidate, position.pathKind))
				reject(
					entry.failureName ?? entry.name,
					`${position.pathLabel ?? position.name} not found: ${raw}`,
					`pass an existing ${position.pathLabel ?? position.name}; run ${entry.usage}`,
					exitCode,
				);
		}
	}
	validateOptionPaths(entry, command, parsed, available, failureName, exitCode);
	validateOptionValues(parsed, available, failureName, exitCode);
}

export function resolveToolArguments(
	name,
	args = process.argv.slice(2),
	{ validate = true } = {},
) {
	const entry = toolEntry(name);
	const fixed = entry.fixedArgs ?? [];
	const hasFixed = fixed.every((argument, index) => args[index] === argument);
	const commandArgs = hasFixed ? args.slice(fixed.length) : args;
	const command =
		selectCommand(entry, commandArgs) ??
		(hasFixed ? selectCommand(entry, fixed) : null);
	const help = scanForHelp(entry, command, commandArgs);
	if (help)
		return {
			entry,
			command: help.command,
			fixedArgs: hasFixed ? fixed : [],
			options: {},
			counts: {},
			positionals: [],
			passthrough: [],
			help: true,
		};
	if (entry.commands?.length) {
		const first = commandArgs.find((argument) => !argument.startsWith("-"));
		if (first && !command)
			reject(
				entry.name,
				`unknown command ${first}`,
				`run ${entry.name} --help`,
			);
	}
	const parsed = {
		entry,
		command,
		fixedArgs: hasFixed ? fixed : [],
		options: {},
		counts: {},
		positionals: [],
		passthrough: [],
		help: false,
	};
	const passthrough = selectedPassthrough(entry, command);
	for (let index = 0; index < commandArgs.length; index += 1) {
		const argument = commandArgs[index];
		if (argument === "--") {
			if (index === 0 && !passthrough) continue;
			if (passthrough) {
				parsed.passthrough = commandArgs.slice(index + 1);
				break;
			}
			parsed.positionals.push(...commandArgs.slice(index + 1));
			break;
		}
		if (index === 0 && command && argument === command.name) continue;
		if (!argument.startsWith("-") || argument === "-") {
			parsed.positionals.push(argument);
			continue;
		}
		const option = findOption(entry, command, argument);
		const state = {};
		const result = validateOption(
			entry,
			option,
			argument,
			commandArgs[index + 1],
			state,
		);
		parsed.options[optionKey(result.option)] = result.option.takesValue
			? result.value
			: true;
		const key = optionKey(result.option);
		parsed.counts[key] = (parsed.counts[key] ?? 0) + 1;
		if (state.skip) index += 1;
	}
	if (validate) validateParsed(entry, command, parsed);
	return parsed;
}

// One entry file can serve several registered commands (verify.mjs's modes, the tooling map's
// write and check, the Owner CLI and its map check). Given their names, the command is the one
// npm named, if its fixed arguments lead the arguments, or else the first whose fixed arguments
// do; with none, unmatched({ help }) runs and the result is null.
function selectToolName(names, args) {
	const matching = names.filter((name) =>
		toolEntry(name).fixedArgs.every(
			(argument, index) => args[index] === argument,
		),
	);
	const lifecycle = process.env.npm_lifecycle_event;
	return matching.includes(lifecycle) ? lifecycle : (matching[0] ?? null);
}

export function beginToolCommand(
	names,
	args = process.argv.slice(2),
	{ unmatched } = {},
) {
	const name = Array.isArray(names) ? selectToolName(names, args) : names;
	if (name === null) {
		unmatched?.({ help: args[0] === "--help" || args[0] === "-h" });
		return null;
	}
	try {
		const parsed = resolveToolArguments(name, args);
		if (parsed.help) {
			process.stdout.write(helpText(parsed.entry, parsed.command));
			process.exit(0);
		}
		return parsed;
	} catch (error) {
		if (!(error instanceof ToolArgumentError)) throw error;
		process.stderr.write(`${error.message}\n`);
		process.exit(error.exitCode);
	}
}

// A start-up failure a command finds itself, after the resolver: a value it cannot use. Its
// message stays the text callers and tests read; the entry prints it as C4's line through
// toolStartupLine, which returns null for any other error so the entry keeps its own form.
export class ToolStartupError extends Error {
	constructor(message, startupFix, { what = message } = {}) {
		super(message);
		this.name = "ToolStartupError";
		this.startupWhat = what;
		this.startupFix = startupFix;
	}
}

export function toolStartupLine(name, error) {
	if (error?.name !== "ToolStartupError" || !error.startupFix) return null;
	const entry = toolEntry(name);
	return toolFailure(
		entry.failureName ?? entry.name,
		error.startupWhat,
		error.startupFix,
	);
}

export function toolFailure(name, error, fix) {
	const detail = error instanceof Error ? error.message : String(error);
	return `${name}: FAIL: ${detail.replace(/[\r\n]+/g, " ")} (${fix})`;
}
