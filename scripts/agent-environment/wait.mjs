// Wait for one regular-expression match in a log without loading existing bytes again.
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
	beginToolCommand,
	ToolStartupError,
	toolStartupLine,
} from "./tool-contract.mjs";

export const WAIT_DEFAULT_TIMEOUT_SECONDS = 600;
const POLL_INTERVAL_MS = 1_000;

export function waitOptions(parsed) {
	let pattern;
	try {
		pattern = new RegExp(parsed.options.pattern);
	} catch (error) {
		throw new ToolStartupError(
			`invalid --pattern ${parsed.options.pattern}: ${error.message}`,
			"pass --pattern as a JavaScript regular expression; run pnpm wait --help",
		);
	}
	const seconds =
		parsed.options.timeout === undefined
			? WAIT_DEFAULT_TIMEOUT_SECONDS
			: Number(parsed.options.timeout);
	if (!Number.isInteger(seconds) || seconds < 1)
		throw new ToolStartupError(
			`--timeout must be a positive integer: ${parsed.options.timeout}`,
			"pass --timeout <seconds>; run pnpm wait --help",
		);
	return {
		file: resolve(process.cwd(), parsed.positionals[0]),
		pattern,
		timeoutMs: seconds * 1_000,
		seconds,
	};
}

function appendCompleteLines(state, pattern) {
	const finalNewline = state.pending.lastIndexOf(0x0a);
	if (finalNewline === -1) return null;
	const complete = state.pending.subarray(0, finalNewline + 1).toString("utf8");
	state.pending = state.pending.subarray(finalNewline + 1);
	const lines = complete.split("\n");
	lines.pop();
	for (const raw of lines) {
		const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
		state.lastLine = line;
		if (pattern.test(line)) return line;
	}
	return null;
}

function readAddedBytes(state) {
	let size;
	try {
		size = statSync(state.file).size;
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
	state.appeared = true;
	if (size <= state.offset) return null;
	const added = Buffer.alloc(size - state.offset);
	const handle = openSync(state.file, "r");
	try {
		const bytes = readSync(handle, added, 0, added.length, state.offset);
		state.offset += bytes;
		state.pending = Buffer.concat([state.pending, added.subarray(0, bytes)]);
	} finally {
		closeSync(handle);
	}
	return null;
}

function nextDelay(deadline) {
	return new Promise((resolve) => {
		setTimeout(
			resolve,
			Math.max(0, Math.min(POLL_INTERVAL_MS, deadline - Date.now())),
		);
	});
}

export async function waitForPattern({ file, pattern, timeoutMs }) {
	const state = {
		file,
		offset: 0,
		pending: Buffer.alloc(0),
		appeared: false,
		lastLine: null,
	};
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		readAddedBytes(state);
		const matched = appendCompleteLines(state, pattern);
		if (matched !== null) return { matched: true, line: matched };
		if (Date.now() >= deadline) break;
		await nextDelay(deadline);
	}
	const partial = state.pending.toString("utf8").replace(/\r$/, "");
	if (partial) state.lastLine = partial;
	return {
		matched: false,
		appeared: state.appeared,
		lastLine: state.lastLine,
	};
}

async function main(options) {
	const result = await waitForPattern(options);
	if (result.matched) {
		process.stdout.write(`${result.line}\n`);
		return;
	}
	const last = result.appeared
		? `last line: ${result.lastLine ?? "(empty file)"}`
		: "the file never appeared";
	process.stderr.write(
		`wait: FAIL: timed out after ${options.seconds}s waiting for ${options.pattern.source} in ${options.file}; ${last}\n`,
	);
	process.exitCode = 1;
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		await main(waitOptions(beginToolCommand("wait", process.argv.slice(2))));
	} catch (error) {
		const line = toolStartupLine("wait", error);
		process.stderr.write(`${line ?? `wait: FAIL: ${error.message}`}\n`);
		process.exitCode = 1;
	}
}
