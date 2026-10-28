import { execFileSync } from "node:child_process";
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
import { describe, expect, it, vi } from "vitest";
import { cleanup } from "./cleanup.mjs";
import { key, references } from "./facts.mjs";
import { removeWorktree } from "./remove-worktree.mjs";
import * as survey from "./survey-evidence.mjs";

function fixture() {
	const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
	mkdirSync(base, { recursive: true });
	const run = mkdtempSync(path.join(base, "gardener-round16b-"));
	const checkout = path.join(run, "checkout");
	const tempRoot = path.join(run, "temp");
	mkdirSync(checkout);
	mkdirSync(tempRoot);
	const git = (args: string[]) =>
		execFileSync("git", args, {
			cwd: checkout,
			encoding: "utf8",
			windowsHide: true,
		});
	git(["init", "--initial-branch=main"]);
	git(["config", "core.autocrlf", "false"]);
	writeFileSync(path.join(checkout, "PROJECT_STATE.yaml"), "milestones: {}\n");
	const commit = () => {
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
	};
	const folder = (name: string) => {
		const directory = path.join(tempRoot, name);
		mkdirSync(directory);
		writeFileSync(path.join(directory, "sentinel.txt"), "evidence\n");
		const old = new Date(Date.now() - 9 * 86400000);
		for (const target of [path.join(directory, "sentinel.txt"), directory])
			utimesSync(target, old, old);
		return directory;
	};
	return {
		run,
		checkout,
		tempRoot,
		git,
		commit,
		folder,
		dispose: () => {
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-round16b-/);
			rmSync(run, { recursive: true, force: true });
		},
	};
}

function ignoredWorktree(f, name: string, file: string) {
	writeFileSync(path.join(f.checkout, ".gitignore"), "node_modules/\n");
	f.commit();
	const target = path.join(f.tempRoot, name);
	f.git(["worktree", "add", "--detach", target, "HEAD"]);
	mkdirSync(path.join(target, "node_modules"), { recursive: true });
	const ignored = path.join(target, "node_modules", file);
	writeFileSync(ignored, "evidence\n");
	return { ignored, target };
}

