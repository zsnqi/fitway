import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import { doctorFix } from "./cli.mjs";
import {
	concept,
	createUnitConcept,
	removeUnitConcept,
	runCli,
	runCliAsync,
	scratch,
} from "./cli-test-harness.mjs";
import {
	fetchRaw,
	isolatedPort,
	launched,
	sessionCommandArgs,
	waitForExit,
} from "./cli-test-previews.mjs";
import { diffStem } from "./compare-items.mjs";
import {
	lanOrigins,
	parsePortOwners,
	portAvailable,
	preview,
	reserveVerificationPorts,
} from "./core.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

test("IPv6 listener refusal names :: and leaves its owner running", async () => {
	const server = createServer((_, res) => res.end("foreign IPv6"));
	await new Promise((done) => server.listen(0, "::", done));
	const port = server.address().port;
	assert.ok(port >= 49152);
	try {
		const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"launch",
				"--concept",
				concept,
				"--isolated-port",
				String(port),
				"--out",
				resolve(scratch, "ipv6-refusal"),
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		if (process.platform === "win32") assert.match(result.stderr, /:: pid=/);
		assert.ok(result.stderr.includes(`Port ${port}`), result.stderr);
		assert.equal((await fetchRaw(port, "/")).body.toString(), "foreign IPv6");
	} finally {
		await new Promise((done) => server.close(done));
	}
});

test("listener parsing preserves IPv6 and IPv4 addresses; LAN URLs use real external interfaces", () => {
	assert.deepEqual(
		lanOrigins(
			3176,
			{
				net: [
					{ family: "IPv4", address: "169.254.1.2", internal: false },
					{ family: "IPv4", address: "172.24.1.1", internal: false },
					{ family: "IPv4", address: "192.168.1.8", internal: false },
				],
			},
			["192.168.1.8"],
		),
		["http://192.168.1.8:3176"],
	);
	assert.deepEqual(
		parsePortOwners(
			"TCP [::]:3177 [::]:0 LISTENING 42\nTCP 0.0.0.0:3176 0.0.0.0:0 LISTENING 43",
			3177,
		),
		[{ address: "::", pid: 42 }],
	);
	assert.deepEqual(
		lanOrigins(3176, {
			net: [{ family: "IPv4", address: "192.168.1.8", internal: false }],
			local: [{ family: "IPv4", address: "127.0.0.1", internal: true }],
		}),
		["http://192.168.1.8:3176"],
	);
	assert.throws(() => lanOrigins(3176, {}), /No external IPv4 LAN address/);
	assert.match(
		diffStem({
			feature: "access.html/pinChange",
			state: "pin=none",
			language: "ar",
			size: "tablet",
			input: "keyboard",
			motion: "reduce",
			transport: "http",
		}),
		/access-html-pinChange-pin-none-ar-tablet-keyboard-reduce-http/,
	);
});
test("foreign wildcard port is refused; launch never passes; cleanup after refusal retains the foreign server", async () => {
	const server = createServer((_, res) => res.end("foreign wildcard"));
	await new Promise((done) => server.listen(0, "0.0.0.0", done));
	const port = server.address().port;
	assert.ok(port >= 49152);
	const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
	const folder = resolve(scratch, "refused-launch");
	try {
		await assert.rejects(portAvailable(port), /did not start/);
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"launch",
				"--concept",
				concept,
				"--isolated-port",
				String(port),
				"--out",
				folder,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /LAUNCH PASS/);
		assert.match(result.stderr, /did not start/);
		assert.ok(result.stderr.includes(`Port ${port}`), result.stderr);
		const cleanup = spawnSync(
			process.execPath,
			[cli, "cleanup", "--session", folder],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(cleanup.status, 0);
		assert.match(cleanup.stdout, /CLEANUP PASS: no owned preview started/);
		assert.equal(
			(await fetchRaw(port, "/")).body.toString(),
			"foreign wildcard",
		);
	} finally {
		await new Promise((done) => server.close(done));
	}
	await portAvailable(port);
});
test("preview no-store covers every response class, HEAD/query and containment; only owned resources close", async () => {
	for (const name of ["style.css", "font.woff2", "image.png", "data.json"])
		await writeFile(resolve(concept, name), "fixture");
	const outside = resolve(scratch, "outside.txt");
	await writeFile(outside, "SECRET OUTSIDE");
	await symlink(outside, resolve(concept, "escape.txt"));
	const server = await preview({ concept, port: 0 });
	try {
		for (const path of [
			"/",
			"/app.js",
			"/style.css",
			"/font.woff2",
			"/image.png",
			"/data.json",
			"/missing",
			"/index.html?lang=en",
			"/escape.txt",
			"/%2e%2e%2foutside.txt",
			"/%00",
		])
			for (const method of ["GET", "HEAD"]) {
				const result = await fetchRaw(server.port, path, method);
				assert.equal(result.headers["cache-control"], "no-store");
				assert.ok(!result.body.toString().includes("SECRET OUTSIDE"));
				if (method === "HEAD") assert.equal(result.body.length, 0);
			}
		await assert.rejects(
			preview({ concept, port: server.port }),
			/held by a process|busy/,
		);
		assert.equal(
			(await fetchRaw(server.port, "/__verify/stop", "POST")).status,
			403,
		);
	} finally {
		await server.close();
	}
	await portAvailable(server.port);
});

