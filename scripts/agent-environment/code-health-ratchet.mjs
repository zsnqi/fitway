// Snapshot, compare, and enforce code-health baseline measures.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
	BASELINE_MEASURES,
	DIRECTORY_MEASURES,
	DUPLICATION_MEASURE,
	GIANT_DOCUMENT_MEASURE,
	GIANT_FILE_MEASURE,
	isMarkdownDocument,
	isSourceFile,
	isTestFile,
	scanGiantDocuments,
	scanGiantFiles,
	scanScope,
	scanSource,
} from "../../.agents/skills/gardener/code-health.mjs";
import { countDuplicationCopies } from "../../.agents/skills/gardener/code-health-duplication.mjs";

export const BASELINE_RELATIVE_PATH =
	"docs/agent-context/CODE_HEALTH_BASELINE.json";
export const BASELINE_COMMAND = "pnpm code-health:baseline";
export const CHECK_COMMAND = "pnpm check:code-health";
export const HEALTH_ROOTS = Object.freeze([
	"scripts",
	".agents/skills",
	"apps",
	"packages",
]);
const EXCEPTION_MARKER = /code-health-exception:/g;
const FILE_BASELINE_MEASURES = BASELINE_MEASURES.filter(
	(measure) =>
		!DIRECTORY_MEASURES.includes(measure) && measure !== GIANT_DOCUMENT_MEASURE,
);
const GIANT_FILE_SPLIT = [
	"  To split it: move code out by responsibility into a new module named for what it holds, and update its imports.",
	"  Never delete blank lines, comments or explanations.",
	"  Never join lines, because the formatter splits them again.",
	`  Then run ${BASELINE_COMMAND}.`,
].join("\n");
const GIANT_DOCUMENT_SPLIT = [
	"  To split it: split by section into files a reader opens one at a time.",
	"  Never delete blank lines, comments or explanations.",
	`  Then run ${BASELINE_COMMAND}.`,
].join("\n");
const CONCEPT_SOURCE_PATH = ".agents/skills/verify-fitway/concept-source.json";

function pathWithin(file, directory) {
	const normalizedFile = normalizePath(file);
	const normalizedDirectory = normalizePath(directory).replace(/\/$/, "");
	return (
		normalizedFile === normalizedDirectory ||
		normalizedFile.startsWith(`${normalizedDirectory}/`)
	);
}

