import { execFileSync } from "node:child_process";
import { createHash as nodeCreateHash } from "node:crypto";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
	checkAgentContext,
	validateReceiptChain,
} from "./check-agent-context.mjs";
import {
	formatPacketAuthorities,
	readRepositoryYaml,
} from "./show-agent-context.mjs";

const REAL_ROOT = path.resolve(
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
	"docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md",
	"docs/agent-context/HISTORY_POINTER_EXCEPTIONS.yaml",
	"docs/schemas/agent-context-routes.schema.json",
	"docs/schemas/task-packet.schema.json",
	"docs/schemas/history-transition-receipt.schema.json",
];
const fixtureRoots: string[] = [];

type JsonObject = Record<string, unknown>;
type FixtureMilestone = JsonObject & {
	baseCommit: string;
	ownedPaths: string[];
	forbiddenPaths: string[];
	sharedLeases: string[];
	handoff: string;
};
type FixtureState = JsonObject & {
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

function writeFixtureFile(
	root: string,
	relativePath: string,
	contents: string,
): void {
	const target = path.resolve(root, relativePath);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, contents, "utf8");
}

function copyFixtureFile(root: string, relativePath: string): void {
	const source = path.resolve(REAL_ROOT, relativePath);
	const target = path.resolve(root, relativePath);
	mkdirSync(path.dirname(target), { recursive: true });
	copyFileSync(source, target);
}

function makeFixture(): string {
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
	copyFixtureFile(
		root,
		docsPath(
			"docs/phase-records/handoffs/coordinator/20260821-193000-p10_ui_csv_b06-done.md",
		),
	);
	return root;
}

function docsPath(value: string): string {
	return value;
}