test("V6: a released lease removes its empty port folder", async () => {
	const port = await isolatedPort();
	const folder = resolve("D:/fitway-verify-captures", `.port-${port}-lease`);
	const lease = await reserveVerificationPorts([port]);
	assert.equal(existsSync(folder), true);
	await lease.release();
	assert.equal(existsSync(folder), false);
});

test("W1: port options keep other previews excluded, and help names isolation and idle bounds", () => {
	for (const command of ["launch", "doctor", "drive", "compare"]) {
		for (const port of [
			0,
			3174,
			3175,
			...Array.from({ length: 8 }, (_, i) => 3178 + i),
			49152,
		]) {
			const result = runCli([
				command,
				"--concept",
				concept,
				...(command === "compare" ? ["--baseline", concept] : []),
				"--port",
				String(port),
			]);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /choose 3176 or 3177/);
		}
	}
	for (const port of [0, 3174, 3176, 3177, 3185, 49151, 65536]) {
		const result = runCli([
			"launch",
			"--concept",
			concept,
			"--isolated-port",
			String(port),
		]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /49152-65535/);
	}
	const both = runCli([
		"launch",
		"--concept",
		concept,
		"--port",
		"3180",
		"--isolated-port",
		"49152",
	]);
	assert.match(both.stderr, /choose 3176 or 3177/);
	for (const idle of ["0", "-1", "1800001", "NaN"]) {
		const result = runCli([
			"launch",
			"--concept",
			concept,
			"--idle-timeout-ms",
			idle,
		]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /at most 30 minutes/);
	}
	const help = runCli(["help"]);
	assert.match(help.stdout, /--isolated-port.*49152-65535/);
	assert.match(help.stdout, /30 minutes without a request/);
});

test("R17 V1: relaunch checks availability, prefers the session port and blocks when both are held", async () => {
	const folder = resolve(scratch, "relaunch-session");
	await mkdir(folder);
	for (const sessionPort of [3176, 3177]) {
		await writeFile(
			resolve(folder, "session.json"),
			JSON.stringify({ port: sessionPort }),
		);
		for (const held of [[], [3176], [3177], [3176, 3177]]) {
			const checked = [];
			const available = async (port) => {
				checked.push(port);
				if (held.includes(port)) throw new Error(`Port ${port} held`);
			};
			const fix = await doctorFix(
				{ concept, session: folder },
				new Error(`Session preview on port ${sessionPort} has stopped`),
				available,
			);
			const expected = [sessionPort, sessionPort === 3176 ? 3177 : 3176].find(
				(port) => !held.includes(port),
			);
			if (expected) {
				assert.match(fix, new RegExp(` launch .*--port ${expected} `));
				assert.equal(checked.at(-1), expected);
			} else {
				assert.match(fix, /^BLOCKED:.*3176.*3177.*held/);
				assert.doesNotMatch(fix, /--port|\bstop\b/i);
			}
			assert.equal(checked[0], sessionPort);
		}
	}
	const checked = [];
	const fix = await doctorFix(
		{ concept, port: 3177 },
		new Error("Port 3177 held"),
		async (port) => {
			checked.push(port);
			if (port === 3177) throw new Error("held");
		},
	);
	assert.deepEqual(checked, [3177, 3176]);
	assert.match(fix, /--port 3176 /);
});

