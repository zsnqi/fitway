import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	BASELINE_MEASURES,
	DIRECTORY_MEASURES,
	DUPLICATION_MEASURE,
	GIANT_FILE_MEASURE,
	isSourceFile,
	isTestFile,
	scanScope,
	scanSource,
} from "../../.agents/skills/gardener/code-health.mjs";
import { countDuplicationCopies } from "../../.agents/skills/gardener/code-health-duplication.mjs";
import { listTrackedFiles } from "../verify-repository.mjs";
import { beginToolCommand } from "./tool-contract.mjs";

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
	(measure) => !DIRECTORY_MEASURES.includes(measure),
);

function date(value = new Date()) {
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

function normalizePath(file) {
	return file.replaceAll("\\", "/");
}

function parentDirectory(file) {
	return path.posix.dirname(normalizePath(file));
}

export function listCodeHealthFiles(root = process.cwd()) {
	const files = new Set([
		...listTrackedFiles(root, HEALTH_ROOTS),
		...listTrackedFiles(root, HEALTH_ROOTS, { untracked: true }),
	]);
	return [...files]
		.filter(isSourceFile)
		.map(normalizePath)
		.sort((left, right) => left.localeCompare(right, "en"));
}

export function readCodeHealthFiles(root = process.cwd()) {
	return listCodeHealthFiles(root).map((file) => ({
		file,
		text: readFileSync(path.join(root, file), "utf8"),
	}));
}

function parseExceptions(files) {
	const exceptions = [];
	for (const file of files) {
		const { comments } = scanSource(file);
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

export function snapshotCodeHealth(files, { today = date() } = {}) {
	const report = scanScope(files);
	const exceptions = parseExceptions(files);
	const status = exceptionStatus(exceptions, today);
	const counts = new Map();
	const hits = new Map();
	const directoryCounts = new Map();
	const directoryHits = new Map();

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

	for (const hit of report[GIANT_FILE_MEASURE].hits) {
		if (!excepted(exceptions, hit.file, GIANT_FILE_MEASURE, [1], today))
			addCount(counts, hits, hit.file, GIANT_FILE_MEASURE, [1], hit.lineCount);
	}

	return {
		counts: Object.fromEntries(counts),
		directoryCounts: Object.fromEntries(directoryCounts),
		hits: sortedHits(hits),
		directoryHits: sortedHits(directoryHits),
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
		for (const measure of [...FILE_BASELINE_MEASURES, GIANT_FILE_MEASURE]) {
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
			...DIRECTORY_MEASURES,
		],
		files,
		directories,
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

function readGit(root, args) {
	return spawnSync("git", ["--no-optional-locks", ...args], {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
		maxBuffer: 32 * 1024 * 1024,
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
			[...FILE_BASELINE_MEASURES, GIANT_FILE_MEASURE],
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

function refusedChanges(previous, snapshot, today) {
	const established = establishedMeasures(previous);
	return compareCodeHealth(previous, snapshot).filter((change) => {
		if (!established.has(change.measure)) return false;
		if (change.scope === "directory")
			return (
				change.direction === "fall" &&
				!directoryExcepted(snapshot, change, today)
			);
		return change.direction === "rise";
	});
}

function baselineFailure(changes) {
	return changes
		.map(
			(change) =>
				`${change.file ?? change.directory}: ${change.measure} baseline=${change.baseline} current=${change.current}`,
		)
		.join("\n");
}

export function writeCodeHealthBaseline({
	root = process.cwd(),
	today = date(),
} = {}) {
	const snapshot = snapshotCodeHealth(readCodeHealthFiles(root), { today });
	const baseline = baselineFromSnapshot(snapshot);
	const previous = readCommittedCodeHealthBaseline(root);
	const changes = previous ? compareCodeHealth(previous, snapshot) : [];
	const refused = previous ? refusedChanges(previous, snapshot, today) : [];
	if (refused.length) throw new Error(baselineFailure(refused));
	const target = path.join(root, BASELINE_RELATIVE_PATH);
	mkdirSync(path.dirname(target), { recursive: true });
	const text = `${JSON.stringify(baseline, null, "\t")}\n`;
	writeFileSync(target, text, "utf8");
	return { baseline, changes };
}

export function checkCodeHealth({ root = process.cwd(), today = date() } = {}) {
	const baseline = readCodeHealthBaseline(root);
	if (!baseline)
		throw new Error(
			`${BASELINE_RELATIVE_PATH} is missing; run ${BASELINE_COMMAND}`,
		);
	const snapshot = snapshotCodeHealth(readCodeHealthFiles(root), { today });
	const committed = readCommittedCodeHealthBaseline(root);
	const inflation = committed
		? compareCodeHealth(committed, {
				counts: baseline.files,
				directoryCounts: baseline.directories ?? {},
				hits: {},
				directoryHits: {},
			}).filter((change) => change.direction === "rise")
		: [];
	return {
		changes: compareCodeHealth(baseline, snapshot),
		inflation,
		invalidExceptions: snapshot.invalidExceptions,
		expiredExceptions: snapshot.expiredExceptions,
		openExceptions: snapshot.openExceptions,
	};
}

export function formatCodeHealthChange(change) {
	const location = change.file ?? change.directory;
	const hits = change.hits?.length ? `; hits: ${change.hits.join(", ")}` : "";
	return `${location}: ${change.measure} baseline=${change.baseline} current=${change.current}${hits}; run ${BASELINE_COMMAND}`;
}

export function runCodeHealthBaseline() {
	const result = writeCodeHealthBaseline();
	console.log(
		`${BASELINE_COMMAND}: wrote ${Object.keys(result.baseline.files).length} files`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
	try {
		beginToolCommand("code-health:baseline", process.argv.slice(2));
		runCodeHealthBaseline();
	} catch (error) {
		console.error(`${BASELINE_COMMAND}: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
