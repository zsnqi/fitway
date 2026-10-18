import {
	testSourceMatches,
	titleSpecificity,
} from "./tests-base-run-source.mjs";
import { normalizePath } from "./tooling-map-parser.mjs";

export function firstFailureLine(message) {
	return (
		String(message ?? "")
			.split(/\r?\n/)
			.map((line) => line.trim())
			.find(Boolean) ?? "test failed"
	);
}

function addedModuleIn(message, addedModules) {
	const normalized = String(message ?? "").replaceAll("\\", "/");
	return addedModules.find((file) => {
		const normalizedFile = normalizePath(file);
		const name = normalizedFile.split("/").at(-1);
		const stem = name?.replace(/\.[^.]+$/, "");
		return (
			normalized.includes(normalizedFile) ||
			(name &&
				new RegExp(`(?:^|[/'" ])${escapeRegex(name)}(?:$|[/'" )])`).test(
					normalized,
				)) ||
			(stem &&
				new RegExp(`(?:^|[/'" ])${escapeRegex(stem)}(?:\\.|$|[/'" )])`).test(
					normalized,
				))
		);
	});
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isTimeout(message) {
	return /(?:test|hook)\s+timed out|timed out after|ETIMEDOUT|STACK_TRACE_ERROR/i.test(
		String(message ?? ""),
	);
}

export function classifyFailure(message, addedModules = []) {
	const text = String(message ?? "");
	if (isTimeout(text))
		return {
			kind: "wrong-reason",
			detail: `${firstFailureLine(text)} (timeout)`,
		};
	if (/AssertionError|ERR_ASSERTION|expected .* to /i.test(text))
		return { kind: "assertion", detail: firstFailureLine(text) };
	const module = addedModuleIn(text, addedModules);
	if (module)
		return {
			kind: "missing-module",
			detail: `${firstFailureLine(text)} (module: ${module})`,
			module,
		};
	return { kind: "wrong-reason", detail: firstFailureLine(text) };
}

function sourceCandidates(parsed, test) {
	const byLine = test.line
		? parsed.tests.filter(
				(candidate) =>
					test.line >= candidate.lineStart && test.line <= candidate.lineEnd,
			)
		: [];
	if (byLine.length) return byLine;
	return parsed.tests.filter((candidate) =>
		testSourceMatches(candidate, test.title, test.ancestors),
	);
}

export function assignSourceTest(parsed, test, used = new Set()) {
	const candidates = sourceCandidates(parsed, test).sort(
		(left, right) => titleSpecificity(right) - titleSpecificity(left),
	);
	const selected =
		candidates.find((candidate) => candidate.each || !used.has(candidate)) ??
		null;
	if (selected) used.add(selected);
	return selected;
}

// A table's rows share one call, so its base is the call with the same source title, not a runner name.
export function baseSourceFor(parsed, source, test, occurrence) {
	if (!parsed) return undefined;
	if (source?.each)
		return parsed.tests.find(
			(candidate) =>
				candidate.fullName === source.fullName &&
				candidate.sameNameOccurrence === source.sameNameOccurrence,
		);
	return parsed.tests.filter((candidate) =>
		testSourceMatches(candidate, test.title, test.ancestors),
	)[occurrence];
}

export function judgedTest({ test, source, baseSource, globalJudged }) {
	if (test.status === "skipped") return false;
	if (globalJudged || !source || !baseSource) return true;
	return source.callSource !== baseSource.callSource;
}

export function fallbackJudgedSourceTests({ result, base, globalJudged }) {
	const resultGroups = new Map();
	const baseGroups = new Map();
	for (const test of result.tests) {
		const group = resultGroups.get(test.fullName) ?? [];
		group.push(test);
		resultGroups.set(test.fullName, group);
	}
	for (const test of base?.tests ?? []) {
		const group = baseGroups.get(test.fullName) ?? [];
		group.push(test);
		baseGroups.set(test.fullName, group);
	}
	const judged = [];
	for (const [name, group] of resultGroups) {
		const baseGroup = baseGroups.get(name) ?? [];
		for (let index = 0; index < group.length; index += 1) {
			const source = group[index];
			if (!globalJudged && baseGroup[index]?.callSource === source.callSource)
				continue;
			if (!source.skipped) judged.push(source);
		}
	}
	return judged;
}
