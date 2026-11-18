import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { itemSummary } from "./capture-records.mjs";
import { child, doctorFix, playwright } from "./cli.mjs";
import {
	cliPath,
	concept,
	createUnitConcept,
	portObserverPath,
	recipes,
	removeUnitConcept,
	runCli,
	scratch,
} from "./cli-test-harness.mjs";
import { isolatedPort } from "./cli-test-previews.mjs";
import {
	assertOutsideGit,
	outputFile,
	shortFinding,
	verificationPort,
} from "./core.mjs";
import { copyAllFixture, copyHelpFixture } from "./fixture-copy.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

test("T8: Windows declared, runtime, nested and caught skips fail by name/reason; other platforms skip", async () => {
	const gate = pathToFileURL(
		fileURLToPath(new URL("./skip-gate.mjs", import.meta.url)),
	).href;
	const env = { ...process.env };
	delete env.NODE_TEST_CONTEXT;
	for (const [name, body] of [
		["declared", 'test("planted declared", {skip:"planted reason"},()=>{});'],
		["runtime", 'test("planted runtime",t=>t.skip("planted reason"));'],
		[
			"nested",
			'test("parent",async t=>{await t.test("planted nested",{skip:"planted reason"},()=>{})});',
		],
		[
			"caught",
			'test("planted caught",t=>{try{t.skip("planted reason")}catch{}});',
		],
		["method", 'test.skip("planted method",()=>{});'],
		["unnamed", 'test(function planted_unnamed(t){t.skip("planted reason")});'],
		["options", 'test({skip:"planted reason"},function planted_options(){});'],
		[
			"hook",
			'beforeEach(t=>t.skip("planted reason"));test("planted hook",()=>{});',
		],
		[
			"hook_caught",
			'beforeEach(t=>{try{t.skip("planted reason")}catch{}});test("planted hook_caught",()=>{});',
		],
		[
			"teardown",
			'afterEach(t=>{try{t.skip("planted reason")}catch{}});test("planted teardown",()=>{});',
		],
	]) {
		const file = resolve(scratch, `skip-${name}.mjs`);
		await writeFile(
			file,
			`import {test as nodeTest,beforeEach,afterEach} from "node:test";import {verificationTest} from ${JSON.stringify(gate)};const test=verificationTest(nodeTest,"win32");${body}`,
		);
		const result = spawnSync(process.execPath, ["--test", file], {
			encoding: "utf8",
			windowsHide: true,
			env,
		});
		assert.notEqual(result.status, 0, result.stdout + result.stderr);
		assert.match(
			result.stdout + result.stderr,
			new RegExp(`planted[ _]${name}`),
		);
		assert.match(result.stdout + result.stderr, /planted reason|test.skip/);
		assert.match(result.stdout, /skipped 0/);
	}
	const file = resolve(scratch, "platform-skip.mjs");
	await writeFile(
		file,
		`import {test as nodeTest} from "node:test";import {verificationTest} from ${JSON.stringify(gate)};const test=verificationTest(nodeTest,"linux");test("Windows only",{skip:"other platform"},()=>{});`,
	);
	const result = spawnSync(process.execPath, ["--test", file], {
		encoding: "utf8",
		windowsHide: true,
		env,
	});
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.match(result.stdout, /skipped 1/);
});
test("Playwright resolves from the skill checkout for a package-free concept", () => {
	const loaded = playwright(concept);
	assert.match(loaded.resolved, /@playwright/);
	assert.ok(loaded.pw.chromium);
});
test("short summary preserves axes, state, result and measuring error without bulk geometry", () => {
	assert.equal(shortFinding("one\n  two"), "one two");
	assert.match(shortFinding("detail ".repeat(1000)), /… \(see record\)$/);
	assert.ok(shortFinding("detail ".repeat(1000)).length < 260);
	const e = {
		feature: "page",
		state: "case=long&record=1001",
		query: { case: "long", record: "1001" },
		language: "ar",
		size: "narrow",
		input: "touch",
		motion: "reduce",
		transport: "http",
		status: "problem",
		problems: ["geometry: planted throw"],
		geometry: Array(1000).fill("detail"),
		files: ["frame.png"],
	};
	const s = itemSummary(e);
	assert.equal(s.result, "problem");
	assert.deepEqual(s.problems, e.problems);
	assert.equal(s.geometry, undefined);
	assert.ok(JSON.stringify(s).length < 500);
});
test("doctor gives portable concrete repair commands; verification ports are restricted", async () => {
	const opts = { concept, recipes };
	assert.match(
		await doctorFix(opts, new Error("Recipe drift")),
		/node '.*cli.mjs' repair-recipes --concept/,
	);
	assert.match(
		await doctorFix(opts, new Error("Chromium missing")),
		/cli.js' install chromium/,
	);
	for (const port of [3174, 3180, 3185])
		assert.throws(() => verificationPort(port), /choose 3176 or 3177/);
	assert.equal(verificationPort("3176"), 3176);
});

