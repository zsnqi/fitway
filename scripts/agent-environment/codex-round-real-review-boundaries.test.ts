import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	briefHash,
	fixture,
	realReviewRoot,
	reviewRefused,
} from "./codex-round-test-support.ts";

describe("R1 real review answers", () => {
	it("accepts another heading level and field wording in the same structure", () => {
		const f = fixture();
		const answer = `#### 1. R1
- Outcome reference: R1.
- Concrete reading: The check can pass without the intent.
- Repair note: Require the intended observable result.

#### 2. L1
- Limit reference: L1.
- Concrete reading: A result can survive a changed input.
- Repair note: Preserve the input as well.
`;
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		expect(f.invoke().status).toBe(0);
	});

	it.each([
		[
			"a heading body with its own numbered list",
			`### 1. R1
Literal reading: the steps can be skipped:
1. read
2. edit
3. test
4. commit
What goes wrong: nothing is measured.

### 2. L1
Literal reading: the input can change.
What goes wrong: the result drifts.
One-line change: keep the input.
`,
			2,
		],
		[
			"a bold numbered start followed by body text",
			`**1)** R1 permits a shortcut.
    The check can pass without the intent.
    Close: require the observable result.

**2)** L1 can drift.
    A changed input survives.
    Close: preserve the input.
`,
			2,
		],
		[
			"deeper headings and fenced code in a reading body",
			`## 1. R1
Literal reading: a body can contain nested material.
### Example
1. keep this list
\`\`\`text
## 2. L1
1. keep this fenced line
\`\`\`
What goes wrong: the reading can be split.

## 2. L1
Literal reading: the result can drift.
What goes wrong: the proof fails.
`,
			2,
		],
	])("reads %s without splitting its body", (_name, answer, printedLines) => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: answer });
		expect(result.stdout.match(/^Reading \d+:$/gm)).toHaveLength(printedLines);
		expect(
			reviewRefused(f, result, "record its dispositions before launching"),
		).toMatchObject({ status: 1 });
	});

	it.each([
		[
			"prose",
			"R1 permits a literal reading. The delivered work can miss the goal.",
		],
		[
			"unnumbered readings",
			readFileSync(path.join(realReviewRoot, "vf-speed-1.md"), "utf8").replace(
				/^\d+\. /gm,
				"- ",
			),
		],
		[
			"more than five numbered readings",
			`${readFileSync(path.join(realReviewRoot, "gardener-fix-1.md"), "utf8")}\n6. **X3**\n   This is a sixth reading.\n`,
		],
		[
			"numbered prose before the list",
			`Introductory prose about R1.\n\n${readFileSync(path.join(realReviewRoot, "vf-speed-1.md"), "utf8")}`,
		],
		[
			"missing reading number",
			readFileSync(path.join(realReviewRoot, "vf-speed-1.md"), "utf8").replace(
				"2. **S2",
				"4. **S2",
			),
		],
		["numbered topics without bodies", "1. R1\n2. L1\n"],
	])("refuses an invalid numbered answer: %s", (_kind, answer) => {
		const f = fixture();
		f.answerReview(answer);
		expect(
			reviewRefused(f, f.invoke(), "answer cannot be read as readings"),
		).toMatchObject({ status: 1 });
	});

	it("refuses a bare answer whose body lists look like reading starts", () => {
		const f = fixture();
		const answer = `1. R1 permits a shortcut.
   Literal reading: the check can pass.
   1. R1 names a body item.
   2. L1 names another body item.
2. L1 can drift.
   Literal reading: a changed input survives.
`;
		f.answerReview(answer);
		expect(
			reviewRefused(f, f.invoke(), "answer cannot be read as readings"),
		).toMatchObject({ status: 1 });
	});

	it.each([
		"No readings.",
		"The brief has no such reading.",
		"I found no literal readings.",
	])("reads a no-readings answer as none: %s", (answer) => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: answer });
		expect(result.stdout).toContain("Readings:\nNo such readings.\n");
		expect(result.stdout.match(/^Reading \d+:$/gm) ?? []).toEqual([]);
		expect(
			reviewRefused(f, result, "record its dispositions before launching"),
		).toMatchObject({ status: 1 });
		writeFileSync(
			path.join(f.reviewRoot, "brief-1", "dispositions.md"),
			`Brief SHA-256: ${briefHash(f.brief)}\n`,
		);
		expect(f.invoke().status).toBe(0);
	});
});
