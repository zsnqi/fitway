// Owner spacing scale guard.
//
// The owner stylesheets predate the spacing tokens and carry a long tail of
// raw pixel values, many off the 4px grid. This check holds the line without a
// mass rewrite: a declaration passes when every component is a token
// (`var(...)`), 0, auto, a percentage/calc/clamp/min/max/env expression, or a
// multiple of 4px. Everything else must be frozen in
// scripts/owner-spacing-baseline.json.
//
// The check fails on NEW off-scale declarations and on baselined declarations
// that disappear while the baseline still counts them: fixing values requires
// shrinking the baseline in the same change, so the freeze cannot silently go
// stale. `node scripts/check-owner-spacing.mjs --update` rewrites the baseline
// from the current tree for exactly that maintenance step.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

export const ownerCssRoot = path.join(
	repositoryRoot,
	"apps",
	"web",
	"src",
	"components",
	"owner",
);
export const defaultBaselinePath = path.join(
	repositoryRoot,
	"scripts",
	"owner-spacing-baseline.json",
);

const spacingPropertyPattern =
	/^(?:gap|row-gap|column-gap|margin|padding)(?:-(?:block|inline)(?:-(?:start|end))?)?$/;
const declarationPattern = /([a-zA-Z-]+)\s*:\s*([^;{}]+)[;}]/g;

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

/** Split a declaration value on top-level whitespace only. */
export function splitValueComponents(value) {
	const components = [];
	let current = "";
	let depth = 0;
	for (const character of value.trim()) {
		if (character === "(") depth += 1;
		else if (character === ")") depth -= 1;
		if (depth === 0 && /\s/.test(character)) {
			if (current) components.push(current);
			current = "";
			continue;
		}
		current += character;
	}
	if (current) components.push(current);
	return components;
}

/**
 * "ok" for on-scale values, "off-scale" otherwise. Tokens, 0, auto, and any
 * percentage or math/env expression pass; a bare pixel length must be a
 * multiple of 4.
 */
export function classifySpacingValue(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "0" || normalized === "0px" || normalized === "auto") {
		return "ok";
	}
	if (/^var\(/.test(normalized)) return "ok";
	if (/%$/.test(normalized)) return "ok";
	if (
		/(?:^|[^\w-])(?:calc|clamp|min|max|env|round|mod|rem)\(/.test(normalized)
	) {
		return "ok";
	}
	const pixel = /^(-?\d*\.?\d+)px$/.exec(normalized);
	if (pixel) {
		const amount = Number(pixel[1]);
		return Number.isFinite(amount) && amount % 4 === 0 ? "ok" : "off-scale";
	}
	return "off-scale";
}

/** Off-scale components of one declaration value. */
export function offScaleComponents(value) {
	return splitValueComponents(value).filter(
		(component) => classifySpacingValue(component) === "off-scale",
	);
}

/** Spacing declarations in one stylesheet with their file and line. */
export function parseSpacingDeclarations(content, file) {
	const stripped = stripCssComments(content);
	const declarations = [];
	for (const match of stripped.matchAll(declarationPattern)) {
		const property = match[1].toLowerCase();
		if (!spacingPropertyPattern.test(property)) continue;
		const value = match[2].trim().replace(/\s+/g, " ");
		declarations.push({
			file,
			line: lineNumber(stripped, match.index),
			property,
			value,
		});
	}
	return declarations;
}

/** Count off-scale declarations by file/property/value. */
export function aggregateOffScale(declarations) {
	const entries = new Map();
	const locations = new Map();
	for (const declaration of declarations) {
		for (const component of offScaleComponents(declaration.value)) {
			const key = `${declaration.file}|${declaration.property}|${component}`;
			entries.set(key, (entries.get(key) ?? 0) + 1);
			const list = locations.get(key) ?? [];
			list.push(`${declaration.file}:${declaration.line}`);
			locations.set(key, list);
		}
	}
	return { entries, locations };
}

export function baselineKey(entry) {
	return `${entry.file}|${entry.property}|${entry.value}`;
}

/**
 * Differences between the live tree and the freeze. `added` entries are new
 * off-scale declarations; `vanished` entries are frozen declarations the tree
 * no longer has (the baseline must shrink for those).
 */
export function diffSpacing(actualEntries, baseline) {
	const baselineCounts = new Map();
	for (const entry of baseline) {
		baselineCounts.set(baselineKey(entry), entry.count);
	}
	const added = [];
	for (const [key, count] of actualEntries) {
		const frozen = baselineCounts.get(key) ?? 0;
		if (count > frozen) {
			const [file, property, value] = key.split("|");
			added.push({ file, property, value, count, frozen });
		}
	}
	const vanished = [];
	for (const entry of baseline) {
		const count = actualEntries.get(baselineKey(entry)) ?? 0;
		if (count < entry.count) {
			vanished.push({ ...entry, frozen: entry.count, count });
		}
	}
	return { added, vanished };
}

export function buildBaseline(actualEntries) {
	return [...actualEntries]
		.map(([key, count]) => {
			const [file, property, value] = key.split("|");
			return { file, property, value, count };
		})
		.sort((a, b) =>
			`${a.file}|${a.property}|${a.value}` <
			`${b.file}|${b.property}|${b.value}`
				? -1
				: 1,
		);
}

async function walkCssFiles(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkCssFiles(absolute, relative)));
		} else if (entry.isFile() && entry.name.endsWith(".css")) {
			files.push({ relative, absolute });
		}
	}
	return files.sort((a, b) => (a.relative < b.relative ? -1 : 1));
}

