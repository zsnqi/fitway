// Build disposable agent-context repositories, ledgers and packets for the check-agent-context tests.
import { execFileSync } from "node:child_process";
import { createHash as nodeCreateHash } from "node:crypto";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export const REAL_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const CONTEXT_FILES = [
	"AGENTS.md",
	"PROJECT_STATE.yaml",
	"PROJECT_STATE_HISTORY.yaml",
	"docs/agent-context/README.md",
	"docs/agent-context/ROUTES.yaml",
	"docs/agent-context/TASK_PACKET_TEMPLATE.yaml",
	"docs/schemas/agent-context-routes.schema.json",
	"docs/schemas/task-packet.schema.json",
];
export const FIXTURE_MILESTONES = [
	"agent-context-architecture-migration-r01",
] as const;
const FIXTURE_BASE_COMMIT = "19e28f4f0874d96569bc6944e38ad94b89924b60";
const FIXTURE_HANDOFF =
	"docs/phase-records/handoffs/coordinator/20260920-182500-agent-context-architecture-migration-r01-m8-closure.md";
export const HISTORICAL_FRONTIERS = ["79f3efd6", "446bb9fa"] as const;
export const fixtureRoots: string[] = [];

export type JsonObject = Record<string, unknown>;
type FixtureMilestone = JsonObject & {
	baseCommit: string;
	ownedPaths: string[];
	forbiddenPaths: string[];
	sharedLeases: string[];
	handoff: string;
};
export type FixtureState = JsonObject & {
	milestones: Record<string, FixtureMilestone>;
};
type RouteSource = {
	role: string;
	path: string;
	selector: JsonObject;
	reason: string;
};
type ConditionalSource = RouteSource & {
	trigger: string;
	actionIfTriggered: "READ" | "NEEDS_HUMAN";
};
type PacketConditional = Omit<ConditionalSource, "reason">;
type FixtureRegistry = {
	routes: Record<
		string,
		{
			required: RouteSource[];
			normalStartup: Array<{ path: string }>;
			conditional: ConditionalSource[];
		}
	>;
};
type FixturePacket = JsonObject & {
	milestoneId: string;
	taskClass: string;
	authorities: {
		required: RouteSource[];
		conditional: PacketConditional[];
	};
	verification: { orderedGates: string[] };
	designContextCheck?: { command: string; status: string };
	accessibilityGate?: { status: string; criteria: string };
	visual?: JsonObject;
};

export function writeFixtureFile(
	root: string,
	relativePath: string,
	contents: string,
): void {
	const target = path.resolve(root, relativePath);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, contents, "utf8");
}

export function copyFixtureFile(root: string, relativePath: string): void {
	const source = path.resolve(REAL_ROOT, relativePath);
	const target = path.resolve(root, relativePath);
	mkdirSync(path.dirname(target), { recursive: true });
	copyFileSync(source, target);
}

function committedPath(commit: string, relativePath: string): Buffer {
	return execFileSync("git", ["show", `${commit}:${relativePath}`], {
		cwd: REAL_ROOT,
	});
}

function writeCommittedPath(
	root: string,
	commit: string,
	relativePath: string,
): boolean {
	const normalized = relativePath.replaceAll("\\", "/");
	const target = path.resolve(root, normalized);
	const relative = path.relative(root, target);
	if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
	try {
		const bytes = committedPath(commit, normalized);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(target, bytes);
		return true;
	} catch (error) {
		if ((error as { status?: number }).status === 128) return false;
		throw error;
	}
}

