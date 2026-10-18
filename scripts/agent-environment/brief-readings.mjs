// Codex review-prompt and brief-reading interpretation.

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
	DEEPSEEK_MODEL,
	modelArgs,
	repositoryRoot,
} from "./codex-environment.mjs";
import { shellTokens } from "./shell-words.mjs";

// REVIEW.md owns both the command and the prompt. Interpret its argv as data,
// without a shell, replacing only the documented folder placeholder.
async function reviewProcedure(folder, catalogPath) {
	const document = await readFile(
		path.join(repositoryRoot, "docs/agent-context/briefs/REVIEW.md"),
		"utf8",
	);
	const command = document.match(
		/^## Running it\r?\n(?:(?!^## ).)*?```bash\r?\n([^`]+)```/ms,
	)?.[1];
	const prompt = document.match(
		/^## Prompt\r?\n\s*```text\r?\n([\s\S]*?)^```\s*$/m,
	)?.[1];
	const words = command ? shellTokens(command) : undefined;
	if (words === null) throw new Error("review command has an unmatched quote");
	const tokens = words?.map((token) =>
		token
			.replaceAll("<folder>", folder)
			.replaceAll("<catalog>", catalogPath.replaceAll("\\", "/")),
	);
	const redirect = tokens?.indexOf("<");
	const route = modelArgs(DEEPSEEK_MODEL, "max", catalogPath);
	const routeStart = tokens?.indexOf("-m");
	if (
		!prompt ||
		!tokens ||
		tokens[0] !== "codex" ||
		redirect !== tokens.length - 2 ||
		tokens[redirect - 1] !== "-" ||
		typeof tokens[redirect + 1] !== "string" ||
		path.resolve(tokens[redirect + 1]) !== path.resolve(folder, "prompt.md") ||
		tokens[tokens.indexOf("-s") + 1] !== "read-only" ||
		routeStart < 0 ||
		tokens.slice(routeStart, routeStart + route.length).join("\0") !==
			route.join("\0")
	)
		throw new Error("cannot read the review command and prompt from REVIEW.md");
	return {
		prompt,
		args: tokens.slice(1, redirect),
	};
}

// The unchanged prompt asks for Markdown, not a fixed set of field labels.
// Preserve each numbered reading as written; explicit reading headings retain
// the older four-field format. Ambiguous answers fail closed.
function markdownLineRecords(text) {
	const records = [];
	let index = 0;
	let fence = null;
	for (const raw of text.split("\n")) {
		const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = null;
		} else if (!fence) records.push({ index, line });
		index += raw.length + 1;
	}
	return records;
}

function headingStart({ index, line }) {
	const heading = line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*$/);
	if (!heading) return null;
	const content = heading[2];
	const numbered = content.match(/^(\d+)[.)](?=[ \t]|$)/);
	const reading = content.match(/^Reading[ \t]+(\d+)\b/i);
	return {
		type: "heading",
		index,
		level: heading[1].length,
		number: Number(numbered?.[1] ?? reading?.[1] ?? Number.NaN),
		bodyLines: 2,
	};
}

function boldStart({ index, line }) {
	const marker = line.match(/^ {0,3}\*\*(\d+)[.)]\*\*[ \t]+\S/);
	if (marker)
		return {
			type: "bold",
			index,
			number: Number(marker[1]),
			bodyLines: 1,
		};
	const numbered = line.match(/^ {0,3}\*\*(\d+)[.)][ \t]+\S[^\n]*\*\*[ \t]*$/);
	if (numbered)
		return {
			type: "bold",
			index,
			number: Number(numbered[1]),
			bodyLines: 3,
		};
	const reading = line.match(
		/^ {0,3}\*\*Reading[ \t]+(\d+)\b[^\n]*\*\*[ \t]*$/i,
	);
	if (reading)
		return {
			type: "bold",
			index,
			number: Number(reading[1]),
			bodyLines: 3,
		};
	const outcome = line.match(
		/^ {0,3}\*\*([A-Z]+\d+)(?:[ \t]*[.):\u2013\u2014-][ \t]*[^\n]*?)?\*\*[ \t]*$/i,
	);
	if (outcome)
		return {
			type: "bold-id",
			index,
			outcomeId: outcome[1].toUpperCase(),
			bodyLines: 3,
		};
	return null;
}

