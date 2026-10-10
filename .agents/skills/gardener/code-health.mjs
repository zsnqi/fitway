import path from "node:path";

export const MEASURES = [
	"giantFiles",
	"typeEscapes",
	"suppressions",
	"repeatedWorkarounds",
	"duplication",
	"boundaryBreaks",
];

const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".css", ".html"]);

function sourceFile(file) {
	return SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function lines(text) {
	return text.split(/\r?\n/);
}

function hit(file, line, detail) {
	return { file, line, detail };
}

function commentLines(text) {
	const result = [];
	let block = false;
	for (const [index, value] of lines(text).entries()) {
		let content = "";
		let cursor = 0;
		while (cursor < value.length) {
			if (block) {
				const end = value.indexOf("*/", cursor);
				content += value.slice(cursor, end < 0 ? value.length : end + 2);
				if (end < 0) {
					cursor = value.length;
				} else {
					block = false;
					cursor = end + 2;
				}
			} else {
				const lineComment = value.indexOf("//", cursor);
				const blockStart = value.indexOf("/*", cursor);
				if (lineComment < 0 && blockStart < 0) break;
				if (lineComment >= 0 && (blockStart < 0 || lineComment < blockStart)) {
					content += value.slice(lineComment);
					break;
				}
				content += value.slice(blockStart);
				const end = value.indexOf("*/", blockStart + 2);
				if (end < 0) {
					block = true;
					cursor = value.length;
				} else {
					cursor = end + 2;
				}
			}
		}
		result.push({ line: index + 1, text: content });
	}
	return result;
}

function scanGiantFiles(files) {
	return files
		.filter((item) => sourceFile(item.file))
		.flatMap((item) => {
			const count = lines(item.text).length;
			return count > 800 ? [hit(item.file, 1, `${count} lines`)] : [];
		});
}

function scanTypeEscapes(files) {
	const result = [];
	for (const item of files.filter(
		(entry) => path.extname(entry.file).toLowerCase() === ".ts",
	)) {
		for (const [index, value] of lines(item.text).entries()) {
			if (
				/\bany\b/.test(value) &&
				/:\s*(?:[A-Za-z_$][\w$]*\s*)?\bany\b|\bas\s+any\b|\bany\s*(?:[|&[<>,;) ]|$)|<\s*any\b|\b(?:type|interface)\b.*\bany\b/.test(
					value,
				)
			) {
				result.push(hit(item.file, index + 1, "any used as a type"));
			}
			if (/\bas\s+unknown\s+as\s+[A-Za-z_$][\w$<>.[\]| &]*/.test(value)) {
				result.push(hit(item.file, index + 1, "cast through unknown"));
			}
			if (/@ts-(?:ignore|expect-error)\b/.test(value)) {
				result.push(
					hit(
						item.file,
						index + 1,
						value.match(/@ts-(?:ignore|expect-error)\b/)[0],
					),
				);
			}
		}
	}
	return result;
}

function scanSuppressions(files) {
	return files.flatMap((item) =>
		commentLines(item.text).flatMap(({ line, text }) => {
			const matches =
				text.match(/\b(?:biome-ignore|eslint-disable)(?:[-\w]*)?\b/g) ?? [];
			return matches.map((value) => hit(item.file, line, value));
		}),
	);
}

function scanCommentsForWorkarounds(files) {
	return files.flatMap((item) =>
		commentLines(item.text).flatMap(({ line, text }) => {
			const matches = text.match(/\b(?:TODO|FIXME|HACK|workaround)\b/gi) ?? [];
			return matches.map((value) => hit(item.file, line, `${value} marker`));
		}),
	);
}

function scanRepeatedWorkarounds(files) {
	const result = scanCommentsForWorkarounds(files);
	for (const item of files) {
		const ext = path.extname(item.file).toLowerCase();
		for (const [index, value] of lines(item.text).entries()) {
			if (ext === ".css" && /!important\b/.test(value)) {
				result.push(hit(item.file, index + 1, "!important"));
			}
			if (
				/requestAnimationFrame\s*\([^\n]*requestAnimationFrame\s*\(/.test(value)
			) {
				result.push(hit(item.file, index + 1, "nested requestAnimationFrame"));
			}
			if (
				/setTimeout\s*\([^;\n]*,\s*0\s*\)/.test(value) ||
				/setTimeout\s*\(\s*[^,;\n]+\)/.test(value)
			) {
				result.push(
					hit(item.file, index + 1, "zero or omitted setTimeout delay"),
				);
			}
		}
		for (const match of item.text.matchAll(
			/requestAnimationFrame\s*\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(?:\{[\s\S]{0,500}?requestAnimationFrame\s*\(|requestAnimationFrame\s*\()/g,
		)) {
			const line = item.text.slice(0, match.index).split(/\r?\n/).length;
			if (
				!result.some(
					(entry) =>
						entry.file === item.file &&
						entry.line === line &&
						entry.detail === "nested requestAnimationFrame",
				)
			) {
				result.push(hit(item.file, line, "nested requestAnimationFrame"));
			}
		}
	}
	return result;
}

function scanDuplication(files) {
	const sequences = new Map();
	for (const item of files) {
		const values = lines(item.text).map((value) => value.trim());
		let start = 0;
		while (start < values.length) {
			if (!values[start]) {
				start += 1;
				continue;
			}
			let end = start;
			while (end < values.length && values[end]) end += 1;
			const run = values.slice(start, end);
			for (let offset = 0; offset + 10 <= run.length; offset += 1) {
				const key = run.slice(offset, offset + 10).join("\n");
				const occurrences = sequences.get(key) ?? [];
				occurrences.push({ file: item.file, line: start + offset + 1 });
				sequences.set(key, occurrences);
			}
			start = end;
		}
	}
	const duplicated = new Set();
	for (const occurrences of sequences.values()) {
		if (occurrences.length < 2) continue;
		for (const occurrence of occurrences)
			duplicated.add(`${occurrence.file}:${occurrence.line}`);
	}
	const result = [];
	const seen = new Set();
	for (const occurrences of sequences.values()) {
		if (occurrences.length < 2) continue;
		for (const occurrence of occurrences) {
			const key = `${occurrence.file}:${occurrence.line}`;
			if (duplicated.has(`${occurrence.file}:${occurrence.line - 1}`)) continue;
			if (!seen.has(key)) {
				seen.add(key);
				result.push(
					hit(occurrence.file, occurrence.line, "10-line duplicate run"),
				);
			}
		}
	}
	return result.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

function idsReferenced(text) {
	const result = [];
	const patterns = [
		/getElementById\(\s*["']([^"']+)["']/g,
		/querySelector(?:All)?\(\s*["']#([A-Za-z_][\w-]*)/g,
		/(?<![\w-])#([A-Za-z_][\w-]*)/g,
	];
	for (const pattern of patterns) {
		for (const match of text.matchAll(pattern))
			result.push({ id: match[1], index: match.index });
	}
	return result;
}

function scanBoundaryBreaks(files, sharedFiles) {
	const pages = files.filter(
		(item) => path.extname(item.file).toLowerCase() === ".html",
	);
	const definitions = new Map();
	for (const page of pages) {
		for (const match of page.text.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) {
			const owners = definitions.get(match[1]) ?? [];
			owners.push(page.file);
			definitions.set(match[1], owners);
		}
	}
	const result = [];
	for (const item of files) {
		const name = path.basename(item.file);
		if (!sharedFiles.includes(name)) continue;
		for (const reference of idsReferenced(item.text)) {
			const owners = definitions.get(reference.id) ?? [];
			if (owners.length !== 1) continue;
			const line = item.text.slice(0, reference.index).split(/\r?\n/).length;
			result.push(
				hit(
					item.file,
					line,
					`#${reference.id} is defined only by ${owners[0]}`,
				),
			);
		}
	}
	const seen = new Set();
	return result.filter((item) => {
		const key = `${item.file}:${item.line}:${item.detail}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function scanScope(files, { sharedFiles = [] } = {}) {
	const measures = {
		giantFiles: scanGiantFiles(files),
		typeEscapes: scanTypeEscapes(files),
		suppressions: scanSuppressions(files),
		repeatedWorkarounds: scanRepeatedWorkarounds(files),
		duplication: scanDuplication(files),
		boundaryBreaks: scanBoundaryBreaks(files, sharedFiles),
	};
	return Object.fromEntries(
		MEASURES.map((name) => [
			name,
			{ total: measures[name].length, hits: measures[name] },
		]),
	);
}

function unknownScope(name, reason, source) {
	return {
		name,
		status: "unknown",
		source,
		reason,
		measures: Object.fromEntries(
			MEASURES.map((measure) => [
				measure,
				{ total: null, hits: [], status: "unknown", reason },
			]),
		),
	};
}

function parsePreviousReport(text) {
	if (!text) return null;
	const match = text.match(
		/^## codeHealth\r?\n\r?\n```json\r?\n([\s\S]*?)\r?\n```/m,
	);
	if (!match) return null;
	try {
		return JSON.parse(match[1]);
	} catch {
		return null;
	}
}

function addTrends(scope, previous) {
	for (const measure of MEASURES) {
		const current = scope.measures[measure].total;
		const old = previous?.measures?.[measure]?.total ?? null;
		scope.measures[measure].previous = old;
		scope.measures[measure].trend =
			old === null || current === null ? "no previous" : current - old;
	}
	return scope;
}

function gitText(git, args) {
	return git(args);
}

export async function collectCodeHealth({
	config,
	git,
	previousReportText = null,
	previousReportSource = null,
} = {}) {
	const settings = config?.codeHealth;
	if (!settings?.concept?.branch || !settings.concept.folder) {
		throw new Error(
			"config.json must define codeHealth.concept.branch and folder",
		);
	}
	const previous = parsePreviousReport(previousReportText);
	const concept = settings.concept;
	const toolingRoots = settings.toolingRoots ?? ["scripts", ".agents/skills"];
	const readScope = (name, source, listFiles) => {
		try {
			const listed = listFiles();
			if (name === "concept" && listed.length === 0)
				throw new Error(
					"configured concept folder has no readable tracked files",
				);
			const files = listed.filter(sourceFile).map((file) => ({
				file,
				text: gitText(git, ["show", `${source}:${file}`]),
			}));
			return addTrends(
				{
					name,
					status: "ok",
					source,
					measures: scanScope(files, {
						sharedFiles: concept.sharedFiles ?? [],
					}),
				},
				previous?.scopes?.find((item) => item.name === name),
			);
		} catch (error) {
			return unknownScope(name, error.message, source);
		}
	};
	const conceptScope = readScope("concept", concept.branch, () =>
		gitText(git, [
			"ls-tree",
			"-r",
			"--name-only",
			concept.branch,
			"--",
			concept.folder,
		])
			.split(/\r?\n/)
			.filter(Boolean),
	);
	const toolingFiles = () =>
		toolingRoots.flatMap((root) =>
			gitText(git, ["ls-files", "-z", "--", root]).split("\0").filter(Boolean),
		);
	const toolingScope = readScope("tooling", "HEAD", toolingFiles);
	return {
		comparedWith:
			previousReportSource ?? (previous ? "previous report" : "no previous"),
		scopes: [conceptScope, toolingScope],
	};
}
