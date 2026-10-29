import { execFileSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { checkoutFixture } from "./checkout-test-fixture.mjs";
import { collectTrackedCitationRecords } from "./cited-evidence.mjs";
import {
	countNewTempScripts,
	planEvidencePrune,
	pruneEvidence,
} from "./prune-evidence.mjs";
import { formatReport } from "./survey.mjs";
import { collectGit } from "./survey-evidence.mjs";

function createLossShapes(f) {
	const cited = path.join(f.tempRoot, "cited");
	const uncited = path.join(f.tempRoot, "nested-citation");
	const linked = path.join(f.tempRoot, "linked");
	mkdirSync(path.join(cited, "deep"), { recursive: true });
	mkdirSync(path.join(uncited, "deep"), { recursive: true });
	mkdirSync(linked);
	const kept = [
		path.join(cited, "deep", "run.log"),
		path.join(cited, "deep", "helper.cjs"),
		path.join(cited, "deep", "large.json"),
		path.join(cited, "deep", "kept.png"),
	];
	writeFileSync(kept[0], "kept log\n");
	writeFileSync(kept[1], "console.log('kept')\n");
	writeFileSync(kept[2], "x".repeat(100 * 1024));
	writeFileSync(kept[3], "png\n");
	const namedCapture = path.join(cited, "deep", "named.png");
	writeFileSync(namedCapture, "named capture\n");
	writeFileSync(
		path.join(cited, "deep", "notes.txt"),
		"Reviewed frame: named.png\n",
	);
	const uncitedCapture = path.join(cited, "deep", "uncited.png");
	writeFileSync(uncitedCapture, "temporary capture\n");
	const nestedLog = path.join(uncited, "deep", "cited.log");
	writeFileSync(nestedLog, "nested evidence\n");
	writeFileSync(path.join(uncited, "drop.bin"), "drop\n");
	writeFileSync(
		path.join(f.checkout, "record.md"),
		`Evidence: \`${cited}\`\nFrame: \`${kept[3]}\`\n`,
	);
	writeFileSync(
		path.join(f.checkout, "rounds.tsv"),
		`result\tevidence\nkeep\t${nestedLog}\n`,
	);
	f.commit();
	const outside = path.join(f.run, "outside");
	mkdirSync(outside);
	const outsideSentinel = path.join(outside, "sentinel.txt");
	writeFileSync(outsideSentinel, "outside\n");
	symlinkSync(outside, path.join(linked, "junction"), "junction");
	const registered = path.join(f.tempRoot, "registered");
	f.git(["worktree", "add", "--detach", registered, "HEAD"]);
	return {
		kept,
		namedCapture,
		nestedLog,
		outsideSentinel,
		uncitedCapture,
	};
}

function expectLossShapes(plans, shapes) {
	const byName = (name: string) =>
		plans.find((plan) => path.basename(plan.path) === name);
	const citedPlan = byName("cited");
	expect(citedPlan?.withheld).toBeNull();
	for (const file of shapes.kept)
		expect(citedPlan?.deleteFiles).not.toContain(file.replaceAll("\\", "/"));
	expect(citedPlan?.deleteFiles).not.toContain(
		shapes.namedCapture.replaceAll("\\", "/"),
	);
	expect(citedPlan?.deleteFiles).toContain(
		shapes.uncitedCapture.replaceAll("\\", "/"),
	);
	expect(citedPlan?.kept).toMatchObject({
		captureNamedByText: 1,
		citedFile: 1,
		nonCaptureInCitedFolder: 4,
	});
	expect(byName("nested-citation")?.deleteFiles).not.toContain(
		shapes.nestedLog.replaceAll("\\", "/"),
	);
	// No citation reaches the linked folder, so it is proposed whole; its link is checked at deletion.
	expect(byName("linked")).toMatchObject({
		withheld: null,
		deleteDirectories: [{ bytes: null }],
	});
	expect(byName("registered")?.withheld).toBe("registered worktree");
	expect(existsSync(shapes.outsideSentinel)).toBe(true);
}

// Denies reading a file's data or listing a directory; `allowRead` undoes it before disposal.
function denyRead(target: string) {
	if (process.platform === "win32")
		execFileSync("icacls", [target, "/deny", "*S-1-1-0:(RD)"], {
			windowsHide: true,
		});
	else chmodSync(target, 0);
	expect(() =>
		lstatSync(target).isDirectory()
			? readdirSync(target)
			: readFileSync(target),
	).toThrow();
}

function allowRead(target: string) {
	if (process.platform === "win32")
		execFileSync("icacls", [target, "/remove:d", "*S-1-1-0"], {
			windowsHide: true,
		});
	else chmodSync(target, 0o755);
}

async function planOne(f, name: string, measurements = []) {
	const records = await collectTrackedCitationRecords({ checkout: f.checkout });
	const [plan] = await planEvidencePrune({
		folderPaths: [path.join(f.tempRoot, name)],
		measurements,
		records,
		tempRoot: f.tempRoot,
	});
	return plan;
}

// Writes each file (creating its folders) under the temp root, then a record citing `cited`.
function layout(f, files: Record<string, string>, cited: string[]) {
	for (const [name, text] of Object.entries(files)) {
		const target = path.join(f.tempRoot, name);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(target, text);
	}
	writeFileSync(
		path.join(f.checkout, "record.md"),
		cited
			.map((name) => `Evidence: \`${path.join(f.tempRoot, name)}\`\n`)
			.join(""),
	);
	f.commit();
}

const slashed = (file: string) => file.replaceAll("\\", "/");

describe("evidence-safe temp pruning", () => {
	it("keeps every cited loss shape, names uncited captures, and withholds registered worktrees", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		try {
			const shapes = createLossShapes(f);
			const records = await collectTrackedCitationRecords({
				checkout: f.checkout,
			});
			const git = await collectGit(records, { current: f.checkout });
			const plans = await planEvidencePrune({
				records,
				tempRoot: f.tempRoot,
				worktrees: git.worktrees,
			});
			expectLossShapes(plans, shapes);
			console.log(
				"E1 PASS: cited folder kept log/cjs/100KB JSON/externally cited PNG; uncited PNG proposed; TSV nested citation kept; uncited linked folder proposed whole; registered worktree withheld",
			);
		} finally {
			f.dispose();
		}
	}, 60000);

	it("counts scripts only in new folders outside node_modules and extracted Git trees", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		try {
			const first = path.join(f.tempRoot, "new-a");
			const second = path.join(f.tempRoot, "new-b");
			mkdirSync(path.join(first, "one", "two"), { recursive: true });
			mkdirSync(path.join(first, "node_modules", "pkg"), { recursive: true });
			mkdirSync(path.join(first, "extracted", ".git"), { recursive: true });
			mkdirSync(second);
			writeFileSync(path.join(first, "one", "a.mjs"), "a\n");
			writeFileSync(path.join(first, "one", "two", "b.py"), "b\n");
			writeFileSync(path.join(first, "c.ps1"), "c\n");
			writeFileSync(
				path.join(first, "node_modules", "pkg", "ignored.js"),
				"x\n",
			);
			writeFileSync(path.join(first, "extracted", "ignored.cjs"), "x\n");
			const result = await countNewTempScripts({
				previousReportText: "---\ndate: '2000-01-01'\n---\n",
				tempRoot: f.tempRoot,
			});
			expect(
				Object.fromEntries(
					result.folders.map((folder) => [
						path.basename(folder.path),
						folder.scripts,
					]),
				),
			).toEqual({ "new-a": 3, "new-b": 0 });
			expect(result.total).toBe(3);
			const rendered = formatReport({
				checks: [],
				complete: true,
				date: "2026-10-28",
				folders: [],
				git: { branches: [], trunk: {}, worktrees: [] },
				goneCitations: {
					checked: true,
					dead: [],
					tempRoot: f.tempRoot,
				},
				prune: [],
				repositoryUnchanged: true,
				scriptFiles: result,
			});
			expect(rendered).toContain("## Script files in new temp folders");
			expect(rendered).toContain("new-a");
			expect(rendered).toContain("Total: 3 script files.");
			console.log(
				"E4 PASS: new-a=3 scripts across nested folders; new-b=0; node_modules and extracted Git tree excluded; total=3",
			);
		} finally {
			f.dispose();
		}
	});
	it("withholds a folder whose kept text file cannot be read, naming the file", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		try {
			const held = path.join(f.tempRoot, "held");
			mkdirSync(held);
			const log = path.join(held, "run.log");
			writeFileSync(log, "Frame: `frame.png`\n");
			writeFileSync(path.join(held, "frame.png"), "capture\n");
			writeFileSync(
				path.join(f.checkout, "record.md"),
				`Evidence: \`${held}\`\n`,
			);
			f.commit();
			denyRead(log);
			const plan = await planOne(f, "held");
			expect(plan.withheld).toContain(slashed(log));
			expect(plan.deleteFiles).toEqual([]);
			console.log(`FINDING 1 PASS: ${plan.withheld}`);
		} finally {
			f.dispose();
		}
	});

	it("keeps a capture a kept text file elsewhere in the top-level folder names", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		try {
			const fwd = path.join(f.tempRoot, "fwd");
			mkdirSync(path.join(fwd, "sub"), { recursive: true });
			writeFileSync(path.join(fwd, "notes.md"), "Reviewed frame: `deep.png`\n");
			const deep = path.join(fwd, "sub", "deep.png");
			const loose = path.join(fwd, "sub", "loose.png");
			writeFileSync(deep, "named capture\n");
			writeFileSync(loose, "unnamed capture\n");
			writeFileSync(
				path.join(f.checkout, "record.md"),
				`Evidence: \`${fwd}\`\n`,
			);
			f.commit();
			const plan = await planOne(f, "fwd");
			expect(plan.withheld).toBeNull();
			expect(plan.deleteFiles).toEqual([slashed(loose)]);
			expect(plan.kept).toMatchObject({
				captureNamedByText: 1,
				nonCaptureInCitedFolder: 1,
			});
			console.log(
				"C1 PASS: fwd/sub/deep.png named by fwd/notes.md kept; fwd/sub/loose.png proposed",
			);
		} finally {
			f.dispose();
		}
	});
});

