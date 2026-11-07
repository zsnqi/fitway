import { writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	claimBrief,
	claimEvidence,
	claimInvoke,
	claimOutput,
	claimReport,
	claimResumeLog,
	cleanStop,
	expectAcceptedClaimRun,
	expectResumedClaimMessage,
	expectResumedClaimRun,
} from "./codex-round-report-support.ts";
import { commandEvent, fixture } from "./codex-round-test-support.ts";
import { git } from "./fixtures";

describe("L3 report claims", () => {
	it("X2 guard accepts a root-commit result header", () => {
		const f = fixture();
		const result = claimInvoke(
			f,
			commandEvent(
				"git commit -m claim-fixture",
				0,
				"[fixture (root-commit) __HEAD_SHORT__] claim fixture",
			) + commandEvent("node scripts/verify.mjs fast"),
		);
		expectAcceptedClaimRun(f, result);
	});

	it("X3 ignores worktree HEAD named only on a non-commit line", () => {
		const f = fixture();
		const result = claimInvoke(
			f,
			commandEvent("git commit -m claim-fixture", 0, claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
			`Base commit: \`${f.head}\`\n${claimReport("__HEAD__")}`,
		);
		expectAcceptedClaimRun(f, result);
	});

	it("X3 guard ignores the real HEAD cited only outside the commit line", () => {
		const f = fixture();
		const result = claimInvoke(
			f,
			commandEvent("git commit -m claim-fixture", 0, claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
			`The real HEAD is ${f.head}.\n${claimReport("68e863793e6f")}`,
		);
		const entry = expectResumedClaimRun(f, result);
		expect(entry.claimFailures.join("\n")).toContain("no such commit object");
	});

	it("V1 rejects a HEAD that does not descend from the launch HEAD", () => {
		const f = fixture();
		claimBrief(f);
		git(f.worktree, "checkout", "--orphan", "other");
		writeFileSync(path.join(f.worktree, "other.txt"), "other branch");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "other branch");
		const otherHead = git(f.worktree, "rev-parse", "HEAD");
		git(f.worktree, "checkout", "fixture");

		const result = f.invoke(undefined, {
			ROUND_COMMIT: "claim fixture",
			ROUND_RESET_HARD: otherHead,
			ROUND_MESSAGE: claimReport("__HEAD__"),
			ROUND_EVENTS:
				claimEvidence + commandEvent("node scripts/verify.mjs fast"),
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		expectResumedClaimMessage(f, result, "does not descend from launch HEAD");
	});

	it("V1 rejects an empty commit whose diff against the launch HEAD is empty", () => {
		const f = fixture();
		claimBrief(f);
		const result = f.invoke(undefined, {
			ROUND_COMMIT: "claim fixture",
			ROUND_MESSAGE: claimReport("__HEAD__"),
			ROUND_EVENTS:
				claimEvidence + commandEvent("node scripts/verify.mjs fast"),
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		expectResumedClaimMessage(f, result, "empty diff against launch HEAD");
	});

	it("W3 keeps the launch-HEAD refusal without an empty-diff failure", () => {
		const f = fixture();
		claimBrief(f);
		const result = f.invoke(undefined, {
			ROUND_EVENTS: claimEvidence,
			ROUND_MESSAGE: claimReport(f.head),
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		const entry = expectResumedClaimRun(f, result);
		expect(entry.claimFailures).toEqual([
			`commit ${f.head}: equals launch HEAD ${f.head}`,
			"commit: no successful git commit command with exit code 0 is recorded in this run's events",
			"verify.mjs fast: PASS is claimed for L2 without a successful fast-ladder command in this run's events",
		]);
	});

	it("rejects the measured false report with no commit or ladder evidence", () => {
		const f = fixture();
		claimBrief(f);
		const result = f.invoke(undefined, {
			ROUND_EVENTS: claimEvidence,
			ROUND_MESSAGE: claimReport("68e863793e6f"),
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		const entry = expectResumedClaimRun(f, result);
		expect(entry.claimFailures).toEqual(
			expect.arrayContaining([
				expect.stringContaining("no such commit object"),
				expect.stringContaining("without a successful fast-ladder command"),
			]),
		);
	});

	it("checks a STOPPED report's false PASS claims", () => {
		const f = fixture();
		claimBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: `STOPPED: could not finish\n${[
				"```report",
				JSON.stringify({
					id: "L2",
					status: "PASS",
					command: "not run",
					output: "L2: PASS",
				}),
				"```",
			].join("\n")}\n`,
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		const entry = expectResumedClaimRun(f, result);
		expect(entry.claimFailures).toEqual(
			expect.arrayContaining([
				expect.stringContaining("without a successful fast-ladder command"),
			]),
		);
	});

	it.each<
		[string, (f: ReturnType<typeof fixture>) => NodeJS.ProcessEnv, string]
	>([
		[
			"a missing commit object",
			() => ({ ROUND_MESSAGE: claimReport("68e863793e6f") }),
			"no such commit object",
		],
		[
			"a commit that is not worktree HEAD",
			(f) => ({
				ROUND_COMMIT: "claim fixture",
				ROUND_MESSAGE: claimReport(f.head),
				ROUND_EVENTS: commandEvent("node scripts/verify.mjs fast"),
			}),
			"not worktree HEAD",
		],
		[
			"a commit equal to launch HEAD",
			(f) => ({
				ROUND_COMMIT: "claim fixture",
				ROUND_MESSAGE: claimReport(f.head),
				ROUND_EVENTS: commandEvent("node scripts/verify.mjs fast"),
			}),
			"equals launch HEAD",
		],
		[
			"no successful git commit event",
			() => ({
				ROUND_COMMIT: "claim fixture",
				ROUND_NO_COMMIT_EVENT: "1",
				ROUND_MESSAGE: claimReport("__HEAD__"),
				ROUND_EVENTS: commandEvent("node scripts/verify.mjs fast"),
			}),
			"no successful git commit command",
		],
		[
			"a dirty worktree",
			(f) => ({
				ROUND_COMMIT: "claim fixture",
				ROUND_MESSAGE: claimReport("__HEAD__"),
				ROUND_EVENTS: commandEvent("node scripts/verify.mjs fast"),
				ROUND_WRITE_PATH: path.join(f.worktree, "dirty.txt"),
				ROUND_WRITE_CONTENT: Buffer.from("dirty").toString("base64"),
			}),
			"worktree is not clean",
		],
		[
			"no fast-ladder event",
			() => ({
				ROUND_COMMIT: "claim fixture",
				ROUND_MESSAGE: claimReport("__HEAD__"),
			}),
			"without a successful fast-ladder command",
		],
		[
			"a fast-ladder event before the commit",
			() => ({
				ROUND_COMMIT: "claim fixture",
				ROUND_MESSAGE: claimReport("__HEAD__"),
				ROUND_PRE_EVENTS: commandEvent("node scripts/verify.mjs fast"),
			}),
			"precedes the last successful git commit",
		],
	])("rejects %s", (_name, environment, expected) => {
		const f = fixture();
		claimBrief(f);
		const settings = environment(f);
		const result = f.invoke(undefined, {
			...settings,
			ROUND_EVENTS: claimEvidence + (settings.ROUND_EVENTS ?? ""),
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toContain("resume");
		const message = Buffer.from(f.captured().input, "base64").toString("utf8");
		expect(message).toContain(expected);
		const [entry] = claimResumeLog(f);
		expect(entry.claimFailures.join("\n")).toContain(expected);
	});
});
