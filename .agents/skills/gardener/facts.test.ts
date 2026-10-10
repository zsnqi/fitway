import { describe, expect, it } from "vitest";
import {
	activeBriefPointers,
	calledImports,
	classifyBranches,
	classifyFolders,
	classifyWorktrees,
	deadPaths,
	deletionTarget,
	duplicateRules,
	gateGaps,
	openBriefs,
	parseFastSteps,
	parseWorktreePorcelain,
	references,
} from "./facts.mjs";
import { collectRecords } from "./survey.mjs";

describe("gardener fixture classifications", () => {
	it("builds extended Windows deletion paths and refuses root, nested, escaped and shell-injected targets", () => {
		expect(deletionTarget("D:/fitway-temp/evidence.", "D:/fitway-temp")).toBe(
			"\\\\?\\D:\\fitway-temp\\evidence.",
		);
		expect(
			deletionTarget(`D:/fitway-temp/${"x".repeat(260)}`, "D:/fitway-temp"),
		).toContain("\\\\?\\D:\\fitway-temp\\");
		for (const value of [
			"D:/fitway-temp",
			"D:/fitway-temp/../elsewhere",
			"D:/fitway-temp/sub/child",
			"D:/fitway-temp/unsafe&name",
			"D:/fitway-temp/unsafe%name",
			"relative",
		]) {
			expect(() => deletionTarget(value, "D:/fitway-temp")).toThrow(/Unsafe/);
		}
	});
	it("follows the ledger's rolling report and rejects a missing/untracked active brief", async () => {
		const files: Record<string, string> = {
			"PROJECT_STATE.yaml":
				"milestones: {}\ngardener:\n  report: .agents/skills/gardener/REPORT.md\n",
			".agents/skills/gardener/REPORT.md":
				"Evidence D:/fitway-temp/prior-survey/REPORT.md",
		};
		const load = async (source: string, kind: string) => {
			if (!(source in files)) throw new Error(`ENOENT ${source}`);
			return { source, kind, text: files[source] };
		};
		const context = await collectRecords({ load, trackedFiles: [] });
		expect(
			references("D:/fitway-temp/prior-survey", context.records),
		).toHaveLength(1);
		delete files[".agents/skills/gardener/REPORT.md"];
		await expect(collectRecords({ load, trackedFiles: [] })).rejects.toThrow(
			/ENOENT/,
		);
		files["PROJECT_STATE.yaml"] =
			"milestones:\n  active:\n    handoff: docs/resume.md\n    taskPacket: docs/packet.yaml\n";
		files["docs/resume.md"] =
			"## Running now\nBrief `docs/briefs/missing.md`\n";
		files["docs/packet.yaml"] = "status: ACTIVE";
		await expect(collectRecords({ load, trackedFiles: [] })).rejects.toThrow(
			/missing or untracked/,
		);
		files["docs/briefs/missing.md"] = "# Plain text, no brief marker";
		await expect(
			collectRecords({ load, trackedFiles: ["docs/briefs/missing.md"] }),
		).rejects.toThrow(/brief-format/);
	});
	const records = [
		{
			source: "resume.md",
			text: "Keep branch `active/topic` and D:/fitway-temp/keep/REPORT.md",
		},
	];
	it("protects named branches, symbolic refs, main and registered worktrees", () => {
		const input = ["main", "old", "active/topic", "busy", "unmerged"].map(
			(name) => ({
				name,
				plain: name,
				ref: `refs/heads/${name}`,
				merged: name !== "unmerged",
			}),
		);
		input.push({
			name: "origin/old",
			plain: "old",
			ref: "refs/remotes/origin/old",
			merged: true,
		});
		const result = classifyBranches(input, records, [
			{ branch: "refs/heads/busy", path: "D:/busy" },
		]);
		expect(
			result.filter((item) => item.candidate).map((item) => item.name),
		).toEqual(["old", "origin/old"]);
		expect(
			classifyBranches(
				[
					{
						name: "origin/HEAD",
						plain: "HEAD",
						merged: true,
						symbolic: "refs/remotes/origin/main",
					},
				],
				[],
				[],
			).some((item) => item.candidate),
		).toBe(false);
		expect(
			references("origin/active/topic", records, { branch: true }).length,
		).toBe(1);
		expect(
			classifyBranches(
				[{ name: "origin/topic", plain: "topic", remote: true, merged: true }],
				[{ source: "resume", text: "Keep `origin/topic`" }],
				[],
			)[0].candidate,
		).toBe(false);
		expect(
			classifyBranches(
				[
					{
						name: "upstream/topic",
						plain: "topic",
						remote: true,
						merged: true,
					},
				],
				[{ source: "resume", text: "Keep branch `topic`" }],
				[],
			)[0].candidate,
		).toBe(false);
		expect(
			references("old", [{ source: "x", text: "folder older/" }], {
				branch: true,
			}),
		).toEqual([]);
	});
	it("distinguishes missing, dirty, detached, protected and merged worktrees", () => {
		const raw = parseWorktreePorcelain(
			"worktree D:/missing\nHEAD abc\nbranch refs/heads/old\n\nworktree D:/clean\nHEAD abc\ndetached\n\n",
		);
		expect(raw[0].path).toBe("D:/missing");
		const trees = classifyWorktrees(
			[
				{ ...raw[0], exists: false },
				{
					...raw[1],
					exists: true,
					merged: true,
					status: "",
					linksMeasured: true,
					links: [],
					linkErrors: [],
				},
				{ path: "D:/dirty", exists: true, merged: true, status: "?? new.txt" },
				{ path: "D:/current", exists: true, merged: true, status: "" },
				{
					path: "D:/locked",
					exists: true,
					merged: true,
					status: "",
					locked: true,
				},
				{
					path: "D:/active",
					branch: "refs/heads/active/topic",
					exists: true,
					merged: true,
					status: "",
				},
			],
			records,
			"D:/current",
		);
		expect(
			trees.filter((item) => item.missing).map((item) => item.path),
		).toEqual(["D:/missing"]);
		expect(
			trees.filter((item) => item.candidate).map((item) => item.path),
		).toEqual(["D:/clean"]);
	});
	it("protects referenced evidence and excludes links, errors, outside folders and dirty worktrees", () => {
		const now = Date.parse("2026-10-07T00:00:00Z");
		const folder = (name: string, change = {}) => ({
			path: `D:/fitway-temp/${name}`,
			bytes: 10,
			modifiedAt: "2026-09-28T00:00:00Z",
			errors: [],
			...change,
		});
		const trees = [{ path: "D:/fitway-temp/dirty/tree", candidate: false }];
		const result = classifyFolders(
			[
				folder("keep"),
				folder("old"),
				folder("evidence."),
				folder("dirty"),
				folder("link", { link: true }),
				folder("bad", { errors: ["EACCES"] }),
				folder("outside", { path: "D:/elsewhere/old" }),
			],
			records,
			trees,
			"D:/fitway-temp",
			now,
		);
		expect(
			result.filter((item) => item.candidate).map((item) => item.path),
		).toEqual(["D:/fitway-temp/old", "D:/fitway-temp/evidence."]);
		expect(result[1].ageDays).toBe(9);
		expect(
			classifyFolders(
				[
					folder("clone", { gitRoots: ["D:/fitway-temp/clone/repo"] }),
					folder("links", { skippedLinks: 1 }),
				],
				[],
				[],
				"D:/fitway-temp",
				now,
			).some((item) => item.candidate),
		).toBe(false);
		expect(
			references("D:/fitway-temp/old", [
				{
					source: "brief",
					text: "Work in D:/fitway-temp/<run>/; set TEMP=D:/fitway-temp",
				},
			]),
		).toEqual([]);
		expect(
			references("D:/fitway-temp/keep/child", [
				{ source: "x", text: "D:/fitway-temp/keep/" },
			]).length,
		).toBe(1);
	});
	it("finds duplicate long lines across homes with source line evidence", () => {
		const rule =
			"A repeated policy rule whose length exceeds forty characters.";
		expect(duplicateRules([{ source: "a", text: `${rule}\n${rule}` }])).toEqual(
			[],
		);
		const duplicates = duplicateRules([
			{ source: "a", text: `short\n${rule}` },
			{ source: "b", text: rule },
		]);
		expect(duplicates[0].locations).toEqual([
			{ source: "a", line: 2 },
			{ source: "b", line: 1 },
		]);
	});
	it("detects dead relative/absolute paths without treating a branch or URL as a path", () => {
		const homes = [
			{
				source: "AGENTS.md",
				text: "Read `docs/gone.md:22`, `docs/live.md` and `AGENTS.md`.\nKeep `D:/fitway-temp/missing/` and `codex/topic`.\nSee https://example.com/page\nTemplate D:/fitway-temp/<run>/",
			},
		];
		const result = deadPaths(
			homes,
			(value: string) => ["docs/live.md", "AGENTS.md"].includes(value),
			[{ name: "codex/topic" }],
		);
		expect(result.map((item) => item.path)).toEqual([
			"docs/gone.md",
			"D:/fitway-temp/missing",
		]);
		expect(
			deadPaths(
				[
					{
						source: "x",
						text: "Use `DECISIONS.md`; behavior/content/hierarchy. <repo path to REPORT.md>",
					},
				],
				() => false,
				[],
				["docs/phase/DECISIONS.md"],
			),
		).toEqual([]);
	});
	it("finds unused checks and duplicate nested gates from a fixture ladder", () => {
		const steps = parseFastSteps(
			'function fastSteps() { return [["Repository", ["check:repository"]], ["Context", ["check:context"]], ["Tokens", ["exec", "node", "tokens.mjs"]], ["Tests", ["test"]]]; }',
		);
		const gaps = gateGaps(
			{
				"check:repository": "node repo.mjs",
				"check:context": "node context.mjs",
				"check:tokens": "node tokens.mjs",
				"check:local": "node local.mjs",
				test: "vitest run",
			},
			steps,
			{ "check:repository": ["check:context"] },
		);
		expect(gaps.missing.map((item) => item.name)).toEqual(["check:local"]);
		expect(gaps.duplicates[0].name).toBe("check:context");
		expect(gaps.duplicates[0].trails).toHaveLength(2);
		expect(() =>
			parseFastSteps("function fastSteps(){return getSteps()}"),
		).toThrow(/return array is not literal/);
		expect(
			calledImports(
				'import { check } from "./context.mjs"; import { unused } from "./unused.mjs"; check();',
			),
		).toEqual(["./context.mjs"]);
	});
	it("selects only running/next briefs and ignores completed-round mentions", () => {
		const briefs = [4, 6, 7].map((round) => ({
			source: `briefs/round-${round}.md`,
			text: `# Codex brief: ${round === 7 ? "a permanent gardener" : "verification"} (phase, round ${round})`,
		}));
		const result = openBriefs(
			[
				{
					source: "resume.md",
					kind: "resume",
					text: "## State\nRound 4 is done.\n## Running now\nNothing.\n## Next steps\n1. Round 6, draft ready.\n2. The gardener (brief drafted).\n## Pointers\nRound 4.",
				},
			],
			briefs,
		);
		expect(result.map((item) => item.source)).toEqual([
			"briefs/round-6.md",
			"briefs/round-7.md",
		]);
		expect(
			activeBriefPointers([
				{
					source: "resume",
					kind: "resume",
					text: "## State\nDone docs/briefs/old.md\n## Running now\nRun `docs/briefs/missing.md`\n## Next steps\nbrief: `docs/new.md`",
				},
			]).map((item) => item.path),
		).toEqual(["docs/briefs/missing.md", "docs/new.md"]);
		expect(
			references("D:/fitway-temp/prior-survey", [
				{
					source: ".agents/skills/gardener/REPORT.md",
					text: "Survey evidence: D:/fitway-temp/prior-survey/REPORT.md",
				},
			]),
		).toHaveLength(1);
	});
});
