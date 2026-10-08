import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
import * as facts from "./facts.mjs";
import * as survey from "./survey.mjs";

const rollingSource = ".agents/skills/gardener/REPORT.md";
const ledger =
	"milestones:\n  active:\n    handoff: docs/resume.md\n    taskPacket: docs/packet.yaml\n";
const gardenerEntry = `gardener:\n  date: '2026-10-08'\n  outcome: clean\n  report: ${rollingSource}\n`;

async function memoryRecords(text: string, overrides = {}) {
	const files: Record<string, string> = {
		"PROJECT_STATE.yaml": text,
		"docs/resume.md": "# Active resume\n",
		"docs/packet.yaml": "status: ACTIVE\n",
		[rollingSource]: "# Gardener evidence\n",
		...overrides,
	};
	return survey.collectRecords({
		trackedFiles: Object.keys(files),
		load: async (source: string, kind: string) => ({
			source,
			kind,
			text: files[source],
			sha256: createHash("sha256").update(files[source]).digest("hex"),
		}),
	});
}

describe("gardener round 12", () => {
	it("G1: only gardener bookkeeping is exempt; changed, added and removed records are named", async () => {
		const original = (await memoryRecords(ledger)).records;
		for (const text of [
			ledger + gardenerEntry,
			gardenerEntry + ledger,
			ledger +
				gardenerEntry
					.replace("2026-10-08", "2026-10-09")
					.replace("clean", "changed"),
		]) {
			const current = (await memoryRecords(text)).records;
			expect(current[0].sha256).toBe(original[0].sha256);
			expect(facts.changedRecords(original, current)).toEqual([]);
		}
		const changedLedger = (await memoryRecords(`${ledger}version: 2\n`))
			.records;
		expect(facts.changedRecords(original, changedLedger)).toEqual([
			"PROJECT_STATE.yaml",
		]);
		for (const text of [
			`${ledger}# Open record comment changed\n`,
			ledger.replace("active:", "another:"),
			ledger.replace("  active:", "   active:"),
		]) {
			expect(
				facts.changedRecords(original, (await memoryRecords(text)).records),
			).toEqual(["PROJECT_STATE.yaml"]);
		}
		for (const source of [
			"docs/resume.md",
			"docs/packet.yaml",
			rollingSource,
		]) {
			const changed = (await memoryRecords(ledger, { [source]: "changed\n" }))
				.records;
			expect(facts.changedRecords(original, changed)).toEqual([source]);
			expect(
				facts.changedRecords(
					original,
					original.filter((item) => item.source !== source),
				),
			).toEqual([source]);
		}
		expect(
			facts.changedRecords(original, [
				...original,
				{ source: "new.md", sha256: "new" },
			]),
		).toEqual(["new.md"]);
		const flow = "{ milestones: {} }\n";
		for (const text of [
			"{ milestones: {}, gardener: { outcome: clean } }\n",
			"{ gardener: { outcome: changed }, milestones: {} }\n",
		])
			expect(facts.ledgerHash(text)).toBe(facts.ledgerHash(flow));
		expect(
			facts.ledgerHash(flow.replace("milestones:", "milestones: ")),
		).not.toBe(facts.ledgerHash(flow));
		const aliased = `${ledger}gardener: &entry { outcome: clean }\nopenField: *entry\n`;
		expect(facts.ledgerHash(aliased.replace("clean", "changed"))).not.toBe(
			facts.ledgerHash(aliased),
		);
		console.log(
			"G1 PROOF: gardener insert/update exempt; all other record changes named",
		);
	});

	it("G2: review worktrees are named without blocking; genuine blockers remain", () => {
		const worktrees = facts.classifyWorktrees(
			[
				{
					path: "D:/old-clean",
					branch: "refs/heads/old-clean",
					exists: true,
					merged: false,
					status: "",
					lastCommitAt: "2000-01-01T00:00:00Z",
				},
				{
					path: "D:/old-dirty",
					branch: "refs/heads/old-dirty",
					exists: true,
					merged: false,
					status: " M file.txt",
					lastCommitAt: "2000-01-02T00:00:00Z",
				},
			],
			[],
			"D:/current",
		);
		expect(
			worktrees.every((item) => item.coordinatorReview && !item.candidate),
		).toBe(true);
		const report = {
			date: "2026-10-08",
			checkout: "D:/current",
			complete: true,
			repositoryUnchanged: true,
			checks: [{ exitCode: 0 }],
			gates: { missing: [], duplicates: [] },
			rules: { duplicates: [], dead: [] },
			folders: [],
			git: {
				worktrees,
				branches: [],
				trunk: { ref: "origin/main", commit: "abc" },
			},
		};
		const rendered = survey.formatReport(report);
		expect(rendered).toContain("## Worktrees awaiting review");
		const section = rendered
			.split("## Worktrees awaiting review")[1]
			.split("## ")[0];
		for (const item of worktrees) {
			for (const value of [
				item.path,
				item.branch,
				item.lastCommitAt,
				item.status || "clean",
			])
				expect(section).toContain(value);
		}
		expect(survey.surveyOutcome(report)).toBe("clean");
		expect(
			survey.consoleSummary(
				{ ...report, outcome: survey.surveyOutcome(report) },
				"D:/out",
			),
		).toContain("2 worktrees await coordinator review");
		for (const patch of [
			{ complete: false },
			{ checks: [{ exitCode: 1 }] },
			{ folders: [{ candidate: true }] },
			{
				git: {
					...report.git,
					worktrees: [{ ...worktrees[0], statusMeasured: false }],
				},
			},
			{
				git: { ...report.git, worktrees: [{ ...worktrees[0], missing: true }] },
			},
			{
				git: {
					...report.git,
					worktrees: [{ ...worktrees[0], candidate: true }],
				},
			},
		])
			expect(survey.surveyOutcome({ ...report, ...patch })).toBe("blocked");
		console.log(
			"G2 PROOF: 2 worktrees await coordinator review; outcome clean; real blockers retained",
		);
	});

	it("G3: one configured weekly path and relocated weekly invocations never qualify for removal", () => {
		const relocated = "D:/moved/weekly";
		const worktree = {
			path: relocated,
			branch: "refs/heads/custom-weekly",
			exists: true,
			merged: true,
			status: "",
		};
		expect(
			facts.classifyWorktrees([worktree], [], "D:/other", relocated)[0],
		).toMatchObject({ self: true, candidate: false });
		expect(facts.classifyWorktrees([worktree], [], relocated)[0]).toMatchObject(
			{ self: true, candidate: false },
		);
		const config = JSON.parse(
			readFileSync(new URL("./config.json", import.meta.url), "utf8"),
		);
		expect(
			facts.classifyWorktrees(
				[{ ...worktree, path: config.weeklyWorktree }],
				[],
				"D:/other",
				config.weeklyWorktree,
			)[0].candidate,
		).toBe(false);
		vi.stubEnv("FITWAY_GARDENER_WORKTREE", relocated);
		try {
			expect(
				facts.classifyWorktrees([worktree], [], "D:/other")[0],
			).toMatchObject({ self: true, candidate: false });
		} finally {
			vi.unstubAllEnvs();
		}
		const launcher = readFileSync(
			new URL(
				"../../../scripts/agent-environment/gardener-weekly.ps1",
				import.meta.url,
			),
			"utf8",
		);
		expect(launcher).toContain(".agents/skills/gardener/config.json");
		expect(launcher).toContain("$env:FITWAY_GARDENER_WORKTREE =");
		expect(launcher).not.toContain(config.weeklyWorktree);
		console.log(
			"G3 PROOF: shared config used by launcher; relocated weekly and invoking checkout excluded",
		);
	});

	it("G5: generated cleanup survives ledger entry, then refuses a changed resume on disposable folders", async () => {
		const base = process.env.GARDENER_TEST_RUN ?? os.tmpdir();
		mkdirSync(base, { recursive: true });
		const run = mkdtempSync(path.join(base, "gardener-r12-"));
		try {
			const checkout = path.join(run, "checkout");
			const tempRoot = path.join(run, "inventory");
			mkdirSync(checkout);
			mkdirSync(tempRoot);
			const git = (args: string[]) =>
				execFileSync("git", args, {
					cwd: checkout,
					encoding: "utf8",
					windowsHide: true,
				});
			git(["init", "--initial-branch=main"]);
			for (const [source, text] of Object.entries({
				"PROJECT_STATE.yaml": ledger,
				"docs/resume.md": "# Resume\n",
				"docs/packet.yaml": "status: ACTIVE\n",
				[rollingSource]: "# Evidence\n",
			})) {
				mkdirSync(path.dirname(path.join(checkout, source)), {
					recursive: true,
				});
				writeFileSync(path.join(checkout, source), text);
			}
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
			for (const name of ["after-entry", "after-resume"]) {
				const folder = path.join(tempRoot, name);
				mkdirSync(folder);
				const old = new Date(Date.now() - 10 * 86400000);
				utimesSync(folder, old, old);
			}
			const context = await survey.collectRecords({ checkout });
			const folders = await survey.collectFolders(
				context.records,
				[],
				path.join(run, "out"),
				tempRoot,
			);
			expect(folders.every((item) => item.candidate)).toBe(true);
			const scripts = folders.map((folder, index) => {
				const script = path.join(run, `cleanup-${index}.mjs`);
				writeFileSync(
					script,
					survey.cleanupScript(
						{
							root: checkout,
							tempRoot,
							records: context.records,
							folders: [folder],
						},
						checkout,
					),
				);
				return script;
			});
			writeFileSync(
				path.join(checkout, "PROJECT_STATE.yaml"),
				ledger + gardenerEntry,
			);
			const output = execFileSync(process.execPath, [scripts[0]], {
				encoding: "utf8",
				windowsHide: true,
			});
			expect(output).toContain("CLEANUP PASS: 1 proposed folders, 0 failures");
			expect(existsSync(folders[0].path)).toBe(false);
			writeFileSync(
				path.join(checkout, "docs/resume.md"),
				"# Changed resume\n",
			);
			let refused = "";
			try {
				execFileSync(process.execPath, [scripts[1]], {
					encoding: "utf8",
					windowsHide: true,
					stdio: "pipe",
				});
			} catch (error) {
				const failure = error as {
					stdout: string;
					stderr: string;
					status: number;
				};
				expect(failure.status).toBe(1);
				refused = `${failure.stdout}${failure.stderr}`;
			}
			expect(refused).toContain(
				"Open records changed: docs/resume.md; run a fresh survey",
			);
			expect(existsSync(folders[1].path)).toBe(true);
			console.log(
				`G5 PROOF: ${output.trim().split(/\r?\n/).at(-1)} after gardener entry; Open records changed: docs/resume.md; folder retained; fixture ${run}`,
			);
		} finally {
			expect(path.dirname(run)).toBe(path.resolve(base));
			expect(path.basename(run)).toMatch(/^gardener-r12-/);
			rmSync(run, { recursive: true, force: true });
		}
	});
});
