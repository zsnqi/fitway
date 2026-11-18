import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import {
	createUnitConcept,
	heldSessions,
	removeUnitConcept,
	runCli,
	scratch,
} from "./cli-test-harness.mjs";
import { isolatedPort } from "./cli-test-previews.mjs";
import { performAction } from "./drive.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

// Stub only the browser/tool boundary; exercise the real CLI and drive runner.
async function heldCliFixture(name, explicitRelease = false) {
	const root = resolve(scratch, name);
	const build = resolve(root, "concept");
	const tools = resolve(root, "tools");
	await mkdir(resolve(build, "tools/probes"), { recursive: true });
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(build, "fixture.html"),
		'<main>Fixture</main><button id="control">Hold</button><script src="app.js"></script>',
	);
	await writeFile(resolve(build, "app.js"), "window.__fixture={ready:true};");
	await writeFile(
		resolve(build, "verification-recipes.json"),
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [
						{
							id: "held",
							actions: [
								"hold:#control",
								...(explicitRelease ? ["release"] : []),
							],
							proof: { ready: true },
						},
						{ id: "next", actions: [], proof: { ready: true } },
					],
					states: [
						{ when: {}, shows: "Fixture state", proof: { ready: true } },
					],
				},
			},
		}),
	);
	await writeFile(
		resolve(build, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(build, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(build, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=()=>({});",
	);
	await writeFile(resolve(tools, "SKILL.md"), "Test adapter");
	await writeFile(resolve(tools, "scripts/web/probe.js"), "");
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.3.1";',
	);
	await writeFile(
		resolve(tools, "scripts/web/lib.mjs"),
		`
import {appendFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
export const TOOL_VERSION="1.3.1";
let held=null;
const event=async(type)=>{await mkdir(process.env.PROBE_OUT,{recursive:true});await appendFile(resolve(process.env.PROBE_OUT,"events.jsonl"),JSON.stringify({type,held:Boolean(held)})+"\\n")};
export const launchChromium=async()=>({close:async()=>{}});
export async function newContext(browser,options){
 await event("item-start");
 const page={setDefaultTimeout(){},
 evaluate:async(fn)=>fn.toString().includes("coarse")?{language:"en",direction:"ltr",coarse:false,touchPoints:0}
 :fn.toString().includes("document.activeElement")?{selector:"body",text:"body"}:{},
 locator:()=>({first(){return this},ariaSnapshot:async()=>"body",waitFor:async()=>{}})};
 return {page,context:{close:async()=>event("context-close")},errors:[],emulation:{}};
}
export async function runAction(page,action){
 await event(action);
 if(action==="hold:#control")held={selector:"#control",input:"mouse",pressedAt:performance.now(),active:true,classification:"stub classification"};
 else if(action==="release")await releaseHeld(page);
 else throw new Error("Unexpected stub action: "+action);
}
export const heldPressInfo=async()=>held;
export async function releaseHeld(){await event("release");held=null;}
export const withParams=(url)=>url;
export const preparePage=async()=>({ready:true});
export const screenshot=async()=>{await event("capture");return Buffer.from(held?"held-frame":"rest-frame")};
export const twoFrames=async()=>{};
export const injectProbe=async()=>{};
export const renderSheet=async(browser,spec,file)=>writeFile(file,"stub sheet");
`,
	);
	const preload = resolve(root, "browser-stub.cjs");
	await writeFile(
		preload,
		`const Module=require("node:module"),load=Module._load;
Module._load=function(name,...args){return name==="@playwright/test"?{chromium:{executablePath:()=>process.execPath}}:load.call(this,name,...args)};`,
	);
	const session = resolve(root, "session");
	const launched = runCli([
		"launch",
		"--concept",
		build,
		"--isolated-port",
		String(await isolatedPort()),
		"--idle-timeout-ms",
		"60000",
		"--out",
		session,
	]);
	assert.equal(launched.status, 0, launched.stderr + launched.stdout);
	heldSessions.push(session);
	const invoke = (command, out, extra = []) =>
		spawnSync(
			process.execPath,
			[
				"--require",
				preload,
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				command,
				"--forensics",
				tools,
				"--out",
				out,
				...(command === "drive" ? ["--session", session] : []),
				...extra,
			],
			{ encoding: "utf8", windowsHide: true },
		);
	const driveArgs = [
		"--concept",
		build,
		"--page",
		"fixture.html",
		"--feature",
		"all",
		"--languages",
		"en",
		"--sizes",
		"desktop",
		"--motions",
		"reduce",
		"--transports",
		"file",
	];
	return { root, tools, invoke, driveArgs };
}
test("R21: CLI saves a held frame, records classification, and releases before the next item", async () => {
	const { root, invoke, driveArgs } = await heldCliFixture("held-cli");
	const out = resolve(root, "out");
	const result = invoke("drive", out, [...driveArgs, "--inputs", "mouse"]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	const item = manifest.items.find(
		(item) => item.feature === "fixture.html/held",
	);
	assert.equal(item.heldPress.classification, "stub classification");
	assert.equal(item.heldPress.selector, "#control");
	assert.equal(item.heldPress.active, true);
	assert.equal(item.heldPress.input, "mouse");
	assert.ok(Number.isFinite(item.heldPress.pressedAt));
	assert.ok(Number.isFinite(item.heldPress.capturedAt));
	assert.ok(Number.isFinite(item.heldPress.captureDelayMs));
	assert.ok(item.heldPress.captureDelayMs >= 0);

	const frame = item.files.find((file) => file.endsWith("-held.png"));
	assert.ok(frame, "no held frame saved");
	assert.equal(await readFile(resolve(out, frame), "utf8"), "held-frame");
	const events = (await readFile(resolve(out, "events.jsonl"), "utf8"))
		.trim()
		.split("\n")
		.map(JSON.parse);
	assert.ok(
		events.some((e) => e.type === "hold:#control"),
		"hold never reached the tool",
	);
	assert.ok(
		events.some((e) => e.type === "capture" && e.held),
		"capture never occurred while held",
	);
	const hold = events.findIndex((e) => e.type === "hold:#control");
	const next = events.findIndex((e, i) => i > hold && e.type === "item-start");
	assert.ok(next > hold, "no next item started");
	assert.equal(events[next].held, false, "next item started with a held press");
	assert.ok(
		events.slice(hold, next).some((e) => e.type === "release"),
		"cleanup never released the press",
	);
});
test("R22: bare release reaches the tool in a recipe before the next item", async () => {
	const { root, invoke, driveArgs } = await heldCliFixture(
		"bare-release",
		true,
	);
	const out = resolve(root, "out");
	const result = invoke("drive", out, [...driveArgs, "--inputs", "mouse"]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	const item = manifest.items.find(
		(item) => item.feature === "fixture.html/held",
	);
	assert.deepEqual(item.actions, ["hold:#control", "release"]);
	assert.equal(item.heldPress.classification, "stub classification");
	const events = (await readFile(resolve(out, "events.jsonl"), "utf8"))
		.trim()
		.split("\n")
		.map(JSON.parse);
	const hold = events.findIndex((e) => e.type === "hold:#control");
	const release = events.findIndex(
		(e, i) => i > hold && e.type === "release" && e.held,
	);
	const next = events.findIndex((e, i) => i > hold && e.type === "item-start");
	assert.ok(hold >= 0 && release > hold && release < next);
	assert.equal(events[next].held, false);
});
test("R22: drive requires 1.3.1 for hold and every release form before reaching tools", async () => {
	let reached = false;
	const ui = {
		TOOL_VERSION: "1.3.0",
		runAction: async () => {
			reached = true;
		},
	};
	for (const action of [
		"hold:#control",
		"release",
		"release:",
		"release:#control",
	]) {
		await assert.rejects(
			performAction(ui, {}, action, "mouse", "", "", {}),
			/Held presses require ui-forensics >=1\.3\.1; found 1\.3\.0/,
		);
	}
	assert.equal(reached, false);
});
test("R22: keyboard refuses bare release before reaching the tool", async () => {
	let reached = false;
	const ui = {
		TOOL_VERSION: "1.3.1",
		runAction: async () => {
			reached = true;
		},
	};
	await assert.rejects(
		performAction(ui, {}, "release", "keyboard", "", "", {}),
		/Keyboard input cannot hold a pointer press; release requires mouse or touch/,
	);
	assert.equal(reached, false);
});
test("R21: CLI keyboard input refuses a held press before reaching the tool", async () => {
	const { root, invoke, driveArgs } = await heldCliFixture("held-keyboard");
	const out = resolve(root, "out");
	const result = invoke("drive", out, [...driveArgs, "--inputs", "keyboard"]);
	assert.equal(result.status, 1, result.stdout);
	assert.match(
		result.stdout,
		/Keyboard input cannot hold a pointer press; hold:#control requires mouse or touch/,
	);
	const events = await readFile(resolve(out, "events.jsonl"), "utf8");
	assert.doesNotMatch(events, /hold:#control/);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(
		manifest.items.find((item) => item.feature === "fixture.html/held").status,
		"keyboard-unreachable",
	);
});

test("R21: CLI forwards hold actions to measurements and refuses tools older than 1.3.1", async () => {
	const { root, tools, invoke } = await heldCliFixture("held-measure");
	await writeFile(
		resolve(tools, "scripts/web/capture.mjs"),
		`import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const args=process.argv.slice(2),out=args[args.indexOf("--out")+1];
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"tool-invoked.json"),JSON.stringify(args));`,
	);
	const out = resolve(root, "current");
	const args = ["--tool", "capture", "--", "--action", "hold:#control"];
	const current = invoke("measure", out, args);
	assert.equal(current.status, 0, current.stderr + current.stdout);
	assert.ok(
		JSON.parse(
			await readFile(resolve(out, "tool-invoked.json"), "utf8"),
		).includes("hold:#control"),
	);
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.3.0";',
	);
	const oldOut = resolve(root, "old");
	const old = invoke("measure", oldOut, args);
	assert.equal(old.status, 1, old.stdout);
	assert.match(
		old.stderr,
		/Held presses require ui-forensics >=1\.3\.1; found 1\.3\.0/,
	);
	assert.equal(existsSync(resolve(oldOut, "tool-invoked.json")), false);
	assert.equal(existsSync(resolve(oldOut, "measure-manifest.json")), false);
});
