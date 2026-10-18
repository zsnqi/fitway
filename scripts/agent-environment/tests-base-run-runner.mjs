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

function parseVitestReport(report, root) {
	const tests = [];
	const fileFailures = new Map();
	for (const suite of report.testResults ?? []) {
		const file = relativeFile(root, suite.name);
		// `message` holds the file's own errors (loading, a top-level hook); it can come with reported tests.
		const fileError = String(suite.failureMessage ?? suite.message ?? "");
		const failure =
			suite.status === "failed" &&
			(fileError || !(suite.assertionResults ?? []).length)
				? failureText(fileError, processFailure({}))
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

// `node --test` prints `# Subtest: <name>` before a test's children and its `ok` line after them, both at the
// test's indentation, so the open headings form a stack and a result's ancestors are the headings outside it.
function nodeHeading(headings, indentation, name) {
	while (headings.length && headings.at(-1).indentation >= indentation)
		headings.pop();
	headings.push({ indentation, name });
}

function closeNodeHeading(headings, indentation, resultName) {
	while (headings.length && headings.at(-1).indentation > indentation)
		headings.pop();
	if (headings.at(-1)?.indentation !== indentation)
		headings.push({ indentation, name: resultName });
	const name = headings.pop().name;
	return { name, ancestors: headings.map((item) => item.name) };
}

// The runner reports a file whose process failed outside any test as one result named after the file.
function isNodeFileResult(indentation, name, file) {
	return (
		indentation === 0 &&
		Boolean(file) &&
		normalizePath(name.replaceAll("\\\\", "\\")) === normalizePath(file)
	);
}

// The file's own error (a module that cannot load, a throw at the top level) is printed before its result as
// `# ` diagnostic lines; without one, the exit code says how the process ended.
function nodeFileFailure(diagnostics, detailText, failure) {
	const thrown = diagnostics.findIndex((line) =>
		/^(?:[A-Za-z]*Error\b|Error \[)/.test(line),
	);
	if (thrown >= 0) return diagnostics.slice(thrown).join("\n");
	const exitCode = detailText.match(/\n?\s*exitCode: (\S+)/)?.[1];
	return exitCode
		? `test file exited with code ${exitCode} outside its tests: ${failure}`
		: failure;
}

function parseNodeReport(text, file) {
	const tests = [];
	const fileFailures = new Map();
	const lines = text.split(/\r?\n/);
	const headings = [];
	const diagnostics = [];
	for (let index = 0; index < lines.length; index += 1) {
		const heading = lines[index].match(/^(\s*)# Subtest: (.*)$/);
		if (heading) nodeHeading(headings, heading[1].length, heading[2]);
		else if (lines[index].startsWith("# "))
			diagnostics.push(lines[index].slice(2).replace(/\\([\\#])/g, "$1"));
		const result = lines[index].match(/^(\s*)(not ok|ok) \d+ - (.*)$/);
		if (!result) continue;
		const indentation = result[1].length;
		const { name, ancestors } = closeNodeHeading(
			headings,
			indentation,
			result[3].trim(),
		);
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
		if (kind !== "test") continue;
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
		if (failure && isNodeFileResult(indentation, name, file)) {
			fileFailures.set(file, nodeFileFailure(diagnostics, detailText, failure));
			continue;
		}
		tests.push({
			file,
			title: name,
			ancestors,
			fullName: [...ancestors, name].join(" > "),
			status: skipped ? "skipped" : failure ? "failed" : "passed",
			failure,
			line: null,
		});
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
