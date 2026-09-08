// Owner token fidelity guard.
//
// Scans every custom-property USAGE in the owner CSS tree and fails when a
// `--fw-*` / `--owner-*` / `--ows-*` token is used but never defined in any of
// the surfaces that may define owner tokens (UI globals, the web entry CSS, and
// the owner CSS tree itself). This is the guard for the class of drift where a
// token such as `--fw-accent`, `--fw-edge-quiet`, `--fw-lift`, or a settings
// token was referenced without ever existing: an undefined custom property
// resolves to nothing silently, so surfaces quietly lose borders, lifts, or
// control fills while every test still passes.
//
// A token that is undefined but only ever referenced WITH a non-empty fallback
// cannot blank a property, so those are printed as warnings instead of
// failures; they remain visible because they usually mean a deliberate
// override hook (for example the Paper material tokens) or pending cleanup.
//
// Hardcoded hex colors in the owner CSS are reported informationally so
// future palette drift stays visible; they never fail this check.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

const ownerCssRoot = path.join(
	repositoryRoot,
	"apps",
	"web",
	"src",
	"components",
	"owner",
);
const definitionSourcePaths = [
	path.join(repositoryRoot, "packages", "ui", "src", "styles", "globals.css"),
	path.join(repositoryRoot, "apps", "web", "src", "index.css"),
];

