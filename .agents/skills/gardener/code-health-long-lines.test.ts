import { describe, expect, it } from "vitest";
import { scanScope } from "./code-health.mjs";

function functionLines(
	name: string,
	total: number,
	nested?: { name: string; total: number },
) {
	const inner = nested ? functionLines(nested.name, nested.total) : [];
	const interior = total - 2;
	const filler = Array.from(
		{ length: interior - inner.length },
		(_, index) => `void ${index};`,
	);
	return [`function ${name}() {`, ...inner, ...filler, "}"];
}

function longLineTotal(file: string, text: string) {
	return scanScope([{ file, text }]).longFunctionLines?.total ?? 0;
}

describe("longFunctionLines per file", () => {
	it("counts a new 90-line production function as 90", () => {
		expect(
			longLineTotal("sample.ts", functionLines("sample", 90).join("\n")),
		).toBe(90);
	});

	it("sums a 120-line function and the 90-line function inside it", () => {
		expect(
			longLineTotal(
				"nested.ts",
				functionLines("outer", 120, { name: "inner", total: 90 }).join("\n"),
			),
		).toBe(210);
	});

	it("gives no value to an 80-line function", () => {
		expect(
			longLineTotal("short.ts", functionLines("short", 80).join("\n")),
		).toBe(0);
	});

	it("gives no value to a test file with a 300-line it callback", () => {
		const text = [
			'import { it } from "vitest";',
			'it("long", () => {',
			...Array.from({ length: 298 }, (_, index) => `void ${index};`),
			"});",
		].join("\n");
		expect(longLineTotal("long.test.ts", text)).toBe(0);
	});
});
