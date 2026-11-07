import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	claimBrief,
	claimEvidence,
	claimInvoke,
	claimInvokeReport,
	claimOutput,
	claimReport,
	cleanStop,
	expectAcceptedClaimRun,
	expectMissingCommitAndLadder,
	expectResumedClaimFailure,
	expectResumedClaimRun,
} from "./codex-round-report-support.ts";
import {
	commandEvent,
	fixture,
	jsonLinesIfPresent,
} from "./codex-round-test-support.ts";

describe("L3 report claims", () => {
	it("accepts a report-only brief that names no commit", () => {
		const f = fixture();
		claimBrief(f, { verify: false, commit: false });
		const result = f.invoke(undefined, {
			ROUND_EVENTS: claimEvidence,
			ROUND_MESSAGE: claimReport(),
		});
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).not.toContain("resume");
		const turns = jsonLinesIfPresent(path.join(f.run, "turns.jsonl"));
		expect(turns.at(-1)).toMatchObject({ stopReason: "report accepted" });
		expect(existsSync(path.join(f.run, "auto-resumes.log"))).toBe(false);
		expect(readFileSync(path.join(f.run, "turns.jsonl"), "utf8")).toContain(
			'"stopReason":"report accepted"',
		);
	});

	it("W1 accepts a grading report that names the launch HEAD and quotes the ladder outcome", () => {
		const f = fixture();
		claimBrief(f, { commit: false });
		const result = f.invoke(undefined, {
			ROUND_EVENTS: claimEvidence,
			ROUND_MESSAGE: `Base commit: \`${f.head}\`\n${claimReport()}`,
			ROUND_RESUME_MESSAGE: cleanStop,
		});
		expect(result.status, result.output).toBe(0);
		expectAcceptedClaimRun(f, result);
	});

	it("accepts a report backed by the commit and fast-ladder events", () => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			claimReport("__HEAD__"),
			commandEvent(
				"powershell.exe -Command 'git commit -m claim-fixture'",
				0,
				"[fixture __HEAD_SHORT__] claim fixture",
			) +
				commandEvent("powershell.exe -Command 'node scripts/verify.mjs fast'"),
		);
		expectAcceptedClaimRun(f, result);
	});

	it("V1 accepts a report that cites the base commit before its own HEAD", () => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			`Base commit: \`${f.head}\`\n${claimReport("__HEAD__")}`,
			commandEvent(
				"bash -lc 'git commit -m claim-fixture'",
				0,
				"[fixture __HEAD_SHORT__] claim fixture",
			) + commandEvent("bash -lc 'node scripts/verify.mjs fast'"),
		);
		expectAcceptedClaimRun(f, result);
	});

	it("V1 accepts an abbreviated worktree HEAD beside a full base SHA", () => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			`Base commit: \`${f.head}\`\n${claimReport("__HEAD_SHORT__")}`,
			commandEvent("pnpm verify:fast"),
			{ ROUND_NO_COMMIT_EVENT: "0" },
		);
		expectAcceptedClaimRun(f, result);
	});

	it("W2 does not count commands named only in echoed text", () => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			claimReport("__HEAD__"),
			commandEvent("echo git commit") +
				commandEvent("echo node scripts/verify.mjs fast"),
		);
		const entry = expectResumedClaimRun(f, result);
		expectMissingCommitAndLadder(entry);
	});

	it.each([
		"--dry-run",
		"--help",
	])("W2 does not count git commit %s", (option) => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			claimReport("__HEAD__"),
			commandEvent(
				`git commit ${option} -m claim-fixture`,
				0,
				"[fixture __HEAD_SHORT__] claim fixture",
			) + commandEvent("node scripts/verify.mjs fast"),
		);
		expectResumedClaimFailure(f, result, "no successful git commit command");
	});

	it.each([
		";",
		"||",
	])("W2 does not count a command masked with %s", (separator) => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			claimReport("__HEAD__"),
			commandEvent(
				`git commit -m claim-fixture ${separator} echo later`,
				0,
				"[fixture __HEAD_SHORT__] claim fixture",
			) + commandEvent(`node scripts/verify.mjs fast ${separator} echo later`),
		);
		const entry = expectResumedClaimRun(f, result);
		expectMissingCommitAndLadder(entry);
	});

	it("W2 requires the last commit output to name worktree HEAD", () => {
		const f = fixture();
		const result = claimInvokeReport(
			f,
			claimReport("__HEAD__"),
			commandEvent(
				"git commit -m claim-fixture",
				0,
				"[fixture deadbeef] claim fixture",
			) + commandEvent("node scripts/verify.mjs fast"),
		);
		expectResumedClaimFailure(
			f,
			result,
			"git commit output does not name worktree HEAD",
		);
	});

	it.each([
		[
			"a -C option",
			(f: ReturnType<typeof fixture>) =>
				`git -C ${JSON.stringify(f.worktree)} commit -m claim-fixture`,
		],
		["a -c option", () => "git -c user.name=x commit -m claim-fixture"],
		["--no-pager", () => "git --no-pager commit -m claim-fixture"],
		[
			"an earlier && command",
			() => "git add -A && git commit -m claim-fixture",
		],
		["an earlier ; command", () => "git add -A; git commit -m claim-fixture"],
		[
			"an earlier newline command",
			() => "git add -A\ngit commit -m claim-fixture",
		],
		[
			"quoted separators in the message",
			() => 'git commit -m "fix; tests | more"',
		],
	])("X1 accepts a commit after %s", (_name, command) => {
		const f = fixture();
		const result = claimInvoke(
			f,
			commandEvent(command(f), 0, claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
		);
		expectAcceptedClaimRun(f, result);
	});

	it.each([
		["bash", `bash -lc 'git commit -m "a \\"; b | c"'`],
		["PowerShell", `powershell.exe -Command 'git commit -m "a \`"; b | c"'`],
	])("Y1 accepts an escaped quote in a %s commit message", (_name, command) => {
		const f = fixture();
		const result = claimInvoke(
			f,
			commandEvent(command, 0, claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
		);
		expectAcceptedClaimRun(f, result);
	});
});
