import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import {
	createUnitConcept,
	removeUnitConcept,
	scratch,
} from "./cli-test-harness.mjs";
import { stateCases } from "./drive-plan.mjs";
import { generateMap, readRecipes } from "./map.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

test("V1: ended-rule declarations are exact and checked when recipes load", async () => {
	const root = resolve(scratch, "ends-validation");
	const recipePath = resolve(root, "verification-recipes.json");
	await mkdir(root, { recursive: true });
	const write = async (ends) => {
		await writeFile(
			recipePath,
			JSON.stringify({
				schema: 1,
				pages: {
					"fixture.html": {
						features: [],
						states: [
							{
								when: { state: "loading" },
								shows: "Loading",
								proof: { selector: "main", visible: true },
							},
							{
								when: { arrive: "500" },
								afterActions: true,
								ends,
								shows: "Arrived",
								proof: { expression: "document.body !== null" },
							},
						],
					},
				},
			}),
		);
	};
	for (const [ends, message] of [
		[[{ when: { state: "ready" } }], /matches no before rule/],
		[[{ when: {} }], /non-wildcard when/],
		[[{ shows: "Loading" }], /may only name when/],
	]) {
		await write(ends);
		assert.throws(() => readRecipes(root), message);
	}
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							when: { state: "loading" },
							shows: "Loading one",
							proof: { selector: "main", visible: true },
						},
						{
							when: { state: "loading" },
							shows: "Loading two",
							proof: { selector: "main", visible: true },
						},
						{
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.throws(() => readRecipes(root), /matches several before rules/);
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							when: { state: "loading", arrive: "500" },
							shows: "Loading",
							proof: { selector: "main", visible: true },
						},
						{
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { arrive: "500", state: "loading" } }],
							shows: "Arrived",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.doesNotThrow(() => readRecipes(root));
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							language: "ar",
							when: { state: "loading" },
							shows: "Loading in Arabic",
							proof: { selector: "main", visible: true },
						},
						{
							language: "en",
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived in English",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.throws(() => readRecipes(root), /matches no before rule/);
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							language: "ar",
							when: { state: "loading" },
							shows: "Loading in Arabic",
							proof: { selector: "main", visible: true },
						},
						{
							when: { state: "loading" },
							shows: "Loading in every language",
							proof: { selector: "main", visible: true },
						},
						{
							language: "ar",
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived in Arabic",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.throws(() => readRecipes(root), /matches several before rules/);
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							language: "ar",
							when: { state: "loading" },
							shows: "Loading in Arabic",
							proof: { selector: "main", visible: true },
						},
						{
							language: "en",
							when: { state: "loading" },
							shows: "Loading in English",
							proof: { selector: "main", visible: true },
						},
						{
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.doesNotThrow(() => readRecipes(root));
});

test("V1: a feature's ended-rule declarations are exact for every item", async () => {
	const root = resolve(scratch, "feature-ends-validation");
	const recipePath = resolve(root, "verification-recipes.json");
	await mkdir(root, { recursive: true });
	const states = [
		{
			when: { state: "loading" },
			shows: "Loading",
			proof: { selector: "main", visible: true },
		},
	];
	const feature = (overrides = {}) => ({
		id: "close",
		actions: ["activate:#close"],
		proof: { selector: "#closed", hidden: true },
		ends: [{ when: { state: "loading" } }],
		...overrides,
	});
	const write = async (value, pageStates = states) => {
		await writeFile(
			recipePath,
			JSON.stringify({
				schema: 1,
				pages: { "fixture.html": { features: [value], states: pageStates } },
			}),
		);
	};

	await write(feature());
	assert.doesNotThrow(() => readRecipes(root));

	for (const [value, message] of [
		[feature({ changesState: true }), /both changesState and ends/],
		[
			feature({ ends: { when: { state: "loading" } } }),
			/ends must be an array/,
		],
		[feature({ ends: [{ when: {} }] }), /non-wildcard when/],
		[feature({ ends: [{ shows: "Loading" }] }), /may only name when/],
		[
			feature({ ends: [{ when: { state: "ready" } }] }),
			/matches no before rule/,
		],
		[
			feature({
				items: [
					{ actions: ["activate:#one"], input: "mouse" },
					{ actions: ["activate:#two"], input: "mouse" },
				],
			}),
			/actions and inputs/,
		],
		[
			feature({
				items: [
					{ actions: ["activate:#one"], input: "mouse" },
					{ actions: ["activate:#one"], input: "touch" },
				],
			}),
			/actions and inputs/,
		],
		[
			feature({ keyboardActions: ["activate:#different"] }),
			/actions and inputs/,
		],
	]) {
		await write(value);
		assert.throws(() => readRecipes(root), message);
	}

	await write(feature(), [
		...states,
		{
			when: { state: "loading" },
			shows: "Loading again",
			proof: { selector: "main", visible: true },
		},
	]);
	assert.throws(() => readRecipes(root), /matches several before rules/);
});

test("V3: recipe dependencies merge with source dependencies and conflicts are refused", async () => {
	const root = resolve(scratch, "dependency-map");
	await mkdir(root);
	await writeFile(
		resolve(root, "fixture.html"),
		'<main>Fixture</main><script src="app.js"></script>',
	);
	await writeFile(
		resolve(root, "app.js"),
		`const params=new URLSearchParams(location.search);
const arrive=params.get("arrive");
const from=params.get("from");
const to=params.get("to");
const state=params.get("state");
if(params.get("state")==="loading" && params.get("arrive")==="500"){}
window.__fixture={ready:true};`,
	);
	const recipePath = resolve(root, "verification-recipes.json");
	const recipes = {
		schema: 1,
		pages: {
			"fixture.html": {
				features: [],
				states: [],
				samples: {
					arrive: ["500"],
					from: ["2026-09-01"],
					to: ["2026-09-10"],
				},
				dependencies: [
					{
						switch: "arrive",
						value: "500",
						requires: [{ name: "state", value: "loading" }],
					},
					{
						switch: "from",
						value: "2026-09-01",
						requires: [{ name: "to", value: "2026-09-10" }],
					},
					{
						switch: "to",
						value: "2026-09-10",
						requires: [{ name: "from", value: "2026-09-01" }],
					},
				],
			},
		},
	};
	await writeFile(recipePath, JSON.stringify(recipes));
	const page = generateMap(root, recipePath).pages[0];
	const cases = stateCases(page, { states: "all" });
	const arrive = cases.find((entry) => entry.query.arrive === "500");
	assert.equal(arrive.query.state, "loading");
	const from = cases.find((entry) => entry.query.from === "2026-09-01");
	assert.equal(from.query.to, "2026-09-10");
	const to = cases.find((entry) => entry.query.to === "2026-09-10");
	assert.equal(to.query.from, "2026-09-01");
	const conflictPath = resolve(scratch, "dependency-conflict.json");
	await writeFile(
		conflictPath,
		JSON.stringify({
			...recipes,
			pages: {
				"fixture.html": {
					...recipes.pages["fixture.html"],
					dependencies: [
						{
							switch: "arrive",
							value: "500",
							requires: [{ name: "state", value: "error" }],
						},
					],
				},
			},
		}),
	);
	assert.throws(
		() => generateMap(root, conflictPath),
		/declared dependency conflicts with source/,
	);
});
