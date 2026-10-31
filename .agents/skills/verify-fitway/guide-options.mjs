// The SKILL guide's option check: every usage option appears in SKILL.md, and every option
// SKILL.md writes is a verify:owner option, a registered option of the pnpm command it follows,
// or a tool argument after a measure or sheet command's separator.
import assert from "node:assert/strict";
import { toolEntry } from "../../../scripts/agent-environment/tool-contract.mjs";

// The options of the help's command usages, up to each usage's passthrough separator.
function usageCliOptions(helpText) {
	const options = new Set();
	const lines = helpText.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trim() === "Commands:");
	for (let index = start + 1; index < lines.length; index++) {
		const line = lines[index];
		if (!/^\s{2,}\S/.test(line)) break;
		for (const match of line
			.split(/\s--(?:\s|$)/)[0]
			.matchAll(/--[a-z][a-z0-9-]*/g))
			options.add(match[0]);
	}
	return options;
}

function shellSegments(command) {
	const segments = [];
	let current = [];
	let tokenStart = null;
	let quote = null;
	const pushToken = (end) => {
		if (tokenStart === null) return;
		if (end > tokenStart)
			current.push({
				text: command.slice(tokenStart, end),
				index: tokenStart,
			});
		tokenStart = null;
	};
	for (let index = 0; index < command.length; index++) {
		const character = command[index];
		if (quote) {
			if (character === quote) quote = null;
			continue;
		}
		if (character === "'" || character === '"') {
			if (tokenStart === null) tokenStart = index;
			quote = character;
			continue;
		}
		if (/\s/.test(character)) {
			pushToken(index);
			continue;
		}
		const separator =
			character === ";"
				? ";"
				: character === "&" || character === "|"
					? command.startsWith(`${character}${character}`, index)
						? `${character}${character}`
						: character
					: null;
		if (!separator) {
			if (tokenStart === null) tokenStart = index;
			continue;
		}
		pushToken(index);
		current.push({ text: separator, index, separator: true });
		segments.push(current);
		current = [];
		index += separator.length - 1;
	}
	pushToken(command.length);
	if (current.length) segments.push(current);
	return segments;
}

const passthroughCommands = new Set(["measure", "sheet"]);
// Longest prefix first, so `node $cli measure` names measure, not node.
const commandPrefixes = [["node", "$cli"], ["pnpm", "verify:owner"], []];

// The verify:owner command a segment runs, or the pnpm package command it runs, by token index.
function segmentCommand(tokens) {
	if (tokens[0]?.text === "pnpm" && tokens[1]?.text === "run-folder:new")
		return { name: "run-folder:new", index: 1 };
	for (const prefix of commandPrefixes)
		if (prefix.every((text, index) => tokens[index]?.text === text))
			return tokens[prefix.length]
				? { name: tokens[prefix.length].text, index: prefix.length }
				: null;
	return null;
}

function registeredOptions(name) {
	return new Set(toolEntry(name).options.map((option) => option.name));
}

// Ranges whose options are tool arguments (allowed null) or another command's (allowed set).
function guideOptionRanges(skillText) {
	const ranges = [];
	const record = (command, offset) => {
		for (const tokens of shellSegments(command)) {
			const found = segmentCommand(tokens);
			if (!found) continue;
			const packageCommand = found.name === "run-folder:new";
			if (!packageCommand && !passthroughCommands.has(found.name)) continue;
			const separator = packageCommand
				? found.index
				: tokens.findIndex(
						(token, index) => index > found.index && token.text === "--",
					);
			if (separator < 0) continue;
			const allowed = packageCommand ? registeredOptions(found.name) : null;
			for (let index = separator + 1; index < tokens.length; index++) {
				const option = /^--[a-z][a-z0-9-]*/.exec(tokens[index].text);
				if (option)
					ranges.push({
						start: offset + tokens[index].index,
						end: offset + tokens[index].index + option[0].length,
						command: found.name,
						allowed,
					});
			}
		}
	};
	for (const match of skillText.matchAll(/`([^`\n]+)`/g))
		record(match[1], match.index + 1);
	for (const fence of skillText.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
		const body = fence[1];
		const bodyStart = fence.index + fence[0].indexOf(body);
		for (const line of body.matchAll(/[^\r\n]+/g))
			record(line[0], bodyStart + line.index);
	}
	return ranges;
}

export function assertGuideOptions(skillText, helpText) {
	const cliOptions = usageCliOptions(helpText);
	for (const option of cliOptions)
		assert.ok(skillText.includes(option), `${option} is missing from SKILL.md`);
	const ranges = guideOptionRanges(skillText);
	for (const match of skillText.matchAll(/--[a-z][a-z0-9-]*/g)) {
		const range = ranges.find(
			(item) => match.index >= item.start && match.index < item.end,
		);
		if (!range)
			assert.ok(cliOptions.has(match[0]), `${match[0]} is not a CLI option`);
		else if (range.allowed)
			assert.ok(
				range.allowed.has(match[0]),
				`${match[0]} is not a ${range.command} option`,
			);
	}
}
