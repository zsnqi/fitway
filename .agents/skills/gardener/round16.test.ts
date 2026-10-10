import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classifyWorktrees, parseFastSteps, references } from "./facts.mjs";
import * as survey from "./survey.mjs";

function fixture() {
	const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
	mkdirSync(base, { recursive: true });
	const run = mkdtempSync(path.join(base, "gardener-round16-"));
	const checkout = path.join(run, "checkout");
	mkdirSync(checkout);
	const git = (args: string[]) =>
		execFileSync("git", args, {
			cwd: checkout,
			encoding: "utf8",
			windowsHide: true,
		});
	git(["init", "--initial-branch=main"]);
	git(["config", "core.autocrlf", "false"]);
	writeFileSync(path.join(checkout, "PROJECT_STATE.yaml"), "milestones: {}\n");
	writeFileSync(path.join(checkout, ".gitignore"), "node_modules/\n*.link\n");
	writeFileSync(path.join(checkout, "inside.txt"), "inside sentinel\n");
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
	commit();
	return {
		run,
		checkout,
		git,
		commit,
		dispose: () => {
			// Never dispose a supplied path or a real worktree: only our fresh fixture.
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-round16-/);
			rmSync(run, { recursive: true, force: true });
		},
	};
}

function ageTree(directory: string) {
	for (const name of ["sentinel.txt", ""]) {
		const old = new Date(Date.now() - 9 * 86400000);
		utimesSync(path.join(directory, name), old, old);
	}
}

function runProposal(command: string, checkout: string) {
	return execFileSync(
		process.platform === "win32" ? "powershell.exe" : "sh",
		process.platform === "win32"
			? [
					"-NoProfile",
					"-NonInteractive",
					"-Command",
					`${command}; exit $LASTEXITCODE`,
				]
			: ["-c", command],
		{ cwd: checkout, windowsHide: true, encoding: "utf8" },
	);
}

