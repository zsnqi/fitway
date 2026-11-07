import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	commandEvent,
	fixture,
	git,
	jsonLinesIfPresent,
	structuredReport,
	thread,
} from "./codex-round-test-support.ts";

describe("K2 automatic resume", () => {
	const evidenceCommand = "fixture evidence";
	const evidenceOutput = "fixture evidence PASS\n";
	const report = structuredReport(
		["K1", "K2", "K3", "L1", "L2"],
		evidenceCommand,
		evidenceOutput.trim(),
	);
	const evidenceEvent = commandEvent(evidenceCommand, 0, evidenceOutput);
	const reportEnvironment = {
		ROUND_EVENTS: evidenceEvent,
		ROUND_RESUME_EVENTS: evidenceEvent,
	};
	const outcomeBrief = (f: ReturnType<typeof fixture>) => {
		const suffix = Buffer.from(
			`
## Causes and required outcomes

- **K1.** Fixture cause one. Outcome: first result. Intent: first intent.
- **K2.** Fixture cause two. Outcome: second result. Intent: second intent.
- **K3.** Fixture cause three. Outcome: third result. Intent: third intent.

## Limits the result keeps

- **L1.** Fixture limit one. Outcome: first limit. Intent: first limit intent.
- **L2.** Fixture limit two. Outcome: second limit. Intent: second limit intent.
`,
		);
		writeFileSync(f.brief, Buffer.concat([f.bytes, suffix]));
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "add outcome ids");
		f.answerReview(undefined, undefined, 2);
	};
	const resumeLog = (f: ReturnType<typeof fixture>) =>
		jsonLinesIfPresent(path.join(f.run, "auto-resumes.log"));

	it("resumes a run whose first turn ends without a report", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			...reportEnvironment,
			ROUND_MESSAGE: "Now let me test the implementation:\n",
			ROUND_RESUME_MESSAGE: report,
		});
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toContain("resume");
		expect(f.captured().args).toContain(thread);
		expect(
			Buffer.from(f.captured().input, "base64").toString("utf8"),
		).toContain("wait inside tool calls");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(true);
		const log = resumeLog(f);
		expect(log).toHaveLength(1);
		expect(log[0]).toMatchObject({
			exitCode: 0,
			firstLine: "Now let me test the implementation:",
		});
		expect(log[0].time).toMatch(/^\d{4}-\d\d-\d\dT/);
	});

	it("writes one timeline line and stderr file per turn", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			...reportEnvironment,
			ROUND_MESSAGE: "launch without a report\n",
			ROUND_RESUME_MESSAGE: report,
			ROUND_STDERR: "launch stderr\n",
			ROUND_RESUME_STDERR: "resume stderr\n",
		});
		expect(result.status, result.output).toBe(0);
		expect(result.stderr).toContain("launch stderr\n");
		expect(result.stderr).toContain("resume stderr\n");
		const turns = jsonLinesIfPresent(path.join(f.run, "turns.jsonl"));
		expect(turns).toHaveLength(2);
		expect(turns[0]).toMatchObject({
			exitCode: 0,
			stopReason: "no report",
			head: f.head,
			events: "events.jsonl",
			stderr: "stderr.txt",
		});
		expect(turns[1]).toMatchObject({
			exitCode: 0,
			stopReason: "report accepted",
			head: f.head,
			events: "events-resume.jsonl",
			stderr: "stderr-resume.txt",
		});
		for (const turn of turns) {
			expect(turn.start).toMatch(
				/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}[+-]\d\d:\d\d$/,
			);
			expect(turn.end).toMatch(
				/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}[+-]\d\d:\d\d$/,
			);
			expect(turn.durationMs).toBeGreaterThanOrEqual(0);
		}
		expect(readFileSync(path.join(f.run, "stderr.txt"), "utf8")).toBe(
			"launch stderr\n",
		);
		expect(readFileSync(path.join(f.run, "stderr-resume.txt"), "utf8")).toBe(
			"resume stderr\n",
		);
	});

	it("quotes the trigger's first line exactly and handles a fence in the line", () => {
		const first =
			'quote " slash \\ tick ``` \u00ab\u00ab \u0645\u0631\u062d\u0628\u0627 \u00bb\u00bb';
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			...reportEnvironment,
			ROUND_MESSAGE: `${first}\nsecond line\n`,
			ROUND_RESUME_MESSAGE: report,
		});
		expect(result.status, result.output).toBe(0);
		const sent = Buffer.from(f.captured().input, "base64").toString("utf8");
		const fence = sent.match(/^(`{3,})$/m)?.[1];
		expect(fence).toBeTruthy();
		expect(sent).toContain(`${fence}\n${first}\n${fence}`);
		expect(resumeLog(f)).toMatchObject([{ exitCode: 0, firstLine: first }]);
	});

	it("does not resume after a complete report or a STOPPED line", () => {
		for (const message of [report, "STOPPED: deliberate stop\n"]) {
			const f = fixture();
			outcomeBrief(f);
			const result = f.invoke(undefined, {
				...(message === report ? reportEnvironment : {}),
				ROUND_MESSAGE: message,
			});
			expect(result.status, result.output).toBe(0);
			expect(f.captured().args).not.toContain("resume");
			expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
			expect(existsSync(path.join(f.run, "auto-resumes.log"))).toBe(false);
		}
	});

	it("never resumes a nonzero exit", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: "unfinished work\n",
			ROUND_EXIT: "37",
		});
		expect(result.status, result.output).toBe(37);
		expect(f.captured().args).not.toContain("resume");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
		expect(existsSync(path.join(f.run, "auto-resumes.log"))).toBe(false);
	});

	it.each([
		["an omitted ID", "K1-K2: PASS\nL2: PASS\n"],
		["IDs without PASS or FAIL", "K1 K2 K3 L1 L2\n"],
	])("does not accept %s as a report", (_name, message) => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			...reportEnvironment,
			ROUND_MESSAGE: message,
			ROUND_RESUME_MESSAGE: report,
		});
		expect(result.status, result.output).toBe(0);
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(true);
		expect(resumeLog(f)).toHaveLength(1);
	});

	it("auto-resumes after a manual resume command", () => {
		const f = fixture();
		outcomeBrief(f);
		const sequence = {
			...reportEnvironment,
			ROUND_MESSAGES: JSON.stringify([
				"launch incomplete\n",
				"manual resume incomplete\n",
				report,
			]),
			ROUND_EXITS: JSON.stringify([37, 0, 0]),
			ROUND_SEQUENCE_FILE: path.join(f.root, "round-sequence"),
		};
		expect(f.invoke(undefined, sequence).status).toBe(37);
		const result = f.invoke(["resume", f.run], sequence);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toContain("resume");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, "events-resume-2.jsonl"))).toBe(true);
		expect(resumeLog(f)).toMatchObject([
			{ exitCode: 0, firstLine: "manual resume incomplete" },
		]);
	});

	it("stops with exit 1 after ten automatic resumes", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: "still working\n",
			ROUND_RESUME_MESSAGE: "still working\n",
		});
		expect(result.status, result.output).toBe(1);
		expect(result.stderr).toContain("after 10 automatic resumes");
		expect(resumeLog(f)).toHaveLength(10);
		expect(existsSync(path.join(f.run, "events-resume-10.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, "events-resume-11.jsonl"))).toBe(false);
	});
});
