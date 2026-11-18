import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import {
	concept,
	createUnitConcept,
	removeUnitConcept,
	scratch,
} from "./cli-test-harness.mjs";
import { runnerFixture } from "./cli-test-runner-fixture.mjs";
import { measurementColors } from "./colors.mjs";
import { focusedElement } from "./drive.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);
test("R20 V1: colours multiply states and reach the context, manifest and FRAME; default stays normal", async () => {
	const features = [{ id: "page", proof: { selector: "main", visible: true } }];
	const { result, out } = await runnerFixture("colours", features, {
		colors: "normal,forced",
		states: ",",
	});
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.deepEqual(
		manifest.items.map((i) => i.colors),
		["normal", "forced", "normal", "forced"],
	);
	assert.equal(manifest.items[1].emulation.forcedColors, "active");
	assert.match(result.stdout, /FRAME PASS: .* file normal/);
	assert.match(result.stdout, /FRAME PASS: .* file forced/);
	assert.notEqual(manifest.items[0].files[0], manifest.items[1].files[0]);
	const normal = await runnerFixture("colours-default", features);
	assert.equal(normal.result.status, 0, normal.result.stderr);
	const one = JSON.parse(
		await readFile(resolve(normal.out, "manifest.json"), "utf8"),
	);
	assert.equal(one.items[0].colors, "normal");
	const invalid = await runnerFixture("colours-invalid", features, {
		colors: "sepia",
	});
	assert.equal(invalid.result.status, 1);
	assert.match(invalid.result.stderr, /Unsupported.*sepia.*normal.*forced/);
});
test("R20 V2: drive, compare and measure refuse forced requests with ui-forensics 1.1.0 before rendering", async () => {
	const tools = resolve(scratch, "old-forensics");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.2.0"; export const CONTEXT_SPEC={forcedColors:{type:"string"}};',
	);
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION = "1.1.0";',
	);
	for (const command of ["drive", "compare", "measure"]) {
		const axes =
			command === "measure"
				? [
						"--tool",
						"focus",
						"--out",
						resolve(scratch, "refusal"),
						"--",
						"--forced-colors",
						"active",
					]
				: ["--colors", "forced"];
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				command,
				"--forensics",
				...(command === "compare" ? [tools, "--baseline", concept] : [tools]),
				...(command === "measure" ? [] : ["--concept", concept]),
				...axes,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1, result.stdout);
		assert.match(result.stderr, /forced.*ui-forensics.*1\.2\.0.*1\.1\.0/i);
		assert.doesNotMatch(result.stdout, /FRAME|DRIVE PASS|COMPARE|MEASURE PASS/);
	}
});
test("R20 V2: measurement matrices and inline options also fail closed, with the tool's whitespace handling", async () => {
	const tools = resolve(scratch, "matrix-old-forensics");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.1.0";',
	);
	const frames = resolve(scratch, "forced-frames.json");
	await writeFile(
		frames,
		JSON.stringify({ matrix: { forcedColors: ["none", "active"] } }),
	);
	for (const extra of [
		["--forced-colors=active"],
		["--each", "forced-colors =none, active"],
		["--frames", frames],
		["--spec", frames],
	]) {
		assert.equal(measurementColors({ extra }).forced, true);
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				"measure",
				"--tool",
				"capture",
				"--forensics",
				tools,
				"--out",
				resolve(scratch, "matrix-refusal"),
				"--",
				...extra,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/Forced colours require ui-forensics >=1\.2\.0.*found 1\.1\.0/,
		);
	}
	assert.deepEqual(measurementColors({ colors: "forced", extra: [] }).args, [
		"--forced-colors",
		"active",
	]);
	assert.throws(
		() => measurementColors({ extra: ["--forced-colors", "sepia"] }),
		/none or active/,
	);
});

