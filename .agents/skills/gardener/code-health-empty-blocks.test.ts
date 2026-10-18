import { describe, expect, it } from "vitest";
import { readCodeHealthFiles } from "../../../scripts/agent-environment/code-health-baseline.mjs";
import { scanScope } from "./code-health.mjs";

function emptyBlocks(text: string) {
	return (
		scanScope([{ file: "empty.ts", text }]).emptyBlocks ?? {
			total: 0,
			hits: [],
		}
	);
}

describe("emptyBlocks", () => {
	it.each([
		["empty function", "function empty() {}", 1, 1],
		["empty arrow", "const empty = () => {};", 1, 1],
		["empty catch", "try {\n\trun();\n} catch {}", 1, 3],
		["empty if", "if (ready) {}", 1, 1],
		["empty else", "if (ready) run();\nelse {}", 1, 2],
		["empty for loop", "for (const item of items) {}", 1, 1],
		["empty while loop", "while (ready) {}", 1, 1],
		["empty do loop", "do {} while (ready);", 1, 1],
		["empty switch", "switch (value) {}", 1, 1],
		["empty static block", "class Example {\n\tstatic {}\n}", 1, 2],
		["empty object literal", "const object = {};", 0, 0],
		["comment-only block", "if (ready) {\n\t// intentional\n}", 0, 0],
	])("matches Biome for an %s", (_name, text, expected, line) => {
		const result = emptyBlocks(text);
		expect(result.total).toBe(expected);
		expect(result.hits.map((hit) => hit.line)).toEqual(expected ? [line] : []);
	});

	it("finds Biome's 9 empty blocks outside test files at this HEAD", () => {
		expect(scanScope(readCodeHealthFiles()).emptyBlocks?.total ?? 0).toBe(9);
	});

	it("does not count an empty block in a test file", () => {
		const text = 'it("waits", () => {});';
		expect(scanScope([{ file: "empty.ts", text }]).emptyBlocks.total).toBe(1);
		expect(scanScope([{ file: "empty.test.ts", text }]).emptyBlocks).toEqual({
			total: 0,
			hits: [],
		});
	});
});
