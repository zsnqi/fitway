import { execFileSync, spawnSync } from "node:child_process";
import {
	chmodSync,
	copyFileSync,
	existsSync,
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
	writeFileSync(
		path.join(root, "scripts", "run-stand-in.mjs"),
		[
			'import { runVerification } from "./verify.mjs";',
			"",
			"const steps = JSON.parse(process.argv[2]);",
			'runVerification({ mode: "fast", steps }).catch((error) => {',
			"	console.error('\\nFAILED_VALIDATION: ' + error.message);",
			"	process.exitCode = 1;",
			"});",
			"",
		].join("\n"),
	);
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
	return spawnSync(
		process.execPath,
		["scripts/run-stand-in.mjs", JSON.stringify(steps)],
		{
			cwd: root,
			encoding: "utf8",
			env: process.env,
			timeout: 30000,
			windowsHide: true,
		},
	);
}

function standInPnpm() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-verify-stand-in-"));
	roots.push(root);
	const bin = path.join(root, "bin");
	const log = path.join(root, "calls.ndjson");
	const environmentKeys = [
		"DATABASE_URL",
		"BETTER_AUTH_SECRET",
		"CRON_SECRET",
		"TELEGRAM_BOT_TOKEN",
		"TELEGRAM_CHAT_ID",
		"BETTER_AUTH_URL",
		"CORS_ORIGIN",
		"NODE_ENV",
	];
	mkdirSync(bin);
	if (process.platform === "win32") {
		writeFileSync(
			path.join(bin, "pnpm.cmd"),
			[
				"@echo off",
				'set "LOG=%FITWAY_VERIFY_TEST_CALL_LOG%"',
				'>>"%LOG%" echo ARGS %*',
				...environmentKeys.map((key) => `>>"%LOG%" echo ENV ${key}=%${key}%`),
				"",
			].join("\r\n"),
		);
		writeFileSync(path.join(bin, "git.cmd"), "@echo off\r\nexit /b 0\r\n");
	} else {
		const executable = path.join(bin, "pnpm");
		writeFileSync(
			executable,
			[
				"#!/bin/sh",
				'log="$FITWAY_VERIFY_TEST_CALL_LOG"',
				"{",
				'	printf "ARGS"',
				'	for arg in "$@"; do printf " %s" "$arg"; done',
				'	printf "\\n"',
				...environmentKeys.map(
					(key) => `	printf "ENV ${key}=%s\\n" "$\{${key}-}"`,
				),
				'} >> "$log"',
				"",
			].join("\n"),
		);
		chmodSync(executable, 0o755);
		const git = path.join(bin, "git");
		writeFileSync(git, "#!/bin/sh\nexit 0\n");
		chmodSync(git, 0o755);
	}
	return { bin, log };
}

function runEntryPoint(
	root: string,
	args: string[],
	standIn: ReturnType<typeof standInPnpm>,
	injectedSteps: string,
) {
	const pathKey =
		Object.keys(process.env).find((key) => key.toLowerCase() === "path") ??
		"PATH";
	return spawnSync(
		process.execPath,
		[path.join(root, "scripts", "verify.mjs"), ...args],
		{
			cwd: root,
			encoding: "utf8",
			env: {
				...process.env,
				[pathKey]: `${standIn.bin}${path.delimiter}${process.env[pathKey] ?? ""}`,
				FITWAY_VERIFY_TEST_CALL_LOG: standIn.log,
				FITWAY_VERIFY_TEST_STEPS: injectedSteps,
			},
			timeout: 30000,
			windowsHide: true,
		},
	);
}

function recordedCalls(log: string) {
	if (!existsSync(log)) return [];
	const calls: Array<{
		args: string[];
		env: Record<string, string>;
	}> = [];
	for (const line of readFileSync(log, "utf8").split(/\r?\n/)) {
		if (!line) continue;
		if (line.startsWith("ARGS ")) {
			calls.push({
				args: line.slice("ARGS ".length).trim().split(/\s+/),
				env: {},
			});
			continue;
		}
		if (line.startsWith("ENV ")) {
			const separator = line.indexOf("=");
			const call = calls.at(-1);
			if (!call || separator < 0) {
				throw new Error(`Invalid stand-in call log line: ${line}`);
			}
			call.env[line.slice("ENV ".length, separator)] = line.slice(
				separator + 1,
			);
		}
	}
	return calls;
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

describe("verification ladder entry point", () => {
	it("ignores test injection and runs its own steps", {
		timeout: 120_000,
	}, () => {
		const f = fixture();
		const standIn = standInPnpm();
		const fastStepArgs = [
			["check:repository"],
			["check:verification-map"],
			["test:verification"],
			["check"],
			["exec", "node", "scripts/check-owner-tokens.mjs"],
			["check-types"],
			["test"],
			["test:simulator"],
		];
		const injectedCommandSteps = JSON.stringify([
			{
				label: "injected command step",
				command: process.execPath,
				args: ["-e", "process.exit(0);"],
			},
		]);
		const injectedArraySteps = JSON.stringify([
			["Injected pnpm step", ["definitely-not-the-ladder"]],
		]);
		const cases = [
			{
				args: ["fast"],
				injectedSteps: "[]",
				name: "fast with empty steps",
				ownStepArgs: [],
			},
			{
				args: ["fast"],
				injectedSteps: "{",
				name: "fast with malformed JSON",
				ownStepArgs: [],
			},
			{
				args: ["phase", "--phase", "2"],
				injectedSteps: injectedCommandSteps,
				name: "phase with command steps",
				ownStepArgs: [
					["test:integration", "apps/server/src/phase2.integration.test.ts"],
					[
						"exec",
						"playwright",
						"test",
						"tests/browser/phase2.browser.spec.ts",
					],
				],
			},
			{
				args: ["full"],
				injectedSteps: injectedArraySteps,
				name: "full with array steps",
				ownStepArgs: [["build"], ["test:integration"], ["test:browser"]],
			},
		];
		const unitTestEnv = {
			DATABASE_URL:
				"postgresql://unit_test:unit_test@127.0.0.1:1/fitway_unit_placeholder",
			BETTER_AUTH_SECRET: "fitway_unit_placeholder_auth_secret_32_chars",
			CRON_SECRET: "fitway_unit_placeholder_cron_secret_32_chars",
			TELEGRAM_BOT_TOKEN: "fitway_unit_placeholder_bot_token",
			TELEGRAM_CHAT_ID: "fitway_unit_placeholder_chat_id",
			BETTER_AUTH_URL: "http://127.0.0.1:9/api/auth",
			CORS_ORIGIN: "http://127.0.0.1:9",
			NODE_ENV: "test",
		};

		for (const testCase of cases) {
			rmSync(standIn.log, { force: true });
			const result = runEntryPoint(
				f.root,
				testCase.args,
				standIn,
				testCase.injectedSteps,
			);
			const output = `${result.stdout}${result.stderr}`;
			const calls = recordedCalls(standIn.log);
			const context = `${testCase.name}\n${output}`;

			expect(result.status, context).toBe(0);
			expect(
				calls.map((call) => call.args),
				context,
			).toEqual([...fastStepArgs, ...testCase.ownStepArgs]);
			expect(calls[6]?.env, context).toEqual(unitTestEnv);
		}
	});
});
