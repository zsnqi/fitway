import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmdirSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "./cleanup.mjs";
import { classifyWorktrees, references } from "./facts.mjs";
import { formatReport } from "./survey.mjs";
import { cleanupScript, consoleSummary } from "./survey-cli.mjs";
import {
	collectFolderRecords,
	collectFolders,
	collectRecords,
	defaultTempRoot,
	measureFolder,
	root,
} from "./survey-evidence.mjs";

const race = vi.hoisted(() => ({
	target: "",
	code: "",
	remove: false,
	duringWalk: false,
}));
vi.mock("node:fs/promises", async (importOriginal) => {
	const fs = await importOriginal<typeof import("node:fs/promises")>();
	return {
		...fs,
		lstat: async (...args: Parameters<typeof fs.lstat>) => {
			if (
				String(args[0])
					.replace(/^\\\\\?\\/, "")
					.replaceAll("\\", "/")
					.toLowerCase() === race.target.toLowerCase()
			) {
				if (race.remove && !race.duringWalk) {
					await fs.rm(args[0], { recursive: true });
					race.remove = false;
				} else if (race.code)
					throw Object.assign(new Error(`planted ${race.code}`), {
						code: race.code,
					});
			}
			return fs.lstat(...args);
		},
		readdir: async (...args: Parameters<typeof fs.readdir>) => {
			if (
				race.remove &&
				race.duringWalk &&
				String(args[0])
					.replace(/^\\\\\?\\/, "")
					.replaceAll("\\", "/")
					.toLowerCase() === race.target.toLowerCase()
			) {
				await fs.rm(args[0], { recursive: true });
				race.remove = false;
			}
			return fs.readdir(...args);
		},
	};
});
afterEach(() => {
	race.target = "";
	race.code = "";
	race.remove = false;
	race.duringWalk = false;
	vi.restoreAllMocks();
});

function trees() {
	return classifyWorktrees(
		[
			{ path: "D:/gardener-fixture/eligible" },
			{
				path: "D:/gardener-fixture/external",
				links: [
					{
						path: "external.link",
						target: "D:/gardener-fixture/outside",
						outside: true,
					},
				],
			},
			{
				path: "D:/gardener-fixture/dangling",
				links: [
					{
						path: "dangling.link",
						target: "D:/gardener-fixture/absent",
						error: "ENOENT: absent",
					},
				],
			},
			{
				path: "D:/gardener-fixture/unmeasured",
				linksMeasured: false,
				linkErrors: ["private: EACCES"],
			},
			{ path: "D:/gardener-fixture/locked", locked: true },
			{
				path: "D:/gardener-fixture/protected",
				branch: "refs/heads/fixture-active",
			},
			{ path: "D:/gardener-fixture/current" },
			{ path: "D:/gardener-fixture/main", branch: "refs/heads/main" },
			{ path: "D:/gardener-fixture/dirty", status: "?? new" },
			{ path: "D:/gardener-fixture/unmerged", merged: false },
		].map((change) => ({
			exists: true,
			merged: true,
			status: "",
			linksMeasured: true,
			links: [],
			linkErrors: [],
			...change,
		})),
		[{ source: "resume.md", text: "Keep branch `fixture-active`" }],
		"D:/gardener-fixture/current",
		"D:/gardener-fixture/weekly",
	);
}
function report(worktrees = trees(), folders = []) {
	return {
		date: "2026-10-11",
		complete: true,
		outcome: "clean",
		repositoryUnchanged: true,
		checks: [],
		folders,
		git: { trunk: {}, branches: [], worktrees },
	};
}
function fixture() {
	const base = path.resolve(process.env.GARDENER_TEST_RUN ?? os.tmpdir());
	mkdirSync(base, { recursive: true });
	const run = mkdtempSync(path.join(base, "gardener-round27-"));
	const tempRoot = path.join(run, "temp");
	mkdirSync(tempRoot);
	return {
		run,
		tempRoot,
		dispose() {
			expect(path.dirname(run)).toBe(base);
			expect(path.basename(run)).toMatch(/^gardener-round27-/);
			rmSync(run, { recursive: true, force: true });
		},
	};
}