test("R30 V1/V2: focus names the page or control and summaries distinguish absence from keyboard access", async () => {
	const { result, out } = await runnerFixture("keyboard-summary", [
		{
			id: "open",
			actions: ["activate:#opener"],
			proof: { selector: "#dialog", visible: true },
		},
		{
			id: "absent",
			actions: [],
			proof: { ready: true },
			unreachable: [
				{ when: {}, reason: "Absent by design", proof: { ready: true } },
			],
		},
		{
			id: "pointer-only",
			actions: ["activate:#pointer-only"],
			proof: { ready: true },
		},
	]);
	assert.equal(result.status, 1, result.stdout);
	assert.match(
		result.stdout,
		/DRIVE FAIL: 3 items; 1 state\/feature unavailable by recipe \(cannot be reached\); 1 pointer feature unreachable by keyboard \(fixture.html\/pointer-only default en desktop keyboard reduce file\); 0 problems/,
	);
	assert.match(
		result.stdout,
		/State\/feature cannot be reached: Absent by design/,
	);
	assert.match(result.stdout, /Pointer feature unreachable by keyboard/);
	assert.match(
		result.stdout,
		/Keyboard focus stopped on the page itself: body \(document\)/,
	);
	assert.doesNotMatch(result.stdout, /Whole page text|\(body\)/);
	assert.equal(result.stderr, "", result.stderr);
	const summary = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.deepEqual(
		summary.map((item) => item.result),
		["pass", "not-reachable", "keyboard-unreachable"],
	);
});

test("R30 V1: focus uses the element's accessibility name or role without reading text content", async () => {
	const focus = { selector: "#control", tag: "input", role: null };
	const node = {
		role: { value: "textbox" },
		name: { value: "Name from associated label" },
	};
	const requests = [];
	let detached = 0;
	const page = {
		evaluate: async () => focus,
		context: () => ({
			newCDPSession: async () => ({
				send: async (method, options) => {
					requests.push([method, options]);
					return method === "Runtime.evaluate"
						? { result: { objectId: "focus" } }
						: method === "Accessibility.getPartialAXTree"
							? { nodes: [node] }
							: {};
				},
				detach: async () => {
					detached++;
				},
			}),
		}),
	};
	assert.equal((await focusedElement(page)).name, "Name from associated label");
	assert.deepEqual(requests[1], [
		"Accessibility.getPartialAXTree",
		{ objectId: "focus", fetchRelatives: false },
	]);
	assert.equal(detached, 1);
	assert.equal(requests.at(-1)[0], "Runtime.releaseObject");
	delete node.name;
	assert.equal((await focusedElement(page)).name, "");
	assert.equal((await focusedElement(page)).role, "textbox");
	focus.page = true;
	focus.tag = "body";
	const count = requests.length;
	assert.equal((await focusedElement(page)).role, "document");
	assert.equal((await focusedElement(page)).name, "");
	assert.equal(requests.length, count);
});

test("R30 repair V3: every comparison mode hides carets and paints fresh tiles without changing ordinary drive", async () => {
	const features = [
		{ id: "page", actions: [], proof: { selector: "main", visible: true } },
	];
	for (const comparisonCapture of [true, false]) {
		const { root, result } = await runnerFixture(
			`caret-${comparisonCapture}`,
			features,
			{
				comparisonCapture,
				motions: "full,reduce",
			},
		);
		assert.equal(result.status, 0, result.stderr + result.stdout);
		const launch = JSON.parse(
			await readFile(resolve(root, "launch.json"), "utf8"),
		);
		assert.deepEqual(
			launch,
			comparisonCapture ? { args: ["--disable-partial-raster"] } : null,
		);
		assert.equal(
			existsSync(resolve(root, "init.jsonl")),
			comparisonCapture,
			"ordinary drive must not install the comparison frame observer",
		);
		const captures = (await readFile(resolve(root, "captures.jsonl"), "utf8"))
			.trim()
			.split("\n")
			.map(JSON.parse);
		assert.equal(
			captures.length,
			4,
			"both before/after frames in both motion modes must use the capture policy",
		);
		for (const capture of captures) {
			assert.deepEqual(
				capture,
				comparisonCapture
					? {
							via: "native",
							options: { fullPage: false, animations: "allow", caret: "hide" },
						}
					: {
							via: "adapter",
							options: {
								method: "playwright",
								fullPage: false,
								animations: "allow",
							},
						},
			);
		}
	}
});

