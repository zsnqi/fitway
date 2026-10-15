import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
const repository = fileURLToPath(new URL("../", import.meta.url));

afterEach(() => {
	for (const root of roots.splice(0)) {
		rmSync(root, { recursive: true, force: true, maxRetries: 5 });
	}
});

function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-verify-test-"));
	roots.push(root);
	mkdirSync(path.join(root, "scripts"));
	for (const file of ["verify.mjs", "repository-fingerprint.mjs"]) {
		copyFileSync(
			path.join(repository, "scripts", file),
			path.join(root, "scripts", file),
		);
	}
	const git = (...args: string[]) =>
		execFileSync("git", args, {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
		});
	git("init", "--quiet");
	git("add", ".");
	git(
		"-c",
		"user.name=Verify fixture",
		"-c",
		"user.email=verify@example.invalid",
		"-c",
		"commit.gpgsign=false",
		"-c",
		"core.hooksPath=",
		"commit",
		"--quiet",
		"-m",
		"fixture",
	);
	return { root, git };
}

function nodeStep(label: string, source: string, env?: Record<string, string>) {
	return {
		label,
		command: process.execPath,
		args: ["-e", source],
		env,
	};
}

function runSteps(root: string, steps: ReturnType<typeof nodeStep>[]) {
	return spawnSync(process.execPath, ["scripts/verify.mjs", "fast"], {
		cwd: root,
		encoding: "utf8",
		env: {
			...process.env,
			FITWAY_VERIFY_TEST_STEPS: JSON.stringify(steps),
		},
		timeout: 30000,
		windowsHide: true,
	});
}

describe("verification ladder diagnostics", () => {
	it("names and times a failed step and the first mutating step", () => {
		const f = fixture();
		const result = runSteps(f.root, [
			nodeStep("stand-in pass", "process.exit(0);"),
			nodeStep(
				"stand-in writes",
				"require('node:fs').writeFileSync('mutation.txt', 'changed\\n');",
			),
			nodeStep(
				"stand-in removes",
				"require('node:fs').unlinkSync('mutation.txt');",
			),
			nodeStep("stand-in fails", "process.exit(7);"),
		]);
		const output = `${result.stdout}${result.stderr}`;
		const clock =
			"\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} [+-]\\d{2}:\\d{2}\\]";

		expect(result.status, output).toBe(1);
		expect(output).toMatch(new RegExp(`${clock} ==> stand-in pass`));
		expect(output).toMatch(/<== stand-in pass \(\d+\.\d{2}s, exit code 0\)/);
		expect(output).toContain(
			"MUTATION: stand-in writes changed the repository",
		);
		expect(output).toContain("?? mutation.txt");
		expect(output).toMatch(/<== stand-in fails \(\d+\.\d{2}s, exit code 7\)/);
		expect(output).toContain(
			"FAILED_VALIDATION: stand-in fails failed with exit code 7",
		);
		expect(output).toMatch(/step fingerprints \d+\.\d{2}s/);
		expect(f.git("status", "--short")).toBe("");
	});

	it("fails for a mutation that a later stand-in step undoes", () => {
		const f = fixture();
		const result = runSteps(f.root, [
			nodeStep(
				"stand-in writes",
				"require('node:fs').writeFileSync('mutation.txt', 'changed\\n');",
			),
			nodeStep(
				"stand-in removes",
				"require('node:fs').unlinkSync('mutation.txt');",
			),
		]);
		const output = `${result.stdout}${result.stderr}`;

		expect(result.status, output).toBe(1);
		expect(output).toContain(
			"MUTATION: stand-in writes changed the repository",
		);
		expect(output).toContain("?? mutation.txt");
		expect(output).toContain(
			"FAILED_VALIDATION: Verification changed tracked or untracked repository content",
		);
		expect(f.git("status", "--short")).toBe("");
	});
});
