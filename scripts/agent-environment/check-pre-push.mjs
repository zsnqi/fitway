// Refuse a pre-push check unless the working tree is HEAD and every pushed ref is HEAD.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

function git(...args) {
	const result = spawnSync("git", ["--no-optional-locks", ...args], {
		encoding: "utf8",
		windowsHide: true,
	});
	if (result.status !== 0)
		throw new Error(`git ${args[0]} failed: ${result.stderr.trim()}`);
	return result.stdout.trim();
}

export function workingTreeProblem(status) {
	return status.trim()
		? "Pre-push refused: commit or stash tracked changes first."
		: null;
}

export function pushedRefProblem(refs, head) {
	for (const line of refs.split(/\r?\n/)) {
		const [localRef, localSha] = line.trim().split(/\s+/);
		if (!localRef || !localSha || /^0+$/.test(localSha)) continue;
		if (localSha !== head)
			return `Pre-push refused: ${localRef} is not checked out at HEAD ${head}.`;
	}
	return null;
}

function main() {
	const refs = process.stdin.isTTY ? "" : readFileSync(0, "utf8");
	const status = git("status", "--porcelain=v1", "--untracked-files=no");
	const problem = workingTreeProblem(status);
	if (problem) {
		console.error(problem);
		process.exitCode = 1;
		return;
	}
	const head = git("rev-parse", "HEAD");
	const refProblem = pushedRefProblem(refs, head);
	if (refProblem) {
		console.error(refProblem);
		process.exitCode = 1;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
	main();
