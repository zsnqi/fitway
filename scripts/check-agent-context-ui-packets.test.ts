import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { stringify as stringifyYaml } from "yaml";
import {
	basePacket,
	copyFixtureFile,
	explorationEnvelopeFixture,
	fixtureRoute,
	hashBytes,
	initTrackedFixture,
	isolateFixtureHistory,
	type JsonObject,
	makeFixture,
	makeUiFamilyFixture,
	makeVisualPacket,
	materializeClosedPacketFixture,
	materializePacket,
	removeFixtureRoots,
	writeFixtureFile,
} from "./check-agent-context.fixture.ts";
import { checkAgentContext } from "./check-agent-context.mjs";

afterEach(removeFixtureRoots);

describe("check-agent-context", () => {
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

	it("allows pending UI gates only for a DRAFT/PLANNED packet and accepts truthful NOT_REQUIRED promotion", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const fixture = makeVisualPacket(root);
		const visual = fixture.packet.visual as JsonObject;
		visual.surfaceKey = "login";
		visual.authorityStatus = "ACTIVE";
		visual.authorityKey = "login";
		visual.acceptanceAuthority = "NONE";
		fixture.state.milestones[fixture.packet.milestoneId].status = "PLANNED";
		fixture.packet.packetStatus = "DRAFT";
		(fixture.packet.designContextCheck as JsonObject).status = "PENDING";
		(fixture.packet.accessibilityGate as JsonObject).status = "PENDING";
		(visual.perceptualGate as JsonObject).status = "PENDING";
		(visual.promotionGate as JsonObject).status = "PENDING";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);

		fixture.state.milestones[fixture.packet.milestoneId].status = "IN_PROGRESS";
		fixture.packet.packetStatus = "READY";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("design-context check is not PASS"),
			),
		).toBe(true);
		expect(
			result.errors.some((error) =>
				error.includes("accessibility gate is not PASS"),
			),
		).toBe(true);
		expect(
			result.errors.some((error) =>
				error.includes("perceptual gate is not PASS"),
			),
		).toBe(true);
		expect(
			result.errors.some((error) =>
				error.includes("promotion gate is not PASS or NOT_REQUIRED"),
			),
		).toBe(true);

		(fixture.packet.designContextCheck as JsonObject).status = "PASS";
		(fixture.packet.accessibilityGate as JsonObject).status = "PASS";
		(visual.perceptualGate as JsonObject).status = "PASS";
		(visual.promotionGate as JsonObject).status = "NOT_REQUIRED";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);

		(visual.perceptualGate as JsonObject).status = "NOT_REQUIRED";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("perceptual gate cannot be NOT_REQUIRED"),
			),
		).toBe(true);
	});

	it("allows pending accessibility and perceptual gates for a VACANT concept phase until validating", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const decisionPath = "docs/phase-records/handoffs/exploration-decision.md";
		const fixture = makeUiFamilyFixture(root, "visual-authority-change", {
			surfaceKey: "owner-composition-family",
			authorityStatus: "VACANT",
			authorityKey: "ADR-009",
			acceptanceAuthority: "NONE",
			explorationEnvelope: explorationEnvelopeFixture(decisionPath),
		});
		const ownerRoute = fixtureRoute(root, "visual-authority-change");
		const ownerConditional = ownerRoute.conditional.find((source) =>
			source.path.includes("ADR-009"),
		);
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
		fixture.packet.packetStatus = "READY";
		fixture.state.milestones[fixture.packet.milestoneId].status = "READY";
		(fixture.packet.accessibilityGate as JsonObject).status = "PENDING";
		(fixture.packet.visual.perceptualGate as JsonObject).status = "PENDING";
		writeFixtureFile(root, decisionPath, "# Exploration decision\n");
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);

		fixture.state.milestones[fixture.packet.milestoneId].status = "IN_PROGRESS";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);

		fixture.state.milestones[fixture.packet.milestoneId].status = "VALIDATING";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("accessibility gate is not PASS"),
			),
		).toBe(true);
		expect(
			result.errors.some((error) =>
				error.includes("perceptual gate is not PASS"),
			),
		).toBe(true);
	});

	it("requires accessibility and perceptual PASS for a non-visual-authority VACANT packet", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const decisionPath = "docs/phase-records/handoffs/exploration-decision.md";
		const fixture = makeUiFamilyFixture(root, "ui-maintenance", {
			authorityStatus: "VACANT",
			explorationEnvelope: explorationEnvelopeFixture(decisionPath),
		});
		fixture.packet.packetStatus = "READY";
		fixture.state.milestones[fixture.packet.milestoneId].status = "IN_PROGRESS";
		(fixture.packet.accessibilityGate as JsonObject).status = "PENDING";
		(fixture.packet.visual.perceptualGate as JsonObject).status = "PENDING";
		writeFixtureFile(root, decisionPath, "# Exploration decision\n");
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("accessibility gate is not PASS"),
			),
		).toBe(true);
		expect(
			result.errors.some((error) =>
				error.includes("perceptual gate is not PASS"),
			),
		).toBe(true);
	});

	it("allows non-PASS UI evidence for a CLOSED non-DONE terminal packet", async () => {
		const root = makeFixture();
		const fixture = makeVisualPacket(root);
		const visual = fixture.packet.visual as JsonObject;
		visual.surfaceKey = "login";
		visual.authorityStatus = "ACTIVE";
		visual.authorityKey = "login";
		visual.acceptanceAuthority = "NONE";
		(fixture.packet.designContextCheck as JsonObject).status = "PENDING";
		(fixture.packet.accessibilityGate as JsonObject).status = "PENDING";
		(visual.perceptualGate as JsonObject).status = "PENDING";
		(visual.promotionGate as JsonObject).status = "PENDING";
		materializeClosedPacketFixture(root, fixture, "BLOCKED");
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(true);
	});

	it("rejects missing or hash-mismatched UI frames", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const fixture = makeVisualPacket(root);
		const visual = fixture.packet.visual as JsonObject;
		visual.surfaceKey = "login";
		visual.authorityStatus = "ACTIVE";
		visual.authorityKey = "login";
		visual.acceptanceAuthority = "NONE";
		const currentFrames = visual.currentFrames as Array<JsonObject>;
		currentFrames[0].sha256 = "0".repeat(64);
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		let result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) => error.includes("SHA-256 mismatch")),
		).toBe(true);

		currentFrames[0].path = "missing-frame.png";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("missing frame missing-frame.png"),
			),
		).toBe(true);
	});

	it("resolves the Public, Login, Staff, Owner-maintenance, and Owner-redesign UI packet families", async () => {
		const families: Array<{
			label: string;
			taskClass: "ui-maintenance" | "visual-authority-change";
			visual: JsonObject;
			addAdr009Required?: boolean;
		}> = [
			{
				label: "public",
				taskClass: "ui-maintenance",
				visual: {
					surfaceKey: "public",
					authorityStatus: "ACTIVE",
					authorityKey: "public",
					acceptanceAuthority: "PAPER",
				},
			},
			{
				label: "login",
				taskClass: "ui-maintenance",
				visual: {
					surfaceKey: "login",
					authorityStatus: "ACTIVE",
					authorityKey: "login",
					acceptanceAuthority: "PAPER",
				},
			},
			{
				label: "staff",
				taskClass: "ui-maintenance",
				visual: {
					surfaceKey: "staff",
					authorityStatus: "ACTIVE",
					authorityKey: "staff",
					acceptanceAuthority: "MANIFEST",
				},
			},
			{
				label: "owner-maintenance",
				taskClass: "ui-maintenance",
				visual: {
					surfaceKey: "owner-settings",
					authorityStatus: "SUPERSEDED",
					authorityKey: "owner-settings",
					governingDecision:
						"docs/adr/ADR-009-owner-composition-authority-supersession.md",
					paperAvailability: "NOT_APPLICABLE",
					acceptanceAuthority: "HUMAN_DECISION",
				},
			},
			{
				label: "owner-redesign",
				taskClass: "visual-authority-change",
				addAdr009Required: true,
				visual: {
					surfaceKey: "owner-settings",
					authorityStatus: "SUPERSEDED",
					authorityKey: "owner-settings",
					governingDecision:
						"docs/adr/ADR-009-owner-composition-authority-supersession.md",
					paperAvailability: "NOT_APPLICABLE",
					acceptanceAuthority: "HUMAN_DECISION",
				},
			},
		];
		for (const family of families) {
			const root = makeFixture();
			isolateFixtureHistory(root);
			const fixture = makeUiFamilyFixture(
				root,
				family.taskClass,
				family.visual,
			);
			if (family.addAdr009Required) {
				const ownerConditional = fixtureRoute(
					root,
					family.taskClass,
				).conditional.find((source) => source.path.includes("ADR-009"));
				expect(ownerConditional, family.label).toBeDefined();
				if (ownerConditional) {
					fixture.packet.authorities.required.push({
						role: ownerConditional.role,
						path: ownerConditional.path,
						selector: ownerConditional.selector,
						reason: "Owner redesign authority.",
					});
				}
			}
			materializePacket(
				root,
				fixture.state,
				fixture.packet,
				fixture.packetPath,
			);
			const result = await checkAgentContext({ root, checkTracked: false });
			expect(result.errors, family.label).toEqual([]);
		}
	});

	it("rejects a UI packet whose design-context command skips check:design-context", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const fixture = makeUiFamilyFixture(root, "ui-maintenance", {});
		(fixture.packet.designContextCheck as JsonObject).command =
			"pnpm verify:fast";
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("must run check:design-context"),
			),
		).toBe(true);
	});

	it("requires an Owner UI packet to carry the registered ADR-009 conditional", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const fixture = makeUiFamilyFixture(root, "ui-maintenance", {
			surfaceKey: "owner-settings",
		});
		fixture.packet.authorities.conditional =
			fixture.packet.authorities.conditional.filter(
				(rule) => !rule.path.includes("ADR-009"),
			);
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes("packet conditionals omit registered rule"),
			),
		).toBe(true);
	});

	it("requires the schema envelope for VACANT visual packets and validates its authorizing decision", async () => {
		const decisionPath =
			"docs/phase-records/handoffs/owner-design-exploration-envelope-repair-r01/20260921-183100-exploration-envelope-decision.md";

		const vacantRoot = makeFixture();
		isolateFixtureHistory(vacantRoot);
		const withoutEnvelope = makeUiFamilyFixture(vacantRoot, "ui-maintenance", {
			authorityStatus: "VACANT",
		});
		materializePacket(
			vacantRoot,
			withoutEnvelope.state,
			withoutEnvelope.packet,
			withoutEnvelope.packetPath,
		);
		let result = await checkAgentContext({
			root: vacantRoot,
			checkTracked: false,
		});
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) => error.includes("explorationEnvelope")),
		).toBe(true);

		const envelopeRoot = makeFixture();
		isolateFixtureHistory(envelopeRoot);
		const withEnvelope = makeUiFamilyFixture(envelopeRoot, "ui-maintenance", {
			authorityStatus: "VACANT",
			explorationEnvelope: explorationEnvelopeFixture(decisionPath),
		});
		copyFixtureFile(envelopeRoot, decisionPath);
		materializePacket(
			envelopeRoot,
			withEnvelope.state,
			withEnvelope.packet,
			withEnvelope.packetPath,
		);
		result = await checkAgentContext({
			root: envelopeRoot,
			checkTracked: false,
		});
		expect(result.errors).toEqual([]);
		expect(result.ok).toBe(true);
	});

	it("rejects an exploration envelope on a non-VACANT visual packet", async () => {
		const root = makeFixture();
		isolateFixtureHistory(root);
		const decisionPath =
			"docs/phase-records/handoffs/exploration-envelope-decision.md";
		const fixture = makeUiFamilyFixture(root, "ui-maintenance", {
			authorityStatus: "SUPERSEDED",
			explorationEnvelope: explorationEnvelopeFixture(decisionPath),
		});
		writeFixtureFile(root, decisionPath, "# Exploration envelope decision\n");
		materializePacket(root, fixture.state, fixture.packet, fixture.packetPath);
		const result = await checkAgentContext({ root, checkTracked: false });
		expect(result.ok).toBe(false);
		expect(
			result.errors.some((error) =>
				error.includes(
					"visual.explorationEnvelope is only valid for authorityStatus VACANT",
				),
			),
		).toBe(true);
	});

	it("rejects a missing or untracked exploration authorizing decision record", async () => {
		const decisionPath =
			"docs/phase-records/handoffs/exploration-envelope-r01/decision.md";

		const missingRoot = makeFixture();
		isolateFixtureHistory(missingRoot);
		const missing = makeUiFamilyFixture(missingRoot, "ui-maintenance", {
			authorityStatus: "VACANT",
			explorationEnvelope: explorationEnvelopeFixture(decisionPath),
		});
		materializePacket(
			missingRoot,
			missing.state,
			missing.packet,
			missing.packetPath,
		);
		let result = await checkAgentContext({
			root: missingRoot,
			checkTracked: false,
		});
		expect(
			result.errors.some(
				(error) =>
					error.includes("visual.explorationEnvelope.authorizingDecision") &&
					error.includes(`missing path ${decisionPath}`),
			),
		).toBe(true);

		const untrackedRoot = makeFixture();
		isolateFixtureHistory(untrackedRoot);
		const untracked = makeUiFamilyFixture(untrackedRoot, "ui-maintenance", {
			authorityStatus: "VACANT",
			explorationEnvelope: explorationEnvelopeFixture(decisionPath),
		});
		initTrackedFixture(untrackedRoot);
		writeFixtureFile(untrackedRoot, decisionPath, "# Decision\n");
		materializePacket(
			untrackedRoot,
			untracked.state,
			untracked.packet,
			untracked.packetPath,
		);
		result = await checkAgentContext({
			root: untrackedRoot,
			checkTracked: true,
		});
		expect(
			result.errors.some(
				(error) =>
					error.includes("visual.explorationEnvelope.authorizingDecision") &&
					error.includes(`untracked path ${decisionPath}`),
			),
		).toBe(true);
	});
});

describe("check-agent-context", () => {
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
});
