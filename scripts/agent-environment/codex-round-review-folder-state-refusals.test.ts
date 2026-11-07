import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as support from "./codex-round-test-support.ts";

describe("R1 pre-launch review", () => {
	it("refuses a review folder inside Git before running the review", () => {
		const f = support.fixture();
		support.reviewRefused(
			f,
			f.invoke(undefined, { FITWAY_BRIEF_REVIEW_ROOT: f.coordinator }),
			"inside a Git working tree",
		);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("refuses an unfinished newest review even when it has answered readings", () => {
		const f = support.fixture();
		const folder = f.answerReview("No such readings.\n", undefined, 2);
		writeFileSync(path.join(folder, "review.json"), '{"status":"running"}\n');
		support.reviewRefused(f, f.invoke(), "review failed or is unfinished");
		expect(f.reviewCalls()).toEqual([]);
	});

	it("resume neither checks reviews nor runs a requested review", () => {
		const f = support.fixture();
		expect(f.invoke().status).toBe(0);
		rmSync(f.reviewRoot, { recursive: true });
		writeFileSync(f.brief, "the brief is now invalid and unreviewed\n");
		const saved = readFileSync(path.join(f.run, "review-dispositions.md"));
		const result = f.invoke(["resume", f.run], {
			FITWAY_BRIEF_REVIEW_ROOT: f.coordinator,
		});
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(
			support.expectedArgs(f, "last-message.md", true),
		);
		expect(f.reviewCalls()).toEqual([]);
		expect(readFileSync(path.join(f.run, "review-dispositions.md"))).toEqual(
			saved,
		);
		rmSync(f.capture);
		support.refused(
			f,
			f.invoke(["resume", f.run, "--new-review"]),
			"expected resume",
		);
		expect(f.reviewCalls()).toEqual([]);
	});
});