export function materializeCommitFrontier(root: string, commit: string): void {
	for (const relativePath of [
		"PROJECT_STATE.yaml",
		"PROJECT_STATE_HISTORY.yaml",
	])
		writeCommittedPath(root, commit, relativePath);
	writeCommittedPath(root, commit, "docs/agent-context/ROUTES.yaml");

	const packetDirectory = "docs/phase-records/task-packets";
	rmSync(path.resolve(root, packetDirectory), {
		recursive: true,
		force: true,
	});
	const packetPaths = execFileSync(
		"git",
		["ls-tree", "-r", "--name-only", commit, "--", packetDirectory],
		{
			cwd: REAL_ROOT,
			encoding: "utf8",
		},
	)
		.trim()
		.split(/\r?\n/)
		.filter((entry) => entry.endsWith(".yaml"));
	for (const packetPath of packetPaths)
		writeCommittedPath(root, commit, packetPath);

	const state = parseYaml(
		readFileSync(path.resolve(root, "PROJECT_STATE.yaml"), "utf8"),
	) as FixtureState;
	const sourcePaths = new Set<string>();
	for (const milestone of Object.values(state.milestones)) {
		if (milestone.handoff) sourcePaths.add(milestone.handoff);
	}
	for (const packetPath of packetPaths) {
		const packet = parseYaml(
			readFileSync(path.resolve(root, packetPath), "utf8"),
		) as FixturePacket;
		if (packet.packetStatus === "CLOSED") continue;
		for (const authority of [
			...(packet.authorities?.required ?? []),
			...(packet.authorities?.conditional ?? []),
		]) {
			if (
				typeof authority.path === "string" &&
				!authority.path.includes("<") &&
				!authority.path.endsWith("/")
			)
				sourcePaths.add(authority.path);
		}
		const visual = packet.visual as
			| {
					explorationEnvelope?: { authorizingDecision?: unknown };
					currentFrames?: Array<{ path?: unknown }>;
					referenceFrames?: Array<{ path?: unknown }>;
			  }
			| undefined;
		if (typeof visual?.explorationEnvelope?.authorizingDecision === "string")
			sourcePaths.add(visual.explorationEnvelope.authorizingDecision);
		for (const frame of [
			...(visual?.currentFrames ?? []),
			...(visual?.referenceFrames ?? []),
		]) {
			if (typeof frame.path === "string") sourcePaths.add(frame.path);
		}
	}
	for (const sourcePath of sourcePaths)
		writeCommittedPath(root, commit, sourcePath);
}

export function packetFrontier(root: string): string[] {
	const packetDirectory = path.resolve(root, "docs/phase-records/task-packets");
	return readdirSync(packetDirectory)
		.filter((entry) => entry.endsWith(".yaml"))
		.map((entry) => {
			const packet = parseYaml(
				readFileSync(path.join(packetDirectory, entry), "utf8"),
			) as FixturePacket;
			return packet;
		})
		.filter((packet) => packet.packetStatus !== "CLOSED")
		.map((packet) => packet.milestoneId)
		.sort();
}

export function makeFixture(): string {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-agent-context-"));
	fixtureRoots.push(root);
	for (const relativePath of CONTEXT_FILES) copyFixtureFile(root, relativePath);
	const registry = parseYaml(
		readFileSync(
			path.resolve(REAL_ROOT, "docs/agent-context/ROUTES.yaml"),
			"utf8",
		),
	) as unknown as FixtureRegistry;
	for (const route of Object.values(registry.routes)) {
		for (const source of [
			...route.required,
			...route.normalStartup,
			...route.conditional,
		]) {
			if (source.path.includes("<") || source.path.endsWith("/")) continue;
			copyFixtureFile(root, source.path);
		}
	}
	// Route sources include PROJECT_STATE.yaml, so isolate after copying every authority.
	isolateFixtureMilestones(root, FIXTURE_MILESTONES);
	copyFixtureFile(
		root,
		docsPath(
			"docs/phase-records/handoffs/coordinator/20260821-193000-p10_ui_csv_b06-done.md",
		),
	);
	copyFixtureFile(root, activeHandoffPath());
	const f = basePacket(root);
	materializePacket(root, f.state, f.packet, f.packetPath);
	return root;
}

function fixtureMilestone(): FixtureMilestone {
	return JSON.parse(
		JSON.stringify({
			status: "IN_PROGRESS",
			objective: "Fixture milestone for the checker mechanics suite.",
			taskClass: "repository-infrastructure",
			taskPacket:
				"docs/phase-records/task-packets/agent-context-architecture-migration-r01.yaml",
			taskPacketSha256: "a".repeat(64),
			dependencies: [],
			ownerSession: "fixture-coordinator",
			branch: "fixture-branch",
			worktree: "C:/fixture/worktree",
			baseCommit: FIXTURE_BASE_COMMIT,
			ownedPaths: ["docs/agent-context/**", "scripts/check-agent-context*"],
			forbiddenPaths: ["apps/**", "packages/**"],
			sharedLeases: ["fixture-lease"],
			validationRepairAttempts: 0,
			lastHeartbeatAt: "2026-09-20T18:20:00+03:00",
			leaseExpiresAt: "2026-09-21T18:00:00+03:00",
			handoff: FIXTURE_HANDOFF,
			stopReason: null,
			gates: {
				unit: "PENDING",
				integration: "NOT_REQUIRED",
				browser: "NOT_REQUIRED",
				accessibility: "NOT_REQUIRED",
				visual: "NOT_REQUIRED",
				independentReview: "PENDING",
			},
			integratedCommit: null,
		}),
	) as FixtureMilestone;
}

