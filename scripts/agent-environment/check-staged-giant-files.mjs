// Lock staged giant-file and giant-document falls into the indexed baseline.
import { writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	GIANT_DOCUMENT_MEASURE,
	GIANT_FILE_MEASURE,
} from "../../.agents/skills/gardener/code-health.mjs";
import {
	BASELINE_RELATIVE_PATH,
	compareCodeHealth,
	formatCodeHealthChange,
	readGit,
	readIndexedCodeHealthBaseline,
	selectCodeHealthPath,
	snapshotGiantSizes,
} from "./code-health-ratchet.mjs";

const GIANT_MEASURES = [GIANT_FILE_MEASURE, GIANT_DOCUMENT_MEASURE];

export function readIndexFiles(root, files) {
	if (!files.length) return [];
	const batch = readGit(root, ["cat-file", "--batch"], {
		input: Buffer.from(files.map((file) => `:${file}\n`).join("")),
		encoding: "buffer",
	});
	if (batch.status !== 0)
		throw new Error(`git cat-file failed: ${String(batch.stderr).trim()}`);
	const output = batch.stdout;
	let offset = 0;
	return files.map((file) => {
		const header = output.indexOf(10, offset);
		const size = Number(output.toString("utf8", offset, header).split(" ")[2]);
		const start = header + 1;
		offset = start + size + 1;
		return { file, text: output.toString("utf8", start, start + size) };
	});
}

function selectedIndexFiles(root, output) {
	return output
		.split("\0")
		.filter(Boolean)
		.filter((file) => selectCodeHealthPath(root, file));
}

function parseStagedChanges(output) {
	const fields = output.split("\0");
	if (fields.at(-1) === "") fields.pop();
	const changes = [];
	for (let index = 0; index < fields.length; ) {
		const status = fields[index++];
		const kind = status[0];
		if (kind === "R") {
			changes.push({
				kind,
				oldPath: fields[index++],
				path: fields[index++],
			});
		} else {
			changes.push({ kind, oldPath: null, path: fields[index++] });
		}
	}
	return changes;
}

export function readStagedCodeHealthChanges(root = process.cwd()) {
	const listed = readGit(root, [
		"diff",
		"--cached",
		"--name-status",
		"--find-renames",
		"-z",
	]);
	if (listed.status !== 0)
		throw new Error(`git diff failed: ${listed.stderr.trim()}`);
	return parseStagedChanges(listed.stdout)
		.map((change) => {
			if (change.kind === "D")
				return {
					...change,
					oldPath: selectCodeHealthPath(root, change.path) ? change.path : null,
					path: null,
				};
			const oldPath = change.oldPath
				? selectCodeHealthPath(root, change.oldPath)
					? change.oldPath
					: null
				: null;
			const file = selectCodeHealthPath(root, change.path) ? change.path : null;
			return { ...change, oldPath, path: file };
		})
		.filter((change) => change.oldPath || change.path);
}

// The index holds what the commit will hold, so each file is read from it,
// never from the working tree.
export function readStagedCodeHealthFiles(root = process.cwd()) {
	const files = readStagedCodeHealthChanges(root)
		.map((change) => change.path)
		.filter(Boolean);
	return readIndexFiles(root, [...new Set(files)]);
}

function readAllIndexedCodeHealthFiles(root = process.cwd()) {
	const listed = readGit(root, ["ls-files", "-z"]);
	if (listed.status !== 0)
		throw new Error(`git ls-files failed: ${listed.stderr.trim()}`);
	return readIndexFiles(root, selectedIndexFiles(root, listed.stdout));
}

