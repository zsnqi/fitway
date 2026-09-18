// Owner class contract guard.
//
// Owner components name their styles through `owner-*` classes. Two failure
// modes hide in that contract: a class referenced by TSX that no stylesheet
// ever styles (an unstyled control, or a leftover of a deleted rule), and a
// stylesheet rule whose class no production TSX ever renders (dead CSS that
// every unit test passes straight through). Both directions fail. Explicitly
// dynamic or externally composed names need a justified allowlist entry.
//
// Dynamic composition is supported: `className={`owner-x--${variant}`}` is
// matched as the prefix `owner-x--`, satisfied by any CSS class that starts
// with it. Names that are dynamic or test-only in a way a prefix cannot
// express belong in scripts/owner-classes-allowlist.json with a reason.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

export const ownerSourceRoot = path.join(
	repositoryRoot,
	"apps",
	"web",
	"src",
	"components",
	"owner",
);
export const webSourceRoot = path.join(repositoryRoot, "apps", "web", "src");
export const defaultAllowlistPath = path.join(
	repositoryRoot,
	"scripts",
	"owner-classes-allowlist.json",
);

const classAttributePattern =
	/\b(?:className|positionerClassName|popupClassName)\s*=\s*/g;
const cssClassPattern = /\.(owner-[A-Za-z0-9_-]+)(?![\w-])/g;
const dynamicSentinel = "\u0000";

function lineNumber(content, index) {
	let line = 1;
	for (
		let at = content.indexOf("\n");
		at !== -1 && at < index;
		at = content.indexOf("\n", at + 1)
	) {
		line += 1;
	}
	return line;
}

function stripCssComments(content) {
	return content.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
		comment.replaceAll(/[^\n]/g, " "),
	);
}

/** Index of the template literal's closing backtick, or -1. */
function templateEnd(source, start) {
	let at = start + 1;
	let expressionDepth = 0;
	while (at < source.length) {
		const character = source[at];
		if (character === "\\") {
			at += 2;
			continue;
		}
		if (character === "`" && expressionDepth === 0) return at;
		if (character === "$" && source[at + 1] === "{") {
			expressionDepth += 1;
			at += 2;
			continue;
		}
		if (character === "}" && expressionDepth > 0) {
			expressionDepth -= 1;
			at += 1;
			continue;
		}
		if (character === "`" && expressionDepth > 0) {
			const nestedEnd = templateEnd(source, at);
			if (nestedEnd === -1) return -1;
			at = nestedEnd + 1;
			continue;
		}
		at += 1;
	}
	return -1;
}

/** Index of the expression's closing brace, or -1. */
function expressionEnd(source, start) {
	let depth = 0;
	let at = start;
	while (at < source.length) {
		const character = source[at];
		if (character === '"' || character === "'") {
			const end = stringEnd(source, at);
			if (end === -1) return -1;
			at = end + 1;
			continue;
		}
		if (character === "`") {
			const end = templateEnd(source, at);
			if (end === -1) return -1;
			at = end + 1;
			continue;
		}
		if (character === "{") depth += 1;
		else if (character === "}") {
			depth -= 1;
			if (depth === 0) return at;
		}
		at += 1;
	}
	return -1;
}

function stringEnd(source, start) {
	const quote = source[start];
	let at = start + 1;
	while (at < source.length) {
		if (source[at] === "\\") {
			at += 2;
			continue;
		}
		if (source[at] === quote) return at;
		at += 1;
	}
	return -1;
}

/**
 * Class tokens from one className string value. Template holes become a
 * sentinel so `owner-x--${variant}` is recorded as the exact prefix
 * `owner-x--`; modifier punctuation is part of the contract.
 */
