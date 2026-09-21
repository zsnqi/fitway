import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	lstat,
	readdir,
	readFile,
	readlink,
	realpath,
	stat,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";

export const AGENTS_INSTRUCTION_CAP_BYTES = 120_000;
// Conservative growth warning well below the documented cumulative instruction cap. It is a
// warning only: a routing invariant or the documented cap itself is what fails.
export const AGENTS_INSTRUCTION_WARN_BYTES = 24_000;
export const OPEN_STATUSES = new Set([
	"PLANNED",
	"READY",
	"IN_PROGRESS",
	"VALIDATING",
	"READY_FOR_INTEGRATION",
]);
export const TERMINAL_STATUSES = new Set([
	"DONE",
	"BLOCKED",
	"NEEDS_HUMAN",
	"FAILED_VALIDATION",
]);
export const TASK_CLASSES = [
	"analysis-review",
	"backend-api-data",
	"ui-maintenance",
	"visual-authority-change",
	"verification-independent",
	"resume-integration",
	"historical-audit",
	"repository-infrastructure",
];

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
const HISTORY_FILE = "PROJECT_STATE_HISTORY.yaml";
const PACKET_DIRECTORY = "docs/phase-records/task-packets";
const RECEIPT_DIRECTORY = "docs/phase-records/history-transitions";
const TASK_PACKET_PATH_PATTERN =
	/^docs\/phase-records\/task-packets\/[a-z0-9][a-z0-9-]{0,127}\.yaml$/;
const UI_TASK_CLASSES = new Set(["ui-maintenance", "visual-authority-change"]);
const PACKET_METADATA_FIELDS = ["taskClass", "taskPacket", "taskPacketSha256"];
const HISTORICAL_PREFIXES = [
	"docs/archive/",
	"docs/phase-records/",
	"PROJECT_STATE_HISTORY.yaml",
];
const ILLEGAL_STARTUP_SEGMENTS = ["evidence", "logs", "screenshots"];

function asError(value) {
	return value instanceof Error ? value.message : String(value);
}

function normalizeRelativePath(value) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error("path must be a non-empty repository-relative string");
	}
	const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
	if (
		path.posix.isAbsolute(normalized) ||
		/^[A-Za-z]:\//.test(normalized) ||
		normalized.split("/").some((part) => part === ".." || part === "")
	) {
		throw new Error(`path is not a safe repository-relative path: ${value}`);
	}
	return normalized;
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function stablePacketPath(milestoneId) {
	return `${PACKET_DIRECTORY}/${milestoneId}.yaml`;
}

function isValidTaskClass(value) {
	return typeof value === "string" && TASK_CLASSES.includes(value);
}

function isValidTaskPacketPath(value) {
	return typeof value === "string" && TASK_PACKET_PATH_PATTERN.test(value);
}

