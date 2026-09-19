import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { inspectPath } from "./check-agent-context.mjs";

const root = process.cwd();

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

export async function readRepositoryYaml(repositoryRoot, relativePath) {
	const details = await inspectPath(repositoryRoot, relativePath);
	if (details.unsafe) throw new Error(details.unsafe);
	if (details.escape)
		throw new Error(
			`path resolves outside the repository: ${relativePath} -> ${details.resolved}`,
		);
	if (!details.exists) {
		if (details.caseMismatch)
			throw new Error(
				`case-mismatched path ${relativePath}; actual entry is ${details.actualCase}`,
			);
		throw new Error(`missing repository path: ${relativePath}`);
	}
	if (details.isDirectory)
		throw new Error(`repository path must target a file: ${relativePath}`);
	return parseYaml(await readFile(details.absolute, "utf8"));
}

async function readYaml(relativePath) {
	return readRepositoryYaml(root, relativePath);
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

async function main() {
	const milestoneId = parseArgs(process.argv.slice(2));
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
	const lines = [
		"FITWAY bounded agent-context plan",
		"This output is a route plan only; it does not claim that any source was loaded, summarize authority, or resolve conflicts.",
	];
	if (!selectedId) {
		lines.push("No active milestone was selected.");
		console.log(lines.join("\n"));
		return;
	}
	const milestone = active[selectedId];
	if (!milestone)
		throw new Error(
			`requested milestone does not exist in PROJECT_STATE.yaml: ${selectedId}`,
		);
	const taskClass = milestone.taskClass ?? null;
	const route = taskClass ? registry.routes?.[taskClass] : null;
	lines.push(`milestone: ${selectedId}`);
	lines.push(`status: ${milestone.status}`);
	lines.push(`baseCommit: ${milestone.baseCommit ?? "(not recorded)"}`);
	lines.push(`handoff: ${milestone.handoff ?? "(none)"}`);
	lines.push(
		`taskClass: ${taskClass ?? "(not recorded; compatibility mode does not infer one)"}`,
	);
	const packetPath =
		milestone.taskPacket ??
		`docs/phase-records/task-packets/${selectedId}.yaml`;
	const safePacketPath = normalizePath(packetPath);
	let packet = null;
	try {
		const packetDetails = await inspectPath(root, safePacketPath);
		if (packetDetails.unsafe) throw new Error(packetDetails.unsafe);
		if (packetDetails.escape)
			throw new Error(
				`path resolves outside the repository: ${safePacketPath} -> ${packetDetails.resolved}`,
			);
		if (!packetDetails.exists) {
			if (packetDetails.caseMismatch)
				throw new Error(
					`case-mismatched packet path ${safePacketPath}; actual entry is ${packetDetails.actualCase}`,
				);
			throw Object.assign(new Error("packet absent"), { code: "ENOENT" });
		}
		if (packetDetails.isDirectory)
			throw new Error(`packet path must target a file: ${safePacketPath}`);
		const packetBytes = await readFile(packetDetails.absolute);
		packet = parseYaml(packetBytes.toString("utf8"));
		lines.push(`packet: ${safePacketPath}`);
		lines.push(`packetStatus: ${packet.packetStatus ?? "(not recorded)"}`);
		lines.push(`packetSha256: ${sha256(packetBytes)}`);
	} catch (error) {
		if (error?.code === "ENOENT") {
			lines.push(`packet: ${safePacketPath} (absent)`);
			lines.push(
				"compatibility warning: no active packet is available; packet context is not claimed",
			);
		} else {
			throw error;
		}
	}
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
		console.log(lines.join("\n"));
		return;
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
	console.log(lines.join("\n"));
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
