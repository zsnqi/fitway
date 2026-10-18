import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { repositoryFingerprint } from "../repository-fingerprint.mjs";
import { samePath } from "./path-identity.mjs";
import {
	assignSourceTest,
	baseSourceFor,
	classifyFailure,
	fallbackJudgedSourceTests,
	firstFailureLine,
	isTimeout,
	judgedTest,
} from "./tests-base-run-classify.mjs";
import {
	ancestorOf,
	diffChanges,
	extractTree,
	resolveCommit,
	trackedFiles,
	treeSources,
} from "./tests-base-run-git.mjs";
import {
	buildImportGraph,
	forwardClosure,
	isSourceFile,
	runnerForTestFile,
	supportName,
	testSupportFile,
} from "./tests-base-run-graph.mjs";
import {
	processWasKilled,
	readNodeReport,
	readVitestReport,
	regexEscape,
	runNodeTests,
	runVitest,
} from "./tests-base-run-runner.mjs";
import { basePathFor, parseTestSource } from "./tests-base-run-source.mjs";
import { ToolStartupError } from "./tool-contract.mjs";
import { isTestFile } from "./tooling-map-parser.mjs";

const USAGE = "pnpm tests:base-run --base <ref> [--result <ref>]";

function refuse(what, fix) {
	throw new ToolStartupError(what, fix, { what });
}

function unique(values) {
	return [...new Set(values)].sort((left, right) =>
		left.localeCompare(right, "en"),
	);
}

function hasFile(root, file) {
	return existsSync(path.join(root, file));
}

function reportFailure(report, file) {
	return report.fileFailures.get(file) ?? report.fileFailures.get("") ?? null;
}

function runnerArgs(kind) {
	return kind === "node"
		? {
				run: runNodeTests,
				read: readNodeReport,
			}
		: {
				run: runVitest,
				read: readVitestReport,
			};
}

function invokeRunner({ kind, tree, files, outputFile, namePattern = null }) {
	const runner = runnerArgs(kind);
	const result = runner.run({
		tree,
		files,
		outputFile,
		namePattern,
	});
	try {
		return {
			result,
			report: runner.read({ tree, outputFile, result, files }),
		};
	} catch (error) {
		const failure = processWasKilled(result)
			? "Test process timed out"
			: error instanceof Error
				? error.message
				: String(error);
		return {
			result,
			report: {
				tests: [],
				fileFailures: new Map([["", failure]]),
			},
		};
	}
}

function classificationLine(kind, file, test, detail) {
	const suffix = detail ? ` ${detail}` : "";
	return `${kind} ${file} > ${test.fullName}:${suffix}`;
}

async function rerunClassification({
	kind,
	file,
	test,
	tree,
	tempRoot,
	counter,
	addedModules,
}) {
	counter.value += 1;
	const outputFile = path.join(tempRoot, `rerun-${counter.value}.json`);
	const rerun = invokeRunner({
		kind,
		tree,
		files: [file],
		outputFile,
		namePattern: `^${regexEscape(test.fullName)}$`,
	});
	const rerunTest = rerun.report.tests.find(
		(candidate) =>
			candidate.fullName === test.fullName && candidate.file === file,
	);
	if (rerunTest?.status === "passed")
		return { kind: "green-on-base", detail: "" };
	if (rerunTest) return classifyFailure(rerunTest.failure, addedModules);
	const failure =
		reportFailure(rerun.report, file) ||
		(processWasKilled(rerun.result)
			? "Test process timed out"
			: "The rerun did not report the timed-out test");
	const classified = classifyFailure(failure, addedModules);
	if (classified.kind === "wrong-reason" && isTimeout(failure))
		return {
			kind: "wrong-reason",
			detail: `${firstFailureLine(test.failure)} (timeout)`,
		};
	return classified;
}

async function classifyTest(context) {
	const { test, addedModules } = context;
	if (test.status === "passed") return { kind: "green-on-base", detail: "" };
	const classified = classifyFailure(test.failure, addedModules);
	if (classified.kind !== "wrong-reason" || !isTimeout(test.failure))
		return classified;
	return rerunClassification(context);
}

