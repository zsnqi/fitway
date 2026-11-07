import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	argumentKeys,
	expectedArgs,
	fallbackEvidenceEvent,
	fallbackReportMessage,
	fixture,
	git,
	outcomeIdsFromBrief,
	refused,
	repository,
	samePath,
	thread,
} from "./codex-round-test-support.ts";

const briefOutcomeIds = [
	["codex-deepseek-route.md", ["D1", "D2", "D3", "D4", "D5", "D6"]],
	["codex-gardener-shared-files.md", ["G1", "G2", "G3", "L1", "L2"]],
	["codex-gardener-shared-files-fix.md", ["X1", "X2", "X3", "L1", "L2"]],
	["codex-launch-review.md", ["R1", "R2", "L1", "L2", "L3"]],
	["codex-launcher-fixes.md", ["A1", "A2", "A3", "A4", "L1", "L2"]],
	["codex-launcher-fixes-2.md", ["K1", "K2", "K3", "L1", "L2"]],
	["codex-launcher-fixes-3.md", ["K1", "K2", "K3", "L1", "L2"]],
	[
		"codex-midmotion-compare.md",
		[
			"T1",
			"T2",
			"T3",
			"T4",
			"T5",
			"T6",
			"T7",
			"T8",
			"T9",
			"L1",
			"L2",
			"L3",
			"L4",
		],
	],
	[
		"codex-midmotion-compare-fix.md",
		["X1", "X2", "X3", "X4", "X6", "X5", "L1", "L2", "L3"],
	],
	["codex-shared-frame-continue-2.md", ["R1", "R2", "R3", "R4"]],
	["codex-tuner-removal.md", ["T1", "T2", "T3", "T4", "T5", "L1", "L2", "L3"]],
	["codex-tuner-removal-continue.md", ["R1", "R2", "T2", "T5"]],
	["codex-tuner-removal-fix.md", ["C1", "C2", "L1", "L2"]],
	[
		"codex-vf-fixes.md",
		["V1", "V2", "V3", "V4", "V5", "V6", "V7", "L1", "L2", "L3"],
	],
	["codex-vf-fixes-continue.md", ["R1", "R2", "V1"]],
	["codex-vf-hold.md", ["H1", "H2", "H3", "L1", "L2", "L3", "L4"]],
	["codex-vf-parallel.md", ["P1", "P2", "P3", "P4", "L1", "L2", "L3"]],
	["codex-vf-parallel-continue.md", ["R1", "R2", "R3"]],
	["codex-vf-parallel-continue-2.md", ["R1", "R2", "R3", "R4", "R5"]],
	["codex-vf-speed.md", ["S1", "S2", "S3", "S4", "L1", "L2", "L3"]],
] as const;

const briefRoot = path.join(
	repository,
	"scripts/agent-environment/fixtures/brief-outcomes",
);

describe("L1 launch", () => {
	it("runs brief:check first and launches nothing for a failing brief", () => {
		const f = fixture();
		writeFileSync(f.brief, "broken brief\n");
		refused(
			f,
			f.invoke([f.brief, "invalid", "--run", f.run]),
			"brief:check failed",
		);
		expect(existsSync(f.run)).toBe(false);
	});
	it("refuses a brief with no outcome IDs before its review starts", () => {
		const f = fixture();
		writeFileSync(
			f.brief,
			f.bytes
				.toString("utf8")
				.replace(
					"\n## Causes and required outcomes\n\n- **K1.** Fixture outcome.\n",
					"\n",
				),
		);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "remove outcome ids");
		const result = f.invoke([f.brief, "high", "--new-review", "--run", f.run]);
		refused(f, result, "brief has no outcome IDs");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.run)).toBe(false);
	});
	it("finds outcome IDs in every r04 brief, pinned or added later", () => {
		// The frozen fixture set may grow; a new fixture must yield IDs without
		// editing this test (F129's pinned-list failure, again on 8c642ad8).
		const names = readdirSync(briefRoot).filter((name) => name.endsWith(".md"));
		expect(names).toEqual(
			expect.arrayContaining(briefOutcomeIds.map(([name]) => name)),
		);
		for (const name of names)
			expect(
				outcomeIdsFromBrief(readFileSync(path.join(briefRoot, name))).size,
				name,
			).toBeGreaterThan(0);
	});
	it.each(briefOutcomeIds)("finds every outcome ID in %s", (name, expected) => {
		expect(
			[...outcomeIdsFromBrief(readFileSync(path.join(briefRoot, name)))].sort(),
		).toEqual([...expected].sort());
	});
	it("ignores outcome IDs inside the environment block and fenced code", () => {
		expect(
			[
				...outcomeIdsFromBrief(`- **A1.** Closed after the ID.
- **B2. A reading's own lists.**
- **C3** No full stop is not an ID.
- **D4. Missing bold close is not an ID.

<!-- environment:start v1 -->
- **E5.** Environment example.
<!-- environment:end -->

\`\`\`markdown
- **F6.** Fenced example.
\`\`\`
`),
			].sort(),
		).toEqual(["A1", "B2"]);
	});
	it("keeps exact HEAD input, argument order, events, last message, run folder and thread id", async () => {
		const f = fixture();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(result.stdout).toContain("PASS brief:check");
		expect(result.stdout.match(/Run folder: /g)).toHaveLength(1);
		const reportedRun = result.stdout.match(/^Run folder: (.+)\r?$/m)?.[1];
		expect(reportedRun).toBeDefined();
		expect(await samePath(reportedRun, f.run)).toBe(true);
		expect(result.stdout.match(/Thread id: /g)).toHaveLength(1);
		expect(result.stdout).toContain(`Thread id: ${thread}`);
		expect(await argumentKeys(f.captured().args)).toEqual(
			await argumentKeys(expectedArgs(f, "last-message.md")),
		);
		expect(await samePath(f.captured().cwd, f.worktree)).toBe(true);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		expect(readFileSync(path.join(f.run, "input.md"))).toEqual(f.bytes);
		expect(readFileSync(path.join(f.run, "last-message.md"), "utf8")).toBe(
			fallbackReportMessage("stand-in last message"),
		);
		expect(readFileSync(path.join(f.run, "events.jsonl"), "utf8")).toBe(
			`{"type":"thread.started","thread_id":"${thread}"}\n${fallbackEvidenceEvent()}{"type":"item.completed","text":"العربية «»"}\r\n`,
		);
		expect(git(f.worktree, "status", "--short")).toBe("");
	});
	it("prefixes exactly the agreement note when HEAD is later", () => {
		const f = fixture();
		const head = f.laterHead();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(
			Buffer.concat([
				Buffer.from(
					`Launch note: HEAD ${head} only adds this brief over the named HEAD.\n\n`,
				),
				f.bytes,
			]),
		);
	});
	it("returns Codex's exit code, retaining stopped-run evidence", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		expect(existsSync(path.join(f.run, "events.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, ".running"))).toBe(false);
	});
});
