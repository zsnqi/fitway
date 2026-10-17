import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	BASELINE_MEASURES,
	DUPLICATION_MEASURE,
	GIANT_FILE_MEASURE,
	isSourceFile,
	scanScope,
	scanSource,
} from "../../.agents/skills/gardener/code-health.mjs";
import { countDuplicationCopies } from "../../.agents/skills/gardener/code-health-duplication.mjs";
import { listTrackedFiles } from "../verify-repository.mjs";

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

function duplicationCopyLines(hit, place, text) {
	if (!text || !Number.isInteger(hit.lineCount) || hit.lineCount < 1)
		return [place.line];
	const lines = [];
	const source = text.split(/\r?\n/);
	let index = place.line - 1;
	while (index > 0 && source[index - 1].includes("code-health-exception:")) {
		index--;
		lines.push(index + 1);
	}
	let codeLines = 0;
	for (; index < source.length && codeLines < hit.lineCount; index++) {
		const line = source[index];
		if (line.includes("code-health-exception:")) lines.push(index + 1);
		else if (line.trim()) {
			lines.push(index + 1);
			codeLines++;
		}
	}
	while (
		index < source.length &&
		source[index].includes("code-health-exception:")
	) {
		lines.push(++index);
	}
	return lines.length ? lines : [place.line];
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

export function snapshotCodeHealth(files, { today = date() } = {}) {
	const report = scanScope(files);
	const exceptions = parseExceptions(files);
	const status = exceptionStatus(exceptions, today);
	const counts = new Map();
	const hits = new Map();

	for (const measure of BASELINE_MEASURES) {
		if (measure === DUPLICATION_MEASURE) {
			const sources = new Map(
				files.map(({ file, text }) => [normalizePath(file), text]),
			);
			countDuplicationCopies(report[measure].hits, (hit, place) => {
				const file = normalizePath(place.file);
				const lines = duplicationCopyLines(hit, place, sources.get(file));
				if (!excepted(exceptions, file, measure, lines, today))
					addCount(counts, hits, file, measure, [place.line]);
			});
		} else {
			for (const hit of report[measure].hits) {
				if (!excepted(exceptions, hit.file, measure, [hit.line], today))
					addCount(counts, hits, hit.file, measure, [hit.line]);
			}
		}
	}

	for (const hit of report[GIANT_FILE_MEASURE].hits) {
		if (!excepted(exceptions, hit.file, GIANT_FILE_MEASURE, [1], today))
			addCount(counts, hits, hit.file, GIANT_FILE_MEASURE, [1], hit.lineCount);
	}

	return {
		counts: Object.fromEntries(counts),
		hits: Object.fromEntries(
			[...hits].map(([file, measures]) => [
				file,
				Object.fromEntries(
					Object.entries(measures).map(([measure, lines]) => [
						measure,
						[...new Set(lines)].sort((left, right) => left - right),
					]),
				),
			]),
		),
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
	const paths = Object.keys(snapshot.counts).sort((left, right) =>
		left.localeCompare(right, "en"),
	);
	for (const file of paths) {
		const values = {};
		for (const measure of [...BASELINE_MEASURES, GIANT_FILE_MEASURE]) {
			const value = measureValue(snapshot.counts[file], measure);
			if (value > 0) values[measure] = value;
		}
		if (Object.keys(values).length) files[file] = values;
	}
	return { version: 1, files };
}

function parseCodeHealthBaseline(text) {
	const value = JSON.parse(text);
	if (value?.version !== 1 || !value.files || typeof value.files !== "object")
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

export function readCommittedCodeHealthBaseline(root = process.cwd()) {
	const result = spawnSync(
		"git",
		["--no-optional-locks", "show", `HEAD:${BASELINE_RELATIVE_PATH}`],
		{
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
			maxBuffer: 32 * 1024 * 1024,
		},
	);
	return result.status === 0 ? parseCodeHealthBaseline(result.stdout) : null;
}

export function compareCodeHealth(baseline, snapshot) {
	const beforeFiles = baseline?.files ?? {};
	const afterFiles = snapshot.counts;
	const paths = [
		...new Set([...Object.keys(beforeFiles), ...Object.keys(afterFiles)]),
	].sort((left, right) => left.localeCompare(right, "en"));
	const changes = [];
	for (const file of paths) {
		for (const measure of [...BASELINE_MEASURES, GIANT_FILE_MEASURE]) {
			const before = measureValue(beforeFiles[file], measure);
			const after = measureValue(afterFiles[file], measure);
			if (before === after) continue;
			changes.push({
				file,
				measure,
				baseline: before,
				current: after,
				hits: snapshot.hits[file]?.[measure] ?? [],
				direction: after > before ? "rise" : "fall",
			});
		}
	}
	return changes;
}

export function writeCodeHealthBaseline({
	root = process.cwd(),
	today = date(),
} = {}) {
	const snapshot = snapshotCodeHealth(readCodeHealthFiles(root), { today });
	const baseline = baselineFromSnapshot(snapshot);
	const previous = readCommittedCodeHealthBaseline(root);
	const changes = previous ? compareCodeHealth(previous, snapshot) : [];
	const rises = changes.filter((change) => change.direction === "rise");
	if (rises.length)
		throw new Error(
			rises
				.map(
					(change) =>
						`${change.file}: ${change.measure} baseline=${change.baseline} current=${change.current}`,
				)
				.join("\n"),
		);
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
				hits: {},
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
	const hits = change.hits.length ? `; hits: ${change.hits.join(", ")}` : "";
	return `${change.file}: ${change.measure} baseline=${change.baseline} current=${change.current}${hits}; run ${BASELINE_COMMAND}`;
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
		runCodeHealthBaseline();
	} catch (error) {
		console.error(`${BASELINE_COMMAND}: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
