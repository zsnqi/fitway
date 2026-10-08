import { execFileSync, spawn } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	classifyFolders,
	classifyWorktrees,
	landedBriefSources,
	localDate,
	MIN_FOLDER_AGE_DAYS,
	openBriefs,
	references,
} from "./facts.mjs";
import {
	cleanupScript,
	collectFolders,
	collectGit,
	collectRecords,
	filesystemPath,
	measureFolder,
	parseOptions,
	runChecks,
} from "./survey.mjs";

function fixture() {
	const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
	mkdirSync(base, { recursive: true });
	const run = mkdtempSync(path.join(base, "gardener-regression-"));
	const checkout = path.join(run, "checkout");
	mkdirSync(checkout);
	const command = (args: string[]) =>
		execFileSync("git", args, {
			cwd: checkout,
			encoding: "utf8",
			windowsHide: true,
		});
	command(["init", "--initial-branch=main"]);
	command(["config", "core.longpaths", "true"]);
	command(["config", "core.autocrlf", "false"]);
	writeFileSync(path.join(checkout, "PROJECT_STATE.yaml"), "milestones: {}\n");
	const commit = () => {
		command(["add", "."]);
		command([
			"-c",
			"user.name=Gardener fixture",
			"-c",
			"user.email=gardener@example.test",
			"commit",
			"-m",
			"fixture",
		]);
		command(["update-ref", "refs/remotes/origin/main", "HEAD"]);
	};
	commit();
	return {
		run,
		checkout,
		command,
		commit,
		dispose: () => {
			// Only this fixture's freshly created run directory is ever disposed.
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-regression-/);
			rmSync(filesystemPath(run), { recursive: true, force: true });
		},
	};
}

function ageTree(directory: string) {
	const old = new Date(Date.now() - (MIN_FOLDER_AGE_DAYS + 2) * 86400000);
	utimesSync(filesystemPath(directory), old, old);
}