describe("gardener round 16 safety", () => {
	it("R1: real junctions are reported; proposed commands preserve outside data and recheck links", async () => {
		const f = fixture();
		try {
			const outside = path.join(f.run, "outside");
			mkdirSync(outside);
			const sentinel = path.join(outside, "sentinel.txt");
			writeFileSync(sentinel, "outside sentinel\n");
			const trees = ["external", "missing", "internal", "late-link"];
			for (const name of trees)
				f.git(["worktree", "add", "--detach", path.join(f.run, name), "HEAD"]);
			const external = path.join(f.run, "external");
			const nested = path.join(external, "node_modules", "deep");
			mkdirSync(nested, { recursive: true });
			symlinkSync(outside, path.join(nested, "junction"), "junction");
			symlinkSync(
				path.join(f.run, "absent"),
				path.join(f.run, "missing", "node_modules"),
				"junction",
			);
			const internal = path.join(f.run, "internal");
			mkdirSync(path.join(internal, "node_modules", ".pnpm"), {
				recursive: true,
			});
			symlinkSync(
				path.join(internal, "node_modules", ".pnpm"),
				path.join(internal, "node_modules", "package"),
				"junction",
			);
			const state = await survey.collectGit([], { current: f.checkout });
			const byName = (name: string) =>
				state.worktrees.find((tree) => path.basename(tree.path) === name);
			expect(byName("external").candidate).toBe(false);
			expect(byName("missing").candidate).toBe(false);
			expect(byName("internal").candidate).toBe(true);
			expect(byName("external").links).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: path.join(nested, "junction").replaceAll("\\", "/"),
						outside: true,
					}),
				]),
			);
			expect(byName("missing").links[0].error).toMatch(/ENOENT/);
			const rendered = survey.formatReport({
				date: "2026-10-10",
				checks: [],
				git: state,
			});
			expect(rendered).toContain("deep/junction");
			expect(rendered).toContain(outside.replaceAll("\\", "/"));
			const proposed = state.worktrees.filter((tree) => tree.candidate);
			expect(proposed).toHaveLength(2);
			for (const tree of proposed) {
				const command = survey.worktreeRemovalCommand(tree.path, f.checkout);
				if (path.basename(tree.path) === "late-link") {
					symlinkSync(
						outside,
						path.join(tree.path, "node_modules"),
						"junction",
					);
					expect(() => runProposal(command, f.checkout)).toThrow(
						/unsafe worktree links/,
					);
					expect(existsSync(tree.path)).toBe(true);
				} else {
					runProposal(command, f.checkout);
					expect(existsSync(tree.path)).toBe(false);
				}
				expect(readFileSync(sentinel, "utf8")).toBe("outside sentinel\n");
			}
			console.log(
				"R1 PROOF: real nested/missing junctions withheld and named; internal junction removed by exact PowerShell proposal; late external link refused; outside sentinel survives",
			);
		} finally {
			f.dispose();
		}
	}, 60000);

	it("R1: proposed removal handles a tracked internal file symlink", async () => {
		const f = fixture();
		try {
			f.git(["config", "core.symlinks", "true"]);
			symlinkSync("inside.txt", path.join(f.checkout, "internal.link"), "file");
			f.git(["add", "--force", "internal.link"]);
			f.commit();
			const target = path.join(f.run, "tracked-internal");
			f.git(["worktree", "add", "--detach", target, "HEAD"]);
			const state = await survey.collectGit([], { current: f.checkout });
			const tree = state.worktrees.find(
				(item) => path.basename(item.path) === "tracked-internal",
			);
			expect(tree.candidate).toBe(true);
			expect(tree.links).toHaveLength(1);
			runProposal(
				survey.worktreeRemovalCommand(tree.path, f.checkout),
				f.checkout,
			);
			expect(existsSync(target)).toBe(false);
			expect(readFileSync(path.join(f.checkout, "inside.txt"), "utf8")).toBe(
				"inside sentinel\n",
			);
			console.log(
				"R1 PROOF: tracked internal file symlink removed by exact proposal; invoking checkout sentinel survives",
			);
		} finally {
			f.dispose();
		}
	});

	it("R1: file/directory symlinks and unreadable links cannot qualify", async () => {
		const f = fixture();
		try {
			const target = path.join(f.run, "target.txt");
			writeFileSync(target, "outside\n");
			symlinkSync(target, path.join(f.checkout, "file.link"), "file");
			symlinkSync(f.run, path.join(f.checkout, "directory.link"), "dir");
			const state = await survey.collectGit([], { current: f.checkout });
			const tree = state.worktrees[0];
			expect(tree.candidate).toBe(false);
			expect(tree.links.filter((link) => link.outside)).toHaveLength(2);
			const unreadable = await survey.inspectWorktreeLinks(f.checkout, {
				readLink: async () => {
					throw Object.assign(new Error("fixture unreadable"), {
						code: "EACCES",
					});
				},
			});
			expect(unreadable.links).toHaveLength(2);
			expect(
				unreadable.links.every((link) => link.error.includes("EACCES")),
			).toBe(true);
			expect(
				classifyWorktrees(
					[{ ...tree, branch: "refs/heads/fixture", ...unreadable }],
					[],
					f.run,
				)[0].candidate,
			).toBe(false);
			console.log(
				"R1 PROOF: real file/directory symlinks named; unreadable link targets withhold removal",
			);
		} finally {
			f.dispose();
		}
	});

	it("R2: every tracked file protects path citations with source/line; proposals and prose do not", async () => {
		const f = fixture();
		try {
			const tempRoot = path.join(f.run, "temp");
			mkdirSync(tempRoot);
			for (const name of [
				"keep",
				"ancestor",
				"descendant",
				"proposed",
				"prose",
			]) {
				const folder = path.join(tempRoot, name);
				mkdirSync(folder);
				writeFileSync(path.join(folder, "sentinel.txt"), "evidence\n");
				ageTree(folder);
			}
			mkdirSync(path.join(f.checkout, "archive"));
			const archived = "archive/closed.md";
			writeFileSync(
				path.join(f.checkout, archived),
				`# Closed evidence\nKeep ${path.join(tempRoot, "keep", "sentinel.txt").toUpperCase()}\nKeep ${path.join(tempRoot, "ancestor")}\nKeep ${path.join(tempRoot, "descendant", "evidence", "REPORT.md")}\nprose\n`,
			);
			const rolling = ".agents/skills/gardener/REPORT.md";
			mkdirSync(path.dirname(path.join(f.checkout, rolling)), {
				recursive: true,
			});
			writeFileSync(
				path.join(f.checkout, rolling),
				`## Folder removal proposals\n- \`${path.join(tempRoot, "proposed")}\`\n`,
			);
			f.commit();
			const context = await survey.collectRecords({ checkout: f.checkout });
			const folders = await survey.collectFolders(
				context.records,
				[],
				path.join(tempRoot, "out"),
				tempRoot,
				{ checkout: f.checkout },
			);
			expect(
				folders
					.filter((folder) => folder.candidate)
					.map((folder) => path.basename(folder.path))
					.sort(),
			).toEqual(["proposed", "prose"]);
			expect(
				references(
					path.join(tempRoot, "ancestor", "child"),
					await survey.collectFolderRecords(context.records, {
						checkout: f.checkout,
					}),
					{ tempRoot },
				),
			).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ source: archived, line: 3 }),
				]),
			);
			for (const [name, line] of [
				["keep", 2],
				["ancestor", 3],
				["descendant", 4],
			] as const) {
				const folder = folders.find(
					(item) => path.basename(item.path) === name,
				);
				expect(folder.protectedBy).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ source: archived, line }),
					]),
				);
			}
			console.log(
				"R2 PROOF: closed tracked archive citations protect case/backslash/ancestor/descendant paths with source/line; proposal section and prose remain unprotected",
			);
		} finally {
			f.dispose();
		}
	});

	it("R2: cached citation lines preserve matching, line numbers, root changes and branch queries", async () => {
		const tempRoot = "D:/chosen-temp";
		const records = [
			{
				source: "archive.md",
				text: [
					"Prose keep; branch `topic`.",
					"Evidence D:\\CHOSEN-TEMP\\keep\\REPORT.md:12",
					"Evidence `D:/chosen-temp/space folder/REPORT.md`",
					"Evidence D:/chosen-temp/parent",
					"Root D:/chosen-temp; ignored D:/fitway-temp",
					"Template D:/chosen-temp/<run>/; glob D:/chosen-temp/wild*",
					"Other evidence D:/elsewhere/REPORT.md",
				].join("\n"),
			},
			{
				source: ".agents/skills/gardener/REPORT.md",
				kind: "gardener",
				text: "## Folder removal proposals\n- `D:/chosen-temp/proposed`\n## Evidence\nD:/chosen-temp/kept.\n",
			},
		];
		const cached = await survey.collectFolderRecords(records, {
			trackedFiles: [],
			tempRoot,
		});
		for (const root of [tempRoot, "D:/other-root"]) {
			for (const value of [
				"keep",
				"space folder",
				"parent/child",
				"proposed",
				"kept",
				"wild",
				"uncited",
			]
				.map((name) => `${tempRoot}/${name}`)
				.concat("D:/elsewhere")) {
				expect(references(value, cached, { tempRoot: root })).toEqual(
					references(value, records, { tempRoot: root }),
				);
			}
		}
		expect(references("topic", cached, { branch: true })).toEqual(
			references("topic", records, { branch: true }),
		);
		console.log(
			"R2 PROOF: cached tracked citations preserve original matching and line numbers; changed roots and branch queries use full text",
		);
	});

	it.each([
		"closed.md",
		"PROJECT_STATE.yaml",
		"new.md",
	])("R2: generated cleanup keeps a newly cited folder and names %s:2", async (source) => {
		const f = fixture();
		try {
			const tempRoot = path.join(f.run, "temp");
			const folder = path.join(tempRoot, "late-evidence");
			mkdirSync(folder, { recursive: true });
			const sentinel = path.join(folder, "sentinel.txt");
			writeFileSync(sentinel, "late evidence\n");
			ageTree(folder);
			writeFileSync(path.join(f.checkout, "closed.md"), "# Closed\n");
			f.commit();
			const context = await survey.collectRecords({ checkout: f.checkout });
			const measured = await survey.measureFolder(folder);
			const script = path.join(f.run, "cleanup.mjs");
			writeFileSync(
				script,
				survey.cleanupScript(
					{
						root: f.checkout,
						tempRoot,
						records: context.records,
						folders: [measured],
					},
					f.checkout,
				),
			);
			writeFileSync(
				path.join(f.checkout, source),
				source === "PROJECT_STATE.yaml"
					? `milestones: {}\n# Evidence: ${sentinel}\n`
					: `# Closed\nEvidence: ${sentinel}\n`,
			);
			if (source === "new.md") f.git(["add", source]);
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
			expect(readFileSync(sentinel, "utf8")).toBe("late evidence\n");
			expect(output).toContain(`${source}:2`);
			console.log(
				`R2 PROOF: generated cleanup rechecks newly cited tracked evidence, keeps sentinel and names ${source}:2`,
			);
		} finally {
			f.dispose();
		}
	});

	it.each([
		['["Named gate", dynamicArgs]', /Named gate.*arguments.*not literal/],
		[
			'["Named gate", ["test", dynamicArg]]',
			/Named gate.*argument 2.*not literal/,
		],
		['[dynamicLabel, ["test"]]', /position 2 \(1-based\).*label.*not literal/],
		["dynamicStep", /position 2 \(1-based\).*step.*not literal/],
		["[]", /position 2 \(1-based\).*label.*not literal/],
	])("R3: identifies non-literal step %s", (step, message) => {
		let failure = "";
		try {
			parseFastSteps(
				`function fastSteps() { return [["First", ["test"]], ${step}]; }`,
			);
		} catch (error) {
			failure = (error as Error).message;
		}
		expect(failure).toMatch(message);
		console.log(`R3 PROOF: ${failure}`);
	});
});