describe("gardener round 16b repair", () => {
	it("R5: Git binary classification excludes byte paths and respects text attributes", async () => {
		const f = fixture();
		try {
			for (const name of ["byte-only", "attribute-binary", "keep"])
				f.folder(name);
			writeFileSync(
				path.join(f.checkout, ".gitattributes"),
				"forced.data -diff\ntext.data diff\n",
			);
			writeFileSync(
				path.join(f.checkout, "bytes.png"),
				Buffer.from(`\0/d/ ${path.join(f.tempRoot, "byte-only")}\n`),
			);
			writeFileSync(
				path.join(f.checkout, "forced.data"),
				`Evidence ${path.join(f.tempRoot, "attribute-binary")}\n`,
			);
			writeFileSync(path.join(f.checkout, "text.data"), "\0Initially empty\n");
			f.commit();
			// Working-tree text, including a file Git explicitly treats as text, stays current.
			writeFileSync(
				path.join(f.checkout, "text.data"),
				`\0Evidence ${path.join(f.tempRoot, "keep", "sentinel.txt")}\n`,
			);
			const context = await survey.collectRecords({ checkout: f.checkout });
			const records = await survey.collectFolderRecords(context.records, {
				checkout: f.checkout,
				tempRoot: f.tempRoot,
			});
			expect(records.map((record) => record.source)).not.toContain("bytes.png");
			expect(records.map((record) => record.source)).not.toContain(
				"forced.data",
			);
			const folders = await survey.collectFolders(
				context.records,
				[],
				path.join(f.tempRoot, "out"),
				f.tempRoot,
				{ checkout: f.checkout },
			);
			expect(
				folders
					.filter((item) => item.candidate)
					.map((item) => path.basename(item.path))
					.sort(),
			).toEqual(["attribute-binary", "byte-only"]);
			expect(
				folders.find((item) => path.basename(item.path) === "keep").protectedBy,
			).toEqual([expect.objectContaining({ source: "text.data", line: 1 })]);
			console.log(
				"R5 PROOF: Git binary byte paths and -diff files excluded; current diff-attributed text protects evidence with source/line",
			);
		} finally {
			f.dispose();
		}
	});

	it("R5: temp-root and ancestor citations protect nothing, while folder ancestors and descendants still protect", async () => {
		const tempRoot = "D:/fitway-temp/nested";
		const broad = [
			"D:/",
			"d:/",
			"/d/",
			"D:/fitway-temp",
			tempRoot,
			"D:\\FITWAY-TEMP\\NESTED",
		];
		const records = broad.map((target, index) => ({
			source: `root-${index}.md`,
			text: `Root citation: \`${target}\``,
		}));
		const cached = await survey.collectFolderRecords(records, {
			trackedFiles: [],
			tempRoot,
		});
		for (const sources of [records, cached])
			expect(references(`${tempRoot}/uncited`, sources, { tempRoot })).toEqual(
				[],
			);
		const exact = [
			{
				source: "evidence.md",
				text: `Keep D:\\FITWAY-TEMP\\NESTED\\KEEP\nKeep ${tempRoot}/below/report.md`,
			},
		];
		expect(
			references(`${tempRoot}/keep/child`, exact, { tempRoot })[0],
		).toMatchObject({ source: "evidence.md", line: 1 });
		expect(
			references(`${tempRoot}/below`, exact, { tempRoot })[0],
		).toMatchObject({ source: "evidence.md", line: 2 });
		console.log(
			"R5 PROOF: drive/MSYS/temp-root/above-root text protects no folder; case/backslash folder and below-folder citations still protect",
		);
	});

	it("R6: a 30-folder cleanup collects current tracked citations once and keeps newly cited evidence", async () => {
		const f = fixture();
		const previousExit = process.exitCode;
		try {
			const folders = Array.from({ length: 30 }, (_, i) =>
				f.folder(`item-${i}`),
			);
			f.commit();
			const context = await survey.collectRecords({ checkout: f.checkout });
			const measured = await Promise.all(
				folders.map((folder) => survey.measureFolder(folder)),
			);
			const late = folders[29];
			writeFileSync(
				path.join(f.checkout, "late.md"),
				`# Newly tracked\nEvidence ${path.join(late, "sentinel.txt")}\n`,
			);
			f.git(["add", "late.md"]);
			const citationReads = vi.spyOn(survey, "collectFolderRecords");
			const output = vi.spyOn(console, "log").mockImplementation(() => {});
			const errors = vi.spyOn(console, "error").mockImplementation(() => {});
			const started = performance.now();
			await cleanup(
				{
					root: f.checkout,
					tempRoot: f.tempRoot,
					records: context.records,
					folders: measured,
				},
				{ checkout: f.checkout },
			);
			const duration = performance.now() - started;
			expect(citationReads).toHaveBeenCalledTimes(1);
			expect(folders.slice(0, 29).every((folder) => !existsSync(folder))).toBe(
				true,
			);
			expect(readFileSync(path.join(late, "sentinel.txt"), "utf8")).toBe(
				"evidence\n",
			);
			expect(errors.mock.calls.flat().join("\n")).toContain(
				"Folder cited by late.md:2",
			);
			expect(output.mock.calls.flat().join("\n")).toContain(
				"30 proposed folders, 1 failures; continued after each failure",
			);
			vi.restoreAllMocks();
			console.log(
				`R6 PROOF: 30 disposable proposals, one citation collection, 29 removed, late.md:2 kept; duration=${Math.round(duration)}ms`,
			);
		} finally {
			vi.restoreAllMocks();
			process.exitCode = previousExit;
			f.dispose();
		}
	}, 60000);

	it("R6: scoped worktree inspection keeps fresh dirty/link guards without inspecting sibling paths", async () => {
		const f = fixture();
		try {
			const candidate = path.join(f.tempRoot, "proposal");
			const dirty = path.join(candidate, "dirty");
			const linked = path.join(candidate, "linked");
			const sibling = `${candidate}-sibling`;
			const inspected: string[] = [];
			const state = await survey.collectGit([], {
				current: f.checkout,
				worktreeRoot: candidate,
				exists: () => true,
				readGit: (args: string[], cwd: string) => {
					if (args[0] === "rev-parse") return "fixture-head";
					if (args[0] === "for-each-ref") return "";
					if (args[0] === "worktree")
						return [dirty, linked, sibling]
							.map(
								(directory, i) =>
									`worktree ${directory}\nHEAD fixture-head\nbranch refs/heads/fixture-${i}\n`,
							)
							.join("\n");
					if (args[0] === "show") return "2020-01-01T00:00:00Z";
					if (args[0] === "status")
						return cwd === dirty ? " M sentinel.txt" : "";
					if (args[0] === "merge-base") return "";
					throw new Error(`Unexpected fixture Git call: ${args.join(" ")}`);
				},
				inspectLinks: async (directory: string) => {
					inspected.push(directory);
					return {
						linksMeasured: true,
						linkErrors: [],
						links:
							directory === linked
								? [{ path: path.join(linked, "link"), outside: true }]
								: [],
					};
				},
			});
			expect(inspected).toEqual([dirty, linked]);
			expect(
				state.worktrees.find((tree) => key(tree.path) === key(dirty)),
			).toMatchObject({ clean: false, candidate: false });
			expect(
				state.worktrees.find((tree) => key(tree.path) === key(linked)),
			).toMatchObject({ linksSafe: false, candidate: false });
			console.log(
				"R6 PROOF: contained dirty/externally linked worktrees remain protected; sibling-prefix registrations are not inspected",
			);
		} finally {
			f.dispose();
		}
	});

	it("R7: removal refuses a tracked citation to an ignored file", async () => {
		const f = fixture();
		try {
			const { ignored, target } = ignoredWorktree(
				f,
				"ignored-evidence",
				"cited.log",
			);
			writeFileSync(
				path.join(f.checkout, "citation.txt"),
				`Evidence: \`${ignored}\`\n`,
			);
			f.git(["add", "citation.txt"]);
			await expect(removeWorktree(f.checkout, target)).rejects.toThrow(
				/cited\.log.*citation\.txt:1/,
			);
			expect(existsSync(target)).toBe(true);
			console.log(
				"E2 PASS: cited ignored file refused removal and named citation.txt:1",
			);
		} finally {
			f.dispose();
		}
	}, 60000);

	it("R7: removal refuses a cited worktree path and removes an uncited ignored file", async () => {
		const f = fixture();
		try {
			const { target: cited } = ignoredWorktree(
				f,
				"cited-worktree",
				"output.log",
			);
			writeFileSync(
				path.join(f.checkout, "citation.txt"),
				`Worktree evidence: \`${cited}\`\n`,
			);
			f.git(["add", "citation.txt"]);
			await expect(removeWorktree(f.checkout, cited)).rejects.toThrow(
				/output\.log.*citation\.txt:1/,
			);
			expect(existsSync(cited)).toBe(true);

			const { target: uncited } = ignoredWorktree(
				f,
				"uncited-worktree",
				"output.log",
			);
			await removeWorktree(f.checkout, uncited);
			expect(existsSync(uncited)).toBe(false);
			console.log(
				"E2 PASS: cited worktree path refused; uncited ignored file removed with its clean worktree",
			);
		} finally {
			f.dispose();
		}
	}, 60000);
});
