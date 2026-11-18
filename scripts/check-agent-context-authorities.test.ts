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
	basePacket,
	fixtureRoots,
	initTrackedFixture,
	isolateFixtureHistory,
	type JsonObject,
	makeFixture,
	makeVisualPacket,
	materializeClosedPacketFixture,
	materializePacket,
	removeFixtureRoots,
	writeFixtureFile,
	writeFixtureHistory,
	writeFixtureState,
} from "./check-agent-context.fixture.ts";
import { checkAgentContext } from "./check-agent-context.mjs";
import {
	formatPacketAuthorities,
	readRepositoryYaml,
} from "./show-agent-context.mjs";

afterEach(removeFixtureRoots);

describe("check-agent-context", () => {
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
		const routesPath = path.join(root, "docs/agent-context/ROUTES.yaml");
		const registry = parseYaml(readFileSync(routesPath, "utf8"));
		registry.routes["backend-api-data"].conditional.push({
			trigger: "a named predecessor is disputed",
			role: "historical",
			path: "PROJECT_STATE_HISTORY.yaml",
			selector: { kind: "yaml-key", value: "milestones" },
			actionIfTriggered: "READ",
			reason: "Named predecessor only.",
		});
		writeFileSync(routesPath, stringifyYaml(registry), "utf8");
		const { state, packet, packetPath } = basePacket(root, "backend-api-data");
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
});

describe("check-agent-context", () => {
	it("M2/M3/M6: validates an active packet with no pin, ledger task class, copies or receipt template", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const f = basePacket(root);
		const milestone = f.state.milestones[f.packet.milestoneId];
		delete milestone.taskClass;
		delete milestone.taskPacketSha256;
		delete milestone.lastHeartbeatAt;
		delete milestone.leaseExpiresAt;
		delete (f.packet as JsonObject).baseCommit;
		delete (f.packet as JsonObject).scope;
		delete (f.packet.continuity as JsonObject).currentHandoff;
		delete (f.packet.evidence as JsonObject).receiptTemplate;
		materializePacket(root, f.state, f.packet, f.packetPath, {
			recordHash: false,
		});
		delete milestone.taskClass;
		writeFixtureState(root, f.state);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.errors).toEqual([]);
		(f.packet as JsonObject).scope = {};
		materializePacket(root, f.state, f.packet, f.packetPath, {
			recordHash: false,
		});
		delete milestone.taskClass;
		writeFixtureState(root, f.state);
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors,
		).toEqual([]);
	});
	it("M2/M3: ignores obsolete milestone fields and conflicting packet copies", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const f = basePacket(root);
		materializePacket(root, f.state, f.packet, f.packetPath);
		f.state.milestones[f.packet.milestoneId].taskClass = "backend-api-data";
		f.state.milestones[f.packet.milestoneId].taskPacketSha256 =
			"old unused pin";
		f.state.milestones[f.packet.milestoneId].leaseExpiresAt =
			"1900-01-01T00:00:00Z";
		f.packet.baseCommit = "abcdef0";
		f.packet.scope.ownedPaths = ["old-copy/**"];
		f.packet.continuity.currentHandoff = "gone/old.md";
		materializePacket(root, f.state, f.packet, f.packetPath, {
			recordHash: false,
		});
		f.state.milestones[f.packet.milestoneId].taskClass = "backend-api-data";
		writeFixtureState(root, f.state);
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors,
		).toEqual([]);
	});
	it("M6: closed records keep shape and identity without opening embedded paths", async () => {
		const root = makeFixture();
		const f = makeVisualPacket(root);
		const history = materializeClosedPacketFixture(root, f, "SUPERSEDED");
		const record = (history.milestones as Record<string, JsonObject>)[
			f.packet.milestoneId
		];
		record.supersededBy = "successor";
		record.handoff = "gone/closed-handoff.md";
		delete record.taskClass;
		delete record.taskPacket;
		delete record.taskPacketSha256;
		writeFixtureHistory(root, history);
		for (const source of [
			...f.packet.authorities.required,
			...f.packet.authorities.conditional,
		])
			source.path = "gone/authority.md";
		if (!f.packet.visual) throw new Error("Missing visual fixture");
		f.packet.visual.currentFrames = [
			{ path: "gone/frame.png", sha256: "a".repeat(64) },
		];
		f.packet.continuity.currentHandoff = "gone/packet-handoff.md";
		f.packet.evidence.receiptTemplate = "gone/receipt.md";
		writeFixtureFile(root, f.packetPath, stringifyYaml(f.packet));
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors,
		).toEqual([]);
		f.packet.stateRef = "PROJECT_STATE.yaml#/milestones/wrong";
		writeFixtureFile(root, f.packetPath, stringifyYaml(f.packet));
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors.some(
				(error) => error.includes("stateRef"),
			),
		).toBe(true);
		delete (f.packet as JsonObject).task;
		writeFixtureFile(root, f.packetPath, stringifyYaml(f.packet));
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors.some(
				(error) => error.includes("schema validation failed"),
			),
		).toBe(true);
	});
	it("M6: an optional active receipt template is never resolved", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const f = basePacket(root);
		f.packet.evidence.receiptTemplate = "gone/receipt.md";
		materializePacket(root, f.state, f.packet, f.packetPath);
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors,
		).toEqual([]);
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

	it("rejects an active milestone routed to a CLOSED packet", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const f = basePacket(root);
		f.packet.packetStatus = "CLOSED";
		materializePacket(root, f.state, f.packet, f.packetPath);
		expect(
			(await checkAgentContext({ root, checkTracked: false })).errors.some(
				(error) => error.includes("cannot route a CLOSED packet"),
			),
		).toBe(true);
	});
	it("requires CLOSED packets to leave active state and match terminal history and stable path", async () => {
		const root = makeFixture();
		const fixture = basePacket(root);
		const history = materializeClosedPacketFixture(root, fixture);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);

		const stalePath = "docs/phase-records/task-packets/not-stable.yaml";
		const stalePacket = { ...fixture.packet };
		writeFileSync(
			path.resolve(root, stalePath),
			stringifyYaml(stalePacket),
			"utf8",
		);
		rmSync(path.resolve(root, fixture.packetPath));
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("stable packet path must be"),
			),
		).toBe(true);

		writeFileSync(
			path.resolve(root, fixture.packetPath),
			stringifyYaml(fixture.packet),
			"utf8",
		);
		(
			(history.milestones as JsonObject)[
				fixture.packet.milestoneId
			] as JsonObject
		).status = "IN_PROGRESS";
		writeFixtureHistory(root, history);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some(
				(error) =>
					error.includes("CLOSED packet history milestone") &&
					error.includes("must be terminal"),
			),
		).toBe(true);
	});
});
