// Create reusable initialized Git fixture repositories without rebuilding each object store.
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	realpathSync,
	renameSync,
	rmSync,
} from "node:fs";
import path from "node:path";
import { git } from "./fixtures";

let templateRoot: string | null = null;

function initialize(root: string) {
	mkdirSync(root, { recursive: true });
	git(root, "init", "--initial-branch=fixture");
	git(root, "config", "user.name", "Round fixture");
	git(root, "config", "user.email", "round@example.invalid");
	git(root, "config", "commit.gpgsign", "false");
	git(root, "config", "core.autocrlf", "false");
	git(root, "config", "core.hooksPath", path.join(root, "no-hooks"));
	git(root, "commit", "--allow-empty", "-m", "fixture base");
}

function initializedTemplate(testRoot: string) {
	if (!templateRoot) {
		templateRoot = mkdtempSync(path.join(testRoot, "fitway-round-template-"));
		initialize(templateRoot);
	}
	return templateRoot;
}

export function copyGitFixtureRepository(testRoot: string, target: string) {
	const template = initializedTemplate(testRoot);
	const staging = mkdtempSync(path.join(path.dirname(target), "fitway-copy-"));
	try {
		for (const entry of readdirSync(template)) {
			cpSync(path.join(template, entry), path.join(staging, entry), {
				recursive: true,
			});
		}
		renameSync(staging, target);
	} catch (error) {
		rmSync(staging, { recursive: true, force: true });
		throw error;
	}
}

export function removeGitFixtureTemplate(testRoot: string) {
	if (!templateRoot) return;
	const absolute = realpathSync.native(templateRoot);
	const relative = path.relative(realpathSync.native(testRoot), absolute);
	if (
		path.isAbsolute(relative) ||
		!relative.startsWith("fitway-round-template-")
	)
		throw new Error(`Unsafe template cleanup: ${absolute}`);
	rmSync(absolute, { recursive: true, force: true });
	templateRoot = null;
}