async function ensureFileReport({
	kind,
	file,
	report,
	result,
	tree,
	tempRoot,
	counter,
}) {
	let fileReport = report;
	let fileResult = result;
	let failure = reportFailure(fileReport, file);
	let tests = fileReport.tests.filter((test) => test.file === file);
	// A file-level failure, with or without some tests reported, is confirmed by running the file alone once.
	if (failure) {
		counter.value += 1;
		const rerun = invokeRunner({
			kind,
			tree,
			files: [file],
			outputFile: path.join(tempRoot, `load-${counter.value}.json`),
		});
		if (!processWasKilled(rerun.result)) fileReport = rerun.report;
		fileResult = rerun.result;
		tests = fileReport.tests.filter((test) => test.file === file);
		failure =
			reportFailure(fileReport, file) ||
			(processWasKilled(fileResult)
				? "Test process timed out"
				: tests.length
					? null
					: failure);
	}
	return { fileReport, failure, tests };
}

function loadFailureOutcome({
	file,
	kind,
	failure,
	parsed,
	baseParsed,
	globalJudged,
	addedModules,
}) {
	const judged = fallbackJudgedSourceTests({
		result: parsed,
		base: baseParsed,
		globalJudged,
	});
	if (!judged.length)
		return {
			judged: [],
			unchanged: [],
			skipped: [],
			notRun: [`not-run ${file}: no tests reported by the ${kind} runner`],
		};
	const classified = classifyFailure(failure, addedModules);
	return {
		judged: judged.map((source) => ({
			...classified,
			test: source,
		})),
		unchanged: [],
		skipped: parsed.tests.filter((test) => test.skipped),
		notRun: [],
	};
}

async function classifyReported({
	kind,
	file,
	tests,
	failure,
	parsed,
	baseParsed,
	globalJudged,
	addedModules,
	tree,
	tempRoot,
	counter,
}) {
	const judged = [];
	const unchanged = [];
	const skipped = [];
	const occurrences = new Map();
	const used = new Set();
	const classificationContext = {
		kind,
		file,
		tree,
		tempRoot,
		counter,
		addedModules,
	};
	for (const test of tests) {
		const source = assignSourceTest(parsed, test, used);
		const occurrence = occurrences.get(test.fullName) ?? 0;
		occurrences.set(test.fullName, occurrence + 1);
		const baseSource = baseSourceFor(baseParsed, source, test, occurrence);
		const judgement = { test, source, baseSource, globalJudged };
		// A test the source does not skip, reported skipped beside a file-level failure, never ran.
		if (
			failure &&
			test.status === "skipped" &&
			source &&
			!source.skipped &&
			judgedTest({ ...judgement, test: { ...test, status: "failed" } })
		) {
			judged.push({ ...classifyFailure(failure, addedModules), test });
			continue;
		}
		if (test.status === "skipped") {
			skipped.push(test);
			continue;
		}
		if (!judgedTest(judgement)) {
			unchanged.push(test);
			continue;
		}
		const classified = await classifyTest({
			...classificationContext,
			test,
		});
		judged.push({ ...classified, test });
	}
	if (failure)
		for (const source of fallbackJudgedSourceTests({
			result: parsed,
			base: baseParsed,
			globalJudged,
		}))
			if (!used.has(source))
				judged.push({
					...classifyFailure(failure, addedModules),
					test: source,
				});
	return { judged, unchanged, skipped, notRun: [] };
}

async function fileOutcome(context) {
	const { failure, tests } = await ensureFileReport(context);
	if (!tests.length && failure)
		return loadFailureOutcome({ ...context, failure });
	if (!tests.length)
		return {
			judged: [],
			unchanged: [],
			skipped: [],
			notRun: [
				`not-run ${context.file}: no tests reported by the ${context.kind} runner`,
			],
		};
	return classifyReported({ ...context, tests, failure });
}

async function cleanupScratch({ tempRoot, cache, before, cwd }) {
	const parent = path.dirname(tempRoot);
	if (!(await samePath(parent, cache)))
		throw new Error(`Refusing to remove unexpected scratch path: ${tempRoot}`);
	rmSync(tempRoot, { recursive: true, force: true, maxRetries: 5 });
	const after = await repositoryFingerprint({ cwd });
	if (before !== after)
		throw new Error("tests:base-run changed checkout content");
}

