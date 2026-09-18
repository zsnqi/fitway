// Repository-local Vitest runtime diagnostic.
//
// This is a self-contained diagnostic invocation. It acquires one
// VitestRuntimeSession from scripts/vitest-runtime.mjs, revalidates its bounded
// integrity set, launches the contained CLI's `--version` through that
// session, and prints the observed provenance in full: the repository root,
// caller identity, Vitest version and manifest real path, CLI real path, Node
// real path and version, lockfile resolution, platform/architecture, every
// bounded-set member, the bounded-set digest, both config hashes, and the
// observed CLI version line.
//
// The result applies only to this diagnostic invocation in this process. It is
// not reusable authority for a later process, which must acquire and validate
// its own runtime session before any Vitest launch. It is also not an
// authentication, attestation, sandbox, or dependency-safety claim; it covers
// only the bounded set of files this session records.
//
// `pnpm check:test-runtime` is a developer convenience wrapper. Authoritative
// evidence begins only when the host directly invokes this file with an
// absolute Node path from a prepared worktree.
//
// Usage:
//   pnpm check:test-runtime
//   node scripts/check-test-runtime.mjs [repository-root]

import { realpathSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
	acquireVitestRuntimeSession,
	revalidateVitestRuntimeSession,
	runVitestSync,
	vitestRuntimeRuleError,
} from "./vitest-runtime.mjs";

const CALLER_IDENTITY = "scripts/check-test-runtime.mjs";

function fail(ruleId, detail) {
	throw vitestRuntimeRuleError(ruleId, detail);
}

function describeOutput(text, label) {
	const trimmed = String(text).trim();
	return `${label}: ${trimmed === "" ? "<empty>" : JSON.stringify(trimmed)}`;
}

// Structured comparison of the trimmed first stdout line. The expected
// `vitest/<version>` token must appear exactly once and equal the session
// version; an optional `node-v<...>` token must equal the running Node
// version. A version that merely appears somewhere in mixed output does not
// satisfy this check.
export function assertVitestVersionOutput(stdout, session) {
	const lines = String(stdout)
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line !== "");
	if (lines.length === 0) {
		fail(
			"cli-output-empty",
			`repository-local vitest CLI at ${session.vitestCliRealPath} printed no output for --version (expected first line carrying vitest/${session.vitestVersion})`,
		);
	}
	const firstLine = lines[0];
	const tokens = firstLine.split(/\s+/);
	const expectedVitestToken = `vitest/${session.vitestVersion}`;
	const vitestTokens = tokens.filter((token) => token.startsWith("vitest/"));
	if (vitestTokens.length !== 1 || vitestTokens[0] !== expectedVitestToken) {
		fail(
			"cli-version-token",
			`repository-local vitest CLI at ${session.vitestCliRealPath} printed first line ${JSON.stringify(firstLine)}; expected exactly one ${JSON.stringify(expectedVitestToken)} token but observed ${JSON.stringify(vitestTokens)}`,
		);
	}
	const expectedNodeToken = `node-v${session.nodeVersion}`;
	const nodeTokens = tokens.filter((token) => token.startsWith("node-v"));
	if (
		nodeTokens.length > 1 ||
		(nodeTokens.length === 1 && nodeTokens[0] !== expectedNodeToken)
	) {
		fail(
			"cli-node-token",
			`repository-local vitest CLI at ${session.vitestCliRealPath} printed first line ${JSON.stringify(firstLine)}; expected node token ${JSON.stringify(expectedNodeToken)} but observed ${JSON.stringify(nodeTokens)}`,
		);
	}
	return {
		firstLine,
		nodeToken: nodeTokens[0] ?? null,
		vitestToken: vitestTokens[0],
	};
}

export function checkTestRuntime(root, options = {}) {
	const session = acquireVitestRuntimeSession(
		root,
		options.callerIdentity ?? CALLER_IDENTITY,
		options.acquisitionOptions ?? {},
	);
	revalidateVitestRuntimeSession(session, "diagnostic");
	let launched = null;
	let observed = null;
	if (options.runVersion !== false) {
		launched = runVitestSync(session, ["--version"], {
			configPath: null,
			spawnSyncImpl: options.spawnSyncImpl,
		});
		if (launched.status !== 0) {
			fail(
				"cli-exit-status",
				`repository-local vitest CLI at ${session.vitestCliRealPath} exited ${launched.status === null ? "without a status" : launched.status}${launched.signal === null ? "" : ` with signal ${launched.signal}`} (${describeOutput(launched.stdout, "stdout")}; ${describeOutput(launched.stderr, "stderr")})`,
			);
		}
		observed = assertVitestVersionOutput(launched.stdout, session);
	}
	return { launched, observed, session };
}

export function formatDiagnosticReport(result) {
	const { observed, session } = result;
	const lines = [
		"Vitest runtime diagnostic provenance (this invocation only):",
		`repository root: ${session.repositoryRootRealPath}`,
		`caller identity: ${JSON.stringify(session.callerIdentity)}`,
		`vitest version: ${session.vitestVersion}`,
		`vitest manifest: ${session.vitestManifestRealPath}`,
		`vitest CLI: ${session.vitestCliRealPath}`,
		`node executable: ${session.nodeExecutableRealPath} (node-v${session.nodeVersion})`,
		`lockfile resolution: ${session.lockfileResolution}`,
		`platform: ${session.platform}-${session.arch}`,
		`bounded set: ${session.integrity.algorithm} ${session.integrity.digest} over ${session.integrity.members.length} members`,
	];
	for (const member of session.integrity.members) {
		lines.push(
			`  member ${member.id} [${member.kind}] ${member.sha256} ${member.byteLength} bytes ${member.realPath}`,
		);
	}
	for (const config of session.configs) {
		lines.push(
			`  config ${config.path} ${config.sha256} ${config.byteLength} bytes ${config.realPath}`,
		);
	}
	lines.push(
		observed === null
			? "observed CLI version line: <not run>"
			: `observed CLI version line: ${JSON.stringify(observed.firstLine)}`,
	);
	lines.push(
		"This result applies only to this diagnostic invocation in this process. It is not reusable authority for any later process, which must acquire and validate its own runtime session, and it is not an authentication, attestation, sandbox, or dependency-safety claim; it covers only the bounded set listed above.",
	);
	return lines.join("\n");
}

function isDirectInvocation() {
	if (process.argv[1] === undefined) return false;
	try {
		return (
			realpathSync(process.argv[1]) ===
			realpathSync(fileURLToPath(import.meta.url))
		);
	} catch {
		return false;
	}
}

function main() {
	const root = process.argv[2] ?? process.cwd();
	const result = checkTestRuntime(root);
	console.log(formatDiagnosticReport(result));
}

if (isDirectInvocation()) {
	try {
		main();
	} catch (error) {
		console.error(`FAILED: ${error.message}`);
		process.exitCode = 1;
	}
}