const ownerTokenPattern = /^--(?:fw|owner|ows)-[A-Za-z0-9-]+$/;
const customPropertyNamePattern = /(--[A-Za-z0-9-]+)\s*:/g;
// Owner TSX may set custom properties at runtime, either as inline-style keys
// (`"--x": value`) or through `style.setProperty("--x", ...)`; both are
// legitimate definitions the stylesheet may reference.
const inlineStyleKeyPattern = /(['"])(--[A-Za-z0-9-]+)\1\s*:/g;
const setPropertyPattern = /setProperty\(\s*(['"])(--[A-Za-z0-9-]+)\1/g;
const varOpeningPattern = /var\(/g;
const hexColorPattern = /#[0-9a-fA-F]{3,8}\b/g;

function fail(message) {
	console.error(message);
	process.exitCode = 1;
}

async function walkCssFiles(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			files.push(
				...(await walkCssFiles(path.join(directory, entry.name), relative)),
			);
		} else if (entry.isFile() && entry.name.endsWith(".css")) {
			files.push({ relative, absolute: path.join(directory, entry.name) });
		}
	}
	return files.sort((a, b) => (a.relative < b.relative ? -1 : 1));
}

async function walkOwnerTsFiles(directory, files = []) {
	const entries = await readdir(directory, { withFileTypes: true });
	for (const entry of entries) {
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			await walkOwnerTsFiles(absolute, files);
		} else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
			files.push(absolute);
		}
	}
	return files;
}

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

/**
 * Every `var(--name)` reference with its line and whether a non-empty fallback
 * follows the first top-level comma. Nested functions inside a fallback (for
 * example `color-mix(...)`) are skipped by depth tracking.
 */
function extractVarUsages(content) {
	const usages = [];
	for (const opening of content.matchAll(varOpeningPattern)) {
		const innerStart = opening.index + opening[0].length;
		let depth = 1;
		let separator = -1;
		let at = innerStart;
		while (at < content.length && depth > 0) {
			const character = content[at];
			if (character === "(") depth += 1;
			else if (character === ")") depth -= 1;
			else if (character === "," && depth === 1 && separator === -1) {
				separator = at;
			}
			at += 1;
		}
		if (depth !== 0) continue;
		const inner = content.slice(innerStart, at - 1);
		const innerSeparator = separator === -1 ? -1 : separator - innerStart;
		const namePart =
			innerSeparator === -1 ? inner : inner.slice(0, innerSeparator);
		const nameMatch = /^(--[A-Za-z0-9-]+)\s*$/.exec(namePart.trim());
		if (!nameMatch) continue;
		const hasFallback =
			innerSeparator !== -1 &&
			inner.slice(innerSeparator + 1).trim().length > 0;
		usages.push({
			name: nameMatch[1],
			hasFallback,
			line: lineNumber(content, opening.index),
		});
	}
	return usages;
}

function extractDefinitions(content) {
	const definitions = new Set();
	for (const match of content.matchAll(customPropertyNamePattern)) {
		if (ownerTokenPattern.test(match[1])) definitions.add(match[1]);
	}
	return definitions;
}

function extractRuntimeDefinitions(content) {
	const definitions = new Set();
	for (const pattern of [inlineStyleKeyPattern, setPropertyPattern]) {
		for (const match of content.matchAll(pattern)) {
			if (ownerTokenPattern.test(match[2])) definitions.add(match[2]);
		}
	}
	return definitions;
}

function collectHexColors(content) {
	const counts = new Map();
	for (const match of content.matchAll(hexColorPattern)) {
		const value = match[0].toLowerCase();
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return counts;
}

async function main() {
	const ownerFiles = await walkCssFiles(ownerCssRoot);
	if (ownerFiles.length === 0) {
		fail("check-owner-tokens: no owner CSS files found");
		return;
	}

	const definitionFiles = [
		...definitionSourcePaths.map((absolute) => ({
			absolute,
			relative: path.relative(repositoryRoot, absolute).replaceAll("\\", "/"),
		})),
		...ownerFiles,
	];

	const defined = new Set();
	for (const file of definitionFiles) {
		const content = await readFile(file.absolute, "utf8");
		for (const name of extractDefinitions(content)) defined.add(name);
	}
	const ownerTsFiles = await walkOwnerTsFiles(ownerCssRoot);
	for (const file of ownerTsFiles) {
		const content = await readFile(file, "utf8");
		for (const name of extractRuntimeDefinitions(content)) defined.add(name);
	}

	let usageCount = 0;
	const undefinedBare = [];
	const undefinedWithFallback = [];
	const hexReport = [];

	for (const file of ownerFiles) {
		const content = await readFile(file.absolute, "utf8");
		for (const usage of extractVarUsages(content)) {
			usageCount += 1;
			if (!ownerTokenPattern.test(usage.name)) continue;
			if (defined.has(usage.name)) continue;
			const record = `  ${file.relative}:${usage.line} uses ${usage.name}`;
			if (usage.hasFallback) undefinedWithFallback.push(record);
			else undefinedBare.push(record);
		}
		const hexCounts = collectHexColors(content);
		if (hexCounts.size > 0) {
			hexReport.push({ file: file.relative, counts: hexCounts });
		}
	}

	const distinctTokens = new Set(
		[...defined].filter((name) => ownerTokenPattern.test(name)),
	);

	if (undefinedBare.length > 0) {
		fail(
			`check-owner-tokens FAILED: ${undefinedBare.length} owner custom-property usage(s) reference tokens that are defined nowhere:\n${undefinedBare.join("\n")}`,
		);
	}

	if (undefinedWithFallback.length > 0) {
		console.log(
			`warning: ${undefinedWithFallback.length} usage(s) reference undefined tokens only through fallbacks (resolves, but confirm the override hook is intentional):\n${undefinedWithFallback.join("\n")}`,
		);
	}

	if (hexReport.length > 0) {
		console.log("informational: hardcoded hex colors in owner CSS");
		for (const entry of hexReport) {
			const parts = [...entry.counts.entries()]
				.sort((a, b) => (a[0] < b[0] ? -1 : 1))
				.map(([value, count]) => `${value} x${count}`);
			console.log(`  ${entry.file}: ${parts.join(", ")}`);
		}
	}

	console.log(
		`check-owner-tokens: ${usageCount} var() usages across ${ownerFiles.length} owner CSS files checked against ${distinctTokens.size} defined --fw-*/--owner-*/--ows-* tokens.`,
	);
	if (process.exitCode === 1) {
		fail("check-owner-tokens: fix the undefined token usages listed above.");
	}
}

await main();
