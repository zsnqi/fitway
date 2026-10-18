// Survey rule-home, graph, environment, and command checks.

import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { repositoryFingerprint } from "../../../scripts/repository-fingerprint.mjs";
import { calledImports, config } from "./facts.mjs";
import { defaultTempRoot, git, record, root } from "./survey-evidence.mjs";

async function ruleHomes() {
	const homes = [
		"AGENTS.md",
		"docs/WORKFLOW.md",
		"docs/agent-context/WORKING_AGREEMENTS.md",
	];
	for (const entry of await readdir(
		path.join(root, "docs/agent-context/briefs"),
	)) {
		if (entry.endsWith(".md")) homes.push(`docs/agent-context/briefs/${entry}`);
	}
	return Promise.all(homes.map((source) => record(source, "rule")));
}

async function checkGraph(scripts) {
	const calls = {};
	for (const [name, command] of Object.entries(scripts)) {
		const dependencies = new Set(
			[...command.matchAll(/\bpnpm\s+(?:run\s+)?(check[:\w-]*)/g)].map(
				(match) => match[1],
			),
		);
		const entry = command.match(/^node\s+([.\w/-]+\.mjs)(?:\s|$)/)?.[1];
		if (entry) {
			const visited = new Set();
			async function scan(file) {
				if (visited.has(file)) return;
				visited.add(file);
				const source = await readFile(path.join(root, file), "utf8");
				for (const imported of calledImports(source).filter((value) =>
					value.startsWith("."),
				)) {
					const relative = path
						.relative(root, path.resolve(root, path.dirname(file), imported))
						.replaceAll("\\", "/");
					for (const [other, script] of Object.entries(scripts)) {
						if (other !== name && script === `node ${relative}`)
							dependencies.add(other);
					}
					if (relative.endsWith(".mjs")) await scan(relative);
				}
			}
			await scan(entry);
		}
		calls[name] = [...dependencies];
	}
	return calls;
}

export const surveyPnpmEnv = {
	pnpm_config_verify_deps_before_run: "error",
	pnpm_config_manage_package_manager_versions: "false",
	pnpm_config_package_manager_strict_version: "true",
};

export function checkEnvironment(inherited, tempRoot) {
	const overrides = {
		...surveyPnpmEnv,
		GIT_OPTIONAL_LOCKS: "0",
		TEMP: tempRoot,
		TMP: tempRoot,
		NODE_COMPILE_CACHE: path.join(tempRoot, "node-compile-cache"),
	};
	const names = new Set(
		Object.keys(overrides).map((name) => name.toLowerCase()),
	);
	// Windows child environments are case insensitive; remove inherited aliases
	// before adding overrides (pnpm run exports an uppercase false preflight).
	return {
		...Object.fromEntries(
			Object.entries(inherited).filter(
				([name]) => !names.has(name.toLowerCase()),
			),
		),
		...overrides,
	};
}

function captureCheck(name, command, args, { cwd, tempRoot }) {
	try {
		const windows = process.platform === "win32";
		const result = spawnSync(
			windows ? (process.env.ComSpec ?? "C:/Windows/System32/cmd.exe") : "pnpm",
			windows
				? ["/d", "/s", "/c", "pnpm", "run", name, ...args]
				: ["run", name, ...args],
			{
				cwd,
				encoding: "utf8",
				windowsHide: true,
				timeout: 180000,
				maxBuffer: 8 * 1024 * 1024,
				env: checkEnvironment(process.env, tempRoot),
			},
		);
		return {
			name,
			command,
			exitCode: result.status,
			output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
			error: result.error?.code ?? null,
			signal: result.signal,
		};
	} catch (error) {
		return {
			name,
			command,
			exitCode: error.status ?? null,
			output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
			error: error.code ?? null,
		};
	}
}

export async function runChecks(
	scripts,
	{
		cwd = root,
		tempRoot = defaultTempRoot,
		briefs = [],
		capture = captureCheck,
		notRunChecks = config.notRunChecks ?? {},
	} = {},
) {
	const checks = [];
	const entries = Object.entries(scripts)
		.filter(([name]) => name.startsWith("check:"))
		.map(([name, command]) => ({ name, command, args: [] }));
	for (const name of Object.keys(notRunChecks)) {
		if (!entries.some((entry) => entry.name === name))
			entries.push({ name, command: scripts[name], args: [] });
	}
	for (const brief of briefs)
		entries.push({
			name: "brief:check",
			command: scripts["brief:check"],
			args: [brief.source],
			source: brief.source,
		});
	let dependencyBlocked = false;
	for (const entry of entries) {
		if (Object.hasOwn(notRunChecks, entry.name)) {
			const reason = notRunChecks[entry.name];
			if (typeof reason !== "string" || !reason.trim())
				throw new Error(
					`Not-run check ${entry.name} requires a reason in config.json`,
				);
			const defined = Object.hasOwn(scripts, entry.name);
			const output = defined
				? ""
				: `Configured not-run check ${entry.name} is not defined in package.json`;
			console.log(
				`Survey check: ${entry.name}: ${defined ? "not run" : "missing"}; ${reason}${output ? `; ${output}` : ""}`,
			);
			checks.push({
				name: entry.name,
				command: entry.command,
				checkout: cwd,
				notRun: defined,
				reason,
				exitCode: null,
				output,
				error: defined ? null : "NOT_DEFINED",
			});
			continue;
		}
		if (dependencyBlocked) continue;
		console.log(
			`Survey check: ${entry.name}${entry.source ? ` ${entry.source}` : ""}`,
		);
		const statusBefore = git(
			["status", "--porcelain=v1", "--untracked-files=all"],
			cwd,
		);
		const before = await repositoryFingerprint({ cwd });
		const result = capture(entry.name, entry.command, entry.args, {
			cwd,
			tempRoot,
		});
		const statusAfter = git(
			["status", "--porcelain=v1", "--untracked-files=all"],
			cwd,
		);
		const repositoryChanged = before !== (await repositoryFingerprint({ cwd }));
		checks.push({
			...result,
			source: entry.source,
			checkout: cwd,
			statusBefore,
			statusAfter,
			statusChanged: statusBefore !== statusAfter,
			repositoryChanged,
			dependencyBlocker: /ERR_PNPM_VERIFY_DEPS_BEFORE_RUN/.test(result.output),
			waitingForCoordinator:
				entry.name === "check:repository" &&
				/(?:Error:|FAILED_VALIDATION:) Gardener ledger date\/outcome does not match the rolling report/.test(
					result.output,
				),
		});
		dependencyBlocked = checks.at(-1).dependencyBlocker;
	}
	return checks;
}

function checkFailed(check) {
	return !check.notRun && check.exitCode !== 0;
}

export { checkFailed, checkGraph, ruleHomes };
