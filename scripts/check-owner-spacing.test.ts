import { describe, expect, it } from "vitest";
import {
	aggregateOffScale,
	baselineKey,
	buildBaseline,
	classifySpacingValue,
	diffSpacing,
	offScaleComponents,
	parseSpacingDeclarations,
	splitValueComponents,
} from "./check-owner-spacing.mjs";

describe("classifySpacingValue", () => {
	it("accepts scale values, tokens, and expressions", () => {
		for (const value of [
			"0",
			"0px",
			"auto",
			"4px",
			"16px",
			"var(--fw-space-4)",
			"var(--x, 4px)",
			"100%",
			"calc(100% - 1px)",
			"clamp(1px, 2vw, 4px)",
			"max(24px, env(safe-area-inset-left))",
		]) {
			expect(classifySpacingValue(value)).toBe("ok");
		}
	});

	it("flags values off the 4px grid", () => {
		for (const value of [
			"1px",
			"2px",
			"6px",
			"10px",
			"18px",
			"22px",
			"-2px",
			"0.5rem",
		]) {
			expect(classifySpacingValue(value)).toBe("off-scale");
		}
	});

	it("accepts negative multiples of 4", () => {
		expect(classifySpacingValue("-4px")).toBe("ok");
		expect(classifySpacingValue("-8px")).toBe("ok");
	});
});

describe("splitValueComponents", () => {
	it("keeps parenthesised expressions together", () => {
		expect(splitValueComponents("18px 22px")).toEqual(["18px", "22px"]);
		expect(splitValueComponents("0 8px 16px")).toEqual(["0", "8px", "16px"]);
		expect(
			splitValueComponents("max(24px, env(safe-area-inset-left))"),
		).toEqual(["max(24px, env(safe-area-inset-left))"]);
	});
});

describe("offScaleComponents", () => {
	it("reports only off-scale components of a shorthand", () => {
		expect(offScaleComponents("0 8px 16px")).toEqual([]);
		expect(offScaleComponents("18px 22px")).toEqual(["18px", "22px"]);
	});
});

describe("parseSpacingDeclarations", () => {
	const css = `
.surface {
	/* gap: 6px; inside a comment */
	gap: 18px;
	padding: 4px 8px;
	transition: all 1s;
	margin-block-start: 0;
}
`;

	it("captures spacing declarations with file and line", () => {
		const declarations = parseSpacingDeclarations(css, "example.css");
		expect(declarations).toEqual([
			expect.objectContaining({
				file: "example.css",
				property: "gap",
				value: "18px",
			}),
			expect.objectContaining({ property: "padding", value: "4px 8px" }),
			expect.objectContaining({ property: "margin-block-start", value: "0" }),
		]);
		expect(declarations[0]?.line).toBe(4);
	});

	it("ignores the declaration inside the comment", () => {
		const declarations = parseSpacingDeclarations(css, "example.css");
		expect(declarations.some((entry) => entry.value === "6px")).toBe(false);
	});
});

describe("aggregateOffScale and diffSpacing", () => {
	function aggregate(css: string) {
		return aggregateOffScale(parseSpacingDeclarations(css, "example.css"));
	}

	it("counts off-scale components by file, property, and value", () => {
		const { entries, locations } = aggregate(`
.a { gap: 6px; padding: 18px 22px; }
.b { gap: 6px; }
`);
		expect(entries.get("example.css|gap|6px")).toBe(2);
		expect(entries.get("example.css|padding|18px")).toBe(1);
		expect(entries.get("example.css|padding|22px")).toBe(1);
		expect(locations.get("example.css|gap|6px")).toHaveLength(2);
	});

	it("fails on new declarations and on vanished baseline entries", () => {
		const css = ".a { gap: 6px; }";
		const { entries } = aggregate(css);
		const baseline = buildBaseline(entries);
		expect(baseline).toEqual([
			{ file: "example.css", property: "gap", value: "6px", count: 1 },
		]);
		const [frozenEntry] = baseline;
		if (!frozenEntry) throw new Error("missing baseline entry");
		expect(baselineKey(frozenEntry)).toBe("example.css|gap|6px");
		expect(diffSpacing(entries, baseline)).toEqual({
			added: [],
			vanished: [],
		});

		const grown = aggregate(".a { gap: 6px; gap: 10px; }").entries;
		const grownDiff = diffSpacing(grown, baseline);
		expect(grownDiff.added.map((entry) => entry.value)).toEqual(["10px"]);
		expect(grownDiff.vanished).toEqual([]);

		const shrunk = aggregate(".a { gap: 8px; }").entries;
		const shrunkDiff = diffSpacing(shrunk, baseline);
		expect(shrunkDiff.added).toEqual([]);
		expect(shrunkDiff.vanished).toEqual([
			{
				file: "example.css",
				property: "gap",
				value: "6px",
				frozen: 1,
				count: 0,
			},
		]);
	});
});
