import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile as readFileAsync } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { stringify as stringifyYaml } from "yaml";
import { inspectPath } from "./check-agent-context.mjs";
import { buildAgentContextPlan } from "./show-agent-context.mjs";

type PacketScope = {
	ownedPaths: string[];
	forbiddenPaths: string[];
	sharedLeases: string[];
};

type Packet = {
	schemaVersion: number;
	milestoneId: string;
	taskClass: string;
	packetStatus: string;
	stateRef: string;
	baseCommit: string;
	scope: PacketScope;
	authorities: { required: unknown[]; conditional: unknown[] };
	continuity: {
		predecessorMilestones: string[];
		currentHandoff: string | null;
		unresolvedDecisions: string[];
	};
	[key: string]: unknown;
};

type Milestone = {
	status: string;
	taskClass?: string;
	taskPacket?: string;
	taskPacketSha256?: string;
	baseCommit: string;
	ownedPaths: string[];
	forbiddenPaths: string[];
	sharedLeases: string[];
	handoff: string | null;
	[key: string]: unknown;
};

type PacketMetadataField = "taskClass" | "taskPacket" | "taskPacketSha256";

type FixtureOptions = {
	milestoneStatus?: string;
	packetStatus?: string;
	metadataFields?: PacketMetadataField[];
	registryMode?: string;
	editPacket?: (packet: Packet) => void;
	editMilestone?: (milestone: Milestone) => void;
	omitPacket?: boolean;
};

const MILESTONE_ID = "agent-context-pilot-backend-operational-snapshot-r01";
const PACKET_PATH = `docs/phase-records/task-packets/${MILESTONE_ID}.yaml`;
const ROUTES_PATH = "docs/agent-context/ROUTES.yaml";
const PROJECT_STATE_PATH = "PROJECT_STATE.yaml";
const HANDOFF_PATH =
	"docs/phase-records/handoffs/coordinator/agent-context-pilot-kickoff.md";
const SHOW_SCRIPT_PATH = fileURLToPath(
	new URL("./show-agent-context.mjs", import.meta.url),
);
const PACKET_METADATA_FIELDS: PacketMetadataField[] = [
	"taskClass",
	"taskPacket",
	"taskPacketSha256",
];
const fixtureRoots: string[] = [];

