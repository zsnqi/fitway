import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const temporaryRoots: string[] = [];

export function temporaryRoot(prefix: string): string {
	const root = mkdtempSync(path.join(tmpdir(), prefix));
	temporaryRoots.push(root);
	return root;
}

export function removeTemporaryRoots(): void {
	for (const root of temporaryRoots.splice(0))
		rmSync(root, { recursive: true, force: true });
}

export function runGit(root: string, args: string[]): string {
	const result = spawnSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	});
	if (result.status !== 0) throw new Error(result.stderr);
	return result.stdout.trim();
}

export function initializeGit(
	root: string,
	email = "fixture@example.invalid",
): void {
	runGit(root, ["init", "--quiet"]);
	runGit(root, ["config", "user.email", email]);
	runGit(root, ["config", "user.name", "FITWAY Fixture"]);
}
