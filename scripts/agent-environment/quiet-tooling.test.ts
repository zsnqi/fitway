import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const require = createRequire(import.meta.url);
const lefthook = require("lefthook/get-exe.js").getExePath();
const fixtureRoots: string[] = [];

afterEach(() => {
	for (const root of fixtureRoots.splice(0)) {
		rmSync(root, { recursive: true, force: true, maxRetries: 3 });
	}
});

function run(
	root: string,
	executable: string,
	args: string[],
	env = process.env,
) {
	return spawnSync(executable, args, {
		cwd: root,
		env,
		encoding: "utf8",
		windowsHide: true,
	});
}

function git(root: string, args: string[]) {
	const result = run(root, "git", args);
	expect(result.status, result.stderr).toBe(0);
	return result.stdout;
}

function makeFixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-quiet-tooling-"));
	fixtureRoots.push(root);
	git(root, ["init", "-q"]);
	return root;
}

describe("quiet tooling", () => {
	it("prints no lefthook output on a passing commit and blocks a failing commit with its output", () => {
		const root = makeFixture();
		const config = parseYaml(
			readFileSync(new URL("../../lefthook.yml", import.meta.url), "utf8"),
		);
		config["pre-commit"].jobs = [
			{
				...config["pre-commit"].jobs[0],
				run: config["pre-commit"].jobs[0].run.replace(
					/^.*\{staged_files\}/,
					"node hook-job.cjs",
				),
				stage_fixed: false,
			},
			{ name: "skipped", glob: "never-matches", run: "node hook-job.cjs" },
		];
		writeFileSync(path.join(root, "lefthook.yml"), stringifyYaml(config));
		writeFileSync(
			path.join(root, "hook-job.cjs"),
			[
				'const failed = process.env.QUIET_TOOLING_FAIL === "1";',
				'console.log("HOOK_JOB_STDOUT");',
				'console.error("HOOK_JOB_STDERR");',
				"process.exitCode = failed ? 1 : 0;",
				"",
			].join("\n"),
		);
		writeFileSync(path.join(root, "probe.ts"), "// fixture\n");
		git(root, ["add", "--", "probe.ts"]);
		const env = {
			...process.env,
			PATH: `${path.dirname(lefthook)}${path.delimiter}${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
			LEFTHOOK_OUTPUT: "",
			LEFTHOOK: "1",
			QUIET_TOOLING_FAIL: "0",
		};
		expect(run(root, lefthook, ["install"], env).status).toBe(0);
		const commitArgs = [
			"-c",
			"user.name=Quiet Tooling Fixture",
			"-c",
			"user.email=fixture@example.invalid",
			"-c",
			"commit.gpgsign=false",
			"commit",
			"-q",
			"-m",
			"fixture",
		];
		const passing = run(root, "git", commitArgs, env);
		expect(passing.status, passing.stderr).toBe(0);
		expect(passing.stdout).toBe("");
		expect(passing.stderr).toBe("");
		const head = git(root, ["rev-parse", "HEAD"]);
		writeFileSync(path.join(root, "probe.ts"), "// failing fixture\n");
		git(root, ["add", "--", "probe.ts"]);
		const failing = run(root, "git", commitArgs, {
			...env,
			QUIET_TOOLING_FAIL: "1",
		});
		expect(failing.status).not.toBe(0);
		expect(failing.stdout + failing.stderr).toContain("HOOK_JOB_STDOUT");
		expect(failing.stdout + failing.stderr).toContain("HOOK_JOB_STDERR");
		expect(git(root, ["rev-parse", "HEAD"])).toBe(head);
	});

	it("ignores tool state at any depth, keeps configs trackable, and ignores no tracked files", () => {
		const root = makeFixture();
		writeFileSync(
			path.join(root, ".gitignore"),
			readFileSync(new URL("../../.gitignore", import.meta.url)),
		);
		const configs = [
			".impeccable/config.json",
			"design/.impeccable/config.json",
			"design/deep/.impeccable/config.json",
		];
		const state = [
			".impeccable/hook.cache.json",
			"design/.impeccable/hook.cache.json",
			"design/deep/.impeccable/cache/state.json",
			".codex-remote-attachments/image.png",
			"design/.codex-remote-attachments/image.png",
		];
		for (const relative of [...configs, ...state]) {
			const absolute = path.join(root, relative);
			mkdirSync(path.dirname(absolute), { recursive: true });
			writeFileSync(absolute, "{}\n");
			expect(
				run(root, "git", ["check-ignore", "--quiet", "--", relative]).status,
			).toBe(state.includes(relative) ? 0 : 1);
		}
		git(root, ["add", "--", ".gitignore", ...configs]);
		expect(git(root, ["ls-files", "-ci", "--exclude-standard"])).toBe("");
		expect(git(root, ["status", "--short"])).not.toContain("hook.cache.json");
		expect(git(root, ["status", "--short"])).not.toContain(
			".codex-remote-attachments",
		);
	});
});
