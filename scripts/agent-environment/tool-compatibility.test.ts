import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { removeWorktreeOptions } from "../../.agents/skills/gardener/remove-worktree.mjs";
import { parseOptions as surveyOptions } from "../../.agents/skills/gardener/survey.mjs";
import { ownerCommandOptions } from "../../.agents/skills/verify-fitway/cli.mjs";
import { agentContextOptions } from "../check-agent-context-options.mjs";
import { conceptCssArguments } from "../check-concept-css.mjs";
import { contextShowMilestone } from "../show-agent-context.mjs";
import { verificationOptions } from "../verify.mjs";
import { repositoryOptions } from "../verify-repository-options.mjs";
import { advanceOptions } from "./advance-main.mjs";
import { parseBriefArgs } from "./check-brief.mjs";
import { codeHealthOptions } from "./check-code-health.mjs";
import { codexOptions } from "./codex-round.mjs";
import { toolingMapOptions } from "./generate-tooling-map.mjs";
import { parseHandoffArgs } from "./new-handoff.mjs";
import { startLoadOptions } from "./start-load.mjs";
import { resolveToolArguments } from "./tool-contract.mjs";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

// E1: the argument forms each command's parser accepted at 57dad1c0, with the options its
// logic received, are a fixed table (tool-compatibility.json). Each row runs through the shared
// resolver and the command's own argument step, so a form the registry or a step loses fails here
// by name, whatever the registry now declares.

type Parsed = ReturnType<typeof resolveToolArguments>;
type Row = {
	args: string[];
	env?: Record<string, string | null>;
	expect: unknown;
};
type Table = {
	commandsWithoutRows: Record<string, string>;
	rows: Record<string, Row[]>;
};

const repository = fileURLToPath(new URL("../../", import.meta.url));
const table: Table = JSON.parse(
	fs.readFileSync(
		new URL("./tool-compatibility.json", import.meta.url),
		"utf8",
	),
);
const REPOSITORY_TOKEN = "<repo>";
const DEFAULT_RUN_TOKEN = "<default-run>";

// Commands that take no arguments have no step of their own: their logic reads nothing from the
// resolver's result, so their rows check that result directly.
const takesNothing = (parsed: Parsed) => ({
	options: parsed.options,
	positionals: parsed.positionals,
});

const steps: Record<string, (parsed: Parsed) => unknown> = {
	"check:repository": repositoryOptions,
	"check:concept-css": conceptCssArguments,
	"check:agent-context": agentContextOptions,
	"context:show": contextShowMilestone,
	"handoff:new": parseHandoffArgs,
	"brief:check": parseBriefArgs,
	"main:advance": advanceOptions,
	"codex:round": codexOptions,
	"start-load": startLoadOptions,
	"map:tooling": toolingMapOptions,
	"check:tooling-map": toolingMapOptions,
	"code-health:baseline": takesNothing,
	"check:code-health": codeHealthOptions,
	"check:design-context": takesNothing,
	"check:verification-map": ownerCommandOptions,
	"verify:owner": ownerCommandOptions,
	"verify:fast": verificationOptions,
	"verify:phase": verificationOptions,
	"verify:full": verificationOptions,
	"gardener:survey": surveyOptions,
	"gardener:remove-worktree": removeWorktreeOptions,
};

function repositoryPath(value: string) {
	if (!value.startsWith(REPOSITORY_TOKEN)) return value;
	return path.resolve(repository, `.${value.slice(REPOSITORY_TOKEN.length)}`);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function defaultRun() {
	const prefix = path.join(
		process.platform === "win32" ? "D:/fitway-temp" : tmpdir(),
		"codex-round-",
	);
	return expect.stringMatching(
		new RegExp(`^${escapeRegExp(prefix)}[0-9a-f-]{36}$`),
	);
}

function expected(value: unknown): unknown {
	if (value === DEFAULT_RUN_TOKEN) return defaultRun();
	if (typeof value === "string") return repositoryPath(value);
	if (Array.isArray(value)) return value.map(expected);
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, expected(item)]),
		);
	return value;
}

function withEnvironment(environment: Row["env"], run: () => void) {
	const saved = new Map<string, string | undefined>();
	for (const [key, value] of Object.entries(environment ?? {})) {
		saved.set(key, process.env[key]);
		if (value === null) delete process.env[key];
		else process.env[key] = value;
	}
	try {
		run();
	} finally {
		for (const [key, value] of saved) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	}
}

function rowLabel(name: string, row: Row) {
	const environment = Object.entries(row.env ?? {})
		.map(([key, value]) => `${key}=${value ?? "(unset)"}`)
		.join(" ");
	return [name, ...row.args, environment && `[${environment}]`]
		.filter(Boolean)
		.join(" ");
}

describe("E1 compatibility table from the 57dad1c0 parsers", () => {
	it("has rows, or a recorded reason for none, for every registered command", () => {
		const covered = [
			...Object.keys(table.rows),
			...Object.keys(table.commandsWithoutRows),
		].sort();
		expect(covered).toEqual(TOOL_REGISTRY.map((entry) => entry.name).sort());
		for (const name of Object.keys(table.rows))
			expect(steps[name], `${name} argument step`).toBeTypeOf("function");
	});

	for (const [name, rows] of Object.entries(table.rows))
		for (const row of rows)
			it(rowLabel(name, row), () => {
				withEnvironment(row.env, () => {
					const parsed = resolveToolArguments(
						name,
						row.args.map(repositoryPath),
					);
					expect(steps[name](parsed)).toEqual(expected(row.expect));
				});
			});
});
