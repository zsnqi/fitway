// Project-state ownership, dependency, and glob invariants.

import path from "node:path";
import { TERMINAL_STATUSES } from "./agent-context-rules.mjs";
import { dateValue } from "./agent-environment/code-health-ratchet.mjs";
import { fail } from "./repository-files.mjs";

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

function supersededByErrors(milestones, label = "", checkTargets = false) {
	const errors = [];
	for (const [id, record] of Object.entries(milestones ?? {})) {
		const prefix = label ? `${label}: ${id}` : id;
		if (record?.status === "SUPERSEDED") {
			if (
				typeof record.supersededBy !== "string" ||
				!record.supersededBy.trim() ||
				(checkTargets &&
					(record.supersededBy === id ||
						!Object.hasOwn(milestones, record.supersededBy)))
			)
				errors.push(
					`${prefix}: ${
						checkTargets
							? "supersededBy must name a different existing milestone"
							: "SUPERSEDED requires non-empty supersededBy"
					}`,
				);
		} else if (record && Object.hasOwn(record, "supersededBy")) {
			errors.push(`${prefix}: only SUPERSEDED records may carry supersededBy`);
		}
	}
	return errors;
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
			.filter(
				(token) =>
					// Slashed words and bare versions are prose. Extensionless paths
					// can use explicit syntax such as ./future/my or future/my/.
					!(
						/^[\p{L}]+(?:\/[\p{L}]+)+$/u.test(token) ||
						/^v?\d+(?:\.\d+)+(?:[-+][\w.-]+)?$/i.test(token)
					) &&
					(token.includes("/") || /\.[\w-]+$/.test(token)),
			)
			.map((token) =>
				path.posix.normalize(token.endsWith("/") ? `${token}**` : token),
			);
		if (!patterns.length)
			fail(`${label}: no repository path in entry ${JSON.stringify(entry)}`);
		return patterns;
	});
}

function invalidLeaseEnd(id, entry) {
	fail(
		`${id} sharedLeases entry ${JSON.stringify(entry)} has an invalid end; write one end as through YYYY-MM-DD`,
	);
}

function leaseEnd(id, entry) {
	const through = [...entry.matchAll(/\bthrough\b/gi)];
	if (through.length > 1) invalidLeaseEnd(id, entry);
	// Every token shaped like a date (four digits, one separator, month and day)
	// is judged whole: exactly YYYY-MM-DD, real, alone, after a permitted word.
	for (const date of entry.matchAll(/\d{4}([-/.])\d{1,2}\1\d{1,2}/g)) {
		const prefix = entry.slice(0, date.index);
		const suffix = entry.slice(date.index + date[0].length);
		if (
			!/(?:\bthrough\s+|\bfrom\s+|\brenewed\s+on\s+)$/i.test(prefix) ||
			!/^\d{4}-\d{2}-\d{2}$/.test(date[0]) ||
			!/^(?:$|[\s,;)]|[.:](?:\s|$))/.test(suffix) ||
			!Number.isFinite(dateValue(date[0]))
		)
			invalidLeaseEnd(id, entry);
	}
	if (!through.length) return null;
	const rest = entry.slice(through[0].index + through[0][0].length);
	const end = /^\s+(\d{4}-\d{2}-\d{2})(?=$|[\s,.;:)])/.exec(rest)?.[1];
	if (!end || !Number.isFinite(dateValue(end))) invalidLeaseEnd(id, entry);
	return end;
}

function assertSharedLeaseEnds(milestones, updatedAt) {
	const updatedDate = updatedAt.slice(0, 10);
	if (!Number.isFinite(dateValue(updatedDate)))
		fail(
			`PROJECT_STATE.yaml updatedAt has no valid calendar date: ${updatedAt}`,
		);
	for (const [id, milestone] of Object.entries(milestones)) {
		if (TERMINAL_STATUSES.has(milestone.status)) continue;
		for (const entry of milestone.sharedLeases ?? []) {
			const end = leaseEnd(id, entry);
			if (end && end < updatedDate)
				fail(
					`${id} sharedLeases entry ${JSON.stringify(entry)} ended ${end}, before PROJECT_STATE.yaml updatedAt ${updatedAt}; renew it with a later through YYYY-MM-DD date or drop it`,
				);
		}
	}
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
	const supersessionErrors = supersededByErrors(milestones, "", true);
	if (supersessionErrors.length) fail(supersessionErrors.join("\n"));
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
	assertSharedLeaseEnds(state.milestones, state.updatedAt);
	assertDisjointOwnedPaths(state.milestones);
	assertDoneBaselineRecords(state, baselineMilestone);
}

function assertDoneBaselineRecords(state, baselineMilestone) {
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

export { supersededByErrors };
