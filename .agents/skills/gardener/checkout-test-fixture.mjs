// Test fixture: a disposable Git checkout and temp root under GARDENER_TEST_RUN or the system temp.
import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect } from "vitest";

// `prefix` names the run folder; `commit` stages everything, commits (an empty commit too), and
// points `origin/main` at the result; `dispose` checks it removes only that run folder.
export function checkoutFixture(prefix) {
	const requested = path.resolve(process.env.GARDENER_TEST_RUN ?? os.tmpdir());
	mkdirSync(requested, { recursive: true });
	// Git prints worktrees by their long path; a system temp may be a Windows short alias (RUNNER~1).
	const base = realpathSync.native(requested);
	const run = mkdtempSync(path.join(base, prefix));
	const checkout = path.join(run, "checkout");
	const tempRoot = path.join(run, "temp");
	mkdirSync(checkout);
	mkdirSync(tempRoot);
	writeFileSync(path.join(checkout, "PROJECT_STATE.yaml"), "milestones: {}\n");
	const git = (args) =>
		execFileSync("git", args, {
			cwd: checkout,
			encoding: "utf8",
			windowsHide: true,
		});
	git(["init", "--initial-branch=main"]);
	git(["config", "core.autocrlf", "false"]);
	const commit = () => {
		git(["add", "--all"]);
		git([
			"-c",
			"user.name=Gardener fixture",
			"-c",
			"user.email=gardener@example.test",
			"commit",
			"--allow-empty",
			"--message",
			"fixture",
		]);
		git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
	};
	commit();
	return {
		checkout,
		commit,
		dispose: () => {
			expect(path.dirname(run)).toBe(base);
			expect(path.basename(run).startsWith(prefix)).toBe(true);
			rmSync(run, { recursive: true, force: true });
		},
		git,
		run,
		tempRoot,
	};
}
