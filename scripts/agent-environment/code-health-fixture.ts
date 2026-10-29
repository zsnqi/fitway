import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const baselinePath = "docs/agent-context/CODE_HEALTH_BASELINE.json";
const roots = new Set<string>();

export function runGit(root: string, args: string[]) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	}).trim();
}

// A temporary folder that cleanupHealthFixtures removes.
export function temporaryRoot(prefix: string) {
	const root = fs.mkdtempSync(path.join(tmpdir(), prefix));
	roots.add(root);
	return root;
}

export function initializeGit(root: string, email: string) {
	runGit(root, ["init", "--quiet"]);
	runGit(root, ["config", "user.email", email]);
	runGit(root, ["config", "user.name", "Code Health Fixture"]);
}

// A temporary folder whose repository/ subfolder is a Git repository, so a
// suite can keep files beside the repository rather than in it.
export function temporaryRepository(prefix: string, email: string) {
	const root = temporaryRoot(prefix);
	const repository = path.join(root, "repository");
	fs.mkdirSync(repository);
	initializeGit(repository, email);
	return { root, repository };
}

function runScript(script: string, root: string) {
	return spawnSync(
		process.execPath,
		[path.join(repository, "scripts/agent-environment", script)],
		{ cwd: root, encoding: "utf8", windowsHide: true },
	);
}

export function cleanupHealthFixtures() {
	for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	roots.clear();
}

export function createHealthFixture() {
	const root = temporaryRoot("fitway-code-health-");
	initializeGit(root, "code-health@example.invalid");
	return {
		root,
		git: (...args: string[]) => runGit(root, args),
		write(file: string, text: string) {
			const target = path.join(root, file);
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.writeFileSync(target, text, "utf8");
		},
		runBaseline: () => runScript("code-health-baseline.mjs", root),
		runCheck: () => runScript("check-code-health.mjs", root),
		writeBaseline() {
			const result = runScript("code-health-baseline.mjs", root);
			if (result.status !== 0)
				throw new Error(`${result.stdout}\n${result.stderr}`);
			return JSON.parse(fs.readFileSync(path.join(root, baselinePath), "utf8"));
		},
		commit(message: string) {
			runGit(root, ["add", "--all"]);
			runGit(root, ["commit", "-qm", message]);
		},
	};
}
