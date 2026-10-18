import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { isSourceFile } from "../../.agents/skills/gardener/code-health.mjs";
import { listTrackedFiles } from "../verify-repository.mjs";
import {
	BASELINE_COMMAND,
	BASELINE_RELATIVE_PATH,
	baselineFailure,
	baselineFromSnapshot,
	compareCodeHealth,
	date,
	HEALTH_ROOTS,
	normalizePath,
	readCodeHealthBaseline,
	readCommittedCodeHealthBaseline,
	refusedChanges,
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
