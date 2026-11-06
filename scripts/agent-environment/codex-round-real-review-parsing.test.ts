import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { verifyRealReviewAnswer } from "./codex-round-real-review-support.ts";
import {
	expectedReviewBlocks,
	parseReadings,
	quotedLabelReviews,
	readingSnapshot,
	realReviewRoot,
	realReviews,
} from "./codex-round-test-support.ts";

describe("R1 real review answers", () => {
	it.each(
		realReviews.slice(0, 9),
	)("reads %s as exactly %i readings in order and permits an answered launch", (name, count, hash) => {
		const outcome = verifyRealReviewAnswer(name, count, hash);
		expect(outcome.status).toBe(0);
		expect(outcome.readingCount).toBe(count);
		expect(outcome.blockCount).toBe(count);
		expect(outcome.reviewCalls).toBe(1);
		expect(outcome.copiedReadings).toBe(true);
		expect(outcome.copiedDispositions).toBe(true);
		expect(outcome.dispositionLines).toBe(count + 1);
		expect(outcome.inputBytes).toBeGreaterThan(0);
		expect(outcome.reviewFolder).toContain("brief-1");
		expect(outcome.launchedOutput).toContain("Review folder:");
		expect(outcome.unansweredOutput).toContain("Reading 1");
		expect(outcome.artifactExists).toBe(true);
		expect(outcome.reviewDispositions).toContain("Brief SHA-256:");
		expect(outcome.reviewDispositions).toContain("Reading 1: closed");
	});

	it.each(
		quotedLabelReviews,
	)("reads %s quoted-label answer exactly as the pre-parser result", (name, hash) => {
		const answerFile = path.join(realReviewRoot, `${name}.md`);
		const bytes = readFileSync(answerFile);
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash);
		const answer = bytes.toString("utf8");
		const expected = expectedReviewBlocks(answer).map((text, index) => ({
			id: index + 1,
			text,
		}));
		expect(readingSnapshot(parseReadings(answer))).toEqual(expected);
	});

	it.each([
		["a code span", "`", "`"],
		["straight double quotes", '"', '"'],
		["curly double quotes", "\u201c", "\u201d"],
	])("does not read a label quoted in %s as a labelled part", (_name, open, close) => {
		const quote = (label: string) => `${open}${label}: 1${close}`;
		const answer = `**V1. Quoted labels**
- **Literal reading:** The prose ends with ${quote("Literal reading")}
- **What goes wrong:** The prose ends with ${quote("What goes wrong")}
- **One-line change:** The prose ends with ${quote("Change")}
`;
		expect(readingSnapshot(parseReadings(answer))).toEqual([
			{ id: 1, text: answer.trim() },
		]);
	});

	it.each([
		"Literal reading",
		"What goes wrong",
		"Change",
	])("does not count %s in the middle of a sentence as a label", (label) => {
		const probe = label.toLowerCase();
		const answer = `**V1. Middle labels**
- **Literal reading:** The prose says the ${probe}: small; it also ends with the ${probe}: 3.
- **What goes wrong:** The reading still has its own labelled part.
- **One-line change:** Keep the examples as prose.
`;
		expect(readingSnapshot(parseReadings(answer))).toEqual([
			{ id: 1, text: answer.trim() },
		]);
	});
});
