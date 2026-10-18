import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";
import {
	bomExceptionPathKey,
	normalizeGitPath,
} from "./agent-environment/git-path-key.mjs";
import { lineAt } from "./agent-environment/markdown-lines.mjs";
import { validateActiveResumePoints } from "./agent-environment/resume-point.mjs";
import { beginToolCommand } from "./agent-environment/tool-contract.mjs";
import { checkAgentContext } from "./check-agent-context.mjs";
import { formatAgentContextWarnings } from "./check-agent-context-options.mjs";
import {
	assertProjectRecordUnion,
	supersededByErrors,
} from "./project-state-invariants.mjs";
import {
	assertFileRecord,
	assertTreeRecord,
	CLAUDE_AGENT_DIRECTORY,
	CLAUDE_INSTRUCTIONS_FILE,
	fail,
	normalizeClaudeModel,
	readBytes,
	resolveRepositoryPath,
	root,
	TRACKED_BOM_EXCEPTIONS,
	UTF8_BOM,
} from "./repository-files.mjs";
import { repositoryOptions } from "./verify-repository-options.mjs";
import { verifyVisualAuthorityRepository } from "./visual-authority.mjs";

export function listTrackedFiles(
	cwd = root,
	patterns = [],
	{ untracked = false } = {},
) {
	const args = ["ls-files"];
	if (untracked) args.push("--others", "--exclude-standard");
	args.push("-z", "--", ...patterns);
	const output = execFileSync("git", args, { cwd });
	return output
		.toString("utf8")
		.split("\0")
		.filter(Boolean)
		.map(normalizeGitPath)
		.sort();
}

export function assertNoUnexpectedBom({
	repositoryRoot = root,
	trackedFiles = listTrackedFiles(repositoryRoot),
	exceptions = TRACKED_BOM_EXCEPTIONS,
} = {}) {
	const trackedByPath = new Map(
		trackedFiles.map((relativePath) => [
			bomExceptionPathKey(relativePath),
			relativePath,
		]),
	);
	const seenExceptions = new Map();
	const allowed = new Map();
	for (const entry of exceptions) {
		const pathKey = bomExceptionPathKey(entry.path);
		if (!entry.reason?.trim())
			fail(`BOM exception ${entry.path} must have a non-empty reason.`);
		if (seenExceptions.has(pathKey))
			fail(
				`BOM exception ${entry.path} duplicates ${seenExceptions.get(pathKey)} for the same file.`,
			);
		seenExceptions.set(pathKey, entry.path);
		const trackedPath = trackedByPath.get(pathKey);
		if (!trackedPath)
			fail(`BOM exception ${entry.path} is not a tracked file.`);
		const bytes = readFileSync(path.resolve(repositoryRoot, trackedPath));
		if (!bytes.subarray(0, UTF8_BOM.length).equals(UTF8_BOM))
			fail(`BOM exception ${entry.path} does not start with a UTF-8 BOM.`);
		allowed.set(pathKey, entry.reason);
	}
	let allowedCount = 0;
	for (const relativePath of trackedFiles) {
		const bytes = readFileSync(path.resolve(repositoryRoot, relativePath));
		if (!bytes.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)) continue;
		if (allowed.has(bomExceptionPathKey(relativePath))) {
			allowedCount += 1;
			continue;
		}
		fail(
			`File starts with a UTF-8 BOM: ${relativePath}. Remove the BOM or add the path to TRACKED_BOM_EXCEPTIONS with its reason.`,
		);
	}
	return { checked: trackedFiles.length, allowed: allowedCount };
}