export function extractClassTokens(value) {
	const prepared = value.replaceAll(/\$\{[^}]*\}/g, dynamicSentinel);
	const tokens = [];
	for (const raw of prepared.split(/\s+/)) {
		if (!raw) continue;
		const sentinelAt = raw.indexOf(dynamicSentinel);
		if (sentinelAt === -1) {
			if (/^owner-[A-Za-z0-9_-]+$/.test(raw)) {
				tokens.push({ token: raw, prefix: false });
			}
			continue;
		}
		const prefix = raw.slice(0, sentinelAt);
		if (/^owner-[A-Za-z0-9_-]+$/.test(prefix)) {
			tokens.push({ token: prefix, prefix: true });
		}
	}
	return tokens;
}

function collectLiteralValues(expression) {
	const values = [];
	let at = 0;
	while (at < expression.length) {
		const character = expression[at];
		if (character === '"' || character === "'") {
			const end = stringEnd(expression, at);
			if (end === -1) break;
			values.push(expression.slice(at + 1, end));
			at = end + 1;
			continue;
		}
		if (character === "`") {
			const end = templateEnd(expression, at);
			if (end === -1) break;
			const raw = expression.slice(at + 1, end);
			values.push(raw);
			for (const hole of raw.matchAll(/\$\{([\s\S]*?)\}/g)) {
				values.push(...collectLiteralValues(hole[1] ?? ""));
			}
			at = end + 1;
			continue;
		}
		at += 1;
	}
	return values;
}

/**
 * Every className value in a TSX/TS source text, with its line. Quoted values,
 * template literals (including nested holes), and string literals inside a
 * `{...}` expression are read; unknown syntax is skipped rather than guessed.
 */
export function extractClassNames(source) {
	const values = [];
	for (const match of source.matchAll(classAttributePattern)) {
		const at = match.index + match[0].length;
		const marker = source[at];
		if (marker === '"' || marker === "'") {
			const end = stringEnd(source, at);
			if (end === -1) continue;
			values.push({
				value: source.slice(at + 1, end),
				line: lineNumber(source, match.index),
			});
			continue;
		}
		if (marker === "`") {
			const end = templateEnd(source, at);
			if (end === -1) continue;
			const raw = source.slice(at + 1, end);
			const line = lineNumber(source, match.index);
			values.push({ value: raw, line });
			for (const hole of raw.matchAll(/\$\{([\s\S]*?)\}/g)) {
				for (const value of collectLiteralValues(hole[1] ?? "")) {
					values.push({ value, line });
				}
			}
			continue;
		}
		if (marker === "{") {
			const end = expressionEnd(source, at);
			if (end === -1) continue;
			for (const value of collectLiteralValues(source.slice(at + 1, end))) {
				values.push({ value, line: lineNumber(source, match.index) });
			}
		}
	}
	return values;
}

export function collectClassTokens(source) {
	const tokens = new Map();
	for (const entry of extractClassNames(source)) {
		for (const { token, prefix } of extractClassTokens(entry.value)) {
			const existing = tokens.get(token);
			if (!existing) {
				tokens.set(token, { token, prefix, line: entry.line });
			} else if (prefix) {
				existing.prefix = true;
			}
		}
	}
	return tokens;
}

export function collectCssClasses(source) {
	const classes = new Map();
	const stripped = stripCssComments(source);
	for (const match of stripped.matchAll(cssClassPattern)) {
		if (!classes.has(match[1])) {
			classes.set(match[1], lineNumber(stripped, match.index));
		}
	}
	return classes;
}

async function walkFiles(directory, predicate, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkFiles(absolute, predicate, relative)));
		} else if (entry.isFile() && predicate(entry.name)) {
			files.push({ relative, absolute });
		}
	}
	return files.sort((a, b) => (a.relative < b.relative ? -1 : 1));
}

export function resolveClassAllowlist(allowlist) {
	const resolved = new Map();
	const entries = Array.isArray(allowlist)
		? allowlist
		: (allowlist?.classes ?? []);
	for (const entry of entries) {
		if (!entry?.name || !entry?.reason) {
			throw new Error(
				"owner-classes-allowlist.json entries need a name and a reason",
			);
		}
		if (!/^owner-[A-Za-z0-9_-]+$/.test(entry.name)) {
			throw new Error(`Allowlist name is not an owner class: ${entry.name}`);
		}
		resolved.set(entry.name, entry.reason);
	}
	return resolved;
}

