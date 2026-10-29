// Read, write, and evaluate the code-health baseline and its allowed exceptions.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	GIANT_DOCUMENT_MEASURE,
	GIANT_FILE_MEASURE,
	MARKDOWN_PATHSPEC,
} from "../../.agents/skills/gardener/code-health.mjs";
import { listTrackedFiles } from "../verify-repository.mjs";
import {
	BASELINE_COMMAND,
	BASELINE_RELATIVE_PATH,
	baselineFailure,
	baselineFromSnapshot,
	compareCodeHealth,
	conceptHealthFolder,
	date,
	HEALTH_ROOTS,
	normalizePath,
	pathWithin,
	readCodeHealthBaseline,
	readCommittedCodeHealthBaseline,
	refusedChanges,
	selectCodeHealthPath,
	snapshotCodeHealth,
} from "./code-health-ratchet.mjs";
import { beginToolCommand } from "./tool-contract.mjs";

export {
	BASELINE_COMMAND,
	BASELINE_RELATIVE_PATH,
	baselineFromSnapshot,
	CHECK_COMMAND,
	compareCodeHealth,
	formatCodeHealthChange,
	HEALTH_ROOTS,
	readCodeHealthBaseline,
	readCommittedCodeHealthBaseline,
	snapshotCodeHealth,
} from "./code-health-ratchet.mjs";

const ADMITTED_MEASURES = new Set([GIANT_FILE_MEASURE, GIANT_DOCUMENT_MEASURE]);

function admissionKey(file, measure) {
	return `${file}\0${measure}`;
}

function admissionFor(previous, snapshot, folder, reason, today) {
	const files = compareCodeHealth(previous, snapshot)
		.filter(
			(change) =>
				change.scope === "file" &&
				ADMITTED_MEASURES.has(change.measure) &&
				change.direction === "rise" &&
				pathWithin(change.file, folder),
		)
		.map((change) => ({
			file: change.file,
			measure: change.measure,
			old: change.baseline,
			new: change.current,
		}));
	return { folder, date: today, reason, files };
}

function namedCurrentAdmission(baseline, change, snapshot) {
	return (baseline.admissions ?? []).some(
		(admission) =>
			pathWithin(change.file, admission.folder) &&
			admission.files.some(
				(file) =>
					file.file === change.file &&
					file.measure === change.measure &&
					file.old === change.baseline &&
					file.new === change.current &&
					snapshot.counts[change.file]?.[change.measure] === change.current,
			),
	);
}

export function listCodeHealthFiles(root = process.cwd()) {
	const concept = conceptHealthFolder(root);
	const patterns = [
		...HEALTH_ROOTS,
		MARKDOWN_PATHSPEC,
		...(concept ? [concept] : []),
	];
	const files = new Set([
		...listTrackedFiles(root, patterns),
		...listTrackedFiles(root, patterns, { untracked: true }),
	]);
	return [...files]
		.filter((file) => selectCodeHealthPath(root, file))
		.map(normalizePath)
		.sort((left, right) => left.localeCompare(right, "en"));
}

export function readCodeHealthFiles(root = process.cwd()) {
	const concept = conceptHealthFolder(root);
	return listCodeHealthFiles(root).map((file) => ({
		file,
		text: readFileSync(path.join(root, file), "utf8"),
		giantOnly:
			concept !== null &&
			(normalizePath(file) === concept ||
				normalizePath(file).startsWith(`${concept}/`)),
		giantRoot: concept ?? undefined,
	}));
}

export function writeCodeHealthBaseline({
	root = process.cwd(),
	today = date(),
	admit = null,
	reason = null,
} = {}) {
	const previous = readCommittedCodeHealthBaseline(root);
	const folder = admit?.trim().replaceAll("\\", "/").replace(/\/$/, "");
	const admissionReason = reason?.trim();
	if (!folder && admissionReason) {
		throw new Error("--admit is required when --reason is given");
	}
	if (folder && !admissionReason) {
		throw new Error(`--admit ${folder} requires a non-empty --reason`);
	}
	if (folder && !previous) {
		throw new Error(
			`--admit ${folder} is not in the committed baseline giantRoots`,
		);
	}
	if (folder && !(previous.giantRoots ?? []).includes(folder)) {
		throw new Error(
			`--admit ${folder} is not in the committed baseline giantRoots`,
		);
	}
	const priorAdmission = previous?.admissions?.find(
		(admission) => admission.folder === folder,
	);
	if (priorAdmission) {
		throw new Error(
			`--admit ${folder} was already admitted on ${priorAdmission.date}: ${priorAdmission.reason}`,
		);
	}

	const snapshot = snapshotCodeHealth(readCodeHealthFiles(root), { today });
	const admission = folder
		? admissionFor(previous, snapshot, folder, admissionReason, today)
		: null;
	const admitted = new Set(
		(admission?.files ?? []).map((file) =>
			admissionKey(file.file, file.measure),
		),
	);
	const changes = previous ? compareCodeHealth(previous, snapshot) : [];
	const refused = previous
		? refusedChanges(previous, snapshot, today).filter(
				(change) =>
					!(
						change.scope === "file" &&
						admitted.has(admissionKey(change.file, change.measure))
					),
			)
		: [];
	if (refused.length) throw new Error(baselineFailure(refused));
	const baseline = baselineFromSnapshot(snapshot, {
		admissions: [
			...(previous?.admissions ?? []),
			...(admission ? [admission] : []),
		],
	});
	const target = path.join(root, BASELINE_RELATIVE_PATH);
	mkdirSync(path.dirname(target), { recursive: true });
	const text = `${JSON.stringify(baseline, null, "\t")}\n`;
	writeFileSync(target, text, "utf8");
	return { admission, baseline, changes };
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
			}).filter(
				(change) =>
					change.direction === "rise" &&
					!namedCurrentAdmission(baseline, change, snapshot),
			)
		: [];
	return {
		changes: compareCodeHealth(baseline, snapshot),
		inflation,
		invalidExceptions: snapshot.invalidExceptions,
		expiredExceptions: snapshot.expiredExceptions,
		openExceptions: snapshot.openExceptions,
	};
}

export function codeHealthBaselineOptions(parsed) {
	return {
		admit: parsed.options.admit ?? null,
		reason: parsed.options.reason ?? null,
	};
}

export function runCodeHealthBaseline(options = {}) {
	const result = writeCodeHealthBaseline(options);
	console.log(
		`${BASELINE_COMMAND}: wrote ${Object.keys(result.baseline.files).length} files`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
	try {
		const parsed = beginToolCommand(
			"code-health:baseline",
			process.argv.slice(2),
		);
		runCodeHealthBaseline(codeHealthBaselineOptions(parsed));
	} catch (error) {
		console.error(`${BASELINE_COMMAND}: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
