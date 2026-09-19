import { createHash } from "node:crypto";
import { readFile as readFileFromFs } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { inspectPath } from "./check-agent-context.mjs";

const root = process.cwd();
const PACKET_METADATA_FIELDS = ["taskClass", "taskPacket", "taskPacketSha256"];
const OPEN_STATUSES = new Set([
	"PLANNED",
	"READY",
	"IN_PROGRESS",
	"VALIDATING",
	"READY_FOR_INTEGRATION",
]);
const PACKET_STATUSES = new Set(["DRAFT", "READY", "CLOSED"]);
const TASK_PACKET_DIRECTORY = "docs/phase-records/task-packets";

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function stablePacketPath(milestoneId) {
	return `${TASK_PACKET_DIRECTORY}/${milestoneId}.yaml`;
}

function sameJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

async function inspectRepositoryPath(
	repositoryRoot,
	relativePath,
	inspectPathImpl = inspectPath,
	{ allowMissing = false, packet = false } = {},
) {
	const details = await inspectPathImpl(repositoryRoot, relativePath);
	if (details.unsafe) throw new Error(details.unsafe);
	if (details.escape)
		throw new Error(
			`path resolves outside the repository: ${relativePath} -> ${details.resolved}`,
		);
	if (details.error) throw new Error(details.error);
	if (!details.exists) {
		if (details.caseMismatch)
			throw new Error(
				`${packet ? "case-mismatched packet path" : "case-mismatched path"} ${relativePath}; actual entry is ${details.actualCase}`,
			);
		if (allowMissing) return null;
		throw new Error(`missing repository path: ${relativePath}`);
	}
	if (details.isDirectory)
		throw new Error(
			`${packet ? "packet path" : "repository path"} must target a file: ${relativePath}`,
		);
	return details;
}

export async function readRepositoryYaml(
	repositoryRoot,
	relativePath,
	{ inspectPathImpl = inspectPath, readFileImpl = readFileFromFs } = {},
) {
	const details = await inspectRepositoryPath(
		repositoryRoot,
		relativePath,
		inspectPathImpl,
	);
	return parseYaml(await readFileImpl(details.absolute, "utf8"));
}

