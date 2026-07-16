import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";

const root = process.cwd();

function fail(message) {
	throw new Error(message);
}

function resolveRepositoryPath(relativePath) {
	const absolute = path.resolve(root, relativePath);
	const relative = path.relative(root, absolute);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		fail(`Path escapes the repository: ${relativePath}`);
	}
	return absolute;
}

async function readBytes(relativePath) {
	return readFile(resolveRepositoryPath(relativePath));
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

async function assertFileRecord(record, label) {
	if (!record?.path || !Number.isInteger(record.bytes) || !record.sha256) {
		fail(`${label} is missing path, bytes, or sha256`);
	}
	const bytes = await readBytes(record.path);
	if (bytes.byteLength !== record.bytes) {
		fail(`${label} byte count changed: ${record.path}`);
	}
	if (sha256(bytes) !== record.sha256) {
		fail(`${label} SHA-256 changed: ${record.path}`);
	}
}

async function walkFiles(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory())
			files.push(...(await walkFiles(absolute, relative)));
		else if (entry.isFile()) files.push({ absolute, relative });
		else fail(`Approval tree contains a non-file entry: ${relative}`);
	}
	return files;
}

async function assertTreeRecord(record, label) {
	if (
		!record?.path ||
		!Number.isInteger(record.fileCount) ||
		!record.treeSha256
	) {
		fail(`${label} is missing path, fileCount, or treeSha256`);
	}
	const directory = resolveRepositoryPath(record.path);
	if (!(await stat(directory)).isDirectory())
		fail(`${label} is not a directory`);
	const files = (await walkFiles(directory)).sort((a, b) =>
		a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0,
	);
	if (files.length !== record.fileCount) {
		fail(`${label} file count changed: ${record.path}`);
	}
	const tree = createHash("sha256");
	for (const file of files) {
		tree.update(
			`${sha256(await readFile(file.absolute))}  ${file.relative}\n`,
			"utf8",
		);
	}
	if (tree.digest("hex") !== record.treeSha256) {
		fail(`${label} tree SHA-256 changed: ${record.path}`);
	}
}

function assertAcyclicMilestones(milestones) {
	const visited = new Set();
	const active = new Set();
	function visit(id) {
		if (active.has(id)) fail(`Milestone dependency cycle includes ${id}`);
		if (visited.has(id)) return;
		const milestone = milestones[id];
		if (!milestone) fail(`Milestone dependency does not exist: ${id}`);
		active.add(id);
		for (const dependency of milestone.dependencies) visit(dependency);
		active.delete(id);
		visited.add(id);
	}
	for (const id of Object.keys(milestones)) visit(id);
}

