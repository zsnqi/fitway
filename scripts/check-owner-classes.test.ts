import { describe, expect, it } from "vitest";
import {
	classSatisfied,
	collectClassTokens,
	collectCssClasses,
	evaluateClassContracts,
	extractClassNames,
	extractClassTokens,
	resolveClassAllowlist,
} from "./check-owner-classes.mjs";

describe("extractClassTokens", () => {
	it("reads static class lists", () => {
		expect(extractClassTokens("owner-a owner-b--x")).toEqual([
			{ token: "owner-a", prefix: false },
			{ token: "owner-b--x", prefix: false },
		]);
	});

	it("records template holes as prefixes", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: the input must carry a literal template hole
		expect(extractClassTokens("owner-a owner-b--${variant}")).toEqual([
			{ token: "owner-a", prefix: false },
			{ token: "owner-b--", prefix: true },
		]);
	});
});

describe("extractClassNames", () => {
	it("reads nested template literals and expression literals", () => {
		const source = `
			<div className={\`owner-a\${active ? " owner-b" : ""}\`} />
			<div className={error ? "owner-c" : "owner-d"} />
			<span positionerClassName="owner-e" className='owner-f' />
		`;
		const values = extractClassNames(source).map((entry) => entry.value);
		expect(values).toEqual([
			// biome-ignore lint/suspicious/noTemplateCurlyInString: the extracted value is the raw template text
			'owner-a${active ? " owner-b" : ""}',
			" owner-b",
			"",
			"owner-c",
			"owner-d",
			"owner-e",
			"owner-f",
		]);
		const tokens = [...collectClassTokens(source).keys()];
		expect(tokens).toContain("owner-b");
		expect(tokens).toContain("owner-d");
	});
});

describe("collectCssClasses", () => {
	it("matches class selectors and skips comments", () => {
		const classes = collectCssClasses(
			"/* .owner-ghost */\n.owner-a { color: red; }\n.owner-b.owner-c { gap: 4px; }",
		);
		expect([...classes.keys()]).toEqual(["owner-a", "owner-b", "owner-c"]);
	});
});

describe("classSatisfied", () => {
	it("matches exact and prefix references", () => {
		expect(classSatisfied("owner-a", { token: "owner-a", prefix: false })).toBe(
			true,
		);
		expect(
			classSatisfied("owner-a--x", { token: "owner-a", prefix: true }),
		).toBe(true);
		expect(classSatisfied("owner-b", { token: "owner-a", prefix: true })).toBe(
			false,
		);
	});
});

describe("evaluateClassContracts", () => {
	const tsxSources = [
		{
			relative: "view.tsx",
			content:
				// biome-ignore lint/suspicious/noTemplateCurlyInString: the fixture must carry a literal template hole
				'<div className="owner-known owner-missing owner-state--${variant}" />',
		},
	];
	const cssSources = [
		{
			relative: "view.css",
			content:
				".owner-known { color: red; }\n.owner-state--ready { display: grid; }\n.owner-dead { display: none; }",
		},
	];

	it("fails classes without a rule unless allowlisted", () => {
		const result = evaluateClassContracts({
			tsxSources,
			cssSources,
			allowlist: new Map(),
		});
		expect(result.missing.map((entry) => entry.token)).toEqual([
			"owner-missing",
		]);
		expect(result.unreferenced.map((entry) => entry.name)).toEqual([
			"owner-dead",
		]);
	});

	it("accepts allowlisted names and prefix matches", () => {
		const result = evaluateClassContracts({
			tsxSources: [
				{
					relative: "view.tsx",
					// biome-ignore lint/suspicious/noTemplateCurlyInString: the fixture must carry a literal template hole
					content: '<div className="owner-missing owner-state--${variant}" />',
				},
			],
			cssSources: [
				{
					relative: "view.css",
					content: ".owner-state--error { color: red; }",
				},
			],
			allowlist: new Map([["owner-missing", "test-only hook"]]),
		});
		expect(result.missing).toEqual([]);
	});
});

describe("resolveClassAllowlist", () => {
	it("requires a name and reason", () => {
		expect(() =>
			resolveClassAllowlist([{ name: "owner-a", reason: "test hook" }]),
		).not.toThrow();
		expect(() => resolveClassAllowlist([{ name: "owner-a" }])).toThrow();
		expect(() =>
			resolveClassAllowlist([{ name: "not-owner", reason: "x" }]),
		).toThrow();
	});
});