function numberedBoldStart({ index, line }) {
	const match = line.match(/^ {0,3}(\d+)[.)][ \t]+\*\*[^\n]*\*\*[ \t]*$/);
	if (!match) return null;
	return {
		type: "numbered-bold",
		index,
		number: Number(match[1]),
		bodyLines: 1,
	};
}

const oneLineLabelGroups = [
	[
		"literal",
		new Set([
			"literal",
			"literally",
			"literal reading",
			"as written",
			"reading",
			"wording",
		]),
	],
	[
		"wrong",
		new Set([
			"what would go wrong",
			"what goes wrong",
			"goes wrong",
			"go wrong",
			"failure mode",
			"failure",
			"consequence",
			"delivered work",
			"delivered failure",
			"unmet",
			"break",
			"breaks",
			"risk",
			"gap",
		]),
	],
	[
		"change",
		new Set([
			"one-line change",
			"one line change",
			"closing change",
			"change to the brief",
			"change",
			"close",
			"close it",
			"fix",
			"fixed",
			"repair",
			"remedy",
			"remedies",
			"require",
			"required",
			"requires",
			"preserve",
			"avoid",
		]),
	],
];

function oneLineLabelGroup(value) {
	const label = value.trim().toLowerCase();
	for (const [group, labels] of oneLineLabelGroups) {
		if (labels.has(label)) return group;
	}
	return null;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const oneLineLabelNames = [
	...new Set(oneLineLabelGroups.flatMap(([, labels]) => [...labels])),
].sort((left, right) => right.length - left.length);

function maskedLabelText(value) {
	const chars = value.split("");
	const mask = (start, end) => {
		for (let index = start; index < end; index += 1) chars[index] = "\u0000";
	};

	for (let start = 0; start < chars.length; ) {
		if (chars[start] !== "`") {
			start += 1;
			continue;
		}
		let delimiterLength = 1;
		while (chars[start + delimiterLength] === "`") delimiterLength += 1;
		let cursor = start + delimiterLength;
		let end = -1;
		while (cursor < chars.length) {
			if (chars[cursor] !== "`") {
				cursor += 1;
				continue;
			}
			let closingLength = 1;
			while (chars[cursor + closingLength] === "`") closingLength += 1;
			if (closingLength === delimiterLength) {
				end = cursor + closingLength;
				break;
			}
			cursor += closingLength;
		}
		if (end < 0) {
			start += delimiterLength;
			continue;
		}
		mask(start, end);
		start = end;
	}

	for (const [open, close] of [
		['"', '"'],
		["\u201c", "\u201d"],
	]) {
		for (let index = 0; index < chars.length; index += 1) {
			if (chars[index] !== open) continue;
			let end = -1;
			for (let cursor = index + 1; cursor < chars.length; cursor += 1) {
				if (chars[cursor] !== close) continue;
				end = cursor;
				break;
			}
			if (end < 0) {
				mask(index, chars.length);
				break;
			}
			mask(index, end + 1);
			index = end;
		}
	}

	return chars.join("");
}

function labelStartsClause(value, index) {
	const lineStart = value.lastIndexOf("\n", index - 1) + 1;
	const linePrefix = value.slice(lineStart, index);
	if (/^[ \t]*(?:[-+*][ \t]+|\d+[.)][ \t]+)?$/.test(linePrefix)) return true;
	if (/[ \t]*(?:[-+*]|\d+[.)])[ \t]+$/.test(linePrefix)) return true;
	return /[.!?;]$/.test(linePrefix.replace(/[ \t]+$/, ""));
}

function labelledParts(value) {
	const searchable = maskedLabelText(value).replace(/[*_`]/g, " ");
	const content = value.replace(/[*_`]/g, " ");
	const pattern = new RegExp(
		`(?<![\\p{L}\\p{N}])(${oneLineLabelNames
			.map(escapeRegExp)
			.join("|")})[ \\t]*[:\\-\\u2013\\u2014]`,
		"giu",
	);
	const matches = [...searchable.matchAll(pattern)].filter((match) =>
		labelStartsClause(searchable, match.index),
	);
	return matches.map((match, index) => ({
		group: oneLineLabelGroup(match[1]),
		text: content
			.slice(
				match.index + match[0].length,
				matches[index + 1]?.index ?? content.length,
			)
			.trim(),
	}));
}

