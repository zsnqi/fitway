import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import { repository } from "./discover.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
const source = fileURLToPath(new URL("./", import.meta.url));
let scratch;
let cli;
let ports;
let serial = 0;
let stallServer;
let stallUrl;

async function port() {
	const server = createServer();
	await new Promise((done) => server.listen(0, "127.0.0.1", done));
	const value = server.address().port;
	await new Promise((done) => server.close(done));
	assert.ok(value >= 49152, `Unsafe fixture port ${value}`);
	return value;
}

before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-hold-"));
	const folder = resolve(scratch, "cli");
	await mkdir(folder);
	ports = [await port(), await port()];
	while (ports[0] === ports[1]) ports[1] = await port();
	for (const name of await readdir(source)) {
		if (!name.endsWith(".mjs") || name.endsWith(".test.mjs")) continue;
		let contents = await readFile(resolve(source, name), "utf8");
		// Run production comparison, drive and capture in a real CLI subprocess.
		// Only dependency lookup and this disposable copy's port guard change:
		// concurrent tests must never bind the coordinator's preview ports.
		if (name === "core.mjs") {
			assert.ok(contents.includes("[3176, 3177].includes(Number(port))"));
			contents = contents.replace(
				"[3176, 3177].includes(Number(port))",
				`${JSON.stringify(ports)}.includes(Number(port))`,
			);
		}
		if (name === "discover.mjs") {
			assert.ok(
				contents.includes(
					'fileURLToPath(new URL("../../../", import.meta.url))',
				),
			);
			contents = contents.replace(
				'fileURLToPath(new URL("../../../", import.meta.url))',
				JSON.stringify(repository),
			);
		}
		await writeFile(resolve(folder, name), contents);
	}
	cli = resolve(folder, "cli.mjs");
	// A native request delays the download action's first seek beyond a short
	// release, while the page's own clocks remain held. This reproduces effects
	// that disappear from getAnimations() before a late capture can discover them.
	stallServer = createServer((_request, response) => {
		setTimeout(() => {
			response.writeHead(200, { "Access-Control-Allow-Origin": "*" });
			response.end("ready");
		}, 240);
	});
	await new Promise((done) => stallServer.listen(0, "127.0.0.1", done));
	assert.ok(stallServer.address().port >= 49152);
	stallUrl = `http://127.0.0.1:${stallServer.address().port}/stall`;
});