export function assertClaudeAgentTable({
	repositoryRoot = root,
	trackedFiles = listTrackedFiles(repositoryRoot, [CLAUDE_AGENT_DIRECTORY]),
} = {}) {
	const instructionsPath = path.resolve(
		repositoryRoot,
		CLAUDE_INSTRUCTIONS_FILE,
	);
	const instructions = readFileSync(instructionsPath, "utf8");
	const trackedDefinitions = trackedFiles.filter(
		(relativePath) =>
			relativePath.startsWith(`${CLAUDE_AGENT_DIRECTORY}/`) &&
			relativePath.endsWith(".md"),
	);
	const trackedNames = new Set(
		trackedDefinitions.map((relativePath) =>
			path.posix.basename(relativePath, ".md"),
		),
	);
	const rows = new Map();
	for (const match of instructions.matchAll(
		/^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|/gm,
	)) {
		const name = match[1].trim();
		const row = {
			name,
			model: match[2].trim(),
			effort: match[3].trim(),
			line: lineAt(instructions, match.index),
		};
		if (rows.has(name))
			fail(
				`${CLAUDE_INSTRUCTIONS_FILE}:${row.line}: agent table names ${name} more than once`,
			);
		rows.set(name, row);
	}
	if (rows.size === 0)
		fail(`${CLAUDE_INSTRUCTIONS_FILE}: agent definition table is missing`);

	for (const row of rows.values()) {
		const relativeDefinition = `${CLAUDE_AGENT_DIRECTORY}/${row.name}.md`;
		if (!trackedNames.has(row.name))
			fail(
				`${CLAUDE_INSTRUCTIONS_FILE}:${row.line}: agent table names ${row.name}, but ${relativeDefinition} is not tracked`,
			);
		const definitionText = readFileSync(
			path.resolve(repositoryRoot, relativeDefinition),
			"utf8",
		);
		const frontmatter = definitionText.match(
			/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
		);
		if (!frontmatter)
			fail(`${relativeDefinition}: agent definition is missing frontmatter`);
		const definition = parseYaml(frontmatter[1]);
		if (typeof definition?.model !== "string")
			fail(`${relativeDefinition}: agent definition is missing model`);
		if (typeof definition?.effort !== "string")
			fail(`${relativeDefinition}: agent definition is missing effort`);
		if (
			normalizeClaudeModel(row.model) !== normalizeClaudeModel(definition.model)
		)
			fail(
				`${CLAUDE_INSTRUCTIONS_FILE}:${row.line}: agent ${row.name} model ${row.model} does not match ${definition.model}`,
			);
		if (row.effort.toLowerCase() !== definition.effort.toLowerCase())
			fail(
				`${CLAUDE_INSTRUCTIONS_FILE}:${row.line}: agent ${row.name} effort ${row.effort} does not match ${definition.effort}`,
			);
	}

	for (const relativeDefinition of trackedDefinitions) {
		const name = path.posix.basename(relativeDefinition, ".md");
		if (name.startsWith("impeccable-") || rows.has(name)) continue;
		fail(
			`${CLAUDE_INSTRUCTIONS_FILE}: agent table is missing tracked definition ${relativeDefinition}`,
		);
	}
	return {
		rows: rows.size,
		trackedDefinitions: trackedDefinitions.length,
	};
}

async function assertMissing(relativePath) {
	try {
		await stat(resolveRepositoryPath(relativePath));
		fail(`Superseded/generated active artifact still exists: ${relativePath}`);
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
}

export function assertGardenerReport(entry, text, updatedAt) {
	const header = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!header) fail("Gardener report is missing its date/outcome frontmatter");
	const metadata = parseYaml(header[1]);
	if (metadata?.date !== entry.date || metadata?.outcome !== entry.outcome) {
		fail("Gardener ledger date/outcome does not match the rolling report");
	}
	if (entry.date > updatedAt.slice(0, 10)) {
		fail("Gardener pass date is later than PROJECT_STATE.yaml updatedAt");
	}
}

export async function verifyGardenerRecord(state, read = readBytes) {
	if (!state.gardener) return;
	assertGardenerReport(
		state.gardener,
		(await read(state.gardener.report)).toString("utf8"),
		state.updatedAt,
	);
}