test("R17 V2: foreign status, body and silence name the session port without stopping its owner", async () => {
	const { folder, session } = await launched("foreign-session", 10000);
	assert.equal(runCli(["cleanup", "--session", folder]).status, 0);
	let mode;
	let stops = 0;
	const server = createServer((req, res) => {
		if (req.url === "/__verify/stop") stops++;
		if (req.url !== "/__verify/identity") return res.end("foreign alive");
		if (mode === "silent") return;
		if (mode === "body-timeout") {
			res.writeHead(200);
			res.flushHeaders();
			return;
		}
		if (mode === "disconnect") return req.socket.destroy();
		res.writeHead(
			mode === "status"
				? 503
				: mode === "empty"
					? 204
					: mode === "redirect"
						? 302
						: 200,
			mode === "redirect" ? { Location: "/" } : {},
		);
		res.end(
			mode === "json" ? "{}" : mode === "null" ? "null" : "foreign 127.0.0.1",
		);
	});
	await new Promise((done) => server.listen(session.port, "127.0.0.1", done));
	try {
		for (mode of [
			"text",
			"json",
			"null",
			"status",
			"empty",
			"redirect",
			"silent",
			"body-timeout",
			"disconnect",
		]) {
			for (const command of ["cleanup", "doctor", "drive"]) {
				const result = await runCliAsync(
					sessionCommandArgs(
						command,
						folder,
						resolve(scratch, `foreign-${mode}-${command}`),
					),
				);
				assert.equal(result.status, 1, `${mode}/${command}: ${result.stdout}`);
				assert.match(
					result.stderr,
					new RegExp(`Port ${session.port} is not owned by this session`),
					`${mode}/${command}: ${result.stderr}`,
				);
				assert.doesNotMatch(
					result.stderr,
					/Unexpected token|JSON|SyntaxError|Cannot read properties/,
				);
				assert.equal(
					(await fetchRaw(session.port, "/")).body.toString(),
					"foreign alive",
				);
			}
		}
		assert.equal(stops, 0);
	} finally {
		server.closeAllConnections();
		await new Promise((done) => server.close(done));
	}
	await portAvailable(session.port);
});

