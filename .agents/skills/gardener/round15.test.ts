import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { config, parseFastSteps } from "./facts.mjs";
import {
	consoleSummary,
	formatReport,
	runChecks,
	surveyOutcome,
} from "./survey.mjs";

describe("gardener round 15 regressions", () => {
	it("G1: reads every real fast-ladder step as a label and command arguments", () => {
		const source = readFileSync(
			new URL("../../../scripts/verify.mjs", import.meta.url),
			"utf8",
		);
		const assertSteps = (text: string) => {
			const steps = parseFastSteps(text);
			expect(steps.length).toBeGreaterThan(0);
			for (const [label, args] of steps) {
				expect(typeof label).toBe("string");
				expect(label.trim()).not.toBe("");
				expect(Array.isArray(args)).toBe(true);
				expect(args.length).toBeGreaterThan(0);
				for (const arg of args) expect(typeof arg).toBe("string");
				expect(args[0].trim()).not.toBe("");
			}
			return steps;
		};
		const steps = assertSteps(source);
		// An ordinary new literal step must remain readable without updating this test.
		expect(
			assertSteps(
				source.replace(
					/(function fastSteps\(\)\s*\{\s*return \[)/,
					'$1["Future gate", ["check:future"]],',
				),
			),
		).toHaveLength(steps.length + 1);
		console.log(
			`G1 PROOF: real ladder has ${steps.length} readable steps; ordinary added step accepted`,
		);
	});

	it("G2: reports configured skips and missing scripts while every executed nonzero exit blocks", async () => {
		const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
		mkdirSync(base, { recursive: true });
		const run = mkdtempSync(path.join(base, "gardener-round15-"));
		const git = (args: string[]) =>
			execFileSync("git", args, {
				cwd: run,
				encoding: "utf8",
				windowsHide: true,
			});
		try {
			git(["init", "--initial-branch=main"]);
			git(["config", "core.autocrlf", "false"]);
			writeFileSync(path.join(run, "fixture.txt"), "fixture\n");
			git(["add", "."]);
			git([
				"-c",
				"user.name=Gardener fixture",
				"-c",
				"user.email=gardener@example.test",
				"commit",
				"-m",
				"fixture",
			]);
			const scripts = {
				"check:concept-css": "node concept.mjs",
				"check:usage": "node usage.mjs",
				"check:failure": "node failure.mjs",
				"check:future": "node future.mjs",
			};
			const reason = "Coordinator deferred this argument-taking fixture";
			// Exercise the default policy without freezing its names or reasons.
			const configured = config.notRunChecks ?? {};
			const defaults = await runChecks(
				Object.fromEntries(
					Object.keys(configured).map((name) => [name, "node deferred.mjs"]),
				),
				{
					cwd: run,
					tempRoot: run,
					capture: () => {
						throw new Error("Configured not-run check was executed");
					},
				},
			);
			for (const [name, configuredReason] of Object.entries(configured))
				expect(defaults.find((check) => check.name === name)).toMatchObject({
					notRun: true,
					reason: configuredReason,
				});
			const captured: string[] = [];
			const options = {
				cwd: run,
				tempRoot: run,
				notRunChecks: {
					"check:concept-css": reason,
					"check:undefined": "Coordinator deferred this check",
				},
				capture: (name: string, command: string) => {
					captured.push(name);
					return {
						name,
						command,
						exitCode:
							name === "check:usage" ? 2 : name === "check:failure" ? 9 : 0,
						output:
							name === "check:usage"
								? "Usage: check requires a folder"
								: "CHECK OUTPUT",
					};
				},
			};
			const checks = await runChecks(scripts, options);
			expect(captured).toEqual([
				"check:usage",
				"check:failure",
				"check:future",
			]);
			expect(
				checks.find((check) => check.name === "check:concept-css"),
			).toMatchObject({ notRun: true, reason, exitCode: null });
			const missing = checks.find((check) => check.name === "check:undefined");
			expect(missing).toMatchObject({
				notRun: false,
				reason: options.notRunChecks["check:undefined"],
				error: "NOT_DEFINED",
				exitCode: null,
			});
			expect(missing.output).toContain("package.json");
			const report = {
				outcome: "clean",
				date: "2026-10-10",
				checkout: run,
				complete: true,
				repositoryUnchanged: true,
				checks: checks.filter((check) => check.notRun || check.exitCode === 0),
				gates: {
					missing: [
						{
							name: "check:concept-css",
							command: scripts["check:concept-css"],
						},
					],
					duplicates: [],
				},
				rules: { duplicates: [], dead: [] },
				folders: [],
				git: {
					trunk: { ref: "origin/main", commit: "fixture" },
					branches: [],
					worktrees: [],
				},
			};
			expect(surveyOutcome(report)).toBe("clean");
			expect(
				surveyOutcome({
					...report,
					gates: {
						...report.gates,
						missing: [
							...report.gates.missing,
							{ name: "check:future", command: scripts["check:future"] },
						],
					},
				}),
			).toBe("blocked");
			const rendered = formatReport(report);
			expect(rendered).toContain(reason);
			expect(rendered).toContain('"notRun": true');
			expect(rendered).toContain("0 failing/blocked checks; 1 not-run checks");
			expect(consoleSummary(report, run)).toContain(
				"0 failing/blocked checks; 1 not-run checks",
			);
			for (const name of ["check:usage", "check:failure", "check:undefined"]) {
				const failed = {
					...report,
					outcome: "blocked",
					checks: [
						...report.checks,
						checks.find((check) => check.name === name),
					],
				};
				expect(surveyOutcome(failed)).toBe("blocked");
				expect(consoleSummary(failed, run)).toContain(
					"1 failing/blocked checks; 1 not-run checks",
				);
			}
			// The same script becomes runnable when the coordinator removes the entry.
			captured.length = 0;
			expect(
				(
					await runChecks(
						{ "check:concept-css": scripts["check:concept-css"] },
						{ ...options, notRunChecks: {} },
					)
				)[0].exitCode,
			).toBe(0);
			expect(captured).toEqual(["check:concept-css"]);
			const dependencyBlocked = await runChecks(
				{ "check:dependency": "node dependency.mjs", ...scripts },
				{
					...options,
					capture: (name: string, command: string) => ({
						name,
						command,
						exitCode: 1,
						output: "ERR_PNPM_VERIFY_DEPS_BEFORE_RUN",
					}),
				},
			);
			expect(dependencyBlocked.map((check) => check.name)).toEqual([
				"check:dependency",
				"check:concept-css",
				"check:undefined",
			]);
			expect(dependencyBlocked[1]).toMatchObject({ notRun: true, reason });
			expect(dependencyBlocked[2].error).toBe("NOT_DEFINED");
			console.log(
				"G2 PROOF: skip visible with reason; missing script visible and blocks; usage exit 2 and exit 9 block; new check runs",
			);
		} finally {
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-round15-/);
			rmSync(run, { recursive: true, force: true });
		}
	});
});
