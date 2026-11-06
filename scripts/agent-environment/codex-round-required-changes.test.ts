import { createHash } from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	comparison,
	git,
	refused,
	requiredFixture,
} from "./codex-round-test-support.ts";

describe("C1 required changes", () => {
	it.each([
		["repository", false],
		["repository", true],
		["absolute", false],
		["absolute", true],
	] as const)("records a marked %s file (changed: %s)", (kind, changed) => {
		const f = requiredFixture(kind);
		const result = f.invoke(
			undefined,
			changed
				? {
						ROUND_WRITE_PATH: f.target,
						ROUND_WRITE_CONTENT: Buffer.from([0, 255, 128, 2]).toString(
							"base64",
						),
					}
				: {},
		);
		expect(result.status, result.output).toBe(0);
		const [record] = comparison(f);
		expect(record).toMatchObject({
			path: f.named,
			line: f.line,
			outcome: f.outcome,
			changed,
		});
		const baseline = JSON.parse(
			fs.readFileSync(path.join(f.run, "run.json"), "utf8"),
		).requiredChanges[0];
		expect(baseline.before).toEqual({
			kind: "file",
			sha256: createHash("sha256").update(f.before).digest("hex"),
		});
		const warning = `Required change unchanged: ${f.named} (brief line ${f.line}: ${f.outcome})`;
		if (changed)
			expect(result.stdout).not.toContain("Required change unchanged:");
		else
			expect(
				result.stdout
					.split(/\r?\n/)
					.filter((line) => line.startsWith("Required change unchanged:")),
			).toEqual([warning]);
	});
	it("treats a rewrite with identical bytes as unchanged", () => {
		const f = requiredFixture("absolute");
		const result = f.invoke(undefined, {
			ROUND_WRITE_PATH: f.target,
			ROUND_WRITE_CONTENT: f.before.toString("base64"),
		});
		expect(result.status, result.output).toBe(0);
		expect(comparison(f)[0].changed).toBe(false);
		expect(result.stdout).toContain(`Required change unchanged: ${f.named}`);
	});
	it.each([
		"modify",
		"add",
		"delete",
	])("compares every file under a marked folder: %s", (operation) => {
		const f = requiredFixture("folder");
		const target = path.join(
			f.target,
			"nested",
			operation === "add" ? "new.bin" : "file.bin",
		);
		const result = f.invoke(
			undefined,
			operation === "delete"
				? { ROUND_REMOVE_PATH: target }
				: {
						ROUND_WRITE_PATH: target,
						ROUND_WRITE_CONTENT: Buffer.from("changed").toString("base64"),
					},
		);
		expect(result.status, result.output).toBe(0);
		expect(comparison(f)[0].changed).toBe(true);
		expect(result.stdout).not.toContain("Required change unchanged:");
		const baseline = JSON.parse(
			fs.readFileSync(path.join(f.run, "run.json"), "utf8"),
		).requiredChanges[0].before;
		expect(baseline.kind).toBe("directory");
		expect(Object.keys(baseline.files)).toEqual([
			"nested/file.bin",
			"other.bin",
		]);
	});
	it("refuses a marked missing absolute path at brief:check before launching", () => {
		const f = requiredFixture("absolute");
		fs.rmSync(f.target);
		expect(
			refused(f, f.invoke(), "must change path does not exist:"),
		).toMatchObject({ status: 1 });
		expect(fs.existsSync(f.run)).toBe(false);
	});
	it("reports every unchanged marked path, including a folder, on its outcome line", () => {
		const f = requiredFixture("folder");
		const other = path.join(f.root, "other.bin").replaceAll("\\", "/");
		fs.writeFileSync(other, "other");
		const outcome = `- **Outcome C2:** Update \`${other}\` (must change).`;
		const brief = `${fs.readFileSync(f.brief, "utf8")}${outcome}\n`;
		fs.writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "second required path");
		f.answerReview();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(
			comparison(f).map((record: { changed: boolean }) => record.changed),
		).toEqual([false, false]);
		expect(
			result.stdout
				.split(/\r?\n/)
				.filter((line) => line.startsWith("Required change unchanged:")),
		).toEqual([
			`Required change unchanged: ${f.named} (brief line ${f.line}: ${f.outcome})`,
			`Required change unchanged: ${other} (brief line ${brief.split("\n").indexOf(outcome) + 1}: ${outcome})`,
		]);
	});
	it("checks still-unchanged paths after each resume against the launch baseline", () => {
		const f = requiredFixture("absolute");
		expect(f.invoke().status).toBe(0);
		const original = fs.readFileSync(path.join(f.run, "required-changes.json"));
		fs.writeFileSync(f.brief, "the launch outcome must be retained");
		for (const suffix of ["-resume", "-resume-2"]) {
			const result = f.invoke(["resume", f.run, "--message", "continue"], {
				ROUND_EXIT: "19",
			});
			expect(result.status, result.output).toBe(19);
			expect(comparison(f, suffix)[0]).toMatchObject({
				changed: false,
				outcome: f.outcome,
				line: f.line,
			});
			expect(result.stdout).toContain(
				`Required change unchanged: ${f.named} (brief line ${f.line}: ${f.outcome})`,
			);
		}
		const result = f.invoke(["resume", f.run], {
			ROUND_WRITE_PATH: f.target,
			ROUND_WRITE_CONTENT: Buffer.from("changed").toString("base64"),
		});
		expect(result.status, result.output).toBe(0);
		expect(comparison(f, "-resume-3")[0].changed).toBe(true);
		const again = f.invoke(["resume", f.run]);
		expect(again.status, again.output).toBe(0);
		expect(comparison(f, "-resume-4")[0].changed).toBe(true);
		expect(again.stdout).not.toContain("Required change unchanged:");
		expect(fs.readFileSync(path.join(f.run, "required-changes.json"))).toEqual(
			original,
		);
	});
	it("removing the marker keeps launch and resume behavior exactly as before", () => {
		const marked = requiredFixture("absolute");
		expect(marked.invoke().status).toBe(0);
		expect(comparison(marked)[0].changed).toBe(false);
		const f = requiredFixture("absolute", false);
		for (const args of [undefined, ["resume", f.run]]) {
			const result = f.invoke(args);
			expect(result.status, result.output).toBe(0);
			expect(result.stdout).not.toContain("Required change");
		}
		expect(
			JSON.parse(fs.readFileSync(path.join(f.run, "run.json"), "utf8")),
		).not.toHaveProperty("requiredChanges");
		expect(
			fs.readdirSync(f.run).some((name) => name.startsWith("required-changes")),
		).toBe(false);
	});
});
