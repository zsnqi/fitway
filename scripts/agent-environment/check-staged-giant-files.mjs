import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	GIANT_FILE_MEASURE,
	isSourceFile,
} from "../../.agents/skills/gardener/code-health.mjs";
import {
	compareCodeHealth,
	formatCodeHealthChange,
	HEALTH_ROOTS,
	readCommittedCodeHealthBaseline,
	readGit,
	snapshotGiantFiles,
} from "./code-health-ratchet.mjs";

// The index holds what the commit will hold, so each file is read from it,
// never from the working tree.
export function readStagedCodeHealthFiles(root = process.cwd()) {
	const listed = readGit(root, [
		"diff",
		"--cached",
		"--name-only",
		"--diff-filter=ACMR",
		"-z",
		"--",
		...HEALTH_ROOTS,
	]);
	if (listed.status !== 0)
		throw new Error(`git diff failed: ${listed.stderr.trim()}`);
	const files = listed.stdout.split("\0").filter(isSourceFile);
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

export function checkStagedGiantFiles(root = process.cwd()) {
	const snapshot = snapshotGiantFiles(readStagedCodeHealthFiles(root));
	return compareCodeHealth(
		readCommittedCodeHealthBaseline(root),
		snapshot,
	).filter(
		(change) =>
			change.measure === GIANT_FILE_MEASURE && change.direction === "rise",
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
		console.error(`pre-commit giant-file check: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