function partHasText(value) {
	return /\p{L}/u.test(
		value
			.replace(/\b[A-Z]+\d+\b/gi, " ")
			.replace(/(?:^|\s)[-+*]\s+/g, " ")
			.replace(/(?:^|\s)\d+[.)]\s+/g, " "),
	);
}

function hasEmptyLabelledPart(value, lineBreaksContinue = false) {
	return labelledParts(
		lineBreaksContinue ? value.replace(/\r?\n/g, " ") : value,
	).some((part) => !partHasText(part.text));
}

function completeLabelledReading(value) {
	const groups = new Set();
	for (const part of labelledParts(value)) {
		if (!partHasText(part.text)) return false;
		groups.add(part.group);
	}
	return groups.size === oneLineLabelGroups.length;
}

function completeOneLineReading(value) {
	const content = value.replace(/\r?\n/g, " ");
	if (!/\b[A-Z]+\d+\b/.test(content)) return false;
	const groups = new Set();
	for (const part of labelledParts(content)) {
		if (!partHasText(part.text)) return false;
		groups.add(part.group);
	}
	return groups.size === oneLineLabelGroups.length;
}

function bareStart({ index, line }) {
	const match = line.match(/^ {0,3}(\d+)[.)][ \t]+(.+)$/);
	if (!match || !/\b[A-Z]+\d+\b/.test(match[2])) return null;
	return {
		type: "bare",
		index,
		number: Number(match[1]),
		bodyLines: 0,
	};
}

function proseBeforeStarts(text, starts) {
	const prefix = text.slice(0, starts[0].index);
	if (!prefix.trim()) return true;
	if (/\b[A-Z]+\d+\b/.test(prefix)) return false;
	for (const record of markdownLineRecords(prefix)) {
		const heading = headingStart(record);
		if (
			(heading && Number.isInteger(heading.number)) ||
			boldStart(record) ||
			numberedBoldStart(record) ||
			bareStart(record)
		)
			return false;
	}
	return true;
}

function hasIndentedBody(value) {
	return value
		.split(/\r?\n/)
		.slice(1)
		.some((line) => line.trim() && /^[ \t]/.test(line));
}

function bareReadingEnd(text, start, end) {
	const match = text.slice(start.index, end).match(/\r?\n[ \t]*\r?\n/);
	return match?.index === undefined ? end : start.index + match.index;
}

function readingsFromStarts(text, starts) {
	if (!starts.length || starts.length > 5) return null;
	const outcomeHeadings = starts.some((start) => start.outcomeId);
	if (
		outcomeHeadings &&
		starts.some((start) => start.type !== "bold-id" || !start.outcomeId)
	)
		return null;
	if (
		!outcomeHeadings &&
		starts.some((start, index) => start.number !== index + 1)
	)
		return null;
	if (!proseBeforeStarts(text, starts)) return null;
	const readings = starts.map((start, index) => {
		const next = starts[index + 1]?.index ?? text.length;
		const end =
			start.type === "bare" ? bareReadingEnd(text, start, next) : next;
		return {
			id: index + 1,
			text: text.slice(start.index, end).trim(),
			bodyLines:
				starts.length === 1 && start.type === "heading"
					? Math.max(start.bodyLines, 3)
					: start.bodyLines,
			start,
		};
	});
	if (
		readings.some(({ start, text, bodyLines }) => {
			if (!/\b[A-Z]+\d+\b/.test(text)) return true;
			if (hasEmptyLabelledPart(text, start.type === "bare")) return true;
			if (start.type === "bold-id")
				return (
					!completeLabelledReading(text) ||
					text
						.split(/\r?\n/)
						.slice(1)
						.filter((line) => line.trim()).length < bodyLines
				);
			if (start.type === "bare") {
				const lines = text.split(/\r?\n/);
				const indented = hasIndentedBody(text);
				if (completeOneLineReading(lines[0])) return false;
				if (indented)
					return lines.slice(1).filter((line) => line.trim()).length < 1;
				return !completeOneLineReading(text);
			}
			return (
				text
					.split(/\r?\n/)
					.slice(1)
					.filter((line) => line.trim()).length < bodyLines
			);
		})
	)
		return null;
	return readings.map(({ id, text }) => ({ id, text }));
}