function isolateFixtureMilestones(
	root: string,
	milestoneIds: readonly string[],
): void {
	const statePath = path.resolve(root, "PROJECT_STATE.yaml");
	const state = parseYaml(
		readFileSync(statePath, "utf8"),
	) as unknown as FixtureState;
	const milestones = Object.fromEntries(
		milestoneIds.map((milestoneId) => [milestoneId, fixtureMilestone()]),
	) as FixtureState["milestones"];
	state.milestones = milestones;
	writeFileSync(statePath, stringifyYaml(state), "utf8");
}

function docsPath(value: string): string {
	return value;
}

export function activeHandoffPath(): string {
	return FIXTURE_HANDOFF;
}

export function initTrackedFixture(root: string): void {
	execFileSync("git", ["init", "-q"], { cwd: root, stdio: "ignore" });
	execFileSync("git", ["config", "user.email", "test@example.invalid"], {
		cwd: root,
		stdio: "ignore",
	});
	execFileSync("git", ["config", "user.name", "FITWAY test"], {
		cwd: root,
		stdio: "ignore",
	});
	execFileSync("git", ["add", "--", "."], { cwd: root, stdio: "ignore" });
}

export function basePacket(
	root: string,
	taskClass = "repository-infrastructure",
): {
	state: FixtureState;
	packet: FixturePacket;
	packetPath: string;
} {
	const state = parseYaml(
		readFileSync(path.resolve(root, "PROJECT_STATE.yaml"), "utf8"),
	) as unknown as FixtureState;
	const milestoneId = FIXTURE_MILESTONES[0];
	const milestone = state.milestones[milestoneId];
	const registry = parseYaml(
		readFileSync(path.resolve(root, "docs/agent-context/ROUTES.yaml"), "utf8"),
	) as unknown as FixtureRegistry;
	const route = registry.routes[taskClass];
	const packetPath = `docs/phase-records/task-packets/${milestoneId}.yaml`;
	const packet = {
		schemaVersion: 1,
		milestoneId,
		taskClass,
		packetStatus: "READY",
		stateRef: `PROJECT_STATE.yaml#/milestones/${milestoneId}`,
		baseCommit: milestone.baseCommit,
		task: {
			objective: "Validate the context layer.",
			acceptanceCriteria: ["The focused checker passes."],
			explicitExclusions: ["Product behavior"],
		},
		scope: {
			ownedPaths: milestone.ownedPaths,
			forbiddenPaths: milestone.forbiddenPaths,
			sharedLeases: milestone.sharedLeases,
		},
		authorities: {
			required: route.required.map((source) => ({
				role: source.role,
				path: source.path,
				selector: source.selector,
				reason: source.reason,
			})),
			conditional: route.conditional.map((source) => ({
				trigger: source.trigger,
				role: source.role,
				path: source.path,
				selector: source.selector,
				actionIfTriggered: source.actionIfTriggered,
			})),
		},
		continuity: {
			predecessorMilestones: [],
			currentHandoff: milestone.handoff,
			unresolvedDecisions: [],
		},
		verification: {
			profile: "focused checker",
			orderedGates: ["unit"],
			independentReviewRequired: true,
		},
		evidence: {
			receiptTemplate: "docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md",
			requiredArtifacts: [],
		},
		limitations: ["No product semantics are changed."],
	};
	return { state, packet, packetPath };
}

export function isolateFixtureHistory(root: string): void {
	const historyPath = path.resolve(root, "PROJECT_STATE_HISTORY.yaml");
	const history = parseYaml(readFileSync(historyPath, "utf8")) as JsonObject;
	history.milestones = {};
	writeFileSync(historyPath, stringifyYaml(history), "utf8");
	copyFixtureFile(root, activeHandoffPath());
}

