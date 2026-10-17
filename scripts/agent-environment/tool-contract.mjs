import { existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

export function toolEntry(name) {
	const entry = TOOL_REGISTRY.find((candidate) => candidate.name === name);
	if (!entry) throw new Error(`Unregistered agent command: ${name}`);
	return entry;
}

export function invocationArguments(entry) {
	const parts = entry.invocation.split(" ");
	if (parts[0] !== "node")
		throw new Error(`Unsupported invocation: ${entry.invocation}`);
	return parts.slice(1);
}

function optionName(token) {
	const equals = token.indexOf("=");
	return equals === -1 ? token : token.slice(0, equals);
}

function optionValue(token) {
	const equals = token.indexOf("=");
	return equals === -1 ? undefined : token.slice(equals + 1);
}

function commandOptions(entry, command) {
	return command?.options ?? entry.options ?? [];
}

function acceptedOptions(entry, command) {
	if (command?.internal) return command.options;
	return entry.commands?.length
		? entry.options
		: commandOptions(entry, command);
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

function fail(name, what, fix, exitCode = 1) {
	const line = `${name}: FAIL: ${String(what).replace(/[\r\n]+/g, " ")} (${fix})`;
	process.stderr.write(`${line}\n`);
	process.exit(exitCode);
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
		fail(
			entry.name,
			`unknown option ${optionName(token)}`,
			`run ${entry.name} --help`,
		);
	if (!option.takesValue) {
		if (optionValue(token) !== undefined && optionValue(token) !== "")
			fail(
				entry.name,
				`${option.name} does not take a value`,
				`pass ${option.name} without a value; run ${entry.name} --help`,
			);
		return null;
	}
	if (optionValue(token) !== undefined) {
		if (optionValue(token) === "")
			fail(
				entry.name,
				`${option.name} requires a value`,
				option.missingFix ?? `run ${entry.usage}`,
			);
		return { value: optionValue(token), option };
	}
	if (next === undefined || (!option.freeText && next.startsWith("-")))
		fail(
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

function validateParsed(entry, command, parsed) {
	const subject = command ?? entry;
	const failureName = entry.failureName ?? entry.name;
	for (const option of subject.requiredOptions ?? entry.requiredOptions ?? []) {
		if (!parsed.has.has(option))
			fail(
				failureName,
				`missing required option ${option}`,
				`run ${entry.usage}`,
			);
	}
	for (const requirement of entry.requiredOptionsWhen ?? []) {
		if (!parsed.has.has(requirement.option) && !process.env[requirement.env])
			fail(
				failureName,
				`missing required option ${requirement.option}`,
				`run ${entry.usage}`,
			);
	}
	const positions = subject.positionals ?? entry.positionals ?? [];
	if (!entry.deferPositionalFailures) {
		const requiredCount = positions.filter((item) => item.required).length;
		if (parsed.positionals.length < requiredCount)
			fail(
				failureName,
				`missing required ${positions[0]?.name ?? "argument"}`,
				`run ${entry.usage}`,
			);
	}
	if (!entry.skipPositionalPaths && !entry.deferPositionalFailures) {
		for (let index = 0; index < parsed.positionals.length; index += 1) {
			const position = positions[index];
			if (!position?.pathKind) continue;
			const raw = parsed.positionals[index];
			const candidate = path.resolve(process.cwd(), raw);
			if (!existingPath(candidate, position.pathKind))
				fail(
					entry.failureName ?? entry.name,
					`${position.pathLabel ?? position.name} not found: ${raw}`,
					`pass an existing ${position.pathLabel ?? position.name}; run ${entry.usage}`,
				);
		}
	}
	for (const item of parsed.values) {
		if (item.option.absolute && !path.isAbsolute(item.value))
			fail(
				failureName,
				`${item.option.name} requires an absolute path: ${item.value}`,
				`pass an absolute path; run ${entry.usage}`,
			);
		if (!item.option.pathKind) continue;
		const candidate = path.resolve(process.cwd(), item.value);
		if (!existingPath(candidate, item.option.pathKind))
			fail(
				entry.name,
				item.option.pathLabel
					? `${item.option.pathLabel} not found: ${item.value}`
					: `${item.option.name} path not found: ${item.value}`,
				`pass an existing ${item.option.pathKind}; run ${entry.usage}`,
			);
	}
}

export function beginToolCommand(name, args = process.argv.slice(2)) {
	const entry = toolEntry(name);
	const fixed = entry.fixedArgs ?? [];
	const hasFixed = fixed.every((argument, index) => args[index] === argument);
	const commandArgs = hasFixed ? args.slice(fixed.length) : args;
	const command = selectCommand(entry, commandArgs);
	const help = scanForHelp(entry, command, commandArgs);
	if (help) {
		process.stdout.write(helpText(entry, help.command));
		process.exit(0);
	}
	if (entry.commands?.length) {
		const first = commandArgs.find((argument) => !argument.startsWith("-"));
		if (first && !command)
			fail(entry.name, `unknown command ${first}`, `run ${entry.name} --help`);
	}
	const parsed = { has: new Set(), positionals: [], values: [] };
	const passthrough = selectedPassthrough(entry, command);
	for (let index = 0; index < commandArgs.length; index += 1) {
		const argument = commandArgs[index];
		if (argument === "--") {
			if (passthrough) break;
			continue;
		}
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
		if (option) parsed.has.add(option.name);
		if (result) parsed.values.push(result);
		if (state.skip) index += 1;
	}
	validateParsed(entry, command, parsed);
	return { entry, command };
}

export function toolFailure(name, error, fix) {
	const detail = error instanceof Error ? error.message : String(error);
	return `${name}: FAIL: ${detail.replace(/[\r\n]+/g, " ")} (${fix})`;
}

export function failTool(name, what, fix, exitCode = 1) {
	fail(name, what, fix, exitCode);
}
