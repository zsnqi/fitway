import { describe, expect, it } from "vitest";
import { analyzeRecordTexts, collectRecordSurvey } from "./records.mjs";

const roundHeader = [
	"milestone",
	"round",
	"date",
	"writer",
	"model",
	"effort",
	"attempts",
	"brief_rows",
	"heldout_rows",
	"heldout_partial",
	"brief_caused_fails",
	"interventions",
	"post_acceptance_defects",
	"start_load",
	"result",
	"source",
	"notes",
].join("\t");

const findingHeader = [
	"id",
	"milestone",
	"round",
	"date",
	"class",
	"finding",
	"status",
	"resolved_by",
	"evidence",
	"source",
].join("\t");

const round = (values: string[]) => values.join("\t");
const finding = (values: string[]) => values.join("\t");

describe("gardener records survey", () => {
	it("counts recurring classes, separates cli-gap kinds, and preserves one-off classes", () => {
		const findings = [
			findingHeader,
			finding([
				"F1",
				"m",
				"1",
				"2026-01-02",
				"regression",
				"a",
				"open",
				"",
				"",
				"",
			]),
			finding([
				"F2",
				"m",
				"2",
				"2026-01-03",
				"regression",
				"b",
				"open",
				"",
				"",
				"",
			]),
			finding([
				"F3",
				"m",
				"1",
				"2026-01-02",
				"single",
				"c",
				"open",
				"",
				"",
				"",
			]),
			finding([
				"F4",
				"m",
				"1",
				"2026-01-02",
				"cli-gap:alpha",
				"d",
				"open",
				"",
				"",
				"",
			]),
			finding([
				"F5",
				"m",
				"2",
				"2026-01-03",
				"cli-gap:alpha",
				"e",
				"fixed",
				"",
				"",
				"",
			]),
			finding([
				"F6",
				"m",
				"1",
				"2026-01-02",
				"cli-gap:beta",
				"f",
				"open",
				"",
				"",
				"",
			]),
		].join("\n");
		const result = analyzeRecordTexts({
			roundsText: `${roundHeader}\n`,
			findingsText: findings,
		});
		expect(result.findings.classes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					class: "regression",
					open: 2,
					fixed: 0,
					other: 0,
				}),
				expect.objectContaining({
					class: "single",
					open: 1,
					fixed: 0,
					other: 0,
				}),
				expect.objectContaining({
					class: "cli-gap:alpha",
					open: 1,
					fixed: 1,
					other: 0,
				}),
			]),
		);
		expect(result.findings.recurring).toEqual(
			expect.arrayContaining([
				{
					class: "regression",
					ids: ["F1", "F2"],
					rounds: ["m/1", "m/2"],
					due: null,
				},
			]),
		);
		expect(result.findings.recurring).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ class: "cli-gap:alpha" }),
			]),
		);
	});

	it("marks a recurring cli feature due when its open lines span rounds", () => {
		const findings = [
			findingHeader,
			finding([
				"F1",
				"m",
				"1",
				"2026-01-02",
				"cli-gap:alpha",
				"a",
				"open",
				"",
				"",
				"",
			]),
			finding([
				"F2",
				"m",
				"2",
				"2026-02-03",
				"cli-gap:alpha",
				"b",
				"open",
				"",
				"",
				"",
			]),
		].join("\n");
		const result = analyzeRecordTexts({
			roundsText: `${roundHeader}\n`,
			findingsText: findings,
		});
		expect(result.findings.recurring).toContainEqual(
			expect.objectContaining({
				class: "cli-gap:alpha",
				ids: ["F1", "F2"],
				due: "CLI feature due: alpha",
			}),
		);
	});

	it("reports monthly and writer trends with metric sample counts and unknown cells", () => {
		const rows = [
			round([
				"m",
				"1",
				"2026-01-02",
				"codex",
				"",
				"",
				"1",
				"",
				"9/10",
				"",
				"2",
				"1",
				"0",
				"",
				"",
				"",
				"",
			]),
			round([
				"m",
				"2",
				"2026-01-03",
				"codex",
				"",
				"",
				"2",
				"",
				"",
				"",
				"",
				"",
				"1",
				"",
				"",
				"",
				"",
			]),
			round([
				"m",
				"3",
				"2026-02-03",
				"claude",
				"",
				"",
				"bad",
				"",
				"8/8",
				"",
				"0",
				"0",
				"0",
				"",
				"",
				"",
				"",
			]),
		];
		const result = analyzeRecordTexts({
			roundsText: [roundHeader, ...rows].join("\n"),
			findingsText: `${findingHeader}\n`,
		});
		const january = result.rounds.find((item) => item.month === "2026-01");
		const codex = january?.writers.find((item) => item.writer === "codex");
		if (!january || !codex) throw new Error("January codex trend missing");
		expect(january.n).toBe(2);
		expect(codex.mean_attempts).toMatchObject({ value: 1.5, count: 2, n: 2 });
		expect(codex.repair_share).toMatchObject({ value: 0.5, count: 2 });
		expect(codex.heldout_rows).toMatchObject({
			passed: 9,
			graded: 10,
			count: 1,
		});
		expect(codex.brief_caused_fails_per_round).toMatchObject({
			value: 2,
			count: 1,
		});
		expect(codex.unknown.heldout_rows).toBe(1);
		expect(codex.unknown.brief_caused_fails_per_round).toBe(1);
	});

	it("lists malformed lines and still collects valid rows, including missing files", () => {
		const malformedFindings = [
			findingHeader,
			finding(["F1", "m", "1", "2026-01-02", "x", "a", "open", "", "", ""]),
			finding(["F1", "m", "2", "2026-01-03", "x", "b", "fixed", "", "", ""]),
			finding(["F3", "m", "3", "2026-01-04", "x", "c", "", "", "", ""]),
			"too\tfew",
		].join("\n");
		const result = analyzeRecordTexts({
			roundsText: null,
			findingsText: malformedFindings,
			roundsFile: "rounds.tsv",
			findingsFile: "findings.tsv",
		});
		expect(result.missing).toEqual([
			{ file: "rounds.tsv", reason: "file not found" },
		]);
		expect(result.malformed).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					file: "findings.tsv",
					line: 3,
					reason: expect.stringContaining("duplicate id"),
				}),
				expect.objectContaining({
					file: "findings.tsv",
					line: 4,
					reason: "unreadable status",
				}),
				expect.objectContaining({
					file: "findings.tsv",
					line: 5,
					reason: expect.stringContaining("wrong number of fields"),
				}),
			]),
		);
		expect(result.findings.classes).toEqual([
			{ class: "x", open: 1, fixed: 1, other: 0 },
		]);
	});

	it("reads the real files without inventing a missing-file result", async () => {
		const result = await collectRecordSurvey({ checkout: process.cwd() });
		expect(result.missing).toEqual([]);
		expect(result.rounds.length).toBeGreaterThan(0);
		expect(
			result.findings.classes.reduce(
				(sum, item) => sum + item.open + item.fixed + item.other,
				0,
			),
		).toBeGreaterThan(0);
	});
});
