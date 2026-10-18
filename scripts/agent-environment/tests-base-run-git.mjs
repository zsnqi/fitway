import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { readGit, runGit } from "./git-context.mjs";
import { normalizePath } from "./tooling-map-parser.mjs";

export function resolveCommit(repository, ref) {
	try {
		return readGit(repository, ["rev-parse", "--verify", `${ref}^{commit}`]);
	} catch {
		return null;
	}
}

export function ancestorOf(repository, base, result) {
	try {
		readGit(repository, ["merge-base", "--is-ancestor", base, result]);
		return true;
	} catch {
		return false;
	}
}

export function diffChanges(repository, base, result) {
	const output = readGit(repository, [
		"diff",
		"--name-status",
		"-z",
		"--find-renames=50%",
		base,
		result,
		"--",
	]);
	const fields = output.split("\0");
	const changes = [];
	for (let index = 0; index < fields.length; index += 1) {
		const status = fields[index];
		if (!status) continue;
		if (status.startsWith("R") || status.startsWith("C")) {
			const oldPath = normalizePath(fields[index + 1] ?? "");
			const newPath = normalizePath(fields[index + 2] ?? "");
			index += 2;
			if (oldPath && newPath)
				changes.push({
					status: status[0],
					oldPath,
					path: newPath,
				});
			continue;
		}
		const changedPath = normalizePath(fields[index + 1] ?? "");
		index += 1;
		if (changedPath)
			changes.push({
				status: status[0],
				path: changedPath,
				oldPath: null,
			});
	}
	return changes;
}

export function trackedFiles(repository, ref) {
	return readGit(repository, ["ls-tree", "-r", "-z", "--name-only", ref])
		.split("\0")
		.filter(Boolean)
		.map(normalizePath)
		.sort();
}

export function readTreeFile(treeRoot, file) {
	return readFileSync(path.resolve(treeRoot, file), "utf8");
}

export function extractTree(repository, ref, root, destination) {
	mkdirSync(root, { recursive: true });
	const archive = path.join(root, `${path.basename(destination)}.tar`);
	runGit(repository, ["archive", "--format=tar", `--output=${archive}`, ref]);
	mkdirSync(destination, { recursive: true });
	const result = spawnSync(
		"tar",
		["-xf", path.basename(archive), "-C", path.basename(destination)],
		{
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		},
	);
	if (result.error) throw result.error;
	if (result.status !== 0)
		throw new Error(
			`tar could not extract ${ref}: ${(result.stderr || "").trim()}`,
		);
}

export function treeSources(treeRoot, files) {
	const sources = new Map();
	for (const file of files) sources.set(file, readTreeFile(treeRoot, file));
	return sources;
}
