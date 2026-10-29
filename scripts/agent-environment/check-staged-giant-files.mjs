// Check staged giant-file and giant-document growth against the indexed baseline.
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	GIANT_DOCUMENT_MEASURE,
	GIANT_FILE_MEASURE,
} from "../../.agents/skills/gardener/code-health.mjs";
import {
	compareCodeHealth,
	formatCodeHealthChange,
	readGit,
	readIndexedCodeHealthBaseline,
	selectCodeHealthPath,
	snapshotGiantSizes,
} from "./code-health-ratchet.mjs";

function readIndexFiles(root, files) {
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

// The index holds what the commit will hold, so each file is read from it,
// never from the working tree.
export function readStagedCodeHealthFiles(root = process.cwd()) {
	const listed = readGit(root, [
		"diff",
		"--cached",
		"--name-only",
		"--diff-filter=ACMR",
		"-z",
	]);
	if (listed.status !== 0)
		throw new Error(`git diff failed: ${listed.stderr.trim()}`);
	return readIndexFiles(root, selectedIndexFiles(root, listed.stdout));
}

function readAllIndexedCodeHealthFiles(root = process.cwd()) {
	const listed = readGit(root, ["ls-files", "-z"]);
	if (listed.status !== 0)
		throw new Error(`git ls-files failed: ${listed.stderr.trim()}`);
	return readIndexFiles(root, selectedIndexFiles(root, listed.stdout));
}

export function checkStagedGiantFiles(root = process.cwd()) {
	const indexedBaseline = readIndexedCodeHealthBaseline(root);
	const files = indexedBaseline.indexed
		? readAllIndexedCodeHealthFiles(root)
		: readStagedCodeHealthFiles(root);
	const snapshot = snapshotGiantSizes(files);
	return compareCodeHealth(indexedBaseline.baseline, snapshot).filter(
		(change) =>
			[GIANT_FILE_MEASURE, GIANT_DOCUMENT_MEASURE].includes(change.measure) &&
			(indexedBaseline.indexed || change.direction === "rise"),
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		const rises = checkStagedGiantFiles();
		for (const change of rises) console.log(formatCodeHealthChange(change));
		if (rises.length) process.exitCode = 1;
	} catch (error) {
		console.error(`pre-commit giant-content check: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
