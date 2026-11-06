import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as support from "./codex-round-test-support.ts";

describe("R1 pre-launch review", () => {
	it("accepts bold Reading headings with numbered labelled fields", () => {
		const f = support.fixture();
		const answer =
			"**Reading 1: R1**\n1. **Outcome/limit:** R1.\n2. **Literal reading:** The check can pass.\n3. **What goes wrong:** The intent fails.\n4. **One-line change:** Require the intent.\n";
		f.answerReview(
			answer,
			`Brief SHA-256: ${support.briefHash(f.brief)}\nReading 1: closed\n`,
		);
		expect(f.invoke().status).toBe(0);
	});

	it("reads bold outcome-ID headings as five labelled readings", () => {
		const f = support.fixture();
		const answerFile = path.join(
			support.realReviewRoot,
			"vf-proofs-grade-1.md",
		);
		const bytes = readFileSync(answerFile);
		const answer = bytes.toString("utf8");
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(
			"92afd884df15172f49ca6c0879b8df0a30a3c901cfe8acfd909fba3bf654af30",
		);
		const blocks = support.expectedReviewBlocks(answer);
		expect(blocks).toHaveLength(5);
		expect(blocks.map((block) => block.match(/\b[A-Z]+\d+\b/)?.[0])).toEqual([
			"G9",
			"G2",
			"G3",
			"G6",
			"G7",
		]);
		rmSync(f.reviewRoot, { recursive: true, force: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER_FILE: answerFile });
		expect(result.stdout.match(/^Reading \d+:$/gm), result.output).toHaveLength(
			5,
		);
		support.expectReviewReadings(result, blocks);
	});
});
