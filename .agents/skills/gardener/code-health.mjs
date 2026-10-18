import path from "node:path";
import ts from "typescript";
import {
	countDuplicationCopies,
	scanDuplication,
} from "./code-health-duplication.mjs";
import {
	isSourceFile,
	isTestFile,
	SCRIPT_EXTENSIONS,
	scanSource,
} from "./code-health-source.mjs";

export { isSourceFile, isTestFile, SCRIPT_EXTENSIONS, scanSource };

const MEASURE_DEFINITIONS = [
	{ name: "giantFiles", baseline: true, lineCount: true },
	{ name: "typeEscapes", baseline: true, baselineOrder: 1 },
	{ name: "suppressions", baseline: true, baselineOrder: 2 },
	{ name: "repeatedWorkarounds", baseline: true, baselineOrder: 3 },
	{ name: "longFunctions", baseline: true, baselineOrder: 4 },
	{ name: "longFunctionLines", baseline: true, baselineOrder: 5 },
	{ name: "emptyBlocks", baseline: true, baselineOrder: 6 },
	{
		name: "testCases",
		baseline: true,
		baselineOrder: 7,
		directory: true,
	},
	{
		name: "expectCalls",
		baseline: true,
		baselineOrder: 8,
		directory: true,
	},
	{ name: "accessibilityOverrides" },
	{
		name: "duplication",
		baseline: true,
		baselineOrder: 0,
		duplication: true,
	},
	{ name: "boundaryBreaks" },
];

export const MEASURES = Object.freeze(
	MEASURE_DEFINITIONS.map(({ name }) => name),
);
export const BASELINE_MEASURES = Object.freeze(
	MEASURE_DEFINITIONS.filter(
		({ baseline, lineCount }) => baseline && !lineCount,
	)
		.sort((left, right) => left.baselineOrder - right.baselineOrder)
		.map(({ name }) => name),
);
export const DIRECTORY_MEASURES = Object.freeze(
	MEASURE_DEFINITIONS.filter(({ directory }) => directory)
		.sort((left, right) => left.baselineOrder - right.baselineOrder)
		.map(({ name }) => name),
);
export const GIANT_FILE_MEASURE = MEASURE_DEFINITIONS.find(
	({ lineCount }) => lineCount,
).name;
export const DUPLICATION_MEASURE = MEASURE_DEFINITIONS.find(
	({ duplication }) => duplication,
).name;
const IMPORT_EXTENSIONS = [...SCRIPT_EXTENSIONS, ".css"];

function hit(file, line, detail) {
	return { file, line, detail };
}

function slashPath(file) {
	return file.replaceAll("\\", "/");
}