async function readBaseline(file) {
	try {
		const parsed = JSON.parse(await readFile(file, "utf8"));
		return parsed.entries ?? [];
	} catch (error) {
		if (error?.code === "ENOENT") return [];
		throw error;
	}
}

async function main() {
	const update = process.argv.slice(2).includes("--update");
	const files = await walkCssFiles(ownerCssRoot);
	if (files.length === 0) {
		throw new Error("check-owner-spacing: no owner CSS files found");
	}

	const declarations = [];
	for (const file of files) {
		const content = await readFile(file.absolute, "utf8");
		declarations.push(...parseSpacingDeclarations(content, file.relative));
	}
	const { entries: actual, locations } = aggregateOffScale(declarations);

	if (update) {
		const baseline = buildBaseline(actual);
		await writeFile(
			defaultBaselinePath,
			`${JSON.stringify(
				{
					$comment:
						"Frozen owner CSS off-scale spacing declarations. The check fails on new entries and on frozen entries that disappear without this file shrinking. Regenerate with: node scripts/check-owner-spacing.mjs --update",
					entries: baseline,
				},
				null,
				"\t",
			)}\n`,
			"utf8",
		);
		console.log(
			`check-owner-spacing: baseline rewritten with ${baseline.length} off-scale declaration(s) across ${files.length} owner stylesheets.`,
		);
		return;
	}

	const baseline = await readBaseline(defaultBaselinePath);
	const { added, vanished } = diffSpacing(actual, baseline);
	const totalOffScale = [...actual.values()].reduce(
		(sum, count) => sum + count,
		0,
	);

	console.log(
		`check-owner-spacing: ${declarations.length} spacing declarations across ${files.length} owner stylesheets; ${totalOffScale} off-scale component(s) frozen against ${baseline.length} baseline entry(ies).`,
	);

	let failed = false;
	if (added.length > 0) {
		failed = true;
		console.error(
			`check-owner-spacing FAILED: ${added.length} new off-scale declaration(s) (use a multiple of 4px or a token, or freeze explicitly):`,
		);
		for (const entry of added) {
			const key = `${entry.file}|${entry.property}|${entry.value}`;
			const lines = (locations.get(key) ?? []).join(", ");
			console.error(
				`  ${lines} ${entry.property}: ${entry.value} (frozen: ${entry.frozen}, found: ${entry.count})`,
			);
		}
	}
	if (vanished.length > 0) {
		failed = true;
		console.error(
			`check-owner-spacing FAILED: ${vanished.length} baselined off-scale declaration(s) no longer exist; shrink scripts/owner-spacing-baseline.json in the same change:`,
		);
		for (const entry of vanished) {
			console.error(
				`  ${entry.file} ${entry.property}: ${entry.value} (frozen: ${entry.frozen}, found: ${entry.count})`,
			);
		}
	}
	if (failed) {
		process.exitCode = 1;
		return;
	}

	console.log("check-owner-spacing passed.");
}

const isDirectRun =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
	await main();
}