function resolveRunRange(cwd, base, result) {
	if (!base) refuse("missing required option --base", `run ${USAGE}`);
	if (!existsSync(path.join(cwd, "node_modules")))
		refuse(
			"checkout has no node_modules",
			"run pnpm install in this checkout first",
		);
	const baseSha = resolveCommit(cwd, base);
	if (!baseSha)
		refuse(
			`--base does not name a commit: ${base}`,
			`pass an existing commit; run ${USAGE}`,
		);
	const resultSha = resolveCommit(cwd, result);
	if (!resultSha)
		refuse(
			`--result does not name a commit: ${result}`,
			`pass an existing commit; run ${USAGE}`,
		);
	if (!ancestorOf(cwd, baseSha, resultSha))
		refuse(
			`base ${baseSha} is not an ancestor of result ${resultSha}`,
			`pass an ancestor with --base; run ${USAGE}`,
		);
	const changes = diffChanges(cwd, baseSha, resultSha);
	const testChanges = changes.filter(
		(change) => change.status !== "D" && isTestFile(change.path),
	);
	const deletedTests = changes.filter(
		(change) => change.status === "D" && isTestFile(change.path),
	);
	return { baseSha, resultSha, changes, testChanges, deletedTests };
}

function supportChangesFor({ changes, baseFiles, baseGraph, resultGraph }) {
	return changes.filter((change) => {
		if (change.status === "D" || isTestFile(change.path)) return false;
		if (!isSourceFile(change.path)) return false;
		if (
			!supportName(change.path) &&
			!change.path.startsWith("tests/") &&
			!change.path.startsWith(".agents/skills/") &&
			!change.path.includes("/fixtures/")
		)
			return false;
		if (
			!testSupportFile(change.path, resultGraph.reverse, resultGraph.production)
		)
			return false;
		if (change.status === "A") return supportName(change.path);
		const basePath = change.oldPath ?? change.path;
		return (
			baseFiles.includes(basePath) &&
			testSupportFile(basePath, baseGraph.reverse, baseGraph.production)
		);
	});
}

function affectedTestPaths({
	testChanges,
	resultSourceFiles,
	supportPaths,
	resultGraph,
}) {
	const paths = new Set(testChanges.map((change) => change.path));
	for (const file of resultSourceFiles) {
		if (!isTestFile(file)) continue;
		const dependencies = forwardClosure(resultGraph.graph, file);
		if ([...supportPaths].some((support) => dependencies.has(support)))
			paths.add(file);
	}
	return paths;
}

function analyzeTrees(input) {
	const {
		cwd,
		baseSha,
		resultSha,
		changes,
		testChanges,
		baseFiles,
		baseSourceFiles,
		resultSourceFiles,
		tempRoot,
		tree,
		resultTree,
	} = input;
	extractTree(cwd, baseSha, tempRoot, tree);
	extractTree(cwd, resultSha, tempRoot, resultTree);
	const baseGraph = buildImportGraph({
		files: baseSourceFiles,
		sources: treeSources(tree, baseSourceFiles),
		root: tree,
	});
	const resultGraph = buildImportGraph({
		files: resultSourceFiles,
		sources: treeSources(resultTree, resultSourceFiles),
		root: resultTree,
	});
	const supportChanges = supportChangesFor({
		changes,
		baseFiles,
		baseGraph,
		resultGraph,
	});
	const supportPaths = new Set(supportChanges.map((change) => change.path));
	const renames = new Map(
		changes
			.filter((change) => change.status === "R" && change.oldPath)
			.map((change) => [change.path, change.oldPath]),
	);
	const testEntries = [
		...affectedTestPaths({
			testChanges,
			resultSourceFiles,
			supportPaths,
			resultGraph,
		}),
	].map((file) => ({
		path: file,
		oldPath: renames.get(file) ?? file,
	}));
	return { resultGraph, supportChanges, supportPaths, renames, testEntries };
}

function parsedRunTests({ testEntries, renames, tree, resultTree }) {
	const parsableTests = testEntries.filter(
		(change) => runnerForTestFile(change.path).kind !== "not-run",
	);
	const parsedByPath = new Map();
	for (const change of parsableTests) {
		const basePath = basePathFor(change.path, renames);
		parsedByPath.set(change.path, {
			result: parseTestSource(
				change.path,
				readFileSync(path.join(resultTree, change.path), "utf8"),
			),
			base:
				hasFile(tree, basePath) && isTestFile(basePath)
					? parseTestSource(
							basePath,
							readFileSync(path.join(tree, basePath), "utf8"),
						)
					: null,
		});
	}
	return { parsableTests, parsedByPath };
}