export function fixtureRoute(
	root: string,
	taskClass: string,
): {
	required: RouteSource[];
	conditional: ConditionalSource[];
} {
	const registry = parseYaml(
		readFileSync(path.resolve(root, "docs/agent-context/ROUTES.yaml"), "utf8"),
	) as unknown as FixtureRegistry;
	return registry.routes[taskClass];
}

export function materializePacket(
	root: string,
	state: FixtureState,
	packet: FixturePacket,
	packetPath: string,
	options: { recordHash?: boolean } = {},
): void {
	const milestone = state.milestones[packet.milestoneId];
	milestone.taskClass = packet.taskClass;
	milestone.taskPacket = packetPath;
	mkdirSync(path.dirname(path.resolve(root, packetPath)), {
		recursive: true,
	});
	writeFileSync(path.resolve(root, packetPath), stringifyYaml(packet), "utf8");
	if (options.recordHash !== false) {
		milestone.taskPacketSha256 = hashBytes(
			readFileSync(path.resolve(root, packetPath)),
		);
	}
	writeFileSync(
		path.resolve(root, "PROJECT_STATE.yaml"),
		stringifyYaml(state),
		"utf8",
	);
}

export function writeFixtureState(root: string, state: FixtureState): void {
	writeFileSync(
		path.resolve(root, "PROJECT_STATE.yaml"),
		stringifyYaml(state),
		"utf8",
	);
}

export function writeFixtureHistory(root: string, history: JsonObject): void {
	writeFileSync(
		path.resolve(root, "PROJECT_STATE_HISTORY.yaml"),
		stringifyYaml(history),
		"utf8",
	);
}

function terminalHistoryMilestone(
	root: string,
	fixture: {
		state: FixtureState;
		packet: FixturePacket;
		packetPath: string;
	},
	status = "DONE",
): JsonObject {
	const milestone = fixture.state.milestones[fixture.packet.milestoneId];
	return {
		status,
		dependencies: milestone.dependencies,
		ownerSession: milestone.ownerSession,
		branch: milestone.branch,
		worktree: milestone.worktree,
		baseCommit: milestone.baseCommit,
		ownedPaths: milestone.ownedPaths,
		forbiddenPaths: milestone.forbiddenPaths,
		sharedLeases: milestone.sharedLeases,
		validationRepairAttempts: milestone.validationRepairAttempts,
		handoff: milestone.handoff,
		stopReason: status === "DONE" ? null : "Fixture terminal stop.",
		gates: milestone.gates,
		integratedCommit: milestone.integratedCommit,
		taskClass: fixture.packet.taskClass,
		taskPacket: fixture.packetPath,
		taskPacketSha256: hashBytes(
			readFileSync(path.resolve(root, fixture.packetPath)),
		),
	};
}

export function materializeClosedPacketFixture(
	root: string,
	fixture: {
		state: FixtureState;
		packet: FixturePacket;
		packetPath: string;
	},
	status = "DONE",
): JsonObject {
	isolateFixtureHistory(root);
	fixture.packet.packetStatus = "CLOSED";
	materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
	const history = parseYaml(
		readFileSync(path.resolve(root, "PROJECT_STATE_HISTORY.yaml"), "utf8"),
	) as JsonObject;
	const historyMilestone = terminalHistoryMilestone(root, fixture, status);
	delete fixture.state.milestones[fixture.packet.milestoneId];
	history.milestones = {
		[fixture.packet.milestoneId]: historyMilestone,
	};
	writeFixtureState(root, fixture.state);
	writeFixtureHistory(root, history);
	return history;
}

