// Reach verification previews, their ports and their sessions for the cli tests.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { resolve } from "node:path";
import { concept, runCli, scratch } from "./cli-test-harness.mjs";
import { portAvailable } from "./core.mjs";

export function fetchRaw(port, path, method = "GET") {
	return new Promise((done, reject) => {
		const req = request({ host: "127.0.0.1", port, path, method }, (res) => {
			const chunks = [];
			res.on("data", (c) => chunks.push(c));
			res.on("end", () =>
				done({
					status: res.statusCode,
					headers: res.headers,
					body: Buffer.concat(chunks),
				}),
			);
		});
		req.once("error", reject);
		req.end();
	});
}
export function sessionCommandArgs(command, folder, out) {
	if (command === "cleanup") return [command, "--session", folder];
	return [
		command,
		"--concept",
		concept,
		"--session",
		folder,
		...(command === "drive" ? ["--out", out] : []),
	];
}

export async function isolatedPort() {
	const server = createServer();
	await new Promise((done) => server.listen(0, "127.0.0.1", done));
	const port = server.address().port;
	await new Promise((done) => server.close(done));
	assert.ok(port >= 49152, `Kernel allocated unsafe test port ${port}`);
	return port;
}

export async function launched(name, idle = 1500) {
	const folder = resolve(scratch, name);
	const result = runCli([
		"launch",
		"--concept",
		concept,
		"--isolated-port",
		String(await isolatedPort()),
		"--idle-timeout-ms",
		String(idle),
		"--out",
		folder,
	]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const session = JSON.parse(
		await readFile(resolve(folder, "session.json"), "utf8"),
	);
	return { folder, session };
}

export async function waitForExit(session) {
	const deadline = Date.now() + 5000;
	while (true) {
		try {
			process.kill(session.pid, 0);
		} catch (error) {
			if (error.code === "ESRCH") break;
			throw error;
		}
		assert.ok(
			Date.now() < deadline,
			`Preview pid ${session.pid} did not exit after idle timeout`,
		);
		await new Promise((done) => setTimeout(done, 50));
	}
	await portAvailable(session.port);
}
