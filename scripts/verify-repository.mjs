import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";
import { validateActiveResumePoints } from "./agent-environment/resume-point.mjs";
import {
	checkAgentContext,
	formatAgentContextWarnings,
	TERMINAL_STATUSES,
} from "./check-agent-context.mjs";
import { verifyVisualAuthorityRepository } from "./visual-authority.mjs";

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

export function assertProjectRecordUnion(state, history) {
	for (const [id, milestone] of Object.entries(history.milestones)) {
		if (Object.hasOwn(state.milestones, id)) {
			fail(
				`Milestone ${id} is duplicated in PROJECT_STATE.yaml and PROJECT_STATE_HISTORY.yaml`,
			);
		}
		if (!TERMINAL_STATUSES.has(milestone.status)) {
			fail(
				`PROJECT_STATE_HISTORY.yaml must contain only terminal milestone records: ${id} is ${milestone.status}`,
			);
		}
	}
	const milestones = { ...history.milestones, ...state.milestones };
	assertAcyclicMilestones(milestones);
	assertProjectStateInvariants(state, milestones);
	return milestones;
}

function assertSupersededByFields(records, label) {
	for (const [id, record] of Object.entries(records?.milestones ?? {})) {
		if (record?.status === "SUPERSEDED") {
			if (
				typeof record.supersededBy !== "string" ||
				!record.supersededBy.trim()
			)
				fail(`${label}: ${id}: SUPERSEDED requires non-empty supersededBy`);
		} else if (record && Object.hasOwn(record, "supersededBy")) {
			fail(`${label}: ${id}: only SUPERSEDED records may carry supersededBy`);
		}
	}
}

