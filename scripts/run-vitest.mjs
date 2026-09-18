// Thin CLI entry for the repository-owned Vitest runtime.
//
// This is a direct single-invocation entry. It acquires exactly one
// VitestRuntimeSession for this invocation, prints that session's provenance to
// stderr so stdout stays usable for test output, and runs the requested focused
// arguments through it. The runtime's invocation normalizer rejects every
// --root/-r token, resolves the last --config/-c spelling exactly as Vitest
// would to one recorded repository configuration, removes the caller's config
// spellings, and emits one canonical `--config <recorded-relative-path>` pair
// after the pass-through focus/filter arguments (a leading `--` separator is
// dropped). Numeric child exit codes become this process's exit code; a child
// terminated by a signal is reported and makes this process exit nonzero.
//
// The runtime session revalidates its bounded integrity set immediately before
// and after the launch, and this wrapper additionally fingerprints the whole
// repository immediately before acquisition and again after the child and the
// runtime's post-launch revalidation, including a failed or signaled child. If
// the fingerprints differ the wrapper prints `git status --short` and exits
// nonzero even when the child exited zero.
//
// `pnpm test` and `pnpm test:integration` route here for developer convenience.
// A package route is corroboration only; authoritative evidence begins when the
// host directly invokes this file with an absolute Node path. The output
// describes exactly the focused invocation it ran and never implies that the
// full ladder passed.
//
// Usage:
//   node scripts/run-vitest.mjs [--] <vitest arguments...>

import { spawn } from "node:child_process";
import process from "node:process";
import { repositoryFingerprint } from "./repository-fingerprint.mjs";
import {
	acquireVitestRuntimeSession,
	describeVitestRuntimeSession,
	normalizeVitestInvocation,
	runVitest,
} from "./vitest-runtime.mjs";

const CALLER_IDENTITY = "scripts/run-vitest.mjs";

async function main() {
	const args = process.argv.slice(2);
	if (args[0] === "--") {
		args.shift();
	}
	const before = await repositoryFingerprint();
	let launchError;
	let result;
	try {
		const session = acquireVitestRuntimeSession(process.cwd(), CALLER_IDENTITY);
		console.error(describeVitestRuntimeSession(session));
		const invocation = normalizeVitestInvocation(session, args);
		console.error(
			invocation.config === null
				? "selected config for this launch: <none: --version diagnostic>"
				: `selected config for this launch: ${invocation.config.path} sha256 ${invocation.config.sha256} ${invocation.config.byteLength} bytes`,
		);
		result = await runVitest(session, invocation.argv, {
			configPath: invocation.config === null ? null : invocation.config.path,
			stdio: "inherit",
		});
	} catch (error) {
		launchError = error;
	}
	const after = await repositoryFingerprint();
	if (before !== after) {
		await new Promise((resolve) => {
			const status = spawn("git", ["status", "--short"], {
				cwd: process.cwd(),
				stdio: "inherit",
				windowsHide: true,
			});
			status.once("close", resolve);
		});
		throw new Error(
			"The focused Vitest invocation changed tracked or untracked repository content; ignored build/test artifacts are permitted only under configured output directories",
		);
	}
	if (launchError !== undefined) throw launchError;
	if (result.signal !== null) {
		console.error(
			`FAILED: the repository-local vitest CLI was terminated with signal ${result.signal}`,
		);
		process.exitCode = 1;
		return;
	}
	process.exitCode = result.status ?? 1;
}

main().catch((error) => {
	console.error(`FAILED: ${error.message}`);
	process.exitCode = 1;
});
