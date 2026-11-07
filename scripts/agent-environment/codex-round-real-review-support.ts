import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import {
	briefHash,
	expectedArgs,
	expectedReviewBlocks,
	expectReviewReadings,
	fixture,
	realReviewRoot,
	reviewRefused,
} from "./codex-round-test-support.ts";

export function verifyRealReviewAnswer(
	name: string,
	count: number,
	hash: string,
) {
	const answerFile = path.join(realReviewRoot, `${name}.md`);
	const bytes = readFileSync(answerFile);
	expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash);
	const answer = bytes.toString("utf8");
	const blocks = expectedReviewBlocks(answer);
	expect(blocks).toHaveLength(count);
	const f = fixture();
	rmSync(f.reviewRoot, { recursive: true });
	const result = f.invoke(undefined, { REVIEW_ANSWER_FILE: answerFile });
	const printed = result.stdout.match(/^Reading \d+:$/gm) ?? [];
	expect(printed, "real review reading count").toHaveLength(count);
	expect(printed).toEqual(
		Array.from({ length: count }, (_, index) => `Reading ${index + 1}:`),
	);
	expectReviewReadings(result, blocks);
	reviewRefused(f, result, "record its dispositions before launching");
	const folder = path.join(f.reviewRoot, "brief-1");
	expect(readFileSync(path.join(folder, "last.md"))).toEqual(bytes);
	expect(existsSync(path.join(folder, "dispositions.md"))).toBe(false);
	const unanswered = f.invoke();
	reviewRefused(f, unanswered, "readings without a disposition");
	for (let index = 0; index < count; index += 1)
		expect(unanswered.stderr).toContain(
			`Reading ${index + 1} (${blocks[index].split(/\r?\n/)[0]})`,
		);
	const dispositions = `Brief SHA-256: ${briefHash(f.brief)}\n${Array.from(
		{ length: count },
		(_, index) => `Reading ${index + 1}: closed\n`,
	).join("")}`;
	writeFileSync(path.join(folder, "dispositions.md"), dispositions);
	const launched = f.invoke();
	expect(launched.status, launched.output).toBe(0);
	expect(f.captured().args).toEqual(expectedArgs(f, "last-message.md"));
	expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
	expect(f.reviewCalls()).toHaveLength(1);
	expect(readFileSync(path.join(f.run, "review-readings.md"))).toEqual(bytes);
	expect(readFileSync(path.join(f.run, "review-dispositions.md"), "utf8")).toBe(
		dispositions,
	);
	expect(dispositions.trim().split(/\r?\n/)).toHaveLength(count + 1);
	expect(Buffer.from(f.captured().input, "base64").length).toBeGreaterThan(0);
	expect(folder).toContain("brief-1");
	expect(launched.output).toContain("Review folder:");
	expect(dispositions).toContain("Brief SHA-256:");
	expect(dispositions).toContain("Reading 1: closed");
}