function overlayResultFiles({ tree, resultTree, taken, write }) {
	for (const file of taken) {
		write(`result-file ${file}`);
		const destination = path.join(tree, file);
		mkdirSync(path.dirname(destination), { recursive: true });
		writeFileSync(destination, readFileSync(path.join(resultTree, file)));
	}
}

function combineNodeReports({ tree, tempRoot, files }) {
	const combined = {
		result: { status: 0, stdout: "", stderr: "" },
		report: { tests: [], fileFailures: new Map() },
	};
	for (const [index, file] of files.entries()) {
		const invocation = invokeRunner({
			kind: "node",
			tree,
			files: [file],
			outputFile: path.join(tempRoot, `node-report-${index}.tap`),
		});
		combined.report.tests.push(...invocation.report.tests);
		for (const [failedFile, failure] of invocation.report.fileFailures)
			combined.report.fileFailures.set(failedFile, failure);
		if (processWasKilled(invocation.result))
			combined.report.fileFailures.set(file, "Test process timed out");
		if (invocation.result.status)
			combined.result.status = invocation.result.status;
	}
	return combined;
}

function collectReports({ tree, tempRoot, vitestFiles, nodeFiles }) {
	const reportByKind = new Map();
	if (vitestFiles.length) {
		const invocation = invokeRunner({
			kind: "vitest",
			tree,
			files: vitestFiles,
			outputFile: path.join(tempRoot, "vitest-report.json"),
		});
		if (processWasKilled(invocation.result))
			for (const file of vitestFiles)
				invocation.report.fileFailures.set(file, "Test process timed out");
		reportByKind.set("vitest", invocation);
	}
	if (nodeFiles.length)
		reportByKind.set(
			"node",
			combineNodeReports({ tree, tempRoot, files: nodeFiles }),
		);
	return reportByKind;
}

function addedModulePaths({ changes, supportPaths }) {
	return unique(
		changes
			.filter(
				(change) =>
					change.status === "A" &&
					isSourceFile(change.path) &&
					!isTestFile(change.path) &&
					!supportPaths.has(change.path),
			)
			.map((change) => change.path),
	);
}

async function collectOutcomes(input) {
	const outcomes = [];
	const notRun = input.deletedTests.map(
		(change) => `not-run ${change.path}: test file was deleted`,
	);
	const counter = { value: 0 };
	for (const change of input.testEntries) {
		const runner = runnerForTestFile(change.path);
		if (runner.kind === "not-run") {
			notRun.push(`not-run ${change.path}: ${runner.reason}`);
			continue;
		}
		const invocation = input.reportByKind.get(runner.kind);
		const parsed = input.parsedByPath.get(change.path);
		const dependencies = forwardClosure(input.resultGraph.graph, change.path);
		const supportJudged = [...dependencies].some((file) =>
			input.supportPaths.has(file),
		);
		const globalJudged =
			!parsed.base ||
			parsed.result.skeleton !== parsed.base.skeleton ||
			supportJudged;
		outcomes.push(
			await fileOutcome({
				kind: runner.kind,
				file: change.path,
				report: invocation.report,
				result: invocation.result,
				parsed: parsed.result,
				baseParsed: parsed.base,
				globalJudged,
				addedModules: input.addedModules,
				tree: input.tree,
				tempRoot: input.tempRoot,
				counter,
			}),
		);
	}
	return { outcomes, notRun };
}