function normalizePath(value) {
	const normalized = String(value).replaceAll("\\", "/");
	if (
		path.posix.isAbsolute(normalized) ||
		/^[A-Za-z]:\//.test(normalized) ||
		normalized.split("/").some((part) => part === "..")
	) {
		throw new Error(`unsafe repository path: ${value}`);
	}
	return normalized.replace(/^\.\//, "");
}

function packetMetadataMode(milestone, milestoneId) {
	const presentFields = PACKET_METADATA_FIELDS.filter((field) =>
		Object.hasOwn(milestone, field),
	);
	if (
		presentFields.length > 0 &&
		presentFields.length < PACKET_METADATA_FIELDS.length
	)
		throw new Error(
			`${milestoneId}: active milestone packet metadata must be all-or-none`,
		);
	return presentFields.length === PACKET_METADATA_FIELDS.length
		? "registered"
		: "compatibility";
}

function validateRegisteredPacket({
	milestoneId,
	milestone,
	packet,
	packetBytes,
	packetPath,
}) {
	if (!OPEN_STATUSES.has(milestone.status))
		throw new Error(
			`${packetPath}: packet is routed by a terminal active milestone ${milestoneId}`,
		);
	if (!PACKET_STATUSES.has(packet.packetStatus))
		throw new Error(`${packetPath}: packetStatus is invalid or missing`);
	if (packet.packetStatus === "CLOSED")
		throw new Error(
			`${packetPath}: active milestone ${milestoneId} cannot route a CLOSED packet`,
		);
	if (packet.packetStatus === "DRAFT" && milestone.status !== "PLANNED")
		throw new Error(
			`${packetPath}: DRAFT packet is only valid while active milestone is PLANNED`,
		);
	if (milestone.status !== "PLANNED" && packet.packetStatus !== "READY")
		throw new Error(
			`${packetPath}: active milestone status ${milestone.status} requires a READY packet`,
		);
	if (packet.milestoneId !== milestoneId)
		throw new Error(`${packetPath}: milestoneId differs from active milestone`);
	if (packet.taskClass !== milestone.taskClass)
		throw new Error(`${packetPath}: taskClass differs from active milestone`);
	if (packet.baseCommit !== milestone.baseCommit)
		throw new Error(`${packetPath}: baseCommit differs from active milestone`);
	if (packet.stateRef !== `PROJECT_STATE.yaml#/milestones/${milestoneId}`)
		throw new Error(
			`${packetPath}: stateRef does not identify the selected active milestone`,
		);
	for (const field of ["ownedPaths", "forbiddenPaths", "sharedLeases"]) {
		const packetPaths = packet.scope?.[field];
		const milestonePaths = milestone[field];
		if (
			!Array.isArray(packetPaths) ||
			!Array.isArray(milestonePaths) ||
			!sameJson(packetPaths, milestonePaths)
		)
			throw new Error(
				`${packetPath}: scope.${field} differs from active milestone`,
			);
	}
	if (packet.continuity?.currentHandoff !== milestone.handoff)
		throw new Error(
			`${packetPath}: continuity.currentHandoff differs from active handoff`,
		);
	if (sha256(packetBytes) !== milestone.taskPacketSha256)
		throw new Error(
			`${packetPath}: taskPacketSha256 differs from active milestone`,
		);
}

function selectorText(selector) {
	return `${selector?.kind ?? "unknown"}=${JSON.stringify(selector?.value ?? "")}`;
}

function parseArgs(args) {
	let milestoneId = null;
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--milestone") {
			milestoneId = args[++index];
			if (!milestoneId) throw new Error("--milestone requires a value");
		} else if (argument === "--help" || argument === "-h") {
			console.log(
				"Usage: node scripts/show-agent-context.mjs --milestone <id>",
			);
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	return milestoneId;
}

function printSource(lines, source, prefix = "") {
	lines.push(
		`${prefix}- ${source.role ? `${source.role}: ` : ""}${source.path} (${selectorText(source.selector)})`,
	);
	if (source.reason) lines.push(`${prefix}  reason: ${source.reason}`);
}

export function formatPacketAuthorities(lines, packet) {
	lines.push("packet required sources/selectors (exact packet):");
	for (const source of packet?.authorities?.required ?? [])
		printSource(lines, source);
	lines.push("packet conditional triggers (exact packet):");
	for (const source of packet?.authorities?.conditional ?? []) {
		lines.push(
			`- when ${source.trigger}: ${source.actionIfTriggered} ${source.role} ${source.path} (${selectorText(source.selector)})`,
		);
	}
}

export async function buildAgentContextPlan({
	repositoryRoot = root,
	milestoneId = null,
	inspectPathImpl = inspectPath,
	readFileImpl = readFileFromFs,
} = {}) {
	const readYaml = (relativePath) =>
		readRepositoryYaml(repositoryRoot, relativePath, {
			inspectPathImpl,
			readFileImpl,
		});
	const registry = await readYaml("docs/agent-context/ROUTES.yaml");
	const state = await readYaml("PROJECT_STATE.yaml");
	const active = state.milestones ?? {};
	const selectedId =
		milestoneId ??
		Object.entries(active).find(([, milestone]) =>
			[
				"PLANNED",
				"READY",
				"IN_PROGRESS",
				"VALIDATING",
				"READY_FOR_INTEGRATION",
			].includes(milestone.status),
		)?.[0];
	if (!selectedId) {
		return [
			"FITWAY bounded agent-context plan",
			"This output is a route plan only; it does not claim that any source was loaded, summarize authority, or resolve conflicts.",
			"No active milestone was selected.",
		].join("\n");
	}
	const milestone = active[selectedId];
	if (!milestone)
		throw new Error(
			`requested milestone does not exist in PROJECT_STATE.yaml: ${selectedId}`,
		);
	const metadataMode = packetMetadataMode(milestone, selectedId);
	const expectedPacketPath = stablePacketPath(selectedId);
	if (
		metadataMode === "registered" &&
		milestone.taskPacket !== expectedPacketPath
	)
		throw new Error(
			`${expectedPacketPath}: active milestone taskPacket must be the stable path ${expectedPacketPath}`,
		);
	const packetPath =
		metadataMode === "registered" ? milestone.taskPacket : expectedPacketPath;
	const safePacketPath = normalizePath(packetPath);
	const packetDetails = await inspectRepositoryPath(
		repositoryRoot,
		safePacketPath,
		inspectPathImpl,
		{ allowMissing: metadataMode === "compatibility", packet: true },
	);
	let packet = null;
	let packetSha256 = null;
	const packetMessages = [];
	if (!packetDetails) {
		packetMessages.push(`packet: ${safePacketPath} (absent)`);
		packetMessages.push(
			"compatibility warning: no active packet is available; packet context is not claimed",
		);
	} else {
		const packetBytes = await readFileImpl(packetDetails.absolute);
		packet = parseYaml(packetBytes.toString("utf8"));
		packetSha256 = sha256(packetBytes);
		if (metadataMode === "registered") {
			validateRegisteredPacket({
				milestoneId: selectedId,
				milestone,
				packet,
				packetBytes,
				packetPath: safePacketPath,
			});
		}
		packetMessages.push(`packet: ${safePacketPath}`);
		packetMessages.push(
			`packetStatus: ${packet.packetStatus ?? "(not recorded)"}`,
		);
		packetMessages.push(`packetSha256: ${packetSha256}`);
	}
	const taskClass = milestone.taskClass ?? null;
	const route = taskClass ? registry.routes?.[taskClass] : null;
	if (metadataMode === "registered" && !route)
		throw new Error(
			`active milestone taskClass ${taskClass} has no registered route`,
		);
	const lines = [
		"FITWAY bounded agent-context plan",
		"This output is a route plan only; it does not claim that any source was loaded, summarize authority, or resolve conflicts.",
	];
	lines.push(`milestone: ${selectedId}`);
	lines.push(`status: ${milestone.status}`);
	lines.push(`baseCommit: ${milestone.baseCommit ?? "(not recorded)"}`);
	lines.push(`handoff: ${milestone.handoff ?? "(none)"}`);
	lines.push(
		`taskClass: ${taskClass ?? "(not recorded; compatibility mode does not infer one)"}`,
	);
	lines.push(...packetMessages);
	if (packet) formatPacketAuthorities(lines, packet);
	if (!route) {
		lines.push(
			"route: unavailable because the active state does not record a task class",
		);
		lines.push(
			`registered task classes: ${Object.keys(registry.routes ?? {}).join(", ")}`,
		);
		lines.push(
			"stop conditions: missing or stale task class/packet must be resolved by the coordinator; do not infer authority",
		);
		return lines.join("\n");
	}
	lines.push(`route responsibility: ${route.responsibility}`);
	lines.push("destinations:");
	for (const destination of route.destinations ?? []) {
		lines.push(
			`- ${destination.kind}: ${destination.path} (${selectorText(destination.selector)})`,
		);
	}
	lines.push("required sources/selectors (resolve in this order):");
	for (const source of route.required ?? []) printSource(lines, source);
	lines.push("normal startup sources:");
	for (const source of route.normalStartup ?? []) printSource(lines, source);
	lines.push("conditional triggers (expand only when observed):");
	for (const source of route.conditional ?? []) {
		lines.push(
			`- when ${source.trigger}: ${source.actionIfTriggered} ${source.role} ${source.path} (${selectorText(source.selector)})`,
		);
	}
	lines.push("stop conditions:");
	lines.push(
		"- missing, untracked, case-mismatched, stale, or conflicting required path/selector",
	);
	lines.push(
		"- packet contradicts a cited authority, differs from active scope, or points outside the active milestone",
	);
	lines.push(
		"- conditional trigger requires NEEDS_HUMAN or a source whose status is unresolved",
	);
	lines.push(
		"- history is retrieved only through a named pointer; it is not normal startup context",
	);
	return lines.join("\n");
}

async function main() {
	const plan = await buildAgentContextPlan({
		repositoryRoot: root,
		milestoneId: parseArgs(process.argv.slice(2)),
	});
	console.log(plan);
}

const isMain =
	process.argv[1] &&
	fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
	try {
		await main();
	} catch (error) {
		console.error(
			`context:show FAILED: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
	}
}
