// Task packet and active handoff validation.

import { readdir, readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import {
	asError,
	inspectPath,
	stablePacketPath,
	trackedPath,
} from "./agent-context-paths.mjs";
import {
	authorityKey,
	routeForPacket,
	validateConditionalRuleSet,
	validatePathReference,
	validateRequiredAuthoritySet,
	validateVisualFrames,
} from "./agent-context-references.mjs";
import {
	OPEN_STATUSES,
	PACKET_DIRECTORY,
	TASK_CLASSES,
	TERMINAL_STATUSES,
	UI_TASK_CLASSES,
} from "./agent-context-rules.mjs";
import { makeAjv, readText, schemaErrors } from "./agent-context-schema.mjs";

async function validatePacket({
	root,
	packet,
	packetPath,
	state,
	history,
	registry,
	checkTracked,
	errors,
}) {
	const milestone = state?.milestones?.[packet.milestoneId];
	const historyMilestone = history?.milestones?.[packet.milestoneId];
	const expectedStateRef = `PROJECT_STATE.yaml#/milestones/${packet.milestoneId}`;
	if (packet.stateRef !== expectedStateRef)
		errors.push(`${packetPath}: stateRef does not identify its milestone`);
	if (packet.packetStatus === "CLOSED") {
		if (milestone)
			errors.push(
				`${packetPath}: active milestone ${packet.milestoneId} cannot route a CLOSED packet`,
			);
		else if (!historyMilestone)
			errors.push(
				`${packetPath}: CLOSED packet requires a matching terminal history milestone ${packet.milestoneId}`,
			);
		else if (!TERMINAL_STATUSES.has(historyMilestone.status))
			errors.push(
				`${packetPath}: CLOSED packet history milestone ${packet.milestoneId} must be terminal, got ${historyMilestone.status}`,
			);
		// Frozen records retain their shape and identity, not live filesystem obligations.
		return;
	}
	const route = routeForPacket(registry, packet.taskClass);
	if (!route) {
		errors.push(`${packetPath}: taskClass ${packet.taskClass} has no route`);
		return;
	}
	if (!milestone) {
		errors.push(`${packetPath}: packet points to no active milestone`);
		return;
	}
	if (!OPEN_STATUSES.has(milestone.status))
		errors.push(
			`${packetPath}: packet is routed by a terminal active milestone ${packet.milestoneId}`,
		);
	if (packet.packetStatus === "DRAFT" && milestone.status !== "PLANNED")
		errors.push(
			`${packetPath}: DRAFT packet is only valid while active milestone is PLANNED`,
		);
	if (milestone.status !== "PLANNED" && packet.packetStatus !== "READY")
		errors.push(
			`${packetPath}: active milestone status ${milestone.status} requires a READY packet`,
		);
	const expectedPacketPath = stablePacketPath(packet.milestoneId);
	if (milestone.taskPacket !== expectedPacketPath)
		errors.push(
			`${packetPath}: active milestone taskPacket must be the stable path ${expectedPacketPath}`,
		);
	if (milestone.taskPacket && milestone.taskPacket !== packetPath)
		errors.push(`${packetPath}: active milestone taskPacket pointer differs`);
	validateRequiredAuthoritySet({
		packetPath,
		routeRequired: route.required,
		routeConditionals: route.conditional,
		packetRequired: packet.authorities.required,
		errors,
	});
	for (const [index, authority] of (
		packet.authorities.required ?? []
	).entries()) {
		await validatePathReference({
			root,
			relativePath: authority.path,
			selector: authority.selector,
			label: `${packetPath} authorities.required[${index}]`,
			checkTracked,
			errors,
			allowHistorical: authority.role === "historical",
		});
	}
	for (const [index, authority] of (
		packet.authorities.conditional ?? []
	).entries()) {
		await validatePathReference({
			root,
			relativePath: authority.path,
			selector: authority.selector,
			label: `${packetPath} authorities.conditional[${index}]`,
			checkTracked,
			errors,
			allowHistorical:
				authority.role === "historical" ||
				Boolean(authority.historicalException),
		});
		if (
			authority.actionIfTriggered === "NEEDS_HUMAN" &&
			authority.trigger.toLowerCase().includes("paper") &&
			authority.role !== "visual-status"
		) {
			errors.push(
				`${packetPath} authorities.conditional[${index}]: Paper stop trigger must route to visual-status`,
			);
		}
	}
	validateConditionalRuleSet({
		packetPath,
		routeConditionals: route.conditional,
		packetConditionals: packet.authorities.conditional,
		errors,
	});
	if (UI_TASK_CLASSES.has(packet.taskClass)) {
		const requiresReadyUiGates =
			packet.packetStatus === "READY" ||
			(milestone !== undefined &&
				OPEN_STATUSES.has(milestone.status) &&
				milestone.status !== "PLANNED") ||
			(packet.packetStatus === "CLOSED" && historyMilestone?.status === "DONE");
		const vacantConceptPhase =
			packet.taskClass === "visual-authority-change" &&
			packet.visual.authorityStatus === "VACANT" &&
			packet.packetStatus === "READY" &&
			milestone !== undefined &&
			(milestone.status === "READY" || milestone.status === "IN_PROGRESS");
		if (!/check:design-context/.test(packet.designContextCheck?.command ?? ""))
			errors.push(
				`${packetPath}: UI packet design-context command must run check:design-context`,
			);
		if (
			!packet.verification.orderedGates.some((gate) =>
				/accessibility/i.test(gate),
			)
		)
			errors.push(`${packetPath}: UI packet lacks an accessibility gate`);
		if (packet.visual.perceptualGate.status === "NOT_REQUIRED")
			errors.push(
				`${packetPath}: UI packet perceptual gate cannot be NOT_REQUIRED`,
			);
		if (requiresReadyUiGates) {
			if (packet.designContextCheck.status !== "PASS")
				errors.push(
					`${packetPath}: READY/executing UI packet design-context check is not PASS`,
				);
			if (!vacantConceptPhase) {
				if (packet.accessibilityGate.status !== "PASS")
					errors.push(
						`${packetPath}: READY/executing UI packet accessibility gate is not PASS`,
					);
				if (packet.visual.perceptualGate.status !== "PASS")
					errors.push(
						`${packetPath}: READY/executing UI packet perceptual gate is not PASS`,
					);
			}
			if (
				!["PASS", "NOT_REQUIRED"].includes(packet.visual.promotionGate.status)
			)
				errors.push(
					`${packetPath}: READY/executing UI packet promotion gate is not PASS or NOT_REQUIRED`,
				);
		}
		await validateVisualFrames({
			root,
			frames: packet.visual.currentFrames,
			label: `${packetPath} visual.currentFrames`,
			checkTracked,
			errors,
		});
		await validateVisualFrames({
			root,
			frames: packet.visual.referenceFrames,
			label: `${packetPath} visual.referenceFrames`,
			checkTracked,
			errors,
		});
		const explorationEnvelope = packet.visual.explorationEnvelope;
		if (explorationEnvelope !== undefined) {
			if (packet.visual.authorityStatus !== "VACANT")
				errors.push(
					`${packetPath}: visual.explorationEnvelope is only valid for authorityStatus VACANT`,
				);
			await validatePathReference({
				root,
				relativePath: explorationEnvelope.authorizingDecision,
				label: `${packetPath} visual.explorationEnvelope.authorizingDecision`,
				checkTracked,
				errors,
				allowHistorical: true,
			});
		}
		if (
			packet.taskClass === "visual-authority-change" &&
			/owner/i.test(packet.visual.surfaceKey)
		) {
			const ownerAuthority = (route.conditional ?? []).find(
				(authority) =>
					authority.role === "adr" &&
					authority.path ===
						"docs/adr/ADR-009-owner-composition-authority-supersession.md",
			);
			const hasAdr009 =
				ownerAuthority !== undefined &&
				(packet.authorities.required ?? []).some(
					(authority) =>
						authorityKey(authority) === authorityKey(ownerAuthority),
				);
			if (!hasAdr009)
				errors.push(
					`${packetPath}: Owner visual-authority packet must cite ADR-009`,
				);
			if (
				packet.visual.authorityStatus === "SUPERSEDED" &&
				["PAPER", "MANIFEST"].includes(packet.visual.acceptanceAuthority)
			) {
				errors.push(
					`${packetPath}: superseded Owner composition cannot be acceptance authority`,
				);
			}
		}
	}
}

async function listYamlFiles(root, relativeDirectory) {
	const details = await inspectPath(root, relativeDirectory);
	if (details.escape)
		throw new Error(
			`${relativeDirectory}: path resolves outside the repository: ${details.resolved}`,
		);
	if (details.unsafe)
		throw new Error(`${relativeDirectory}: ${details.unsafe}`);
	if (!details.exists) return [];
	if (!details.isDirectory)
		throw new Error(`${relativeDirectory} is not a directory`);
	return (await readdir(details.absolute))
		.filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
		.sort()
		.map((name) => `${relativeDirectory}/${name}`);
}

async function validateActiveHandoffs({ root, state, checkTracked, errors }) {
	for (const [milestoneId, milestone] of Object.entries(
		state?.milestones ?? {},
	)) {
		if (!OPEN_STATUSES.has(milestone.status)) continue;
		const label = `${milestoneId} active handoff`;
		if (
			typeof milestone.handoff !== "string" ||
			milestone.handoff.trim() === ""
		) {
			errors.push(`${label}: missing handoff pointer`);
			continue;
		}
		const details = await inspectPath(root, milestone.handoff);
		if (details.unsafe) {
			errors.push(`${label}: ${details.unsafe}`);
			continue;
		}
		if (details.escape) {
			errors.push(
				`${label}: path resolves outside the repository: ${milestone.handoff} -> ${details.resolved}`,
			);
			continue;
		}
		if (!details.exists) {
			if (details.caseMismatch)
				errors.push(
					`${label}: case-mismatched path ${milestone.handoff}; actual entry is ${details.actualCase}`,
				);
			else errors.push(`${label}: missing path ${milestone.handoff}`);
			continue;
		}
		if (details.isDirectory) {
			errors.push(`${label}: handoff pointer must target a file`);
			continue;
		}
		if (checkTracked && !trackedPath(root, details.normalized))
			errors.push(`${label}: untracked path ${details.normalized}`);
	}
}

async function validatePackets({
	root,
	state,
	history,
	registry,
	checkTracked,
	errors,
}) {
	await validateActiveHandoffs({ root, state, checkTracked, errors });
	let packetPaths;
	try {
		packetPaths = await listYamlFiles(root, PACKET_DIRECTORY);
	} catch (error) {
		errors.push(asError(error));
		return;
	}
	const packets = new Map();
	const badTaskClassPaths = new Set();
	const packetSchema = JSON.parse(
		await readText(root, "docs/schemas/task-packet.schema.json"),
	);
	const ajv = makeAjv();
	const validate = ajv.compile(packetSchema);
	for (const packetPath of packetPaths) {
		const packetDetails = await inspectPath(root, packetPath);
		if (packetDetails.escape) {
			errors.push(
				`${packetPath}: path resolves outside the repository: ${packetDetails.resolved}`,
			);
			continue;
		}
		if (packetDetails.unsafe) {
			errors.push(`${packetPath}: ${packetDetails.unsafe}`);
			continue;
		}
		if (!packetDetails.exists) {
			errors.push(
				`${packetPath}: discovered packet is missing or case-mismatched`,
			);
			continue;
		}
		if (packetDetails.isDirectory) {
			errors.push(`${packetPath}: discovered packet must be a file`);
			continue;
		}
		if (checkTracked && !trackedPath(root, packetDetails.normalized))
			errors.push(`${packetPath}: untracked packet`);
		let packet;
		try {
			packet = parseYaml(await readFile(packetDetails.absolute, "utf8"));
		} catch (error) {
			errors.push(`${packetPath}: YAML parse failed: ${asError(error)}`);
			continue;
		}
		if (
			packet &&
			Object.hasOwn(packet, "taskClass") &&
			!TASK_CLASSES.includes(packet.taskClass)
		) {
			badTaskClassPaths.add(packetPath);
			errors.push(
				`${packetPath}: taskClass ${JSON.stringify(packet.taskClass)} has no route`,
			);
			continue;
		}
		if (!validate(packet)) {
			errors.push(schemaErrors(packetPath, validate.errors));
			continue;
		}
		if (packets.has(packet.milestoneId))
			errors.push(`${packetPath}: duplicate packet for ${packet.milestoneId}`);
		packets.set(packet.milestoneId, packetPath);
		const expectedPath = `${PACKET_DIRECTORY}/${packet.milestoneId}.yaml`;
		if (packetPath !== expectedPath)
			errors.push(`${packetPath}: stable packet path must be ${expectedPath}`);
		await validatePacket({
			root,
			packet,
			packetPath,
			state,
			history,
			registry,
			checkTracked,
			errors,
		});
	}
	for (const [milestoneId, milestone] of Object.entries(
		state?.milestones ?? {},
	)) {
		const expectedPacketPath = stablePacketPath(milestoneId);
		const packetPath = milestone.taskPacket ?? expectedPacketPath;
		if (milestone.taskPacket && milestone.taskPacket !== expectedPacketPath)
			errors.push(
				`${milestoneId}: active taskPacket pointer must be the stable path ${expectedPacketPath}`,
			);
		if (!packets.has(milestoneId) && !badTaskClassPaths.has(packetPath)) {
			if (milestone.taskPacket !== undefined)
				errors.push(
					`${milestoneId}: active packet metadata points to no packet: ${packetPath}`,
				);
			else if (OPEN_STATUSES.has(milestone.status)) {
				errors.push(
					`${milestoneId}: active routing requires exactly one validated packet for an open milestone`,
				);
			}
		}
	}
}

export { validatePackets };