test("R19 V1: a verified preview sharing its port names every foreign pid and refuses all session commands", {
	skip:
		process.platform !== "win32" &&
		"Shared-port ownership proof requires Windows listener inspection",
}, async (t) => {
	const { folder, session } = await launched("shared-session", 60000);
	const record = await readFile(resolve(folder, "session.json"), "utf8");
	const server = createServer((_, res) => res.end("foreign IPv4"));
	const foreign = spawn(
		process.execPath,
		[
			"-e",
			`
		const server = require("node:http").createServer((_, res) => res.end("foreign IPv6"));
		server.listen(${session.port}, "::1", () => process.send("ready"));
	`,
		],
		{ windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"] },
	);
	const exited = new Promise((done) => foreign.once("exit", done));
	try {
		await new Promise((done, reject) => {
			foreign.once("message", done);
			foreign.once("error", reject);
			foreign.once("exit", (code) =>
				reject(new Error(`Foreign fixture exited ${code} before ready`)),
			);
		});
		await new Promise((done, reject) => {
			server.once("error", reject);
			server.listen(session.port, "127.0.0.2", done);
		});
		for (const command of ["doctor", "cleanup", "drive"]) {
			const result = await runCliAsync(
				sessionCommandArgs(
					command,
					folder,
					resolve(scratch, `shared-${command}`),
				),
			);
			assert.equal(result.status, 1, result.stdout);
			assert.match(
				result.stderr,
				new RegExp(`Port ${session.port} .*foreign pids?`),
			);
			for (const pid of [process.pid, foreign.pid])
				assert.match(result.stderr, new RegExp(`\\b${pid}\\b`));
			assert.match(result.stderr, /refuse session/);
			assert.doesNotMatch(result.stderr, /not owned|not served|\bstop\b/i);
			assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
			for (const [host, body] of [
				["[::1]", "foreign IPv6"],
				["127.0.0.2", "foreign IPv4"],
			])
				assert.equal(
					await (await fetch(`http://${host}:${session.port}/`)).text(),
					body,
				);
			assert.equal(
				await readFile(resolve(folder, "session.json"), "utf8"),
				record,
			);
			t.diagnostic(
				`${command}: ${result.stderr.split("\n")[0]}; preview and both foreign listeners still answer`,
			);
		}
	} finally {
		server.closeAllConnections();
		if (server.listening) await new Promise((done) => server.close(done));
		if (foreign.exitCode === null) foreign.kill();
		await exited;
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		t.diagnostic(cleaned.stdout.trim());
	}
	await portAvailable(session.port);
});

test("W2: detached idle preview exits, frees its port, cleans idempotently and sessions require relaunch", async () => {
	const { folder, session } = await launched("idle-expiry");
	try {
		await waitForExit(session);
		for (const command of ["doctor", "drive"]) {
			const result = runCli(
				sessionCommandArgs(
					command,
					folder,
					resolve(scratch, `expired-${command}`),
				),
			);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /Session preview.*stopped or is unreachable/);
			assert.match(
				result.stderr,
				/FIX(?:: .* launch .*--concept| BLOCKED:.*3176.*3177.*held)/,
			);
		}
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		assert.match(cleaned.stdout, /CLEANUP PASS: .*already stopped/);
	} finally {
		runCli(["cleanup", "--session", folder]);
	}
});

test("W2: requests renew the idle bound, then the detached preview leaves no process", async () => {
	const { folder, session } = await launched("idle-renewal");
	try {
		const until = Date.now() + 3500;
		while (Date.now() < until) {
			assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
			await new Promise((done) => setTimeout(done, 400));
		}
		assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
		process.kill(session.pid, 0);
		await waitForExit(session);
	} finally {
		runCli(["cleanup", "--session", folder]);
	}
});

test("W3: cleanup accepts a session file and verifies stopped records", async () => {
	const { folder, session } = await launched("cleanup-file", 10000);
	try {
		const path = resolve(folder, "session.json");
		await writeFile(path, JSON.stringify({ ...session, stopped: true }));
		const cleaned = runCli(["cleanup", "--session", path]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		assert.match(cleaned.stdout, /CLEANUP PASS: .* stopped;/);
		await portAvailable(session.port);
		const again = runCli(["cleanup", "--session", folder]);
		assert.equal(again.status, 0, again.stderr);
		assert.match(again.stdout, /already stopped/);
	} finally {
		await writeFile(resolve(folder, "session.json"), JSON.stringify(session));
		runCli(["cleanup", "--session", folder]);
	}
});

test("W3: cleanup rejects nonexistent paths by name", () => {
	const missing = resolve(scratch, "nonexistent-session");
	const result = runCli(["cleanup", "--session", missing]);
	assert.equal(result.status, 1);
	assert.ok(result.stderr.includes(missing));
	assert.doesNotMatch(result.stdout, /PASS/);
});

test("W3: cleanup never stops a preview with a different session token", async () => {
	const { folder, session } = await launched("cleanup-identity", 10000);
	try {
		const impostor = resolve(scratch, "impostor");
		await mkdir(impostor);
		await writeFile(
			resolve(impostor, "session.json"),
			JSON.stringify({ ...session, token: "wrong" }),
		);
		const result = runCli(["cleanup", "--session", impostor]);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /PASS/);
		assert.match(result.stderr, /not owned by this session/);
		assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
	} finally {
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
	}
	await portAvailable(session.port);
});
