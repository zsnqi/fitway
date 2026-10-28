import { execFileSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkoutFixture } from "./checkout-test-fixture.mjs";
import { collectTrackedCitationRecords } from "./cited-evidence.mjs";
import { countNewTempScripts, planEvidencePrune } from "./prune-evidence.mjs";
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
	expect(byName("linked")?.withheld).toContain("unsafe");
	expect(byName("registered")?.withheld).toBe("registered worktree");
	expect(existsSync(shapes.outsideSentinel)).toBe(true);
}

function denyRead(file: string) {
	if (process.platform === "win32")
		execFileSync("icacls", [file, "/deny", "*S-1-1-0:(RD)"], {
			windowsHide: true,
		});
	else chmodSync(file, 0);
	expect(() => readFileSync(file)).toThrow();
}

async function planOne(f, name: string) {
	const records = await collectTrackedCitationRecords({ checkout: f.checkout });
	const [plan] = await planEvidencePrune({
		folderPaths: [path.join(f.tempRoot, name)],
		records,
		tempRoot: f.tempRoot,
	});
	return plan;
}

const slashed = (file: string) => file.replaceAll("\\", "/");

describe("evidence-safe temp pruning", () => {
	it("keeps every cited loss shape, names uncited captures, and withholds links and registered worktrees", async () => {
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
				"E1 PASS: cited folder kept log/cjs/100KB JSON/externally cited PNG; uncited PNG proposed; TSV nested citation kept; link withheld; registered worktree withheld",
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
