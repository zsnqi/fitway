import { describe, expect, it } from "vitest";
import { verifyRealReviewAnswer } from "./codex-round-real-review-support.ts";
import { realReviews } from "./codex-round-test-support.ts";

describe("R1 real review answers", () => {
	it.each(
		realReviews.slice(9),
	)("reads %s as exactly %i readings in order and permits an answered launch", (name, count, hash) => {
		expect(verifyRealReviewAnswer(name, count, hash).status).toBe(0);
	});
});
