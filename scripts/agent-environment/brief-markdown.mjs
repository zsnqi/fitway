// Markdown masking, sections, and scope reading.
import { lineAt } from "./markdown-lines.mjs";

const ENVIRONMENT_PATH = "docs/agent-context/briefs/ENVIRONMENT.md";
const START = "<!-- environment:start v1 -->";
const END = "<!-- environment:end -->";
const CODEX_SCOPE_FINAL_SENTENCE =
	"If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.";

function mask(text) {
	return text.replace(/[^\r\n]/g, " ");
}

function withoutComments(text) {
	return text.replace(/<!--[\s\S]*?-->/g, mask);
}

function codeSpans(text) {
	return [...text.matchAll(/(`+)([^`]*?)\1(?!`)/g)];
}

function withoutFencedCode(text) {
	return text.replace(
		/^ {0,3}(`{3,}|~{3,})[^\r\n]*\r?\n[\s\S]*?^ {0,3}\1\s*$/gm,
		(value) => mask(value),
	);
}

function withoutIndentedCode(text, source = text) {
	const indented = source
		.split(/\r?\n/)
		.map((line) => /^(?: {4}|\t)/.test(line));
	let line = 0;
	return text.replace(/^[^\r\n]*(?:\r\n|\n|\r|$)/gm, (value) =>
		indented[line++] ? mask(value) : value,
	);
}

function withoutCode(text) {
	let result = withoutFencedCode(text);
	for (const span of codeSpans(result).reverse())
		result =
			result.slice(0, span.index) +
			mask(span[0]) +
			result.slice(span.index + span[0].length);
	return result;
}

function markdownSections(text, title) {
	const headings = [];
	for (const match of text.matchAll(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/gm))
		headings.push({
			level: match[1].length,
			title: match[2].trim(),
			start: match.index,
			contentStart: match.index + match[0].length,
			line: lineAt(text, match.index),
		});
	const sections = [];
	for (let index = 0; index < headings.length; index += 1) {
		const heading = headings[index];
		if (heading.title.toLowerCase() !== title.toLowerCase()) continue;
		const next = headings
			.slice(index + 1)
			.find((candidate) => candidate.level <= heading.level);
		sections.push({
			line: heading.line,
			content: text.slice(heading.contentStart, next?.start ?? text.length),
		});
	}
	return sections;
}

function sectionIds(text, patterns) {
	const ids = new Set();
	for (const section of patterns.flatMap((pattern) =>
		markdownSections(text, pattern).flatMap((entry) => entry.content),
	)) {
		for (const match of section.matchAll(
			/^\s*[-*]\s+\*\*([A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*\d+)\b/gm,
		))
			ids.add(match[1]);
	}
	return ids.size;
}

export function codexScopeProblem(prose) {
	const visibleProse = withoutComments(prose);
	const scopeSections = markdownSections(
		withoutIndentedCode(withoutCode(visibleProse), visibleProse),
		"Scope",
	);
	if (scopeSections.length !== 1)
		return {
			line: scopeSections[0]?.line ?? 1,
			message: `Codex brief must have exactly one Scope section; found ${scopeSections.length}`,
		};
	const visibleScope = scopeSections[0].content.replace(/\s+/g, " ").trim();
	const sentenceStart = visibleScope.lastIndexOf(CODEX_SCOPE_FINAL_SENTENCE);
	const sentenceEndsScope =
		sentenceStart >= 0 &&
		["", "(B3)"].includes(
			visibleScope
				.slice(sentenceStart + CODEX_SCOPE_FINAL_SENTENCE.length)
				.trim(),
		) &&
		(sentenceStart === 0 || /\s/.test(visibleScope[sentenceStart - 1]));
	if (sentenceEndsScope) return null;
	return {
		line: scopeSections[0].line,
		message: `Codex Scope must end with: ${CODEX_SCOPE_FINAL_SENTENCE}`,
	};
}

function headings(text) {
	const result = new Set();
	let fence = null;
	const sourceLines = withoutComments(text).split(/\r?\n/);
	for (let index = 0; index < sourceLines.length; index += 1) {
		const line = sourceLines[index];
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = null;
			continue;
		}
		if (fence) continue;
		const atx = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*$/);
		if (atx) result.add(atx[1].replace(/\s+#+\s*$/, ""));
		else if (
			line.trim() &&
			/^ {0,3}(?:=+|-+)\s*$/.test(sourceLines[index + 1] ?? "")
		)
			result.add(line.trim());
	}
	return result;
}

function briefTitle(text) {
	const environment = text.match(
		/^<!-- environment:start v1 -->\r?\n[\s\S]*?^<!-- environment:end -->\r?$/m,
	);
	const outsideEnvironment = environment
		? text.slice(0, environment.index) +
			mask(environment[0]) +
			text.slice(environment.index + environment[0].length)
		: text;
	const visible = withoutFencedCode(withoutComments(outsideEnvironment));
	const title = visible.match(/^ {0,3}#\s+(.+?)\s*#*\s*$/m)?.[1]?.trim();
	return title?.replace(/^Codex brief:\s*/i, "") ?? null;
}

export {
	briefTitle,
	codeSpans,
	END,
	ENVIRONMENT_PATH,
	headings,
	mask,
	START,
	sectionIds,
	withoutCode,
	withoutComments,
};
