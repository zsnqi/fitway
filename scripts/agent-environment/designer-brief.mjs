// Refuse designer briefs that ask the designer to build capture tooling.

import { mask } from "./brief-markdown.mjs";
import { environmentBlock } from "./brief-references.mjs";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

const DESIGNER_BRIEF_FIX =
	"Render with the `pnpm verify:owner` commands that `.agents/skills/verify-fitway/SKILL.md` names.";

const ownerEntry = TOOL_REGISTRY.find((entry) => entry.name === "verify:owner");
const ownerCommands = new Set(
	ownerEntry.commands
		.filter((command) => !command.internal)
		.map((command) => command.name),
);
// The public-frames round adds these two registered evidence commands.
ownerCommands.add("frames");
ownerCommands.add("sheet");

const FORBIDDEN_PHRASES = [
	[/\bnode\s+scripts?\b/i, (match) => match[0]],
	[
		/\b(?:capture|render|rendering|screenshot|sheet|frame)\s+scripts?\b/i,
		(match) => match[0],
	],
	[/\byour own scripts?\b/i, (match) => match[0]],
	[/\bwrite a script\b/i, () => "write a script"],
	[/\bthat you write\b/i, () => "that you write"],
	[/\byou write yourself\b/i, () => "you write yourself"],
	[
		/\bin the style of\b[^\r\n]*(?:d:\/fitway-temp\/|d:\\fitway-temp\\)/i,
		() => "in the style of",
	],
	[/playwright/i, (match) => match[0]],
];
const RENDER_WORD =
	/\b(?:render|renders|rendered|rendering|capture|captures|captured|screenshot|screenshots|frame|frames|sheet|sheets)\b/i;
const OWNER_COMMAND = /\bpnpm\s+verify:owner\s+([a-z][a-z0-9-]*)\b/g;

export function environmentMasked(text, block = environmentBlock(text)) {
	if (!block) return text;
	return (
		text.slice(0, block.start) +
		mask(text.slice(block.start, block.end)) +
		text.slice(block.end)
	);
}

function ownerCommandNamed(text) {
	for (const match of text.matchAll(OWNER_COMMAND))
		if (ownerCommands.has(match[1])) return true;
	return false;
}

export function designerBriefProblems(
	text,
	{ lineNumbers, checkFrames = true } = {},
) {
	const source = environmentMasked(text);
	const problems = [];
	const selected = lineNumbers ?? null;
	for (const [index, line] of source.split(/\r?\n/).entries()) {
		const lineNumber = index + 1;
		if (selected && !selected.has(lineNumber)) continue;
		for (const [pattern, phrase] of FORBIDDEN_PHRASES) {
			const match = line.match(pattern);
			if (match)
				problems.push({
					line: lineNumber,
					phrase: phrase(match),
					message: `designer brief asks for hand-built capture work: "${phrase(match)}"; fix: ${DESIGNER_BRIEF_FIX}`,
				});
		}
	}
	if (checkFrames && !ownerCommandNamed(source)) {
		for (const [index, line] of source.split(/\r?\n/).entries()) {
			const match = line.match(RENDER_WORD);
			if (!match) continue;
			problems.push({
				line: index + 1,
				phrase: match[0],
				message: `designer brief asks for "${match[0]}" without a registered pnpm verify:owner command; fix: ${DESIGNER_BRIEF_FIX}`,
			});
			break;
		}
	}
	return problems;
}
