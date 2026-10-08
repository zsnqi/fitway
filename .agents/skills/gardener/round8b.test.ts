import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classifyWorktrees, config, references } from "./facts.mjs";
import {
	briefLifecycle,
	checkEnvironment,
	cleanupScript,
	collectFolders,
	collectGit,
	collectRecords,
	finalFolderSelection,
	formatReport,
	runChecks,
	surveyPnpmEnv,
} from "./survey.mjs";

describe("gardener round 8b", () => {
	it("R2: proposal citations do not protect folders; evidence and other records do", () => {
		const record = {
			source: ".agents/skills/gardener/REPORT.md",
			kind: "gardener",
			text: "Evidence: D:/fitway-temp/survey/REPORT.md\n## Folder removal proposals\n- `D:/fitway-temp/old`\n## Verification\nEvidence: D:/fitway-temp/second/survey.json\n",
		};
		expect(references("D:/fitway-temp/old", [record])).toEqual([]);
		for (const name of ["survey", "second"])
			expect(references(`D:/fitway-temp/${name}`, [record])).toHaveLength(1);
		expect(
			references("D:/fitway-temp/old", [
				{ ...record, kind: "resume", source: "resume.md" },
			]),
		).toHaveLength(1);
		const folders = [
			{ path: "D:/fitway-temp/old", candidate: true },
			{ path: "D:/fitway-temp/new", candidate: true },
		];
		expect(
			finalFolderSelection(folders, record.text)
				.filter((item) => item.candidate)
				.map((item) => item.path),
		).toEqual([folders[0].path]);
		expect(() =>
			finalFolderSelection([{ ...folders[0], candidate: false }], record.text),
		).toThrow(/no longer safe/);
		console.log(
			"R2 PROOF: final list equals rolling proposals; survey evidence remains protected",
		);
	});
	it("R3: excludes the invoking checkout and weekly worktree even without citations", () => {
		const trees = classifyWorktrees(
			["D:/current", config.weeklyWorktree, "D:/old"].map((value) => ({
				path: value,
				exists: true,
				merged: true,
				status: "",
			})),
			[],
			"D:/current",
			config.weeklyWorktree,
		);
		expect(trees.map((tree) => tree.candidate)).toEqual([false, false, true]);
		console.log(
			"R3 PROOF: invoking checkout and weekly gardener never proposed",
		);
	});
	it.each([
		"D:/fitway-temp/keep.",
		"D:/fitway-temp/keep:",
		"**D:/fitway-temp/keep**",
		"fitway-temp/keep",
		"/d/fitway-temp/keep",
		"`D:/fitway-temp/keep/REPORT.md:12`",
	])("R4: protects ordinary citation %s", (citation) => {
		expect(
			references("D:/fitway-temp/keep", [
				{ source: "record", text: `Evidence ${citation}` },
			]),
		).toHaveLength(1);
	});
	it("R5: measures unmerged status and lists old unreferenced work for coordinator review", async () => {
		const measured: string[] = [];
		const result = await collectGit([], {
			current: "D:/current",
			exists: () => true,
			readGit: (args: string[], cwd: string) => {
				if (args[0] === "rev-parse") return "trunk";
				if (args[0] === "for-each-ref") return "";
				if (args[0] === "worktree")
					return "worktree D:/old\nHEAD abc\nbranch refs/heads/evaluation\n\nworktree D:/unreadable\nHEAD def\nbranch refs/heads/other\n\n";
				if (args[0] === "show") return "2026-01-01T00:00:00Z";
				if (args[0] === "merge-base")
					throw Object.assign(new Error("unmerged"), { status: 1 });
				if (args[0] === "status") {
					measured.push(cwd);
					if (cwd === "D:/unreadable") throw new Error("unreadable fixture");
					return "?? unfinished.txt";
				}
				return "";
			},
		});
		expect(measured).toEqual(["D:/old", "D:/unreadable"]);
		expect(result.worktrees[0]).toMatchObject({
			coordinatorReview: true,
			candidate: false,
			branch: "refs/heads/evaluation",
			lastCommitAt: "2026-01-01T00:00:00Z",
			status: "?? unfinished.txt",
		});
		expect(result.worktrees[1].statusReason).toContain("unreadable fixture");
		console.log(
			"R5 PROOF: all worktree statuses attempted; old unmerged work listed, never removed",
		);
	});
	it("R6: committed clean round waits for record; unlaunched and ambiguous briefs stay checked", () => {
		const brief = {
			text: "- **Worktree:** `D:/round`, branch `round`, HEAD `aabbccdd`",
		};
		const reader =
			(implemented: boolean, dirty = false) =>
			(args: string[]) => {
				if (args[0] === "symbolic-ref") return "round";
				if (args[0] === "rev-list") return implemented ? "newcommit" : "";
				if (args[0] === "diff-tree") return "source.mjs\0";
				if (args[0] === "status") return dirty ? " M source.mjs" : "";
				return "";
			};
		expect(briefLifecycle(brief, reader(true)).waitingForRecord).toBe(true);
		for (const readGit of [
			reader(false),
			reader(true, true),
			() => {
				throw new Error("missing");
			},
		])
			expect(briefLifecycle(brief, readGit).waitingForRecord).toBe(false);
		console.log(
			"R6 PROOF: finished clean round waits for record; unlaunched brief still checked",
		);
	});
	it("R2/R7: expected ledger mismatch permits collection; dependency mismatch stops checks without install", async () => {
		const checkout = path.resolve(import.meta.dirname, "../../..");
		const scripts = {
			"check:repository": "node check.mjs",
			"check:after": "node after.mjs",
		};
		const mismatch = await runChecks(scripts, {
			cwd: checkout,
			capture: (name: string) => ({
				name,
				exitCode: 1,
				output:
					"FAILED_VALIDATION: Gardener ledger date/outcome does not match the rolling report",
			}),
		});
		expect(mismatch).toHaveLength(2);
		expect(mismatch[0]).toMatchObject({
			waitingForCoordinator: true,
			repositoryChanged: false,
		});
		const dependency = await runChecks(scripts, {
			cwd: checkout,
			capture: (name: string) => ({
				name,
				exitCode: 1,
				output: "ERR_PNPM_VERIFY_DEPS_BEFORE_RUN node_modules out of sync",
			}),
		});
		expect(dependency).toHaveLength(1);
		expect(dependency[0].dependencyBlocker).toBe(true);
		expect(surveyPnpmEnv.pnpm_config_verify_deps_before_run).toBe("error");
		expect(surveyPnpmEnv.pnpm_config_manage_package_manager_versions).toBe(
			"false",
		);
		const environment = checkEnvironment(
			{
				PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false",
				TEMP: "D:/inventory",
				NODE_COMPILE_CACHE: "D:/inventory/cache",
			},
			"D:/output/scratch",
		);
		expect(environment.PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN).toBeUndefined();
		expect(environment.pnpm_config_verify_deps_before_run).toBe("error");
		expect(environment.TEMP).toBe("D:/output/scratch");
		expect(environment.NODE_COMPILE_CACHE).toBe(
			path.join("D:/output/scratch", "node-compile-cache"),
		);
		console.log(
			"R7 PROOF: dependency mismatch named, later checks withheld, pnpm auto-install disabled",
		);
	});
	it("R2/R7: final generated cleanup removes exactly the rolling list on disposable folders; scratch excluded", async () => {
		const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
		mkdirSync(base, { recursive: true });
		const run = mkdtempSync(path.join(base, "gardener-r8b-"));
		try {
			const checkout = path.join(run, "checkout");
			mkdirSync(checkout);
			const git = (args: string[]) =>
				execFileSync("git", args, {
					cwd: checkout,
					encoding: "utf8",
					windowsHide: true,
				});
			git(["init", "--initial-branch=main"]);
			writeFileSync(
				path.join(checkout, "PROJECT_STATE.yaml"),
				"milestones: {}\ngardener:\n  date: '2026-01-01'\n  outcome: blocked\n  report: .agents/skills/gardener/REPORT.md\n",
			);
			const reportFolder = path.join(checkout, ".agents/skills/gardener");
			mkdirSync(reportFolder, { recursive: true });
			const tempRoot = path.join(run, "inventory");
			mkdirSync(tempRoot);
			const target = path.join(tempRoot, "old");
			mkdirSync(target);
			const old = new Date("2026-01-01T00:00:00Z");
			utimesSync(target, old, old);
			const out = path.join(tempRoot, "survey", "final");
			mkdirSync(path.join(out, "scratch"), { recursive: true });
			const rolling = `---\ndate: '2026-10-08'\noutcome: blocked\n---\nEvidence: ${out.replaceAll("\\", "/")}/REPORT.md\n## Folder removal proposals\n- \`${target.replaceAll("\\", "/")}\`\n`;
			writeFileSync(path.join(reportFolder, "REPORT.md"), rolling);
			git(["add", "."]);
			git([
				"-c",
				"user.name=Fixture",
				"-c",
				"user.email=fixture@example.test",
				"commit",
				"-m",
				"fixture",
			]);
			git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
			const context = await collectRecords({ checkout });
			const measured = await collectFolders(context.records, [], out, tempRoot);
			expect(measured.map((folder) => path.basename(folder.path))).toEqual([
				"old",
			]);
			const folders = finalFolderSelection(measured, rolling).filter(
				(folder) => folder.candidate,
			);
			expect(folders.map((folder) => folder.path)).toEqual([
				target.replaceAll("\\", "/"),
			]);
			const script = path.join(out, "cleanup.mjs");
			writeFileSync(
				script,
				cleanupScript(
					{ root: checkout, tempRoot, records: context.records, folders },
					checkout,
				),
			);
			const output = execFileSync(process.execPath, [script], {
				encoding: "utf8",
				windowsHide: true,
			});
			expect(output).toContain("CLEANUP PASS: 1 proposed folders, 0 failures");
			expect(readFileSync(path.join(reportFolder, "REPORT.md"), "utf8")).toBe(
				rolling,
			);
			console.log(
				"R2/R7 PROOF: CLEANUP PASS: 1 proposed folders, 0 failures; list equals rolling report; scratch absent from inventory",
			);
		} finally {
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-r8b-/);
			rmSync(run, { recursive: true, force: true });
		}
	});
	it("R7: real pnpm rejects stale dependencies without running the check or installing", async () => {
		const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
		mkdirSync(base, { recursive: true });
		const run = mkdtempSync(path.join(base, "gardener-r8b-"));
		try {
			const git = (args: string[]) =>
				execFileSync("git", args, {
					cwd: run,
					encoding: "utf8",
					windowsHide: true,
				});
			git(["init", "--initial-branch=main"]);
			const scripts = { "check:fixture": "node check.mjs" };
			writeFileSync(
				path.join(run, "package.json"),
				JSON.stringify({
					name: "gardener-fixture",
					scripts,
					dependencies: { "gardener-missing-fixture": "1.0.0" },
				}),
			);
			writeFileSync(
				path.join(run, "pnpm-lock.yaml"),
				"lockfileVersion: '9.0'\nsettings:\n  autoInstallPeers: true\n  excludeLinksFromLockfile: false\nimporters:\n  .: {}\n",
			);
			writeFileSync(path.join(run, "pnpm-workspace.yaml"), "packages: []\n");
			writeFileSync(
				path.join(run, "check.mjs"),
				"throw new Error('CHECK MUST NOT RUN');\n",
			);
			mkdirSync(path.join(run, "node_modules"));
			writeFileSync(path.join(run, "node_modules", "sentinel"), "keep");
			git(["add", "."]);
			git([
				"-c",
				"user.name=Fixture",
				"-c",
				"user.email=fixture@example.test",
				"commit",
				"-m",
				"fixture",
			]);
			const scratch = path.join(base, "runtime");
			mkdirSync(scratch, { recursive: true });
			const checks = await runChecks(scripts, { cwd: run, tempRoot: scratch });
			expect(checks[0]).toMatchObject({
				dependencyBlocker: true,
				repositoryChanged: false,
			});
			expect(checks[0].output).not.toContain("CHECK MUST NOT RUN");
			expect(
				readFileSync(path.join(run, "node_modules", "sentinel"), "utf8"),
			).toBe("keep");
			console.log(
				"R7 REAL PROOF: ERR_PNPM_VERIFY_DEPS_BEFORE_RUN; repository unchanged; dependency sentinel preserved",
			);
		} finally {
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-r8b-/);
			rmSync(run, { recursive: true, force: true });
		}
	}, 60000);
	it("R8: report states age and separate proposal count", () => {
		const output = formatReport({
			git: { trunk: {}, worktrees: [], branches: [] },
			proposals: { folders: { paths: ["one"] } },
			folders: [{ protectedBy: [] }, { protectedBy: [] }],
		});
		expect(output).toContain("Minimum folder age: 7 days");
		expect(output).toContain("Proposed temp folders: 1");
		expect(output).toContain("2 unreferenced temp folders");
	});
});
