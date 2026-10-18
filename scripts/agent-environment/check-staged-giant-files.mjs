import { spawnSync } from "node:child_process";
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
	snapshotGiantFiles,
} from "./code-health-ratchet.mjs";

function git(root, args, input) {
	const result = spawnSync("git", ["--no-optional-locks", ...args], {
		cwd: root,
		input,
		windowsHide: true,
		maxBuffer: 256 * 1024 * 1024,
	});
	if (result.status !== 0)
		throw new Error(`git ${args[0]} failed: ${String(result.stderr).trim()}`);
	return result.stdout;
}

// The index holds what the commit will hold, so each file is read from it,
// never from the working tree.
export function readStagedCodeHealthFiles(root = process.cwd()) {
	const files = git(root, [
		"diff",
		"--cached",
		"--name-only",
		"--diff-filter=ACMR",
		"-z",
		"--",
		...HEALTH_ROOTS,
	])
		.toString("utf8")
		.split("\0")
		.filter(isSourceFile);
	if (!files.length) return [];
	const output = git(
		root,
		["cat-file", "--batch"],
		files.map((file) => `:${file}\n`).join(""),
	);
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
