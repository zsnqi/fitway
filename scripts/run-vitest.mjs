// Launch local Vitest with ordinary CLI arguments and reject repository mutations.
// Usage: node scripts/run-vitest.mjs [--] <vitest arguments...>
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { repositoryFingerprint } from "./repository-fingerprint.mjs";

async function main() {
	const args = process.argv.slice(2).filter((argument) => argument !== "--");
	const before = await repositoryFingerprint();
	let launchError;
	let result;
	try {
		const require = createRequire(import.meta.url);
		const cli = path.join(
			path.dirname(require.resolve("vitest/package.json")),
			"vitest.mjs",
		);
		result = await new Promise((resolve, reject) => {
			const child = spawn(process.execPath, [cli, ...args], {
				cwd: process.cwd(),
				env: process.env,
				stdio: "inherit",
				windowsHide: true,
			});
			child.once("error", reject);
			child.once("close", (status, signal) => resolve({ status, signal }));
		});
	} catch (error) {
		launchError = error;
	}
	const after = await repositoryFingerprint();
	if (before !== after) {
		await new Promise((resolve, reject) => {
			const status = spawn("git", ["status", "--short"], {
				cwd: process.cwd(),
				stdio: "inherit",
				windowsHide: true,
			});
			status.once("error", reject);
			status.once("close", resolve);
		});
		throw new Error(
			"The focused Vitest invocation changed tracked or untracked repository content; ignored build/test artifacts are permitted only under configured output directories",
		);
	}
	if (launchError !== undefined) throw launchError;
	if (result.signal !== null) {
		throw new Error(`Vitest was terminated with signal ${result.signal}`);
	}
	process.exitCode = result.status ?? 1;
}

main().catch((error) => {
	console.error(`FAILED: ${error.message}`);
	process.exitCode = 1;
});