function assertProjectStateInvariants(state) {
	const baselineMilestone = state.milestones["baseline-reconciliation-gate"];
	if (!baselineMilestone) {
		fail("PROJECT_STATE.yaml is missing baseline-reconciliation-gate");
	}
	if (state.baseline.status !== baselineMilestone.status) {
		fail(
			"Top-level baseline status must match baseline-reconciliation-gate status",
		);
	}
	if (state.baseline.integratedCommit !== baselineMilestone.integratedCommit) {
		fail(
			"Top-level baseline commit must match baseline-reconciliation-gate commit",
		);
	}

	const dependencyReadyStatuses = new Set([
		"READY",
		"IN_PROGRESS",
		"VALIDATING",
		"READY_FOR_INTEGRATION",
		"DONE",
	]);
	const stoppedStatuses = new Set([
		"BLOCKED",
		"NEEDS_HUMAN",
		"FAILED_VALIDATION",
	]);
	const activeWorkerStatuses = new Set([
		"READY",
		"IN_PROGRESS",
		"VALIDATING",
		"READY_FOR_INTEGRATION",
	]);
	if (
		state.baseline.integratedCommit === "SELF" &&
		Object.entries(state.milestones).some(
			([id, milestone]) =>
				id !== "baseline-reconciliation-gate" &&
				activeWorkerStatuses.has(milestone.status),
		)
	) {
		fail(
			"The baseline commit cannot remain SELF after a worker slice is activated",
		);
	}
	const assignedBranches = new Map();
	const assignedWorktrees = new Map();
	const assignedLeases = new Map();
	for (const [id, milestone] of Object.entries(state.milestones)) {
		if (stoppedStatuses.has(milestone.status)) {
			if (!milestone.stopReason?.trim()) {
				fail(`${id} is ${milestone.status} without an explicit stop reason`);
			}
		} else if (milestone.stopReason !== null) {
			fail(`${id} is ${milestone.status} with a stale stop reason`);
		}
		if (dependencyReadyStatuses.has(milestone.status)) {
			for (const dependency of milestone.dependencies) {
				if (state.milestones[dependency].status !== "DONE") {
					fail(
						`${id} cannot be ${milestone.status} while ${dependency} is not DONE`,
					);
				}
			}
		}
		if (activeWorkerStatuses.has(milestone.status)) {
			for (const field of [
				"ownerSession",
				"branch",
				"worktree",
				"baseCommit",
				"lastHeartbeatAt",
				"leaseExpiresAt",
				"handoff",
			]) {
				if (!milestone[field]) {
					fail(`${id} is ${milestone.status} without ${field}`);
				}
			}
			if (milestone.ownedPaths.length === 0) {
				fail(`${id} is ${milestone.status} without owned paths`);
			}
			if (new Date(milestone.leaseExpiresAt) <= new Date()) {
				fail(`${id} has an expired lease at the current wall-clock time`);
			}
			for (const [value, assignments, label] of [
				[milestone.branch, assignedBranches, "branch"],
				[milestone.worktree, assignedWorktrees, "worktree"],
			]) {
				const assigned = assignments.get(value);
				if (assigned) fail(`${id} and ${assigned} share the same ${label}`);
				assignments.set(value, id);
			}
			for (const lease of milestone.sharedLeases) {
				const assigned = assignedLeases.get(lease);
				if (assigned) fail(`${id} and ${assigned} share lease ${lease}`);
				assignedLeases.set(lease, id);
			}
		}
		if (milestone.status !== "DONE") continue;
		if (!milestone.integratedCommit) {
			fail(`${id} is DONE without an integrated commit`);
		}
		for (const [gate, result] of Object.entries(milestone.gates)) {
			if (result !== "PASS" && result !== "NOT_REQUIRED") {
				fail(`${id} is DONE while ${gate} is ${result}`);
			}
		}
	}
	if (
		state.baseline.status === "DONE" &&
		(!state.baseline.validationRecord ||
			!state.baseline.independentVerification)
	) {
		fail(
			"A DONE baseline requires validation and independent-verification records",
		);
	}
	if (baselineMilestone.status === "DONE") {
		for (const [gate, result] of Object.entries(baselineMilestone.gates)) {
			if (result !== "PASS") {
				fail(`baseline-reconciliation-gate requires ${gate}=PASS when DONE`);
			}
		}
	}
}

async function assertMissing(relativePath) {
	try {
		await stat(resolveRepositoryPath(relativePath));
		fail(`Superseded/generated active artifact still exists: ${relativePath}`);
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
}

async function main() {
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
		"docs/WORKFLOW.md",
		"docs/POLISH_BACKLOG.md",
		"docs/schemas/project-state.schema.json",
		"visual-direction-gate/approved/APPROVAL_MANIFEST.yaml",
	];
	for (const relativePath of required) await readBytes(relativePath);

	const state = parseYaml(
		(await readBytes("PROJECT_STATE.yaml")).toString("utf8"),
	);
	const stateSchema = JSON.parse(
		(await readBytes("docs/schemas/project-state.schema.json")).toString(
			"utf8",
		),
	);
	const ajv = new Ajv2020({ allErrors: true, strict: true });
	addFormats(ajv);
	const validate = ajv.compile(stateSchema);
	if (!validate(state)) {
		fail(
			`PROJECT_STATE.yaml schema validation failed:\n${JSON.stringify(validate.errors, null, 2)}`,
		);
	}
	assertAcyclicMilestones(state.milestones);
	assertProjectStateInvariants(state);
	for (const milestone of Object.values(state.milestones)) {
		if (
			new Set([
				"READY",
				"IN_PROGRESS",
				"VALIDATING",
				"READY_FOR_INTEGRATION",
			]).has(milestone.status)
		) {
			await readBytes(milestone.handoff);
		}
	}
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

	console.log(
		`Repository invariants passed: ${Object.keys(state.milestones).length} milestones, ${(manifest.canonicalScreenshots ?? []).length} canonical approval screenshots.`,
	);
}

main().catch((error) => {
	console.error(`FAILED_VALIDATION: ${error.message}`);
	process.exitCode = 1;
});
