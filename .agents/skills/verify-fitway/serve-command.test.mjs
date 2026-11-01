import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
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
