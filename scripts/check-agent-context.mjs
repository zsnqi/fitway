// Validate FITWAY agent-context state, packets, routes, paths, and instructions.
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { validatePackets } from "./agent-context-packets.mjs";
import {
	asError,
	inspectPath,
	isGitRepository,
	trackedPath,
} from "./agent-context-paths.mjs";
import { validateRouteRegistry } from "./agent-context-references.mjs";
import {
	AGENTS_INSTRUCTION_CAP_BYTES,
	AGENTS_INSTRUCTION_WARN_BYTES,
	CONTEXT_FILES,
	HISTORY_FILE,
	TASK_CLASSES,
} from "./agent-context-rules.mjs";
import { makeAjv, readText, schemaErrors } from "./agent-context-schema.mjs";
import { checkRuleEnforcers } from "./agent-environment/rule-enforcers.mjs";
import { beginToolCommand } from "./agent-environment/tool-contract.mjs";
import {
	agentContextFailure,
	agentContextStartup,
	formatAgentContextResult,
	unknownMilestone,
} from "./check-agent-context-options.mjs";

export async function checkAgentContext({
	root = process.cwd(),
	milestoneId = null,
	checkTracked = true,
} = {}) {
	const repositoryRoot = path.resolve(root);
	const errors = checkRuleEnforcers({ root: repositoryRoot });
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
	if (milestoneId && state && !state.milestones?.[milestoneId])
		throw unknownMilestone(milestoneId, state.milestones);
	try {
		history = parseYaml(await readText(repositoryRoot, HISTORY_FILE));
	} catch (error) {
		errors.push(`${HISTORY_FILE} parse failed: ${asError(error)}`);
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
	if (state && registry)
		await validatePackets({
			root: repositoryRoot,
			state,
			history,
			registry,
			checkTracked,
			errors,
		});
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

const isMain =
	process.argv[1] &&
	fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
	const options = agentContextStartup(() =>
		beginToolCommand("check:agent-context", process.argv.slice(2)),
	);
	try {
		const result = await checkAgentContext(options);
		console.log(formatAgentContextResult(result, options));
		if (!result.ok) process.exitCode = 1;
	} catch (error) {
		console.error(agentContextFailure(error, asError(error)));
		process.exitCode = 1;
	}
}