function initTrackedFixture(root: string): void {
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

function replaceOnce(
	root: string,
	relativePath: string,
	before: string,
	after: string,
): void {
	const target = path.resolve(root, relativePath);
	const text = readFileSync(target, "utf8");
	expect(text).toContain(before);
	writeFileSync(target, text.replace(before, after), "utf8");
}

function basePacket(
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
	const milestoneId = "agent-context-architecture-migration-r01";
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

function isolateFixtureHistory(root: string): void {
	const historyPath = path.resolve(root, "PROJECT_STATE_HISTORY.yaml");
	const history = parseYaml(readFileSync(historyPath, "utf8")) as JsonObject;
	history.milestones = {};
	writeFileSync(historyPath, stringifyYaml(history), "utf8");
	writeFixtureFile(
		root,
		"docs/agent-context/HISTORY_POINTER_EXCEPTIONS.yaml",
		stringifyYaml({ schemaVersion: 1, exceptions: [] }),
	);
	copyFixtureFile(
		root,
		"docs/phase-records/handoffs/coordinator/20260919-135000-agent-context-architecture-migration-r01-m1-closure.md",
	);
}

function fixtureRoute(
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

function materializePacket(
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

function makeVisualPacket(root: string): {
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

afterEach(() => {
	for (const root of fixtureRoots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

describe("check-agent-context", () => {
	it("passes the current compatibility-mode registry and warns when the active packet is absent", async () => {
		const result = await checkAgentContext({
			root: REAL_ROOT,
			checkTracked: false,
		});
		expect(result.ok).toBe(true);
		expect(
			result.warnings.some((warning) =>
				warning.includes("no active task packet"),
			),
		).toBe(true);
	});

	it("fails a case-mismatched required source even in compatibility mode", async () => {
		const root = makeFixture();
		replaceOnce(
			root,
			"docs/agent-context/ROUTES.yaml",
			"FITWAY_PRODUCT.md",
			"fitway_product.md",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) => error.includes("case-mismatched path")),
		).toBe(true);
	});

	it("fails selector drift instead of broadening the route", async () => {
		const root = makeFixture();
		replaceOnce(
			root,
			"docs/agent-context/ROUTES.yaml",
			"Product and success truth",
			"Product and success truth drifted",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("missing Markdown heading selector"),
			),
		).toBe(true);
	});

	it("fails a required source that is present but untracked", async () => {
		const root = makeFixture();
		initTrackedFixture(root);
		execFileSync(
			"git",
			["rm", "--cached", "--quiet", "--", "docs/agent-context/README.md"],
			{ cwd: root, stdio: "ignore" },
		);
		const result = await checkAgentContext({ root, checkTracked: true });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) => error.includes("untracked") && error.includes("README.md"),
			),
		).toBe(true);
	});

	it("requires historical pointer exceptions to match the two known missing targets", async () => {
		const root = makeFixture();
		const exceptionsPath = path.resolve(
			root,
			"docs/agent-context/HISTORY_POINTER_EXCEPTIONS.yaml",
		);
		const exceptions = parseYaml(
			readFileSync(exceptionsPath, "utf8"),
		) as unknown as { schemaVersion: number; exceptions: Array<JsonObject> };
		exceptions.exceptions.shift();
		writeFileSync(exceptionsPath, stringifyYaml(exceptions), "utf8");
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("phase10-ui-csv/handoff") &&
					error.includes("no exception"),
			),
		).toBe(true);
	});

	it("validates route conditional paths and selectors without treating them as startup context", async () => {
		const root = makeFixture();
		replaceOnce(
			root,
			"docs/agent-context/ROUTES.yaml",
			"DESIGN.md",
			"PROJECT_STATE_HISTORY.yaml",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("conditional") &&
					error.includes(
						"historical/provenance source requires an explicit exception",
					),
			),
		).toBe(true);
	});

	it("rejects historical state from a normal-startup route", async () => {
		const root = makeFixture();
		replaceOnce(
			root,
			"docs/agent-context/ROUTES.yaml",
			"PROJECT_STATE.yaml",
			"PROJECT_STATE_HISTORY.yaml",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"normalStartup: historical/evidence path is not normal startup context",
				),
			),
		).toBe(true);
	});

	it("does not let a whole-file selector accept a directory", async () => {
		const root = makeFixture();
		mkdirSync(path.resolve(root, "packages"), { recursive: true });
		replaceOnce(
			root,
			"docs/agent-context/ROUTES.yaml",
			'- { path: AGENTS.md, selector: { kind: whole-file, value: "" }, reason: "Repository policy is automatic context." }',
			'- { path: packages, selector: { kind: whole-file, value: "" }, reason: "Directory must not satisfy a file selector." }',
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("selector whole-file cannot target directory packages"),
			),
		).toBe(true);
	});

	it("requires packet conditionals to exactly preserve registered trigger/source/action rules", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.authorities.conditional.pop();
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("packet conditionals omit registered rule"),
			),
		).toBe(true);
	});

	it("requires packet required authorities to match canonical paths and selectors", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.authorities.required[0].path = "SPEC.md";
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("required route authority is absent or mismatched"),
			),
		).toBe(true);
	});

	it("rejects an unauthorized extra historical packet authority", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.authorities.required.push({
			role: "historical",
			path: "docs/phase-records/phase-10-aggregate.md",
			selector: { kind: "markdown-heading", value: "Completed" },
			reason: "Unauthorized historical expansion.",
		});
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"supplemental historical authority must match an exact registered required or promoted key",
				),
			),
		).toBe(true);
	});

	it("rejects arbitrary historical supplements even when history is a registered role", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root, "analysis-review");
		packet.authorities.required.push({
			role: "historical",
			path: "docs/phase-records/phase-10-aggregate.md",
			selector: { kind: "markdown-heading", value: "Completed" },
			reason: "Unregistered historical expansion.",
		});
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"supplemental historical authority must match an exact registered required or promoted key",
				),
			),
		).toBe(true);
	});

	it("rejects supplemental authorities whose role is not registered by the route", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.authorities.required.push({
			role: "visual-status",
			path: "DESIGN.md",
			selector: { kind: "whole-file", value: "" },
			reason: "Unregistered role expansion.",
		});
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("required authority role is not registered"),
			),
		).toBe(true);
	});

	it("allows a focused supplemental source when its role is registered", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const { state, packet, packetPath } = basePacket(root);
		const focusedPath = "focused/DTO.test.ts";
		writeFixtureFile(root, focusedPath, "export const focused = true;\n");
		packet.authorities.required.push({
			role: "test",
			path: focusedPath,
			selector: { kind: "whole-file", value: "" },
			reason: "Focused evidence for the affected contract.",
		});
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);
	});

	it("requires every active milestone handoff to exist", async () => {
		const root = makeFixture();
		replaceOnce(
			root,
			"PROJECT_STATE.yaml",
			"docs/phase-records/handoffs/coordinator/20260919-135000-agent-context-architecture-migration-r01-m1-closure.md",
			"docs/phase-records/handoffs/coordinator/missing-active-handoff.md",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("active handoff: missing path"),
			),
		).toBe(true);
	});

	it("requires active handoff pointers to be tracked", async () => {
		const root = makeFixture();
		const untrackedPath =
			"docs/phase-records/handoffs/coordinator/untracked-active-handoff.md";
		replaceOnce(
			root,
			"PROJECT_STATE.yaml",
			"docs/phase-records/handoffs/coordinator/20260919-135000-agent-context-architecture-migration-r01-m1-closure.md",
			untrackedPath,
		);
		initTrackedFixture(root);
		writeFixtureFile(root, untrackedPath, "# Untracked handoff\n");
		const result = await checkAgentContext({ root, checkTracked: true });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("active handoff: untracked path"),
			),
		).toBe(true);
	});

	it("requires packet continuity to carry the exact active handoff", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.continuity.currentHandoff = null;
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("continuity.currentHandoff differs from active handoff"),
			),
		).toBe(true);
	});

	it("formats the packet's exact authority entries for context:show", () => {
		const lines: string[] = [];
		formatPacketAuthorities(lines, {
			authorities: {
				required: [
					{
						role: "contract",
						path: "docs/schemas/project-state.schema.json",
						selector: { kind: "json-pointer", value: "/properties/milestones" },
						reason: "Exact packet authority.",
					},
				],
				conditional: [
					{
						trigger: "a named condition",
						actionIfTriggered: "READ",
						role: "historical",
						path: "PROJECT_STATE_HISTORY.yaml",
						selector: { kind: "yaml-key", value: "milestones" },
					},
				],
			},
		});
		expect(lines.join("\n")).toContain(
			'docs/schemas/project-state.schema.json (json-pointer="/properties/milestones")',
		);
		expect(lines.join("\n")).toContain(
			"when a named condition: READ historical PROJECT_STATE_HISTORY.yaml",
		);
	});

	it("uses contained, case-sensitive file reads for context:show config", async () => {
		const root = mkdtempSync(path.join(tmpdir(), "fitway-context-show-"));
		fixtureRoots.push(root);
		writeFixtureFile(root, "ROUTES.yaml", "routes: {}\n");
		writeFixtureFile(root, "PROJECT_STATE.yaml", "milestones: {}\n");
		await expect(readRepositoryYaml(root, "ROUTES.yaml")).resolves.toEqual({
			routes: {},
		});
		await expect(
			readRepositoryYaml(root, "project_state.yaml"),
		).rejects.toThrow("case-mismatched path");
		mkdirSync(path.resolve(root, "config-directory"));
		await expect(readRepositoryYaml(root, "config-directory")).rejects.toThrow(
			"must target a file",
		);

		const outside = mkdtempSync(
			path.join(tmpdir(), "fitway-context-show-outside-"),
		);
		fixtureRoots.push(outside);
		writeFixtureFile(outside, "ROUTES.yaml", "routes: {}\n");
		try {
			symlinkSync(
				path.resolve(outside, "ROUTES.yaml"),
				path.resolve(root, "ROUTES-link.yaml"),
				"file",
			);
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				["EPERM", "EACCES", "EINVAL"].includes(String(error.code))
			)
				return;
			throw error;
		}
		await expect(readRepositoryYaml(root, "ROUTES-link.yaml")).rejects.toThrow(
			"path resolves outside the repository",
		);
	});

	it("validates packet conditional selectors and tracking", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.authorities.conditional[0].path = "DESIGN.md";
		packet.authorities.conditional[0].selector = {
			kind: "markdown-heading",
			value: "Missing conditional heading",
		};
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("authorities.conditional[0]") &&
					error.includes("missing Markdown heading selector"),
			),
		).toBe(true);
	});

	it("fails an untracked packet conditional source", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		initTrackedFixture(root);
		const untrackedPath = "docs/agent-context/untracked-conditional.md";
		writeFixtureFile(root, untrackedPath, "# Untracked conditional\n");
		packet.authorities.conditional[0].path = untrackedPath;
		materializePacket(root, state, packet, packetPath);
		execFileSync("git", ["add", "--", packetPath, "PROJECT_STATE.yaml"], {
			cwd: root,
			stdio: "ignore",
		});
		const result = await checkAgentContext({ root, checkTracked: true });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("authorities.conditional[0]") &&
					error.includes("untracked path"),
			),
		).toBe(true);
	});

	it("fails packet hash drift and an active milestone routed to a CLOSED packet", async () => {
		const root = makeFixture();
		const fixture = basePacket(root);
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		writeFileSync(
			path.resolve(root, fixture.packetPath),
			stringifyYaml({
				...fixture.packet,
				task: { ...fixture.packet.task, objective: "tampered" },
			}),
			"utf8",
		);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) => error.includes("taskPacketSha256 differs")),
		).toBe(true);

		const closedFixture = basePacket(root);
		closedFixture.packet.packetStatus = "CLOSED";
		materializePacket(
			root,
			closedFixture.state,
			closedFixture.packet,
			closedFixture.packetPath,
		);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("cannot route a CLOSED packet"),
			),
		).toBe(true);
	});

	it("requires ADR-009 for Owner visual packets and rejects superseded composition as acceptance authority", async () => {
		const root = makeFixture();
		const fixture = makeVisualPacket(root);
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("Owner visual-authority packet must cite ADR-009"),
			),
		).toBe(true);

		const ownerRoute = fixtureRoute(root, "visual-authority-change");
		const ownerConditional = ownerRoute.conditional.find((source) =>
			source.path.includes("ADR-009"),
		);
		expect(ownerConditional).toBeDefined();
		fixture.packet.authorities.required.push({
			role: ownerConditional?.role ?? "adr",
			path:
				ownerConditional?.path ??
				"docs/adr/ADR-009-owner-composition-authority-supersession.md",
			selector: { kind: "markdown-heading", value: "Wrong selector" },
			reason: "Owner redesign authority with selector drift.",
		});
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("Owner visual-authority packet must cite ADR-009"),
			),
		).toBe(true);
		fixture.packet.authorities.required.pop();
		fixture.packet.authorities.required.push({
			role: ownerConditional?.role ?? "adr",
			path:
				ownerConditional?.path ??
				"docs/adr/ADR-009-owner-composition-authority-supersession.md",
			selector: ownerConditional?.selector ?? {
				kind: "markdown-heading",
				value: "Decision",
			},
			reason: "Owner redesign authority.",
		});
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"superseded Owner composition cannot be acceptance authority",
				),
			),
		).toBe(true);
	});

	it("does not require Owner ADR-009 for a non-Owner visual-authority packet", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const fixture = makeVisualPacket(root);
		fixture.packet.visual = {
			...fixture.packet.visual,
			surfaceKey: "login",
			authorityStatus: "ACTIVE",
			authorityKey: "login",
			governingDecision: "docs/adr/ADR-007-paper-visual-source-of-truth.md",
		};
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.errors).toEqual([]);
	});

	it("rejects a tracked symlink or junction that resolves outside the repository", async () => {
		const root = makeFixture();
		const outside = mkdtempSync(
			path.join(tmpdir(), "fitway-agent-context-outside-"),
		);
		fixtureRoots.push(outside);
		writeFixtureFile(outside, "secret.md", "# Outside\n");
		try {
			symlinkSync(outside, path.resolve(root, "outside-link"), "junction");
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				["EPERM", "EACCES"].includes(String(error.code))
			) {
				return;
			}
			throw error;
		}
		replaceOnce(
			root,
			"docs/agent-context/ROUTES.yaml",
			"DESIGN.md",
			"outside-link/secret.md",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("resolves outside the repository"),
			),
		).toBe(true);
	});

	it("rejects an active handoff symlink that resolves outside the repository", async () => {
		const root = makeFixture();
		const outside = mkdtempSync(path.join(tmpdir(), "fitway-handoff-outside-"));
		fixtureRoots.push(outside);
		writeFixtureFile(outside, "handoff.md", "# Outside handoff\n");
		try {
			symlinkSync(outside, path.resolve(root, "handoff-link"), "junction");
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				["EPERM", "EACCES", "EINVAL"].includes(String(error.code))
			)
				return;
			throw error;
		}
		replaceOnce(
			root,
			"PROJECT_STATE.yaml",
			"docs/phase-records/handoffs/coordinator/20260919-135000-agent-context-architecture-migration-r01-m1-closure.md",
			"handoff-link/handoff.md",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("active handoff: path resolves outside the repository"),
			),
		).toBe(true);
	});

	it("checks child packet and receipt symlinks before reading or hashing", async () => {
		const root = makeFixture();
		const outside = mkdtempSync(
			path.join(tmpdir(), "fitway-discovered-outside-"),
		);
		fixtureRoots.push(outside);
		writeFixtureFile(outside, "packet.yaml", "schemaVersion: 1\n");
		writeFixtureFile(outside, "receipt.json", "{}\n");
		mkdirSync(path.resolve(root, "docs/phase-records/task-packets"), {
			recursive: true,
		});
		mkdirSync(path.resolve(root, "docs/phase-records/history-transitions"), {
			recursive: true,
		});
		try {
			symlinkSync(
				path.resolve(outside, "packet.yaml"),
				path.resolve(root, "docs/phase-records/task-packets/escape.yaml"),
				"file",
			);
			symlinkSync(
				path.resolve(outside, "receipt.json"),
				path.resolve(
					root,
					"docs/phase-records/history-transitions/escape.json",
				),
				"file",
			);
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				["EPERM", "EACCES", "EINVAL"].includes(String(error.code))
			)
				return;
			throw error;
		}
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("docs/phase-records/task-packets/escape.yaml") &&
					error.includes("resolves outside the repository"),
			),
		).toBe(true);
		expect(
			result.errors.some(
				(error) =>
					error.includes(
						"docs/phase-records/history-transitions/escape.json",
					) && error.includes("resolves outside the repository"),
			),
		).toBe(true);
	});

	it("fails active packet/state scope or class mismatch", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		state.milestones[packet.milestoneId].taskClass = "analysis-review";
		state.milestones[packet.milestoneId].taskPacket = packetPath;
		mkdirSync(path.dirname(path.resolve(root, packetPath)), {
			recursive: true,
		});
		writeFileSync(
			path.resolve(root, packetPath),
			stringifyYaml(packet),
			"utf8",
		);
		const packetBytes = readFileSync(path.resolve(root, packetPath));
		state.milestones[packet.milestoneId].taskPacketSha256 =
			hashBytes(packetBytes);
		writeFileSync(
			path.resolve(root, "PROJECT_STATE.yaml"),
			stringifyYaml(state),
			"utf8",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("taskClass differs from active milestone"),
			),
		).toBe(true);
	});

	it("rejects a UI packet without the required visual and design gates", async () => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.taskClass = "ui-maintenance";
		state.milestones[packet.milestoneId].taskClass = "ui-maintenance";
		state.milestones[packet.milestoneId].taskPacket = packetPath;
		mkdirSync(path.dirname(path.resolve(root, packetPath)), {
			recursive: true,
		});
		writeFileSync(
			path.resolve(root, packetPath),
			stringifyYaml(packet),
			"utf8",
		);
		const packetBytes = readFileSync(path.resolve(root, packetPath));
		state.milestones[packet.milestoneId].taskPacketSha256 =
			hashBytes(packetBytes);
		writeFileSync(
			path.resolve(root, "PROJECT_STATE.yaml"),
			stringifyYaml(state),
			"utf8",
		);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("task-packet.schema.json") || error.includes("visual"),
			),
		).toBe(true);
	});

	it("rejects a receipt chain that starts with a transition or is tampered", async () => {
		const root = makeFixture();
		const receiptPath =
			"docs/phase-records/history-transitions/20260919-transition.json";
		const receipt = {
			schemaVersion: 1,
			kind: "history-transition-receipt",
			recordedAt: "2026-09-19T10:00:00.000Z",
			previousReceiptSha256: null,
			beforeHistorySha256: "a".repeat(64),
			afterHistorySha256: "b".repeat(64),
			addedTerminal: {
				milestoneId: "closed",
				status: "DONE",
				digest: "c".repeat(64),
			},
			closedPacketSha256: "d".repeat(64),
			removedActiveMilestoneId: "active",
			coordinatorRun: "test-run",
		};
		writeFixtureFile(root, receiptPath, JSON.stringify(receipt, null, 2));
		const errors: string[] = [];
		await validateReceiptChain({ root, checkTracked: false, errors });
		expect(
			errors.some((error) =>
				error.includes("must begin with a genesis receipt"),
			),
		).toBe(true);
	});
});

function hashBytes(bytes: Uint8Array): string {
	return nodeCreateHash("sha256").update(bytes).digest("hex");
}
