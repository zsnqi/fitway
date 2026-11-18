import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
	AGENTS_INSTRUCTION_CAP_BYTES,
	AGENTS_INSTRUCTION_WARN_BYTES,
	TASK_CLASSES,
} from "./agent-context-rules.mjs";
import { checkRuleEnforcers } from "./agent-environment/rule-enforcers.mjs";
import {
	activeHandoffPath,
	basePacket,
	FIXTURE_MILESTONES,
	type FixtureState,
	fixtureRoots,
	HISTORICAL_FRONTIERS,
	initTrackedFixture,
	isolateFixtureHistory,
	makeFixture,
	materializeCommitFrontier,
	materializePacket,
	packetFrontier,
	REAL_ROOT,
	removeFixtureRoots,
	writeFixtureFile,
	writeFixtureState,
} from "./check-agent-context.fixture.ts";
import { checkAgentContext } from "./check-agent-context.mjs";
import {
	formatAgentContextResult,
	formatAgentContextWarnings,
} from "./check-agent-context-options.mjs";

it("R3: exposes exactly the task classes used by packets and no startup mode", () => {
	expect(TASK_CLASSES).toEqual([
		"backend-api-data",
		"ui-maintenance",
		"visual-authority-change",
		"repository-infrastructure",
	]);
	const registry = parseYaml(
		readFileSync(
			path.join(REAL_ROOT, "docs/agent-context/ROUTES.yaml"),
			"utf8",
		),
	);
	expect(Object.keys(registry.routes)).toEqual(TASK_CLASSES);
	expect(registry).not.toHaveProperty("mode");
	const schema = JSON.parse(
		readFileSync(
			path.join(REAL_ROOT, "docs/schemas/task-packet.schema.json"),
			"utf8",
		),
	);
	expect(schema.$defs.taskClass.enum).toEqual(TASK_CLASSES);
});

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
afterEach(removeFixtureRoots);