describe("the prune walks only what a decision needs", () => {
	it("proposes an uncited top-level folder whole without walking it", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		const whole = path.join(f.tempRoot, "whole");
		try {
			layout(f, { "whole/sub/run.log": "x\n", "whole/frame.png": "y\n" }, []);
			denyRead(whole);
			const measured = await planOne(f, "whole", [
				{ path: whole, bytes: 123, errors: [] },
			]);
			expect(measured).toMatchObject({
				withheld: null,
				bytes: 123,
				candidates: 1,
				deleteFiles: [],
				deleteDirectories: [{ path: slashed(whole), bytes: 123 }],
				unmeasured: 0,
			});
			const unmeasured = await planOne(f, "whole");
			expect(unmeasured).toMatchObject({
				withheld: null,
				deleteDirectories: [{ path: slashed(whole), bytes: null }],
				unmeasured: 1,
			});
			console.log(
				"C3 PASS: unlistable uncited folder proposed whole; bytes 123 from the measurement, else not measured",
			);
		} finally {
			allowRead(whole);
			f.dispose();
		}
	});

	it("proposes an unreached subtree of a reached folder whole, stated as not measured", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		const scratch = path.join(f.tempRoot, "part", "scratch");
		try {
			layout(
				f,
				{
					"part/keep/run.log": "kept\n",
					"part/loose.txt": "loose\n",
					"part/scratch/a/b.log": "scratch\n",
				},
				["part/keep/run.log"],
			);
			denyRead(scratch);
			const plan = await planOne(f, "part");
			expect(plan.withheld).toBeNull();
			expect(plan.deleteFiles).toEqual([
				slashed(path.join(f.tempRoot, "part", "loose.txt")),
			]);
			expect(plan.deleteDirectories).toEqual([
				{ path: slashed(scratch), bytes: null },
			]);
			expect(plan.kept.citedFile).toBe(1);
			const line = formatReport({
				checks: [],
				complete: true,
				prune: [plan],
			})
				.split("\n")
				.find((text) => text.startsWith(`- ${JSON.stringify(plan.path)}`));
			expect(line).toContain(
				"from 1 files and 1 whole folder, 1 of them not measured",
			);
			console.log(`C3 PASS: ${line}`);
		} finally {
			allowRead(scratch);
			f.dispose();
		}
	});

	it("keeps node_modules and a Git tree whole and unwalked inside a cited folder", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		const modules = path.join(f.tempRoot, "cited", "node_modules");
		try {
			layout(
				f,
				{
					"cited/node_modules/pkg/index.js": "x\n",
					"cited/repo/.git/HEAD": "ref\n",
					"cited/repo/frame.png": "uncited capture in a Git tree\n",
					"cited/frame.png": "uncited capture\n",
				},
				["cited"],
			);
			denyRead(modules);
			const plan = await planOne(f, "cited");
			expect(plan.withheld).toBeNull();
			expect(plan.deleteFiles).toEqual([
				slashed(path.join(f.tempRoot, "cited", "frame.png")),
			]);
			expect(plan.deleteDirectories).toEqual([]);
			expect(plan.kept.wholeFolders).toBe(2);
			console.log(
				"C3 PASS: unlistable node_modules and a Git tree kept whole in a cited folder; only the loose capture proposed",
			);
		} finally {
			allowRead(modules);
			f.dispose();
		}
	});

	it("keeps a named capture inside an unreached subtree and proposes the rest", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		try {
			layout(
				f,
				{
					"nm/doc/notes.md": "Reviewed deep.png\n",
					"nm/other/deep.png": "named\n",
					"nm/other/loose.png": "unnamed\n",
					"nm/junk/x.log": "junk\n",
				},
				["nm/doc"],
			);
			const plan = await planOne(f, "nm");
			const at = (name: string) => slashed(path.join(f.tempRoot, "nm", name));
			expect(plan.withheld).toBeNull();
			expect(plan.deleteFiles).toEqual([at("other/loose.png")]);
			expect(plan.deleteDirectories).toEqual([
				{ path: at("junk"), bytes: null },
			]);
			expect(plan.kept.captureNamedByText).toBe(1);
			console.log(
				"C3 PASS: nm/other/deep.png named by nm/doc/notes.md kept; loose.png proposed; nm/junk proposed whole",
			);
		} finally {
			f.dispose();
		}
	});

	it("deletes whole folders only through the link and worktree checks", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		const previousExit = process.exitCode;
		try {
			layout(
				f,
				{
					"internal/target/a.log": "a\n",
					"linked/a.log": "a\n",
					"part/keep/run.log": "kept\n",
					"part/scratch/b.log": "b\n",
				},
				["part/keep"],
			);
			const at = (name: string) => path.join(f.tempRoot, name);
			symlinkSync(at("internal/target"), at("internal/link"), "junction");
			const outside = path.join(f.run, "outside");
			mkdirSync(outside);
			writeFileSync(path.join(outside, "sentinel.txt"), "outside\n");
			symlinkSync(outside, at("linked/junction"), "junction");
			f.git(["worktree", "add", "--detach", at("registered"), "HEAD"]);
			const errors = vi.spyOn(console, "error").mockImplementation(() => {});
			const output = vi.spyOn(console, "log").mockImplementation(() => {});
			await pruneEvidence(
				{
					root: f.checkout,
					tempRoot: f.tempRoot,
					folders: ["internal", "linked", "part", "registered"].map(at),
				},
				{ checkout: f.checkout },
			);
			const failed = errors.mock.calls.flat().join("\n");
			const printed = output.mock.calls.flat().join("\n");
			vi.restoreAllMocks();
			expect(existsSync(at("internal"))).toBe(false);
			expect(existsSync(at("part/scratch"))).toBe(false);
			expect(existsSync(at("part/keep/run.log"))).toBe(true);
			expect(failed).toContain("unsafe or unmeasured links");
			expect(failed).toContain(`${slashed(at("linked/junction"))} -> `);
			expect(existsSync(at("linked/a.log"))).toBe(true);
			expect(existsSync(path.join(outside, "sentinel.txt"))).toBe(true);
			expect(failed).toContain("registered worktree");
			expect(existsSync(at("registered"))).toBe(true);
			expect(printed).toContain("PRUNE FAIL: 4 folders, 2 failures");
			console.log(
				"C3 PASS: internal-link folder and unreached part/scratch deleted; outside-link folder refused naming its junction; registered worktree refused",
			);
		} finally {
			vi.restoreAllMocks();
			process.exitCode = previousExit;
			f.dispose();
		}
	}, 60000);
});