export function conceptHealthFolder(root = process.cwd()) {
	const source = path.resolve(root, CONCEPT_SOURCE_PATH);
	let text;
	try {
		text = readFileSync(source, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
	let config;
	try {
		config = JSON.parse(text);
	} catch (error) {
		throw new Error(`cannot parse ${CONCEPT_SOURCE_PATH}: ${error.message}`);
	}
	if (
		typeof config?.concept !== "string" ||
		!config.concept.trim() ||
		path.isAbsolute(config.concept) ||
		normalizePath(config.concept).split("/").includes("..")
	)
		throw new Error(
			`${CONCEPT_SOURCE_PATH} must name one repository-relative concept folder`,
		);
	return normalizePath(config.concept).replace(/^\.\//, "").replace(/\/$/, "");
}

export function selectCodeHealthPath(root, file) {
	const normalizedFile = normalizePath(file);
	if (isMarkdownDocument(normalizedFile)) return true;
	if (!isSourceFile(normalizedFile)) return false;
	if (HEALTH_ROOTS.some((directory) => pathWithin(normalizedFile, directory)))
		return true;
	const concept = conceptHealthFolder(root);
	return concept !== null && pathWithin(normalizedFile, concept);
}

export function date(value = new Date()) {
	return value.toISOString().slice(0, 10);
}

function dateValue(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return Number.NaN;
	const [, year, month, day] = match.map(Number);
	const calendar = new Date(Date.UTC(year, month - 1, day));
	if (
		calendar.getUTCFullYear() !== year ||
		calendar.getUTCMonth() !== month - 1 ||
		calendar.getUTCDate() !== day
	)
		return Number.NaN;
	return Date.UTC(year, month - 1, day);
}

function addDays(value, count) {
	const result = new Date(value);
	result.setUTCDate(result.getUTCDate() + count);
	return result.toISOString().slice(0, 10);
}

export function normalizePath(file) {
	return file.replaceAll("\\", "/");
}

function parentDirectory(file) {
	return path.posix.dirname(normalizePath(file));
}

function parseExceptions(files, sources) {
	const exceptions = [];
	for (const [index, file] of files.entries()) {
		const { comments } = sources[index];
		for (const comment of comments) {
			for (const match of comment.text.matchAll(EXCEPTION_MARKER)) {
				const fields = comment.text.slice(match.index + match[0].length);
				const index = comment.offset + match.index;
				exceptions.push({
					file: normalizePath(file.file),
					line: file.text.slice(0, index).split(/\r?\n/).length,
					measure: fields.match(/^\s*([A-Za-z]+)\s*;/)?.[1] ?? "",
					until: fields.match(/\buntil=([^\s;]*)/)?.[1] ?? "",
					reason: (fields.match(/\breason=([^\r\n]*)/)?.[1] ?? "")
						.replace(/\s*(?:\*\/|-->)\s*$/, "")
						.trim(),
				});
			}
		}
	}
	return exceptions.sort(
		(left, right) =>
			left.file.localeCompare(right.file, "en") || left.line - right.line,
	);
}

function exceptionStatus(exceptions, today) {
	const invalid = [];
	const expired = [];
	const open = [];
	for (const exception of exceptions) {
		const until = dateValue(exception.until);
		const invalidDate = !Number.isFinite(until);
		const tooLate = !invalidDate && until > dateValue(addDays(today, 90));
		if (!exception.reason)
			invalid.push({
				...exception,
				detail: "exception reason is empty",
			});
		else if (
			![...BASELINE_MEASURES, GIANT_FILE_MEASURE].includes(exception.measure)
		)
			invalid.push({
				...exception,
				detail: `unknown measure ${exception.measure}`,
			});
		else if (invalidDate)
			invalid.push({
				...exception,
				detail: "exception date is invalid",
			});
		else if (tooLate)
			invalid.push({
				...exception,
				detail: "exception expires more than 90 days after today",
			});
		else if (until < dateValue(today))
			expired.push({ ...exception, detail: "exception expired" });
		else open.push(exception);
	}
	return { invalid, expired, open };
}

function excepted(exceptions, file, measure, lines, today) {
	return exceptions.some(
		(exception) =>
			exception.file === file &&
			exception.measure === measure &&
			lines.includes(exception.line) &&
			exception.until >= today,
	);
}

function addCount(counts, hits, file, measure, lines, count = 1) {
	const record = counts.get(file) ?? {};
	record[measure] = (record[measure] ?? 0) + count;
	counts.set(file, record);
	const fileHits = hits.get(file) ?? {};
	fileHits[measure] = [...(fileHits[measure] ?? []), ...lines];
	hits.set(file, fileHits);
}

function sortedHits(records) {
	return Object.fromEntries(
		[...records].map(([file, measures]) => [
			file,
			Object.fromEntries(
				Object.entries(measures).map(([measure, lines]) => [
					measure,
					[...new Set(lines)].sort((left, right) => left - right),
				]),
			),
		]),
	);
}

function addGiantCounts(
	giantHits,
	measure,
	valueKey,
	exceptions,
	today,
	counts,
	hits,
) {
	for (const hit of giantHits) {
		if (!excepted(exceptions, hit.file, measure, [1], today))
			addCount(counts, hits, hit.file, measure, [1], hit[valueKey]);
	}
}

// One scan of each source file serves the exceptions and the giant-file count.
function scanSources(files) {
	const scans = files.map((file) =>
		isSourceFile(file.file) ? scanSource(file) : null,
	);
	return {
		scans,
		exceptions: parseExceptions(
			files,
			scans.map((scan) => scan ?? { comments: [] }),
		),
	};
}

// The giant-file and giant-document counts, for snapshotCodeHealth and snapshotGiantSizes.
function addGiantSizeCounts(files, scans, exceptions, today, counts, hits) {
	addGiantCounts(
		scanGiantFiles(
			files.filter((_file, index) => scans[index]),
			scans.filter(Boolean),
		),
		GIANT_FILE_MEASURE,
		"lineCount",
		exceptions,
		today,
		counts,
		hits,
	);
	addGiantCounts(
		scanGiantDocuments(files),
		GIANT_DOCUMENT_MEASURE,
		"byteCount",
		exceptions,
		today,
		counts,
		hits,
	);
}

// The giant-file and giant-document part of snapshotCodeHealth.
export function snapshotGiantSizes(files, { today = date() } = {}) {
	const { scans, exceptions } = scanSources(files);
	const counts = new Map();
	const hits = new Map();
	addGiantSizeCounts(files, scans, exceptions, today, counts, hits);
	return { counts: Object.fromEntries(counts), hits: sortedHits(hits) };
}

function addReportCounts(report, exceptions, today, counts, hits) {
	for (const measure of FILE_BASELINE_MEASURES) {
		if (measure === DUPLICATION_MEASURE) {
			countDuplicationCopies(report[measure].hits, (_hit, place) => {
				const file = normalizePath(place.file);
				const lines = Array.from(
					{ length: place.endLine - place.line + 1 },
					(_, offset) => place.line + offset,
				);
				if (!excepted(exceptions, file, measure, lines, today))
					addCount(counts, hits, file, measure, [place.line]);
			});
		} else {
			for (const hit of report[measure].hits) {
				if (!excepted(exceptions, hit.file, measure, [hit.line], today))
					addCount(
						counts,
						hits,
						hit.file,
						measure,
						[hit.line],
						hit.lineCount ?? 1,
					);
			}
		}
	}
}

function addDirectoryReportCounts(report, directoryCounts, directoryHits) {
	for (const measure of DIRECTORY_MEASURES) {
		for (const hit of report[measure].hits) {
			addCount(
				directoryCounts,
				directoryHits,
				parentDirectory(hit.file),
				measure,
				[hit.line],
			);
		}
	}
}

export function snapshotCodeHealth(files, { today = date() } = {}) {
	const regularFiles = files.filter((file) => !file.giantOnly);
	const report = scanScope(regularFiles);
	const { scans, exceptions } = scanSources(files);
	const status = exceptionStatus(exceptions, today);
	const counts = new Map();
	const hits = new Map();
	const directoryCounts = new Map();
	const directoryHits = new Map();
	addReportCounts(report, exceptions, today, counts, hits);
	addDirectoryReportCounts(report, directoryCounts, directoryHits);
	addGiantSizeCounts(files, scans, exceptions, today, counts, hits);

	return {
		counts: Object.fromEntries(counts),
		directoryCounts: Object.fromEntries(directoryCounts),
		hits: sortedHits(hits),
		directoryHits: sortedHits(directoryHits),
		giantRoots: [
			...new Set(
				files
					.filter((file) => file.giantOnly && file.giantRoot)
					.map((file) => normalizePath(file.giantRoot)),
			),
		].sort(),
		exceptions,
		invalidExceptions: status.invalid,
		expiredExceptions: status.expired,
		openExceptions: status.open,
	};
}

function measureValue(record, measure) {
	return record?.[measure] ?? 0;
}

export function baselineFromSnapshot(snapshot) {
	const files = {};
	const directories = {};
	const paths = Object.keys(snapshot.counts).sort((left, right) =>
		left.localeCompare(right, "en"),
	);
	for (const file of paths) {
		const values = {};
		for (const measure of [
			...FILE_BASELINE_MEASURES,
			GIANT_FILE_MEASURE,
			GIANT_DOCUMENT_MEASURE,
		]) {
			const value = measureValue(snapshot.counts[file], measure);
			if (value > 0) values[measure] = value;
		}
		if (Object.keys(values).length) files[file] = values;
	}
	const directoryPaths = Object.keys(snapshot.directoryCounts ?? {}).sort(
		(left, right) => left.localeCompare(right, "en"),
	);
	for (const directory of directoryPaths) {
		const values = {};
		for (const measure of DIRECTORY_MEASURES) {
			const value = measureValue(snapshot.directoryCounts[directory], measure);
			if (value > 0) values[measure] = value;
		}
		if (Object.keys(values).length) directories[directory] = values;
	}
	return {
		version: 1,
		measures: [
			...FILE_BASELINE_MEASURES,
			GIANT_FILE_MEASURE,
			GIANT_DOCUMENT_MEASURE,
			...DIRECTORY_MEASURES,
		],
		files,
		directories,
		...(snapshot.giantRoots?.length ? { giantRoots: snapshot.giantRoots } : {}),
	};
}

function parseCodeHealthBaseline(text) {
	const value = JSON.parse(text);
	if (
		value?.version !== 1 ||
		!value.files ||
		typeof value.files !== "object" ||
		(value.directories !== undefined &&
			(typeof value.directories !== "object" || value.directories === null))
	)
		throw new Error("unsupported baseline shape");
	return value;
}

export function readCodeHealthBaseline(root = process.cwd()) {
	try {
		return parseCodeHealthBaseline(
			readFileSync(path.join(root, BASELINE_RELATIVE_PATH), "utf8"),
		);
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}

// The staged read passes its batch on stdin and takes the bytes back.
export function readGit(root, args, { input, encoding = "utf8" } = {}) {
	return spawnSync("git", ["--no-optional-locks", ...args], {
		cwd: root,
		input,
		encoding,
		windowsHide: true,
		maxBuffer: 256 * 1024 * 1024,
	});
}

// Only a repository without a commit, or a HEAD without the baseline, has no
// committed baseline; any other Git failure stops the command.
export function readCommittedCodeHealthBaseline(root = process.cwd()) {
	if (readGit(root, ["rev-parse", "--verify", "--quiet", "HEAD"]).status !== 0)
		return null;
	const listed = readGit(root, [
		"ls-tree",
		"--name-only",
		"HEAD",
		"--",
		BASELINE_RELATIVE_PATH,
	]);
	if (listed.status !== 0)
		throw new Error(`git ls-tree HEAD failed: ${listed.stderr.trim()}`);
	if (!listed.stdout.trim()) return null;
	const shown = readGit(root, ["show", `HEAD:${BASELINE_RELATIVE_PATH}`]);
	if (shown.status !== 0)
		throw new Error(
			`cannot read the committed ${BASELINE_RELATIVE_PATH}: ${shown.stderr.trim()}`,
		);
	return parseCodeHealthBaseline(shown.stdout);
}

export function readIndexedCodeHealthBaseline(root = process.cwd()) {
	const changed = readGit(root, [
		"diff",
		"--cached",
		"--name-only",
		"--",
		BASELINE_RELATIVE_PATH,
	]);
	if (changed.status !== 0)
		throw new Error(
			`git diff for the baseline failed: ${changed.stderr.trim()}`,
		);
	if (!changed.stdout.trim())
		return { baseline: readCommittedCodeHealthBaseline(root), indexed: false };
	const shown = readGit(root, ["show", `:${BASELINE_RELATIVE_PATH}`]);
	if (shown.status !== 0)
		throw new Error(
			`cannot read the indexed ${BASELINE_RELATIVE_PATH}: ${shown.stderr.trim()}`,
		);
	return {
		baseline: parseCodeHealthBaseline(shown.stdout),
		indexed: true,
	};
}

export function compareCodeHealth(baseline, snapshot) {
	const compare = (before, after, measures, hits, scope) => {
		const paths = [
			...new Set([...Object.keys(before), ...Object.keys(after)]),
		].sort((left, right) => left.localeCompare(right, "en"));
		return paths.flatMap((location) =>
			measures.flatMap((measure) => {
				const baseline = measureValue(before[location], measure);
				const current = measureValue(after[location], measure);
				if (baseline === current) return [];
				return [
					{
						[scope]: location,
						scope,
						measure,
						baseline,
						current,
						hits: hits[location]?.[measure] ?? [],
						direction: current > baseline ? "rise" : "fall",
					},
				];
			}),
		);
	};
	return [
		...compare(
			baseline?.files ?? {},
			snapshot.counts,
			[...FILE_BASELINE_MEASURES, GIANT_FILE_MEASURE, GIANT_DOCUMENT_MEASURE],
			snapshot.hits,
			"file",
		),
		...compare(
			baseline?.directories ?? {},
			snapshot.directoryCounts ?? {},
			DIRECTORY_MEASURES,
			snapshot.directoryHits ?? {},
			"directory",
		),
	];
}

function establishedMeasures(baseline) {
	if (Array.isArray(baseline?.measures)) return new Set(baseline.measures);
	return new Set(
		[
			...Object.values(baseline?.files ?? {}),
			...Object.values(baseline?.directories ?? {}),
		].flatMap((record) => Object.keys(record)),
	);
}

function directoryExcepted(snapshot, change, today) {
	return snapshot.openExceptions.some(
		(exception) =>
			exception.measure === change.measure &&
			exception.until >= today &&
			isTestFile(exception.file) &&
			parentDirectory(exception.file) === change.directory,
	);
}

export function refusedChanges(previous, snapshot, today) {
	const established = establishedMeasures(previous);
	const previousRoots = new Set(previous?.giantRoots ?? []);
	const introducedRoots = (snapshot.giantRoots ?? []).filter(
		(root) => !previousRoots.has(root),
	);
	return compareCodeHealth(previous, snapshot).filter((change) => {
		if (!established.has(change.measure)) return false;
		if (change.scope === "directory")
			return (
				change.direction === "fall" &&
				!directoryExcepted(snapshot, change, today)
			);
		if (change.direction === "fall") return false;
		return !(
			change.file &&
			introducedRoots.some((root) => pathWithin(change.file, root))
		);
	});
}

function withSplitGuidance(change, line) {
	if (change.direction !== "rise") return line;
	if (change.measure === GIANT_FILE_MEASURE)
		return `${line}\n${GIANT_FILE_SPLIT}`;
	if (change.measure === GIANT_DOCUMENT_MEASURE)
		return `${line}\n${GIANT_DOCUMENT_SPLIT}`;
	return line;
}

export function baselineFailure(changes) {
	return changes
		.map((change) =>
			withSplitGuidance(
				change,
				`${change.file ?? change.directory}: ${change.measure} baseline=${change.baseline} current=${change.current}`,
			),
		)
		.join("\n");
}

export function formatCodeHealthChange(change) {
	const location = change.file ?? change.directory;
	const hits = change.hits?.length ? `; hits: ${change.hits.join(", ")}` : "";
	return withSplitGuidance(
		change,
		`${location}: ${change.measure} baseline=${change.baseline} current=${change.current}${hits}; run ${BASELINE_COMMAND}`,
	);
}
