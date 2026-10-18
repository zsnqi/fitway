import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { normalizePath } from "./tooling-map-parser.mjs";

const require = createRequire(import.meta.url);
const PROCESS_TIMEOUT_MS = 180_000;

function processFailure(result) {
	const text = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
	return text || `test process exited with ${result.status}`;
}

function relativeFile(root, file) {
	if (!file) return "";
	const absolute = path.isAbsolute(file) ? file : path.resolve(root, file);
	return normalizePath(path.relative(root, absolute));
}

export function vitestCli() {
	return path.join(
		path.dirname(require.resolve("vitest/package.json")),
		"vitest.mjs",
	);
}

export function runVitest({ tree, files, outputFile, namePattern = null }) {
	const args = [
		vitestCli(),
		"run",
		"--reporter=json",
		`--outputFile=${outputFile}`,
	];
	const config = path.join(tree, "vitest.config.ts");
	if (existsSync(config)) args.push("--config", "vitest.config.ts");
	if (namePattern) args.push("--testNamePattern", namePattern);
	args.push(...files);
	const result = spawnSync(process.execPath, args, {
		cwd: tree,
		encoding: "utf8",
		maxBuffer: 20 * 1024 * 1024,
		timeout: PROCESS_TIMEOUT_MS,
		windowsHide: true,
	});
	return result;
}

export function runNodeTests({ tree, files, outputFile, namePattern = null }) {
	mkdirSync(path.dirname(outputFile), { recursive: true });
	const args = [
		"--test",
		"--test-reporter=tap",
		`--test-reporter-destination=${outputFile}`,
	];
	if (namePattern) args.push(`--test-name-pattern=${namePattern}`);
	args.push(...files);
	return spawnSync(process.execPath, args, {
		cwd: tree,
		encoding: "utf8",
		maxBuffer: 20 * 1024 * 1024,
		timeout: PROCESS_TIMEOUT_MS,
		windowsHide: true,
	});
}

function failureText(failureMessages, fallback = "") {
	const first = Array.isArray(failureMessages)
		? failureMessages.find(Boolean)
		: failureMessages;
	return String(first || fallback || "test failed");
}

function statusOf(value) {
	if (value === "passed") return "passed";
	if (value === "skipped" || value === "pending" || value === "todo")
		return "skipped";
	return "failed";
}

export function parseVitestReport(report, root) {
	const tests = [];
	const fileFailures = new Map();
	for (const suite of report.testResults ?? []) {
		const file = relativeFile(root, suite.name);
		const failure =
			suite.status === "failed" && !(suite.assertionResults ?? []).length
				? failureText(suite.failureMessage ?? suite.message, processFailure({}))
				: "";
		if (failure) fileFailures.set(file, failure);
		for (const assertion of suite.assertionResults ?? []) {
			const ancestors = (assertion.ancestorTitles ?? []).map(String);
			const title = String(assertion.title ?? "");
			tests.push({
				file,
				title,
				ancestors,
				fullName:
					String(assertion.fullName ?? "") ||
					[...ancestors, title].filter(Boolean).join(" > "),
				status: statusOf(assertion.status),
				failure: failureText(
					assertion.failureMessages,
					suite.failureMessage ?? "",
				),
				line: assertion.location?.line ?? null,
			});
		}
	}
	return { tests, fileFailures };
}

export function parseNodeReport(text, file) {
	const tests = [];
	const fileFailures = new Map();
	const lines = text.split(/\r?\n/);
	const headings = new Map();
	let pendingHeading = null;
	for (let index = 0; index < lines.length; index += 1) {
		const heading = lines[index].match(/^# Subtest: (.*)$/);
		if (heading) pendingHeading = heading[1];
		const result = lines[index].match(/^(\s*)(not ok|ok) \d+ - (.*)$/);
		if (!result) continue;
		const indentation = result[1].length;
		const name = result[3].trim();
		const details = [];
		let cursor = index + 1;
		while (
			cursor < lines.length &&
			!/^\s*(?:not ok|ok) \d+ - /.test(lines[cursor])
		) {
			details.push(lines[cursor]);
			if (/^\s+\.\.\.\s*$/.test(lines[cursor])) break;
			cursor += 1;
		}
		const detailText = details.join("\n");
		const kind = detailText.match(/\n?\s*type: '([^']+)'/)?.[1] ?? "test";
		if (kind !== "test") {
			headings.set(indentation, name);
			continue;
		}
		const errorBlock = detailText.match(
			/\n?\s*error: \|-\r?\n([\s\S]*?)(?=\r?\n\s*(?:code|name|expected|actual|operator|stack|duration_ms|\.\.\.):)/,
		)?.[1];
		const errorName = detailText.match(/\n?\s*name: '([^']+)'/)?.[1];
		const code = detailText.match(/\n?\s*code: '([^']+)'/)?.[1];
		const failure =
			errorName && errorBlock
				? `${errorName}: ${errorBlock.trim()}`
				: [errorName, code, errorBlock?.trim()].filter(Boolean).join("\n");
		const skipped = /\n?\s*(?:skip|todo):/.test(detailText);
		const ancestors = [];
		for (const [depth, value] of headings)
			if (depth < indentation) ancestors.push(value);
		tests.push({
			file,
			title: pendingHeading ?? name,
			ancestors,
			fullName: [...ancestors, pendingHeading ?? name].join(" > "),
			status: skipped ? "skipped" : failure ? "failed" : "passed",
			failure,
			line: null,
		});
		headings.set(indentation, pendingHeading ?? name);
		pendingHeading = null;
	}
	return { tests, fileFailures };
}

export function readVitestReport({ tree, outputFile, result }) {
	if (!existsSync(outputFile)) {
		return {
			tests: [],
			fileFailures: new Map([["", processFailure(result)]]),
		};
	}
	return parseVitestReport(JSON.parse(readFileSync(outputFile, "utf8")), tree);
}

export function readNodeReport({ outputFile, result, files = [] }) {
	if (!existsSync(outputFile)) {
		return {
			tests: [],
			fileFailures: new Map([["", processFailure(result)]]),
		};
	}
	return parseNodeReport(
		readFileSync(outputFile, "utf8"),
		normalizePath(files[0] ?? ""),
	);
}

export function processWasKilled(result) {
	return (
		result.error?.code === "ETIMEDOUT" ||
		result.signal === "SIGTERM" ||
		result.signal === "SIGKILL"
	);
}

export function regexEscape(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