async function main(options = {}) {
	execFileSync("git", ["diff", "HEAD", "--check", "--"], {
		cwd: root,
		stdio: "inherit",
	});

	const required = [
		"AGENTS.md",
		"FITWAY_PRODUCT.md",
		"SPEC.md",
		"DESIGN_GUIDE.md",
		"PHASES.md",
		"RESEARCH.md",
		"README.md",
		"PROJECT_STATE.yaml",
		"PROJECT_STATE_HISTORY.yaml",
		"docs/WORKFLOW.md",
		"docs/POLISH_BACKLOG.md",
		"docs/schemas/project-state.schema.json",
		"docs/schemas/project-state-history.schema.json",
		"visual-direction-gate/approved/APPROVAL_MANIFEST.yaml",
	];
	for (const relativePath of required) await readBytes(relativePath);

	const state = parseYaml(
		(await readBytes("PROJECT_STATE.yaml")).toString("utf8"),
	);
	const history = parseYaml(
		(await readBytes("PROJECT_STATE_HISTORY.yaml")).toString("utf8"),
	);
	const stateSchema = JSON.parse(
		(await readBytes("docs/schemas/project-state.schema.json")).toString(
			"utf8",
		),
	);
	const historySchema = JSON.parse(
		(
			await readBytes("docs/schemas/project-state-history.schema.json")
		).toString("utf8"),
	);
	const ajv = new Ajv2020({ allErrors: true, strict: true });
	addFormats(ajv);
	ajv.addSchema(stateSchema);
	const validateState = ajv.compile(stateSchema);
	const validateHistory = ajv.compile(historySchema);
	const supersessionErrors = [
		...supersededByErrors(state?.milestones, "PROJECT_STATE.yaml"),
		...supersededByErrors(history?.milestones, "PROJECT_STATE_HISTORY.yaml"),
	];
	if (supersessionErrors.length) fail(supersessionErrors.join("\n"));
	if (!validateState(state)) {
		fail(
			`PROJECT_STATE.yaml schema validation failed:\n${JSON.stringify(validateState.errors, null, 2)}`,
		);
	}
	if (!validateHistory(history)) {
		fail(
			`PROJECT_STATE_HISTORY.yaml schema validation failed:\n${JSON.stringify(validateHistory.errors, null, 2)}`,
		);
	}
	const trackedFiles = listTrackedFiles(root);
	const bomCheck = assertNoUnexpectedBom({
		repositoryRoot: root,
		trackedFiles,
	});
	const claudeAgentTable = assertClaudeAgentTable({
		repositoryRoot: root,
		trackedFiles,
	});
	console.log(
		`Tracked encoding and agent checks passed: ${bomCheck.checked} tracked files checked, ${bomCheck.allowed} allowed BOM(s), ${claudeAgentTable.rows} agent table rows, and ${claudeAgentTable.trackedDefinitions} tracked definitions.`,
	);
	await verifyGardenerRecord(state);
	if (state.gardener)
		console.log(
			`Gardener record passed: ${state.gardener.date} ${state.gardener.outcome} ${state.gardener.report}`,
		);
	assertProjectRecordUnion(state, history);
	const handoffRequiredStatuses = new Set([
		"READY",
		"IN_PROGRESS",
		"VALIDATING",
		"READY_FOR_INTEGRATION",
		"DONE",
		"BLOCKED",
		"NEEDS_HUMAN",
		"FAILED_VALIDATION",
	]);
	for (const [id, milestone] of Object.entries(state.milestones)) {
		if (!handoffRequiredStatuses.has(milestone.status)) continue;
		if (
			typeof milestone.handoff !== "string" ||
			milestone.handoff.trim().length === 0
		) {
			fail(`${id} is ${milestone.status} without a non-empty handoff path`);
		}
		await readBytes(milestone.handoff);
	}
	const resumePointCount = await validateActiveResumePoints({
		repositoryRoot: root,
		state,
	});
	console.log(
		`Resume point validation passed: ${resumePointCount} marked active handoff(s).`,
	);
	for (const relativePath of [
		state.baseline.visualManifest,
		state.baseline.validationRecord,
		state.baseline.independentVerification,
	]) {
		if (relativePath) await readBytes(relativePath);
	}

	const manifestPath = "visual-direction-gate/approved/APPROVAL_MANIFEST.yaml";
	const manifest = parseYaml((await readBytes(manifestPath)).toString("utf8"));
	if (manifest.schemaVersion !== 1 || manifest.status !== "APPROVED_BASELINE") {
		fail("Approval manifest schema/status is not the approved baseline");
	}
	await assertFileRecord(manifest.sourceSnapshot?.visualSystem, "visualSystem");
	await assertFileRecord(
		manifest.sourceSnapshot?.refinementHandoff,
		"refinementHandoff",
	);
	await assertFileRecord(
		manifest.sourceSnapshot?.prototypeStyleSource,
		"prototypeStyleSource",
	);
	await assertTreeRecord(manifest.sourceSnapshot?.prototype, "prototype");
	for (const [index, record] of (
		manifest.canonicalScreenshots ?? []
	).entries()) {
		await assertFileRecord(record, `canonicalScreenshots[${index}]`);
	}
	for (const [index, record] of (
		manifest.legacyArtifactHashes ?? []
	).entries()) {
		await assertFileRecord(record, `legacyArtifactHashes[${index}]`);
	}
	if (manifest.deferredPolish?.source !== "docs/POLISH_BACKLOG.md") {
		fail("Approval manifest must point to the durable polish backlog");
	}
	const backlog = (await readBytes(manifest.deferredPolish.source)).toString(
		"utf8",
	);
	for (const id of manifest.deferredPolish.items ?? []) {
		if (!backlog.includes(id)) fail(`Deferred polish item is missing: ${id}`);
	}

	for (const relativePath of [
		"AI_FRONTEND_DESIGN_WORKFLOW.md",
		"HANDOFF_CHATGPT_FITWAY_PHASE3_TO_VISUAL_DIRECTION_GATE.md",
		"SOL_SCAFFOLD_REVIEW.md",
		"phase-2-implementation-plan.md",
		"design-baseline",
		"tests/browser/vdg-b.browser.spec.ts",
		"visual-direction-gate/review/vdg-b-public",
		"visual-direction-gate/review",
		"visual-direction-gate/stitch",
		"visual-direction-gate/approved/full-product",
		"visual-direction-gate/approved/public-live-desktop",
	]) {
		await assertMissing(relativePath);
	}

	const routeAuthority = await verifyVisualAuthorityRepository(root);
	const agentContext = await checkAgentContext({ root });
	if (!agentContext.ok) {
		fail(
			`Agent context validation failed:\n${agentContext.errors.map((error) => `- ${error}`).join("\n")}`,
		);
	}
	for (const line of formatAgentContextWarnings(agentContext, {
		verbose: options.verbose === true,
		warningPrefix: "Agent context warning: ",
	})) {
		console.warn(line);
	}

	console.log(
		`Repository invariants passed: ${Object.keys(state.milestones).length} active milestones, ${Object.keys(history.milestones).length} archived milestones, ${(manifest.canonicalScreenshots ?? []).length} canonical approval screenshots, ${routeAuthority.caseCount} registered full-route visual-authority cases (${routeAuthority.acceptedCaseCount} accepted, ${routeAuthority.supersededCaseCount} superseded), ${routeAuthority.paperExportCount} hash-verified Paper exports, ${routeAuthority.rejectedArtifactCount} hash-frozen rejected r05 screenshots, and ${Object.keys(agentContext.registry?.routes ?? {}).length} agent-context routes.`,
	);
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const parsed = beginToolCommand("check:repository", process.argv.slice(2));
	main(repositoryOptions(parsed)).catch((error) => {
		console.error(`FAILED_VALIDATION: ${error.message}`);
		process.exitCode = 1;
	});
}
