import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
	readModuleSpecifiers,
	resolveModuleFile,
} from "./tooling-map-imports.mjs";
import {
	createSourceFile,
	isTestFile,
	normalizePath,
} from "./tooling-map-parser.mjs";

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;
const NODE_TEST_FILE = /^\.agents\/skills\/verify-fitway\/[^/]+\.test\.mjs$/;

export function isSourceFile(file) {
	return SOURCE_FILE.test(normalizePath(file));
}

export function runnerForTestFile(file) {
	const normalized = normalizePath(file);
	if (NODE_TEST_FILE.test(normalized)) return { kind: "node" };
	if (
		normalized.includes("/tests/browser/") ||
		/\.browser\.[^/]+$/.test(normalized)
	)
		return {
			kind: "not-run",
			reason: "browser test outside the fast ladder",
		};
	if (/\.integration\.[^/]+$/.test(normalized))
		return {
			kind: "not-run",
			reason: "integration test outside the fast Vitest config",
		};
	if (isTestFile(normalized)) return { kind: "vitest" };
	return { kind: "not-run", reason: "not a test file the fast ladder runs" };
}

export function buildImportGraph({ files, sources, root }) {
	const sourceSet = new Set(files);
	const graph = new Map();
	const reverse = new Map();
	for (const file of files) {
		const targets = new Set();
		for (const specifier of readModuleSpecifiers(
			file,
			sources.get(file) ?? "",
		)) {
			const target = resolveModuleFile(specifier, file, root, sourceSet);
			if (!target) continue;
			targets.add(target);
			const importers = reverse.get(target) ?? new Set();
			importers.add(file);
			reverse.set(target, importers);
		}
		graph.set(file, targets);
	}
	const production = new Set();
	for (const file of files) {
		if (isTestFile(file)) continue;
		const source = sources.get(file) ?? "";
		if (source.startsWith("#!")) production.add(file);
		const sourceFile = createSourceFile(file, source);
		const visit = (node) => {
			if (
				ts.isCallExpression(node) &&
				ts.isIdentifier(node.expression) &&
				node.expression.text === "beginToolCommand"
			)
				production.add(file);
			ts.forEachChild(node, visit);
		};
		visit(sourceFile);
	}
	const packageJson = path.join(root, "package.json");
	try {
		const scripts = JSON.parse(readFileSync(packageJson, "utf8")).scripts ?? {};
		for (const script of Object.values(scripts)) {
			for (const match of String(script).matchAll(
				/(?:^|\s)((?:scripts|\.agents|apps|packages)\/[^\s"']+\.(?:[cm]?[jt]sx?))/g,
			))
				if (sourceSet.has(normalizePath(match[1])))
					production.add(normalizePath(match[1]));
		}
	} catch {}
	const registry = sources.get("scripts/agent-environment/tool-registry.mjs");
	if (registry)
		for (const file of files) if (registry.includes(file)) production.add(file);
	return { graph, reverse, files: sourceSet, production };
}

export function testSupportFile(file, reverse, production = new Set()) {
	if (production.has(normalizePath(file))) return false;
	const active = new Set();
	const support = (candidate) => {
		if (production.has(candidate)) return false;
		if (active.has(candidate)) return true;
		const importers = [...(reverse.get(candidate) ?? [])];
		if (importers.length === 0) return false;
		active.add(candidate);
		const result = importers.every(
			(importer) => isTestFile(importer) || support(importer),
		);
		active.delete(candidate);
		return result;
	};
	return support(normalizePath(file));
}

export function forwardClosure(graph, start) {
	const seen = new Set();
	const visit = (file) => {
		if (seen.has(file)) return;
		seen.add(file);
		for (const target of graph.get(file) ?? []) visit(target);
	};
	visit(normalizePath(start));
	return seen;
}

export function supportName(file) {
	const normalized = normalizePath(file);
	const name = path.posix.basename(normalized);
	const stem = name.slice(0, name.length - path.posix.extname(name).length);
	return /fixture/i.test(name) || /-(?:cases|probes)$/.test(stem);
}