function assetReference(value) {
	const reference = value.trim().split(/[?#]/, 1)[0];
	if (
		!reference ||
		reference.startsWith("/") ||
		reference.startsWith("//") ||
		/^[a-z][a-z\d+.-]*:/i.test(reference)
	)
		return null;
	try {
		return decodeURIComponent(reference.replaceAll("\\", "/"));
	} catch {
		return reference.replaceAll("\\", "/");
	}
}

function htmlLinkedReferences(text) {
	const references = [];
	let index = 0;
	while (index < text.length) {
		if (text.startsWith("<!--", index)) {
			index = text.indexOf("-->", index + 4);
			index = index < 0 ? text.length : index + 3;
			continue;
		}
		if (text[index] !== "<") {
			index++;
			continue;
		}
		let cursor = index + 1;
		let quote = null;
		for (; cursor < text.length; cursor++) {
			const character = text[cursor];
			if (quote) {
				if (character === quote && text[cursor - 1] !== "\\") quote = null;
			} else if (character === '"' || character === "'") quote = character;
			else if (character === ">") break;
		}
		if (cursor >= text.length) break;
		const tag = text.slice(index, cursor + 1);
		const name = tag.match(/^<\s*(script|link)\b/i)?.[1]?.toLowerCase();
		if (name === "script") {
			const source = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
			if (source) references.push(source);
			else {
				const close = text.indexOf("</script", cursor + 1);
				if (close >= 0) {
					const end = text.indexOf(">", close + 8);
					index = end < 0 ? text.length : end + 1;
					continue;
				}
			}
		} else if (name === "link") {
			const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
			const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
			if (href && rel.split(/\s+/).includes("stylesheet"))
				references.push(href);
		}
		index = cursor + 1;
	}
	return references;
}

function cssLinkedReferences(text) {
	const references = [];
	let index = 0;
	while (index < text.length) {
		if (text.startsWith("/*", index)) {
			index = text.indexOf("*/", index + 2);
			index = index < 0 ? text.length : index + 2;
			continue;
		}
		if (text[index] === '"' || text[index] === "'") {
			const quote = text[index++];
			while (
				index < text.length &&
				(text[index] !== quote || text[index - 1] === "\\")
			)
				index++;
			index++;
			continue;
		}
		if (
			!text.startsWith("@import", index) ||
			/[\w-]/.test(text[index - 1] ?? "")
		) {
			index++;
			continue;
		}
		index += 7;
		while (/\s/.test(text[index] ?? "")) index++;
		if (text.startsWith("url", index)) {
			index += 3;
			while (/\s/.test(text[index] ?? "")) index++;
			if (text[index] === "(") index++;
			while (/\s/.test(text[index] ?? "")) index++;
		}
		const quote =
			text[index] === '"' || text[index] === "'" ? text[index++] : null;
		const start = index;
		while (
			index < text.length &&
			(quote ? text[index] !== quote : !/[\s);]/.test(text[index]))
		)
			index++;
		if (index > start) references.push(text.slice(start, index));
	}
	return references;
}

function javascriptLinkedReferences(text, extension) {
	const source = ts.createSourceFile(
		`source${extension}`,
		text,
		ts.ScriptTarget.Latest,
		true,
	);
	const references = [];
	const visit = (node) => {
		if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
			if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))
				references.push(node.moduleSpecifier.text);
		} else if (
			ts.isCallExpression(node) &&
			node.expression.kind === ts.SyntaxKind.ImportKeyword
		) {
			const [argument] = node.arguments;
			if (argument && ts.isStringLiteral(argument))
				references.push(argument.text);
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
	return references;
}

export function linkedReferences(text, extension) {
	if (extension === ".html") {
		return htmlLinkedReferences(text);
	}
	if (extension === ".css") return cssLinkedReferences(text);
	if (
		extension === ".js" ||
		extension === ".mjs" ||
		extension === ".cjs" ||
		extension === ".ts" ||
		extension === ".tsx"
	) {
		return javascriptLinkedReferences(text, extension);
	}
	return [];
}

export function resolveLinkedFile(importer, reference, filesByPath) {
	const value = assetReference(reference);
	if (!value) return null;
	const candidate = path.posix.normalize(
		path.posix.join(path.posix.dirname(slashPath(importer)), value),
	);
	const candidates = [candidate];
	if (!path.posix.extname(candidate))
		for (const extension of IMPORT_EXTENSIONS)
			candidates.push(`${candidate}${extension}`);
	for (const resolved of candidates)
		if (filesByPath.has(resolved)) return filesByPath.get(resolved);
	return null;
}

function isSpecimenPage(file, specimenPages) {
	const normalized = slashPath(file);
	const base = path.posix.basename(normalized);
	return specimenPages.some((page) => {
		const normalizedPage = slashPath(page);
		return (
			normalized === normalizedPage ||
			base === path.posix.basename(normalizedPage)
		);
	});
}

export function deriveSharedFiles(files, { specimenPages = [] } = {}) {
	const filesByPath = new Map(
		files.map((item) => [slashPath(item.file), item]),
	);
	const pages = files.filter(
		(item) =>
			path.posix.extname(slashPath(item.file)).toLowerCase() === ".html" &&
			!isSpecimenPage(item.file, specimenPages),
	);
	const loadedBy = new Map();
	for (const page of pages) {
		const visited = new Set();
		const visit = (item) => {
			if (!item || visited.has(item.file)) return;
			visited.add(item.file);
			const origins = loadedBy.get(item.file) ?? new Set();
			origins.add(page.file);
			loadedBy.set(item.file, origins);
			const extension = path.posix.extname(slashPath(item.file)).toLowerCase();
			for (const reference of linkedReferences(item.text, extension))
				visit(resolveLinkedFile(item.file, reference, filesByPath));
		};
		for (const reference of linkedReferences(page.text, ".html"))
			visit(resolveLinkedFile(page.file, reference, filesByPath));
	}
	return [...loadedBy.entries()]
		.filter(([, origins]) => origins.size > 1)
		.map(([file]) => filesByPath.get(slashPath(file)).file)
		.sort();
}