test("R30 V3: comparison waits for finite motion and fixes the phase of persistent motion", async () => {
	const { settleComparison } = await import("./comparison-capture.mjs");
	const finite = {
		playState: "running",
		effect: { getComputedTiming: () => ({ endTime: 200 }) },
		finish() {
			assert.fail("finite motion must finish naturally");
		},
	};
	const persistent = {
		playState: "running",
		currentTime: 187,
		effect: {
			getComputedTiming: () => ({ endTime: Number.POSITIVE_INFINITY }),
		},
		pause() {
			this.playState = "paused";
		},
	};
	const sandbox = {
		window: { __verifyFitwayFrames: { pending: 0 } },
		document: { getAnimations: () => [finite, persistent] },
	};
	const run = (fn) => runInNewContext(`(${fn.toString()})()`, sandbox);
	const page = {
		waitForFunction: async (predicate, arg, options) => {
			assert.equal(arg, undefined);
			assert.equal(options.timeout, 5000);
			assert.equal(
				run(predicate),
				false,
				"capture must wait while the popover is opening",
			);
			assert.equal(persistent.currentTime, 187);
			finite.playState = "finished";
			assert.equal(run(predicate), true);
		},
		evaluate: async (fn) => run(fn),
	};
	await settleComparison(page);
	assert.equal(persistent.playState, "paused");
	assert.equal(persistent.currentTime, 0);
	let captured = false;
	await assert.rejects(
		settleComparison({
			waitForFunction: async () => {
				throw new Error("finite movement never settled");
			},
			evaluate: async () => {
				captured = true;
			},
		}),
		/never settled/,
	);
	assert.equal(captured, false);
});

test("R30 repair 2 R5: finite requestAnimationFrame motion compares equal; endless script motion is a capture problem", async () => {
	const features = [
		{ id: "page", actions: [], proof: { selector: "main", visible: true } },
	];
	const frames = [];
	for (const phase of [1, 4]) {
		const { result, out } = await runnerFixture(
			`raf-finite-${phase}`,
			features,
			{
				comparisonCapture: true,
				motions: "full",
				scriptMotion: "finite",
				scriptPhase: phase,
			},
		);
		assert.equal(result.status, 0, result.stderr + result.stdout);
		const { items } = JSON.parse(
			await readFile(resolve(out, "manifest.json"), "utf8"),
		);
		frames.push(await readFile(resolve(out, items[0].files.at(-1))));
	}
	assert.deepEqual(
		frames[0],
		frames[1],
		"different initial RAF phases must capture the same final picture",
	);
	assert.deepEqual(
		JSON.parse(frames[0]),
		{ x: 20 },
		"the script must finish naturally before capture",
	);
	const { result, out } = await runnerFixture("raf-endless", features, {
		comparisonCapture: true,
		motions: "full",
		scriptMotion: "forever",
	});
	assert.equal(result.status, 1);
	const { items } = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(items[0].status, "problem");
	assert.equal(
		items[0].files.length,
		0,
		"unsettled frames must never be saved or passed",
	);
	assert.match(
		items[0].problems.join(" "),
		/Comparison capture did not settle \(5000 ms bound\).*script motion still schedules frames/,
	);
	assert.match(result.stdout, /FRAME PROBLEM:/);
});

test("V5: successful feature proof survives in both summaries beside state proof", async () => {
	const proof = { selector: "#dialog", visible: true };
	const { result, out } = await runnerFixture("feature-proof", [
		{ id: "open", actions: ["activate:#opener"], proof },
	]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const [summary] = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.equal(summary.result, "pass");
	assert.deepEqual(summary.proof, ["Fixture state"]);
	assert.deepEqual(summary.featureProof, proof);
	const itemFile = (await readdir(out)).find((file) =>
		file.endsWith("-summary.json"),
	);
	assert.deepEqual(
		JSON.parse(await readFile(resolve(out, itemFile), "utf8")).featureProof,
		proof,
	);
	const { result: failed, out: failedOut } = await runnerFixture(
		"unproved-feature",
		[{ id: "closed", actions: ["focus:#opener"], proof }],
	);
	assert.equal(failed.status, 1);
	const [unproved] = JSON.parse(
		await readFile(resolve(failedOut, "summary.json"), "utf8"),
	);
	assert.equal(unproved.featureProof, undefined);
});