test("help in a dependency-free clone succeeds and names installation", async () => {
	const folder = resolve(scratch, "clone/.agents/skills/verify-fitway");
	await copyHelpFixture(folder);
	const result = spawnSync(
		process.execPath,
		[resolve(folder, "cli.mjs"), "help"],
		{ encoding: "utf8", windowsHide: true },
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	assert.match(result.stdout, /--inputs mouse,touch,keyboard/);
	assert.match(result.stdout, /pnpm --dir .* install --frozen-lockfile/);
	assert.doesNotMatch(result.stderr, /Cannot find module/);
});
test("quiet comparison children keep diff JSON and diagnostics off success output, and preserve failure diagnostics", async () => {
	const noisy = resolve(scratch, "noisy-diff.mjs");
	const caller = resolve(scratch, "quiet-caller.mjs");
	await writeFile(
		noisy,
		'console.log(JSON.stringify({diff:Array(1000).fill("detail")}));console.error("diff_map: summary");',
	);
	await writeFile(
		caller,
		`import {child} from ${JSON.stringify(new URL("./cli.mjs", import.meta.url).href)};try{await child(process.execPath,[${JSON.stringify(noisy)}],${JSON.stringify(scratch)},undefined,true)}catch(error){console.error(error.message);process.exitCode=1}`,
	);
	const success = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(success.status, 0);
	assert.equal(success.stdout, "");
	assert.equal(success.stderr, "");
	await writeFile(
		noisy,
		'console.error("planted diff failure");process.exit(2);',
	);
	const failure = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(failure.status, 1);
	assert.match(failure.stderr, /planted diff failure/);
});
test("output refuses git worktrees, junction aliases and escaping paths before writes", async () => {
	const tree = resolve(scratch, "tree");
	await mkdir(tree);
	await writeFile(resolve(tree, ".git"), "gitdir: D:/elsewhere");
	const link = resolve(scratch, "alias");
	await symlink(tree, link, process.platform === "win32" ? "junction" : "dir");
	for (const root of [tree, link])
		assert.throws(
			() => assertOutsideGit(resolve(root, "never-created")),
			/Refusing output/,
		);
	await assert.rejects(outputFile(scratch, "../escaped.json"), /escapes/);
});
test("delegated tool interruption finishes its own cleanup before the parent returns", async () => {
	const helper = resolve(scratch, "cancel-fixture.mjs");
	const cleaned = resolve(scratch, "cleaned.txt");
	await writeFile(
		helper,
		'import {writeFileSync} from "node:fs";import {resolve} from "node:path";process.once("SIGINT",()=>{writeFileSync(resolve(process.cwd(),"cleaned.txt"),"cleaned");process.exit(130)});writeFileSync(resolve(process.cwd(),"ready.txt"),"ready");setInterval(()=>{},1000);',
	);
	const ready = new Promise((done, reject) => {
		const watcher = watch(scratch, (_, name) => {
			if (name === "ready.txt") {
				clearTimeout(timeout);
				watcher.close();
				done();
			}
		});
		const timeout = setTimeout(() => {
			watcher.close();
			reject(new Error("Worker readiness timeout"));
		}, 5000);
	});
	const controller = new AbortController();
	const running = child(process.execPath, [helper], scratch, controller.signal);
	try {
		await ready;
		controller.abort();
		await assert.rejects(running, /130.*cleanup completed/);
	} finally {
		controller.abort();
	}
	assert.equal(await readFile(cleaned, "utf8"), "cleaned");
});
test("Y2: a test-only doctor seam never probes a verification port", async () => {
	const folder = resolve(scratch, "doctor-test-port-seam");
	const port = await isolatedPort();
	const log = resolve(scratch, "doctor-test-port-seam.jsonl");
	await mkdir(folder);
	await writeFile(
		resolve(folder, "session.json"),
		JSON.stringify({
			concept,
			pid: 2147483647,
			port,
			token: "test-only",
		}),
	);
	const result = spawnSync(
		process.execPath,
		[
			"--require",
			portObserverPath,
			cliPath,
			"doctor",
			"--concept",
			concept,
			"--session",
			folder,
		],
		{
			encoding: "utf8",
			windowsHide: true,
			env: {
				...process.env,
				VERIFY_FITWAY_PORT_HOOK_LOG: log,
				VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE: "0",
			},
		},
	);
	assert.equal(result.status, 1, result.stdout + result.stderr);
	assert.match(result.stderr, /FIX: .*--port 3176 /);
	const observations = existsSync(log)
		? (await readFile(log, "utf8"))
				.trim()
				.split("\n")
				.filter(Boolean)
				.map(JSON.parse)
		: [];
	assert.deepEqual(observations, [], result.stdout + result.stderr);
});
test("V2: dependency-free discovery and browser commands name the package and install once", async () => {
	const folder = resolve(scratch, "cold/.agents/skills/verify-fitway");
	await copyAllFixture(folder);
	const cli = resolve(folder, "cli.mjs");
	for (const command of [
		"map",
		"list",
		"drift",
		"repair-recipes",
		"drift-tree",
	]) {
		const result = runCli(
			command === "drift-tree"
				? [command, "--root", concept]
				: [
						command,
						"--concept",
						concept,
						...(["map", "repair-recipes"].includes(command)
							? ["--out", resolve(scratch, `cold-${command}`)]
							: []),
					],
			cli,
		);
		assert.equal(result.status, 1, result.stdout);
		assert.match(result.stderr, /Missing dependency: typescript/);
		assert.match(
			result.stderr,
			/FIX: pnpm --dir '.*cold.*' install --frozen-lockfile/,
		);
		assert.doesNotMatch(
			result.stderr,
			/Cannot find module|Require stack|\n\s+at /,
		);
		assert.equal((result.stderr.match(/FAIL:/g) || []).length, 1);
	}
	const caller = resolve(scratch, "cold-playwright.mjs");
	await writeFile(
		caller,
		`import {playwright} from ${JSON.stringify(pathToFileURL(cli).href)};
try {playwright()} catch(error) {console.error(error.message + "\\nFIX: " + error.fix); process.exitCode=1}`,
	);
	const browser = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(browser.status, 1);
	assert.match(browser.stderr, /Missing dependency: @playwright\/test/);
	assert.match(browser.stderr, /pnpm --dir .* install --frozen-lockfile/);
	assert.doesNotMatch(
		browser.stderr,
		/Cannot find module|Require stack|\n\s+at /,
	);
});
test("V3: doctor and drive setup failures print one fault block", () => {
	for (const command of ["doctor", "drive", "compare"]) {
		const result = runCli([
			command,
			"--concept",
			concept,
			...(command === "compare" ? ["--baseline", concept] : []),
			...(command === "doctor"
				? []
				: ["--out", resolve(scratch, `one-block-${command}`)]),
		]);
		assert.equal(result.status, 1);
		assert.equal(
			(result.stderr.match(/FAIL:/g) || []).length,
			1,
			result.stderr,
		);
		assert.equal(
			(result.stderr.match(/Probe kit missing/g) || []).length,
			1,
			result.stderr,
		);
		assert.match(result.stderr, /DOCTOR FAIL:/);
		assert.match(result.stderr, /FIX BLOCKED: restore the missing probe kit/);
	}
});