// Before ': ', only tokens containing a path or filename claim ownership.
// A trailing slash explicitly claims the folder's entire subtree.
export function scopePatterns(entries, label = "scope") {
	return entries.flatMap((entry) => {
		const patterns = entry
			.split(": ")[0]
			.split(/\s+/)
			.map((token) =>
				token.replace(/^[('"`]+|[.,;:)'"`]+$/g, "").replaceAll("\\", "/"),
			)
			.filter((token) => token.includes("/") || /\.[\w-]+$/.test(token))
			.map((token) =>
				path.posix.normalize(token.endsWith("/") ? `${token}**` : token),
			);
		if (!patterns.length)
			fail(`${label}: no repository path in entry ${JSON.stringify(entry)}`);
		return patterns;
	});
}

const NON_SLASH = [
	[32, 46],
	[48, 0x10ffff],
];
const ANY_CHARACTER = [[32, 0x10ffff]];

// Compile globs to an epsilon NFA. Intersecting these languages finds future
// collisions too, without depending on which files happen to exist today.
function globMachine(pattern) {
	const states = [{ epsilon: [], edges: [] }];
	const state = () => {
		states.push({ epsilon: [], edges: [] });
		return states.length - 1;
	};
	const edge = (from, to, ranges) => states[from].edges.push({ to, ranges });
	function compile(text, start) {
		let current = start;
		for (let index = 0; index < text.length; index += 1) {
			const character = text[index];
			const next = state();
			if (character === "{") {
				let depth = 1;
				let end = index + 1;
				for (; end < text.length && depth; end += 1) {
					if (text[end] === "{") depth += 1;
					if (text[end] === "}") depth -= 1;
				}
				if (depth) fail(`Invalid owned-path glob: ${pattern}`);
				const alternatives = [];
				let part = "";
				depth = 0;
				for (const item of text.slice(index + 1, end - 1)) {
					if (item === "," && depth === 0) {
						alternatives.push(part);
						part = "";
					} else {
						part += item;
						if (item === "{") depth += 1;
						if (item === "}") depth -= 1;
					}
				}
				alternatives.push(part);
				for (const alternative of alternatives) {
					const branch = state();
					states[current].epsilon.push(branch);
					states[compile(alternative, branch)].epsilon.push(next);
				}
				index = end - 1;
			} else if (character === "*") {
				const globstar = text[index + 1] === "*";
				if (globstar) index += 1;
				states[current].epsilon.push(next);
				if (globstar && text[index + 1] === "/") {
					// '**/' may consume no directories or any prefix ending in '/'.
					const loop = state();
					edge(current, loop, ANY_CHARACTER);
					edge(loop, loop, ANY_CHARACTER);
					edge(loop, next, [[47, 47]]);
					edge(current, next, [[47, 47]]);
					index += 1;
				} else edge(current, current, globstar ? ANY_CHARACTER : NON_SLASH);
			} else if (character === "?") edge(current, next, NON_SLASH);
			else if (character === "[") {
				const end = text.indexOf("]", index + 1);
				if (end === -1) fail(`Invalid owned-path glob: ${pattern}`);
				let content = text.slice(index + 1, end);
				const negate = /^[!^]/.test(content);
				if (negate) content = content.slice(1);
				let ranges = [];
				for (let offset = 0; offset < content.length; offset += 1) {
					const first = content.codePointAt(offset);
					if (content[offset + 1] === "-" && content[offset + 2]) {
						ranges.push([first, content.codePointAt(offset + 2)]);
						offset += 2;
					} else ranges.push([first, first]);
				}
				if (negate) {
					const excluded = ranges;
					ranges = NON_SLASH.flatMap(([low, high]) => {
						let remaining = [[low, high]];
						for (const [a, b] of excluded)
							remaining = remaining.flatMap(([c, d]) =>
								a > d || b < c
									? [[c, d]]
									: [
											[c, a - 1],
											[b + 1, d],
										].filter(([e, f]) => e <= f),
							);
						return remaining;
					});
				}
				edge(current, next, ranges);
				index = end;
			} else
				edge(current, next, [
					[character.codePointAt(0), character.codePointAt(0)],
				]);
			current = next;
		}
		return current;
	}
	const accept = compile(pattern, 0);
	function closure(input) {
		const result = new Set(input);
		for (const item of result)
			for (const next of states[item].epsilon) result.add(next);
		return [...result].sort((a, b) => a - b);
	}
	return {
		initial: closure([0]),
		accepts: (input) => input.includes(accept),
		edges: (input) => input.flatMap((item) => states[item].edges),
		step: (input, code) =>
			closure(
				input.flatMap((item) =>
					states[item].edges
						.filter(({ ranges }) =>
							ranges.some(([low, high]) => code >= low && code <= high),
						)
						.map(({ to }) => to),
				),
			),
	};
}

function unleasedIntersection(left, right, leases) {
	const machines = [
		globMachine(left),
		globMachine(right),
		...leases.map(globMachine),
	];
	const queue = [
		{
			positions: machines.map((machine) => machine.initial),
			witness: "",
			slash: true,
		},
	];
	const seen = new Set();
	for (let index = 0; index < queue.length; index += 1) {
		const { positions, witness, slash } = queue[index];
		const key = `${JSON.stringify(positions)}:${slash}`;
		if (seen.has(key)) continue;
		seen.add(key);
		if (
			witness &&
			!slash &&
			machines[0].accepts(positions[0]) &&
			machines[1].accepts(positions[1]) &&
			!machines
				.slice(2)
				.some((machine, offset) => machine.accepts(positions[offset + 2]))
		)
			return witness;
		// Partition the alphabet at every transition boundary. One character in
		// each interval is enough to explore every possible product transition.
		const boundaries = new Set([47, 48, 97, 98]);
		for (const [offset, machine] of machines.entries())
			for (const { ranges } of machine.edges(positions[offset]))
				for (const [low, high] of ranges) {
					boundaries.add(low);
					boundaries.add(high + 1);
				}
		const alphabet = [...boundaries].sort((a, b) => a - b);
		for (const code of alphabet.slice(0, -1)) {
			if (code === 47 && slash) continue;
			const next = machines.map((machine, offset) =>
				machine.step(positions[offset], code),
			);
			if (next[0].length && next[1].length)
				queue.push({
					positions: next,
					witness: witness + String.fromCodePoint(code),
					slash: code === 47,
				});
		}
	}
	return null;
}

function assertDisjointOwnedPaths(milestones) {
	const open = Object.entries(milestones)
		.filter(([, record]) => !TERMINAL_STATUSES.has(record.status))
		.map(([id, record]) => [
			id,
			{
				ownedPaths: scopePatterns(record.ownedPaths ?? [], `${id} ownedPaths`),
				sharedLeases: scopePatterns(
					record.sharedLeases ?? [],
					`${id} sharedLeases`,
				),
			},
		]);
	for (let first = 0; first < open.length; first += 1) {
		const [leftId, left] = open[first];
		for (const [rightId, right] of open.slice(first + 1)) {
			for (const a of left.sharedLeases)
				for (const b of right.sharedLeases) {
					const witness = unleasedIntersection(a, b, []);
					if (witness)
						fail(
							`${leftId} and ${rightId} have overlapping sharedLeases at ${witness} (${a}, ${b}); a lease must have one holder`,
						);
				}
			const leases = [...left.sharedLeases, ...right.sharedLeases];
			for (const a of left.ownedPaths)
				for (const b of right.ownedPaths) {
					const witness = unleasedIntersection(a, b, leases);
					if (witness)
						fail(
							`${leftId} and ${rightId} have overlapping ownedPaths at ${witness} (${a}, ${b}); a sharedLeases entry must name the shared path`,
						);
				}
		}
	}
}

export function assertProjectStateInvariants(state, milestones) {
	const baselineMilestone = milestones["baseline-reconciliation-gate"];
	if (!baselineMilestone) {
		fail(
			"Active and history milestone records are missing baseline-reconciliation-gate",
		);
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
		"SUPERSEDED",
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
	for (const [id, milestone] of Object.entries(milestones)) {
		if (milestone.status === "SUPERSEDED") {
			if (
				typeof milestone.supersededBy !== "string" ||
				milestone.supersededBy === id ||
				!Object.hasOwn(milestones, milestone.supersededBy)
			)
				fail(`${id}: supersededBy must name a different existing milestone`);
		} else if (Object.hasOwn(milestone, "supersededBy")) {
			fail(`${id}: only SUPERSEDED records may carry supersededBy`);
		}
		if (stoppedStatuses.has(milestone.status)) {
			if (!milestone.stopReason?.trim()) {
				fail(`${id} is ${milestone.status} without an explicit stop reason`);
			}
		} else if (milestone.stopReason !== null) {
			fail(`${id} is ${milestone.status} with a stale stop reason`);
		}
		if (dependencyReadyStatuses.has(milestone.status)) {
			for (const dependency of milestone.dependencies) {
				if (milestones[dependency].status !== "DONE") {
					fail(
						`${id} cannot be ${milestone.status} while ${dependency} is not DONE`,
					);
				}
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
	for (const [id, milestone] of Object.entries(state.milestones)) {
		if (activeWorkerStatuses.has(milestone.status)) {
			for (const field of [
				"ownerSession",
				"branch",
				"worktree",
				"baseCommit",
				"handoff",
			]) {
				if (!milestone[field]) {
					fail(`${id} is ${milestone.status} without ${field}`);
				}
			}
			if (milestone.ownedPaths.length === 0) {
				fail(`${id} is ${milestone.status} without owned paths`);
			}
			for (const [value, assignments, label] of [
				[milestone.branch, assignedBranches, "branch"],
				[milestone.worktree, assignedWorktrees, "worktree"],
			]) {
				const assigned = assignments.get(value);
				if (assigned) fail(`${id} and ${assigned} share the same ${label}`);
				assignments.set(value, id);
			}
		}
	}
	assertDisjointOwnedPaths(state.milestones);
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
	assertSupersededByFields(state, "PROJECT_STATE.yaml");
	assertSupersededByFields(history, "PROJECT_STATE_HISTORY.yaml");
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
		verbose: process.argv.slice(2).includes("--verbose"),
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
	main().catch((error) => {
		console.error(`FAILED_VALIDATION: ${error.message}`);
		process.exitCode = 1;
	});
}
