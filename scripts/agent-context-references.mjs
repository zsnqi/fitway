// Route, authority, reference, and visual-frame validation.

import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import {
	asError,
	inspectPath,
	isHistoricalPath,
	isIllegalStartupPath,
	normalizeHeading,
	normalizeRelativePath,
	sha256,
	trackedPath,
} from "./agent-context-paths.mjs";
import { TASK_CLASSES } from "./agent-context-rules.mjs";
import {
	getJsonPointer,
	getObjectPath,
	readText,
} from "./agent-context-schema.mjs";

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

export {
	authorityKey,
	routeForPacket,
	validateConditionalRuleSet,
	validatePathReference,
	validateRequiredAuthoritySet,
	validateRouteRegistry,
	validateVisualFrames,
};
