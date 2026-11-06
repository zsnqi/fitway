import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as support from "./codex-round-test-support.ts";

describe("R1 pre-launch review", () => {
	it("requires three labels on bold outcome-ID readings and refuses six", () => {
		const accepted = support.fixture();
		const answerFile = path.join(
			support.realReviewRoot,
			"vf-proofs-grade-1.md",
		);
		const answer = readFileSync(answerFile, "utf8");
		rmSync(accepted.reviewRoot, { recursive: true, force: true });
		const result = accepted.invoke(undefined, {
			REVIEW_ANSWER_FILE: answerFile,
		});
		expect(result.stdout.match(/^Reading \d+:$/gm), result.output).toHaveLength(
			5,
		);

		const f = support.fixture();
		const firstWrong = answer.indexOf("- **What goes wrong:**");
		const firstChange = answer.indexOf("\n**G2.", firstWrong);
		const missing = `${answer.slice(0, firstWrong)}${answer.slice(firstChange)}`;
		f.answerReview(missing);
		expect(
			support.reviewRefused(f, f.invoke(), "answer cannot be read as readings"),
		).toMatchObject({ status: 1 });

		const tooMany = support.fixture();
		tooMany.answerReview(
			`${answer}\n**X9. Extra reading**\n- **Literal reading:** Extra text.\n- **What goes wrong:** Extra wrong.\n- **One-line change:** Extra change.\n`,
		);
		expect(
			support.reviewRefused(
				tooMany,
				tooMany.invoke(),
				"answer cannot be read as readings",
			),
		).toMatchObject({ status: 1 });
	});
});