export function classSatisfied(className, reference) {
	return reference.prefix
		? className.startsWith(reference.token)
		: className === reference.token;
}

export function evaluateClassContracts({ tsxSources, cssSources, allowlist }) {
	const references = new Map();
	for (const file of tsxSources) {
		for (const record of collectClassTokens(file.content).values()) {
			if (!references.has(record.token)) {
				references.set(record.token, { ...record, file: file.relative });
			}
		}
	}
	const cssClasses = new Map();
	for (const file of cssSources) {
		for (const [name, line] of collectCssClasses(file.content)) {
			if (!cssClasses.has(name)) {
				cssClasses.set(name, { file: file.relative, line });
			}
		}
	}

	const missing = [];
	for (const reference of references.values()) {
		const satisfied = [...cssClasses.keys()].some((name) =>
			classSatisfied(name, reference),
		);
		if (satisfied) continue;
		if (allowlist.has(reference.token)) continue;
		missing.push(reference);
	}

	const unreferenced = [];
	for (const [name, location] of cssClasses) {
		if (allowlist.has(name)) continue;
		const referenced = [...references.values()].some((reference) =>
			classSatisfied(name, reference),
		);
		if (!referenced) unreferenced.push({ name, ...location });
	}

	return { references, cssClasses, missing, unreferenced };
}

async function readJson(file) {
	return JSON.parse(await readFile(file, "utf8"));
}

async function main() {
	const sourceFiles = await walkFiles(
		webSourceRoot,
		(name) =>
			/\.(tsx|ts)$/.test(name) &&
			!name.endsWith(".d.ts") &&
			!name.includes(".test.") &&
			!name.includes(".spec."),
	);
	const cssFiles = await walkFiles(ownerSourceRoot, (name) =>
		name.endsWith(".css"),
	);
	if (sourceFiles.length === 0 || cssFiles.length === 0) {
		throw new Error(
			"check-owner-classes: owner source or CSS files were not found",
		);
	}

	const tsxSources = await Promise.all(
		sourceFiles.map(async (file) => ({
			relative: file.relative,
			content: await readFile(file.absolute, "utf8"),
		})),
	);
	const cssSources = await Promise.all(
		cssFiles.map(async (file) => ({
			relative: file.relative,
			content: await readFile(file.absolute, "utf8"),
		})),
	);
	const allowlist = resolveClassAllowlist(await readJson(defaultAllowlistPath));

	const { references, cssClasses, missing, unreferenced } =
		evaluateClassContracts({ tsxSources, cssSources, allowlist });

	console.log(
		`check-owner-classes: ${references.size} owner-* class references across ${tsxSources.length} owner TS files checked against ${cssClasses.size} owner-* classes across ${cssSources.length} stylesheets.`,
	);

	if (unreferenced.length > 0) {
		console.error(
			`check-owner-classes FAILED: ${unreferenced.length} owner-* CSS class(es) have no production TSX reference and no allowlist entry:`,
		);
		for (const entry of unreferenced.sort((a, b) =>
			`${a.file}:${a.line}` < `${b.file}:${b.line}` ? -1 : 1,
		)) {
			console.error(`  ${entry.file}:${entry.line} .${entry.name}`);
		}
		console.error(
			"Remove the dead rule or add a justified entry to scripts/owner-classes-allowlist.json.",
		);
	}

	if (missing.length > 0) {
		console.error(
			`check-owner-classes FAILED: ${missing.length} owner-* class reference(s) have no CSS rule and no allowlist entry:`,
		);
		for (const entry of missing.sort((a, b) => a.line - b.line)) {
			console.error(`  ${entry.file}:${entry.line} ${entry.token}`);
		}
		console.error(
			"Add the rule, fix the reference, or add a justified entry to scripts/owner-classes-allowlist.json.",
		);
	}
	if (missing.length > 0 || unreferenced.length > 0) {
		process.exitCode = 1;
		return;
	}

	console.log("check-owner-classes passed.");
}

const isDirectRun =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
	await main();
}
