import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	briefHash,
	closeReviewReadings,
	expectedReviewBlocks,
	fixture,
	realReviewRoot,
	reviewRefused,
} from "./codex-round-test-support.ts";

describe("R1 pre-launch review", () => {
	it("accepts complete one-line readings with other wording and no blank lines", () => {
		const f = fixture();
		const answer = [
			"1) V1. Failure: the marker changes. As written: the proof holds. Repair: freeze the phase.",
			"2) V1. Repair: require the general proof. Failure: the input drifts. As written: the check passes.",
			"3) L1. Wording: existing assertions stay. Consequence: coverage can disappear. Change: keep each check.",
			"4) V3. Risk: a wrapper hides the executable. Reading: the option is accepted. Fix: resolve the executable.",
			"5) V2. As written: the replacement stays local. Repair: exercise the real text. Risk: a collision returns.",
		].join("\n");
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\nReading 3: closed\nReading 4: closed\nReading 5: closed\n`,
		);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			answer,
		);
	});

	it.each([
		[
			"a list of IDs",
			["V1", "V1", "L1", "V3", "V2"]
				.map((id, index) => `${index + 1}. ${id}`)
				.join("\n"),
		],
		[
			"a one-line summary",
			[
				"V1 asks for a literal reading, what goes wrong, and a one-line change.",
				"V1 asks for a literal reading, what goes wrong, and a one-line change.",
				"L1 asks for a literal reading, what goes wrong, and a one-line change.",
				"V3 asks for a literal reading, what goes wrong, and a one-line change.",
				"V2 asks for a literal reading, what goes wrong, and a one-line change.",
			]
				.map((line, index) => `${index + 1}. ${line}`)
				.join("\n"),
		],
		[
			"one field only",
			["V1", "V1", "L1", "V3", "V2"]
				.map(
					(id, index) => `${index + 1}. ${id}. Literal reading: only one part.`,
				)
				.join("\n"),
		],
		[
			"an empty wrong label",
			Array.from(
				{ length: 5 },
				(_, index) =>
					`${index + 1}. V1. Literal reading: x. What goes wrong:. Change: z.`,
			).join("\n"),
		],
		[
			"a wrong label holding only a number",
			Array.from(
				{ length: 5 },
				(_, index) =>
					`${index + 1}. V1. Literal reading: x. What goes wrong: 3. Change: z.`,
			).join("\n"),
		],
		[
			"a wrong label holding only an outcome ID",
			Array.from(
				{ length: 5 },
				(_, index) =>
					`${index + 1}. V1. Literal reading: x. What goes wrong: V2. Change: z.`,
			).join("\n"),
		],
		[
			"keywords without labelled parts",
			["V1", "V1", "L1", "V3", "V2"]
				.map(
					(id, index) =>
						`${index + 1}. ${id} literal reading; ${id} risk; ${id} change.`,
				)
				.join("\n"),
		],
		[
			"complete prose without labels",
			["V1", "V1", "L1", "V3", "V2"]
				.map(
					(id, index) =>
						`${index + 1}. ${id}. The proof passes. The phase drifts. Freeze the phase.`,
				)
				.join("\n"),
		],
		[
			"a line cut after its ID",
			["V1", "V1", "L1", "V3", "V2"]
				.map((id, index) => `${index + 1}. ${id}.`)
				.join("\n"),
		],
	])("refuses an incomplete one-line reading: %s", (_kind, answer) => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		reviewRefused(
			f,
			f.invoke(undefined, { REVIEW_ANSWER: answer }),
			"answer cannot be read as readings",
		);
	});

	it("reads a wrapped one-line reading as one block", () => {
		const f = fixture();
		const answerFile = path.join(realReviewRoot, "g1-wrapped.md");
		const bytes = readFileSync(answerFile);
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(
			"239e4e15ab2380051668c6339410d7a284065ecffc6f488eebb1822a722c7eec",
		);
		const answer = bytes.toString("utf8");
		const blocks = expectedReviewBlocks(answer);
		expect(blocks.map((block) => block.match(/\b[A-Z]+\d+\b/)?.[0])).toEqual([
			"V1",
			"V1",
			"L1",
			"V3",
			"V2",
		]);
		expect(blocks[2]).toContain(
			"What goes wrong: coverage can disappear. Change: keep each assertion.",
		);
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER_FILE: answerFile });
		expect(result.stdout.match(/^Reading \d+:$/gm)).toHaveLength(5);
		expect(result.stdout).toContain(`Reading 3:\n${blocks[2]}`);
		closeReviewReadings(f);
		const launched = f.invoke();
		expect(launched.status, launched.output).toBe(0);
		expect(readFileSync(path.join(f.run, "review-readings.md"))).toEqual(bytes);
	});

	it("reads each one-line reading when any word break is a line break", () => {
		const f = fixture();
		const answerFile = path.join(realReviewRoot, "g1-wrapped.md");
		const bytes = readFileSync(answerFile);
		const unwrapped = bytes.toString("utf8").replace("Gap:\na", "Gap: a");
		const blocks = expectedReviewBlocks(unwrapped);
		for (let index = 0; index < blocks.length; index += 1) {
			const sourceBlock = blocks[index];
			const sourceStart = unwrapped.indexOf(sourceBlock);
			const wrapAt = sourceBlock.search(/ (?=\S)/);
			const afterId = sourceBlock.indexOf(
				" ",
				sourceBlock.search(/\b[A-Z]+\d+\b/),
			);
			const splitAt = Math.max(wrapAt, afterId);
			const wrapped =
				unwrapped.slice(0, sourceStart + splitAt) +
				"\n" +
				unwrapped.slice(sourceStart + splitAt + 1);
			rmSync(f.reviewRoot, { recursive: true, force: true });
			const result = f.invoke(undefined, { REVIEW_ANSWER: wrapped });
			expect(
				result.stdout.match(/^Reading \d+:$/gm),
				`wrapped reading ${index + 1}`,
			).toHaveLength(5);
			expect(result.stdout.replace(/\s+/g, " ")).toContain(
				blocks[index].replace(/\s+/g, " "),
			);
		}
	});

	it.each([
		[
			"a heading",
			`## Reading 1: R1
1. Outcome reference: R1.
2. Literal reading: The check can pass.
3. What goes wrong:
4. One-line change: Preserve the check.
`,
		],
		[
			"a bold line",
			`**1. R1**
1. Outcome reference: R1.
2. Literal reading: The check can pass.
3. What goes wrong: 3
4. One-line change: Preserve the check.
`,
		],
		[
			"a bullet body",
			`1. R1 permits a shortcut.
   - Literal reading: The check can pass.
   - What goes wrong: V2
   - One-line change: Preserve the check.
`,
		],
	])("refuses an explicitly empty label in %s", (_name, answer) => {
		const f = fixture();
		f.answerReview(answer);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});

	it("refuses a wrapped reading that loses its completing labels", () => {
		const answerFile = path.join(realReviewRoot, "g1-wrapped.md");
		const accepted = fixture();
		rmSync(accepted.reviewRoot, { recursive: true });
		const acceptedResult = accepted.invoke(undefined, {
			REVIEW_ANSWER_FILE: answerFile,
		});
		expect(acceptedResult.stdout.match(/^Reading \d+:$/gm)).toHaveLength(5);

		const f = fixture();
		const answer = readFileSync(answerFile, "utf8").replace(
			"What goes wrong: coverage can disappear. Change: keep each assertion.\n",
			"",
		);
		f.answerReview(answer);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});

	it.each([
		["keywords in clauses", "V1 literal reading; V2 risk; V3 change."],
		[
			"labels that do not start the clauses",
			"V1 reading: as written. The risk is a gap. Change it.",
		],
	])("refuses a one-line reading with %s", (_name, answer) => {
		const f = fixture();
		f.answerReview(`1. ${answer}\n`);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});

	it("reads the vf-fixes preface answer as exactly five readings", () => {
		const f = fixture();
		const answerFile = path.join(realReviewRoot, "codex-vf-fixes-1.md");
		const answer = readFileSync(answerFile);
		expect(createHash("sha256").update(answer).digest("hex")).toBe(
			"ee52b45f9c317c02cdfa90dc64bf65643a5ea5db7b95fa22108dcb57ee1d8238",
		);
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER_FILE: answerFile });
		expect(result.stdout.match(/^Reading \d+:$/gm)).toHaveLength(5);
		reviewRefused(f, result, "record its dispositions before launching");
		closeReviewReadings(f);
		const launched = f.invoke();
		expect(launched.status, launched.output).toBe(0);
		expect(readFileSync(path.join(f.run, "review-readings.md"))).toEqual(
			answer,
		);
	});
});