function touchedGiantChanges(baseline, snapshot, paths) {
	return [...new Set(paths)]
		.sort((left, right) => left.localeCompare(right, "en"))
		.flatMap((file) =>
			GIANT_MEASURES.flatMap((measure) => {
				const before = baseline?.files?.[file]?.[measure] ?? 0;
				const current = snapshot.counts[file]?.[measure] ?? 0;
				if (before === current) return [];
				return [
					{
						file,
						measure,
						baseline: before,
						current,
						hits: snapshot.hits[file]?.[measure] ?? [],
						direction: current > before ? "rise" : "fall",
					},
				];
			}),
		);
}

function setGiantValue(baseline, change) {
	const record = baseline.files[change.file] ?? {};
	if (change.current) record[change.measure] = change.current;
	else delete record[change.measure];
	if (Object.keys(record).length) baseline.files[change.file] = record;
	else delete baseline.files[change.file];
}

function updateForRenameTargets(changes, renameSources) {
	const failures = [];
	const updates = [];
	for (const change of changes) {
		const oldPath = renameSources.get(change.file);
		if (!oldPath) {
			if (change.direction === "rise") failures.push(change);
			else updates.push(change);
			continue;
		}
		const movedFrom = {
			...change,
			baseline:
				changes.find(
					(candidate) =>
						candidate.file === oldPath && candidate.measure === change.measure,
				)?.baseline ?? 0,
		};
		if (change.current > movedFrom.baseline) failures.push(movedFrom);
		else updates.push(movedFrom);
	}
	return { failures, updates };
}

export function updateStagedCodeHealthBaseline(root = process.cwd()) {
	const indexedBaseline = readIndexedCodeHealthBaseline(root);
	if (indexedBaseline.indexed) {
		const snapshot = snapshotGiantSizes(readAllIndexedCodeHealthFiles(root));
		return {
			changes: compareCodeHealth(indexedBaseline.baseline, snapshot).filter(
				(change) => GIANT_MEASURES.includes(change.measure),
			),
			updates: [],
		};
	}

	const staged = readStagedCodeHealthChanges(root);
	const snapshot = snapshotGiantSizes(readStagedCodeHealthFiles(root));
	const paths = staged.flatMap((change) =>
		[change.oldPath, change.path].filter(Boolean),
	);
	const changes = touchedGiantChanges(
		indexedBaseline.baseline,
		snapshot,
		paths,
	);
	const deletions = new Set(
		staged
			.filter((change) => change.kind === "D" || change.kind === "R")
			.map((change) => change.oldPath)
			.filter(Boolean),
	);
	const renameSources = new Map(
		staged
			.filter((change) => change.kind === "R" && change.oldPath && change.path)
			.map((change) => [change.path, change.oldPath]),
	);
	const { failures, updates } = updateForRenameTargets(changes, renameSources);
	if (failures.length || !indexedBaseline.baseline) {
		return { changes: failures, updates: [] };
	}

	const baseline = structuredClone(indexedBaseline.baseline);
	for (const file of deletions) delete baseline.files[file];
	for (const change of updates) {
		if (deletions.has(change.file)) continue;
		setGiantValue(baseline, change);
	}
	if (updates.length) {
		writeFileSync(
			path.join(root, BASELINE_RELATIVE_PATH),
			`${JSON.stringify(baseline, null, "\t")}\n`,
			"utf8",
		);
		const added = readGit(root, ["add", "--", BASELINE_RELATIVE_PATH]);
		if (added.status !== 0)
			throw new Error(
				`cannot stage the baseline update: ${added.stderr.trim()}`,
			);
	}
	return { changes: failures, updates };
}

export function checkStagedGiantFiles(root = process.cwd()) {
	return updateStagedCodeHealthBaseline(root).changes;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		const { changes, updates } = updateStagedCodeHealthBaseline();
		for (const change of updates)
			console.log(
				`${change.file}: ${change.measure} baseline=${change.baseline} current=${change.current}; updated ${BASELINE_RELATIVE_PATH}`,
			);
		for (const change of changes) console.log(formatCodeHealthChange(change));
		if (changes.length) process.exitCode = 1;
	} catch (error) {
		console.error(`pre-commit giant-content check: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