afterEach(() => {
	for (const root of fixtureRoots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function sha256(bytes: Buffer) {
	return createHash("sha256").update(bytes).digest("hex");
}

function createFixture(options: FixtureOptions = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-context-show-test-"));
	fixtureRoots.push(root);
	const ownedPaths = ["apps/server/src/health-repository.ts"];
	const forbiddenPaths = ["apps/server/src/health-write-path.ts"];
	const sharedLeases: string[] = [];
	const baseCommit = "7e79de90c52adb60127b3dfd57c88013985bbfc1";
	const milestone: Milestone = {
		status: options.milestoneStatus ?? "PLANNED",
		taskClass: "backend-api-data",
		taskPacket: PACKET_PATH,
		taskPacketSha256: "",
		baseCommit,
		ownedPaths,
		forbiddenPaths,
		sharedLeases,
		handoff: HANDOFF_PATH,
	};
	const packet: Packet = {
		schemaVersion: 1,
		milestoneId: MILESTONE_ID,
		taskClass: "backend-api-data",
		packetStatus: options.packetStatus ?? "DRAFT",
		stateRef: `PROJECT_STATE.yaml#/milestones/${MILESTONE_ID}`,
		baseCommit,
		task: {
			objective: "Read-only rehearsal of the Staff operational snapshot.",
			acceptanceCriteria: ["Discover the selected packet from active state."],
			explicitExclusions: ["Product and implementation changes."],
		},
		scope: {
			ownedPaths: [...ownedPaths],
			forbiddenPaths: [...forbiddenPaths],
			sharedLeases: [...sharedLeases],
		},
		authorities: { required: [], conditional: [] },
		continuity: {
			predecessorMilestones: ["agent-context-architecture-migration-r01"],
			currentHandoff: HANDOFF_PATH,
			unresolvedDecisions: [],
		},
		verification: {
			profile: "phase4-health",
			orderedGates: ["focused verification"],
			independentReviewRequired: true,
		},
		evidence: {
			receiptTemplate: "docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md",
			requiredArtifacts: ["context:show output"],
		},
		limitations: ["No product behavior is changed."],
	};
	options.editPacket?.(packet);
	const packetBytes = Buffer.from(stringifyYaml(packet), "utf8");
	milestone.taskPacketSha256 = sha256(packetBytes);
	options.editMilestone?.(milestone);
	for (const field of PACKET_METADATA_FIELDS) {
		if (options.metadataFields?.includes(field) ?? true) continue;
		if (field === "taskClass") delete milestone.taskClass;
		if (field === "taskPacket") delete milestone.taskPacket;
		if (field === "taskPacketSha256") delete milestone.taskPacketSha256;
	}

	writeFixtureFile(
		root,
		ROUTES_PATH,
		stringifyYaml({
			schemaVersion: 1,
			mode: options.registryMode ?? "compatibility",
			routes: {
				"backend-api-data": {
					responsibility: "Review the bounded backend contract.",
					destinations: [],
					required: [],
					normalStartup: [],
					conditional: [],
				},
			},
		}),
	);
	writeFixtureFile(
		root,
		PROJECT_STATE_PATH,
		stringifyYaml({ milestones: { [MILESTONE_ID]: milestone } }),
	);
	if (!options.omitPacket) writeFixtureFile(root, PACKET_PATH, packetBytes);
	return { root, milestone, packet };
}

function writeFixtureFile(
	root: string,
	relativePath: string,
	content: string | Buffer,
) {
	const absolutePath = path.resolve(root, relativePath);
	mkdirSync(path.dirname(absolutePath), { recursive: true });
	writeFileSync(absolutePath, content);
}

function runShow(root: string) {
	return spawnSync(
		process.execPath,
		[SHOW_SCRIPT_PATH, "--milestone", MILESTONE_ID],
		{ cwd: root, encoding: "utf8" },
	);
}

async function expectBuildToFail(root: string, message: RegExp) {
	await expect(
		buildAgentContextPlan({ repositoryRoot: root, milestoneId: MILESTONE_ID }),
	).rejects.toThrow(message);
}

describe("context:show bounded packet discovery", () => {
	it("discovers a valid DRAFT pilot packet from the selected active milestone", async () => {
		const { root } = createFixture();

		const plan = await buildAgentContextPlan({
			repositoryRoot: root,
			milestoneId: MILESTONE_ID,
		});

		expect(plan).toContain(`milestone: ${MILESTONE_ID}`);
		expect(plan).toContain("status: PLANNED");
		expect(plan).toContain("packetStatus: DRAFT");
		expect(plan).toContain(
			"route responsibility: Review the bounded backend contract.",
		);
		expect(plan).toContain("history is retrieved only through a named pointer");
	});

	it("rejects a stale packet hash before printing any plan", async () => {
		const { root } = createFixture({
			editMilestone: (milestone) => {
				milestone.taskPacketSha256 = "0".repeat(64);
			},
		});

		await expectBuildToFail(
			root,
			/taskPacketSha256 differs from active milestone/,
		);
		const result = runShow(root);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr).toContain("context:show FAILED:");
	});

	it("fails before printing a plan when a registered packet file is missing", async () => {
		const { root } = createFixture({ omitPacket: true });

		await expectBuildToFail(root, /missing repository path/);
		const result = runShow(root);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr).toContain("context:show FAILED:");
		expect(result.stderr).toContain(PACKET_PATH);
	});

	it("rejects a packet path that is not the stable exact state path", async () => {
		const { root } = createFixture({
			editMilestone: (milestone) => {
				milestone.taskPacket = "docs/phase-records/task-packets/other.yaml";
			},
		});

		await expectBuildToFail(root, /taskPacket must be the stable path/);
	});

	it("rejects packet identity, task class, state reference, and base drift", async () => {
		const cases: Array<[(packet: Packet) => void, RegExp]> = [
			[
				(packet) => {
					packet.milestoneId = "other-milestone";
				},
				/milestoneId differs from active milestone/,
			],
			[
				(packet) => {
					packet.taskClass = "analysis-review";
				},
				/taskClass differs from active milestone/,
			],
			[
				(packet) => {
					packet.stateRef = "PROJECT_STATE.yaml#/milestones/other-milestone";
				},
				/stateRef does not identify the selected active milestone/,
			],
			[
				(packet) => {
					packet.baseCommit = "19e28f4f0874d96569bc6944e38ad94b89924b60";
				},
				/baseCommit differs from active milestone/,
			],
		];

		for (const [editPacket, error] of cases) {
			const { root } = createFixture({ editPacket });
			await expectBuildToFail(root, error);
		}
	});

	it("rejects each scope field when it differs from active state", async () => {
		const cases: Array<[(scope: PacketScope) => void, RegExp]> = [
			[
				(scope) => {
					scope.ownedPaths.push("another/owned/path.ts");
				},
				/scope\.ownedPaths differs from active milestone/,
			],
			[
				(scope) => {
					scope.forbiddenPaths.push("another/forbidden/path.ts");
				},
				/scope\.forbiddenPaths differs from active milestone/,
			],
			[
				(scope) => {
					scope.sharedLeases.push("another-lease");
				},
				/scope\.sharedLeases differs from active milestone/,
			],
		];

		for (const [editScope, error] of cases) {
			const { root } = createFixture({
				editPacket: (packet) => editScope(packet.scope),
			});
			await expectBuildToFail(root, error);
		}
	});

	it("rejects a stale current handoff", async () => {
		const { root } = createFixture({
			editPacket: (packet) => {
				packet.continuity.currentHandoff = "docs/other-handoff.md";
			},
		});

		await expectBuildToFail(
			root,
			/continuity\.currentHandoff differs from active handoff/,
		);
	});

	it("rejects partial packet metadata while preserving all-absent compatibility", async () => {
		const partial = createFixture({
			metadataFields: ["taskClass", "taskPacket"],
		});
		await expectBuildToFail(
			partial.root,
			/packet metadata must be all-or-none/,
		);

		const legacy = createFixture({ metadataFields: [] });
		const plan = await buildAgentContextPlan({
			repositoryRoot: legacy.root,
			milestoneId: MILESTONE_ID,
		});
		expect(plan).toContain("compatibility mode does not infer one");
		expect(plan).toContain("packetStatus: DRAFT");
		expect(plan).toContain(
			"compatibility note: this packet was not validated against active state",
		);
		expect(plan).toContain(
			"route: unavailable because the active state does not record a task class",
		);

		const absent = createFixture({ metadataFields: [], omitPacket: true });
		const absentPlan = await buildAgentContextPlan({
			repositoryRoot: absent.root,
			milestoneId: MILESTONE_ID,
		});
		expect(absentPlan).toContain(`packet: ${PACKET_PATH} (absent)`);
		expect(absentPlan).toContain(
			"compatibility warning: no active packet is available; packet context is not claimed",
		);
	});

	it("fails closed when active routing has no packet metadata", async () => {
		const active = createFixture({
			registryMode: "active",
			metadataFields: [],
		});
		await expectBuildToFail(
			active.root,
			/active routing requires packet metadata and a validated task packet for an open milestone/,
		);

		const activeOmit = createFixture({
			registryMode: "active",
			metadataFields: [],
			omitPacket: true,
		});
		await expectBuildToFail(
			activeOmit.root,
			/active routing requires packet metadata and a validated task packet for an open milestone/,
		);
	});

	it("rejects an unknown startup routing mode", async () => {
		const unknown = createFixture({ registryMode: "legacy" });
		await expectBuildToFail(
			unknown.root,
			/ROUTES\.yaml mode must be "compatibility" or "active"/,
		);
	});

	it("fails closed on packet inspection errors in compatibility mode", async () => {
		const { root } = createFixture({ metadataFields: [], omitPacket: true });
		const failingInspectPath = async (
			repositoryRoot: string,
			relativePath: string,
		) => {
			if (relativePath === PACKET_PATH)
				return {
					normalized: relativePath,
					exists: false,
					error: "injected packet path inspection failure",
				};
			return inspectPath(repositoryRoot, relativePath);
		};

		await expect(
			buildAgentContextPlan({
				repositoryRoot: root,
				milestoneId: MILESTONE_ID,
				inspectPathImpl: failingInspectPath,
			}),
		).rejects.toThrow(/injected packet path inspection failure/);
	});

	it("requires DRAFT only for PLANNED and READY for every other open status", async () => {
		const plannedDraft = createFixture({
			milestoneStatus: "PLANNED",
			packetStatus: "DRAFT",
		});
		await expect(
			buildAgentContextPlan({
				repositoryRoot: plannedDraft.root,
				milestoneId: MILESTONE_ID,
			}),
		).resolves.toContain("packetStatus: DRAFT");

		const readyDraft = createFixture({
			milestoneStatus: "READY",
			packetStatus: "DRAFT",
		});
		await expectBuildToFail(
			readyDraft.root,
			/DRAFT packet is only valid while active milestone is PLANNED/,
		);

		const inProgressReady = createFixture({
			milestoneStatus: "IN_PROGRESS",
			packetStatus: "READY",
		});
		await expect(
			buildAgentContextPlan({
				repositoryRoot: inProgressReady.root,
				milestoneId: MILESTONE_ID,
			}),
		).resolves.toContain("packetStatus: READY");

		const inProgressClosed = createFixture({
			milestoneStatus: "IN_PROGRESS",
			packetStatus: "CLOSED",
		});
		await expectBuildToFail(
			inProgressClosed.root,
			/active milestone .* cannot route a CLOSED packet/,
		);
	});

	it("does not open history during startup discovery", async () => {
		const { root } = createFixture();
		writeFixtureFile(root, "PROJECT_STATE_HISTORY.yaml", "malformed: [\n");
		const reads: string[] = [];
		const inspections: string[] = [];
		const trackedInspectPath = async (
			repositoryRoot: string,
			relativePath: string,
		) => {
			inspections.push(relativePath);
			return inspectPath(repositoryRoot, relativePath);
		};
		const trackedReadFile = async (absolutePath: string, encoding?: string) => {
			reads.push(path.basename(absolutePath));
			if (encoding === "utf8") return readFileAsync(absolutePath, "utf8");
			return readFileAsync(absolutePath);
		};

		const plan = await buildAgentContextPlan({
			repositoryRoot: root,
			milestoneId: MILESTONE_ID,
			inspectPathImpl: trackedInspectPath,
			readFileImpl: trackedReadFile,
		});
		const cliResult = runShow(root);

		expect(plan).toContain(`milestone: ${MILESTONE_ID}`);
		expect(cliResult.status).toBe(0);
		expect(cliResult.stdout).toContain(`milestone: ${MILESTONE_ID}`);
		expect(inspections).toEqual([ROUTES_PATH, PROJECT_STATE_PATH, PACKET_PATH]);
		expect(reads).toEqual([
			"ROUTES.yaml",
			"PROJECT_STATE.yaml",
			`${MILESTONE_ID}.yaml`,
		]);
		expect(reads).not.toContain("PROJECT_STATE_HISTORY.yaml");
	});
});