export function makeVisualPacket(root: string): {
	state: FixtureState;
	packet: FixturePacket;
	packetPath: string;
} {
	const fixture = basePacket(root);
	const route = fixtureRoute(root, "visual-authority-change");
	const frameBytes = readFileSync(path.resolve(root, "DESIGN.md"));
	fixture.packet.taskClass = "visual-authority-change";
	fixture.packet.authorities.required = route.required.map((source) => ({
		role: source.role,
		path: source.path,
		selector: source.selector,
		reason: source.reason,
	}));
	fixture.packet.authorities.conditional = route.conditional.map((source) => ({
		trigger: source.trigger,
		role: source.role,
		path: source.path,
		selector: source.selector,
		actionIfTriggered: source.actionIfTriggered,
	}));
	fixture.packet.verification.orderedGates = [
		"accessibility",
		"perceptual",
		"promotion",
	];
	fixture.packet.designContextCheck = {
		command: "pnpm check:design-context",
		status: "PASS",
	};
	fixture.packet.accessibilityGate = {
		status: "PASS",
		criteria: "Keyboard and screen-reader checks pass.",
	};
	fixture.packet.visual = {
		surfaceKey: "owner-settings",
		authorityStatus: "SUPERSEDED",
		authorityKey: "owner-settings",
		governingDecision:
			"docs/adr/ADR-009-owner-composition-authority-supersession.md",
		currentFrames: [{ path: "DESIGN.md", sha256: hashBytes(frameBytes) }],
		referenceFrames: [{ path: "DESIGN.md", sha256: hashBytes(frameBytes) }],
		openHumanDecisions: [],
		paperAvailability: "NOT_APPLICABLE",
		perceptualGate: {
			status: "PASS",
			criteria: "Named perceptual review passed.",
		},
		promotionGate: {
			status: "PASS",
			criteria: "Promotion remains separately reviewed.",
		},
		acceptanceAuthority: "PAPER",
	};
	return fixture;
}

export function makeUiFamilyFixture(
	root: string,
	taskClass: "ui-maintenance" | "visual-authority-change",
	visualOverrides: JsonObject,
): {
	state: FixtureState;
	packet: FixturePacket;
	packetPath: string;
} {
	const fixture = basePacket(root, taskClass);
	const route = fixtureRoute(root, taskClass);
	const frameBytes = readFileSync(path.resolve(root, "DESIGN.md"));
	fixture.packet.taskClass = taskClass;
	fixture.packet.authorities.required = route.required.map((source) => ({
		role: source.role,
		path: source.path,
		selector: source.selector,
		reason: source.reason,
	}));
	fixture.packet.authorities.conditional = route.conditional.map((source) => ({
		trigger: source.trigger,
		role: source.role,
		path: source.path,
		selector: source.selector,
		actionIfTriggered: source.actionIfTriggered,
	}));
	fixture.packet.verification.orderedGates = [
		"accessibility",
		"perceptual",
		"promotion",
	];
	fixture.packet.designContextCheck = {
		command: "pnpm check:design-context",
		status: "PASS",
	};
	fixture.packet.accessibilityGate = {
		status: "PASS",
		criteria: "Keyboard and screen-reader checks pass.",
	};
	fixture.packet.visual = {
		surfaceKey: "public",
		authorityStatus: "ACTIVE",
		authorityKey: "public",
		governingDecision: "docs/adr/ADR-007-paper-visual-source-of-truth.md",
		currentFrames: [{ path: "DESIGN.md", sha256: hashBytes(frameBytes) }],
		referenceFrames: [{ path: "DESIGN.md", sha256: hashBytes(frameBytes) }],
		openHumanDecisions: [],
		paperAvailability: "UNAVAILABLE",
		perceptualGate: {
			status: "PASS",
			criteria: "Named perceptual review passed.",
		},
		promotionGate: {
			status: "NOT_REQUIRED",
			criteria: "No baseline promotion is authorized.",
		},
		acceptanceAuthority: "PAPER",
		...visualOverrides,
	};
	return fixture;
}

export function explorationEnvelopeFixture(
	authorizingDecision: string,
): JsonObject {
	return {
		mode: "EXPLORATION",
		lockedAxes: ["FITWAY identity and the accessibility baseline stay locked."],
		variableAxes: ["Atmosphere, material, and composition may vary."],
		requiredDepartures: [
			"At least one alternative departs the incumbent atmosphere.",
		],
		antiRuts: ["The incumbent near-black and oxblood atmosphere."],
		promotionRule:
			"A separate explicit human baseline decision promotes any departure.",
		authorizingDecision,
	};
}

export function removeFixtureRoots(): void {
	for (const root of fixtureRoots.splice(0))
		rmSync(root, { recursive: true, force: true });
}

export function hashBytes(bytes: Uint8Array): string {
	return nodeCreateHash("sha256").update(bytes).digest("hex");
}
