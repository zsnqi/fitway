import {
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	briefHash,
	DEEPSEEK_MODEL,
	expectedArgs,
	expectReviewAnswerLaunch,
	fixture,
	git,
	readingAnswer,
	reviewDocument,
	reviewRefused,
} from "./codex-round-test-support.ts";

describe("R1 pre-launch review", () => {
	it("runs an absent review from REVIEW.md and stops before launching", () => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: readingAnswer });
		reviewRefused(f, result, "record its dispositions before launching");
		const folder = path.join(f.reviewRoot, "brief-1");
		expect(result.stdout).toContain(`Review folder: ${folder}`);
		expect(result.stdout).toContain("Reading 1:");
		expect(result.stdout).toContain("Reading 2:");
		expect(result.stdout).toContain(
			`Write coordinator dispositions to: ${path.join(folder, "dispositions.md")}`,
		);
		expect(readFileSync(path.join(folder, "brief.md"))).toEqual(f.bytes);
		const prompt = reviewDocument.match(
			/^## Prompt\n\s*```text\n([\s\S]*?)^```\s*$/m,
		)?.[1];
		expect(prompt).toBeDefined();
		expect(readFileSync(path.join(folder, "prompt.md"), "utf8")).toBe(prompt);
		const [review] = f.reviewCalls();
		expect(f.reviewCalls()).toHaveLength(1);
		expect(review.args).toEqual([
			"exec",
			"-s",
			"read-only",
			"--skip-git-repo-check",
			"-C",
			folder,
			"-m",
			DEEPSEEK_MODEL,
			"-c",
			"model_provider=opendesign",
			"-c",
			'model_providers.opendesign={name="OpenDesign",base_url="https://amr-link.open-design.ai/v1",env_key="OPENDESIGN_API_KEY",wire_api="responses"}',
			"-c",
			`model_catalog_json=${JSON.stringify(
				path.join(folder, "model-catalog.json").replaceAll("\\", "/"),
			)}`,
			"-c",
			"model_reasoning_effort=max",
			"-c",
			"web_search=disabled",
			"-c",
			"features.hooks=false",
			"-o",
			`${folder}/last.md`,
			"-",
		]);
		expect(review.cwd).toBe(folder);
		expect(Buffer.from(review.input, "base64").toString("utf8")).toBe(prompt);
		expect(review.files.sort()).toEqual([
			"brief.md",
			"model-catalog.json",
			"prompt.md",
			"review.json",
			"review.log",
			"sources",
		]);
		expect(() => git(folder, "rev-parse", "--show-toplevel")).toThrow();
		expect(existsSync(path.join(folder, "dispositions.md"))).toBe(false);
	});

	it("names every unanswered reading and stops before launching", () => {
		const f = fixture();
		const folder = f.answerReview(
			readingAnswer,
			`Brief SHA-256: ${briefHash(f.brief)}\n`,
		);
		const before = readFileSync(path.join(folder, "dispositions.md"));
		const result = f.invoke();
		reviewRefused(f, result, "readings without a disposition");
		expect(result.stderr).toContain("Reading 1 (## Reading 1: R1)");
		expect(result.stderr).toContain("Reading 2 (## Reading 2: L1)");
		expect(readFileSync(path.join(folder, "dispositions.md"))).toEqual(before);
		expect(f.reviewCalls()).toEqual([]);
	});

	it.each([
		"absent",
		"left open:",
		"left open:   ",
		"dismissed",
		"closed\nReading 2: closed",
	])("refuses an unanswered or invalid disposition: %s", (answer) => {
		const f = fixture();
		const folder = f.answerReview(
			readingAnswer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: ${answer}\n`,
		);
		if (answer === "absent") rmSync(path.join(folder, "dispositions.md"));
		const result = f.invoke();
		reviewRefused(f, result, "readings without a disposition");
		expect(result.stderr).toContain("Reading 2");
	});

	it.each([
		"another hash",
		"missing hash",
		"duplicate hash",
		"brief edited",
	])("refuses dispositions that do not identify the launched brief: %s", (kind) => {
		const f = fixture();
		const hash = briefHash(f.brief);
		const namedHash = kind === "another hash" ? "0".repeat(64) : hash;
		const header =
			kind === "missing hash" ? "" : `Brief SHA-256: ${namedHash}\n`;
		f.answerReview(
			readingAnswer,
			`${header}${kind === "duplicate hash" ? header : ""}Reading 1: closed\nReading 2: left open: accepted because it does not apply here\n`,
		);
		if (kind === "brief edited") {
			writeFileSync(
				f.brief,
				Buffer.concat([f.bytes, Buffer.from("\nA clarified goal.\n")]),
			);
			git(f.coordinator, "add", ".");
			git(f.coordinator, "commit", "-m", "clarified brief after dispositions");
		}
		reviewRefused(
			f,
			f.invoke(),
			"dispositions must name the current brief SHA-256",
		);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("launches with all readings answered and copies the exact review and dispositions", () => {
		const f = fixture();
		const dispositions = `Brief SHA-256: ${briefHash(f.brief)}\r\nReading 1: closed\r\nReading 2: left open: accepted because the condition is absent\r\n`;
		const folder = f.answerReview(readingAnswer, dispositions);
		const before = readdirSync(folder).map((name) => [
			name,
			readFileSync(path.join(folder, name)),
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(expectedArgs(f, "last-message.md"));
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		expect(f.reviewCalls()).toEqual([]);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			readingAnswer,
		);
		expect(
			readFileSync(path.join(f.run, "review-dispositions.md"), "utf8"),
		).toBe(dispositions);
		expect(
			readdirSync(folder).map((name) => [
				name,
				readFileSync(path.join(folder, name)),
			]),
		).toEqual(before);
	});

	it("launches a review with no readings only after its hash is acknowledged", () => {
		const f = fixture();
		const folder = f.answerReview();
		rmSync(path.join(folder, "dispositions.md"));
		reviewRefused(
			f,
			f.invoke(),
			"dispositions must name the current brief SHA-256",
		);
		f.answerReview();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(existsSync(f.capture)).toBe(true);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			"No such readings.\n",
		);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("requests a new review above the highest folder and stops even with no readings", () => {
		const f = fixture();
		f.answerReview("No such readings.\n", undefined, 2);
		const latest = f.answerReview("No such readings.\n", undefined, 10);
		const before = readFileSync(path.join(latest, "dispositions.md"));
		const result = f.invoke([f.brief, "high", "--new-review", "--run", f.run]);
		reviewRefused(f, result, "record its dispositions before launching");
		const folder = path.join(f.reviewRoot, "brief-11");
		expect(result.stdout).toContain(`Review folder: ${folder}`);
		expect(result.stdout).toContain("No such readings.");
		expect(f.reviewCalls()).toHaveLength(1);
		expect(existsSync(path.join(folder, "dispositions.md"))).toBe(false);
		expect(readFileSync(path.join(latest, "dispositions.md"))).toEqual(before);
		// A completed automatic review can subsequently be answered by its coordinator.
		writeFileSync(
			path.join(folder, "dispositions.md"),
			`Brief SHA-256: ${briefHash(f.brief)}\n`,
		);
		expect(f.invoke().status).toBe(0);
		expect(f.reviewCalls()).toHaveLength(1);
	});

	it("uses the newest review rather than an older answered review", () => {
		const f = fixture();
		f.answerReview(
			readingAnswer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\n`,
			10,
		);
		reviewRefused(f, f.invoke(), "Reading 2");
		expect(f.reviewCalls()).toEqual([]);
	});

	it("stops a failed Codex review, preserves it, and never falls back to an older review", () => {
		const f = fixture();
		const result = f.invoke([f.brief, "high", "--run", f.run, "--new-review"], {
			REVIEW_EXIT: "29",
		});
		reviewRefused(f, result, "Codex exit 29");
		const folder = path.join(f.reviewRoot, "brief-2");
		expect(result.stdout).toContain(`Review folder: ${folder}`);
		expect(readFileSync(path.join(folder, "brief.md"))).toEqual(f.bytes);
		expect(readFileSync(path.join(folder, "review.log"), "utf8")).toBe(
			"stand-in review\n",
		);
		expect(
			JSON.parse(readFileSync(path.join(folder, "review.json"), "utf8")),
		).toMatchObject({ status: "failed", exitCode: 29 });
		reviewRefused(f, f.invoke(), "Codex exit 29");
		expect(f.reviewCalls()).toHaveLength(1);
	});

	it.each([
		"unparseable",
		"missing",
	])("stops a %s review answer and preserves the folder", (kind) => {
		const f = fixture();
		const result = f.invoke(
			[f.brief, "high", "--run", f.run, "--new-review"],
			kind === "missing"
				? { REVIEW_NO_ANSWER: "1" }
				: { REVIEW_ANSWER: "I could not complete this review." },
		);
		reviewRefused(f, result, "answer cannot be read as readings");
		const folder = path.join(f.reviewRoot, "brief-2");
		expect(existsSync(path.join(folder, "brief.md"))).toBe(true);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
		expect(f.reviewCalls()).toHaveLength(1);
	});

	it("accepts labelled Markdown readings with top-level numbers", () => {
		const f = fixture();
		const answer =
			"1. **R1**\n   - **Outcome:** R1\n   - **Literal reading:** The check can pass.\n   - **What would go wrong:** The intent fails.\n   - **One-line change:** Require the intent.\n\n2. **L1**\n   - **Limit:** L1\n   - **Literal reading:** Inputs can change.\n   - **Consequence:** The proof fails.\n   - **Fix:** Keep the inputs.\n";
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		expect(f.invoke().status).toBe(0);
	});

	it("accepts bare numbered readings with indented bodies and lists", () => {
		const f = fixture();
		const answer = `1. R1 permits a shortcut.
   Literal reading: the check can pass.
   1. Keep the list in the body.
   2. Do not split there.
   What goes wrong: the intent remains unmet.
2) L1 can drift.
   Literal reading: a changed input survives.
   Close: preserve the input.
`;
		expectReviewAnswerLaunch(f, answer);
	});

	it("accepts readings after a multi-paragraph preface", () => {
		const f = fixture();
		const answer = `Five readings, most damaging first.

The preface spans more than one paragraph.

1. **R1** permits a shortcut.
   Literal reading: the check can pass.
   What goes wrong: the intent remains unmet.

2. **L1** can drift.
   Literal reading: a changed input survives.
   Close: preserve the input.
`;
		expectReviewAnswerLaunch(f, answer);
	});

	it("applies the label rule to a bare reading whose lines all start at column 0", () => {
		const f = fixture();
		const answer = `1. V1. Literal reading:
a check can pass. What goes wrong: the intent fails. Change: preserve it.
`;
		rmSync(f.reviewRoot, { recursive: true, force: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: answer });
		expect(result.stdout.match(/^Reading \d+:$/gm), result.output).toHaveLength(
			1,
		);
		expect(result.stdout.replace(/\s+/g, " ")).toContain(
			"Literal reading: a check can pass. What goes wrong: the intent fails. Change: preserve it.",
		);
	});
});