describe("gardener round 8 regressions", () => {
	it("H2: requires seven days and path citations, protects rolling evidence, and ignores prose names", async () => {
		const now = Date.parse("2026-10-08T01:00:00Z");
		const tempRoot = path.resolve("D:/chosen-temp");
		const folder = (name: string, modifiedAt = "2026-09-29T01:00:00Z") => ({
			path: path.join(tempRoot, name),
			modifiedAt,
			errors: [],
		});
		const records = [
			{ source: "resume", text: "Keep evidence. and the reports in prose." },
			{
				source: ".agents/skills/gardener/REPORT.md",
				text: `Evidence: \`${path.join(tempRoot, "keep space", "REPORT.md")}\``,
			},
		];
		const folders = classifyFolders(
			[
				folder("evidence."),
				folder("keep space"),
				folder("hours", "2026-10-07T23:00:00Z"),
				folder("boundary", "2026-10-01T01:00:00Z"),
				folder("future", "2026-10-09T01:00:00Z"),
				folder("invalid", "unknown"),
				folder("unsafe%name"),
			],
			records,
			[],
			tempRoot,
			now,
		);
		expect(folders.map((item) => item.candidate)).toEqual([
			true,
			false,
			false,
			true,
			false,
			false,
			false,
		]);
		expect(folders[0].minimumAgeDays).toBe(7);
		expect(references(path.join(tempRoot, "evidence."), records)).toEqual([]);
		const files: Record<string, string> = {
			"PROJECT_STATE.yaml": "milestones: {}\n",
			".agents/skills/gardener/REPORT.md": records[1].text,
		};
		const context = await collectRecords({
			trackedFiles: Object.keys(files),
			load: async (source: string, kind: string) => ({
				source,
				kind,
				text: files[source],
			}),
		});
		expect(
			references(path.join(tempRoot, "keep space"), context.records),
		).toHaveLength(1);
	});

	it("H3 and H8: uses last-fetched origin/main and labels unmeasured worktrees with their reason", async () => {
		const calls: string[][] = [];
		const readGit = (args: string[]) => {
			calls.push(args);
			if (args[0] === "rev-parse") return "fetched-commit";
			if (args[0] === "for-each-ref")
				return args[1].startsWith("--merged=")
					? "refs/heads/landed"
					: "refs/heads/landed|landed-commit|\nrefs/heads/new|new-commit|";
			if (args[0] === "worktree")
				return "worktree D:/landed\nHEAD landed-commit\nbranch refs/heads/landed\n\nworktree D:/new\nHEAD new-commit\nbranch refs/heads/new\n\nworktree D:/missing\nHEAD gone\n\n";
			if (args[0] === "merge-base" && args[2] === "new-commit")
				throw Object.assign(new Error("unmerged"), { status: 1 });
			return "";
		};
		const result = await collectGit([], {
			readGit,
			exists: (value: string) => value !== "D:/missing",
		});
		expect(result.trunk).toEqual({
			ref: "origin/main",
			commit: "fetched-commit",
		});
		expect(result.branches[0].merged).toBe(true);
		expect(calls).toContainEqual(["rev-parse", "--verify", "origin/main"]);
		expect(calls.some((args) => args.includes("--merged=fetched-commit"))).toBe(
			true,
		);
		expect(
			calls
				.filter((args) => args[0] === "merge-base")
				.every((args) => args.at(-1) === "fetched-commit"),
		).toBe(true);
		expect(calls.flat()).not.toContain("main");
		expect(calls.flat()).not.toContain("fetch");
		expect(result.worktrees[1]).toMatchObject({
			status: null,
			clean: null,
			statusMeasured: false,
			statusReason: "HEAD is not merged into origin/main; status not measured",
		});
		expect(result.worktrees[2]).toMatchObject({
			clean: null,
			statusMeasured: false,
			statusReason: "Registration path is missing",
		});
	});

	it("H4: runs a newly added failing check, names status mutation, and continues through all checks", async () => {
		const f = fixture();
		try {
			const scripts = {
				"check:future": "node future.mjs",
				"check:mutation": "node mutation.mjs",
				"check:after": "node after.mjs",
			};
			writeFileSync(
				path.join(f.checkout, "package.json"),
				JSON.stringify({ scripts, packageManager: "pnpm@11.9.0" }),
			);
			writeFileSync(
				path.join(f.checkout, "future.mjs"),
				"console.log('NEW-CHECK-STDOUT'); console.error('NEW-CHECK-STDERR'); process.exitCode=9;\n",
			);
			writeFileSync(
				path.join(f.checkout, "mutation.mjs"),
				"import {writeFileSync} from 'node:fs'; writeFileSync('changed.txt','mutation'); console.log('MUTATED');\n",
			);
			writeFileSync(
				path.join(f.checkout, "after.mjs"),
				"console.log('AFTER-CHECK');\n",
			);
			f.commit();
			const checks = await runChecks(scripts, {
				cwd: f.checkout,
				tempRoot: f.run,
			});
			expect(checks.map((check) => check.name)).toEqual(Object.keys(scripts));
			expect(checks[0].exitCode).toBe(9);
			expect(checks[0].output).toContain("NEW-CHECK-STDOUT");
			expect(checks[0].output).toContain("NEW-CHECK-STDERR");
			expect(checks[1]).toMatchObject({
				name: "check:mutation",
				checkout: f.checkout,
				statusChanged: true,
				repositoryChanged: true,
			});
			expect(checks[2]).toMatchObject({
				exitCode: 0,
				statusChanged: false,
				repositoryChanged: false,
			});
			expect(checks[2].output).toContain("AFTER-CHECK");
		} finally {
			f.dispose();
		}
	}, 60000);

	it("H5: reports the local day even when its UTC day is yesterday", () => {
		const local = new Date(2026, 9, 8, 1);
		local.toISOString = () => "2026-10-07T22:00:00.000Z";
		expect(localDate(local)).toBe("2026-10-08");
	});

	it("H6: accepts a chosen temp root and inventories only that root", async () => {
		const f = fixture();
		try {
			const tempRoot = path.join(f.run, "chosen");
			mkdirSync(path.join(tempRoot, "evidence."), { recursive: true });
			ageTree(path.join(tempRoot, "evidence."));
			const out = path.join(tempRoot, "run", "survey");
			expect(parseOptions(["--out", out, "--temp-root", tempRoot])).toEqual({
				out,
				tempRoot,
			});
			const folders = await collectFolders([], [], out, tempRoot);
			expect(folders.map((folder) => folder.path)).toEqual([
				path.join(tempRoot, "evidence.").replaceAll("\\", "/"),
			]);
			expect(folders[0].candidate).toBe(true);
			if (process.platform === "win32") {
				const skillFolder = path.join(
					f.checkout,
					".agents",
					"skills",
					"gardener",
				);
				mkdirSync(skillFolder, { recursive: true });
				writeFileSync(
					path.join(skillFolder, "pass.ps1"),
					readFileSync(fileURLToPath(new URL("./pass.ps1", import.meta.url))),
				);
				writeFileSync(
					path.join(skillFolder, "survey.mjs"),
					"import path from 'node:path'; import {fileURLToPath} from 'node:url'; console.log('CHECKOUT='+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..')); console.log(JSON.stringify(process.argv.slice(2)));\n",
				);
				const output = execFileSync(
					"powershell.exe",
					[
						"-NoProfile",
						"-ExecutionPolicy",
						"Bypass",
						"-File",
						path.join(skillFolder, "pass.ps1"),
						"-Out",
						out,
						"-TempRoot",
						tempRoot,
					],
					{
						cwd: f.run,
						encoding: "utf8",
						windowsHide: true,
					},
				);
				expect(output).toContain(`CHECKOUT=${f.checkout}`);
				expect(output).toContain(
					JSON.stringify(["--out", out, "--temp-root", tempRoot]),
				);
			}
		} finally {
			f.dispose();
		}
	});

	it("H7: excludes only briefs with a recorded result, retaining launchable rounds with the same number", () => {
		const briefs = [
			"r03/briefs/round-7.md",
			"r03/briefs/round-8.md",
			"r02/briefs/round-7.md",
		].map((source) => ({
			source: `docs/environment/${source}`,
			text: "<!-- brief-format: v1 -->\n# Codex brief: gardener (round)",
		}));
		const records = [
			{
				source: "resume",
				kind: "resume",
				text: `## Next steps\n${briefs.map((brief) => `- Brief ${brief.source}`).join("\n")}`,
			},
		];
		const landed = landedBriefSources(
			briefs,
			"## phase round 7: `r03/briefs/round-7.md`, result `a36e97fe`\n## phase round 8: `r03/briefs/round-8.md` (draft)\n",
		);
		expect([...landed]).toEqual([briefs[0].source]);
		expect(
			openBriefs(records, briefs, landed).map((brief) => brief.source),
		).toEqual([briefs[2].source, briefs[1].source]);
	});

	it("H1: generated cleanup really removes spaces, evidence. and long paths, refuses unsafe folders and continues after a locked file", async () => {
		const f = fixture();
		let lock: ReturnType<typeof spawn> | undefined;
		try {
			const tempRoot = path.join(f.run, "temporary root");
			const longName = `long ${"x".repeat(210)}`;
			mkdirSync(filesystemPath(tempRoot), { recursive: true });
			const names = [
				"with spaces",
				"evidence.",
				longName,
				"locked",
				"after locked",
				"dirty",
				"referenced",
			];
			for (const name of names) {
				const folder = path.join(tempRoot, name);
				mkdirSync(filesystemPath(folder));
				if (name !== "dirty") {
					writeFileSync(
						filesystemPath(path.join(folder, "file.txt")),
						"fixture",
					);
					ageTree(path.join(folder, "file.txt"));
				}
				ageTree(folder);
			}
			expect(path.join(tempRoot, longName).length).toBeGreaterThan(260);
			const outside = path.join(f.run, "outside");
			mkdirSync(outside);
			writeFileSync(
				path.join(f.checkout, "PROJECT_STATE.yaml"),
				`milestones: {}\nnote: ${JSON.stringify(path.join(tempRoot, "referenced").replaceAll("\\", "/"))}\n`,
			);
			f.commit();
			// A registered disposable worktree gains uncommitted work before cleanup.
			f.command([
				"-c",
				"core.longpaths=true",
				"worktree",
				"add",
				"--detach",
				path.join(tempRoot, "dirty"),
				"HEAD",
			]);
			writeFileSync(
				filesystemPath(path.join(tempRoot, "dirty", "uncommitted.txt")),
				"keep",
			);
			const context = await collectRecords({ checkout: f.checkout });
			const folders = await Promise.all(
				[...names.map((name) => path.join(tempRoot, name)), outside].map(
					measureFolder,
				),
			);
			const script = path.join(f.run, "cleanup.mjs");
			writeFileSync(
				script,
				cleanupScript(
					{ root: f.checkout, tempRoot, records: context.records, folders },
					f.checkout,
				),
			);
			if (process.platform === "win32") {
				const locker = path.join(f.run, "lock.ps1");
				writeFileSync(
					locker,
					"param([string]$Target)\n$s=[System.IO.File]::Open($Target,'Open','ReadWrite','None')\n[Console]::Out.WriteLine('LOCKED')\n[Console]::In.ReadLine() | Out-Null\n$s.Dispose()\n",
				);
				lock = spawn(
					"powershell.exe",
					[
						"-NoProfile",
						"-File",
						locker,
						filesystemPath(path.join(tempRoot, "locked", "file.txt")),
					],
					{ windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
				);
				await new Promise<void>((resolve, reject) => {
					lock?.stdout?.once("data", (data) =>
						data.toString().includes("LOCKED")
							? resolve()
							: reject(new Error(data.toString())),
					);
					lock?.once("error", reject);
					lock?.once("exit", (code) => {
						if (code) reject(new Error(`Locker exited ${code}`));
					});
				});
			}
			let output = "";
			try {
				execFileSync(process.execPath, [script], {
					windowsHide: true,
					encoding: "utf8",
					stdio: "pipe",
				});
			} catch (error) {
				const failed = error as {
					stdout: string;
					stderr: string;
					status: number;
				};
				output = `${failed.stdout}${failed.stderr}`;
				expect(failed.status).toBe(1);
			}
			for (const name of [
				"with spaces",
				"evidence.",
				longName,
				"after locked",
			]) {
				expect(
					existsSync(filesystemPath(path.join(tempRoot, name))),
					`${name}: ${output}`,
				).toBe(false);
				expect(output).toContain(
					`REMOVED: ${path.join(tempRoot, name).replaceAll("\\", "/")}`,
				);
			}
			if (lock) {
				expect(existsSync(filesystemPath(path.join(tempRoot, "locked")))).toBe(
					true,
				);
				expect(output).toContain(
					`FAILED: ${path.join(tempRoot, "locked").replaceAll("\\", "/")}`,
				);
			}
			for (const name of ["dirty", "referenced"])
				expect(existsSync(filesystemPath(path.join(tempRoot, name)))).toBe(
					true,
				);
			expect(existsSync(outside)).toBe(true);
			expect(output).toContain("Unsafe deletion path");
			expect(output).toContain("protected/dirty worktree");
			console.log(
				"H1 PROOF: removed spaces, evidence., >260-character path and folder after locked failure; protected outside, dirty and referenced folders",
			);
		} finally {
			if (lock) {
				const exited = new Promise<void>((resolve) =>
					lock?.once("exit", () => resolve()),
				);
				lock.stdin?.end("\n");
				await exited;
			}
			f.dispose();
		}
	}, 60000);

	it("H1 safety: unmeasured or dirty registered worktrees never qualify for a folder proposal", () => {
		const trees = classifyWorktrees(
			[
				{
					path: "D:/temp/run/tree",
					exists: true,
					merged: true,
					status: " M file.txt",
				},
				{
					path: "D:/temp/unknown/tree",
					exists: true,
					merged: false,
					status: null,
				},
			],
			[],
			"D:/current",
		);
		const result = classifyFolders(
			["run", "unknown"].map((name) => ({
				path: `D:/temp/${name}`,
				modifiedAt: "2026-09-01",
				errors: [],
			})),
			[],
			trees,
			"D:/temp",
			Date.parse("2026-10-08"),
		);
		expect(result.every((folder) => !folder.candidate)).toBe(true);
		expect(trees[1].clean).toBeNull();
	});
});
