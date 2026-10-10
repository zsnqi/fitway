import path from "node:path";
import { scanDuplication } from "./code-health-duplication.mjs";
import { scanSource } from "./code-health-source.mjs";

export const MEASURES = [
	"giantFiles",
	"typeEscapes",
	"suppressions",
	"repeatedWorkarounds",
	"accessibilityOverrides",
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

function scanGiantFiles(files) {
	return files
		.filter((item) => sourceFile(item.file))
		.flatMap((item) => {
			const count = lines(item.text).length;
			return count > 800 ? [hit(item.file, 1, `${count} lines`)] : [];
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
	const source = files.map(scanSource);
	const measures = {
		giantFiles: scanGiantFiles(files),
		typeEscapes: source.flatMap((item) => item.typeEscapes),
		suppressions: source.flatMap((item) => item.suppressions),
		repeatedWorkarounds: source.flatMap((item) => item.repeatedWorkarounds),
		accessibilityOverrides: source.flatMap(
			(item) => item.accessibilityOverrides,
		),
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
			for (const value of scope[2].matchAll(/^- (\w+): (\d+|unknown)\b/gm)) {
				measures[value[1]] = {
					total: value[2] === "unknown" ? null : Number(value[2]),
				};
			}
			scopes.push({ name: scope[1], measures });
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
