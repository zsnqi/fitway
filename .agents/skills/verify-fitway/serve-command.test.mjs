import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolveToolArguments } from "../../../scripts/agent-environment/tool-contract.mjs";
import { writeConcept } from "./concept-fixture.mjs";
import { preview } from "./core.mjs";
import { serveCommand } from "./serve-command.mjs";

const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));

function listen(server) {
	return new Promise((done, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => done(server.address().port));
	});
}

function close(server) {
	return new Promise((done) => server.close(done));
}

test("serve answers a concept file with no-store and stops after idle", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-serve-"));
	try {
		const concept = resolve(root, "concept");
		await writeConcept(concept);
		const probe = createServer();
		const port = await listen(probe);
		await close(probe);
		let started;
		let resolveStarted;
		const ready = new Promise((done) => {
			resolveStarted = done;
		});
		const serving = serveCommand(
			{ concept, port: String(port), "idle-timeout-ms": "30" },
			{
				preview: async (options) => {
					started = await preview(options);
					resolveStarted();
					return started;
				},
			},
		);
		await ready;
		const response = await fetch(`${started.origin}/index.html`);
		assert.equal(response.status, 200);
		assert.equal(response.headers.get("cache-control"), "no-store");
		await serving;
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("serve refuses a busy high port without stopping its owner", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-serve-busy-"));
	const owner = createServer();
	try {
		const concept = resolve(root, "concept");
		await writeConcept(concept);
		const port = await listen(owner);
		await assert.rejects(
			serveCommand({ concept, port: String(port) }),
			new RegExp(`Port ${port} held`),
		);
		assert.equal(owner.listening, true);
	} finally {
		if (owner.listening) await close(owner);
		await rm(root, { recursive: true, force: true });
	}
});

test("serve exits cleanly after its idle timeout", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-serve-cli-"));
	try {
		const concept = resolve(root, "concept");
		await writeConcept(concept);
		const probe = createServer();
		const port = await listen(probe);
		await close(probe);
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"serve",
				"--concept",
				concept,
				"--port",
				String(port),
				"--idle-timeout-ms",
				"30",
			],
			{ encoding: "utf8", timeout: 10000, windowsHide: true },
		);
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.match(result.stdout, /^READY /m);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

async function servedWith(concept, options) {
	const asked = [];
	const printed = [];
	const log = console.log;
	console.log = (line) => printed.push(line);
	try {
		await serveCommand(
			{ concept, port: "4100", ...options },
			{
				preview: async (previewOptions) => {
					asked.push(previewOptions);
					const server = new EventEmitter();
					setImmediate(() => server.emit("close"));
					return {
						origin: "http://127.0.0.1:4100",
						port: 4100,
						server,
						close: async () => undefined,
					};
				},
				lanAddresses: () => [],
				interfaces: () => ({
					wifi: [{ address: "192.168.1.20", family: "IPv4", internal: false }],
					ethernet: [{ address: "10.0.0.5", family: "IPv4", internal: false }],
					loopback: [{ address: "127.0.0.1", family: "IPv4", internal: true }],
				}),
			},
		);
	} finally {
		console.log = log;
	}
	return { asked, printed };
}

test("serve --lan asks preview for lan and prints each LAN origin", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-serve-lan-"));
	try {
		const concept = resolve(root, "concept");
		await writeConcept(concept);
		const lan = await servedWith(concept, { lan: true });
		assert.equal(lan.asked.length, 1);
		assert.equal(lan.asked[0].lan, true);
		assert.equal(lan.asked[0].port, 4100);
		assert.deepEqual(
			lan.printed.filter((line) => line.startsWith("LAN ")),
			["LAN http://10.0.0.5:4100", "LAN http://192.168.1.20:4100"],
		);
		const local = await servedWith(concept, {});
		assert.equal(local.asked[0].lan, false);
		assert.deepEqual(
			local.printed.filter((line) => line.startsWith("LAN ")),
			[],
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("the registry refuses a serve port outside 1024-65535", () => {
	for (const port of ["80", "65536", "3188.5"])
		assert.throws(
			() =>
				resolveToolArguments("verify:owner", [
					"serve",
					"--concept",
					tmpdir(),
					"--port",
					port,
				]),
			/--port must be an integer from 1024 to 65535/,
		);
});