function scanGiantFiles(files, source) {
	return files.flatMap((item, index) => {
		const count = source[index].codeLines;
		return isSourceFile(item.file) && count > 800
			? [{ ...hit(item.file, 1, `${count} code lines`), lineCount: count }]
			: [];
	});
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
	const shared = new Set(sharedFiles.map(slashPath));
	for (const item of files) {
		if (!shared.has(slashPath(item.file))) continue;
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
	const source = files.map((file) => scanSource(file));
	const measures = {
		giantFiles: scanGiantFiles(files, source),
		typeEscapes: source.flatMap((item) => item.typeEscapes),
		suppressions: source.flatMap((item) => item.suppressions),
		repeatedWorkarounds: source.flatMap((item) => item.repeatedWorkarounds),
		longFunctions: source.flatMap((item) => item.longFunctions),
		longFunctionLines: source.flatMap((item) => item.longFunctionLines),
		emptyBlocks: source.flatMap((item) => item.emptyBlocks),
		testCases: source.flatMap((item) => item.testCases),
		expectCalls: source.flatMap((item) => item.expectCalls),
		accessibilityOverrides: source.flatMap(
			(item) => item.accessibilityOverrides,
		),
		duplication: scanDuplication(files),
		boundaryBreaks: scanBoundaryBreaks(files, sharedFiles),
	};
	return Object.fromEntries(
		MEASURES.map((name) => [
			name,
			{
				total:
					name === DUPLICATION_MEASURE
						? countDuplicationCopies(measures[name])
						: name === "longFunctionLines"
							? measures[name].reduce(
									(total, item) => total + item.lineCount,
									0,
								)
							: measures[name].length,
				hits: measures[name],
			},
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
	if (!match) {
		const section = text.match(
			/^## Code health\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m,
		)?.[1];
		if (!section) return null;
		const scopes = [];
		for (const scope of section.matchAll(
			/^### (\w+) \((?:ok|unknown)\)\r?\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm,
		)) {
			const measures = {};
			const baselineKey = scope[2].match(/^Baseline: (.+)$/m)?.[1];
			for (const value of scope[2].matchAll(/^- (\w+): (\d+|unknown)\b/gm)) {
				measures[value[1]] = {
					total: value[2] === "unknown" ? null : Number(value[2]),
				};
			}
			scopes.push({
				name: scope[1],
				...(baselineKey ? { baselineKey: JSON.parse(baselineKey) } : {}),
				measures,
			});
		}
		return { scopes };
	}
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
	const baselineChanged =
		scope.name === "concept" &&
		scope.baselineKey &&
		(!previous || previous.baselineKey !== scope.baselineKey);
	if (baselineChanged) {
		scope.measures.boundaryBreaks.previous = null;
		scope.measures.boundaryBreaks.trend = "starts new baseline";
	}
	return scope;
}

function gitText(git, args, options) {
	return git(args, undefined, options);
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
			const files = listed.filter(isSourceFile).map((file) => ({
				file,
				text: gitText(git, ["show", `${source}:${file}`], {
					trimEnd: false,
				}),
			}));
			const sharedFiles =
				name === "concept"
					? deriveSharedFiles(files, {
							specimenPages: concept.specimenPages ?? [],
						})
					: [];
			return addTrends(
				{
					name,
					status: "ok",
					source,
					baselineKey:
						name === "concept"
							? `concept-page-loads-v1:${sharedFiles.join("|")}`
							: "tooling-files-v1",
					...(name === "concept" ? { sharedFiles } : {}),
					measures: scanScope(files, {
						sharedFiles,
					}),
				},
				previous?.scopes?.find((item) => item.name === name),
			);
		} catch (error) {
			return addTrends(
				unknownScope(name, error.message, source),
				previous?.scopes?.find((item) => item.name === name),
			);
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
