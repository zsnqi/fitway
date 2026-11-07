import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import {
	commandEvent,
	structuredReport,
} from "./codex-round-report-fixture.mjs";
import { git } from "./fixtures";

type InvokeResult = {
	status: number | null;
	output: string;
	stdout: string;
	stderr: string;
};

type ClaimFixture = {
	bytes: Buffer;
	brief: string;
	coordinator: string;
	worktree: string;
	run: string;
	answerReview: (
		answer?: string,
		dispositions?: string,
		number?: number,
	) => string;
	invoke: (args?: string[], extraEnv?: NodeJS.ProcessEnv) => InvokeResult;
	captured: () => { args: string[]; input: string };
};

export const cleanStop = "STOPPED: corrected evidence unavailable\n";
export const claimCommand = "fixture evidence";
export const claimEvidenceOutput = "fixture evidence PASS\n";
export const claimEvidence = commandEvent(claimCommand, 0, claimEvidenceOutput);
export const claimOutput = "[fixture __HEAD_SHORT__] claim fixture";

export function claimReport(commit?: string) {
	return structuredReport(
		["K1", "C1", "C2", "L1", "L2"],
		claimCommand,
		claimEvidenceOutput.trim(),
		commit,
	);
}

export function claimBrief(
	f: ClaimFixture,
	{ verify = true, commit = true } = {},
) {
	const limit = verify
		? "Run `node scripts/verify.mjs fast` on the committed tree."
		: "Report the observed result without naming a ladder command.";
	const report = commit
		? "Each outcome and limit as PASS or FAIL. Name the commit SHA."
		: "Each outcome and limit as PASS or FAIL. Name each evidence command.";
	const suffix = `
## Causes and required outcomes

- **C1.** Fixture cause one.
- **C2.** Fixture cause two.

## Limits the result keeps

- **L1.** Fixture limit one.
- **L2.** ${limit}

## Report

${report}
`;
	const scope = commit
		? "Write only in the fixture. Commit once when done. If an outcome"
		: "Write only in the fixture. If an outcome";
	const source = f.bytes
		.toString("utf8")
		.replace("delivers: report", `delivers: ${commit ? "commit" : "report"}`)
		.replace("Write only in the fixture. If an outcome", scope);
	writeFileSync(
		f.brief,
		Buffer.concat([Buffer.from(source), Buffer.from(suffix)]),
	);
	git(f.coordinator, "add", ".");
	git(f.coordinator, "commit", "-m", "add report claims");
	f.answerReview(undefined, undefined, 2);
}

export function claimCommitEnvironment(f: ClaimFixture): NodeJS.ProcessEnv {
	return {
		ROUND_COMMIT: "claim fixture",
		ROUND_WRITE_PATH: path.join(f.worktree, "claim-change.txt"),
		ROUND_WRITE_CONTENT: Buffer.from("claim change").toString("base64"),
		ROUND_COMMIT_STAGE_ALL: "1",
	};
}

export function claimResumeLog(f: ClaimFixture) {
	return readFileSync(path.join(f.run, "auto-resumes.log"), "utf8")
		.trim()
		.split(/\r?\n/)
		.map((line) => JSON.parse(line));
}

export function claimInvokeReport(
	f: ClaimFixture,
	message: string,
	events: string,
	extra: NodeJS.ProcessEnv = {},
) {
	claimBrief(f);
	return f.invoke(undefined, {
		...claimCommitEnvironment(f),
		ROUND_MESSAGE: message,
		ROUND_NO_COMMIT_EVENT: "1",
		ROUND_EVENTS: claimEvidence + events,
		ROUND_RESUME_MESSAGE: cleanStop,
		...extra,
	});
}

export function claimInvoke(
	f: ClaimFixture,
	events: string,
	message = claimReport("__HEAD__"),
) {
	return claimInvokeReport(f, message, events);
}

export function expectAcceptedClaimRun(f: ClaimFixture, result: InvokeResult) {
	expect(result.status, result.output).toBe(0);
	expect(f.captured().args).not.toContain("resume");
	expect(readFileSync(path.join(f.run, "turns.jsonl"), "utf8")).toContain(
		'"stopReason":"report accepted"',
	);
}

export function expectResumedClaimRun(f: ClaimFixture, result: InvokeResult) {
	expect(result.status, result.output).toBe(0);
	expect(f.captured().args).toContain("resume");
	return claimResumeLog(f)[0];
}

export function expectResumedClaimFailure(
	f: ClaimFixture,
	result: InvokeResult,
	failure: string,
) {
	const entry = expectResumedClaimRun(f, result);
	expect(entry.claimFailures.join("\n")).toContain(failure);
}

export function expectResumedClaimMessage(
	f: ClaimFixture,
	result: InvokeResult,
	failure: string,
) {
	const entry = expectResumedClaimRun(f, result);
	expect(Buffer.from(f.captured().input, "base64").toString("utf8")).toContain(
		failure,
	);
	expect(entry.claimFailures.join("\n")).toContain(failure);
}

export function expectMissingCommitAndLadder(entry: {
	claimFailures: string[];
}) {
	expect(entry.claimFailures).toEqual(
		expect.arrayContaining([
			expect.stringContaining("no successful git commit command"),
			expect.stringContaining("without a successful fast-ladder command"),
		]),
	);
}
