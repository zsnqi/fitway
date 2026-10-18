import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const baselinePath = "docs/agent-context/CODE_HEALTH_BASELINE.json";
const roots = new Set<string>();

function runGit(root: string, args: string[]) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	}).trim();
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
	const root = fs.mkdtempSync(path.join(tmpdir(), "fitway-code-health-"));
	roots.add(root);
	runGit(root, ["init", "--quiet"]);
	runGit(root, ["config", "user.email", "code-health@example.invalid"]);
	runGit(root, ["config", "user.name", "Code Health Fixture"]);
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
