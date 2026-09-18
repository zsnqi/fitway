// Shared whole-repository mutation fingerprint for the authoritative
// verification entrypoints.
//
// `repositoryFingerprint` hashes one working tree: porcelain status, the
// binary tracked diff against HEAD, and every untracked path's relative name
// and bytes (a path removed while the fingerprint runs hashes a stable
// placeholder). It is behavior-preserving with the fingerprint both direct
// entrypoints used before extraction, and it stays outside ignored/configured
// output exactly as `git status` does.
//
// This helper's own bytes are part of the bounded integrity set, because
// `scripts/verify.mjs` and `scripts/run-vitest.mjs` trust its result as their
// wrapper-level repository mutation guard.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

function capture(cwd, command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
		const chunks = [];
		const errorChunks = [];
		child.stdout.on("data", (chunk) => chunks.push(chunk));
		child.stderr.on("data", (chunk) => errorChunks.push(chunk));
		child.once("error", reject);
		child.once("close", (code) => {
			if (code !== 0) {
				reject(
					new Error(
						`${command} ${args.join(" ")} failed:\n${Buffer.concat(errorChunks).toString("utf8")}`,
					),
				);
				return;
			}
			resolve(Buffer.concat(chunks));
		});
	});
}

export async function repositoryFingerprint({ cwd = process.cwd() } = {}) {
	const hash = createHash("sha256");
	const status = await capture(cwd, "git", [
		"status",
		"--porcelain=v1",
		"-z",
		"--untracked-files=all",
	]);
	hash.update("status\0");
	hash.update(status);
	const trackedDiff = await capture(cwd, "git", [
		"diff",
		"--binary",
		"--no-ext-diff",
		"HEAD",
		"--",
	]);
	hash.update("tracked\0");
	hash.update(trackedDiff);
	const untrackedOutput = await capture(cwd, "git", [
		"ls-files",
		"--others",
		"--exclude-standard",
		"-z",
	]);
	const paths = untrackedOutput
		.toString("utf8")
		.split("\0")
		.filter(Boolean)
		.sort();
	for (const relativePath of paths) {
		hash.update("untracked\0");
		hash.update(relativePath);
		hash.update("\0");
		try {
			hash.update(await readFile(path.resolve(cwd, relativePath)));
		} catch (error) {
			if (error && error.code === "ENOENT") {
				hash.update("<removed-during-verification>");
				continue;
			}
			throw error;
		}
	}
	return hash.digest("hex");
}