describe("gardener round 27 truthful inventory", () => {
	it("G1: merged clean counts only proposal-eligible worktrees and counts link withholding separately", () => {
		const worktrees = trees();
		expect(worktrees.filter((t) => t.mergedClean).map((t) => t.path)).toEqual([
			"D:/gardener-fixture/eligible",
		]);
		expect(worktrees.filter((t) => t.mergedClean)).toEqual(
			worktrees.filter((t) => t.candidate),
		);
		expect(
			worktrees
				.filter((t) => t.mergedCleanWithheldForLinks)
				.map((t) => path.basename(t.path)),
		).toEqual(["external", "dangling", "unmeasured"]);
		expect(formatReport(report(worktrees))).toContain(
			"3 merged clean worktrees withheld for links",
		);
		console.log(
			"G1 PASS: 1 removable merged clean worktree; 3 merged clean worktrees withheld for links",
		);
	});
	it("G2: prose names every withheld worktree, every link/target/error and unknown inspections; console counts", () => {
		const rendered = formatReport(report());
		const section = rendered
			.split("## Worktrees withheld for links\n")[1]
			?.split("\n## ")[0];
		expect(section).toBeDefined();
		for (const text of [
			"D:/gardener-fixture/external",
			"external.link",
			"D:/gardener-fixture/outside",
			"D:/gardener-fixture/dangling",
			"dangling.link",
			"D:/gardener-fixture/absent",
			"ENOENT: absent",
			"D:/gardener-fixture/unmeasured",
			"private: EACCES",
		])
			expect(section).toContain(text);
		expect(formatReport(report([]))).toContain(
			"## Worktrees withheld for links\n\nNone.",
		);
		expect(consoleSummary(report(), "D:/gardener-fixture/out")).toContain(
			"3 worktrees withheld for links",
		);
		console.log(
			"G2 PASS: prose names all withheld paths, links, targets and errors; None and console count verified",
		);
	});
	it.each([
		false,
		true,
	])("G3: listed folder removed during walk=%s is gone, unmeasured and never proposed", async (duringWalk) => {
		const f = fixture();
		try {
			const vanished = path.join(f.tempRoot, "vanished");
			mkdirSync(vanished);
			race.target = vanished.replaceAll("\\", "/");
			race.remove = true;
			race.duringWalk = duringWalk;
			const folders = await collectFolders(
				[],
				[],
				path.join(f.tempRoot, "out"),
				f.tempRoot,
				{ trackedFiles: [] },
			);
			expect(folders).toHaveLength(1);
			expect(folders[0]).toMatchObject({
				path: race.target,
				gone: true,
				candidate: false,
				bytes: null,
				files: null,
				modifiedAt: null,
				errors: [],
			});
			const section = formatReport(report([], folders))
				.split("## Temp folders gone during inventory\n")[1]
				?.split("\n## ")[0];
			expect(section).toContain(race.target);
			expect(consoleSummary(report([], folders), f.run)).toContain(
				"collection=complete",
			);
			expect(formatReport(report([], folders))).toContain(
				"0 unreferenced temp folders",
			);
			console.log(
				"G3 PASS: listed folder gone at measurement retains path, no proposal and collection complete",
			);
		} finally {
			f.dispose();
		}
	});
	it("G3: non-ENOENT failures still block collection", async () => {
		const f = fixture();
		try {
			const folder = path.join(f.tempRoot, "unreadable");
			mkdirSync(folder);
			race.target = folder.replaceAll("\\", "/");
			race.code = "EACCES";
			await expect(
				collectFolders([], [], path.join(f.tempRoot, "out"), f.tempRoot, {
					trackedFiles: [],
				}),
			).rejects.toMatchObject({ code: "EACCES" });
			console.log("G3 PASS: EACCES remains a collection blocker");
		} finally {
			f.dispose();
		}
	});
	it("G3: a missing child with an existing root remains an incomplete measurement", async () => {
		const f = fixture();
		try {
			const folder = path.join(f.tempRoot, "changed-subtree");
			mkdirSync(folder);
			const child = path.join(folder, "child.txt");
			writeFileSync(child, "fixture\n");
			race.target = child.replaceAll("\\", "/");
			race.remove = true;
			const [measured] = await collectFolders(
				[],
				[],
				path.join(f.tempRoot, "out"),
				f.tempRoot,
				{ trackedFiles: [] },
			);
			expect(existsSync(folder)).toBe(true);
			expect(measured.gone).not.toBe(true);
			expect(measured.errors).toEqual([`${folder}: ENOENT`]);
			expect(measured.candidate).toBe(false);
			console.log(
				"G3 PASS: subtree ENOENT with existing root remains incomplete and withheld",
			);
		} finally {
			f.dispose();
		}
	});
	it("G3: generated cleanup skips a folder gone after survey and refuses a disappearance during remeasurement", async () => {
		const f = fixture();
		const previousExit = process.exitCode;
		try {
			const checkout = path.join(f.run, "checkout");
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
				"milestones: {}\n",
			);
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
			git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
			const context = await collectRecords({ checkout });
			const folder = path.join(f.tempRoot, "late-gone");
			mkdirSync(folder);
			const old = new Date(Date.now() - 9 * 86400000);
			utimesSync(folder, old, old);
			const measured = await measureFolder(folder);
			const snapshot = {
				root: checkout,
				tempRoot: f.tempRoot,
				records: context.records,
				folders: [measured],
			};
			const script = path.join(f.run, "cleanup.mjs");
			writeFileSync(script, cleanupScript(snapshot, checkout));
			rmdirSync(folder);
			const output = execFileSync(process.execPath, [script], {
				encoding: "utf8",
				windowsHide: true,
			});
			expect(output).toContain(`SKIP absent: ${measured.path}`);
			expect(output).not.toContain("REMOVED:");
			mkdirSync(folder);
			race.target = folder.replaceAll("\\", "/");
			race.remove = true;
			const errors = vi.spyOn(console, "error").mockImplementation(() => {});
			const logs = vi.spyOn(console, "log").mockImplementation(() => {});
			await cleanup(snapshot, { checkout });
			expect(errors.mock.calls.flat().join("\n")).toContain("ENOENT");
			expect(logs.mock.calls.flat().join("\n")).toContain(
				"CLEANUP FAIL: 1 proposed folders, 1 failures",
			);
			expect(logs.mock.calls.flat().join("\n")).not.toContain("REMOVED:");
			vi.restoreAllMocks();
			console.log(
				"G3 PASS: generated cleanup skips absent folder; ENOENT during remeasurement is refused",
			);
		} finally {
			process.exitCode = previousExit;
			f.dispose();
		}
	}, 60000);
	it("G4: tracked gardener fixtures cite neither real temp folders nor non-test records", async () => {
		const records = await collectFolderRecords([], {
			checkout: root,
		});
		const tests = records.filter(
			(r) =>
				r.source.startsWith(".agents/skills/gardener/") &&
				r.source.endsWith(".test.ts"),
		);
		const outside = records.filter((r) => !r.source.endsWith(".test.ts"));
		const collisions = [];
		for (const test of tests) {
			const normalized = test.text.replaceAll("\\\\", "/");
			const names = new Set(
				[
					...normalized.matchAll(
						/(?:d:\/|\/d\/)?fitway-temp\/([a-z0-9_. -]+)/gi,
					),
				]
					.map((m) => m[1].trim().toLowerCase())
					.filter((n) => n !== "." && n !== ".."),
			);
			for (const name of names) {
				const folder = `${defaultTempRoot}/${name}`;
				const citations = references(folder, outside);
				if (existsSync(folder) || citations.length)
					collisions.push({
						test: test.source,
						folder,
						exists: existsSync(folder),
						citations: citations.map((c) => `${c.source}:${c.line}`),
					});
			}
		}
		if (existsSync(defaultTempRoot))
			for (const entry of readdirSync(defaultTempRoot, {
				withFileTypes: true,
			})) {
				if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
				const folder = `${defaultTempRoot}/${entry.name}`;
				for (const citation of references(folder, tests))
					collisions.push({
						test: citation.source,
						folder,
						exists: true,
						citations: [],
					});
			}
		expect(tests.length).toBeGreaterThan(0);
		expect(collisions).toEqual([]);
		console.log(
			"G4 PASS: all tracked gardener test paths are absent and uncited outside tests",
		);
	}, 60000);
});