describe("capture names in kept text", () => {
	it("reads a name as a token without spaces, or a quoted name with spaces", async () => {
		const f = checkoutFixture("gardener-prune-evidence-");
		try {
			const cases = [
				["see deep.png", "deep.png"],
				["- deep.png", "deep.png"],
				["Reviewed frame deep.png today", "deep.png"],
				["`my shot.png`", "my shot.png"],
				["frames/deep.png", "deep.png"],
			];
			const files = {};
			cases.forEach(([phrase, name], i) => {
				files[`n${i}/notes.md`] = `${phrase}\n`;
				files[`n${i}/frames/${name}`] = "named\n";
				files[`n${i}/frames/loose.png`] = "unnamed\n";
			});
			layout(
				f,
				files,
				cases.map((_, i) => `n${i}`),
			);
			for (const [i, [phrase]] of cases.entries()) {
				const plan = await planOne(f, `n${i}`);
				expect(plan.deleteFiles, phrase).toEqual([
					slashed(path.join(f.tempRoot, `n${i}`, "frames", "loose.png")),
				]);
				expect(plan.kept.captureNamedByText, phrase).toBe(1);
			}
			console.log(
				`ITEM 9 PASS: named capture kept for ${cases.map(([phrase]) => JSON.stringify(phrase)).join(", ")}`,
			);
		} finally {
			f.dispose();
		}
	});
});
