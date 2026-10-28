import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect } from "vitest";

export function evidenceFixture(prefix) {
	const base = path.resolve(process.env.GARDENER_TEST_RUN ?? os.tmpdir());
	mkdirSync(base, { recursive: true });
	const run = mkdtempSync(path.join(base, prefix));
	const checkout = path.join(run, "checkout");
	const tempRoot = path.join(run, "temp");
	mkdirSync(checkout);
	mkdirSync(tempRoot);
	writeFileSync(path.join(checkout, "PROJECT_STATE.yaml"), "milestones: {}\n");
	const gitOptions = { cwd: checkout, encoding: "utf8", windowsHide: true };
	const git = (args) => execFileSync("git", args, gitOptions);
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
			expect(path.basename(run)).toMatch(new RegExp(`^${prefix}`));
			rmSync(run, { recursive: true, force: true });
		},
		git,
		run,
		tempRoot,
	};
}