function isValidSha256(value) {
	return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isValidBaseCommit(value) {
	return (
		value === "SELF" ||
		(typeof value === "string" && /^[0-9a-f]{7,40}$/.test(value))
	);
}

function equalJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeHeading(value) {
	return String(value)
		.replace(/^\s*#{1,6}\s*/, "")
		.replace(/\s+#+\s*$/, "")
		.trim()
		.replace(/\s+/g, " ");
}

function isHistoricalPath(relativePath) {
	const normalized = relativePath.replaceAll("\\", "/");
	return HISTORICAL_PREFIXES.some(
		(prefix) => normalized === prefix || normalized.startsWith(prefix),
	);
}

function isIllegalStartupPath(relativePath) {
	const normalized = relativePath.replaceAll("\\", "/");
	if (isHistoricalPath(normalized)) return true;
	const segments = normalized.toLowerCase().split("/");
	return segments.some((segment) => ILLEGAL_STARTUP_SEGMENTS.includes(segment));
}

export async function inspectPath(root, relativePath) {
	let normalized;
	try {
		normalized = normalizeRelativePath(relativePath);
	} catch (error) {
		return { normalized: relativePath, exists: false, unsafe: asError(error) };
	}
	const rootRealPath = await realpath(root).catch((_error) => null);
	if (!rootRealPath) {
		return {
			normalized,
			exists: false,
			error: `repository root cannot be resolved: ${root}`,
		};
	}
	let current = root;
	const isOutsideRoot = (candidate) => {
		const relative = path.relative(rootRealPath, candidate);
		return (
			relative === ".." ||
			relative.startsWith(`..${path.sep}`) ||
			path.isAbsolute(relative)
		);
	};
	const segments = normalized.split("/");
	for (const segment of segments) {
		let entries;
		try {
			entries = await readdir(current);
		} catch (error) {
			if (error?.code === "ENOENT") {
				return { normalized, exists: false, caseMismatch: false };
			}
			return { normalized, exists: false, error: asError(error) };
		}
		if (!entries.includes(segment)) {
			const folded = entries.find(
				(entry) => entry.toLowerCase() === segment.toLowerCase(),
			);
			return {
				normalized,
				exists: false,
				caseMismatch: Boolean(folded),
				actualCase: folded,
			};
		}
		current = path.join(current, segment);
		try {
			const resolved = await realpath(current);
			if (isOutsideRoot(resolved)) {
				return {
					normalized,
					exists: false,
					escape: true,
					resolved,
				};
			}
		} catch (error) {
			if (error?.code !== "ENOENT") {
				return { normalized, exists: false, error: asError(error) };
			}
			try {
				if ((await lstat(current)).isSymbolicLink()) {
					const linkTarget = await readlink(current);
					const resolvedLink = path.resolve(path.dirname(current), linkTarget);
					if (isOutsideRoot(resolvedLink)) {
						return {
							normalized,
							exists: false,
							escape: true,
							resolved: resolvedLink,
						};
					}
				}
			} catch (linkError) {
				if (linkError?.code !== "ENOENT") {
					return { normalized, exists: false, error: asError(linkError) };
				}
			}
		}
	}
	try {
		const resolved = await realpath(current);
		if (isOutsideRoot(resolved)) {
			return { normalized, exists: false, escape: true, resolved };
		}
		const details = await stat(resolved);
		return {
			normalized,
			exists: true,
			isDirectory: details.isDirectory(),
			absolute: resolved,
		};
	} catch (error) {
		return { normalized, exists: false, error: asError(error) };
	}
}

function isGitRepository(root) {
	try {
		execFileSync("git", ["rev-parse", "--show-toplevel"], {
			cwd: root,
			stdio: ["ignore", "pipe", "ignore"],
		});
		return true;
	} catch {
		return false;
	}
}

function trackedPath(root, relativePath) {
	try {
		const output = execFileSync(
			"git",
			["ls-files", "--error-unmatch", "--", relativePath],
			{ cwd: root, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" },
		);
		return output.trim().length > 0;
	} catch {
		return false;
	}
}

function makeAjv() {
	const ajv = new Ajv2020({ allErrors: true, strict: true });
	addFormats(ajv);
	return ajv;
}

function schemaErrors(label, errors) {
	return `${label} schema validation failed: ${JSON.stringify(errors ?? [], null, 2)}`;
}

function getObjectPath(value, keyPath) {
	if (keyPath === "") return { found: true, value };
	const parts = keyPath
		.replace(/^\.?/, "")
		.split(".")
		.filter((part) => part.length > 0);
	let current = value;
	for (const part of parts) {
		if (
			current === null ||
			typeof current !== "object" ||
			!Object.hasOwn(current, part)
		) {
			return { found: false };
		}
		current = current[part];
	}
	return { found: true, value: current };
}

function decodeJsonPointer(pointer) {
	if (pointer === "") return [];
	if (!pointer.startsWith("/")) return null;
	return pointer
		.slice(1)
		.split("/")
		.map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function getJsonPointer(value, pointer) {
	const parts = decodeJsonPointer(pointer);
	if (parts === null) return { found: false };
	let current = value;
	for (const part of parts) {
		if (Array.isArray(current)) {
			if (
				part === "-" ||
				!/^\d+$/.test(part) ||
				Number(part) >= current.length
			) {
				return { found: false };
			}
			current = current[Number(part)];
			continue;
		}
		if (
			current === null ||
			typeof current !== "object" ||
			!Object.hasOwn(current, part)
		) {
			return { found: false };
		}
		current = current[part];
	}
	return { found: true, value: current };
}

async function readText(root, relativePath) {
	return await readFile(path.resolve(root, relativePath), "utf8");
}

async function validatePathReference({
	root,
	relativePath,
	selector,
	label,
	checkTracked,
	errors,
	allowHistorical = false,
}) {
	let normalized;
	try {
		normalized = normalizeRelativePath(relativePath);
	} catch (error) {
		errors.push(`${label}: ${asError(error)}`);
		return false;
	}
	if (isHistoricalPath(normalized) && !allowHistorical) {
		errors.push(
			`${label}: historical/provenance source requires an explicit exception: ${normalized}`,
		);
	}
	const details = await inspectPath(root, normalized);
	if (details.unsafe) {
		errors.push(`${label}: ${details.unsafe}`);
		return false;
	}
	if (details.escape) {
		errors.push(
			`${label}: path resolves outside the repository: ${normalized} -> ${details.resolved}`,
		);
		return false;
	}
	if (!details.exists) {
		if (details.caseMismatch) {
			errors.push(
				`${label}: case-mismatched path ${normalized}; actual entry is ${details.actualCase}`,
			);
		} else {
			errors.push(`${label}: missing path ${normalized}`);
		}
		return false;
	}
	if (checkTracked && !trackedPath(root, normalized)) {
		errors.push(`${label}: untracked path ${normalized}`);
	}
	if (!selector) return true;
	if (details.isDirectory) {
		errors.push(
			`${label}: selector ${selector.kind} cannot target directory ${normalized}`,
		);
		return false;
	}
	if (selector.kind === "whole-file") return true;
	let text;
	try {
		text = await readText(root, normalized);
	} catch (error) {
		errors.push(`${label}: cannot read ${normalized}: ${asError(error)}`);
		return false;
	}
	if (selector.kind === "markdown-heading") {
		const wanted = normalizeHeading(selector.value);
		const found = text
			.split(/\r?\n/)
			.filter((line) => /^\s{0,3}#{1,6}\s+/.test(line))
			.some((line) => normalizeHeading(line) === wanted);
		if (!found)
			errors.push(
				`${label}: missing Markdown heading selector ${JSON.stringify(selector.value)} in ${normalized}`,
			);
		return found;
	}
	let parsed;
	try {
		parsed =
			selector.kind === "json-pointer" ? JSON.parse(text) : parseYaml(text);
	} catch (error) {
		errors.push(
			`${label}: cannot parse ${normalized} for ${selector.kind}: ${asError(error)}`,
		);
		return false;
	}
	const result =
		selector.kind === "json-pointer"
			? getJsonPointer(parsed, selector.value)
			: getObjectPath(parsed, selector.value);
	if (!result.found) {
		errors.push(
			`${label}: missing ${selector.kind} selector ${JSON.stringify(selector.value)} in ${normalized}`,
		);
	}
	return result.found;
}

async function validateRouteRegistry({ root, registry, checkTracked, errors }) {
	if (
		!registry ||
		typeof registry.routes !== "object" ||
		registry.routes === null
	)
		return;
	const routeEntries = Object.entries(registry.routes);
	const known = new Set(TASK_CLASSES);
	for (const routeClass of TASK_CLASSES) {
		if (!Object.hasOwn(registry.routes, routeClass)) {
			errors.push(`ROUTES.yaml: missing required task class ${routeClass}`);
		}
	}
	for (const routeClass of Object.keys(registry.routes)) {
		if (!known.has(routeClass)) {
			errors.push(`ROUTES.yaml: unknown task class ${routeClass}`);
		}
	}
	for (const [routeClass, route] of routeEntries) {
		for (const source of route.normalStartup ?? []) {
			if (isIllegalStartupPath(source.path)) {
				errors.push(
					`${routeClass}.normalStartup: historical/evidence path is not normal startup context: ${source.path}`,
				);
				continue;
			}
			await validatePathReference({
				root,
				relativePath: source.path,
				selector: source.selector,
				label: `${routeClass}.normalStartup ${source.path}`,
				checkTracked,
				errors,
			});
		}
		for (const source of route.required ?? []) {
			await validatePathReference({
				root,
				relativePath: source.path,
				selector: source.selector,
				label: `${routeClass}.required ${source.role} ${source.path}`,
				checkTracked,
				errors,
				allowHistorical: Boolean(source.historicalException),
			});
		}
		for (const source of route.conditional ?? []) {
			await validatePathReference({
				root,
				relativePath: source.path,
				selector: source.selector,
				label: `${routeClass}.conditional ${source.role} ${source.path}`,
				checkTracked,
				errors,
				allowHistorical:
					source.role === "historical" || Boolean(source.historicalException),
			});
		}
		for (const destination of route.destinations ?? []) {
			try {
				normalizeRelativePath(
					destination.path.replace(/<[^>]+>/g, "placeholder"),
				);
			} catch (error) {
				errors.push(
					`${routeClass}.destination ${destination.kind}: ${asError(error)}`,
				);
			}
		}
	}
}

function validateExceptionShape(exceptions, errors) {
	if (
		exceptions?.schemaVersion !== 1 ||
		!Array.isArray(exceptions.exceptions)
	) {
		errors.push(
			"HISTORY_POINTER_EXCEPTIONS.yaml: expected schemaVersion 1 and exceptions array",
		);
		return [];
	}
	const seen = new Set();
	for (const [index, exception] of exceptions.exceptions.entries()) {
		const label = `HISTORY_POINTER_EXCEPTIONS.yaml exception ${index}`;
		for (const field of [
			"recordPath",
			"brokenTarget",
			"reason",
			"disposition",
			"reviewer",
		]) {
			if (
				typeof exception?.[field] !== "string" ||
				exception[field].trim() === ""
			) {
				errors.push(`${label}: missing non-empty ${field}`);
			}
		}
		if (
			exception?.replacement !== undefined &&
			typeof exception.replacement !== "string"
		) {
			errors.push(`${label}: replacement must be a path string when present`);
		}
		if (seen.has(exception?.recordPath))
			errors.push(`${label}: duplicate recordPath ${exception.recordPath}`);
		seen.add(exception?.recordPath);
	}
	return exceptions.exceptions;
}

async function checkHistoricalPointers({
	root,
	history,
	exceptions,
	checkTracked,
	errors,
	warnings,
}) {
	const exceptionByRecord = new Map(
		exceptions.map((entry) => [entry.recordPath, entry]),
	);
	const seenBroken = new Set();
	for (const [milestoneId, milestone] of Object.entries(
		history?.milestones ?? {},
	)) {
		if (
			typeof milestone?.handoff !== "string" ||
			milestone.handoff.trim() === ""
		)
			continue;
		const recordPath = `${HISTORY_FILE}#/milestones/${milestoneId}/handoff`;
		const details = await inspectPath(root, milestone.handoff);
		const exception = exceptionByRecord.get(recordPath);
		if (!checkTracked && details.exists && exception) {
			seenBroken.add(recordPath);
			warnings.push(
				`historical pointer exception admitted without tracking classification: ${recordPath} -> ${milestone.handoff}`,
			);
			continue;
		}
		const targetIsTracked =
			details.exists &&
			(!checkTracked || trackedPath(root, details.normalized));
		if (targetIsTracked) {
			// Historical records are immutable provenance. A target that is present in the
			// candidate index keeps the current stale-exception behavior. When tracking checks
			// are disabled, existence is the only meaningful fixture signal.
			continue;
		}
		if (!exception) {
			const targetState = details.exists
				? "untracked target"
				: "missing target";
			errors.push(
				`historical handoff ${recordPath}: ${targetState} ${milestone.handoff} has no exception`,
			);
			continue;
		}
		seenBroken.add(recordPath);
		if (
			exception.brokenTarget !== details.normalized &&
			exception.brokenTarget !== milestone.handoff
		) {
			errors.push(
				`${recordPath}: exception target does not match ${milestone.handoff}`,
			);
		}
		warnings.push(
			`${details.exists ? "historical pointer exception admitted for untracked target" : "historical pointer exception admitted"}: ${recordPath} -> ${milestone.handoff}`,
		);
		if (exception.replacement) {
			await validatePathReference({
				root,
				relativePath: exception.replacement,
				selector: { kind: "whole-file", value: "" },
				label: `${recordPath} replacement`,
				checkTracked,
				errors,
				allowHistorical: true,
			});
		}
	}
	for (const exception of exceptions) {
		if (seenBroken.has(exception.recordPath)) continue;
		const match =
			/^PROJECT_STATE_HISTORY\.yaml#\/milestones\/([^/]+)\/handoff$/.exec(
				exception.recordPath,
			);
		if (!match || !Object.hasOwn(history?.milestones ?? {}, match[1])) {
			errors.push(
				`historical pointer exception points to no history record: ${exception.recordPath}`,
			);
			continue;
		}
		const target = history.milestones[match[1]]?.handoff;
		const details = await inspectPath(root, target);
		const targetIsTracked =
			checkTracked && details.exists && trackedPath(root, details.normalized);
		if (targetIsTracked)
			errors.push(
				`historical pointer exception is stale; target now exists: ${target}`,
			);
	}
}

function routeForPacket(registry, taskClass) {
	return registry?.routes?.[taskClass] ?? null;
}

function authorityKey(authority) {
	return JSON.stringify({
		role: authority.role,
		path: authority.path,
		selector: {
			kind: authority.selector?.kind,
			value: authority.selector?.value,
		},
	});
}

function validateRequiredAuthoritySet({
	packetPath,
	routeRequired,
	routeConditionals,
	packetRequired,
	errors,
}) {
	const registered = new Set(
		(routeRequired ?? []).map((authority) => authorityKey(authority)),
	);
	const promotable = new Set(
		(routeConditionals ?? []).map((authority) => authorityKey(authority)),
	);
	const registeredRoles = new Set([
		...(routeRequired ?? []).map((authority) => authority.role),
		...(routeConditionals ?? []).map((authority) => authority.role),
	]);
	const packetKeys = new Set();
	for (const authority of packetRequired ?? []) {
		const key = authorityKey(authority);
		if (packetKeys.has(key))
			errors.push(
				`${packetPath}: duplicate required authority ${authority.role} -> ${authority.path}`,
			);
		packetKeys.add(key);
		if (!registered.has(key) && !promotable.has(key)) {
			if (authority.role === "historical")
				errors.push(
					`${packetPath}: supplemental historical authority must match an exact registered required or promoted key: ${authority.path}`,
				);
			else if (!registeredRoles.has(authority.role))
				errors.push(
					`${packetPath}: required authority role is not registered for this route: ${authority.role} -> ${authority.path}`,
				);
		}
	}
	for (const authority of routeRequired ?? []) {
		if (!packetKeys.has(authorityKey(authority)))
			errors.push(
				`${packetPath}: required route authority is absent or mismatched: ${authority.role} -> ${authority.path}`,
			);
	}
}

function conditionalRuleKey(rule) {
	return JSON.stringify({
		trigger: rule.trigger,
		role: rule.role,
		path: rule.path,
		selector: {
			kind: rule.selector?.kind,
			value: rule.selector?.value,
		},
		actionIfTriggered: rule.actionIfTriggered,
	});
}

function validateConditionalRuleSet({
	packetPath,
	routeConditionals,
	packetConditionals,
	errors,
}) {
	const registered = new Map(
		(routeConditionals ?? []).map((rule) => [conditionalRuleKey(rule), rule]),
	);
	const packet = new Map(
		(packetConditionals ?? []).map((rule) => [conditionalRuleKey(rule), rule]),
	);
	for (const rule of routeConditionals ?? []) {
		if (!packet.has(conditionalRuleKey(rule))) {
			errors.push(
				`${packetPath}: packet conditionals omit registered rule ${rule.trigger} -> ${rule.path}`,
			);
		}
	}
	for (const rule of packetConditionals ?? []) {
		if (!registered.has(conditionalRuleKey(rule))) {
			errors.push(
				`${packetPath}: packet conditional is not registered for ${rule.trigger} -> ${rule.path}`,
			);
		}
	}
	if (packet.size !== (routeConditionals ?? []).length) {
		errors.push(
			`${packetPath}: packet conditional set must exactly match the registered route conditional set`,
		);
	}
}

async function validateVisualFrames({
	root,
	frames,
	label,
	checkTracked,
	errors,
}) {
	for (const [index, frame] of (frames ?? []).entries()) {
		const relativePath = frame.path;
		const details = await inspectPath(root, relativePath);
		if (details.escape) {
			errors.push(
				`${label}[${index}]: path resolves outside the repository: ${relativePath} -> ${details.resolved}`,
			);
			continue;
		}
		if (!details.exists || details.isDirectory) {
			errors.push(`${label}[${index}]: missing frame ${relativePath}`);
			continue;
		}
		if (checkTracked && !trackedPath(root, details.normalized)) {
			errors.push(`${label}[${index}]: untracked frame ${details.normalized}`);
		}
		const actual = sha256(await readFile(details.absolute));
		if (actual !== frame.sha256)
			errors.push(
				`${label}[${index}]: SHA-256 mismatch for ${details.normalized}`,
			);
	}
}

async function validatePacket({
	root,
	packet,
	packetPath,
	packetAbsolutePath,
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
	const route = routeForPacket(registry, packet.taskClass);
	if (!route) {
		errors.push(`${packetPath}: taskClass ${packet.taskClass} has no route`);
		return;
	}
	if (!milestone) {
		if (packet.packetStatus !== "CLOSED") {
			errors.push(`${packetPath}: packet points to no active milestone`);
		} else if (!historyMilestone) {
			errors.push(
				`${packetPath}: CLOSED packet requires a matching terminal history milestone ${packet.milestoneId}`,
			);
		} else if (!TERMINAL_STATUSES.has(historyMilestone.status)) {
			errors.push(
				`${packetPath}: CLOSED packet history milestone ${packet.milestoneId} must be terminal, got ${historyMilestone.status}`,
			);
		} else {
			for (const field of [
				"taskClass",
				"taskPacket",
				"taskPacketSha256",
				"baseCommit",
				"ownedPaths",
				"forbiddenPaths",
				"sharedLeases",
				"handoff",
			]) {
				if (!Object.hasOwn(historyMilestone, field))
					errors.push(
						`${packetPath}: CLOSED packet history is missing ${field}`,
					);
			}
			const expectedPacketPath = stablePacketPath(packet.milestoneId);
			if (!isValidTaskClass(historyMilestone.taskClass))
				errors.push(
					`${packetPath}: CLOSED packet history taskClass is invalid or missing`,
				);
			if (!isValidTaskPacketPath(historyMilestone.taskPacket))
				errors.push(
					`${packetPath}: CLOSED packet history taskPacket is invalid or missing`,
				);
			if (historyMilestone.taskPacket !== expectedPacketPath)
				errors.push(
					`${packetPath}: CLOSED packet history taskPacket must be the stable path ${expectedPacketPath}`,
				);
			if (historyMilestone.taskPacket !== packetPath)
				errors.push(
					`${packetPath}: taskPacket differs from closed history milestone`,
				);
			if (!isValidSha256(historyMilestone.taskPacketSha256))
				errors.push(
					`${packetPath}: CLOSED packet history taskPacketSha256 is invalid or missing`,
				);
			else if (
				sha256(await readFile(packetAbsolutePath)) !==
				historyMilestone.taskPacketSha256
			)
				errors.push(
					`${packetPath}: taskPacketSha256 differs from closed history milestone`,
				);
			if (packet.taskClass !== historyMilestone.taskClass)
				errors.push(
					`${packetPath}: taskClass differs from closed history milestone`,
				);
			if (!isValidBaseCommit(historyMilestone.baseCommit))
				errors.push(
					`${packetPath}: CLOSED packet history baseCommit is invalid or missing`,
				);
			if (packet.baseCommit !== historyMilestone.baseCommit)
				errors.push(
					`${packetPath}: baseCommit differs from closed history milestone`,
				);
			for (const field of ["ownedPaths", "forbiddenPaths", "sharedLeases"]) {
				if (!Array.isArray(historyMilestone[field]))
					errors.push(
						`${packetPath}: CLOSED packet history ${field} is invalid or missing`,
					);
				else if (!equalJson(packet.scope[field], historyMilestone[field]))
					errors.push(
						`${packetPath}: scope.${field} differs from closed history milestone`,
					);
			}
			if (
				!Object.hasOwn(historyMilestone, "handoff") ||
				packet.continuity.currentHandoff !== historyMilestone.handoff
			)
				errors.push(
					`${packetPath}: continuity.currentHandoff differs from closed history handoff`,
				);
		}
	} else {
		if (!OPEN_STATUSES.has(milestone.status)) {
			errors.push(
				`${packetPath}: packet is routed by a terminal active milestone ${packet.milestoneId}`,
			);
		}
		if (packet.packetStatus === "CLOSED") {
			errors.push(
				`${packetPath}: active milestone ${packet.milestoneId} cannot route a CLOSED packet`,
			);
		}
		if (packet.packetStatus === "DRAFT" && milestone.status !== "PLANNED") {
			errors.push(
				`${packetPath}: DRAFT packet is only valid while active milestone is PLANNED`,
			);
		}
		const presentMetadataFields = PACKET_METADATA_FIELDS.filter((field) =>
			Object.hasOwn(milestone, field),
		);
		if (
			presentMetadataFields.length > 0 &&
			presentMetadataFields.length < PACKET_METADATA_FIELDS.length
		)
			errors.push(
				`${packetPath}: active milestone packet metadata must be all-or-none`,
			);
		if (milestone.status !== "PLANNED" && packet.packetStatus !== "READY") {
			errors.push(
				`${packetPath}: active milestone status ${milestone.status} requires a READY packet`,
			);
		}
		if (!isValidTaskClass(milestone.taskClass))
			errors.push(
				`${packetPath}: active milestone taskClass must be one of the registered task classes`,
			);
		if (!isValidTaskPacketPath(milestone.taskPacket))
			errors.push(
				`${packetPath}: active milestone must record a stable taskPacket path`,
			);
		if (!isValidSha256(milestone.taskPacketSha256))
			errors.push(
				`${packetPath}: active milestone must record a lowercase taskPacketSha256`,
			);
		const expectedPacketPath = stablePacketPath(packet.milestoneId);
		if (milestone.taskPacket !== expectedPacketPath)
			errors.push(
				`${packetPath}: active milestone taskPacket must be the stable path ${expectedPacketPath}`,
			);
		if (packet.baseCommit !== milestone.baseCommit)
			errors.push(`${packetPath}: baseCommit differs from active milestone`);
		if (
			packet.taskClass !== milestone.taskClass &&
			milestone.taskClass !== undefined
		)
			errors.push(`${packetPath}: taskClass differs from active milestone`);
		for (const field of ["ownedPaths", "forbiddenPaths", "sharedLeases"]) {
			if (!equalJson(packet.scope[field], milestone[field]))
				errors.push(
					`${packetPath}: scope.${field} differs from active milestone`,
				);
		}
		if (milestone.taskPacket && milestone.taskPacket !== packetPath)
			errors.push(`${packetPath}: active milestone taskPacket pointer differs`);
		if (isValidSha256(milestone.taskPacketSha256)) {
			const actual = sha256(await readFile(packetAbsolutePath));
			if (actual !== milestone.taskPacketSha256)
				errors.push(
					`${packetPath}: taskPacketSha256 differs from active milestone`,
				);
		}
		if (packet.continuity.currentHandoff !== milestone.handoff)
			errors.push(
				`${packetPath}: continuity.currentHandoff differs from active handoff`,
			);
	}
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
			if (packet.accessibilityGate.status !== "PASS")
				errors.push(
					`${packetPath}: READY/executing UI packet accessibility gate is not PASS`,
				);
			if (packet.visual.perceptualGate.status !== "PASS")
				errors.push(
					`${packetPath}: READY/executing UI packet perceptual gate is not PASS`,
				);
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
	warnings,
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
			packetAbsolutePath: packetDetails.absolute,
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
		const presentMetadataFields = PACKET_METADATA_FIELDS.filter((field) =>
			Object.hasOwn(milestone, field),
		);
		if (
			presentMetadataFields.length > 0 &&
			presentMetadataFields.length < PACKET_METADATA_FIELDS.length
		)
			errors.push(
				`${milestoneId}: active milestone packet metadata must be all-or-none`,
			);
		const expectedPacketPath = stablePacketPath(milestoneId);
		const packetPath = milestone.taskPacket ?? expectedPacketPath;
		if (milestone.taskPacket && milestone.taskPacket !== expectedPacketPath)
			errors.push(
				`${milestoneId}: active taskPacket pointer must be the stable path ${expectedPacketPath}`,
			);
		if (!packets.has(milestoneId)) {
			if (presentMetadataFields.length > 0)
				errors.push(
					`${milestoneId}: active packet metadata points to no packet: ${packetPath}`,
				);
			else if (OPEN_STATUSES.has(milestone.status)) {
				if (registry.mode === "active")
					errors.push(
						`${milestoneId}: active routing requires exactly one validated packet for an open milestone`,
					);
				else
					warnings.push(
						`${milestoneId}: no active task packet; compatibility mode skips packet validation`,
					);
			}
		}
	}
}

export async function validateReceiptChain({
	root,
	checkTracked = true,
	errors = [],
}) {
	const details = await inspectPath(root, RECEIPT_DIRECTORY);
	if (details.escape) {
		errors.push(
			`${RECEIPT_DIRECTORY}: path resolves outside the repository: ${details.resolved}`,
		);
		return { receiptPaths: [], errors };
	}
	if (details.unsafe) {
		errors.push(`${RECEIPT_DIRECTORY}: ${details.unsafe}`);
		return { receiptPaths: [], errors };
	}
	if (!details.exists) return { receiptPaths: [], errors };
	if (!details.isDirectory) {
		errors.push(`${RECEIPT_DIRECTORY}: expected a directory`);
		return { receiptPaths: [], errors };
	}
	const receiptPaths = (await readdir(details.absolute))
		.filter((name) => name.endsWith(".json"))
		.sort()
		.map((name) => `${RECEIPT_DIRECTORY}/${name}`);
	const schema = JSON.parse(
		await readText(root, "docs/schemas/history-transition-receipt.schema.json"),
	);
	const ajv = makeAjv();
	const validate = ajv.compile(schema);
	let previousPath = null;
	let previousHash = null;
	for (const receiptPath of receiptPaths) {
		const receiptDetails = await inspectPath(root, receiptPath);
		if (receiptDetails.escape) {
			errors.push(
				`${receiptPath}: path resolves outside the repository: ${receiptDetails.resolved}`,
			);
			continue;
		}
		if (receiptDetails.unsafe) {
			errors.push(`${receiptPath}: ${receiptDetails.unsafe}`);
			continue;
		}
		if (!receiptDetails.exists) {
			errors.push(
				`${receiptPath}: discovered receipt is missing or case-mismatched`,
			);
			continue;
		}
		if (receiptDetails.isDirectory) {
			errors.push(`${receiptPath}: discovered receipt must be a file`);
			continue;
		}
		if (checkTracked && !trackedPath(root, receiptDetails.normalized))
			errors.push(`${receiptPath}: untracked receipt`);
		let receipt;
		let bytes;
		try {
			bytes = await readFile(receiptDetails.absolute);
			receipt = JSON.parse(bytes.toString("utf8"));
		} catch (error) {
			errors.push(`${receiptPath}: JSON parse failed: ${asError(error)}`);
			continue;
		}
		if (!validate(receipt))
			errors.push(schemaErrors(receiptPath, validate.errors));
		const currentHash = sha256(bytes);
		if (previousPath === null && receipt.kind !== "history-genesis-receipt")
			errors.push(
				`${receiptPath}: receipt chain must begin with a genesis receipt`,
			);
		if (previousPath !== null && receipt.previousReceiptSha256 !== previousHash)
			errors.push(
				`${receiptPath}: previousReceiptSha256 does not match ${previousPath}`,
			);
		previousPath = receiptPath;
		previousHash = currentHash;
	}
	return { receiptPaths, errors };
}

export async function checkAgentContext({
	root = process.cwd(),
	milestoneId = null,
	checkTracked = true,
} = {}) {
	const repositoryRoot = path.resolve(root);
	const errors = [];
	const warnings = [];
	if (checkTracked && !isGitRepository(repositoryRoot)) {
		warnings.push("Git tracking checks are unavailable outside a Git worktree");
		checkTracked = false;
	}
	const contextDetails = await inspectPath(
		repositoryRoot,
		"docs/agent-context/ROUTES.yaml",
	);
	let registry = null;
	let state = null;
	let history = null;
	let exceptions = [];
	for (const relativePath of CONTEXT_FILES) {
		const details = await inspectPath(repositoryRoot, relativePath);
		if (!details.exists) {
			errors.push(`required context path missing: ${relativePath}`);
			continue;
		}
		if (details.caseMismatch)
			errors.push(`required context path case mismatch: ${relativePath}`);
		if (checkTracked && !trackedPath(repositoryRoot, relativePath))
			errors.push(`required context path untracked: ${relativePath}`);
	}
	if (contextDetails.exists) {
		try {
			registry = parseYaml(
				await readText(repositoryRoot, "docs/agent-context/ROUTES.yaml"),
			);
			const schema = JSON.parse(
				await readText(
					repositoryRoot,
					"docs/schemas/agent-context-routes.schema.json",
				),
			);
			const ajv = makeAjv();
			const validate = ajv.compile(schema);
			if (!validate(registry))
				errors.push(schemaErrors("ROUTES.yaml", validate.errors));
		} catch (error) {
			errors.push(`ROUTES.yaml/schema load failed: ${asError(error)}`);
		}
	}
	try {
		state = parseYaml(await readText(repositoryRoot, "PROJECT_STATE.yaml"));
	} catch (error) {
		errors.push(`PROJECT_STATE.yaml parse failed: ${asError(error)}`);
	}
	try {
		history = parseYaml(await readText(repositoryRoot, HISTORY_FILE));
	} catch (error) {
		errors.push(`${HISTORY_FILE} parse failed: ${asError(error)}`);
	}
	try {
		exceptions = validateExceptionShape(
			parseYaml(
				await readText(
					repositoryRoot,
					"docs/agent-context/HISTORY_POINTER_EXCEPTIONS.yaml",
				),
			),
			errors,
		);
	} catch (error) {
		errors.push(
			`HISTORY_POINTER_EXCEPTIONS.yaml parse failed: ${asError(error)}`,
		);
	}
	const agentsDetails = await inspectPath(repositoryRoot, "AGENTS.md");
	if (agentsDetails.exists && !agentsDetails.isDirectory) {
		const agentsText = await readText(repositoryRoot, "AGENTS.md");
		const agentsBytes = (
			await readFile(path.resolve(repositoryRoot, "AGENTS.md"))
		).byteLength;
		if (agentsBytes > AGENTS_INSTRUCTION_CAP_BYTES)
			errors.push(
				`AGENTS.md exceeds documented instruction cap of ${AGENTS_INSTRUCTION_CAP_BYTES} bytes`,
			);
		else if (agentsBytes > AGENTS_INSTRUCTION_WARN_BYTES)
			warnings.push(
				`AGENTS.md is ${agentsBytes} bytes, above the conservative ${AGENTS_INSTRUCTION_WARN_BYTES}-byte warning threshold and below the ${AGENTS_INSTRUCTION_CAP_BYTES}-byte documented cap`,
			);
		const mentions = [
			...agentsText.matchAll(
				/(?:taskClass|route)\s*[:=]\s*`?([a-z][a-z0-9-]*)/gi,
			),
		].map((match) => match[1]);
		for (const mention of mentions)
			if (!TASK_CLASSES.includes(mention))
				errors.push(`AGENTS.md references unknown route ${mention}`);
	}
	if (registry)
		await validateRouteRegistry({
			root: repositoryRoot,
			registry,
			checkTracked,
			errors,
		});
	if (history)
		await checkHistoricalPointers({
			root: repositoryRoot,
			history,
			exceptions,
			checkTracked,
			errors,
			warnings,
		});
	if (state && registry)
		await validatePackets({
			root: repositoryRoot,
			state,
			history,
			registry,
			checkTracked,
			errors,
			warnings,
		});
	await validateReceiptChain({ root: repositoryRoot, checkTracked, errors });
	if (milestoneId && state && !state.milestones?.[milestoneId])
		errors.push(
			`requested milestone does not exist in active state: ${milestoneId}`,
		);
	return {
		ok: errors.length === 0,
		errors,
		warnings,
		registry,
		state,
		history,
		root: repositoryRoot,
		trackedChecks: checkTracked,
	};
}

export function formatAgentContextResult(result) {
	const lines = [];
	for (const warning of result.warnings ?? [])
		lines.push(`WARNING: ${warning}`);
	if (result.ok) {
		lines.push(
			`check-agent-context passed: ${Object.keys(result.registry?.routes ?? {}).length} task classes; startup routing mode: ${result.registry?.mode ?? "unknown"}.`,
		);
	} else {
		lines.push("check-agent-context FAILED:");
		for (const error of result.errors ?? []) lines.push(`- ${error}`);
	}
	return lines.join("\n");
}

function parseArgs(args) {
	let milestoneId = null;
	let checkTracked = true;
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--milestone") {
			milestoneId = args[++index];
			if (!milestoneId) throw new Error("--milestone requires a value");
		} else if (argument === "--no-tracked") {
			checkTracked = false;
		} else if (argument === "--help" || argument === "-h") {
			console.log(
				"Usage: node scripts/check-agent-context.mjs [--milestone <id>] [--no-tracked]",
			);
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	return { milestoneId, checkTracked };
}

const isMain =
	process.argv[1] &&
	fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
	try {
		const result = await checkAgentContext(parseArgs(process.argv.slice(2)));
		console.log(formatAgentContextResult(result));
		if (!result.ok) process.exitCode = 1;
	} catch (error) {
		console.error(`check-agent-context FAILED: ${asError(error)}`);
		process.exitCode = 1;
	}
}