after(async () => {
	if (stallServer) await new Promise((done) => stallServer.close(done));
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

async function fixture(name, { css = "", js = "", features = [] }) {
	const folder = resolve(scratch, name);
	await mkdir(resolve(folder, "tools/probes"), { recursive: true });
	await writeFile(
		resolve(folder, "index.html"),
		`<!doctype html><html lang="en" dir="ltr"><head><style>
body{margin:0;background:#222;color:white}button{width:160px;height:60px;margin:30px;border:0;background:#555;color:white}
${css}</style></head><body><main>Clock and release fixture</main><button id="control">Press</button><script src="app.js"></script></body></html>`,
	);
	await writeFile(
		resolve(folder, "app.js"),
		`${js}\nwindow.__fixture={ready:true};`,
	);
	await writeFile(
		resolve(folder, "verification-recipes.json"),
		JSON.stringify({
			schema: 1,
			pages: {
				"index.html": {
					features,
					states: [
						{
							when: {},
							shows: "Fixture",
							proof: { selector: "main", visible: true },
						},
					],
				},
			},
		}),
	);
	await writeFile(
		resolve(folder, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{};export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(folder, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(folder, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=async()=>({});",
	);
	return folder;
}

async function compare(build, baseline, times, feature = "all") {
	const out = resolve(scratch, `comparison-${++serial}`);
	const selectedFeature =
		feature === "all"
			? JSON.parse(
					await readFile(resolve(build, "verification-recipes.json"), "utf8"),
				)
					.pages["index.html"].features.map((entry) => entry.id)
					.join(",")
			: feature;
	const args = [
		cli,
		"compare",
		"--concept",
		build,
		"--baseline",
		baseline,
		"--page",
		"index.html",
		"--feature",
		selectedFeature,
		"--languages",
		"en",
		"--sizes",
		"desktop",
		"--inputs",
		"mouse",
		"--motions",
		"full",
		"--transports",
		"http",
		"--port",
		String(ports[0]),
		"--baseline-port",
		String(ports[1]),
		"--timeline",
		"--timeline-times",
		times,
		"--out",
		out,
	];
	const result = await new Promise((done, reject) => {
		const child = spawn(process.execPath, args, {
			windowsHide: true,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let output = "";
		let timedOut = false;
		const deadline = setTimeout(() => {
			timedOut = true;
			if (process.platform === "win32") {
				// Kill only this test's owned subtree, including a blocked browser.
				spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
					windowsHide: true,
					stdio: "ignore",
				}).on("error", () => child.kill());
			} else child.kill("SIGTERM");
		}, 30000);
		child.stdout.on("data", (data) => {
			output += data;
		});
		child.stderr.on("data", (data) => {
			output += data;
		});
		child.on("error", (error) => {
			clearTimeout(deadline);
			reject(error);
		});
		child.on("close", (code) => {
			clearTimeout(deadline);
			done({ code, output, timedOut });
		});
	});
	assert.equal(
		result.timedOut,
		false,
		`Fixture CLI exceeded 30000 ms\n${result.output}`,
	);
	assert.doesNotMatch(
		result.output,
		/COMPARE PROBLEM|TIMELINE PROBLEM/,
		result.output,
	);
	assert.match(
		result.output,
		/COMPARE (?:PASS|FAIL|INCOMPLETE):/,
		result.output,
	);
	const report = JSON.parse(
		await readFile(resolve(out, "comparison.json"), "utf8"),
	);
	return { ...result, report };
}

function different(result) {
	assert.equal(result.code, 1, result.output);
	assert.match(result.output, /TIMELINE DIFFERENT:/);
	assert.equal(result.report.timelineSummary["not-held"], 0, result.output);
	assert.ok(result.report.timelineSummary.different > 0, result.output);
	for (const item of result.report.items)
		assert.ok(
			item.timeline.samples.some((sample) => sample.result === "different"),
			`${item.feature} never differed\n${result.output}`,
		);
}

test("CLI timeline compares an ordinary and registered-property press release mid-fade", {
	timeout: 120000,
}, async () => {
	const features = [
		{ id: "tap", actions: ["download:#control"], proof: { ready: true } },
		{
			id: "release",
			actions: ["hold:#control", "release"],
			proof: { ready: true },
		},
	];
	for (const registered of [false, true]) {
		const css = (duration) =>
			registered
				? `@property --light{syntax:"<color>";inherits:false;initial-value:transparent}#control{box-shadow:inset 0 0 0 100vmax var(--light);transition:--light ${duration}ms linear}#control:active{--light:rgba(255,255,255,.8);transition-duration:0s}`
				: `#control{box-shadow:inset 0 0 0 100vmax transparent;transition:box-shadow ${duration}ms linear}#control:active{box-shadow:inset 0 0 0 100vmax rgba(255,255,255,.8);transition-duration:0s}`;
		const baseline = await fixture(`release-base-${registered}`, {
			css: css(120),
			js: `control.addEventListener('click',()=>{const request=new XMLHttpRequest();request.open('GET',${JSON.stringify(stallUrl)});request.onload=()=>{const link=document.createElement('a');link.href='data:text/plain,fixture';link.download='release.txt';link.click()};request.send();});`,
			features,
		});
		const plant = await fixture(`release-plant-${registered}`, {
			css: css(160),
			js: `control.addEventListener('click',()=>{const request=new XMLHttpRequest();request.open('GET',${JSON.stringify(stallUrl)});request.onload=()=>{const link=document.createElement('a');link.href='data:text/plain,fixture';link.download='release.txt';link.click()};request.send();});`,
			features,
		});
		const self = await compare(baseline, baseline, "61,141");
		assert.equal(self.code, 0, self.output);
		assert.equal(self.report.timelineSummary.equal, 4, self.output);
		different(await compare(plant, baseline, "61,141"));
	}
});

for (const clock of ["performance.now()", "Date.now()"])
	test(`CLI timeline compares a moment timed from ${clock}`, {
		timeout: 120000,
	}, async () => {
		const features = [
			{ id: "timer", actions: ["activate:#control"], proof: { ready: true } },
		];
		const js = (duration) =>
			`control.addEventListener('click',()=>{const start=${clock};function tick(){if(${clock}-start>=${duration}){control.style.background='#e60032'}else setTimeout(tick,20)}setTimeout(tick,20)});`;
		const baseline = await fixture(`clock-base-${serial}`, {
			js: js(400),
			features,
		});
		const plant = await fixture(`clock-plant-${serial}`, {
			js: js(560),
			features,
		});
		const self = await compare(baseline, baseline, "1,450,650");
		assert.equal(self.report.timelineSummary.equal, 3, self.output);
		different(await compare(plant, baseline, "1,450,650"));
	});

test("CLI timeline keeps startup, event, Date and frame clocks consistent", {
	timeout: 120000,
}, async () => {
	const folder = await fixture("clock-consistency", {
		js: `const first=performance.now();let coherent=first===0&&Date.now()===new Date().getTime()&&Date.now()===Math.floor(performance.timeOrigin+first);
function check(t){const now=performance.now();coherent&&=Date.now()===new Date().getTime()&&Date.now()===Math.floor(performance.timeOrigin+now)&&(t===undefined||t===now)}
requestAnimationFrame(t=>{check(t);window.started=true});
let retained,delivered;control.onkeyup=e=>{retained=e;delivered=performance.now()};
let loadEvent,loadAt,messageEvent,messageAt,inlineEvent,inlineAt;
const request=new XMLHttpRequest();request.onload=e=>{loadEvent=e;loadAt=performance.now()};
const channel=new MessageChannel();channel.port1.onmessage=e=>{messageEvent=e;messageAt=performance.now()};
window.keepInline=e=>{inlineEvent=e;inlineAt=performance.now()};control.setAttribute('onkeydown','keepInline(event)');
control.addEventListener('click',e=>{check(e.timeStamp);const at=e.timeStamp;requestAnimationFrame(t=>check(t));setTimeout(()=>{control.dispatchEvent(new Event('keyup'));request.dispatchEvent(new Event('load'));channel.port1.dispatchEvent(new MessageEvent('message'));control.dispatchEvent(new Event('keydown'))},20);setTimeout(()=>{coherent&&=e.timeStamp===at&&retained.timeStamp===delivered&&loadEvent.timeStamp===loadAt&&messageEvent.timeStamp===messageAt&&inlineEvent.timeStamp===inlineAt;check()},30)});
window.checkClock=()=>coherent&&window.started;`,
		features: [
			{
				id: "clock",
				actions: ["activate:#control"],
				proof: { expression: "window.checkClock()" },
			},
		],
	});
	const result = await compare(folder, folder, "1,21,41,101");
	assert.equal(result.code, 0, result.output);
	assert.equal(result.report.timelineSummary.equal, 4, result.output);
});

test("CLI timeline still reports actual same-side frame variation as NOT-HELD", {
	timeout: 120000,
}, async () => {
	const folder = await fixture("varying", {
		js: "control.addEventListener('click',()=>{const bytes=crypto.getRandomValues(new Uint8Array(3));control.animate([{backgroundColor:'rgb('+bytes.join(',')+')'},{backgroundColor:'#555'}],{duration:100,fill:'forwards'})});",
		features: [
			{ id: "random", actions: ["activate:#control"], proof: { ready: true } },
		],
	});
	const result = await compare(folder, folder, "1,21,41");
	assert.equal(result.code, 0, result.output);
	assert.match(result.output, /TIMELINE NOT-HELD:/);
	assert.equal(result.report.timelineSummary["not-held"], 3, result.output);
	for (const sample of result.report.items[0].timeline.samples)
		assert.ok(
			Object.values(sample.stability).some((pair) => pair?.identical === false),
		);
});