export function parseReadings(answer) {
	const text = answer.trim();
	const plain = text.replace(/[*_`]/g, "");
	if (
		/^(?:(?:The brief has|This brief has|There are|I found|I find) )?no (?:such |literal )?readings?(?: (?:found|identified|in (?:this|the) brief))?[.!]?$/i.test(
			plain,
		)
	)
		return [];

	const headings = [];
	const bold = [];
	const numberedBold = [];
	const bare = [];
	for (const record of markdownLineRecords(text)) {
		const heading = headingStart(record);
		if (heading) headings.push(heading);
		const boldStartRecord = boldStart(record);
		if (boldStartRecord) bold.push(boldStartRecord);
		const numberedBoldRecord = numberedBoldStart(record);
		if (numberedBoldRecord) numberedBold.push(numberedBoldRecord);
		const bareRecord = bareStart(record);
		if (bareRecord) bare.push(bareRecord);
	}

	if (headings.length) {
		const level = headings[0].level;
		const sameLevel = headings.filter((heading) => heading.level === level);
		if (
			headings.some((heading) => heading.level < level) ||
			sameLevel.some((heading) => !Number.isInteger(heading.number))
		)
			return null;
		return readingsFromStarts(text, sameLevel);
	}
	if (bold.length) return readingsFromStarts(text, bold);
	if (numberedBold.length) return readingsFromStarts(text, numberedBold);
	if (bare.length) return readingsFromStarts(text, bare);
	return null;
}

export function outcomeIdsFromBrief(input) {
	const ids = new Set();
	const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
	let environment = false;
	let fence;
	for (const line of text.split(/\r?\n/)) {
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = undefined;
			continue;
		}
		if (fence) continue;
		if (/^\s*<!--\s*environment:start\b/.test(line)) {
			environment = true;
			continue;
		}
		if (/^\s*<!--\s*environment:end\b/.test(line)) {
			environment = false;
			continue;
		}
		if (environment) continue;
		const outcome = line.match(/^- \*\*([A-Z]+\d+)\.(?:\*\*|[^\n]*\*\*)/);
		if (outcome) ids.add(outcome[1]);
	}
	return ids;
}

function firstLine(message) {
	return message.split(/\r?\n/, 1)[0] ?? "";
}

function quoteLine(line) {
	const longestRun = Math.max(
		0,
		...[...line.matchAll(/`+/g)].map((match) => match[0].length),
	);
	const fence = "`".repeat(Math.max(3, longestRun + 1));
	return `${fence}\n${line}\n${fence}`;
}

function autoResumeMessage(line) {
	return `The run ended because a message without a tool call ends it. Its first line was exactly:\n${quoteLine(line)}\nA report needs the \`report\` block or a \`STOPPED:\` line. Continue toward the brief's outcomes, wait inside tool calls, and send the block or the stop line when you are done.\n`;
}

function claimResumeMessage(failures) {
	return `The report was not accepted because its claims did not match this run:\n${failures.map((failure) => `- ${failure}`).join("\n")}\nContinue toward the brief's outcomes, wait inside tool calls, and send a corrected report, or a line \`STOPPED: <reason>\` when you stop on purpose.\n`;
}

function outcomeTextFromBrief(brief, id) {
	const text = Buffer.isBuffer(brief) ? brief.toString("utf8") : String(brief);
	const chunks = [];
	let collecting = false;
	for (const line of text.split(/\r?\n/)) {
		const start = line.match(/^- \*\*([A-Z]+\d+)\./);
		if (start) {
			if (collecting) break;
			collecting = start[1] === id;
			if (collecting) chunks.push(line);
			continue;
		}
		if (collecting && /^##[ \t]+/.test(line)) break;
		if (collecting) chunks.push(line);
	}
	return chunks.join("\n");
}

export {
	autoResumeMessage,
	claimResumeMessage,
	firstLine,
	outcomeTextFromBrief,
	reviewProcedure,
};
