import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { agentContextEnding } from "../show-agent-context.mjs";
import {
	fixture,
	git,
	gitFixture,
	HANDOFF,
	MARKED,
	MILESTONE,
	put,
} from "./fixtures";
import { behindUpstreamWarning } from "./git-context.mjs";
import { validateResumePoint } from "./resume-point.mjs";

const roots: string[] = [];
const script = fileURLToPath(
	new URL("../show-agent-context.mjs", import.meta.url),
);
afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

describe("O2 and O3: current resume point and fetched upstream warning", () => {
	it("O2: prints one warning after the plan, reads fetched refs without network, and ends with O3 instruction", () => {
		const { root } = fixture(roots, true);
		gitFixture(root, true);
		const result = spawnSync(
			process.execPath,
			[script, "--", "--milestone", MILESTONE],
			{ cwd: root, encoding: "utf8", windowsHide: true },
		);
		expect(result.status, result.stderr).toBe(0);
		const warnings = result.stdout
			.split("\n")
			.filter((line) => line.startsWith("WARNING:"));
		expect(warnings).toEqual([
			"WARNING: branch feature/resume is behind origin/main by 1 commit(s); fetched refs only. Read the upstream resume point before continuing.",
		]);
		expect(result.stdout.indexOf(warnings[0])).toBeGreaterThan(
			result.stdout.indexOf("stop conditions:"),
		);
		expect(result.stdout.trim().split("\n").at(-1)).toBe(
			`Resume point: read ${HANDOFF} in full, then the standing-decisions files it names.`,
		);
	});
	it("O2: stays quiet when equal, ahead, without an upstream, detached, or outside Git", () => {
		const { root } = fixture(roots);
		expect(behindUpstreamWarning(root)).toBeNull();
		gitFixture(root);
		expect(behindUpstreamWarning(root)).toBeNull();
		git(root, "commit", "--allow-empty", "-m", "ahead");
		expect(behindUpstreamWarning(root)).toBeNull();
		git(root, "config", "--unset", "branch.feature/resume.remote");
		expect(behindUpstreamWarning(root)).toBeNull();
		git(root, "checkout", "--detach");
		expect(behindUpstreamWarning(root)).toBeNull();
	});
	it("O2: runs only ref-reading commands and ignores failed or malformed Git responses", () => {
		const commands: string[][] = [];
		const warning = behindUpstreamWarning(
			"fixture",
			(_root: string, args: string[]) => {
				commands.push(args);
				return commands.length === 1
					? "main"
					: commands.length === 2
						? "origin/main"
						: "2";
			},
		);
		expect(warning).toContain("by 2 commit(s)");
		expect(commands).toEqual([
			["symbolic-ref", "--quiet", "--short", "HEAD"],
			["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
			["rev-list", "--count", "HEAD..@{upstream}"],
		]);
		expect(behindUpstreamWarning("fixture", () => "not-a-count")).toBeNull();
		expect(
			behindUpstreamWarning("fixture", () => {
				throw new Error("unavailable");
			}),
		).toBeNull();
	});
	it.each([
		"",
		"\uFEFF",
		"# Prefix\n",
	])("S3: validator and context ending recognize the same marker with prefix %j", async (prefix) => {
		const { root } = fixture(roots, true);
		const completed = `${prefix}${MARKED}`
			.replaceAll("<branch>", "main")
			.replaceAll("<short sha>", "a1b2c3d")
			.replaceAll("<YYYY-MM-DD HH:MM>", "2026-10-02 20:40")
			.replaceAll("<absolute path>", "D:/fitway-temp/fixture")
			.replaceAll("<repo path>", "DECISIONS.md")
			.replaceAll("<repo path to the milestone's DECISIONS.md>", "DECISIONS.md")
			.replace(
				"What exists now and what was last delivered, with commit hashes.",
				"Delivered a1b2c3d.",
			)
			.replace(
				'Agents, Codex rounds or jobs in flight, and where their output will land. "Nothing." if none.',
				"Nothing.",
			)
			.replace(
				"Decided steps only, in order; each names its inputs by path and section.",
				"Read `DECISIONS.md`.",
			)
			.replace(
				'Questions or picks the user owes, each answerable in one line. "Nothing." if none.',
				"Nothing.",
			)
			.replace(
				/Traps the next session would otherwise rediscover: environment quirks, defects already in\s+the\s+baseline, assumptions not yet measured\./,
				"Nothing.",
			);
		put(root, "DECISIONS.md", "Standing decisions.\n");
		put(root, "docs/agent-context/WORKING_AGREEMENTS.md", "Agreements.\n");
		put(root, HANDOFF, completed);
		await expect(
			validateResumePoint({
				repositoryRoot: root,
				handoffPath: HANDOFF,
				bytes: Buffer.from(completed),
			}),
		).resolves.toBe(true);
		expect(
			await agentContextEnding({
				repositoryRoot: root,
				plan: `handoff: ${HANDOFF}`,
				warningImpl: () => null,
			}),
		).toContain(`read ${HANDOFF} in full`);
	});
	it("O3: reads only the current handoff and gives no instruction for legacy handoffs", async () => {
		const { root } = fixture(roots, true);
		const reads: string[] = [];
		const options = {
			repositoryRoot: root,
			plan: `handoff: ${HANDOFF}`,
			warningImpl: () => null,
			readFileImpl: async (file: string) => {
				reads.push(file);
				return readFileSync(file, "utf8");
			},
		};
		expect(await agentContextEnding(options)).toContain(
			`read ${HANDOFF} in full`,
		);
		expect(reads).toHaveLength(1);
		put(root, HANDOFF, "# Legacy\n");
		expect(await agentContextEnding(options)).toBe("");
		put(root, HANDOFF, `# Prefix\n${MARKED}`);
		expect(await agentContextEnding(options)).toContain(
			`read ${HANDOFF} in full`,
		);
		await expect(
			agentContextEnding({ ...options, plan: "handoff: missing.md" }),
		).rejects.toThrow(/missing repository path/);
	});
});
