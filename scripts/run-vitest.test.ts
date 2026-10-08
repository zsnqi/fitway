import { execFileSync, spawnSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) {
		rmSync(root, { recursive: true, force: true, maxRetries: 5 });
	}
});

function fixture(cli: string) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-vitest-runner-"));
	roots.push(root);
	mkdirSync(path.join(root, "scripts"));
	mkdirSync(path.join(root, "node_modules", "vitest"), { recursive: true });
	for (const name of ["run-vitest.mjs", "repository-fingerprint.mjs"]) {
		copyFileSync(
			fileURLToPath(new URL(`./${name}`, import.meta.url)),
			path.join(root, "scripts", name),
		);
	}
	writeFileSync(path.join(root, "package.json"), '{"type":"module"}\n');
	writeFileSync(path.join(root, ".gitattributes"), "* text=auto eol=lf\n");
	writeFileSync(path.join(root, ".gitignore"), "node_modules/\noutput/\n");
	writeFileSync(path.join(root, "tracked.txt"), "original\n");
	writeFileSync(
		path.join(root, "node_modules", "vitest", "package.json"),
		'{"name":"vitest","type":"module"}\n',
	);
	writeFileSync(path.join(root, "node_modules", "vitest", "vitest.mjs"), cli);
	const git = (args: string[]) =>
		execFileSync("git", args, {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
	git(["init", "--quiet"]);
	git(["add", "."]);
	git([
		"-c",
		"user.name=Runner fixture",
		"-c",
		"user.email=runner@example.invalid",
		"-c",
		"commit.gpgsign=false",
		"-c",
		"core.hooksPath=",
		"commit",
		"--quiet",
		"-m",
		"fixture",
	]);
	return {
		root,
		git,
		run: (args = ["run"]) =>
			spawnSync(process.execPath, ["scripts/run-vitest.mjs", ...args], {
				cwd: root,
				encoding: "utf8",
				windowsHide: true,
			}),
	};
}

describe("Vitest runner", () => {
	it("forwards ordinary CLI arguments and permits existing dirty files and ignored output", () => {
		const test = fixture(`
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("output");
writeFileSync("output/args.json", JSON.stringify(process.argv.slice(2)));
`);
		writeFileSync(path.join(test.root, "untracked.txt"), "session notes\n");
		writeFileSync(path.join(test.root, "tracked.txt"), "session edit\n");
		const before = test.git(["status", "--short"]);
		const args = [
			"run",
			"--config",
			"vitest.integration.config.ts",
			"apps/server/src/phase2.integration.test.ts",
			"--reporter=verbose",
		];
		const result = test.run(["--", ...args]);
		expect(result.status, result.stderr).toBe(0);
		expect(
			JSON.parse(
				readFileSync(path.join(test.root, "output/args.json"), "utf8"),
			),
		).toEqual(args);
		expect(test.git(["status", "--short"])).toBe(before);
	});

	it.each([
		"tracked.txt",
		"new-untracked.txt",
	])("fails when a successful child changes %s", (file) => {
		const test = fixture(`
import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(file)}, "changed during tests\\n");
`);
		const result = test.run();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"changed tracked or untracked repository content",
		);
		expect(result.stdout).toContain(file);
	});

	it("checks mutations even when the child fails", () => {
		const test = fixture(`
import { writeFileSync } from "node:fs";
writeFileSync("tracked.txt", "changed\\n");
process.exitCode = 7;
`);
		const result = test.run();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"changed tracked or untracked repository content",
		);
	});

	it("preserves a failed child's exit code", () => {
		const result = fixture("process.exitCode = 7;\n").run();
		expect(result.status, result.stderr).toBe(7);
	});

	it("fails when the local Vitest CLI cannot launch", () => {
		const test = fixture("");
		rmSync(path.join(test.root, "node_modules", "vitest", "vitest.mjs"));
		const result = test.run();
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain("MODULE_NOT_FOUND");
	});
});
