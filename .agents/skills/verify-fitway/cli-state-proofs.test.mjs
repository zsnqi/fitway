import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { createUnitConcept, removeUnitConcept } from "./cli-test-harness.mjs";
import { runnerFixture } from "./cli-test-runner-fixture.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

test("V1: afterActions state proofs run after the feature and must read the page", async () => {
	const features = [
		{
			id: "open",
			actions: ["activate:#opener"],
			proof: { selector: "#dialog", visible: true },
		},
	];
	const passing = await runnerFixture("after-actions-pass", features, {
		mapStates: [
			{
				when: { state: "after" },
				afterActions: true,
				shows: "Dialog after action",
				proof: { selector: "#dialog", visible: true },
			},
		],
		switches: [{ name: "state", values: ["after"], samples: [] }],
		states: "state=after",
	});
	assert.equal(
		passing.result.status,
		0,
		passing.result.stderr + passing.result.stdout,
	);
	const [summary] = JSON.parse(
		await readFile(resolve(passing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(summary.proof, ["Dialog after action"]);
	const refused = await runnerFixture("after-actions-refused", features, {
		mapStates: [
			{
				when: { state: "after" },
				afterActions: true,
				shows: "Not page reading",
				proof: { ready: true },
			},
		],
		switches: [{ name: "state", values: ["after"], samples: [] }],
		states: "state=after",
	});
	assert.equal(refused.result.status, 1);
	const refusedSummary = JSON.parse(
		await readFile(resolve(refused.out, "summary.json"), "utf8"),
	);
	assert.match(
		refusedSummary[0].problems.join(" "),
		/afterActions state proof must read the page with a selector or expression/,
	);
});

test("V1: ended rules lift only the matching language's before rule", async () => {
	const features = [
		{ id: "page", actions: [], proof: { selector: "main", visible: true } },
	];
	const { out, result } = await runnerFixture(
		"ended-language-rules",
		features,
		{
			inputs: "mouse",
			languages: "ar,en",
			mapStates: [
				{
					language: "ar",
					when: { state: "loading" },
					shows: "Arabic loading",
					proof: { selector: "main", visible: true },
				},
				{
					language: "en",
					when: { state: "loading" },
					shows: "English loading",
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
			switches: [
				{ name: "state", values: ["loading"], samples: [] },
				{ name: "arrive", values: ["500"], samples: [] },
			],
			states: "state=loading&arrive=500",
		},
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const summaries = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.deepEqual(
		summaries.map((item) => ({
			afterFrameProof: item.afterFrameProof,
			language: item.language,
			proof: item.proof,
		})),
		[
			{
				afterFrameProof: [],
				language: "ar",
				proof: ["Arabic loading", "Arrived"],
			},
			{
				afterFrameProof: [],
				language: "en",
				proof: ["English loading", "Arrived"],
			},
		],
	);
});

test("V1: a time-changing state is captured before its declared after-action arrival", async () => {
	const features = [{ id: "page", actions: [], proof: { ready: true } }];
	const mapStates = [
		{
			when: { state: "loading" },
			shows: "Loading",
			proof: { expression: "window.__fixturePhase === 'loading'" },
		},
		{
			when: { arrive: "500" },
			afterActions: true,
			ends: [{ when: { state: "loading" } }],
			shows: "Arrived",
			proof: { expression: "window.__fixturePhase === 'ready'" },
		},
	];
	const options = {
		dynamicState: true,
		transitionAfterProofs: 2,
		mapStates,
		switches: [
			{ name: "state", values: ["loading"], samples: [] },
			{ name: "arrive", values: ["500"], samples: [] },
		],
		states: "state=loading&arrive=500",
	};
	const passing = await runnerFixture("time-changing-pass", features, options);
	assert.equal(
		passing.result.status,
		0,
		passing.result.stderr + passing.result.stdout,
	);
	const passingManifest = JSON.parse(
		await readFile(resolve(passing.out, "manifest.json"), "utf8"),
	);
	assert.equal(passingManifest.items[0].files.length, 2);
	assert.equal(
		await readFile(
			resolve(passing.out, passingManifest.items[0].files[0]),
			"utf8",
		),
		"loading",
	);
	assert.equal(
		await readFile(
			resolve(passing.out, passingManifest.items[0].files[1]),
			"utf8",
		),
		"ready",
	);
	const passingSummary = JSON.parse(
		await readFile(resolve(passing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(passingSummary[0].proof, ["Loading", "Arrived"]);

	const forced = await runnerFixture("time-changing-forced", features, {
		...options,
		transitionOnCapture: true,
	});
	assert.equal(forced.result.status, 1);
	const forcedSummary = JSON.parse(
		await readFile(resolve(forced.out, "summary.json"), "utf8"),
	);
	assert.match(
		forcedSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
});

test("V1: post-capture proofs hold every state an arrival does not end", async () => {
	const features = [{ id: "page", actions: [], proof: { ready: true } }];
	const switches = [
		{ name: "state", values: ["loading"], samples: [] },
		{ name: "arrive", values: ["500"], samples: [] },
	];
	const postBefore = await runnerFixture("post-before-proof", features, {
		dynamicState: true,
		capturePhases: ["ready"],
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Loading",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				shows: "Arrived",
				proof: { expression: "window.__fixturePhase === 'ready'" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		postBefore.result.status,
		1,
		postBefore.result.stderr + postBefore.result.stdout,
	);
	const postBeforeSummary = JSON.parse(
		await readFile(resolve(postBefore.out, "summary.json"), "utf8"),
	);
	assert.match(
		postBeforeSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
	assert.ok(
		postBeforeSummary[0].files.some((file) => file.endsWith("-before.png")),
	);

	const preAfter = await runnerFixture("pre-after-proof", features, {
		dynamicState: true,
		transitionAfterProofs: 4,
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Loading",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				shows: "Arrival companion",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				ends: [{ when: { state: "loading" } }],
				shows: "Arrived",
				proof: { expression: "window.__fixturePhase === 'ready'" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		preAfter.result.status,
		1,
		preAfter.result.stderr + preAfter.result.stdout,
	);
	const preAfterSummary = JSON.parse(
		await readFile(resolve(preAfter.out, "summary.json"), "utf8"),
	);
	assert.match(
		preAfterSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
	assert.equal(
		preAfterSummary[0].files.some((file) => file.endsWith("-after.png")),
		false,
	);

	const postAfter = await runnerFixture("post-after-proof", features, {
		dynamicState: true,
		capturePhases: [null, "ready"],
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Loading",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				shows: "Arrived",
				proof: { expression: "document.body !== null" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		postAfter.result.status,
		1,
		postAfter.result.stderr + postAfter.result.stdout,
	);
	const postAfterSummary = JSON.parse(
		await readFile(resolve(postAfter.out, "summary.json"), "utf8"),
	);
	assert.match(
		postAfterSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
	assert.deepEqual(postAfterSummary[0].afterFrameProof, ["Loading"]);
	assert.ok(
		postAfterSummary[0].files.some((file) => file.endsWith("-after.png")),
	);

	const afterAction = await runnerFixture("after-action-proof", features, {
		dynamicState: true,
		transitionAfterProofs: 0,
		capturePhases: [null, "loading"],
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Static",
				proof: { expression: "document.body !== null" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				shows: "Arrived",
				proof: { expression: "window.__fixturePhase === 'ready'" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		afterAction.result.status,
		1,
		afterAction.result.stderr + afterAction.result.stdout,
	);
	const afterActionSummary = JSON.parse(
		await readFile(resolve(afterAction.out, "summary.json"), "utf8"),
	);
	assert.match(
		afterActionSummary[0].problems.join(" "),
		/arrival state not observed/,
	);
	assert.deepEqual(afterActionSummary[0].afterFrameProof, ["Static"]);
});

test("V1: a feature ends only the before rules it declares", async () => {
	const features = [
		{
			id: "page",
			actions: [],
			proof: { ready: true },
			ends: [{ when: { state: "loading" } }],
		},
	];
	const switches = [
		{ name: "state", values: ["loading"], samples: [] },
		{ name: "flag", values: ["1"], samples: [] },
	];
	const mapStates = [
		{
			when: { state: "loading" },
			shows: "Ended",
			proof: { expression: "window.__fixturePhase === 'loading'" },
		},
		{
			when: { flag: "1" },
			shows: "Survivor",
			proof: { expression: "document.body !== null" },
		},
	];
	const passing = await runnerFixture("feature-ends-pass", features, {
		dynamicState: true,
		capturePhases: [null, "ready"],
		mapStates,
		switches,
		states: "state=loading&flag=1",
	});
	assert.equal(
		passing.result.status,
		0,
		passing.result.stderr + passing.result.stdout,
	);
	const passingSummary = JSON.parse(
		await readFile(resolve(passing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(passingSummary[0].proof, ["Ended", "Survivor"]);
	assert.deepEqual(passingSummary[0].afterFrameProof, ["Survivor"]);

	const failing = await runnerFixture(
		"feature-ends-failing-survivor",
		features,
		{
			dynamicState: true,
			capturePhases: [null, "ready"],
			mapStates: mapStates.map((rule) =>
				rule.shows === "Survivor"
					? {
							...rule,
							proof: { expression: "window.__fixturePhase === 'loading'" },
						}
					: rule,
			),
			switches,
			states: "state=loading&flag=1",
		},
	);
	assert.equal(
		failing.result.status,
		1,
		failing.result.stderr + failing.result.stdout,
	);
	const failingSummary = JSON.parse(
		await readFile(resolve(failing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(failingSummary[0].afterFrameProof, ["Survivor"]);
	assert.match(failingSummary[0].problems.join(" "), /after-frame:post/);
	assert.match(failingSummary[0].problems.join(" "), /Survivor/);
});

test("V1: failed state proofs name their rule and moment", async () => {
	const states = (proof) => [
		{
			when: { state: "loading" },
			shows: "Ended control",
			proof: { expression: "document.body !== null" },
		},
		{
			when: { flag: "1" },
			shows: "Moment rule",
			proof,
		},
	];
	const switches = [
		{ name: "state", values: ["loading"], samples: [] },
		{ name: "flag", values: ["1"], samples: [] },
	];
	const feature = {
		id: "page",
		actions: [],
		proof: { ready: true },
		ends: [{ when: { state: "loading" } }],
	};
	const moments = [
		{
			moment: "before-frame:pre",
			proof: { expression: "window.__fixturePhase === 'ready'" },
			options: {},
		},
		{
			moment: "before-frame:post",
			proof: { expression: "window.__fixturePhase === 'loading'" },
			options: { transitionOnCapture: true },
		},
		{
			moment: "after-frame:pre",
			proof: { expression: "window.__fixturePhase === 'loading'" },
			options: { transitionAfterProofs: 2 },
		},
		{
			moment: "after-frame:post",
			proof: { expression: "window.__fixturePhase === 'loading'" },
			options: { capturePhases: [null, "ready"] },
		},
	];
	const allMoments = moments.map(({ moment }) => moment);
	for (const { moment, proof, options } of moments) {
		const { out, result } = await runnerFixture(
			`state-proof-${moment.replace(":", "-")}`,
			[feature],
			{
				dynamicState: true,
				mapStates: states(proof),
				switches,
				states: "state=loading&flag=1",
				...options,
			},
		);
		assert.equal(result.status, 1, result.stderr + result.stdout);
		const [summary] = JSON.parse(
			await readFile(resolve(out, "summary.json"), "utf8"),
		);
		const message = summary.problems.join(" ");
		assert.match(message, new RegExp(moment));
		for (const other of allMoments.filter((candidate) => candidate !== moment))
			assert.doesNotMatch(message, new RegExp(other));
		assert.match(message, /Moment rule/);
		assert.match(message, /\[\["flag","1"\]\]/);
		assert.match(message, /language none/);
		assert.match(message, /before rule/);
	}
});

test("V1: equal state-proof shows labels keep distinct rules readable", async () => {
	const run = async (name, when, query) => {
		const { out, result } = await runnerFixture(
			name,
			[
				{
					id: "page",
					actions: [],
					proof: { ready: true },
					ends: [{ when: { state: "loading" } }],
				},
			],
			{
				dynamicState: true,
				mapStates: [
					{
						when: { state: "loading" },
						shows: "Ended control",
						proof: { expression: "document.body !== null" },
					},
					{
						when,
						shows: "Same label",
						proof: { expression: "window.__fixturePhase === 'ready'" },
					},
				],
				switches: [
					{ name: "state", values: ["loading"], samples: [] },
					{ name: query.key, values: [query.value], samples: [] },
				],
				states: `state=loading&${query.key}=${query.value}`,
			},
		);
		assert.equal(result.status, 1, result.stderr + result.stdout);
		const [summary] = JSON.parse(
			await readFile(resolve(out, "summary.json"), "utf8"),
		);
		return summary.problems.join(" ");
	};

	const first = await run(
		"state-proof-shared-shows-a",
		{ flag: "1" },
		{ key: "flag", value: "1" },
	);
	const second = await run(
		"state-proof-shared-shows-b",
		{ other: "2" },
		{ key: "other", value: "2" },
	);
	assert.match(first, /Same label/);
	assert.match(second, /Same label/);
	assert.notEqual(first, second);
});

test("V2: an address-only feature is captured under keyboard", async () => {
	const { result } = await runnerFixture(
		"address-only-keyboard",
		[
			{
				id: "address-only",
				actions: [],
				proof: { selector: "main", visible: true },
			},
		],
		{ inputs: "keyboard" },
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
});
