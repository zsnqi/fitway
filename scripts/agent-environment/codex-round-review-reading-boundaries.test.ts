import { rmSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as support from "./codex-round-test-support.ts";

describe("R1 pre-launch review", () => {
	it("reads three bold outcome-ID readings with other IDs and an em dash", () => {
		const f = support.fixture();
		const answer = `**V3 \u2014 Preserve the check**
- **Literal reading:** The check can pass.
- **What goes wrong:** The intent can fail.
- **One-line change:** Preserve both.

**L1 - Keep the inputs**
- **Literal reading:** An input can change.
- **What goes wrong:** The proof can drift.
- **One-line change:** Freeze the inputs.

**P2 : Keep the comparison**
- **Literal reading:** The comparison can pass.
- **What goes wrong:** A row can move.
- **One-line change:** Compare every row.
`;
		rmSync(f.reviewRoot, { recursive: true, force: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: answer });
		expect(result.stdout.match(/^Reading \d+:$/gm), result.output).toHaveLength(
			3,
		);
		expect(result.stdout).toContain("**V3 \u2014 Preserve the check**");
	});

	it.each([
		[
			"mixed headings",
			`${support.readingAnswer}\n## Another reading\nThe goal can still fail.\n`,
		],
		[
			"incomplete fields",
			"## Reading 1: R1\n1. Outcome exploited: R1.\n2. Literal reading: The goal fails.\n",
		],
		[
			"too many readings",
			Array.from({ length: 3 }, () => support.readingAnswer).join("\n"),
		],
		[
			"none followed by a reading",
			"No such readings.\n\n## Another reading\nR1 can fail.\n",
		],
	])("refuses an ambiguous review answer: %s", (_kind, answer) => {
		const f = support.fixture();
		f.answerReview(
			answer,
			`Brief SHA-256: ${support.briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		support.reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});
});