function emitOutcomes({ outcomes, notRun, write }) {
	const classes = {
		assertion: 0,
		"missing-module": 0,
		"wrong-reason": 0,
		"green-on-base": 0,
	};
	for (const outcome of outcomes)
		for (const judged of outcome.judged) {
			classes[judged.kind] += 1;
			write(
				classificationLine(
					judged.kind,
					judged.test.file,
					judged.test,
					judged.detail,
				),
			);
		}
	for (const outcome of outcomes)
		for (const test of outcome.unchanged)
			write(`unchanged ${test.file} > ${test.fullName}`);
	for (const outcome of outcomes)
		for (const test of outcome.skipped)
			write(`skipped ${test.file} > ${test.fullName}`);
	for (const line of notRun) write(line);
	for (const outcome of outcomes)
		for (const line of outcome.notRun) write(line);
	const unchanged = outcomes.reduce(
		(total, outcome) => total + outcome.unchanged.length,
		0,
	);
	const skipped = outcomes.reduce(
		(total, outcome) => total + outcome.skipped.length,
		0,
	);
	const notRunCount =
		notRun.length +
		outcomes.reduce((total, outcome) => total + outcome.notRun.length, 0);
	write(
		`summary assertion=${classes.assertion} missing-module=${classes["missing-module"]} wrong-reason=${classes["wrong-reason"]} green-on-base=${classes["green-on-base"]} unchanged=${unchanged} skipped=${skipped} not-run=${notRunCount}`,
	);
	return classes["wrong-reason"] || classes["green-on-base"] ? 1 : 0;
}

async function executeAnalyzed(input) {
	const { resultGraph, supportChanges, supportPaths, renames, testEntries } =
		input.analyzed;
	if (
		!input.testChanges.length &&
		!input.deletedTests.length &&
		!supportPaths.size
	) {
		input.write(
			`tests:base-run: no test changes between ${input.baseSha} and ${input.resultSha}`,
		);
		return 0;
	}
	const taken = unique([
		...input.testChanges.map((change) => change.path),
		...supportChanges.map((change) => change.path),
	]);
	const { parsableTests, parsedByPath } = parsedRunTests({
		testEntries,
		renames,
		tree: input.tree,
		resultTree: input.resultTree,
	});
	overlayResultFiles({
		tree: input.tree,
		resultTree: input.resultTree,
		taken,
		write: input.write,
	});
	const vitestFiles = parsableTests
		.filter((change) => runnerForTestFile(change.path).kind === "vitest")
		.map((change) => change.path);
	const nodeFiles = parsableTests
		.filter((change) => runnerForTestFile(change.path).kind === "node")
		.map((change) => change.path);
	const reportByKind = collectReports({
		tree: input.tree,
		tempRoot: input.tempRoot,
		vitestFiles,
		nodeFiles,
	});
	const addedModules = addedModulePaths({
		changes: input.changes,
		supportPaths,
	});
	const collected = await collectOutcomes({
		testEntries,
		deletedTests: input.deletedTests,
		reportByKind,
		parsedByPath,
		resultGraph,
		supportPaths,
		addedModules,
		tree: input.tree,
		tempRoot: input.tempRoot,
	});
	return emitOutcomes({ ...collected, write: input.write });
}

export async function runBaseTests({
	cwd = process.cwd(),
	base,
	result = "HEAD",
	write = (line) => console.log(line),
}) {
	const before = await repositoryFingerprint({ cwd });
	const { baseSha, resultSha, changes, testChanges, deletedTests } =
		resolveRunRange(cwd, base, result);

	const baseFiles = trackedFiles(cwd, baseSha);
	const resultFiles = trackedFiles(cwd, resultSha);
	const baseSourceFiles = baseFiles.filter(isSourceFile);
	const resultSourceFiles = resultFiles.filter(isSourceFile);
	const cache = path.join(cwd, "node_modules", ".cache");
	mkdirSync(cache, { recursive: true });
	const tempRoot = mkdtempSync(path.join(cache, "tests-base-run-"));
	const tree = path.join(tempRoot, "base");
	const resultTree = path.join(tempRoot, "result");
	let exitCode;
	let cleanupFailure = null;

	try {
		const analyzed = analyzeTrees({
			cwd,
			baseSha,
			resultSha,
			changes,
			testChanges,
			baseFiles,
			resultFiles,
			baseSourceFiles,
			resultSourceFiles,
			tempRoot,
			tree,
			resultTree,
		});
		exitCode = await executeAnalyzed({
			analyzed,
			baseSha,
			resultSha,
			testChanges,
			deletedTests,
			changes,
			write,
			tree,
			resultTree,
			tempRoot,
		});
	} finally {
		try {
			await cleanupScratch({ tempRoot, cache, before, cwd });
		} catch (error) {
			cleanupFailure = error;
		}
	}
	if (cleanupFailure) throw cleanupFailure;
	return exitCode;
}
