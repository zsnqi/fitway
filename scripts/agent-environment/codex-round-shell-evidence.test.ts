import { describe, expect, it } from "vitest";
import {
	expectAcceptedClaimRun,
	expectResumedClaimFailure,
	reportClaimFixture,
} from "./codex-round-report-support.ts";
import { commandEvent, fixture } from "./codex-round-test-support.ts";

const claim = reportClaimFixture();
const missingLadderFailure = "without a successful fast-ladder command";

describe("L3 report claims", () => {
	it("Y1 guard refuses a PowerShell backslash before a separator", () => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent(
				`powershell.exe -Command 'git commit -m a \\; echo later'`,
				0,
				claim.claimOutput,
			) + commandEvent("node scripts/verify.mjs fast"),
		);
		expectResumedClaimFailure(f, result, "no successful git commit command");
	});

	it.each([
		[
			"bash",
			`bash -lc 'echo "[fixture __HEAD_SHORT__] claim fixture" # ; git commit -m x'`,
		],
		[
			"PowerShell",
			`powershell.exe -Command 'echo "[fixture __HEAD_SHORT__] claim fixture" # ; git commit -m x'`,
		],
	])("Y2 ignores a commented commit in %s", (_name, command) => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent(command, 0, claim.claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
		);
		expectResumedClaimFailure(f, result, "no successful git commit command");
	});

	it.each([
		["bash", `bash -lc 'echo ok # && node scripts/verify.mjs fast'`],
		[
			"PowerShell",
			`powershell.exe -Command 'echo ok # && node scripts/verify.mjs fast'`,
		],
	])("Y2 ignores a commented ladder in %s", (_name, command) => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent("git commit -m claim-fixture", 0, claim.claimOutput) +
				commandEvent(command),
		);
		expectResumedClaimFailure(f, result, missingLadderFailure);
	});

	it.each([
		["a quoted hash in bash", `bash -lc 'git commit -m "fix #12"'`],
		[
			"a quoted hash in PowerShell",
			`powershell.exe -Command 'git commit -m "fix #12"'`,
		],
		["a hash inside a bash word", `bash -lc 'git commit -m a#b'`],
		[
			"a hash inside a PowerShell word",
			`powershell.exe -Command 'git commit -m a#b'`,
		],
	])("Y2 guard keeps %s", (_name, command) => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent(command, 0, claim.claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
		);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).not.toContain("resume");
	});

	it("X1 accepts an earlier command before the exact fast ladder", () => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent("git commit -m claim-fixture", 0, claim.claimOutput) +
				commandEvent("pnpm test && node scripts/verify.mjs fast"),
		);
		expectAcceptedClaimRun(f, result);
	});

	it.each([
		[
			"X1 guard refuses a filtered ladder",
			"node scripts/verify.mjs fast --testNamePattern claim",
		],
		[
			"X1 guard refuses a ladder followed by a command",
			"node scripts/verify.mjs fast && echo later",
		],
		["X1 guard refuses a piped ladder", "node scripts/verify.mjs fast | cat"],
	])("%s", (_name, ladder) => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent("git commit -m claim-fixture", 0, claim.claimOutput) +
				commandEvent(ladder),
		);
		expectResumedClaimFailure(f, result, missingLadderFailure);
	});

	it.each([
		[
			"X1 guard refuses a commit followed by &&",
			"git commit -m claim-fixture && echo later",
		],
		["X1 guard refuses a piped commit", "git commit -m claim-fixture | cat"],
		[
			"X1 guard refuses a commit after ||",
			"false || git commit -m claim-fixture",
		],
		[
			"X1 guard refuses a commit after |",
			"false | git commit -m claim-fixture",
		],
	])("%s", (_name, commit) => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent(commit, 0, claim.claimOutput) +
				commandEvent("node scripts/verify.mjs fast"),
		);
		expectResumedClaimFailure(f, result, "no successful git commit command");
	});

	it.each([
		[
			"X2 refuses HEAD's prefix in a subject under another header",
			"[fixture deadbeef] subject __HEAD_SHORT__",
		],
		[
			"X2 refuses HEAD's prefix in a subject under a root-commit header",
			"[fixture (root-commit) deadbeef] subject __HEAD_SHORT__",
		],
	])("%s", (_name, output) => {
		const f = fixture();
		const result = claim.invokeClaim(
			f,
			commandEvent("git commit -m claim-fixture", 0, output) +
				commandEvent("node scripts/verify.mjs fast"),
		);
		expectResumedClaimFailure(
			f,
			result,
			"git commit output does not name worktree HEAD",
		);
	});
});