describe("check-agent-context", () => {
	it("keeps every pnpm command and file in the rule-enforcer table", () => {
		expect(checkRuleEnforcers({ root: REAL_ROOT })).toEqual([]);
	});

	it.each([
		"unknown-task",
		"analysis-review",
	])("L3: names a bad packet taskClass %s on one line", async (taskClass) => {
		const root = makeFixture();
		const { state, packet, packetPath } = basePacket(root);
		packet.taskClass = taskClass;
		materializePacket(root, state, packet, packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(result.errors).toEqual([
			`${packetPath}: taskClass ${JSON.stringify(taskClass)} has no route`,
		]);
	});
	it("isolates fixture active state to the milestones under test", () => {
		const root = makeFixture();
		const state = parseYaml(
			readFileSync(path.resolve(root, "PROJECT_STATE.yaml"), "utf8"),
		) as unknown as FixtureState;
		expect(Object.keys(state.milestones)).toEqual([...FIXTURE_MILESTONES]);
	});

	it("K1: derives the open frontier from packets and passes the historical closures", async () => {
		for (const candidate of [
			REAL_ROOT,
			...HISTORICAL_FRONTIERS.map((commit) => {
				const root = makeFixture();
				materializeCommitFrontier(root, commit);
				return root;
			}),
		]) {
			const result = await checkAgentContext({
				root: candidate,
				checkTracked: false,
			});
			expect(result.registry).not.toHaveProperty("mode");
			expect(result.ok, result.errors.join("\n")).toBe(true);
			expect(Object.keys(result.state?.milestones ?? {}).sort()).toEqual(
				packetFrontier(candidate),
			);
			expect(
				result.warnings.some((warning) =>
					warning.includes("no active task packet"),
				),
			).toBe(false);
		}
	});

	it("K1: fails by ID for each packet/ledger frontier direction", async () => {
		const missingPacketRoot = makeFixture();
		isolateFixtureHistory(missingPacketRoot);
		const missingPacket = basePacket(missingPacketRoot);
		const missingMilestone =
			missingPacket.state.milestones[missingPacket.packet.milestoneId];
		delete missingMilestone.taskClass;
		delete missingMilestone.taskPacket;
		delete missingMilestone.taskPacketSha256;
		rmSync(path.resolve(missingPacketRoot, missingPacket.packetPath));
		writeFixtureState(missingPacketRoot, missingPacket.state);
		const missingResult = await checkAgentContext({
			root: missingPacketRoot,
			checkTracked: false,
		});
		expect(
			missingResult.errors.some(
				(error) =>
					error.includes(missingPacket.packet.milestoneId) &&
					error.includes(
						"active routing requires exactly one validated packet",
					),
			),
		).toBe(true);

		const orphanRoot = makeFixture();
		isolateFixtureHistory(orphanRoot);
		const orphanPacket = basePacket(orphanRoot);
		const orphanId = "fixture-orphan";
		const orphanPath = `docs/phase-records/task-packets/${orphanId}.yaml`;
		orphanPacket.packet.milestoneId = orphanId;
		orphanPacket.packet.stateRef = `PROJECT_STATE.yaml#/milestones/${orphanId}`;
		writeFileSync(
			path.resolve(orphanRoot, orphanPath),
			stringifyYaml(orphanPacket.packet),
			"utf8",
		);
		const orphanResult = await checkAgentContext({
			root: orphanRoot,
			checkTracked: false,
		});
		expect(
			orphanResult.errors.some(
				(error) =>
					error.includes(orphanPath) &&
					error.includes("packet points to no active milestone"),
			),
		).toBe(true);

		const closedRoot = makeFixture();
		isolateFixtureHistory(closedRoot);
		const closedPacket = basePacket(closedRoot);
		closedPacket.packet.packetStatus = "CLOSED";
		materializePacket(
			closedRoot,
			closedPacket.state,
			closedPacket.packet,
			closedPacket.packetPath,
		);
		const closedResult = await checkAgentContext({
			root: closedRoot,
			checkTracked: false,
		});
		expect(
			closedResult.errors.some(
				(error) =>
					error.includes(closedPacket.packet.milestoneId) &&
					error.includes("cannot route a CLOSED packet"),
			),
		).toBe(true);
	});

	it("warns conservatively below the instruction cap and fails only above it", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const fixture = basePacket(root);
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		writeFixtureFile(
			root,
			"AGENTS.md",
			"x".repeat(AGENTS_INSTRUCTION_WARN_BYTES + 1),
		);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok, JSON.stringify(result.errors)).toBe(true);
		expect(
			result.warnings.some(
				(warning) =>
					warning.includes("conservative") &&
					warning.includes("warning threshold"),
			),
		).toBe(true);

		writeFixtureFile(
			root,
			"AGENTS.md",
			"x".repeat(AGENTS_INSTRUCTION_CAP_BYTES + 1),
		);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(
			result.errors.some((error) =>
				error.includes("exceeds documented instruction cap"),
			),
		).toBe(true);
	});

	it("blocks an open milestone with no packet", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);

		const fixture = basePacket(root);
		const milestone = fixture.state.milestones[fixture.packet.milestoneId];
		delete milestone.taskClass;
		delete milestone.taskPacket;
		delete milestone.taskPacketSha256;
		rmSync(path.join(root, fixture.packetPath));
		writeFixtureState(root, fixture.state);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"active routing requires exactly one validated packet for an open milestone",
				),
			),
		).toBe(true);
		expect(
			result.warnings.some((warning) =>
				warning.includes("no active task packet"),
			),
		).toBe(false);
	});

	it("keeps DRAFT packets limited to PLANNED milestones and accepts a ready packet for execution", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const draft = basePacket(root);
		draft.packet.packetStatus = "DRAFT";
		materializePacket(root, draft.state, draft.packet, draft.packetPath);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"DRAFT packet is only valid while active milestone is PLANNED",
				),
			),
		).toBe(true);

		const planned = basePacket(root);
		planned.state.milestones[planned.packet.milestoneId].status = "PLANNED";
		planned.packet.packetStatus = "DRAFT";
		materializePacket(root, planned.state, planned.packet, planned.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);

		planned.packet.packetStatus = "READY";
		materializePacket(root, planned.state, planned.packet, planned.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);
	});

	it("blocks missing packets for terminal active-ledger metadata and still rejects an existing packet", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const missing = basePacket(root);
		const missingMilestone =
			missing.state.milestones[missing.packet.milestoneId];
		missingMilestone.status = "DONE";
		missingMilestone.taskClass = missing.packet.taskClass;
		missingMilestone.taskPacket = missing.packetPath;
		missingMilestone.taskPacketSha256 = "a".repeat(64);
		writeFixtureState(root, missing.state);
		rmSync(path.join(root, missing.packetPath));

		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("active packet metadata points to no packet"),
			),
		).toBe(true);
		expect(
			result.warnings.some((warning) =>
				warning.includes("no active task packet"),
			),
		).toBe(false);

		const existingRoot = makeFixture();
		isolateFixtureHistory(existingRoot);
		const existing = basePacket(existingRoot);
		existing.state.milestones[existing.packet.milestoneId].status = "DONE";
		materializePacket(
			existingRoot,
			existing.state,
			existing.packet,
			existing.packetPath,
		);
		result = await checkAgentContext({
			root: existingRoot,
			checkTracked: false,
		});
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("terminal active milestone"),
			),
		).toBe(true);
	});

	it("fails a case-mismatched required source with mandatory packet routing", async () => {
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
			"Surface boundaries",
			"Surface boundaries drifted",
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
});

describe("check-agent-context", () => {
	it("requires every active milestone handoff to exist", async () => {
		const root = makeFixture();
		replaceOnce(
			root,
			"PROJECT_STATE.yaml",
			activeHandoffPath(),
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
		replaceOnce(root, "PROJECT_STATE.yaml", activeHandoffPath(), untrackedPath);
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
});

describe("check-agent-context", () => {
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
			activeHandoffPath(),
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
});

describe("agent-context warnings", () => {
	it("preserves warnings and errors without historical exception machinery", () => {
		const result = {
			ok: false,
			warnings: ["active warning"],
			errors: ["active error"],
		};
		expect(formatAgentContextWarnings(result)).toEqual([
			"WARNING: active warning",
		]);
		expect(
			formatAgentContextWarnings(result, {
				warningPrefix: "Repository warning: ",
			}),
		).toEqual(["Repository warning: active warning"]);
		expect(formatAgentContextResult(result)).toContain("active error");
	});
});
