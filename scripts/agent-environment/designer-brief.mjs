// Refuse design-work briefs that ask their agent to build or call capture tooling directly.

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
const WORKFLOW_ROLES = new Set(["designer", "builder", "verifier"]);
const UI_FORENSICS_SCRIPTS =
	/c:\/users\/pc force\/\.agents\/skills\/ui-forensics\/scripts\//;
const SCRIPT_RUN =
	/\b(?:(?:node)(?:\.exe)?(?:\s+--?[^\s]+)*|python(?:3(?:\.\d+)?)?(?:\.exe)?(?:\s+-[^\s]+)*|py(?:\.exe)?(?:\s+-[^\s]+)*)\s+(?:"[^"]+\.(?:m?js|cjs|ts|py)"|'[^']+'|\S+\.(?:m?js|cjs|ts|py))\b/i;
const SERVER_START =
	/\bpython(?:3(?:\.\d+)?)?(?:\.exe)?\s+-m\s+http\.server\b|\b(?:npx|pnpm\s+dlx)\s+(?:serve|http-server|live-server)\b|\b(?:serve|server)\.(?:m?js|cjs)\b/i;
const SERVE_GUIDANCE =
	/\b(?:serve|serving|host|hosting)\b[^\r\n]*(?:page|concept|build|site|app|port)|\b(?:start|launch|spin up|run)\b[^\r\n]*\bserver\b|\b(?:choose|select|find|pick)\b[^\r\n]*\bport\b/i;
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

function normalizedPath(line) {
	let decoded = line;
	try {
		decoded = decodeURIComponent(line);
	} catch {
		// A malformed escape cannot be the canonical path either.
	}
	return decoded.toLowerCase().replaceAll("\\", "/").replace(/\/+/g, "/");
}

function withoutRunScript(line) {
	return line.replace(
		/(\bpnpm\s+verify:owner\s+run\b[^\r\n]*?\s--script\s+)(?:"[^"]+"|'[^']+'|\S+)/i,
		"$1<script>",
	);
}

function workflowProblems(source, lineNumbers) {
	const problems = [];
	for (const [index, line] of source.split(/\r?\n/).entries()) {
		const lineNumber = index + 1;
		if (lineNumbers && !lineNumbers.has(lineNumber)) continue;
		if (UI_FORENSICS_SCRIPTS.test(normalizedPath(line)))
			problems.push({
				line: lineNumber,
				phrase: "ui-forensics/scripts",
				message:
					"design-work brief names a ui-forensics script path; use `pnpm verify:owner measure --page` for measurements, or `pnpm verify:owner run --script <file>` for a check no command makes",
			});
		const command = withoutRunScript(line);
		if (SERVER_START.test(command))
			problems.push({
				line: lineNumber,
				phrase: SERVER_START.exec(command)[0],
				message:
					"design-work brief starts its own server; use `pnpm verify:owner serve (--concept <folder>|--ref <commit>) --port <port>`",
			});
		else if (SCRIPT_RUN.test(command))
			problems.push({
				line: lineNumber,
				phrase: SCRIPT_RUN.exec(command)[0],
				message:
					"design-work brief runs a script directly; use `pnpm verify:owner run --script <file>`",
			});
		if (
			SERVE_GUIDANCE.test(line) &&
			!/\bpnpm\s+verify:owner\s+serve\b/i.test(line)
		)
			problems.push({
				line: lineNumber,
				phrase: SERVE_GUIDANCE.exec(line)[0],
				message:
					"design-work brief tells the agent to serve without the maintained command; use `pnpm verify:owner serve`",
			});
	}
	return problems;
}

export function designerBriefProblems(
	text,
	{ role = "designer", lineNumbers, checkFrames = true } = {},
) {
	const source = environmentMasked(text);
	if (!WORKFLOW_ROLES.has(role)) return [];
	const problems = [];
	const selected = lineNumbers ?? null;
	problems.push(...workflowProblems(source, selected));
	if (role === "designer")
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
	if (role === "designer" && checkFrames && !ownerCommandNamed(source)) {
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
